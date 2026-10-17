/** Request correlation (ADR-011 §2.7, AC-IB4-10). Ids match the observability report format, so reports keep them. */
import type { CorrelationId } from '@proseit/paep-contracts';

const WELL_FORMED = /^[A-Za-z0-9_-]{8,64}$/;
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789';

/** "REQ-" + 16 base-32 characters from the platform's cryptographic random source. */
export function createRequestId(random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = (b) => globalThis.crypto.getRandomValues(b)): CorrelationId {
  const bytes = random(new Uint8Array(16));
  return `REQ-${[...bytes].map((b) => ALPHABET[b % 32]).join('')}`;
}

/** A server-returned correlation id replaces the request id only when it is well formed. */
export function chooseCorrelationId(server: string | null, request: CorrelationId): CorrelationId {
  return server !== null && WELL_FORMED.test(server) ? server : request;
}
