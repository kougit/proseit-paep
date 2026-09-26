import type { CorrelationId, EntityId, IsoDateTime } from '../core/ids.js';
import type { ConcurrencyMetadata, IdempotencyKey } from '../core/concurrency.js';
import type { PrincipalId, TenantId } from '../identity/identity-context.js';

/*
 * Future offline command envelope and conflict metadata (PAEP-IR-01 §5.2; PAEP-IB-01 §7.1(vi), §7.2 "offline").
 * Types only: the offline queue itself belongs to a later milestone.
 */

/** Command synchronisation state. */
export type CommandSyncState = 'local-draft' | 'queued' | 'synced' | 'conflict' | 'failed';

/** Tenant and principal partition of a queued command. */
export interface CommandContext {
  readonly tenantId: TenantId;
  readonly principalId: PrincipalId;
}

/** Immutable queued-command envelope; the payload must be JSON-serialisable. */
export interface OfflineCommandEnvelope<TPayload> {
  readonly commandType: string;
  readonly idempotencyKey: IdempotencyKey;
  readonly context: CommandContext;
  readonly createdAt: IsoDateTime;
  readonly payload: TPayload;
  readonly concurrency?: ConcurrencyMetadata;
  readonly clientIds?: readonly EntityId[];
}

/** A conflict keeps both the attempted change and the server state. */
export interface CommandConflict<TPayload, TServerState> {
  readonly attempted: OfflineCommandEnvelope<TPayload>;
  readonly serverState: TServerState;
  readonly serverConcurrency?: ConcurrencyMetadata;
  readonly correlationId?: CorrelationId;
}
