/** PAEP compatibility line this build conforms to (PAEP v1.1). Compared with backend.compatibility.minimumPaep/maximumPaep. */
export const PAEP_COMPATIBILITY_VERSION = '1.1';

/** Runtime-configuration schema versions this build can validate. There is no migration parser (PAEP-IB-01 §9.1). */
export const SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS: readonly string[] = Object.freeze(['1.0']);

/** Canonical deployment artefact path, resolved against the document base URI so subpath hosting works (PAEP-IB-01 §9.1, §19.1(iii)). */
export const RUNTIME_CONFIG_PATH = 'config/runtime-config.json';

/** Largest accepted configuration document in bytes. */
export const MAX_RUNTIME_CONFIG_BYTES = 65536;

/** Deepest accepted object/array nesting. */
export const MAX_RUNTIME_CONFIG_DEPTH = 8;

/** Most findings reported for one failed stage. */
export const MAX_RUNTIME_CONFIG_ISSUES = 20;
