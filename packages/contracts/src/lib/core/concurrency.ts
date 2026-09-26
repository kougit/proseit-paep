/** Concurrency token for protected writes (PAEP-IR-01 Code Block 3; PAEP-IB-01 §7.3). */
export interface ConcurrencyMetadata {
  readonly etag?: string;
  readonly serverVersion?: string;
}

/** Client-generated operation key for replay-safe commands where duplicates would have business effect (PAEP-IB-01 §7.1(vi), §7.3). */
export type IdempotencyKey = string;
