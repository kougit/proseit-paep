import type { CompatibilityReport, RuntimeConfig, RuntimeConfigBuildContext, RuntimeConfigStore } from '@proseit/paep-contracts';
import { deepFreeze, jsonClone } from './deep-freeze.js';

/** Recursive partial override: objects merge key by key, arrays and scalars replace. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type RuntimeConfigOverrides = DeepPartial<RuntimeConfig>;

/** PAEP compatibility line the test store reports (mirrors the platform's PAEP_COMPATIBILITY_VERSION). */
export const TEST_PAEP_VERSION = '1.1';

/** Build context that accepts TEST_BASE_RUNTIME_CONFIG. */
export const TEST_RUNTIME_CONFIG_BUILD_CONTEXT: RuntimeConfigBuildContext = deepFreeze({
  expectedProductId: 'paep-test-app',
  supportedApiContracts: ['pmra-api-v1'],
  externalBiProviders: []
});

/** A valid, product-neutral runtime configuration (schema 1.0). Public placeholder values only. */
export const TEST_BASE_RUNTIME_CONFIG: RuntimeConfig = deepFreeze({
  schemaVersion: '1.0',
  product: { id: 'paep-test-app', name: 'PAEP Test Application', release: '0.0.0-test' },
  deployment: { environment: 'test', profile: 'cloud-saas', basePath: '/' },
  backend: {
    apiBaseUrl: 'https://api.example.test',
    realtimeUrl: null,
    fileBaseUrl: null,
    compatibility: { apiContract: 'pmra-api-v1', minimumPaep: '1.1', maximumPaep: null }
  },
  identity: { mode: 'oidc', issuer: 'https://id.example.test', clientId: 'paep-test-public-client', scopes: ['openid', 'profile'] },
  localisation: { defaultLocale: 'en', supportedLocales: ['en', 'ar'], rtlLocales: ['ar'] },
  features: { capabilityDiscovery: 'server', uiHints: { commandPalette: true } },
  telemetry: { enabled: false },
  analytics: { enabled: false },
  pwa: { enabled: false, offlineProfile: 'none' },
  security: { trustedTypesPolicyName: 'paep', cspProfile: 'strict' }
});

export interface TestRuntimeConfigStoreOptions {
  /** Explicit store identifier; defaults to a deterministic fingerprint of the merged configuration. */
  readonly configId?: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function merge(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) return override === undefined ? base : override;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) out[k] = merge(base[k], v);
  return out;
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/**
 * RuntimeConfigStore test double: TEST_BASE_RUNTIME_CONFIG deep-merged with overrides, then deep-frozen.
 * It performs no validation: tests that need the fail-safe pipeline use the platform validator.
 */
export function createTestRuntimeConfigStore(overrides: RuntimeConfigOverrides = {}, options: TestRuntimeConfigStoreOptions = {}): RuntimeConfigStore {
  const config = jsonClone(merge(TEST_BASE_RUNTIME_CONFIG, overrides)) as RuntimeConfig;
  const compatibility: CompatibilityReport = {
    status: 'compatible',
    schemaVersion: config.schemaVersion,
    apiContract: config.backend.compatibility.apiContract,
    paepVersion: TEST_PAEP_VERSION,
    minimumPaep: config.backend.compatibility.minimumPaep,
    maximumPaep: config.backend.compatibility.maximumPaep ?? null
  };
  return deepFreeze({ config, compatibility, configId: options.configId ?? `test-${fnv1a(JSON.stringify(config))}` });
}
