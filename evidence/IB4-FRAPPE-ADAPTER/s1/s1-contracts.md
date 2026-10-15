# IB4-FRAPPE-ADAPTER — S1 contract additions (D5)

`@proseit/paep-contracts` gains seven type-only source files and seven `export type *` lines in `src/index.ts`. No
existing contract file, export or declaration changed: the API snapshot (`tooling/test-utils/contract-api-report.json`)
went from 101 to 129 exports with 28 added, 0 removed and 0 changed, and a re-run is identical (`contracts-qa.log`).

| File | Port / types |
| --- | --- |
| `lib/identity/session.ts` | `SessionGateway` (check, signOut, beginSignIn); `SignInRequest` (application-relative return path), `SignOutResult` |
| `lib/domain/records.ts` | `RecordsGateway` (list, get); `RecordTypeKey`, `RecordRef`, `RecordFieldValue`, `RecordSummary`, `RecordDetail` (with `ConcurrencyMetadata`), `RecordListRequest`, `RecordListResult` |
| `lib/domain/workflow-gateway.ts` | `WorkflowGateway` (getState, transition); `WorkflowTransitionResult` |
| `lib/domain/files-gateway.ts` | `FilesGateway` (list, requestAccess); `FileAccessRequest`, `FileDisposition` |
| `lib/core/capabilities-gateway.ts` | `CapabilitiesGateway` (discover); `CapabilitySet` |
| `lib/core/freshness.ts` | `FreshnessGateway` (poll, pull-based); `FreshnessScope`, `InvalidationReason`, `FreshnessCursor`, `InvalidationSignal` (no data), `FreshnessPollRequest`, `FreshnessBatch` |
| `lib/config/compatibility-gateway.ts` | `CompatibilityGateway` (check); `BlockedCompatibility` (incompatible / unknown), `CompatibilityCheckResult` |

Every port is a Promise-based `*Gateway` interface; no callback, framework, Frappe, DOM, socket or transport type.

## Added exports

| Export | Kind |
| --- | --- |
| `BlockedCompatibility` | Interface |
| `CapabilitiesGateway` | Interface |
| `CapabilitySet` | Interface |
| `CompatibilityCheckResult` | TypeAlias |
| `CompatibilityGateway` | Interface |
| `FileAccessRequest` | Interface |
| `FileDisposition` | TypeAlias |
| `FilesGateway` | Interface |
| `FreshnessBatch` | Interface |
| `FreshnessCursor` | TypeAlias |
| `FreshnessGateway` | Interface |
| `FreshnessPollRequest` | Interface |
| `FreshnessScope` | Interface |
| `InvalidationReason` | TypeAlias |
| `InvalidationSignal` | Interface |
| `RecordDetail` | Interface |
| `RecordFieldValue` | TypeAlias |
| `RecordListRequest` | Interface |
| `RecordListResult` | Interface |
| `RecordRef` | Interface |
| `RecordSummary` | Interface |
| `RecordTypeKey` | TypeAlias |
| `RecordsGateway` | Interface |
| `SessionGateway` | Interface |
| `SignInRequest` | Interface |
| `SignOutResult` | Interface |
| `WorkflowGateway` | Interface |
| `WorkflowTransitionResult` | Interface |

## `qa:contracts` changes (tooling/test-utils, strengthening only)

* S4 forbidden vocabulary gains `socket`, `engine.io`, `eventsource`, `xmlhttprequest`, `csrf`, `cookie`, `bearer`.
* S4 record-map allowlist gains `RecordSummary.fields` and `RecordDetail.fields` (semantic field keys, as `PaepError.fieldErrors`).
* S5 browser-global negatives gain `WebSocket`, `EventSource`, `Headers`, `RequestInit`; checker self-tests gain a
  `socket.io-client` import, an `@proseit/frappe-sdk` import, a socket-named port, a callback subscription in a
  Gateway and a CSRF field.
* S6 positive fixtures gain 13 IB4 shapes (9 required); S7 gains 9 negative type fixtures.

Result: 200/200 checks (was 148/148), 129 public exports.
