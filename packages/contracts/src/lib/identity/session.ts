import type { CorrelationId } from '../core/ids.js';
import type { SessionOutcome } from './identity-context.js';

/** Result of a server-authoritative sign-out: the session outcome the server reports afterwards. */
export interface SignOutResult {
  readonly outcome: SessionOutcome;
  readonly correlationId?: CorrelationId;
}

/** Start of the server-hosted sign-in. returnPath is an application-relative path; the adapter accepts nothing else. */
export interface SignInRequest {
  readonly returnPath?: string;
}

/** Session port implemented by identity adapters (PAEP v1.1 §10.1 "Session"); the server remains authoritative. */
export interface SessionGateway {
  check(): Promise<SessionOutcome>;
  signOut(): Promise<SignOutResult>;
  beginSignIn(request: SignInRequest): Promise<void>;
}
