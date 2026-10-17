/**
 * Capability discovery (PAEP-IB-01 §7.3): the server's capability list for the current session, from the pmra-api-v1
 * session method. A scope narrows the list to one record type's capabilities ("<recordType>.<capability>"). The
 * adapter never creates or widens a capability.
 */
import type { Capability, CapabilitiesGateway, CapabilitySet } from '@proseit/paep-contracts';
import { adapterError } from './errors.js';
import { METHOD, methodMessage } from './methods.js';
import type { ResourceLookup } from './records.js';
import type { Transport } from './transport.js';

const CAPABILITY_ID = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+){0,7}$/;
const MAX_CAPABILITIES = 500;

export function createCapabilitiesGateway(transport: Transport, lookup: ResourceLookup, ready: () => Promise<void>, now: () => Date): CapabilitiesGateway {
  return Object.freeze({
    async discover(scope?: string): Promise<CapabilitySet> {
      if (scope !== undefined) lookup(scope);
      await ready();
      const response = await transport.send({ method: 'GET', path: METHOD.session });
      const message = methodMessage(response.body);
      const list = message && typeof message === 'object' ? (message as { capabilities?: unknown }).capabilities : undefined;
      if (!Array.isArray(list) || list.length > MAX_CAPABILITIES) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      const capabilities: Capability[] = [];
      for (const item of list) {
        const c = item && typeof item === 'object' ? (item as { id?: unknown; enabled?: unknown }) : {};
        if (typeof c.id !== 'string' || c.id.length > 128 || !CAPABILITY_ID.test(c.id) || typeof c.enabled !== 'boolean') throw adapterError('MALFORMED_RESPONSE', response.correlationId);
        if (scope === undefined || c.id.startsWith(`${scope}.`)) capabilities.push(Object.freeze({ id: c.id, enabled: c.enabled }));
      }
      return Object.freeze({ capabilities: Object.freeze(capabilities), evaluatedAt: now().toISOString() });
    },
  });
}
