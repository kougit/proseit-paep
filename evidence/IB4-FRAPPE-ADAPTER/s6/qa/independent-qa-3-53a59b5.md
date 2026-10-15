# IB4-FRAPPE-ADAPTER — independent QA pass 3

Head reviewed: 53a59b5a7a3168d99c5f3770a7875525bb4fb5bc (branch claude/project-thread-sv4pzd), against the Generation 5
baseline a50120017fc8 (`git diff a501200 53a59b5`), with the fix delta `git diff fa0887a 53a59b5` (commits 085da9f and
53a59b5). Reviewer: independent, read-only. Working tree clean before and after; no tracked file was modified by any
command, so nothing had to be restored.

## Checks run (all PASS)

| Command | Result |
| --- | --- |
| `run-frappe-tests.mjs --suite unit` | PASS 64/64 in 8 files, strict compile 0 diagnostics |
| `run-frappe-tests.mjs --suite integration` | PASS 37/37 |
| `frappe-qa.mjs` | PASS 9/9 |
| `contracts-qa.mjs` | PASS 200/200 |
| `enterprise-qa.mjs` | PASS 12/12 (E09 scope, E10 CLAUDE.md delta) |
| `check-boundaries.mjs` | PASS, 0 violations |

Scope: all 138 paths changed since a501200 are covered by the Generation 6 `authorisedScope` (21 entries, checked
with `covers()` from `tooling/governance/baseline-governance.mjs`): 0 outside. Since fa0887a there is no change to
`package.json`, `package-lock.json`, engines, the runtime-config schema, `.github/` (CI timeouts unchanged; the new
`frappe-adapter` job is still 20 min and in `MANDATORY_JOBS`), `ACCEPTANCE.md`, `WORK_PACKAGE.md`, or any gate script
other than `shell-qa.mjs`. In `apps/reference-app` only `frappe-binding.ts` changed: logic only, no route, screen,
dialog, component or copy.

## Verification of the claimed fixes

| Finding | Verdict on 53a59b5 |
| --- | --- |
| F2: sign-out kept the token, against ADR-011 D3 (item 5) | **Fixed.** `session.ts:92-97` clears the token in a `finally` on every outcome. That includes a local `CSRF_TOKEN_MISSING` throw and a 429 that the transport retried. The module header and design §2 (line 41-42) now match ADR-011 line 24. The retry path is to re-run `check()` for a fresh token, which the unit test covers (`session.test.mjs:68-77`). |
| F3: every authentication-category error treated as signed out | **Fixed.** `frappe-binding.ts:75-77` signs the user out only on `SESSION_EXPIRED` / `AUTHENTICATION_REQUIRED`. `CSRF_REJECTED` (400 CSRFTokenError, `errors.ts:51`), `CSRF_TOKEN_MISSING`, `PERMISSION_DENIED`, 5xx and network failures now keep the user signed in, report `unknown`/retryable and re-run `check()`. The test with the shipped CSRFTokenError shape is at `reference-binding.test.mjs:107-113`. If the re-check finds the session gone (for example, a logout the server processed but whose response was lost), it goes to the login. That is correct. |
| F8: an unusual server name failed a whole page | **Fixed, no path weakening.** `identityOf` (`records.ts:43`) now uses `validServerName` (`resources.ts:130`: bounded, no control character or backslash). Every request path still goes through `validEntityId` first: `records.ts:129`, `workflow.ts:62,69`, `files.ts:51,70,81`, `freshness.ts:47,165`. `get` and `latest` still require `name === requested id`. The test proves a list item `A//B` is returned, but `get` on it is refused with no request (`records.test.mjs:56-61`). The freshness token `${version}\|${id}` is still unambiguous, because `modified` contains no `\|`. |
| shell-qa.mjs `serveStrict().close()` | **Shutdown only, no check weakened.** The diff is +5/-1 inside the `close` closure (`shell-qa.mjs:118-123`). `close()` is called only in `finally` blocks after `problems` is computed (`shell-qa-negative.mjs:192`) and at the end of the run (`shell-qa.mjs:923`, `shell-qa-negative.mjs:228`), so dropping keep-alive sockets cannot change a result. No criterion, case, count or expectation changed. `closeAllConnections` exists in Node ≥18.2 and the pinned toolchain is Node 24. |

### Robustness of the binding's re-check after a failed sign-out

- **No loop.** The re-check runs once per user click. Its result never calls `signOut()`.
- **Unhandled rejection.** Not reachable with this adapter: `check()` catches everything (`session.ts:63-86`). The
  contract port (`packages/contracts/src/lib/identity/session.ts:17`) does not promise that, though, and the
  `.then(...)` result is not caught (INFO, F25).
- **Repeated clicks and state races.** These are a real but minor gap (F21 below). `signingOut` is set back to
  `false` before the re-check is awaited.

## Findings

### MEDIUM

**F1 (M1, carried) — `packages/frappe-sdk/src/lib/workflow.ts:73-84`.** This is unchanged since pass 2. The adapter
reads, compares, then makes a separate stock `apply_workflow` POST. That POST runs `get_doc(...)`, then
`load_from_db()`, which discards the caller's `modified`, and the server does not de-duplicate by idempotency key.
- Scenario: user A holds INS-1 at v1 and chooses Approve. User B saves INS-1 (now v2) between A's re-read and A's
  POST. The server approves v2. A approved data A never saw, and no `RECORD_CONFLICT` is raised. This goes against
  ADR-011 item 8 ("a stale write maps to conflict") and AC-IB4-07.
- Fix: a PO/SA decision. The record of it (design §6, TRACEABILITY IB4-SDK-003 "M1 OPEN pending PO/SA") is now
  accurate.

### LOW

- **F21 (new, from the F2/F3 rework) — `apps/reference-app/src/app/frappe-binding.ts:80-84`.** `signingOut.set(false)`
  runs before `await gateway.check()`. The sign-out button (`account-menu.ts:71`, `keepOpen`) becomes active again
  while the adapter holds no token.
  - Scenario: the logout POST fails with 503 and the error is reported. The user clicks "Sign out" again, as the
    retryable report invites, before the two re-check GETs return. `transport.ts:125-126` throws
    `CSRF_TOKEN_MISSING` with no request sent. The binding reports a second `unknown` error, with a reference that
    never reached the server, and starts a second check. The retry the fix promises fails, and only a third click
    works. Separately, a re-check that resolves late can `identity.set(...)` and `csrf.set(...)` after a later
    successful sign-out has cleared both. The page is normally navigating away by then, so the impact is cosmetic.
  - Fix: keep `signingOut` true until the re-check settles (set it to false after `await gateway.check()`, inside a
    `try/finally`), or ignore stale re-check results with a sequence counter. Add a binding test that clicks twice
    during the re-check.
- **F7 (carried) — `freshness.ts:45-48, 163-166`.** A well-formed but unmapped record type, or a scope that gets 403,
  fails every poll for all subscribers. Unchanged.
- **F9 (carried) — `session.ts:76`.** A session that expires between the two startup calls gives `invalid` (a
  report) instead of the login. Rare, and a reload recovers. Unchanged.
- **F10 (carried, L1)** — the compatibility method must be callable by a signed-out user. This is documented but not
  enforced.
- **F11 (carried, L2)** — a blocked startup is reported `retryable: true`, but only a reload retries it (documented).
- **F12 (carried, L4) — `files.ts:12`.** Exactly 100 attachments are truncated silently (documented).
- **F13 (carried, L6)** — after `CSRF_REJECTED` on a workflow or other write, the stale token is kept until `check()`
  runs again. On sign-out the problem is now solved, because the token is cleared and the binding re-checks. Writes
  still have no refresh path.
- **F14 (carried, L5/L8)** — upload safety rests on deployment guidance only, and the transition result has empty
  `allowedActions` (documented).
- **F16 (carried, records) — `evidence/IB4-FRAPPE-ADAPTER/s2-s4/logs/`, `s5/s5-reference-binding.md:21,26`.** The
  retained logs and the S5 bundle figure (519,868 bytes) were last written at d2f8bdd/fa0887a. 085da9f changed the
  adapter, the binding (+6 lines, statically in the initial bundle) and the tests, and did not regenerate them. The
  S5 note "Binding tests PASS 7/7" is still numerically right. Fix: regenerate logs and the B1 measurement on the
  final candidate head.

### INFO

- **F15 (records, mostly resolved).** The QA reports and the disposition table are now retained under
  `evidence/IB4-FRAPPE-ADAPTER/s6/qa/`. IB4-SDK-003 is qualified with M1, and IB4-QA-002 is IN PROGRESS. Remaining:
  `ACCEPTANCE_REPORT.md` (AC-IB4-19) does not exist yet, and this pass 3 is not yet recorded. Both are consistent with
  S6 not being finished.
- **F22 — `records.ts:117`.** List results can now carry an id (for example `A//B`) that `get`, `getState` or `files`
  refuse with `INVALID_REFERENCE` (validation, not retryable). This is intended and documented (design §5). A
  consumer opening such an item gets a validation error, not "not found".
- **F23 — `workflow.ts:85`.** The `apply_workflow` result's `name` is not compared with `request.recordId`, as `get`
  and `latest` do. This is pre-existing, the impact is negligible, and the server's own result is trusted for state
  and version only.
- **F24 — ADR reading.** ADR-011 item 5 says "local state is cleared whatever its result". The binding keeps the
  displayed identity after a failed sign-out, and keeps it even when the re-check is `invalid`. The adapter state
  (token) is cleared, and "success is reported only on a server success" requires the user not to be shown as signed
  out. I read this as consistent, but the design record could say explicitly that "local state" means the adapter's
  credential state.
- **F25 — `frappe-binding.ts:72-86`.** The promise from `.then(...)` is not caught. If an alternative
  `SessionGateway` implementation's `check()` rejects, or `beginSignIn({})` throws, the result is an unhandled
  rejection. It is not reachable with `@proseit/frappe-sdk`. A trailing `.catch(() => signingOut.set(false))` would
  close it.
- **F17-F20 (carried)** — unchanged from pass 2: the `INVALID_REFERENCE` code for a bad idempotency key, 429 ignoring
  `Retry-After`, the missing acceptance report, and the E01 type-only import under `verbatimModuleSyntax`.

## M1: the only open MEDIUM? Resolvable without changing ADR-011?

Yes, M1 is the only open MEDIUM on this head. F2 and F3 are closed, and no new MEDIUM was found.

M1 cannot be resolved without changing ADR-011 or an ACCEPTED criterion. ADR-011 item 12 names stock
`frappe.model.workflow.apply_workflow` as part of `pmra-api-v1`. That method reloads the document and ignores the sent
`modified`, so the adapter cannot make the check-and-apply atomic. A resource `PUT` with `modified` would bypass the
workflow semantics and replace the named method, which is itself a contract change.

There are two ways to close it, and both need the PO/SA:
1. Amend ADR-011 / `pmra-api-v1` to add a backend transition method that checks `modified` under a lock and
   de-duplicates by idempotency key.
2. Formally accept the residual window as a documented limitation. That qualifies ADR-011 item 8 and AC-IB4-07, so
   it too is a recorded PO/SA amendment or waiver, not an implementation fix.

## Counts

HIGH 0 · MEDIUM 1 (F1/M1) · LOW 9 (F21 new; F7, F9, F10, F11, F12, F13, F14, F16 carried) · INFO 9 (F15, F17-F20,
F22-F25). The scratch file `changed.txt` in this folder is a path list used for the scope check only.

## Verdict

F2, F3 and F8 are correctly fixed with no new path, header or credential weakness. The `shell-qa.mjs` change affects
shutdown only. Scope, dependencies, CI and gates are intact. One open MEDIUM (M1) remains, and it needs a PO/SA
ADR-011 / AC-IB4-07 decision. **Not ready for acceptance until M1 is decided.** F21 is a small binding robustness
fix worth making first.
