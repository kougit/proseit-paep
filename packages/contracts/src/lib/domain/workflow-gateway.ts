import type { ConcurrencyMetadata } from '../core/concurrency.js';
import type { CorrelationId } from '../core/ids.js';
import type { RecordRef, RecordTypeKey } from './records.js';
import type { WorkflowState, WorkflowTransitionRequest } from './workflow.js';

/** The server's state after an accepted transition, with the new concurrency token. */
export interface WorkflowTransitionResult {
  readonly state: WorkflowState;
  readonly concurrency: ConcurrencyMetadata;
  readonly correlationId?: CorrelationId;
}

/**
 * Workflow port (PAEP v1.1 §10.1 "Workflow"): allowed actions come from the server, and the server decides every
 * transition. The request names the record (recordId) within the given record type; rejections carry a PaepError.
 */
export interface WorkflowGateway {
  getState(ref: RecordRef): Promise<WorkflowState>;
  transition(recordType: RecordTypeKey, request: WorkflowTransitionRequest): Promise<WorkflowTransitionResult>;
}
