# IB1-CONTRACTS-CONFIG — Contract Catalogue

Package `@proseit/paep-contracts`, entry point `packages/contracts/src/index.ts` (type-only `export type *` barrel). 100 public types. Every property is `readonly`; no runtime value is exported (`qa:contracts` S3). Generated from the sources and the reviewed API snapshot `tooling/test-utils/contract-api-report.json`.

## `config/compatibility.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `PaepVersion` | type | PAEP compatibility line, "major.minor" (for example "1.1"): the controlled PAEP architecture level a build conforms to. |
| `BackendCompatibility` | interface | Public backend compatibility metadata carried by runtime configuration (PAEP-IB-01 §9.1, §9.3). |
| `CompatibilityReport` | interface | Observable result of the startup compatibility check (PAEP-IB-01 §9.2(vi)). |

## `config/runtime-config-startup.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `RuntimeConfigStage` | type | Pipeline stage that rejected a runtime configuration (PAEP-IB-01 §9.2). |
| `RuntimeConfigErrorCode` | type | Controlled runtime-configuration error codes. |
| `RuntimeConfigIssue` | interface | One finding. |
| `RuntimeConfigFailure` | interface | Fail-safe startup state: first failing stage, its findings, and a non-sensitive diagnostic identifier (PAEP-IB-01 §9.2(iv)-(v)). |
| `RuntimeConfigStore` | interface | Immutable runtime configuration store boundary (PAEP-IR-01 §5.6 IB1-WP5; PAEP-IB-01 §9.2(iii)). |
| `RuntimeConfigReady` | interface | Successful startup outcome. |
| `RuntimeConfigOutcome` | type | Outcome of load, parse and validation: ready, or the fail-safe state. |
| `RuntimeConfigBuildContext` | interface | Build-time facts an application supplies; they are compiled into the bundle and never read from runtime configuration. |

## `config/runtime-config.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `RuntimeConfigSchemaVersion` | type | Runtime configuration contract for schema version 1.0 (PAEP-IB-01 §9.1, Appendix C; config/runtime-config.schema.json). |
| `DeploymentProfile` | type | Supported deployment profiles (PAEP-IB-01 §19). |
| `DeploymentEnvironment` | type | Deployment environment. |
| `IdentityMode` | type | Authentication integration mode; the server or proxy remains authoritative (PAEP-IB-01 §9.1). |
| `CapabilityDiscoveryMode` | type | How the UI learns which capabilities exist. |
| `OfflineProfile` | type | Offline capability profile identifier (PAEP-IB-01 §9.1 "pwa"). |
| `CspProfile` | type | Content Security Policy profile identifier; deployment headers enforce the actual policy (PAEP-IB-01 §9.1, §11.1(ii)). |
| `ExternalBiProviderId` | type | Opaque identifier of an optional external-BI adapter; no vendor type or token is part of the contract. |
| `ProductConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `DeploymentConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `BackendConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `IdentityConfig` | interface | Non-secret identity-provider metadata. |
| `LocalisationConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `FeaturesConfig` | interface | Presentation hints only; they never grant authority (PAEP-IR-01 §5.5(v)). |
| `TelemetryConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `EmbeddedBiDescriptor` | interface | Optional external-BI descriptor. |
| `AnalyticsConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `PwaConfig` | interface | Section of `RuntimeConfig` (PAEP-IB-01 Appendix C). |
| `SecurityConfig` | interface | Profile identifiers only (PAEP-IB-01 §9.1 "security"). |
| `RuntimeConfig` | interface | Validated runtime configuration (PAEP-IB-01 §9.1, Appendix C). |

## `core/capabilities.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `CapabilityId` | type | Server-derived capability identifier; client flags never create authority (PAEP-IB-01 §7.3). |
| `Capability` | interface | Discovered capability (PAEP-IR-01 Code Block 4). |

## `core/concurrency.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `ConcurrencyMetadata` | interface | Concurrency token for protected writes (PAEP-IR-01 Code Block 3; PAEP-IB-01 §7.3). |
| `IdempotencyKey` | type | Client-generated operation key for replay-safe commands where duplicates would have business effect (PAEP-IB-01 §7.1(vi), §7.3). |

## `core/errors.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `PaepErrorCategory` | type | Error categories every adapter maps to (PAEP v1.1 §10.1 "Errors"). |
| `PaepErrorCode` | type | Controlled machine-readable error code; the vocabulary is governed by adapters and product APIs. |
| `PaepError` | interface | Structured error: code + messageKey + optional fieldErrors + correlationId + retryable flag (PAEP-IR-01 Code Block 3; PAEP-IB-01 §7.3). |

## `core/ids.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `EntityId` | type | Opaque identifier at the UI boundary (PAEP-IB-01 §7.3). |
| `CorrelationId` | type | Correlation identifier retained for support evidence (PAEP-IB-01 §7.3). |
| `MessageKey` | type | i18n message key; UI code never parses backend prose (PAEP-IB-01 §7.1(iv)). |
| `IsoDateTime` | type | ISO-8601 date-time transport string with offset (PAEP-IB-01 §7.3). |
| `IsoDate` | type | ISO-8601 calendar date (YYYY-MM-DD). |
| `TimeZoneId` | type | IANA time-zone identifier. |
| `LocaleTag` | type | BCP 47 locale tag. |
| `CurrencyCode` | type | ISO 4217 alphabetic currency code. |
| `DecimalString` | type | Decimal number serialised as a string, so no binary floating-point loss crosses the boundary. |

## `core/jobs.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `JobState` | type | Long-running job lifecycle (PAEP-IB-01 §7.1(v), Appendix D). |
| `JobStatus` | interface | Job/status contract used instead of a blocking browser request (PAEP-IB-01 §7.1(v); PAEP v1.1 §13). |

## `core/paging.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `PageRequest` | interface | Cursor-first page request (PAEP-IB-01 §7.3). |
| `PageInfo` | interface | Page metadata attached to bounded results. |
| `PageResult` | interface | Common paged result shape (PAEP-IR-01 Code Block 3). |
| `SortDirection` | type | Sort direction. |
| `SortSpec` | interface | Sort by a semantic field key, never a column or DocType field name (PAEP-IB-01 §7.1(ii)). |

## `core/query.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `FilterOperator` | type | Approved filter operators; the server validates every use. |
| `FilterValue` | type | Filter operand: a scalar, or a list for in/notIn/between. |
| `FieldFilter` | interface | Filter on a semantic field key; never a column, table or DocType name, never SQL (PAEP-IB-01 §7.1(vii)). |

## `core/values.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `MoneyValue` | interface | Money as transport amount plus explicit currency; never inferred from the browser locale (PAEP-IB-01 §7.3; PAEP-IR-01 Code Block 4). |
| `ScalarValue` | type | JSON-safe scalar used where keys are server-declared semantic keys. |
| `BusinessTimeContext` | interface | Explicit business time-zone context accompanying ISO transport strings (PAEP-IB-01 §7.3). |

## `domain/files.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `FileChecksum` | interface | Content checksum recorded as provenance metadata. |
| `FileMetadata` | interface | File / evidence metadata; never a private storage path (PAEP v1.1 §10.1 "Files/evidence", §13). |
| `FileAccess` | interface | Authorised, expiring access reference issued by the server (PAEP-IB-01 §11.1(vi)). |
| `FileUploadState` | type | Upload lifecycle. |
| `FileUploadStatus` | interface | Upload progress, failure and server acceptance (PAEP v1.1 §13). |

## `domain/lists.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `ListQuery` | interface | Product-neutral list / data-grid query (PAEP v1.1 §10.1 "Lists/data grids"). |

## `domain/workflow.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `WorkflowAction` | interface | Backend-derived allowed action; the UI never infers approval authority (PAEP v1.1 §11 segregation of duties). |
| `WorkflowState` | interface | Current workflow state plus the actions the server allows (PAEP v1.1 §10.1 "Workflow"). |
| `WorkflowTransitionRequest` | interface | Governed transition request; a protected write, so it carries a concurrency token (PAEP-IB-01 §7.3). |

## `identity/identity-context.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `PrincipalId` | type | Opaque principal identifier. |
| `TenantId` | type | Opaque tenant identifier. |
| `TenantContext` | interface | Active tenant / legal entity / project context shown to the user (PAEP-IB-01 §11.2(i); PAEP v1.1 §11). |
| `IdentityContext` | interface | Current identity. |
| `SessionOutcome` | type | Session outcome reported by an identity adapter; the server remains authoritative (PAEP v1.1 §10.1, §11). |

## `offline/offline-command.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `CommandSyncState` | type | Command synchronisation state. |
| `CommandContext` | interface | Tenant and principal partition of a queued command. |
| `OfflineCommandEnvelope` | interface | Immutable queued-command envelope; the payload must be JSON-serialisable. |
| `CommandConflict` | interface | A conflict keeps both the attempted change and the server state. |

## `reporting/reporting.ts`

| Type | Kind | Purpose |
| --- | --- | --- |
| `FieldDataType` | type | Semantic data type of a dataset field. |
| `MetricAggregation` | type | Declared aggregation of a governed metric; the formula stays server-side (PAEP-IR-01 Code Block 5). |
| `VisualType` | type | Neutral visual vocabulary; never a charting-library type (PAEP-IB-01 §3 "Visualization engine"). |
| `DimensionDefinition` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `MetricDefinition` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `FreshnessPolicy` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `DatasetDescriptor` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `ReportFilter` | type | Reporting shape (PAEP-IB-01 Appendix D). |
| `ReportSort` | type | Reporting shape (PAEP-IB-01 Appendix D). |
| `ReportQuery` | interface | Semantic query by dataset, metric and dimension keys; never SQL. |
| `ReportColumn` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `DataSource` | type | Reporting shape (PAEP-IB-01 Appendix D). |
| `DataFreshness` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `ReportRow` | type | One result row keyed by column key; columns are dynamic per dataset, so a record map is the model. |
| `ReportResult` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `DrillRequest` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `ExportFormat` | type | Reporting shape (PAEP-IB-01 Appendix D). |
| `ExportRequest` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `ExportJob` | interface | Asynchronous, server-authorised export job. |
| `VisualDefinition` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `DashboardDefinition` | interface | Reporting shape (PAEP-IB-01 Appendix D). |
| `ReportingGateway` | interface | Reporting port implemented by adapters (PAEP-IR-01 Code Block 5; PAEP-IB-01 Appendix D). |
