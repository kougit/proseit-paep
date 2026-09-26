import type { EntityId, IsoDateTime } from '../core/ids.js';
import type { PaepError } from '../core/errors.js';

/** Opaque principal identifier. */
export type PrincipalId = string;

/** Opaque tenant identifier. Tenant resolution comes from the server session, never from runtime configuration. */
export type TenantId = string;

/** Active tenant / legal entity / project context shown to the user (PAEP-IB-01 §11.2(i); PAEP v1.1 §11). */
export interface TenantContext {
  readonly tenantId: TenantId;
  readonly displayName: string;
  readonly legalEntityId?: EntityId;
  readonly projectId?: EntityId;
}

/** Current identity. impersonatorId marks backend-governed support impersonation (PAEP v1.1 §11). It carries no permission. */
export interface IdentityContext {
  readonly principalId: PrincipalId;
  readonly displayName: string;
  readonly tenant: TenantContext;
  readonly impersonatorId?: PrincipalId;
}

/** Session outcome reported by an identity adapter; the server remains authoritative (PAEP v1.1 §10.1, §11). */
export type SessionOutcome =
  | { readonly status: 'authenticated'; readonly identity: IdentityContext; readonly expiresAt?: IsoDateTime }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'expired' }
  | { readonly status: 'invalid'; readonly error?: PaepError };
