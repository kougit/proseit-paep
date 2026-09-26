import type { RuntimeConfig, RuntimeConfigBuildContext, RuntimeConfigErrorCode, RuntimeConfigFailure, RuntimeConfigIssue, RuntimeConfigOutcome, RuntimeConfigStage } from '@proseit/paep-contracts';
import { checkCompatibility } from './compatibility.js';
import { MAX_RUNTIME_CONFIG_BYTES, MAX_RUNTIME_CONFIG_ISSUES, SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS } from './constants.js';
import { guardContent } from './content-guard.js';
import { deepFreeze } from './freeze.js';
import { RUNTIME_CONFIG_PROPERTY_NAMES, validateRuntimeConfigSchema } from './generated/runtime-config-schema.validator.js';
import { checkSemantics, type RuntimeConfigEnvironment } from './semantic.js';
import { decodeUtf8Strict, parseStrictJson } from './strict-json.js';

/*
 * Runtime-configuration pipeline (PAEP-IB-01 §9.2; PAEP-IR-01 §5.5):
 * decode -> parse -> version -> content guard -> generated schema validator -> semantic -> compatibility -> freeze.
 * The first failing stage ends the pipeline with the fail-safe state. There is no default, fallback or partial configuration.
 */

/** 32-bit FNV-1a of the document bytes, as 8 hex digits. An identifier for support diagnostics, not an integrity control. */
export function fingerprint(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// Stores produced by this module. The startup gate accepts only these, so a forged or hand-built outcome cannot start the application.
const VALIDATED_STORES = new WeakSet<object>();

/** True only for a store returned by validateRuntimeConfigBytes in this page. */
export function isValidatedRuntimeConfigStore(store: unknown): boolean {
  return typeof store === 'object' && store !== null && VALIDATED_STORES.has(store);
}

/**
 * Truncate a pointer at its first segment that is neither a schema property name nor an array index, so a key supplied by the
 * document (which may itself be secret-shaped) never appears in a diagnostic. The finding is then reported at that parent.
 */
export function redactPointer(pointer: string): string {
  if (pointer === '') return '';
  const kept: string[] = [];
  for (const seg of pointer.split('/').slice(1)) {
    if (!RUNTIME_CONFIG_PROPERTY_NAMES.has(seg) && !/^(0|[1-9][0-9]{0,2})$/.test(seg)) break;
    kept.push(seg);
  }
  return kept.length ? `/${kept.join('/')}` : '';
}

/** Build the fail-safe state. The diagnostic identifier carries the code and the document fingerprint, never content. */
export function runtimeConfigFailure(stage: RuntimeConfigStage, issues: readonly RuntimeConfigIssue[], bytes?: Uint8Array): RuntimeConfigFailure {
  const first = issues[0] ?? { stage, code: 'CFG_INTERNAL' as RuntimeConfigErrorCode, path: '' };
  return deepFreeze({
    ok: false,
    stage,
    code: first.code,
    issues: issues.slice(0, MAX_RUNTIME_CONFIG_ISSUES).map((i) => ({ stage: i.stage, code: i.code, path: redactPointer(i.path) })),
    diagnosticId: `PAEP-${first.code}-${bytes ? fingerprint(bytes) : 'nodoc'}`
  });
}

/** Validate a runtime-configuration document given as bytes. Pure and synchronous; never throws. */
export function validateRuntimeConfigBytes(bytes: Uint8Array, context: RuntimeConfigBuildContext, env: RuntimeConfigEnvironment = {}): RuntimeConfigOutcome {
  try {
    // The build context is compiled into the application; a malformed one is a build defect and fails closed (CFG_INTERNAL).
    if (typeof context?.expectedProductId !== 'string' || !Array.isArray(context.supportedApiContracts) || !Array.isArray(context.externalBiProviders)) throw new Error('invalid build context');
    if (bytes.length === 0) return runtimeConfigFailure('load', [{ stage: 'load', code: 'CFG_LOAD_EMPTY', path: '' }], bytes);
    if (bytes.length > MAX_RUNTIME_CONFIG_BYTES) return runtimeConfigFailure('load', [{ stage: 'load', code: 'CFG_LOAD_TOO_LARGE', path: '' }], bytes);

    const decoded = decodeUtf8Strict(bytes);
    if (decoded.ok === false) return runtimeConfigFailure('decode', [{ stage: 'decode', code: decoded.code, path: '' }], bytes);

    const parsed = parseStrictJson(decoded.text);
    if (parsed.ok === false) return runtimeConfigFailure('parse', [parsed.issue], bytes);
    const doc = parsed.value;
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return runtimeConfigFailure('parse', [{ stage: 'parse', code: 'CFG_PARSE_ROOT', path: '' }], bytes);

    // Version first, so an unknown or future document fails as unsupported rather than as a list of schema findings.
    const version = doc['schemaVersion'];
    if (version === undefined) return runtimeConfigFailure('version', [{ stage: 'version', code: 'CFG_VERSION_MISSING', path: '/schemaVersion' }], bytes);
    if (typeof version !== 'string' || !SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS.includes(version)) return runtimeConfigFailure('version', [{ stage: 'version', code: 'CFG_VERSION_UNSUPPORTED', path: '/schemaVersion' }], bytes);

    const content = guardContent(doc);
    if (content.length) return runtimeConfigFailure('content', content, bytes);

    const schema = validateRuntimeConfigSchema(doc);
    if (schema.length) return runtimeConfigFailure('schema', schema.map((s) => ({ stage: 'schema', code: s.code, path: s.path })), bytes);

    const config = doc as unknown as RuntimeConfig;
    const semantic = checkSemantics(config, env, context.externalBiProviders);
    if (semantic.length) return runtimeConfigFailure('semantic', semantic, bytes);

    const compat = checkCompatibility(config, context);
    if (compat.issues.length) return runtimeConfigFailure('compatibility', compat.issues, bytes);

    const store = deepFreeze({ config: deepFreeze(config), compatibility: compat.report, configId: fingerprint(bytes) });
    VALIDATED_STORES.add(store);
    return deepFreeze({ ok: true, store });
  } catch {
    return runtimeConfigFailure('internal', [{ stage: 'internal', code: 'CFG_INTERNAL', path: '' }], bytes);
  }
}
