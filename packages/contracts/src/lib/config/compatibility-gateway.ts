import type { PaepErrorCode } from '../core/errors.js';
import type { CorrelationId } from '../core/ids.js';
import type { CompatibilityReport } from './compatibility.js';

/** A backend that is known to be incompatible, or whose compatibility cannot be verified: protected integration stays blocked. */
export interface BlockedCompatibility {
  readonly status: 'incompatible' | 'unknown';
  readonly apiContract: string;
  readonly code: PaepErrorCode;
  readonly correlationId?: CorrelationId;
}

/** Outcome of the backend compatibility check (IB4 D10): compatible proceeds; anything else blocks. */
export type CompatibilityCheckResult = CompatibilityReport | BlockedCompatibility;

/** Backend compatibility port. An adapter fails safe: an unverifiable answer is 'unknown', never compatible. */
export interface CompatibilityGateway {
  check(): Promise<CompatibilityCheckResult>;
}
