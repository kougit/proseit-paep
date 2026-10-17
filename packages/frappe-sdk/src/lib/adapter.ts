/**
 * The adapter factory (ADR-011 §2.1-2.2). Applications construct it at their composition root and bind its ports to
 * their own services; nothing else in PAEP imports this package.
 */
import type {
  CapabilitiesGateway, CompatibilityGateway, CorrelationId, FilesGateway, FreshnessGateway, RecordTypeKey, RecordsGateway,
  SessionGateway, WorkflowGateway,
} from '@proseit/paep-contracts';
import { createCapabilitiesGateway } from './capabilities.js';
import { compatibilityGate, createCompatibilityGateway } from './compatibility.js';
import { createRequestId } from './correlation.js';
import { adapterError } from './errors.js';
import { createFilesGateway } from './files.js';
import { createFreshnessGateway } from './freshness.js';
import { browserNavigate, type Navigate } from './login-redirect.js';
import { createRecordsGateway } from './records.js';
import { resourcesOf, type CompiledResource, type CompiledResourceMap } from './resources.js';
import { createCsrfStore, createSessionGateway } from './session.js';
import { MAX_ATTEMPTS_LIMIT, TIMEOUT_LIMIT_MS, backendOrigin, createTransport, type FetchLike } from './transport.js';
import { createWorkflowGateway } from './workflow.js';

export interface FrappeAdapterOptions {
  /** Backend origin (runtime configuration `backend.apiBaseUrl`): HTTPS, origin only. */
  readonly backendOrigin: string;
  /** Configured backend contract (`backend.compatibility.apiContract`); only pmra-api-v1 is supported. */
  readonly apiContract: string;
  /** Runtime-configuration schema version, reported in a compatible result. */
  readonly schemaVersion: string;
  /** Compiled, approved resource map. */
  readonly resources: CompiledResourceMap;
  readonly fetch?: FetchLike;
  readonly navigate?: Navigate;
  readonly newId?: () => CorrelationId;
  readonly now?: () => Date;
  /** Bounded retry of retryable failures: maxAttempts 1-5 (default 3), first delay in ms (default 250). */
  readonly retry?: { readonly maxAttempts?: number; readonly baseDelayMs?: number };
  /** Per-attempt timeout in ms, 1-60000 (default 30000). */
  readonly timeoutMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

export interface FrappeAdapter {
  readonly session: SessionGateway;
  readonly records: RecordsGateway;
  readonly workflow: WorkflowGateway;
  readonly files: FilesGateway;
  readonly capabilities: CapabilitiesGateway;
  readonly freshness: FreshnessGateway;
  readonly compatibility: CompatibilityGateway;
}

const bounded = (v: number | undefined, fallback: number, min: number, max: number, name: string): number => {
  if (v === undefined) return fallback;
  if (!Number.isInteger(v) || v < min || v > max) throw new TypeError(`Frappe adapter: ${name} must be an integer from ${min} to ${max}`);
  return v;
};

export function createFrappeAdapter(options: FrappeAdapterOptions): FrappeAdapter {
  const origin = backendOrigin(options.backendOrigin);
  if (!origin) throw new TypeError('Frappe adapter: backendOrigin must be an HTTPS origin (loopback HTTP only) without credentials, path, query or fragment');
  const resources = resourcesOf(options.resources);
  if (!resources) throw new TypeError('Frappe adapter: resources must come from compileResourceMap');
  const newId = options.newId ?? (() => createRequestId());
  const now = options.now ?? (() => new Date());
  const csrf = createCsrfStore();
  const transport = createTransport({
    origin,
    fetch: options.fetch ?? ((url, init) => globalThis.fetch(url, init)),
    csrf: csrf.header,
    newId,
    maxAttempts: bounded(options.retry?.maxAttempts, 3, 1, MAX_ATTEMPTS_LIMIT, 'retry.maxAttempts'),
    baseDelayMs: bounded(options.retry?.baseDelayMs, 250, 0, 10_000, 'retry.baseDelayMs'),
    timeoutMs: bounded(options.timeoutMs, 30_000, 1, TIMEOUT_LIMIT_MS, 'timeoutMs'),
    sleep: options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
  });
  const lookup = (recordType: RecordTypeKey): CompiledResource => {
    const r = typeof recordType === 'string' ? resources.get(recordType) : undefined;
    if (!r) throw adapterError('UNKNOWN_RESOURCE');
    return r;
  };
  const compatibility = createCompatibilityGateway(transport, options.apiContract, options.schemaVersion);
  const ready = compatibilityGate(compatibility);
  return Object.freeze({
    session: createSessionGateway(transport, csrf, options.navigate ?? browserNavigate),
    records: createRecordsGateway(transport, lookup, ready),
    workflow: createWorkflowGateway(transport, lookup, ready, newId),
    files: createFilesGateway(transport, lookup, ready),
    capabilities: createCapabilitiesGateway(transport, lookup, ready, now),
    freshness: createFreshnessGateway(transport, lookup, ready, now),
    compatibility,
  });
}
