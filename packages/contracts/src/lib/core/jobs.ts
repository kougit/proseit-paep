import type { CorrelationId, EntityId } from './ids.js';
import type { PaepError } from './errors.js';

/** Long-running job lifecycle (PAEP-IB-01 §7.1(v), Appendix D). */
export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'expired';

/** Job/status contract used instead of a blocking browser request (PAEP-IB-01 §7.1(v); PAEP v1.1 §13). progress is 0-100. */
export interface JobStatus {
  readonly id: EntityId;
  readonly status: JobState;
  readonly progress?: number;
  readonly correlationId?: CorrelationId;
  readonly error?: PaepError;
}
