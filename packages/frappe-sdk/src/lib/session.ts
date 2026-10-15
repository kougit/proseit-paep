/**
 * Cookie session + CSRF (D3, ADR-011 §2.5, AC-IB4-02). The browser carries the session cookie; this module never
 * reads, parses, persists or writes it. The CSRF token from the pmra-api-v1 session method is held in this closure
 * only, sent as the Frappe CSRF header on state-changing requests, and dropped on sign-out or any failed check.
 */
import type { IdentityContext, SessionGateway, SessionOutcome, SignInRequest, SignOutResult } from '@proseit/paep-contracts';
import { adapterError, isPaepError } from './errors.js';
import { safeReturnPath, serverLoginUrl, type Navigate } from './login-redirect.js';
import { METHOD, methodMessage } from './methods.js';
import type { CsrfHeaderSource, Transport, WireResponse } from './transport.js';

const CSRF_HEADER = 'X-Frappe-CSRF-Token';
const TOKEN = /^[A-Za-z0-9]{8,256}$/;
const PRINCIPAL = /^[^\s\u0000-\u001f\u007f]{1,140}$/;
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

/** In-memory CSRF holder. Nothing here is written to any browser store, the DOM or a URL. */
export interface CsrfStore {
  readonly header: CsrfHeaderSource;
  set(token: string): void;
  clear(): void;
}

export function createCsrfStore(): CsrfStore {
  let token: string | undefined;
  return Object.freeze({
    header: () => (token === undefined ? undefined : Object.freeze({ [CSRF_HEADER]: token })),
    set: (value: string) => { token = value; },
    clear: () => { token = undefined; },
  });
}

const text = (v: unknown, max = 140): string | undefined => (typeof v === 'string' && v.length > 0 && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v) ? v : undefined);

function outcomeFor(error: unknown): SessionOutcome {
  if (!isPaepError(error)) return { status: 'invalid', error: adapterError('SERVICE_FAILURE') };
  if (error.code === 'SESSION_EXPIRED') return { status: 'expired' };
  if (error.code === 'AUTHENTICATION_REQUIRED' || error.code === 'PERMISSION_DENIED') return { status: 'unauthenticated' };
  return { status: 'invalid', error };
}

/** Parses the pmra-api-v1 session payload; anything malformed is rejected as a whole. */
function sessionPayload(message: unknown, user: string): { identity: IdentityContext; token: string; expiresAt?: string } | undefined {
  if (!message || typeof message !== 'object') return undefined;
  const m = message as Record<string, unknown>;
  const tenant = m['tenant'] && typeof m['tenant'] === 'object' ? (m['tenant'] as Record<string, unknown>) : undefined;
  const displayName = text(m['full_name']);
  const tenantId = text(tenant?.['id']);
  const tenantName = text(tenant?.['name']);
  const token = typeof m['csrf_token'] === 'string' && TOKEN.test(m['csrf_token']) ? m['csrf_token'] : undefined;
  const expires = m['expires_at'];
  if (m['user'] !== user || !displayName || !tenantId || !tenantName || !token) return undefined;
  if (expires !== undefined && expires !== null && !(typeof expires === 'string' && ISO_WITH_OFFSET.test(expires))) return undefined;
  return {
    identity: { principalId: user, displayName, tenant: { tenantId, displayName: tenantName } },
    token,
    ...(typeof expires === 'string' ? { expiresAt: expires } : {}),
  };
}

export function createSessionGateway(transport: Transport, csrf: CsrfStore, navigate: Navigate): SessionGateway {
  return Object.freeze({
    async check(): Promise<SessionOutcome> {
      let user: string;
      try {
        const who = methodMessage((await transport.send({ method: 'GET', path: METHOD.loggedUser })).body);
        if (who === 'Guest') { csrf.clear(); return { status: 'unauthenticated' }; }
        if (typeof who !== 'string' || !PRINCIPAL.test(who)) { csrf.clear(); return { status: 'invalid', error: adapterError('MALFORMED_RESPONSE') }; }
        user = who;
        let response: WireResponse;
        try {
          response = await transport.send({ method: 'GET', path: METHOD.session });
        } catch (e) {
          // The user is signed in (the step above returned them): a denial here is a backend permission problem, not a
          // missing session, so it is reported as invalid instead of sending the user to a login that returns at once.
          if (isPaepError(e) && e.code === 'PERMISSION_DENIED') { csrf.clear(); return { status: 'invalid', error: e }; }
          throw e;
        }
        const payload = sessionPayload(methodMessage(response.body), user);
        if (!payload) { csrf.clear(); return { status: 'invalid', error: adapterError('MALFORMED_RESPONSE', response.correlationId) }; }
        csrf.set(payload.token);
        return { status: 'authenticated', identity: payload.identity, ...(payload.expiresAt ? { expiresAt: payload.expiresAt } : {}) };
      } catch (e) {
        csrf.clear();
        return outcomeFor(e);
      }
    },

    async signOut(): Promise<SignOutResult> {
      // Server-authoritative: success is reported only on a server success. The token is cleared once the session is
      // gone (success, or the server says it is no longer authenticated); after any other failure it is kept, so the
      // retryable error can actually be retried.
      try {
        const response = await transport.send({ method: 'POST', path: METHOD.logout });
        csrf.clear();
        return { outcome: { status: 'unauthenticated' }, correlationId: response.correlationId };
      } catch (e) {
        if (!isPaepError(e) || e.category === 'authentication') csrf.clear();
        throw e;
      }
    },

    async beginSignIn(request: SignInRequest): Promise<void> {
      const returnPath = request.returnPath ?? '/';
      if (!safeReturnPath(returnPath)) throw adapterError('RETURN_PATH_REJECTED');
      csrf.clear();
      navigate(serverLoginUrl(transport.origin, returnPath));
    },
  });
}
