// Public entry point of @proseit/paep-platform. Consumers import this package only through this entry point.
// IB1 delivers the framework-neutral runtime-configuration boundary (PAEP-IR-01 §5.6 IB1-WP4/WP5); IB3 adds the
// framework-neutral connectivity signal seam used by the enterprise shell.
export {
  MAX_RUNTIME_CONFIG_BYTES,
  MAX_RUNTIME_CONFIG_DEPTH,
  MAX_RUNTIME_CONFIG_ISSUES,
  PAEP_COMPATIBILITY_VERSION,
  RUNTIME_CONFIG_PATH,
  SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS
} from './lib/runtime-config/constants.js';
export { RUNTIME_CONFIG_SCHEMA_ID, RUNTIME_CONFIG_SCHEMA_SHA256 } from './lib/runtime-config/generated/runtime-config-schema.validator.js';
export { validateRuntimeConfigBytes } from './lib/runtime-config/validate.js';
export { loadRuntimeConfig } from './lib/runtime-config/load.js';
export type { RuntimeConfigFetch, RuntimeConfigFetchResponse, RuntimeConfigLoadOptions } from './lib/runtime-config/load.js';
export type { RuntimeConfigEnvironment } from './lib/runtime-config/semantic.js';
export { describeRuntimeConfigFailure, startWithRuntimeConfig } from './lib/runtime-config/startup.js';
export type { RuntimeConfigStartup } from './lib/runtime-config/startup.js';
export { CONNECTIVITY_STATES, browserConnectivitySource } from './lib/connectivity/connectivity.js';
export type { ConnectivityHost, ConnectivitySource, ConnectivityState } from './lib/connectivity/connectivity.js';
