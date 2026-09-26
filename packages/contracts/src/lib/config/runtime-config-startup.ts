import type { CompatibilityReport } from './compatibility.js';
import type { RuntimeConfig } from './runtime-config.js';

/** Pipeline stage that rejected a runtime configuration (PAEP-IB-01 §9.2). */
export type RuntimeConfigStage = 'load' | 'decode' | 'parse' | 'version' | 'content' | 'schema' | 'semantic' | 'compatibility' | 'startup' | 'internal';

/** Controlled runtime-configuration error codes. UI code maps codes, never messages (PAEP-IB-01 §7.1(iv)). */
export type RuntimeConfigErrorCode =
  | 'CFG_LOAD_NETWORK' | 'CFG_LOAD_STATUS' | 'CFG_LOAD_REDIRECT' | 'CFG_LOAD_CONTENT_TYPE' | 'CFG_LOAD_TOO_LARGE' | 'CFG_LOAD_EMPTY'
  | 'CFG_DECODE_UTF8' | 'CFG_DECODE_BOM'
  | 'CFG_PARSE_SYNTAX' | 'CFG_PARSE_DUPLICATE_KEY' | 'CFG_PARSE_FORBIDDEN_KEY' | 'CFG_PARSE_DEPTH' | 'CFG_PARSE_NUMBER' | 'CFG_PARSE_ROOT'
  | 'CFG_VERSION_MISSING' | 'CFG_VERSION_UNSUPPORTED'
  | 'CFG_CONTENT_KEY' | 'CFG_CONTENT_TEXT' | 'CFG_CONTENT_MARKUP' | 'CFG_CONTENT_SECRET' | 'CFG_CONTENT_DATA_ACCESS'
  | 'CFG_SCHEMA_REQUIRED' | 'CFG_SCHEMA_ADDITIONAL' | 'CFG_SCHEMA_TYPE' | 'CFG_SCHEMA_CONST' | 'CFG_SCHEMA_ENUM' | 'CFG_SCHEMA_PATTERN'
  | 'CFG_SCHEMA_LENGTH' | 'CFG_SCHEMA_RANGE' | 'CFG_SCHEMA_ITEMS' | 'CFG_SCHEMA_UNIQUE' | 'CFG_SCHEMA_PROPERTIES' | 'CFG_SCHEMA_PROPERTY_NAME'
  | 'CFG_URL_INVALID' | 'CFG_URL_INSECURE' | 'CFG_URL_HOST'
  | 'CFG_LOCALE_DEFAULT' | 'CFG_LOCALE_RTL' | 'CFG_IDENTITY_OIDC' | 'CFG_IDENTITY_UNEXPECTED' | 'CFG_TELEMETRY_ENDPOINT'
  | 'CFG_ANALYTICS_ENDPOINT' | 'CFG_EMBEDDED_BI' | 'CFG_PWA_PROFILE' | 'CFG_SECURITY_PROFILE' | 'CFG_PAEP_RANGE' | 'CFG_BASE_PATH'
  | 'CFG_COMPAT_PRODUCT' | 'CFG_COMPAT_API_CONTRACT' | 'CFG_COMPAT_PAEP'
  | 'CFG_STARTUP_REPEATED'
  | 'CFG_INTERNAL';

/** One finding. path is an RFC 6901 JSON Pointer; no configuration value is ever echoed (PAEP-IB-01 §9.2(v)). */
export interface RuntimeConfigIssue {
  readonly stage: RuntimeConfigStage;
  readonly code: RuntimeConfigErrorCode;
  readonly path: string;
}

/** Fail-safe startup state: first failing stage, its findings, and a non-sensitive diagnostic identifier (PAEP-IB-01 §9.2(iv)-(v)). */
export interface RuntimeConfigFailure {
  readonly ok: false;
  readonly stage: RuntimeConfigStage;
  readonly code: RuntimeConfigErrorCode;
  readonly issues: readonly RuntimeConfigIssue[];
  readonly diagnosticId: string;
}

/** Immutable runtime configuration store boundary (PAEP-IR-01 §5.6 IB1-WP5; PAEP-IB-01 §9.2(iii)). Deep-frozen; there is no setter or refresh. */
export interface RuntimeConfigStore {
  readonly config: RuntimeConfig;
  readonly compatibility: CompatibilityReport;
  /** Non-cryptographic identifier of the accepted configuration document, for support diagnostics. */
  readonly configId: string;
}

/** Successful startup outcome. */
export interface RuntimeConfigReady {
  readonly ok: true;
  readonly store: RuntimeConfigStore;
}

/** Outcome of load, parse and validation: ready, or the fail-safe state. There is no partial or default configuration. */
export type RuntimeConfigOutcome = RuntimeConfigReady | RuntimeConfigFailure;

/** Build-time facts an application supplies; they are compiled into the bundle and never read from runtime configuration. */
export interface RuntimeConfigBuildContext {
  /** product.id the application accepts; a configuration for another product fails closed. */
  readonly expectedProductId: string;
  /** Backend API contracts the application's adapters implement. */
  readonly supportedApiContracts: readonly string[];
  /** External-BI adapter identifiers compiled into the application (none in IB1). */
  readonly externalBiProviders: readonly string[];
}
