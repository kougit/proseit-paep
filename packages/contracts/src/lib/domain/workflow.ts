import type { EntityId, MessageKey } from '../core/ids.js';
import type { ConcurrencyMetadata, IdempotencyKey } from '../core/concurrency.js';

/** Backend-derived allowed action; the UI never infers approval authority (PAEP v1.1 §11 segregation of duties). */
export interface WorkflowAction {
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly requiresReason?: boolean;
  readonly requiresEvidence?: boolean;
}

/** Current workflow state plus the actions the server allows (PAEP v1.1 §10.1 "Workflow"). */
export interface WorkflowState {
  readonly stateKey: string;
  readonly labelKey: MessageKey;
  readonly allowedActions: readonly WorkflowAction[];
  readonly concurrency?: ConcurrencyMetadata;
}

/** Governed transition request; a protected write, so it carries a concurrency token (PAEP-IB-01 §7.3). */
export interface WorkflowTransitionRequest {
  readonly recordId: EntityId;
  readonly actionId: string;
  readonly reason?: string;
  readonly evidenceFileIds?: readonly EntityId[];
  readonly concurrency: ConcurrencyMetadata;
  readonly idempotencyKey?: IdempotencyKey;
}
