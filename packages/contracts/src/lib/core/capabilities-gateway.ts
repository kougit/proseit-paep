import type { Capability } from './capabilities.js';
import type { IsoDateTime } from './ids.js';

/** Capabilities the server reports for a scope at one time; client flags never create authority (PAEP-IB-01 §7.3). */
export interface CapabilitySet {
  readonly capabilities: readonly Capability[];
  readonly evaluatedAt: IsoDateTime;
}

/** Capability discovery port. A scope is a semantic record type key; absent means application-wide. */
export interface CapabilitiesGateway {
  discover(scope?: string): Promise<CapabilitySet>;
}
