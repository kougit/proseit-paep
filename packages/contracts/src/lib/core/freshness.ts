import type { EntityId, IsoDateTime } from './ids.js';

/** What a freshness signal is about: all records of a type, or one record. */
export interface FreshnessScope {
  readonly kind: 'record-type' | 'record';
  /** Semantic record-type key, as in the records port; never a backend type name. */
  readonly recordType: string;
  readonly id?: EntityId;
}

/** Why the consumer must reconcile: the server's data changed, or freshness could not be followed and is resumed. */
export type InvalidationReason = 'changed' | 'resync';

/** Opaque position in the server's change stream; only the adapter that issued it interprets it. */
export type FreshnessCursor = string;

/**
 * Invalidation hint (PAEP v1.1 §10.1 "Realtime"; IB4 D4). It carries no field value: a consumer that receives it
 * re-reads through an authoritative gateway and never applies the signal as data.
 */
export interface InvalidationSignal {
  readonly scope: FreshnessScope;
  readonly reason: InvalidationReason;
  readonly observedAt: IsoDateTime;
}

/** One bounded freshness poll for the given scopes, from the cursor the previous poll returned. */
export interface FreshnessPollRequest {
  readonly scopes: readonly FreshnessScope[];
  readonly cursor?: FreshnessCursor;
}

/** Signals since the request cursor, and the cursor for the next poll. The first poll of a scope sets its baseline only. */
export interface FreshnessBatch {
  readonly signals: readonly InvalidationSignal[];
  readonly cursor: FreshnessCursor;
}

/** Vendor-neutral freshness port: a pull per bounded poll, independent of how the adapter learns of changes. */
export interface FreshnessGateway {
  poll(request: FreshnessPollRequest): Promise<FreshnessBatch>;
}
