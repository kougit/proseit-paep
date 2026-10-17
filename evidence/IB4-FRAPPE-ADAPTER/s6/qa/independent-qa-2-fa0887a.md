# IB4-FRAPPE-ADAPTER — independent QA pass 2

Head reviewed: fa0887aa356a90030d0f6484561e2588293350c8 (branch claude/project-thread-sv4pzd), against the Generation 5
baseline a50120017fc8 (`git diff a501200 fa0887a`), with the fix delta `git diff d2f8bdd fa0887a`.
Reviewer: independent, read-only. No repository file was changed (working tree clean before and after).

## Checks run (all PASS, no tracked file modified)

| Command | Result |
| --- | --- |
| `run-frappe-tests.mjs --suite unit` | PASS 64/64 in 8 files, strict compile 0 diagnostics |
| `run-frappe-tests.mjs --suite integration` | PASS 37/37 |
| `frappe-qa.mjs` | PASS 9/9 |
| `contracts-qa.mjs` | PASS 200/200 |
| `enterprise-qa.mjs` | PASS 12/12 |
| `check-boundaries.mjs` | PASS, 0 violations |

Scope: every path changed since a501200 is covered by the Generation 6 `authorisedScope` (checked with
`covers()` from `tooling/governance/baseline-governance.mjs`: 0 paths outside). No `package-lock.json`, dependency,
engine or runtime-config-schema change (only three `qa:*` scripts added to `package.json`). No existing CI job
timeout changed; the new `frappe-adapter` job is 20 min and is in the gate's `needs` and `MANDATORY_JOBS`. The only
count changes are I24 104->105 (PO/SA approved) and the matching J16/J19 104->105 and WP05 `EXPECTED_CASES` 105
for the new GJ19 case. No criterion, check or negative case was removed; N02 was retargeted to `packages/offline`,
which is equivalent (still outside the scope). No new route, screen, dialog, component or copy in `apps/reference-app`.

## Verification of the claimed fixes

| Earlier | Claim | Verdict on fa0887a |
| --- | --- | --- |
| M1 workflow stale-write race | open, recorded | **Still open, MEDIUM.** Recorded accurately in the design §6. See below. |
| M2 write retried on timeout/5xx | fixed | **Fixed.** `transport.ts:141` retries a state-changing request only on `RATE_LIMITED`. Frappe's request rate limiter (`rate_limiter.apply()`) and the `@rate_limit` decorator refuse before the handler runs, so a 429 means nothing was processed. 5xx, timeout and network failure on a write are returned once (tests cover 503, 500, network). |
| M3 full document in GET query | fixed | **Fixed.** `workflow.ts:39` sends `{doctype, name}`. Stock `get_transitions` calls `frappe.get_doc(parse_json(doc))` then `load_from_db()`, so it works with a reference alone. `apply_workflow` (`workflow.ts:82`) gets `{doctype, name, modified}`, which it handles the same way. |
| M4 failed sign-out cleared the token | fixed | **Works, but goes against ADR-011 §5 and adds a new MEDIUM** (F2, F3). |
| M5 403 on the session method gave a login loop | fixed | **Fixed.** `session.ts:71-78` maps PERMISSION_DENIED from the session method to `invalid`, and the binding reports it without a redirect. A small edge case remains (F9). |
| M6 ids with "/" refused | fixed | **Fixed, no traversal found.** `resources.ts:60-62,125` allows "/" but refuses empty, "." and ".." segments. `documentPath`/`fileDocumentPath` use `encodeURIComponent`, so "/" becomes `%2F` and "%" becomes `%25`. A literal `%2e%2e` id becomes `%252e%252e`, which WHATWG URL does not treat as a dot segment. `transport.ts` `target()` still refuses `//`, dot segments, backslash and whitespace. Frappe v14 `split("/", 3)` and v15 `<path:name>` routes both receive the decoded name as one value. Side effect: F8. |
| L3 malformed scope breaks all polls | fixed | **Partly fixed** (F7). The shape is now checked at subscription. A well-formed record type that is not in the resource map, or a scope that gets 403, still fails every poll for all subscribers. |
| L7 idempotency key not validated | fixed | **Fixed.** `transport.ts:129-132` checks `^[A-Za-z0-9_.:-]{1,128}$` before any request (a CRLF injection test is present). Generated keys fit this pattern. INFO: the error code is `INVALID_REFERENCE`. |
| L1, L2, L4, L5, L8 | documented | Documented in the design (§7, §9, §10). They remain LOW (F10-F14). |
| L6 CSRF_REJECTED does not refresh the token | not addressed | Remains LOW for writes (F13). It now causes F3 on sign-out. |
| L9/L10 records | fixed | Counts and N55/N26 wording corrected. New record gaps: F15, F16. |

### M1: can the adapter close it without changing the ADR's backend contract?

**No.** Stock `frappe.model.workflow.apply_workflow` runs `frappe.get_doc(parse_json(doc)); doc.load_from_db()`. This
overwrites the `modified` the client sends, and the method never compares versions or de-duplicates by key. The
adapter cannot hold a row lock across its re-read GET and the apply POST, so the check-then-act window cannot be made
atomic from the client.

The only client-side alternative is a resource `PUT` with `modified`, which does get Frappe's
`check_if_latest`/TimestampMismatchError under `for_update`. But it bypasses the `apply_workflow` semantics:
transition `update_field`/`update_value`, docstatus submit/cancel, condition evaluation and workflow-action side
effects. It would also replace the contract's named method (ADR-011 §12), so it is itself a contract change.

Closing M1 therefore needs one of two PO/SA decisions:
- an ADR-011 / pmra-api-v1 amendment that adds a backend transition method which checks `modified` under a lock and
  de-duplicates by idempotency key; or
- formal acceptance of the residual window as a documented limitation, with AC-IB4-07's "a stale write maps to
  conflict" qualified.

## Findings

### MEDIUM

**F1 (M1, carried) — `packages/frappe-sdk/src/lib/workflow.ts:73-84`.** The concurrency check is the adapter's
read-compare, then a separate `apply_workflow` POST that ignores the sent `modified`.
- Scenario: user A reads INS-1 at version v1 and chooses Approve. User B edits INS-1 (now v2) between A's re-read and
  A's POST. The server reloads v2 and approves it. A approved data they never saw, and no `RECORD_CONFLICT` is raised,
  although ADR-011 §8 and AC-IB4-07 say "a stale write maps to conflict".
- Fix: a PO/SA decision as set out above. It is not fixable in the adapter alone.

**F2 — `packages/frappe-sdk/src/lib/session.ts:89-101` (and design §2, line 42) vs `docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md:24`.**
ADR-011 §5 (ACCEPTED) says: "Sign-out is a server call; **local state is cleared whatever its result**". The M4 fix
now keeps the CSRF token after a failed sign-out. The design record was reworded to match, but the ADR was not.
- Scenario: a logout POST returns 503. The adapter keeps the token and the shell keeps the identity, which the ADR
  forbids. TRACEABILITY IB4-SDK-001 / AC-IB4-02 still claim PASS against D3. Under CLAUDE.md a lower-priority source
  deviating from an ADR must be reported, not silently reinterpreted.
- Fix: either restore "clear whatever its result" and make a retry re-obtain the token (run `session.check()` before
  re-sending the logout), or raise an ADR-011 §5 amendment for PO/SA approval.

**F3 (new, from the M4 fix) — `apps/reference-app/src/app/frappe-binding.ts:76`.** Every `authentication`-category
error from `signOut()` is treated as "already signed out", including `CSRF_REJECTED` (and `CSRF_TOKEN_MISSING`). The
binding clears the identity and goes to the server login, but a CSRF rejection means the server session is
**still live**.
- Scenario: the token is stale, for example after a re-login in another tab or a session-data reset. The logout
  POST gets 400 CSRFTokenError; this is exactly the shipped fixture `session/csrf-rejected.json`. The binding sends
  the user to `/login?redirect-to=/`. Frappe's login page redirects an already logged-in user to `redirect-to`, so the
  user lands back in the app still signed in, with no error shown. On a shared device the user believes they are
  signed out. This also breaks ADR-011 §5 "success is reported only on a server success".
- Fix: treat only `SESSION_EXPIRED` / `AUTHENTICATION_REQUIRED` as gone. For `CSRF_REJECTED`, re-run
  `session.check()` to refresh the token and retry the logout once, or else keep the identity and report the
  retryable error. Add a binding test with the CSRFTokenError logout.

### LOW

- **F7 (L3 residual) — `packages/frappe-sdk/src/lib/freshness.ts:163-166, 45-48`.** The subscription check covers shape
  only. A well-formed but unmapped `recordType`, or one scope answered with 403, makes `lookup`/`poll` throw for the
  whole batch. Every subscriber then stops getting signals, with endless backoff. Fix: validate the scope against
  the resource map at subscription, or isolate per-scope failures.
- **F8 (new, M6 side effect) — `packages/frappe-sdk/src/lib/records.ts:43`.** `identityOf` applies the same segment
  rule to server-supplied names. One record named for example `A/` or `A//B` (possible with prompt naming) makes the
  whole list page, or a freshness poll, fail with MALFORMED_RESPONSE. Fix: accept any server name that passes the
  base regex for display, and refuse it only when it is used as a path.
- **F9 (M5 residual) — `packages/frappe-sdk/src/lib/session.ts:76`.** If the session expires between
  `get_logged_user` and the session method, Frappe answers the non-guest method with 403 PermissionError. The user
  gets `invalid` (error report) instead of the login. This is rare, and a reload recovers.
- **F10 (L1)** — compatibility is called before the session check, so it must be allow_guest. This is documented
  (design line 178) but not enforced or tested against a signed-out profile.
- **F11 (L2)** — a blocked or unknown startup is reported `retryable: true` but nothing retries it; it is documented
  as "reload".
- **F12 (L4) — `files.ts:12`.** Exactly 100 attachments are returned silently truncated; documented (design line 148).
- **F13 (L6)** — after `CSRF_REJECTED` on a workflow write the stale token is kept, so every later write fails until
  `check()` runs again. No refresh path exists.
- **F14 (L5, L8)** — same-origin active uploads are handled by deployment guidance only, which no gate checks. The
  transition result returns empty `allowedActions` (documented).
- **F15 (records) — `work-packages/IB4-FRAPPE-ADAPTER/TRACEABILITY.csv` (IB4-SDK-001, IB4-SDK-003, IB4-QA-002).**
  AC-IB4-02 and AC-IB4-07 are marked PASS with no reference to the open M1 limitation or the F2 ADR deviation. The
  previous independent QA findings and their dispositions are not retained under `evidence/IB4-FRAPPE-ADAPTER/`; only
  the design doc mentions M1. IB4-QA-002 still says NOT STARTED. Fix: retain the QA reports and a disposition table,
  and qualify the PASS rows.
- **F16 (records) — `evidence/IB4-FRAPPE-ADAPTER/s2-s4/logs/`, `s5/`.** fa0887a changed source and tests but added no
  logs, so the retained logs and the S5 bundle figure (519,868 bytes, binding +5 lines) predate the head. Fix:
  regenerate the logs and the bundle measurement on the candidate head.

### INFO

- F17: an invalid idempotency key yields `INVALID_REFERENCE` (validation, not retryable), and only after the CSRF
  check. That is acceptable, but the code name is odd.
- F18: a 429 retry ignores `Retry-After`; the backoff is bounded, so this is acceptable.
- F19: `ACCEPTANCE_REPORT.md` (AC-IB4-19) does not exist yet. That is consistent with S6 being not done; no
  COMPLETE/PASS overall is claimed.
- F20: the E01 lazy-import gate treats `import { type X } from '@proseit/frappe-sdk'` as type-only. That is correct
  with `isolatedModules` and without `verbatimModuleSyntax`, but would become a gap if `verbatimModuleSyntax` is
  enabled later.

## Counts

HIGH 0 · MEDIUM 3 (F1 carried M1, F2, F3) · LOW 10 (F7-F16) · INFO 4 (F17-F20)

## Verdict

M2, M3, M5, M6 and L7 are correctly fixed with no path, URL or header injection found. L3 is partly fixed. The M4
fix goes against the ACCEPTED ADR-011 §5 and adds a masked sign-out on CSRF_REJECTED. M1 stays open and cannot be
closed in the adapter without a PO/SA contract decision. **Not ready for acceptance: 3 MEDIUM open.**
