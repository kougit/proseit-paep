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
  dropped on every sign-out whatever its result (ADR-011 §5), on the login redirect and on any failed session check.
  A caller that keeps the user signed in after a failed sign-out runs the session check again for a fresh token.
* Each request carries `X-Correlation-Id` (`REQ-` + 16 base-32 characters); a well-formed server `X-Correlation-Id`
  (8-64 of `[A-Za-z0-9_-]`) replaces it in results and errors.
* Retries: only retryable failures (429, 502, 503, 504, network failure, timeout), at most `retry.maxAttempts`
  (1-5, default 3) with exponential backoff. A state-changing request is retried only when it carries an idempotency
  key and only after a 429 (the server refused it unprocessed); every retry sends the same `X-Idempotency-Key`
  (1-128 of `[A-Za-z0-9_.:-]`, otherwise `INVALID_REFERENCE` before any request). A timeout, network failure or 5xx
  after a write may follow a committed change and stock Frappe does not de-duplicate by key, so it is returned to the
  caller (still `retryable`, for a deliberate retry after a re-read), never re-sent. Per-attempt timeout 1-60000 ms
  (default 30000).

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
| workflow actions | `GET /api/method/frappe.model.workflow.get_transitions?doc={"doctype","name"}` (the server loads the document) → `{ message: [{ action, ... }] }` |

Stock `frappe.model.workflow.apply_workflow` is not used: it does not check the caller's version (ADR-011 §2.8, M1).

The three ProSEIT backend methods:

| Method | Response `message` |
| --- | --- |
| `GET /api/method/pmra.api.v1.get_compatibility` | `{ api_contract: "pmra-api-v1", minimum_paep: "<major.minor>", maximum_paep: "<major.minor>" \| null }` |
| `GET /api/method/pmra.api.v1.get_session` | `{ user, full_name, tenant: { id, name }, csrf_token, expires_at?, capabilities: [{ id, enabled }] }` |
| `POST /api/method/pmra.api.v1.apply_transition` `{ doctype, name, action, expected_version }` (CSRF, `X-Idempotency-Key`) | `{ record: <document with name, modified and the workflow state field> }` |

`csrf_token` is `[A-Za-z0-9]{8,256}`; `expires_at` is ISO 8601 with an offset; a capability id is a lower-case dotted
key whose first segment is a record-type key (or an application-wide key). `user` must equal the logged-in user.

Compatibility (D10, fail safe): the configured `backend.compatibility.apiContract` must be `pmra-api-v1`, the backend
must report the same contract, and the adapter's PAEP line (1.1) must lie within the backend range. A mismatch is
`incompatible`; an error, a missing method or a malformed answer is `unknown`. Records, workflow, files, capabilities
and freshness wait for a verified compatible result (cached once compatible; `unknown` is checked again on the next
call) and otherwise reject with `BACKEND_INCOMPATIBLE` or the retryable `BACKEND_COMPATIBILITY_UNKNOWN`.

### 4.1 The atomic transition method (ADR-011 §2.8, PO/SA M1 decision 2026-10-16)

`pmra.api.v1.apply_transition` performs, as one backend operation inside one database transaction, with the record row
locked (`SELECT ... FOR UPDATE`, for example `frappe.get_doc(doctype, name, for_update=True)`) from the version read to
the commit:

1. authenticate the session and check the CSRF token (Frappe's request handling);
2. accept only a DocType the ProSEIT backend exposes to PAEP (no arbitrary DocType), and resolve the record;
3. check the actor's permission on the record;
4. if the idempotency key was already used by the same user for the same command, return the stored result without
   applying anything; the same key with a different command is refused (`ValidationError`);
5. compare the record's current `modified` with `expected_version`; if they differ, apply nothing;
6. revalidate the action against the transitions allowed now for this user and state;
7. apply the transition (standard Frappe workflow semantics may be invoked here, on the locked document), store the
   idempotency result with the key, and return the new record.

| Outcome | HTTP status, `exc_type` | Adapter `PaepError` |
| --- | --- | --- |
| applied, or a replayed command | 200, `{ message: { record } }` | (result: new state and version) |
| stale version | 409, `TimestampMismatchError` | `RECORD_CONFLICT` (conflict) |
| action not allowed now | 403 or 417, `WorkflowTransitionError` / `WorkflowPermissionError` | `WORKFLOW_ACTION_NOT_ALLOWED` (authorization) |
| permission denied | 403, `PermissionError` | `PERMISSION_DENIED` (authorization) |
| record or DocType not available | 404, `DoesNotExistError` | `NOT_FOUND` |
| key reused for another command, invalid input | 417, `ValidationError` | `VALIDATION_FAILED` |
| method absent (stock Frappe: unknown command) | 417 `ValidationError`, or 404 | `VALIDATION_FAILED` / `NOT_FOUND`: the transition fails, nothing else is sent |

Error responses never reach callers as text (§3). The method name and these wire shapes stay in
`@proseit/frappe-sdk`; `@proseit/paep-contracts` is unchanged.

**Backend-adoption obligation (PAEP-IB4-BACKEND-ATOMIC-TRANSITION, OPEN).** The production ProSEIT backend lives
outside this repository and is not changed by Generation 6. Workflow writes must not be enabled in a product pilot or
in production until the target backend implements this method and validates it against this definition (the six cases
of §6 at least). Until then a transition fails safe: it is reported as failed and never falls back to stock
`apply_workflow`.

## 5. Resource map (AC-IB4-03)

`compileResourceMap({ <recordType>: { doctype, fields, sortable?, filterable?, workflow?, files? } })` validates and
freezes the map: semantic record-type and field keys, a DocType name pattern (`File` is reserved for the files port),
lower-case server field names other than the system fields the adapter reads itself (`name`, `modified`, ...), sort
keys and filter operators restricted to mapped fields, and a workflow vocabulary mapping server state and action names
to semantic keys and message keys. The compiled handle exposes only the record-type keys; the DocType names never leave
the adapter. Lists are cursor-paged (`o:<offset>`, page size 1-100, default 20, one extra row to detect a next page) and
ordered by the requested allowlisted keys, then `modified desc, name asc`. `contains` and `startsWith` escape `%`, `_`
and `\`. Field values are JSON scalars or bounded lists of scalars; any other shape is a malformed response. A record
id is 1-140 characters with no control character or backslash; it may contain `/` (Frappe naming series such as
`INV/24-25/0001`), sent as one encoded path segment, but no empty, `.` or `..` segment. A server name outside that rule
is still accepted in a result (one unusual name never fails a page), but any request about it is refused.

## 6. Workflow, concurrency and idempotency (AC-IB4-04, -07)

The concurrency token is the server's `modified` value (`ConcurrencyMetadata.serverVersion`). `getState` reads the
document and the server's transition list, offering only actions in the approved vocabulary. `transition` re-reads
both, refuses a stale token (`RECORD_CONFLICT`) or an action outside the latest server set
(`WORKFLOW_ACTION_NOT_ALLOWED`) before any write, then sends the action to the atomic transition method (§4.1) with
only the record reference, the action and the caller's version. Neither request carries another field value. The
re-read is advisory: the server's own check, under its lock, decides, so a change after the re-read is still a
conflict and nothing is applied. A transition reason or evidence list is refused
(`WORKFLOW_UNSUPPORTED_INPUT`) because pmra-api-v1 carries neither. Every write carries an idempotency key (the
caller's, or a generated one) kept on every retry, and is retried only after a 429 (§2).

**M1 (independent QA, closed by the PO/SA decision of 2026-10-16).** The earlier design applied the action with stock
`apply_workflow`, which does not compare the caller's version, so a change between the adapter's re-read and the apply
went undetected. The write now goes only to the atomic method. A success result must carry the same record; anything
else (a bare document, another record, a proxy page) is `MALFORMED_RESPONSE`. A failed transition is never retried
through another endpoint. After a conflict the caller reconciles with `getState` before another attempt. A retried
command keeps its idempotency key: a double submission reaches the server twice and has one effect; a later retry
finds the record moved on and is refused before any write. frappe-qa F05 keeps `apply_workflow` out of the adapter.

Proofs against the contract double (`tooling/frappe-adapter/test/support/backend.mjs`, `transitionBackend`;
`workflow.test.mjs` M1-A to M1-F and the fail-safe case) and fixtures (`fixtures/workflow/`):

| Case | Result |
| --- | --- |
| A. matching version | applied once; new state and version returned |
| B. stale version | conflict; nothing applied (refused by the adapter's re-read, or by the server if it reaches it) |
| C. record changed after the re-read, before the mutation | the server detects it: conflict, nothing applied; reconcile, then succeed |
| D. action no longer allowed | the server rejects it: authorization error, no transition |
| E. same idempotent command retried | one business effect; the replay returns the first result |
| F. permission denied | authorization error, no transition |
| method absent | the transition fails with a controlled error; no other request |

The result of a transition carries no allowed actions; callers read `getState` for the next set.

## 7. Files (AC-IB4-05)

Metadata comes from the File resource of the owner record; the checksum is the server's `content_hash` (MD5) when
present; the content type is a display label derived from the file name. An access URL is the server's `file_url`
only after it passes all checks: a `/files/...` or `/private/files/...` path, or an absolute URL on the backend origin;
no protocol-relative form, other scheme, credentials, query, fragment, backslash, whitespace, control character,
encoded or plain dot segment or double slash. The File document must be attached to the requested owner record.
At most 100 attachments are listed per record. The URL is returned as the server gives it; under the same-origin
deployment an uploaded active file (HTML, SVG) opened from that URL runs on the application origin, so deployments
serve `/files/` and `/private/files/` with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`
(§10).

## 8. Freshness (D4, AC-IB4-08)

`freshness.poll({ scopes, cursor })` reads one change token (`modified|name` of the newest row, or none) per scope
(1-20 scopes) and returns invalidation signals with no data plus an opaque cursor. The first poll of a scope sets its
baseline; a changed token (including a deleted record) yields `changed`; an unreadable cursor yields `resync` for every
scope. `createFreshnessPoller({ gateway, intervalMs?, connectivity?, timers? })` starts on the first subscription,
keeps one poll in flight, enforces 5 s to 300 s intervals (default 15 s), backs off exponentially after a failure,
emits `resync` for every subscribed scope when a poll succeeds after a failure or when connectivity returns from
offline, and stops when the last subscription ends. A malformed scope is refused at subscription. Listeners
reconcile through an authoritative read. A record-type
token sees creations and updates; a deletion that is not the newest row is seen at the next record read. The native
Socket.IO transport stays deferred (ADR-011 §2.10).

## 9. Reference application binding (S5, D6/D7)

`apps/reference-app/src/app/frappe-binding.ts` loads the adapter with one dynamic `import()` (C1 unchanged) and backs
the shell's existing session and access ports when `deployment.environment` is not `development`; the development
profile keeps the IB3 sample providers. The application exposes no record type (empty resource map). Startup checks
compatibility first: a blocked backend locks the navigation with the existing `environment` lock state and reports a
`version` error (kind and reference only). A compatible backend is followed by the session check: authenticated sets
the shell identity; unauthenticated or expired goes to the server-hosted login with the browser's same-origin path
and query (including the base path) as return path, or `/` when that path is not safe; invalid (including a signed-in
user denied the session method, which would otherwise loop through the login) reports an `unknown` error. Sign-out is
the server call, then the server login; a sign-out the server answers with an expired or missing session also goes
to the login; any other failure (including a rejected CSRF token) keeps the user signed in, reports a retryable error
and checks the session again for a fresh token, so a retry can work. The compatibility method must be
callable by a signed-out user (it runs before the session check), and a blocked startup is retried by reloading the
application. No route, screen, dialog,
component or copy is added.

## 10. Deployment

* Serve the backend same-site with the application: the same origin, or a reverse proxy that keeps the Frappe session
  cookie first-party (ADR-011 §4). Cross-site deployment is not supported.
* Add the backend origin (`backend.apiBaseUrl`) to the CSP `connect-src` of the strict profile
  (`apps/reference-app/deployment/csp-strict.json`, "A deployment adds its own origins"); no wildcard, scheme-only or
  plain-HTTP source (frappe-qa F08).
* The backend publishes `pmra.api.v1.get_compatibility` (callable without a session), `pmra.api.v1.get_session` and
  `pmra.api.v1.apply_transition` as defined in §4. Workflow writes stay disabled in a pilot or production until the
  target backend's atomic method is implemented and validated (§4.1, backend-adoption obligation).
* Serve `/files/` and `/private/files/` with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`,
  so an uploaded HTML or SVG file never runs on the application origin (§7).
* No runtime-configuration schema change: the adapter reads `backend.apiBaseUrl`, `backend.compatibility.apiContract`
  and `schemaVersion` only.

## 11. Verification

`npm run qa:frappe` (unit suite, static gate F01-F09 and its seeded negatives), `npm run qa:integration` (fixture
conformance over `tooling/frappe-adapter/fixtures/`, synthetic and versioned) and `npm run qa:ib4:ci-negative`
(mandatory-job negatives) run in the mandatory `PAEP / frappe-adapter` job.
