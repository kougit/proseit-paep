import type { CorrelationId, MessageKey } from './ids.js';

/** Error categories every adapter maps to (PAEP v1.1 §10.1 "Errors"). */
export type PaepErrorCategory = 'authentication' | 'authorization' | 'validation' | 'conflict' | 'rate-limit' | 'service-failure';

/** Controlled machine-readable error code; the vocabulary is governed by adapters and product APIs. */
export type PaepErrorCode = string;

/** Structured error: code + messageKey + optional fieldErrors + correlationId + retryable flag (PAEP-IR-01 Code Block 3; PAEP-IB-01 §7.3). */
export interface PaepError {
  readonly code: PaepErrorCode;
  readonly category: PaepErrorCategory;
  readonly messageKey: MessageKey;
  readonly correlationId?: CorrelationId;
  readonly retryable: boolean;
  /** Message keys per semantic field key. The keys are the failing record's own field set, so a record map is the model. */
  readonly fieldErrors?: Readonly<Record<string, readonly MessageKey[]>>;
}
