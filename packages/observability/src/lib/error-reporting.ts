/**
 * Error reporting and correlation seam (IB3, HOF-IB3-001 SCR-SHELL-013). Framework-neutral. A report carries only an
 * allowlisted, bounded set of fields: no message text, no stack, no URL query or fragment, no user data. Every report
 * gets a correlation reference the UI can show; a server correlation id is reused when it is well formed.
 */

/** What failed, as the shell distinguishes it. */
export type PaepErrorKind = 'render' | 'route-load' | 'version' | 'unknown';

export const PAEP_ERROR_KINDS: readonly PaepErrorKind[] = ['render', 'route-load', 'version', 'unknown'];

/** The only data a report may carry. */
export interface PaepErrorReport {
  readonly kind: PaepErrorKind;
  /** Correlation reference shown to the user ("Reference ..."). */
  readonly correlationId: string;
  /** Route path only (no query or fragment), at most 200 characters; absent when not safe. */
  readonly route?: string;
  /** Whether the shell offers "Try again". */
  readonly retryable: boolean;
  /** ISO 8601 time of the report. */
  readonly at: string;
}

/** Raw input from the caller; `sanitizeErrorReport` keeps only the allowlisted, validated part. */
export interface PaepErrorReportInput {
  readonly kind?: unknown;
  readonly correlationId?: unknown;
  readonly route?: unknown;
  readonly retryable?: unknown;
}

/** Receives sanitised reports. Implementations must not add fields from the original error. */
export interface PaepErrorReporter {
  report(report: PaepErrorReport): void;
}

/** A well-formed correlation id: 8-64 characters of letters, digits, "-" and "_" (no PII-shaped free text). */
const CORRELATION = /^[A-Za-z0-9_-]{8,64}$/;
const ROUTE = /^\/[A-Za-z0-9\-._~/%]{0,199}$/;

/** A random reference "ERR-" + 12 base-32 characters, from the platform's cryptographic random source. */
export function createCorrelationId(random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = (b) => globalThis.crypto.getRandomValues(b)): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789';
  const bytes = random(new Uint8Array(12));
  return `ERR-${[...bytes].map((b) => alphabet[b % 32]).join('')}`;
}

/** Path part of a route: drops the query and fragment, rejects anything that is not a plain internal path. */
export function safeRoutePath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const path = value.split(/[?#]/)[0];
  return ROUTE.test(path) && !path.startsWith('//') ? path : undefined;
}

/** Builds the allowlisted report from raw input. Unknown kinds become `unknown`; a bad correlation id is replaced. */
export function sanitizeErrorReport(input: PaepErrorReportInput, now: () => Date = () => new Date(), newId: () => string = createCorrelationId): PaepErrorReport {
  const kind = PAEP_ERROR_KINDS.includes(input.kind as PaepErrorKind) ? (input.kind as PaepErrorKind) : 'unknown';
  const correlationId = typeof input.correlationId === 'string' && CORRELATION.test(input.correlationId) ? input.correlationId : newId();
  const route = safeRoutePath(input.route);
  return Object.freeze({ kind, correlationId, ...(route ? { route } : {}), retryable: input.retryable === true, at: now().toISOString() });
}

/** Safe default: keeps nothing beyond the allowlisted report and writes one console line with kind and reference. */
export function consoleErrorReporter(sink: { error(...args: unknown[]): void } = console): PaepErrorReporter {
  return { report: (r) => sink.error(`PAEP error ${r.kind} (${r.correlationId})`) };
}
