import { signal } from '@angular/core';
import type { IdentityContext, RuntimeConfigStore } from '@proseit/paep-contracts';
import type {
  PaepShellAccessInfo,
  PaepShellAvailability,
  PaepShellCommandProvider,
  PaepShellCommandResult,
  PaepShellContext,
  PaepShellContextProvider,
  PaepShellNavCounts,
  PaepShellNavManifest,
  PaepShellOptions,
  PaepShellSession,
} from '@proseit/paep-enterprise';

/*
 * Sample shell inputs for the reference application. Every value here is neutral demonstration data: there is no
 * backend, no identity provider and no permission system behind it. The shell only displays what it is given.
 */

export const REFERENCE_NAVIGATION: PaepShellNavManifest = {
  home: '/workspace',
  groups: [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'home',
      items: [{ id: 'workspace', label: 'Workspace', route: '/workspace' }],
    },
    {
      id: 'states',
      label: 'Shell states',
      shortLabel: 'States',
      icon: 'list',
      items: [
        { id: 'locked-permission', label: 'Permission example', route: '/locked/permission' },
        { id: 'locked-edition', label: 'Edition example', route: '/locked/edition' },
        { id: 'locked-configuration', label: 'Configuration example', route: '/locked/configuration' },
        { id: 'locked-environment', label: 'Environment example', route: '/locked/environment' },
        { id: 'error-demo', label: 'Error boundary example', route: '/error-demo' },
      ],
    },
  ],
};

const LOCKED: Readonly<Record<string, PaepShellAvailability>> = {
  'locked-permission': { state: 'locked', reason: 'permission' },
  'locked-edition': { state: 'locked', reason: 'edition' },
  'locked-configuration': { state: 'locked', reason: 'configuration' },
  'locked-environment': { state: 'locked', reason: 'environment' },
};

const access: PaepShellAccessInfo = {
  loaded: signal(true),
  availability: (id) => LOCKED[id] ?? { state: 'available' },
};

const counts: PaepShellNavCounts = {
  count: (id) => (id === 'workspace' ? 3 : undefined),
};

const SAMPLE_CONTEXTS: readonly PaepShellContext[] = [
  { tenant: { tenantId: 'sample-tenant-a', displayName: 'Sample Organisation A' }, site: 'Site 01' },
  { tenant: { tenantId: 'sample-tenant-b', displayName: 'Sample Organisation B' }, site: 'Site 02' },
];

function sampleContext(): PaepShellContextProvider {
  const current = signal<PaepShellContext | null>(SAMPLE_CONTEXTS[0]);
  return {
    current,
    available: signal(SAMPLE_CONTEXTS),
    // A sample server: organisation B accepts the request after a short delay; anything else is rejected.
    requestSwitch: (tenantId) =>
      new Promise((resolve) =>
        setTimeout(() => {
          const next = SAMPLE_CONTEXTS.find((c) => c.tenant.tenantId === tenantId);
          if (next && tenantId === 'sample-tenant-b') {
            current.set(next);
            resolve({ status: 'accepted' });
          } else resolve({ status: 'rejected', reference: 'REF-SAMPLE-0001' });
        }, 400),
      ),
  };
}

const SAMPLE_RECORDS: readonly PaepShellCommandResult[] = Array.from({ length: 6 }, (_, i) => ({
  id: `sample-record-${i + 1}`,
  group: 'records' as const,
  label: `Sample record ${String(i + 1).padStart(3, '0')}`,
  description: 'Record · Sample data',
  route: '/workspace',
}));

/**
 * A sample command source: one action, and a record search over neutral sample data after a short delay. The query
 * "unavailable" shows the provider error state and "partial" the partial-results state.
 */
const commands: PaepShellCommandProvider = {
  actions: signal([{ id: 'not-found-example', group: 'actions', label: 'Open the not-found example', route: '/no-such-page' }]),
  search: (query, abort) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.toLocaleLowerCase();
        if (q.includes('unavailable')) reject(new Error('sample provider unavailable'));
        else resolve({ results: SAMPLE_RECORDS.filter((r) => r.label.toLocaleLowerCase().includes(q) || q.includes('partial')), partial: q.includes('partial') });
      }, 300);
      abort.addEventListener('abort', () => clearTimeout(timer));
    }),
};

function sampleSession(): PaepShellSession {
  const identity = signal<IdentityContext | null>({
    principalId: 'sample-user',
    displayName: 'Sample User',
    tenant: SAMPLE_CONTEXTS[0].tenant,
  });
  const signingOut = signal(false);
  return {
    identity,
    signingOut,
    // Sign-out is a request to the host; this sample has no identity provider, so it only shows the pending state.
    signOut: () => signingOut.set(true),
  };
}

/** Shell options of the reference application. */
export function referenceShellOptions(store: RuntimeConfigStore): PaepShellOptions {
  return {
    runtimeConfig: store,
    navigation: REFERENCE_NAVIGATION,
    access,
    counts,
    commands,
    context: sampleContext(),
    session: sampleSession(),
  };
}
