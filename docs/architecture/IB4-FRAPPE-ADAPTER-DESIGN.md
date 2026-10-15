# IB4 — Frappe adapter design (`@proseit/frappe-sdk`)

| Field | Value |
| --- | --- |
| Work package | IB4-FRAPPE-ADAPTER (IB4 = EQP W5), Generation 6 CANDIDATE |
| Decisions | PO/SA D1-D10 (2026-10-15); ADR-011 (ACCEPTED — PO/SA) |
| Status | Implementation design of the Generation 6 candidate; it adds no decision beyond ADR-011 |

## 1. Shape

```
apps/reference-app ──(one dynamic import)──▶ @proseit/frappe-sdk ──▶ @proseit/paep-contracts (types only)
                                              │                    ├─▶ @proseit/paep-platform (ConnectivitySource type only)
                                              └─ injectable fetch ──▶ backend origin (pmra-api-v1, same-site)
```

`createFrappeAdapter(options)` returns the seven contract ports: `session`, `records`, `workflow`, `files`,
`capabilities`, `freshness`, `compatibility`. The public value exports are exactly `createFrappeAdapter`,
`compileResourceMap`, `createFreshnessPoller` and `isPaepError` (frappe-qa F02).

| Module (`packages/frappe-sdk/src/lib/`) | Responsibility | Single point of control (frappe-qa F05) |
| --- | --- | --- |
| `adapter.ts` | factory, option bounds, composition of the ports | |
| `transport.ts` | injectable fetch, origin guard, CSRF injection, correlation header, bounded retry, timeout | |
| `session.ts` | `SessionGateway`, in-memory CSRF holder | the `X-Frappe-CSRF-Token` header |
| `login-redirect.ts` | approved server-login redirect, return-path validation | the only `location` use |
| `errors.ts` | `PaepError` normalisation and the controlled code vocabulary | the only reader of a Frappe error field (`exc_type`) |
| `resources.ts` | compiled resource map, DocType paths | the only `/api/resource/` path |
| `methods.ts` | pmra-api-v1 method endpoints | |
| `records.ts`, `workflow.ts`, `files.ts`, `capabilities.ts`, `freshness.ts`, `compatibility.ts` | one port each | |
| `correlation.ts` | request ids, server id adoption | |

## 2. Transport and security rules (D3)

* Requests go to `options.backendOrigin` only: an HTTPS origin (loopback HTTP for local work) with no credentials, path,
  query or fragment; every request path must start with `/api/` and resolve to that origin.
* `credentials: 'include'`, `redirect: 'error'` (a redirect is never followed), `cache: 'no-store'`.
* No `Authorization` header, no bearer token, no cookie access, no browser storage, no console output (frappe-qa F04).
* Every POST, PUT, PATCH and DELETE carries `X-Frappe-CSRF-Token`; without a held token it fails with
  `CSRF_TOKEN_MISSING` before any request. The token is held in a closure, never in storage, the DOM or a URL, and is
  dropped on sign-out, on the login redirect and on any failed session check.
* Each request carries `X-Correlation-Id` (`REQ-` + 16 base-32 characters); a well-formed server `X-Correlation-Id`
  (8-64 of `[A-Za-z0-9_-]`) replaces it in results and errors.
* Retries: only retryable failures (429, 502, 503, 504, network failure, timeout), at most `retry.maxAttempts`
  (1-5, default 3) with exponential backoff; a state-changing request is retried only when it carries an idempotency
  key, and every retry sends the same `X-Idempotency-Key`. Per-attempt timeout 1-60000 ms (default 30000).

## 3. Errors (AC-IB4-06)

Classification uses the HTTP status and the `exc_type` class name only (when it is a plain identifier). Server
prose, `_server_messages`, `exception`, `exc` and tracebacks are never read. Each error is a frozen `PaepError` with a
controlled `code`, its `category`, `retryable`, the correlation id, and the message key `paep.errors.<category>`
(no catalogue entry is added: IB4 adds no copy, D6).

| Server | Code | Category |
| --- | --- | --- |
| 401, `AuthenticationError` | `AUTHENTICATION_REQUIRED` | authentication |
| `SessionExpired` | `SESSION_EXPIRED` | authentication |
| `CSRFTokenError` | `CSRF_REJECTED` | authentication |
| 403, `PermissionError` | `PERMISSION_DENIED` | authorization |
| `WorkflowTransitionError`, `WorkflowPermissionError` | `WORKFLOW_ACTION_NOT_ALLOWED` | authorization |
| 404, `DoesNotExistError` | `NOT_FOUND` | validation |
| 400, 417, 422, `ValidationError`, `MandatoryError`, `LinkValidationError`, `DuplicateEntryError`, `InvalidStatusError` | `VALIDATION_FAILED` | validation |
| 409, `TimestampMismatchError` | `RECORD_CONFLICT` | conflict |
| 429, `RateLimitExceededError`, `TooManyRequestsError` | `RATE_LIMITED` (retryable) | rate-limit |
| 502, 503, 504 | `SERVICE_UNAVAILABLE` (retryable) | service-failure |
| other 5xx and statuses | `SERVICE_FAILURE` | service-failure |
| network failure / timeout | `NETWORK_UNAVAILABLE` / `REQUEST_TIMEOUT` (retryable) | service-failure |
| unparseable or wrongly shaped success body | `MALFORMED_RESPONSE` | service-failure |

Local refusals (before any request) use `UNKNOWN_RESOURCE`, `UNKNOWN_FIELD`, `UNSUPPORTED_OPERATOR`, `INVALID_QUERY`,
`INVALID_CURSOR`, `INVALID_REFERENCE`, `RETURN_PATH_REJECTED`, `WORKFLOW_UNSUPPORTED`, `WORKFLOW_UNSUPPORTED_INPUT`,
`CONCURRENCY_TOKEN_MISSING`, `FILES_UNSUPPORTED`, `FILE_URL_REJECTED`, `FILE_NOT_ATTACHED`, `CSRF_TOKEN_MISSING`,
`BACKEND_INCOMPATIBLE` and `BACKEND_COMPATIBILITY_UNKNOWN`.

## 4. The `pmra-api-v1` contract (ADR-011 §2.12)

Frappe/ERPNext interface the adapter calls:

| Use | Request |
| --- | --- |
| who is signed in | `GET /api/method/frappe.auth.get_logged_user` → `{ message: <user> }` (`Guest` = unauthenticated) |
| sign-out | `POST /api/method/logout` (CSRF) |
| list | `GET /api/resource/<DocType>?fields&filters&order_by&limit_start&limit_page_length` → `{ data: [...] }` |
| detail | `GET /api/resource/<DocType>/<name>` → `{ data: {...} }` |
| attachments | `GET /api/resource/File` filtered by `attached_to_doctype` and `attached_to_name`; `GET /api/resource/File/<name>` |
| workflow actions | `GET /api/method/frappe.model.workflow.get_transitions?doc=<document JSON>` → `{ message: [{ action, ... }] }` |
| workflow transition | `POST /api/method/frappe.model.workflow.apply_workflow` `{ doc, action }` (CSRF, idempotency key) → `{ message: <document> }` |

The two ProSEIT backend methods:

| Method | Response `message` |
| --- | --- |
| `GET /api/method/pmra.api.v1.get_compatibility` | `{ api_contract: "pmra-api-v1", minimum_paep: "<major.minor>", maximum_paep: "<major.minor>" \| null }` |
| `GET /api/method/pmra.api.v1.get_session` | `{ user, full_name, tenant: { id, name }, csrf_token, expires_at?, capabilities: [{ id, enabled }] }` |

`csrf_token` is `[A-Za-z0-9]{8,256}`; `expires_at` is ISO 8601 with an offset; a capability id is a lower-case dotted
key whose first segment is a record-type key (or an application-wide key). `user` must equal the logged-in user.

Compatibility (D10, fail safe): the configured `backend.compatibility.apiContract` must be `pmra-api-v1`, the backend
must report the same contract, and the adapter's PAEP line (1.1) must lie within the backend range. A mismatch is
`incompatible`; an error, a missing method or a malformed answer is `unknown`. Records, workflow, files, capabilities
and freshness wait for a verified compatible result (cached once compatible; `unknown` is checked again on the next
call) and otherwise reject with `BACKEND_INCOMPATIBLE` or the retryable `BACKEND_COMPATIBILITY_UNKNOWN`.

## 5. Resource map (AC-IB4-03)

`compileResourceMap({ <recordType>: { doctype, fields, sortable?, filterable?, workflow?, files? } })` validates and
freezes the map: semantic record-type and field keys, a DocType name pattern (`File` is reserved for the files port),
lower-case server field names other than the system fields the adapter reads itself (`name`, `modified`, ...), sort
keys and filter operators restricted to mapped fields, and a workflow vocabulary mapping server state and action names
to semantic keys and message keys. The compiled handle exposes only the record-type keys; the DocType names never leave
the adapter. Lists are cursor-paged (`o:<offset>`, page size 1-100, default 20, one extra row to detect a next page) and
ordered by the requested allowlisted keys, then `modified desc, name asc`. `contains` and `startsWith` escape `%`, `_`
and `\`. Field values are JSON scalars or bounded lists of scalars; any other shape is a malformed response.

## 6. Workflow, concurrency and idempotency (AC-IB4-04, -07)

The concurrency token is the server's `modified` value (`ConcurrencyMetadata.serverVersion`). `getState` reads the
document and the server's transition list, offering only actions in the approved vocabulary. `transition` re-reads
both, refuses a stale token (`RECORD_CONFLICT`) or an action outside the latest server set
(`WORKFLOW_ACTION_NOT_ALLOWED`) before any write, then applies the action with the caller's token as the document's
`modified`, so the server also rejects a write against a newer record. A transition reason or evidence list is refused
(`WORKFLOW_UNSUPPORTED_INPUT`) because pmra-api-v1 carries neither. Every write carries an idempotency key (the
caller's, or a generated one) kept on every retry; Frappe does not deduplicate plain resource writes, so the adapter
never claims replay safety, and the concurrency token is the protection against a duplicate transition.

## 7. Files (AC-IB4-05)

Metadata comes from the File resource of the owner record; the checksum is the server's `content_hash` (MD5) when
present; the content type is a display label derived from the file name. An access URL is the server's `file_url`
only after it passes all checks: a `/files/...` or `/private/files/...` path, or an absolute URL on the backend origin;
no protocol-relative form, other scheme, credentials, query, fragment, backslash, whitespace, control character,
encoded or plain dot segment or double slash. The File document must be attached to the requested owner record.

## 8. Freshness (D4, AC-IB4-08)

`freshness.poll({ scopes, cursor })` reads one change token (`modified|name` of the newest row, or none) per scope
(1-20 scopes) and returns invalidation signals with no data plus an opaque cursor. The first poll of a scope sets its
baseline; a changed token (including a deleted record) yields `changed`; an unreadable cursor yields `resync` for every
scope. `createFreshnessPoller({ gateway, intervalMs?, connectivity?, timers? })` starts on the first subscription,
keeps one poll in flight, enforces 5 s to 300 s intervals (default 15 s), backs off exponentially after a failure,
emits `resync` for every subscribed scope when a poll succeeds after a failure or when connectivity returns from
offline, and stops when the last subscription ends. Listeners reconcile through an authoritative read. A record-type
token sees creations and updates; a deletion that is not the newest row is seen at the next record read. The native
Socket.IO transport stays deferred (ADR-011 §2.10).

## 9. Reference application binding (S5, D6/D7)

`apps/reference-app/src/app/frappe-binding.ts` loads the adapter with one dynamic `import()` (C1 unchanged) and backs
the shell's existing session and access ports when `deployment.environment` is not `development`; the development
profile keeps the IB3 sample providers. The application exposes no record type (empty resource map). Startup checks
compatibility first: a blocked backend locks the navigation with the existing `environment` lock state and reports a
`version` error (kind and reference only). A compatible backend is followed by the session check: authenticated sets
the shell identity; unauthenticated or expired goes to the server-hosted login with the current route as return path;
invalid reports an `unknown` error. Sign-out is the server call, then the server login. No route, screen, dialog,
component or copy is added.

## 10. Deployment

* Serve the backend same-site with the application: the same origin, or a reverse proxy that keeps the Frappe session
  cookie first-party (ADR-011 §4). Cross-site deployment is not supported.
* Add the backend origin (`backend.apiBaseUrl`) to the CSP `connect-src` of the strict profile
  (`apps/reference-app/deployment/csp-strict.json`, "A deployment adds its own origins"); no wildcard, scheme-only or
  plain-HTTP source (frappe-qa F08).
* The backend publishes `pmra.api.v1.get_compatibility` and `pmra.api.v1.get_session` as defined in §4.
* No runtime-configuration schema change: the adapter reads `backend.apiBaseUrl`, `backend.compatibility.apiContract`
  and `schemaVersion` only.

## 11. Verification

`npm run qa:frappe` (unit suite, static gate F01-F09 and its seeded negatives), `npm run qa:integration` (fixture
conformance over `tooling/frappe-adapter/fixtures/`, synthetic and versioned) and `npm run qa:ib4:ci-negative`
(mandatory-job negatives) run in the mandatory `PAEP / frappe-adapter` job.
