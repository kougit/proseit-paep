# IB4-FRAPPE-ADAPTER: independent QA report

- Head reviewed: `d2f8bdde0e7e68c161a895d62696b32ec88609b3` (branch `claude/project-thread-sv4pzd`)
- Baseline: Generation 5 `a50120017fc84f869043be0c2837286a6f598ef3` (`git diff a501200 d2f8bdd`, 134 files, +8895/-57)
- Reviewer posture: read-only and adversarial. No repository file was modified, and `git status` is clean after the review. Probes ran only in the scratchpad and were deleted afterwards.

## Commands executed (all read-only, all exit 0)

| Command | Result |
| --- | --- |
| `run-frappe-tests.mjs --suite unit` | PASS 64/64 in 8 files, strict compile with 0 diagnostics |
| `run-frappe-tests.mjs --suite integration` | PASS 37/37 |
| `frappe-qa.mjs` | PASS 9/9 (F01-F09) |
| `test-utils/contracts-qa.mjs` | PASS 200/200, 128 public exports |
| `enterprise-shell/enterprise-qa.mjs` | PASS 12/12 |
| `architecture-boundaries/check-boundaries.mjs` | PASS, 0 violations |

The long negative suites and verify-ib0-wp05 were not run, as instructed.

Extra probes, run in the scratchpad against transpiled copies of the sources:
- `safeReturnPath` with 17 hostile inputs: `//`, `\`, `%2F%2F`, `%5C`, dot segments (plain and encoded), `javascript:`, U+2028 and others. All unsafe forms were rejected. The forms it accepted stay on the same origin.
- `safeFileUrl` with 27 hostile inputs: foreign origin, protocol-relative, `javascript:`, `data:`, credentialed, other port, encoded traversal, `%00`, query or fragment, double slash, `%5c`. All were rejected except URLs on the backend origin that have a clean `/files` or `/private/files` path.

## Scope, boundaries and gate integrity (no findings above INFO)

- **Scope:** every changed path is inside the Generation 6 `authorisedScope`. I computed this against the registry: 0 paths are outside it.
- **Frozen surfaces:** `package-lock.json`, dependencies, engines, `packageManager`, the runtime-config schema, tsconfig and nx files are unchanged. The only `package.json` change is three new `scripts` entries.
- **Adapter imports:** the adapter imports only `@proseit/paep-contracts` (type-only) and a type from `@proseit/paep-platform`, as F01 and the architecture check confirm.
- **Reference app:** it imports the adapter only with `import type` and one literal dynamic `import()`. E01 now enforces this, and the seeded negatives N53, N54, N56 and P07 cover it.
- **No new UI or copy:** no new route (E08 unchanged and passing), screen, dialog or message key.
- **Gate diffs:**
  - I24 104->105 is authorised.
  - J16/J19 104->105 and `WP05_NEGATIVE_CASES`/`EXPECTED_CASES` 105 follow directly from GJ19. GJ19 is generated from the new mandatory job.
  - E09 admits only `frappe-sdk/src`, the `frappe-sdk` README and `contracts/src`, and only while a single well-formed CANDIDATE with an in-scope entry exists. It also adds `--no-renames`, which is a strengthening.
  - E10 is generalised to "at most one pending amendment".
  - N02 and N26 are retargeted to equivalent frozen paths, because the old targets are now in scope.
  - All the other gate changes are additions: contracts S4 vocabulary, DOM fixtures, injections, positives and negatives, plus the IB4 policy floor, the 20-minute timeout pin and the IB4 suites being exclusive to their job.
  - **I found no deleted or weakened criterion, check or negative.**
- **Secrets:** the fixtures carry only `synthetic0csrf0token0value0001`. Tracebacks and `_server_messages` appear only as synthetic markers, and the conformance test asserts they never reach any output.

## Findings

### MEDIUM

**M1. Workflow concurrency depends on the server honouring the caller's `modified` value, which stock Frappe does not do.**
- **Where:** `packages/frappe-sdk/src/lib/workflow.ts:168-176`. The claim also appears in `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md:122-126`.
- **What happens:** the code sends `{ ...current.doc, modified: token }` and says "the server rejects a write against a newer record". In stock Frappe (v13+), `frappe.model.workflow.apply_workflow` does `frappe.get_doc(parse_json(doc))` and then `doc.load_from_db()` before it saves. This replaces the client-supplied `modified`, so `check_if_latest` never sees the stale token. The only protection is therefore the adapter's own pre-check (`current.version !== token`), and that check is a time-of-check/time-of-use (TOCTOU) race.
- **Failure scenario:** a reviewer reads version V1 and clicks Approve. Between the adapter's re-read (GET doc + GET transitions) and the POST, another user edits the inspection to V2. The server applies Approve to V2, which the reviewer never saw. The synthetic fixture `workflow/transition-server-conflict.json` shows a server `TimestampMismatchError` that real Frappe will not produce on this path.
- **Fix:** make server-side enforcement part of `pmra-api-v1`. Either add a ProSEIT method (for example `pmra.api.v1.apply_workflow(doctype, name, action, expected_modified)`) that compares `modified` under a row lock, or verify on the target Frappe version and record it. Correct the design text and the fixture's provenance so they do not imply stock behaviour.

**M2. Workflow transitions are retried automatically, but nothing on the server de-duplicates them.**
- **Where:** `packages/frappe-sdk/src/lib/workflow.ts:176` (`idempotencyKey: request.idempotencyKey ?? newKey()`) together with `transport.ts:134`. Every transition therefore gets up to `maxAttempts` (default 3) on `REQUEST_TIMEOUT`, `NETWORK_UNAVAILABLE`, 502/503/504 and 429.
- **Why it matters:** ADR-011:46 states that Frappe does not honour `X-Idempotency-Key`. Design §6 relies on the concurrency token instead, but M1 shows the token is not enforced.
- **Failure scenario:** the POST commits on the server, then the 30 s timeout or a 504 from the proxy fires and the adapter re-POSTs. If the action is also valid from the next state (a loop or self-transition), it is applied twice. Otherwise the server raises `WorkflowTransitionError`, and the user is told `WORKFLOW_ACTION_NOT_ALLOWED` for a transition that actually succeeded.
- **Fix:**
  - Do not auto-retry `apply_workflow` unless the backend contract guarantees idempotency-key de-duplication.
  - On an ambiguous failure, re-read the state and return it, or a distinct "outcome unknown" error.
  - Add a negative that covers this.

**M3. The whole server document is sent in a GET query string to `get_transitions`.**
- **Where:** `packages/frappe-sdk/src/lib/workflow.ts:133` (`query: { doc: JSON.stringify(doc) }`). It is also specified in design §4:87.
- **What is sent:** `doc` is the full `/api/resource/<DocType>/<name>` payload. That includes every field, including fields outside the resource-map allowlist, child tables and long text.
- **Failure scenario 1 (privacy):** all field values land in reverse-proxy, Frappe/nginx and browser-history-style URL logs on every `getState` and `transition`. This sidesteps the allowlist intent of D5 and the "no PII in logs" spirit of AC-IB4-10.
- **Failure scenario 2 (availability):** a record with child rows or long text exceeds the ~8 KB request-line limit. nginx then returns 414, which maps to `SERVICE_FAILURE`, so workflow is permanently unusable for that record.
- **Fix:** stock `get_transitions` also calls `load_from_db()`, so send only `{ doctype, name }`, or use POST (CSRF) or a ProSEIT method taking `(doctype, name)`. Update the design table.

**M4. A failed sign-out drops the CSRF token, so every later sign-out attempt fails locally until the page is reloaded.**
- **Where:** `packages/frappe-sdk/src/lib/session.ts:81-89` (`finally { csrf.clear(); }`) together with `apps/reference-app/src/app/frappe-binding.ts:294-301`.
- **Failure scenario:**
  1. The user clicks Sign out and the POST hits a transient network error or a 503. The token is cleared, the server session stays alive, and the identity stays displayed.
  2. The binding reports `retryable: true` and re-enables the button.
  3. The next click fails immediately with `CSRF_TOKEN_MISSING`, before any request. The user cannot sign out on a shared device until they reload.
- **Fix:**
  - Clear the token only after a server success or an authentication failure. Alternatively, on a failed sign-out, re-run `check()` to re-acquire the token.
  - In the binding, on failure, re-check the session, or navigate to the server login or logout anyway.
  - Add a test for a second sign-out attempt after a failure.

**M5. A 403 from the session methods is treated as "unauthenticated", which can cause an unbounded login redirect loop.**
- **Where:** `packages/frappe-sdk/src/lib/session.ts:38` (`PERMISSION_DENIED` maps to `{ status: 'unauthenticated' }`) together with `frappe-binding.ts:338`.
- **Failure scenario:**
  1. A user who is signed in to Frappe lacks permission for `pmra.api.v1.get_session` (for example a portal/Website User, or a user with no tenant assignment for whom the method raises `PermissionError`). `get_logged_user` succeeds and `get_session` returns 403.
  2. The adapter reports this as unauthenticated, and the binding navigates to `/login?redirect-to=<path>`.
  3. Frappe's login page sees a logged-in session and redirects straight back to `redirect-to`. The app starts, gets 403 again, and redirects again, with no limit.
- **Fix:**
  - Map a 403 to `unauthenticated` only when `get_logged_user` returned `Guest` or failed with a 401 or `AuthenticationError`. Once the user is known, treat a 403 from `get_session` as `invalid` (or a not-permitted outcome).
  - Optionally add a loop guard in the binding, for example a marker in the return path, since storage is not allowed.

**M6. Valid Frappe record names that contain `/` are refused, and one such row fails a whole list page.**
- **Where:** `packages/frappe-sdk/src/lib/resources.ts:156` (`ENTITY_ID` excludes `/` and `\`) and `records.ts:272` (`identityOf` throws `MALFORMED_RESPONSE`).
- **Why it matters:** Frappe names may contain `/`, and naming series such as `INV/24-25/0001` are common in ERPNext deployments. `documentPath` already uses `encodeURIComponent`, so `/` would be safe in a path segment. Frappe's `/api/resource/<doctype>/<path:name>` route supports it.
- **Failure scenario:** a DocType named by a series with `/`. Every `records.list` rejects with `MALFORMED_RESPONSE` as soon as one row is present, `get`, workflow and files all reject with `INVALID_REFERENCE`, and freshness subscriptions to it poison the poller (see L3).
- **Fix:**
  - Allow `/` in `ENTITY_ID`, relying on `encodeURIComponent` for path use.
  - Keep `.`/`..` rejection: `transport.ts` already rejects literal dot segments, but `%2F` inside a name needs a check that it is not normalised by proxies.
  - Alternatively, skip or flag individual malformed rows instead of failing the whole page.

### LOW

| ID | Where | Issue | Concrete scenario | Suggested fix |
| --- | --- | --- | --- | --- |
| L1 | `frappe-binding.ts:326-332`, design §4/§10 | The binding checks compatibility before the session, so `pmra.api.v1.get_compatibility` must be callable by Guest. The contract does not state this. | The backend whitelists the method without `allow_guest`. A signed-out user gets a 403, then `unknown`, and the navigation locks as "environment" with no way to reach login. | State `allow_guest=True` for `get_compatibility` in the `pmra-api-v1` contract (design §4/§10), and add a fixture for it. |
| L2 | `frappe-binding.ts:326-332` | A transient compatibility failure (`unknown`, reported as `retryable: true`) blocks the shell for the rest of the page lifetime. Nothing retries. | A brief 503 at startup locks every navigation item until the user reloads. | Retry the check with bounded backoff, or report `retryable: false` so the UI does not suggest that a retry is possible. |
| L3 | `freshness.ts:349-356`, `freshness.ts:231-236` | `subscribe()` does not validate the scope. `poll()` rejects the whole batch for one bad scope (unknown record type, bad id, or the M6 names), before any request. | One consumer subscribes `{kind:'record', recordType:'x', id:''}`. Every poll then fails, backoff climbs to 300 s, and all other subscribers silently stop receiving invalidations. No resync is ever emitted. | Validate the scope in `subscribe()` and throw there. Alternatively, have `poll()` skip invalid scopes, or emit a per-scope resync. |
| L4 | `files.ts:59-63` | Attachment listing is capped at 100 with `limit_page_length=100`. The `rows.length > MAX_FILES` check can never fire, and nothing signals that the list was truncated. | A record with 150 attachments shows 100, and the user believes the evidence set is complete. | Request `MAX_FILES + 1` and reject or flag overflow, or page. |
| L5 | `files.ts:25-40` | Any server `file_url` on the backend origin under `/files/` is returned, whatever its type. Under the mandated same-origin deployment (design §10), a public uploaded `.html` or `.svg` runs script on the application's origin when it is opened. | A user uploads `x.html` as an attachment, and another user opens the access URL. The script runs with the app origin and can call `get_session` with credentials to read the CSRF token. | Document that consumers must download, not navigate. Restrict allowed file extensions on the backend, or have the backend serve files with `Content-Disposition: attachment` and `nosniff`. |
| L6 | `session.ts:24-31`, `transport.ts:122-126` | A server `CSRF_REJECTED` does not clear or refresh the held token. Nothing re-runs `check()` after Frappe rotates the session. | The user re-logs in another tab, which rotates the session and its CSRF token. Every write in this tab then fails with `CSRF_REJECTED` until a reload. | On `CSRF_REJECTED`, clear the token and expose the outcome so the host can re-check (or re-check once internally). |
| L7 | `transport.ts:101`, `transport.ts:127` | The caller-supplied `idempotencyKey` is not validated. An invalid header value (CR/LF, non-Latin-1) makes `fetch` throw. The error is caught as `NETWORK_UNAVAILABLE`, which is retryable, so it is retried 3 times and misreported. | A consumer passes a key that contains a newline. The user sees a "network" failure after three attempts, and nothing ever reaches the server. | Validate the key (for example `^[A-Za-z0-9_-]{8,128}$`) and reject it with `INVALID_REFERENCE`/`INVALID_QUERY` before any request. |
| L8 | `workflow.ts:181` | `transition()` returns `state.allowedActions: []` as if no actions are allowed. The real next actions are unknown. | A consumer renders `result.state` and hides every action button until it calls `getState` again. | Document this, or re-read transitions after the write and return them. |
| L9 | `evidence/IB4-FRAPPE-ADAPTER/s2-s4/s2-s4-adapter.md` (S4 row) | The record says "7 unit files (57 tests)". The same file's results table and the runner say 64 tests in 8 files (S5 added the binding file). Evidence also cites CI on `84d9529`, not the reviewed head. | A reader cross-checking AC-IB4-19 finds counts that contradict each other. | Reconcile the counts, and cite the CI run on the exact head. |
| L10 | `work-packages/IB4-FRAPPE-ADAPTER/` | AC-IB4-19 names `ACCEPTANCE_REPORT.md`, which does not exist yet. TRACEABILITY says "(N05 N26 retargeted)", but N05 is unchanged (it still matches through the new lazy-import message). The negatives jump from N54 to N56 (there is no N55). | Inaccurate records under AC-IB4-19. | Add the acceptance report before claiming PASS, and correct the TRACEABILITY wording. |

### INFO

- I1, `freshness.ts:257`, design §8: a record-type token (`modified|name` of the newest row) cannot see the deletion of a row that is not the newest. The design acknowledges this. Consumers that list a record type should still re-read on navigation.
- I2, `records.ts:246, 311-334`: the `o:<offset>` cursor is not bound to the query (filters or sort). Offset paging can duplicate or skip rows when rows are inserted concurrently. This is acceptable as documented, but worth noting for data grids.
- I3, `transport.ts:141`: retries ignore `Retry-After` on 429. Response bodies are read without a size bound; only the timeout limits them.
- I4, `transport.ts:105`: if a deployment is same-site but cross-origin, `X-Correlation-Id` needs `Access-Control-Expose-Headers`. Otherwise the request id is used silently. The same-site cross-origin case also breaks the login return, because `redirect-to` is resolved on the backend origin. Design §10 effectively requires the same origin, which is consistent.
- I5, `packages/frappe-sdk/package.json`: the description still says "placeholder ... No implementation yet". The file is outside the authorised scope, so it is correctly left alone. Fix it in a later authorised change.
- I6, `enterprise-qa.mjs` `importsOf`/`staticValueImportsOf`: both require whitespace after `import`, so a minified `import{x}from'@proseit/frappe-sdk'` would evade E01. This gap existed before IB4. `check-boundaries.mjs` and the bundle-composition check provide independent coverage.
- I7, `freshness.ts:323-327`: a permanent failure (`BACKEND_INCOMPATIBLE`, 401) keeps polling every 300 s indefinitely while subscribed. The interval is bounded, so this is acceptable.
- I8, `files.ts:92`: `FileAccess.expiresAt` is never set, because Frappe file URLs do not expire. This matches the contract's optional field, but the contract comment says "expiring".

## Positive observations

- **CSRF:** the token is held only in a closure and attached only to POST, PUT, PATCH and DELETE. A write without a token fails closed before any request.
- **Credentials:** they go only to the validated origin (HTTPS, loopback HTTP), with `redirect: 'error'`, `cache: 'no-store'` and no Authorization header.
- **Errors:** they are built only from the HTTP status and a plain-identifier `exc_type` looked up with `hasOwn`, so no server text can reach a `PaepError`.
- **Correlation ids:** validated against `^[A-Za-z0-9_-]{8,64}$`. The binding re-validates them before reporting.
- **Injection:** none found through the resource map, filters, cursors or ids.
  - DocType names are encoded and regex-limited.
  - Server field names follow `^[a-z][a-z0-9_]*$`, and reserved fields are excluded.
  - Filters are built as JSON and set through `URLSearchParams`.
  - Cursors match `^o:\d{1,9}$`.
  - LIKE patterns escape `%`, `_` and `\`.
  - The transport rejects dot segments, `//`, backslash and whitespace in paths.
- **Writes without a key:** non-idempotent writes that carry no key (logout) are never retried.
- **Freshness poller:** bounded (at most 20 scopes, 5-300 s interval, one poll in flight, capped backoff).

## Counts

| Severity | Count |
| --- | --- |
| HIGH | 0 |
| MEDIUM | 6 (M1-M6) |
| LOW | 10 (L1-L10) |
| INFO | 8 (I1-I8) |

**Verdict:** NOT READY for AC-IB4-21. There are no HIGH findings and gate integrity and scope are clean, but 6 MEDIUM findings remain open (workflow concurrency and retry, document-in-URL, sign-out CSRF, the 403 redirect loop, and names containing `/`). AC-IB4-21 requires HIGH = 0 and MEDIUM = 0.
