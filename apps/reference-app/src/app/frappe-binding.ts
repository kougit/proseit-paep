import { signal, type Signal } from '@angular/core';
import type { IdentityContext, PaepError, RuntimeConfigStore, SessionGateway } from '@proseit/paep-contracts';
import type { FrappeAdapter } from '@proseit/frappe-sdk';

/*
 * Lazy Frappe binding of the reference application (IB4 S5, D6/D7). Outside the development profile the shell's
 * session and access ports are backed by @proseit/frappe-sdk, loaded with one dynamic import() so the adapter stays
 * out of the initial bundle. Nothing here adds a screen, route, dialog or copy: an unauthenticated or expired session
 * goes to the server-hosted login through the adapter's approved redirect, a blocked backend locks the navigation with
 * the existing "environment" state, and failures are reported with their kind and reference only.
 */

/** The adapter module as the application loads it. */
export type FrappeSdkModule = typeof import('@proseit/frappe-sdk');

/** Availability as the shell's access port defines it (structurally PaepShellAvailability). */
export type BindingAvailability =
  | { readonly state: 'available' }
  | { readonly state: 'locked'; readonly reason: 'permission' | 'edition' | 'configuration' | 'environment' }
  | { readonly state: 'not-permitted' };

/** What the binding needs from the running application. */
export interface FrappeBindingHost {
  /** Current router path, used as the return path of the server login. */
  currentPath(): string;
  /** Receives kind and reference only (the shell's error reporter). */
  report(report: { readonly kind: 'version' | 'unknown'; readonly correlationId: string; readonly retryable: boolean }): void;
}

export interface FrappeShellBinding {
  /** Shell session port (structurally PaepShellSession). */
  readonly session: { readonly identity: Signal<IdentityContext | null>; readonly signingOut: Signal<boolean>; signOut(): void };
  /** Shell access port (structurally PaepShellAccessInfo). */
  readonly access: { readonly loaded: Signal<boolean>; availability(id: string): BindingAvailability };
  /** Loads the adapter, checks compatibility, then the session. Never rejects. */
  start(host: FrappeBindingHost): Promise<void>;
}

/** The reference application exposes no record type: it has no product screen (D6). */
const REFERENCE_RESOURCES = {};
const REFERENCE = /^[A-Za-z0-9_-]{8,64}$/;
const UNVERIFIED = 'BACKEND-UNVERIFIED';
const reference = (e: unknown): string => {
  const id = e && typeof e === 'object' ? (e as Partial<PaepError>).correlationId : undefined;
  return typeof id === 'string' && REFERENCE.test(id) ? id : UNVERIFIED;
};

export function createFrappeShellBinding(
  store: RuntimeConfigStore,
  options: { readonly fallbackAvailability: (id: string) => BindingAvailability; readonly load?: () => Promise<FrappeSdkModule> },
): FrappeShellBinding {
  const identity = signal<IdentityContext | null>(null);
  const signingOut = signal(false);
  const loaded = signal(false);
  const blocked = signal(false);
  const load = options.load ?? (() => import('@proseit/frappe-sdk'));
  let session: SessionGateway | undefined;
  let host: FrappeBindingHost | undefined;

  const toLogin = async (gateway: SessionGateway, returnPath: string) => {
    try { await gateway.beginSignIn({ returnPath }); } catch { await gateway.beginSignIn({}); }
  };

  return {
    session: {
      identity: identity.asReadonly(),
      signingOut: signingOut.asReadonly(),
      signOut: () => {
        const gateway = session;
        if (!gateway || signingOut()) return;
        signingOut.set(true);
        gateway.signOut().then(
          async () => { identity.set(null); await toLogin(gateway, '/'); },
          async (e: unknown) => {
            const code = e && typeof e === 'object' ? (e as Partial<PaepError>).code : undefined;
            // Only an expired or missing session means the user is already signed out; the login follows.
            if (code === 'SESSION_EXPIRED' || code === 'AUTHENTICATION_REQUIRED') { identity.set(null); await toLogin(gateway, '/'); return; }
            // Any other failure (including a rejected CSRF token) keeps the user signed in and is reported. The adapter
            // cleared its token, so the session is checked again for a fresh one and a retry can work.
            signingOut.set(false);
            host?.report({ kind: 'unknown', correlationId: reference(e), retryable: true });
            const outcome = await gateway.check();
            if (outcome.status === 'authenticated') identity.set(outcome.identity);
            else if (outcome.status !== 'invalid') { identity.set(null); await toLogin(gateway, '/'); }
          },
        );
      },
    },
    access: {
      loaded: loaded.asReadonly(),
      availability: (id) => (blocked() ? { state: 'locked', reason: 'environment' } : options.fallbackAvailability(id)),
    },
    async start(h: FrappeBindingHost): Promise<void> {
      host = h;
      let adapter: FrappeAdapter;
      try {
        const sdk = await load();
        const { config } = store;
        adapter = sdk.createFrappeAdapter({
          backendOrigin: config.backend.apiBaseUrl,
          apiContract: config.backend.compatibility.apiContract,
          schemaVersion: config.schemaVersion,
          resources: sdk.compileResourceMap(REFERENCE_RESOURCES),
        });
      } catch {
        blocked.set(true);
        loaded.set(true);
        h.report({ kind: 'version', correlationId: UNVERIFIED, retryable: false });
        return;
      }
      const compatibility = await adapter.compatibility.check();
      if (compatibility.status !== 'compatible') {
        blocked.set(true);
        loaded.set(true);
        h.report({ kind: 'version', correlationId: reference(compatibility), retryable: compatibility.status === 'unknown' });
        return;
      }
      session = adapter.session;
      const outcome = await adapter.session.check();
      loaded.set(true);
      if (outcome.status === 'authenticated') identity.set(outcome.identity);
      else if (outcome.status === 'invalid') h.report({ kind: 'unknown', correlationId: reference(outcome.error), retryable: true });
      else await toLogin(adapter.session, h.currentPath());
    },
  };
}
