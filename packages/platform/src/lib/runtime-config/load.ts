import type { RuntimeConfigBuildContext, RuntimeConfigErrorCode, RuntimeConfigOutcome } from '@proseit/paep-contracts';
import { MAX_RUNTIME_CONFIG_BYTES } from './constants.js';
import type { RuntimeConfigEnvironment } from './semantic.js';
import { runtimeConfigFailure, validateRuntimeConfigBytes } from './validate.js';

/** The part of the Fetch API the loader needs, declared structurally so this module stays free of DOM types. */
export interface RuntimeConfigFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly redirected: boolean;
  readonly url: string;
  readonly headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}
export type RuntimeConfigFetch = (url: string, init: {
  readonly method: 'GET';
  readonly cache: 'no-store';
  readonly credentials: 'same-origin';
  readonly redirect: 'error';
  readonly mode: 'same-origin';
}) => Promise<RuntimeConfigFetchResponse>;

export interface RuntimeConfigLoadOptions extends RuntimeConfigEnvironment {
  readonly fetch: RuntimeConfigFetch;
  /** Absolute URL of the configuration document, resolved against the document base URI. */
  readonly configUrl: string;
}

const loadFailure = (code: RuntimeConfigErrorCode): RuntimeConfigOutcome => runtimeConfigFailure('load', [{ stage: 'load', code, path: '' }]);

/**
 * Fetch and validate the runtime configuration (PAEP-IB-01 §9.1-9.2). Same-origin, uncached, no redirects, JSON content type,
 * bounded size. Every failure, including a thrown or rejected fetch, returns the fail-safe state; this function never rejects.
 */
export async function loadRuntimeConfig(context: RuntimeConfigBuildContext, options: RuntimeConfigLoadOptions): Promise<RuntimeConfigOutcome> {
  let response: RuntimeConfigFetchResponse;
  try {
    response = await options.fetch(options.configUrl, { method: 'GET', cache: 'no-store', credentials: 'same-origin', redirect: 'error', mode: 'same-origin' });
  } catch {
    return loadFailure('CFG_LOAD_NETWORK');
  }
  try {
    if (response.redirected || (response.url !== '' && response.url !== options.configUrl)) return loadFailure('CFG_LOAD_REDIRECT');
    if (response.status !== 200 || !response.ok) return loadFailure('CFG_LOAD_STATUS');
    const type = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!/^application\/json\s*(;|$)/.test(type)) return loadFailure('CFG_LOAD_CONTENT_TYPE');
    const declared = Number(response.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > MAX_RUNTIME_CONFIG_BYTES) return loadFailure('CFG_LOAD_TOO_LARGE');
    const bytes = new Uint8Array(await response.arrayBuffer());
    return validateRuntimeConfigBytes(bytes, context, { ...(options.documentBasePath === undefined ? {} : { documentBasePath: options.documentBasePath }) });
  } catch {
    return loadFailure('CFG_LOAD_NETWORK');
  }
}
