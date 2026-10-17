/**
 * PaepError normalisation (ADR-011 §2.7, AC-IB4-06). The only adapter file that reads a Frappe error field: it uses
 * the HTTP status and the exc_type class name, and never surfaces server prose, tracebacks or message lists.
 */
import type { CorrelationId, PaepError, PaepErrorCategory } from '@proseit/paep-contracts';

/** Controlled error codes the adapter emits. */
export type FrappeAdapterErrorCode =
  | 'AUTHENTICATION_REQUIRED' | 'SESSION_EXPIRED' | 'CSRF_TOKEN_MISSING' | 'CSRF_REJECTED'
  | 'PERMISSION_DENIED' | 'WORKFLOW_ACTION_NOT_ALLOWED' | 'FILE_NOT_ATTACHED'
  | 'NOT_FOUND' | 'VALIDATION_FAILED' | 'UNKNOWN_RESOURCE' | 'UNKNOWN_FIELD' | 'UNSUPPORTED_OPERATOR' | 'INVALID_QUERY'
  | 'INVALID_CURSOR' | 'INVALID_REFERENCE' | 'RETURN_PATH_REJECTED' | 'WORKFLOW_UNSUPPORTED' | 'WORKFLOW_UNSUPPORTED_INPUT'
  | 'CONCURRENCY_TOKEN_MISSING' | 'FILES_UNSUPPORTED' | 'FILE_URL_REJECTED'
  | 'RECORD_CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE' | 'SERVICE_FAILURE' | 'NETWORK_UNAVAILABLE' | 'REQUEST_TIMEOUT' | 'MALFORMED_RESPONSE'
  | 'BACKEND_INCOMPATIBLE' | 'BACKEND_COMPATIBILITY_UNKNOWN';

const CATEGORY: Readonly<Record<FrappeAdapterErrorCode, PaepErrorCategory>> = {
  AUTHENTICATION_REQUIRED: 'authentication', SESSION_EXPIRED: 'authentication', CSRF_TOKEN_MISSING: 'authentication', CSRF_REJECTED: 'authentication',
  PERMISSION_DENIED: 'authorization', WORKFLOW_ACTION_NOT_ALLOWED: 'authorization', FILE_NOT_ATTACHED: 'authorization',
  NOT_FOUND: 'validation', VALIDATION_FAILED: 'validation', UNKNOWN_RESOURCE: 'validation', UNKNOWN_FIELD: 'validation',
  UNSUPPORTED_OPERATOR: 'validation', INVALID_QUERY: 'validation', INVALID_CURSOR: 'validation', INVALID_REFERENCE: 'validation',
  RETURN_PATH_REJECTED: 'validation', WORKFLOW_UNSUPPORTED: 'validation', WORKFLOW_UNSUPPORTED_INPUT: 'validation',
  CONCURRENCY_TOKEN_MISSING: 'validation', FILES_UNSUPPORTED: 'validation', FILE_URL_REJECTED: 'validation',
  RECORD_CONFLICT: 'conflict',
  RATE_LIMITED: 'rate-limit',
  SERVICE_UNAVAILABLE: 'service-failure', SERVICE_FAILURE: 'service-failure', NETWORK_UNAVAILABLE: 'service-failure',
  REQUEST_TIMEOUT: 'service-failure', MALFORMED_RESPONSE: 'service-failure', BACKEND_INCOMPATIBLE: 'service-failure',
  BACKEND_COMPATIBILITY_UNKNOWN: 'service-failure',
};
const RETRYABLE = new Set<FrappeAdapterErrorCode>(['RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'NETWORK_UNAVAILABLE', 'REQUEST_TIMEOUT', 'BACKEND_COMPATIBILITY_UNKNOWN']);

/** Builds a frozen PaepError. The message key is one controlled key per category; no server text is ever copied. */
export function adapterError(code: FrappeAdapterErrorCode, correlationId?: CorrelationId): PaepError {
  const category = CATEGORY[code];
  return Object.freeze({ code, category, messageKey: `paep.errors.${category}`, retryable: RETRYABLE.has(code), ...(correlationId ? { correlationId } : {}) });
}

/** True for a PaepError produced by this adapter (rejections of every port carry one). */
export function isPaepError(value: unknown): value is PaepError {
  if (!value || typeof value !== 'object') return false;
  const v = value as { code?: unknown; category?: unknown; messageKey?: unknown; retryable?: unknown };
  return typeof v.code === 'string' && v.code in CATEGORY && typeof v.category === 'string' && typeof v.messageKey === 'string' && typeof v.retryable === 'boolean';
}

/** Frappe exception class names the adapter recognises (the class name only; never the message). */
const BY_EXCEPTION: Readonly<Record<string, FrappeAdapterErrorCode>> = {
  AuthenticationError: 'AUTHENTICATION_REQUIRED',
  SessionExpired: 'SESSION_EXPIRED',
  CSRFTokenError: 'CSRF_REJECTED',
  PermissionError: 'PERMISSION_DENIED',
  WorkflowTransitionError: 'WORKFLOW_ACTION_NOT_ALLOWED',
  WorkflowPermissionError: 'WORKFLOW_ACTION_NOT_ALLOWED',
  DoesNotExistError: 'NOT_FOUND',
  TimestampMismatchError: 'RECORD_CONFLICT',
  ValidationError: 'VALIDATION_FAILED',
  MandatoryError: 'VALIDATION_FAILED',
  LinkValidationError: 'VALIDATION_FAILED',
  DuplicateEntryError: 'VALIDATION_FAILED',
  InvalidStatusError: 'VALIDATION_FAILED',
  RateLimitExceededError: 'RATE_LIMITED',
  TooManyRequestsError: 'RATE_LIMITED',
};

function byStatus(status: number): FrappeAdapterErrorCode {
  if (status === 401) return 'AUTHENTICATION_REQUIRED';
  if (status === 403) return 'PERMISSION_DENIED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'RECORD_CONFLICT';
  if (status === 400 || status === 417 || status === 422) return 'VALIDATION_FAILED';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 502 || status === 503 || status === 504) return 'SERVICE_UNAVAILABLE';
  return 'SERVICE_FAILURE';
}

/** Maps a failed HTTP response to a PaepError from its status and, when well formed, its exc_type class name. */
export function errorFromResponse(status: number, body: unknown, correlationId: CorrelationId): PaepError {
  const excType = body && typeof body === 'object' ? (body as { exc_type?: unknown }).exc_type : undefined;
  const known = typeof excType === 'string' && /^[A-Za-z]{1,64}$/.test(excType) && Object.hasOwn(BY_EXCEPTION, excType) ? BY_EXCEPTION[excType] : undefined;
  return adapterError(known ?? byStatus(status), correlationId);
}
