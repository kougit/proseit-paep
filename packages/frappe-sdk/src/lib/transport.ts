/**
 * Framework-neutral transport (ADR-011 §2.11, D3/D4). An injectable fetch, credentialed requests to the configured
 * backend origin only, the CSRF header on every state-changing request (fail closed without one), a correlation id on
 * every request, a bounded retry of retryable failures that keeps a write's idempotency key, and no redirects.
 */
import type { CorrelationId, IdempotencyKey, PaepError } from '@proseit/paep-contracts';
import { chooseCorrelationId } from './correlation.js';
import { adapterError, errorFromResponse, isPaepError } from './errors.js';

/** The response surface the adapter reads (a subset of the Fetch API Response). */
export interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}

/** The request options the adapter sends (a subset of the Fetch API RequestInit). */
export interface FetchInitLike {
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly credentials: 'include';
  readonly redirect: 'error';
  readonly cache: 'no-store';
  readonly signal: AbortSignal;
}

/** Injectable fetch: the browser's own fetch in the application, a recorded-fixture double in CI. */
export type FetchLike = (url: string, init: FetchInitLike) => Promise<FetchResponseLike>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface WireRequest {
  readonly method: HttpMethod;
  /** Absolute path below the backend origin, starting with /api/. */
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly idempotencyKey?: IdempotencyKey;
}

export interface WireResponse {
  readonly status: number;
  readonly body: unknown;
  readonly correlationId: CorrelationId;
}

export interface Transport {
  readonly origin: string;
  send(request: WireRequest): Promise<WireResponse>;
}

/** Source of the CSRF header for state-changing requests; undefined means no token is held. */
export type CsrfHeaderSource = () => Readonly<Record<string, string>> | undefined;

export interface TransportOptions {
  readonly origin: string;
  readonly fetch: FetchLike;
  readonly csrf: CsrfHeaderSource;
  readonly newId: () => CorrelationId;
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly timeoutMs: number;
  readonly sleep: (ms: number) => Promise<void>;
}

const STATE_CHANGING = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE']);
/** A header-safe idempotency key: 1-128 letters, digits and "_ . : -". */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{1,128}$/;
/** Upper bounds the configuration cannot exceed. */
export const MAX_ATTEMPTS_LIMIT = 5;
export const TIMEOUT_LIMIT_MS = 60_000;

/** Validates the configured backend origin: HTTPS (loopback HTTP only), no credentials, path, query or fragment. */
export function backendOrigin(value: string): string | undefined {
  let url: URL;
  try { url = new URL(value); } catch { return undefined; }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!(url.protocol === 'https:' || (url.protocol === 'http:' && loopback))) return undefined;
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) return undefined;
  return url.origin;
}

export function createTransport(o: TransportOptions): Transport {
  const target = (path: string, query?: Readonly<Record<string, string>>): string | undefined => {
    if (!path.startsWith('/api/') || path.includes('//') || /(^|\/)\.\.?(\/|$)/.test(path) || /[\\\s]/.test(path)) return undefined;
    const url = new URL(path, o.origin);
    if (url.origin !== o.origin) return undefined;
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    return url.href;
  };

  async function attempt(url: string, init: Omit<FetchInitLike, 'signal'>, requestId: CorrelationId): Promise<WireResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), o.timeoutMs);
    let response: FetchResponseLike;
    let text: string;
    try {
      response = await o.fetch(url, { ...init, signal: controller.signal });
      text = await response.text();
    } catch {
      throw adapterError(controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_UNAVAILABLE', requestId);
    } finally {
      clearTimeout(timer);
    }
    const correlationId = chooseCorrelationId(response.headers.get('X-Correlation-Id'), requestId);
    let body: unknown = null;
    let parsed = true;
    if (text.length) { try { body = JSON.parse(text); } catch { parsed = false; } }
    if (!response.ok) throw errorFromResponse(response.status, parsed ? body : null, correlationId);
    if (!parsed) throw adapterError('MALFORMED_RESPONSE', correlationId);
    return { status: response.status, body, correlationId };
  }

  return Object.freeze({
    origin: o.origin,
    async send(request: WireRequest): Promise<WireResponse> {
      const requestId = o.newId();
      const url = target(request.path, request.query);
      if (!url) throw adapterError('INVALID_REFERENCE', requestId);
      const headers: Record<string, string> = { Accept: 'application/json', 'X-Correlation-Id': requestId };
      const stateChanging = STATE_CHANGING.has(request.method);
      if (stateChanging) {
        const csrf = o.csrf();
        if (!csrf) throw adapterError('CSRF_TOKEN_MISSING', requestId);
        Object.assign(headers, csrf);
      }
      if (request.idempotencyKey !== undefined) {
        if (!IDEMPOTENCY_KEY.test(request.idempotencyKey)) throw adapterError('INVALID_REFERENCE', requestId);
        headers['X-Idempotency-Key'] = request.idempotencyKey;
      }
      if (request.body !== undefined) headers['Content-Type'] = 'application/json';
      const init = {
        method: request.method, headers, credentials: 'include', redirect: 'error', cache: 'no-store',
        ...(request.body !== undefined ? { body: JSON.stringify(request.body) } : {}),
      } as const;
      // A state-changing request is retried only when it carries an idempotency key, which every retry keeps, and only
      // after a rate-limit refusal (the server did not process it). A timeout, network failure or 5xx after a write may
      // follow a committed change, and stock Frappe does not de-duplicate by key, so it is returned to the caller.
      const attempts = stateChanging && request.idempotencyKey === undefined ? 1 : o.maxAttempts;
      const mayRetry = (error: PaepError): boolean => error.retryable && (!stateChanging || error.code === 'RATE_LIMITED');
      for (let n = 1; ; n += 1) {
        try {
          return await attempt(url, init, requestId);
        } catch (e) {
          const error: PaepError = isPaepError(e) ? e : adapterError('SERVICE_FAILURE', requestId);
          if (!mayRetry(error) || n >= attempts) throw error;
          await o.sleep(o.baseDelayMs * 2 ** (n - 1));
        }
      }
    },
  });
}
