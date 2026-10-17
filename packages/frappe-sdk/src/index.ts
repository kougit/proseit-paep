// Public entry point of @proseit/frappe-sdk (IB4-FRAPPE-ADAPTER, ADR-011). Only applications import this package, and
// only lazily (D7). It implements the @proseit/paep-contracts ports against the pmra-api-v1 Frappe backend contract.
export { createFrappeAdapter } from './lib/adapter.js';
export type { FrappeAdapter, FrappeAdapterOptions } from './lib/adapter.js';
export { compileResourceMap } from './lib/resources.js';
export type { CompiledResourceMap, ResourceDefinition, ResourceMapDefinition, WorkflowDefinition } from './lib/resources.js';
export { createFreshnessPoller } from './lib/freshness.js';
export type { FreshnessPoller, FreshnessPollerOptions, InvalidationListener } from './lib/freshness.js';
export { isPaepError } from './lib/errors.js';
export type { FrappeAdapterErrorCode } from './lib/errors.js';
export type { FetchInitLike, FetchLike, FetchResponseLike } from './lib/transport.js';
export type { Navigate } from './lib/login-redirect.js';
