import type { LocaleTag } from '../core/ids.js';
import type { BackendCompatibility } from './compatibility.js';

/**
 * Runtime configuration contract for schema version 1.0 (PAEP-IB-01 §9.1, Appendix C; config/runtime-config.schema.json).
 * Every value is public, non-secret deployment metadata. Nothing in it grants permission or entitlement:
 * authority stays with the server (PAEP-IR-01 §5.5(v); PAEP-IB-01 §7.3).
 * The shape changes only together with a new schemaVersion.
 */
export type RuntimeConfigSchemaVersion = '1.0';

/** Supported deployment profiles (PAEP-IB-01 §19). */
export type DeploymentProfile = 'cloud-saas' | 'private-cloud' | 'on-premise';

/** Deployment environment. */
export type DeploymentEnvironment = 'development' | 'test' | 'staging' | 'production';

/** Authentication integration mode; the server or proxy remains authoritative (PAEP-IB-01 §9.1). */
export type IdentityMode = 'frappe-session' | 'oidc' | 'sso-proxy';

/** How the UI learns which capabilities exist. Discovery never grants authority. */
export type CapabilityDiscoveryMode = 'server' | 'manifest';

/** Offline capability profile identifier (PAEP-IB-01 §9.1 "pwa"). */
export type OfflineProfile = 'none' | 'drafts-only' | 'bounded-commands';

/** Content Security Policy profile identifier; deployment headers enforce the actual policy (PAEP-IB-01 §9.1, §11.1(ii)). */
export type CspProfile = 'strict';

/** Opaque identifier of an optional external-BI adapter; no vendor type or token is part of the contract. */
export type ExternalBiProviderId = string;

export interface ProductConfig {
  readonly id: string;
  readonly name: string;
  readonly release: string;
  readonly brandProfile?: string;
}

export interface DeploymentConfig {
  readonly environment: DeploymentEnvironment;
  readonly profile: DeploymentProfile;
  /** Absolute path the application is served under; starts and ends with "/". */
  readonly basePath: string;
}

export interface BackendConfig {
  readonly apiBaseUrl: string;
  readonly realtimeUrl?: string | null;
  readonly fileBaseUrl?: string | null;
  readonly compatibility: BackendCompatibility;
}

/** Non-secret identity-provider metadata. There is no field for a client secret or token (PAEP-IB-01 §9.1). */
export interface IdentityConfig {
  readonly mode: IdentityMode;
  readonly issuer?: string | null;
  /** Public OIDC client identifier (public client with PKCE); never a secret. */
  readonly clientId?: string | null;
  readonly scopes?: readonly string[];
}

export interface LocalisationConfig {
  readonly defaultLocale: LocaleTag;
  readonly supportedLocales: readonly LocaleTag[];
  readonly rtlLocales?: readonly LocaleTag[];
}

/** Presentation hints only; they never grant authority (PAEP-IR-01 §5.5(v)). */
export interface FeaturesConfig {
  readonly capabilityDiscovery: CapabilityDiscoveryMode;
  /** Boolean presentation hints keyed by product-manifest hint name; a missing key means false. The key set is product-defined, so a record map is the model. */
  readonly uiHints?: Readonly<Record<string, boolean>>;
}

export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly endpoint?: string | null;
  readonly sampleRate?: number;
}

/** Optional external-BI descriptor. It holds no token: embed tokens come from backend-authorised flows (PAEP-IB-01 §9.1). */
export interface EmbeddedBiDescriptor {
  readonly enabled: boolean;
  readonly provider?: ExternalBiProviderId;
}

export interface AnalyticsConfig {
  readonly enabled: boolean;
  readonly reportingBaseUrl?: string | null;
  readonly embeddedBi?: EmbeddedBiDescriptor;
}

export interface PwaConfig {
  readonly enabled: boolean;
  readonly offlineProfile: OfflineProfile;
}

/** Profile identifiers only (PAEP-IB-01 §9.1 "security"). */
export interface SecurityConfig {
  readonly trustedTypesPolicyName?: string;
  readonly cspProfile?: CspProfile;
}

/** Validated runtime configuration (PAEP-IB-01 §9.1, Appendix C). */
export interface RuntimeConfig {
  readonly schemaVersion: RuntimeConfigSchemaVersion;
  readonly product: ProductConfig;
  readonly deployment: DeploymentConfig;
  readonly backend: BackendConfig;
  readonly identity: IdentityConfig;
  readonly localisation: LocalisationConfig;
  readonly features: FeaturesConfig;
  readonly telemetry: TelemetryConfig;
  readonly analytics: AnalyticsConfig;
  readonly pwa: PwaConfig;
  readonly security?: SecurityConfig;
}
