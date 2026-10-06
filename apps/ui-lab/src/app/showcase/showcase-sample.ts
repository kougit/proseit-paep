import { signal } from '@angular/core';
import type { IdentityContext, RuntimeConfigBuildContext, RuntimeConfigStore } from '@proseit/paep-contracts';
import type {
  PaepShellAvailability,
  PaepShellCommandProvider,
  PaepShellCommandResult,
  PaepShellContext,
  PaepShellContextProvider,
  PaepShellNavManifest,
  PaepShellOptions,
} from '@proseit/paep-enterprise';
import { validateRuntimeConfigBytes, type ConnectivitySource } from '@proseit/paep-platform';
import { SHOWCASE_PREVIEW } from './showcase-mode';

/*
 * Neutral sample inputs for the UI-lab enterprise-shell preview (IB3 AC-IB3-14). There is no backend, identity
 * provider or permission system behind any of it: the shell only displays what it is given.
 */


const BUILD_CONTEXT: RuntimeConfigBuildContext = { expectedProductId: 'ui-lab-showcase', supportedApiContracts: ['pmra-api-v1'], externalBiProviders: [] };

/** The sample runtime configuration, validated by the platform seam like any product's. */
function sampleConfig(rtl: boolean): RuntimeConfigStore {
  const document = {
    schemaVersion: '1.0',
    product: { id: 'ui-lab-showcase', name: 'Shell showcase', release: '0.1.0', brandProfile: 'proseit-default' },
    deployment: { environment: 'development', profile: 'cloud-saas', basePath: '/' },
    backend: {
      apiBaseUrl: 'https://api.example.test',
      realtimeUrl: 'https://realtime.example.test',
      fileBaseUrl: 'https://files.example.test',
      compatibility: { apiContract: 'pmra-api-v1', minimumPaep: '1.1', maximumPaep: null },
    },
    identity: { mode: 'frappe-session', issuer: null, clientId: null, scopes: [] },
    localisation: { defaultLocale: rtl ? 'ar' : 'en', supportedLocales: ['en', 'ar'], rtlLocales: ['ar'] },
    features: { capabilityDiscovery: 'server', uiHints: { commandPalette: true } },
    telemetry: { enabled: false, endpoint: null, sampleRate: 0 },
    analytics: { enabled: false, reportingBaseUrl: null, embeddedBi: { enabled: false } },
    pwa: { enabled: false, offlineProfile: 'none' },
  };
  const outcome = validateRuntimeConfigBytes(new TextEncoder().encode(JSON.stringify(document)), BUILD_CONTEXT);
  if (!outcome.ok) throw new Error(`UI-lab showcase: sample runtime configuration rejected (${outcome.diagnosticId})`);
  return outcome.store;
}

const at = (path: string) => `${SHOWCASE_PREVIEW}/${path}`;

export const SHOWCASE_NAVIGATION: PaepShellNavManifest = {
  home: at('workspace'),
  groups: [
    { id: 'overview', label: 'Overview', icon: 'home', items: [{ id: 'workspace', label: 'Workspace', route: at('workspace') }] },
    {
      id: 'states',
      label: 'Shell states',
      shortLabel: 'States',
      icon: 'list',
      items: [
        { id: 'locked-permission', label: 'Permission example', route: at('locked/permission') },
        { id: 'locked-edition', label: 'Edition example', route: at('locked/edition') },
        { id: 'locked-configuration', label: 'Configuration example', route: at('locked/configuration') },
        { id: 'locked-environment', label: 'Environment example', route: at('locked/environment') },
        { id: 'error-demo', label: 'Error boundary example', route: at('error') },
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

const CONTEXTS: readonly PaepShellContext[] = [
  { tenant: { tenantId: 'sample-tenant-a', displayName: 'Sample Organisation A' }, site: 'Site 01' },
  { tenant: { tenantId: 'sample-tenant-a', displayName: 'Sample Organisation A' }, site: 'Site 03' },
  { tenant: { tenantId: 'sample-tenant-b', displayName: 'Sample Organisation B' }, site: 'Site 02' },
];

function sampleContext(): PaepShellContextProvider {
  const current = signal<PaepShellContext | null>(CONTEXTS[0]);
  return {
    current,
    available: signal(CONTEXTS),
    // Organisation B is accepted after a short delay; anything else (such as Site 03) is rejected with a sample reference.
    requestSwitch: (target) =>
      new Promise((resolve) =>
        setTimeout(() => {
          if (target === CONTEXTS[2]) {
            current.set(target);
            resolve({ status: 'accepted' });
          } else resolve({ status: 'rejected', reference: 'REF-SAMPLE-0001' });
        }, 400),
      ),
  };
}

const RECORDS: readonly PaepShellCommandResult[] = Array.from({ length: 6 }, (_, i) => ({
  id: `sample-record-${i + 1}`,
  group: 'records' as const,
  label: `Sample record ${String(i + 1).padStart(3, '0')}`,
  description: 'Record · Sample data',
  route: at('workspace'),
}));

/** One action and a delayed record search; "unavailable" shows the error state and "partial" partial results. */
const commands: PaepShellCommandProvider = {
  actions: signal([{ id: 'not-found-example', group: 'actions', label: 'Open the not-found example', route: at('no-such-page') }]),
  search: (query, abort) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.toLocaleLowerCase();
        if (q.includes('unavailable')) reject(new Error('sample provider unavailable'));
        else resolve({ results: RECORDS.filter((r) => r.label.toLocaleLowerCase().includes(q) || q.includes('partial')), partial: q.includes('partial') });
      }, 300);
      abort.addEventListener('abort', () => clearTimeout(timer));
    }),
};

/** A fixed connectivity state, so the status strip can be shown offline without touching the network. */
const fixedConnectivity = (state: 'offline'): ConnectivitySource => ({ current: () => state, subscribe: () => () => undefined });

/**
 * Shell options of the preview. The query string selects the variant: `dir=rtl` starts in Arabic (right to left)
 * and `connectivity=offline` shows the offline status. Error reports are kept in memory only, so the lab console
 * stays clean; products route them through the observability seam.
 */
export function showcaseShellOptions(search: string): PaepShellOptions {
  const q = new URLSearchParams(search);
  const identity = signal<IdentityContext | null>({ principalId: 'sample-user', displayName: 'Sample User', tenant: CONTEXTS[0].tenant });
  const signingOut = signal(false);
  return {
    runtimeConfig: sampleConfig(q.get('dir') === 'rtl'),
    navigation: SHOWCASE_NAVIGATION,
    access: { loaded: signal(true), availability: (id) => LOCKED[id] ?? { state: 'available' } },
    counts: { count: (id) => (id === 'workspace' ? 3 : undefined) },
    commands,
    context: sampleContext(),
    session: { identity, signingOut, signOut: () => signingOut.set(true) },
    errorReporter: { report: () => undefined },
    ...(q.get('connectivity') === 'offline' ? { connectivity: fixedConnectivity('offline') } : {}),
  };
}
