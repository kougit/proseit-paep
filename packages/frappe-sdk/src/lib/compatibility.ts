/**
 * pmra-api-v1 compatibility check (D10, ADR-011 §2.12, AC-IB4-09). Fail safe: compatible → protected integration may
 * proceed; known incompatible → blocked; unknown or unverifiable → blocked and surfaced. Never throws.
 */
import type { CompatibilityCheckResult, CompatibilityGateway, PaepVersion } from '@proseit/paep-contracts';
import { adapterError, isPaepError } from './errors.js';
import { METHOD, methodMessage } from './methods.js';
import type { Transport } from './transport.js';

/** The only backend contract this adapter implements. */
export const SUPPORTED_API_CONTRACT = 'pmra-api-v1';
/** The PAEP compatibility line this adapter build conforms to. */
export const ADAPTER_PAEP_VERSION: PaepVersion = '1.1';

const VERSION = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;
const parse = (v: string): readonly [number, number] => { const [a, b] = v.split('.'); return [Number(a), Number(b)]; };
const compare = (a: string, b: string): number => { const [x1, y1] = parse(a); const [x2, y2] = parse(b); return x1 - x2 || y1 - y2; };

export function createCompatibilityGateway(transport: Transport, configuredContract: string, schemaVersion: string): CompatibilityGateway {
  return Object.freeze({
    async check(): Promise<CompatibilityCheckResult> {
      if (configuredContract !== SUPPORTED_API_CONTRACT) {
        const e = adapterError('BACKEND_INCOMPATIBLE');
        return Object.freeze({ status: 'incompatible', apiContract: configuredContract, code: e.code });
      }
      let message: unknown;
      let correlationId: string | undefined;
      try {
        const response = await transport.send({ method: 'GET', path: METHOD.compatibility });
        message = methodMessage(response.body);
        correlationId = response.correlationId;
      } catch (e) {
        const id = isPaepError(e) ? e.correlationId : undefined;
        return Object.freeze({ status: 'unknown', apiContract: configuredContract, code: adapterError('BACKEND_COMPATIBILITY_UNKNOWN').code, ...(id ? { correlationId: id } : {}) });
      }
      const m = message && typeof message === 'object' ? (message as Record<string, unknown>) : undefined;
      const contract = m?.['api_contract'];
      const min = m?.['minimum_paep'];
      const max = m?.['maximum_paep'];
      const cid = correlationId ? { correlationId } : {};
      if (typeof contract !== 'string' || typeof min !== 'string' || !VERSION.test(min) || !(max === null || (typeof max === 'string' && VERSION.test(max)))) {
        return Object.freeze({ status: 'unknown', apiContract: configuredContract, code: adapterError('BACKEND_COMPATIBILITY_UNKNOWN').code, ...cid });
      }
      const inRange = compare(min, ADAPTER_PAEP_VERSION) <= 0 && (max === null || compare(ADAPTER_PAEP_VERSION, max) <= 0);
      if (contract !== configuredContract || !inRange) {
        return Object.freeze({ status: 'incompatible', apiContract: configuredContract, code: adapterError('BACKEND_INCOMPATIBLE').code, ...cid });
      }
      return Object.freeze({ status: 'compatible', schemaVersion, apiContract: contract, paepVersion: ADAPTER_PAEP_VERSION, minimumPaep: min, maximumPaep: max });
    },
  });
}

/** Gate for the protected ports: resolves once the backend is verified compatible; otherwise rejects with a PaepError. */
export function compatibilityGate(gateway: CompatibilityGateway): () => Promise<void> {
  let verified = false;
  let pending: Promise<void> | undefined;
  return () => {
    if (verified) return Promise.resolve();
    pending ??= gateway.check().then((result) => {
      pending = undefined;
      if (result.status === 'compatible') { verified = true; return; }
      throw adapterError(result.status === 'incompatible' ? 'BACKEND_INCOMPATIBLE' : 'BACKEND_COMPATIBILITY_UNKNOWN', result.correlationId);
    });
    return pending;
  };
}
