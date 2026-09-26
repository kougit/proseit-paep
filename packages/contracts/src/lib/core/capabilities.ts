import type { MessageKey } from './ids.js';

/** Server-derived capability identifier; client flags never create authority (PAEP-IB-01 §7.3). */
export type CapabilityId = string;

/** Discovered capability (PAEP-IR-01 Code Block 4). reasonKey explains a locked or edition state (PAEP v1.1 §11); it grants nothing. */
export interface Capability {
  readonly id: CapabilityId;
  readonly enabled: boolean;
  readonly reasonKey?: MessageKey;
}
