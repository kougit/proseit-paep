/**
 * @proseit/paep-contracts: the single public entry point (PAEP-IB-01 §7; PAEP-IR-01 §5.2).
 * Framework-neutral, type-only contracts: no Angular, Frappe, DOM, SQL or visualization-vendor type.
 * `export type *` guarantees the package exports no runtime value. Versioning rules: README.md.
 */
export type * from './lib/core/ids.js';
export type * from './lib/core/values.js';
export type * from './lib/core/paging.js';
export type * from './lib/core/query.js';
export type * from './lib/core/errors.js';
export type * from './lib/core/concurrency.js';
export type * from './lib/core/capabilities.js';
export type * from './lib/core/jobs.js';
export type * from './lib/config/compatibility.js';
export type * from './lib/config/runtime-config.js';
export type * from './lib/config/runtime-config-startup.js';
export type * from './lib/identity/identity-context.js';
export type * from './lib/domain/lists.js';
export type * from './lib/domain/files.js';
export type * from './lib/domain/workflow.js';
export type * from './lib/reporting/reporting.js';
export type * from './lib/offline/offline-command.js';
