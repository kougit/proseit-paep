# @proseit/paep-contracts

**Status:** implemented by IB1-CONTRACTS-CONFIG (PASS pending PO/SA acceptance).

**Layer:** L0 - Base (PAEP-IB-01 §6.1)

**Responsibility:** Product-neutral typed domain, error, capability, configuration, identity, reporting and offline-command contracts. Plain, type-only TypeScript with no Angular, Frappe/ERPNext, DOM, visualisation-library, domain-package or app dependency.

**Implementation milestone:** IB1

Consumers import this package only through its public entry point `src/index.ts` (PAEP-IB-01 §6.2).

## Catalogue

| Area | Folder | Main types |
| --- | --- | --- |
| Core | `src/lib/core/` | identifiers, `MoneyValue`, `ScalarValue`, paging, sorting, filters, `PaepError`, concurrency tokens, capabilities, jobs |
| Configuration | `src/lib/config/` | `RuntimeConfig`, `BackendCompatibility`, `CompatibilityReport`, startup outcome, error codes, build context, store |
| Identity | `src/lib/identity/` | `TenantContext`, `IdentityContext`, `SessionOutcome` |
| Domain-neutral | `src/lib/domain/` | list views, files and attachments, workflow transitions |
| Reporting | `src/lib/reporting/` | IB-01 Appendix D reporting shapes and `ReportingGateway` |
| Offline | `src/lib/offline/` | offline command envelope and conflict types (no queue) |

Full catalogue: `evidence/IB1-CONTRACTS-CONFIG/reports/contract-catalogue.md`.

## Differences from the IB-01 Appendix D excerpt

The reporting contracts follow Appendix D with these deliberate tightenings, all compatible with its intent:

* `FieldDataType` adds `'duration'`.
* `ReportFilter.value`, `ReportQuery.parameters`, `ReportResult.totals`, `ReportRow` and `DrillRequest.sourceContext` use `ScalarValue` or `FilterValue` instead of `unknown`, so no framework or DOM object can cross the boundary.
* `ExportJob` carries the optional `error?: PaepError` of `JobStatus`.
* `IdentityMode` keeps the source value `'frappe-session'` (IB-01 §9.1, §9.3); it names a mode, not a dependency.

## Rules

* Type-only: no runtime values, classes or side effects. Every property is `readonly`.
* No framework, DOM, backend or chart type. The package compiles alone with `lib: ["ES2022"]` and `types: []` (`packages/contracts/tsconfig.json`).
* Relative `import type` with explicit `.js` extensions only.

## Versioning

The contracts follow the PAEP platform version. Adding an optional property or a new type is compatible. Removing or renaming a property, making an optional property required, or narrowing a union is breaking and needs a new major PAEP version and an ADR. The runtime-configuration schema version (`1.0`) is versioned separately; see `config/README.md`.
