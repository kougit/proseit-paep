import type { IdentityContext, PaepError, SessionOutcome } from '@proseit/paep-contracts';
import { deepFreeze, jsonClone } from './deep-freeze.js';
import type { DeepPartial } from './runtime-config-store.js';

/** Product-neutral identity used by authenticated session fixtures. */
export const TEST_IDENTITY: IdentityContext = deepFreeze({
  principalId: 'test-principal-0001',
  displayName: 'Test User',
  tenant: { tenantId: 'test-tenant-0001', displayName: 'Test Tenant' }
});

export const TEST_SESSION_ERROR: PaepError = deepFreeze({
  code: 'SESSION_INVALID',
  category: 'authentication',
  messageKey: 'paep.identity.sessionInvalid',
  retryable: false
});

export type SessionOutcomeStatus = SessionOutcome['status'];

export interface TestSessionOutcomeOptions {
  /** authenticated only: merged into TEST_IDENTITY. */
  readonly identity?: DeepPartial<IdentityContext>;
  /** authenticated only. */
  readonly expiresAt?: string;
  /** invalid only; null omits the error. Defaults to TEST_SESSION_ERROR. */
  readonly error?: PaepError | null;
}

/** Deep-frozen SessionOutcome fixture for the given status. */
export function createTestSessionOutcome(status: SessionOutcomeStatus = 'authenticated', options: TestSessionOutcomeOptions = {}): SessionOutcome {
  switch (status) {
    case 'authenticated': {
      const o = options.identity ?? {};
      const identity: IdentityContext = { ...jsonClone(TEST_IDENTITY), ...o, tenant: { ...TEST_IDENTITY.tenant, ...o.tenant } } as IdentityContext;
      return deepFreeze(options.expiresAt === undefined
        ? { status, identity }
        : { status, identity, expiresAt: options.expiresAt });
    }
    case 'invalid': {
      const error = options.error === undefined ? TEST_SESSION_ERROR : options.error;
      return deepFreeze(error === null ? { status } : { status, error: jsonClone(error) });
    }
    case 'unauthenticated':
    case 'expired':
      return deepFreeze({ status });
  }
}
