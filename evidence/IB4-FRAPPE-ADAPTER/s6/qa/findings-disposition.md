# IB4-FRAPPE-ADAPTER — independent QA findings and dispositions

Independent, read-only QA passes were run by a separate reviewer on exact heads (reports in this folder).

| Pass | Head | HIGH | MEDIUM | LOW | INFO |
| --- | --- | --- | --- | --- | --- |
| 1 | d2f8bdd | 0 | 6 | 10 | 8 |
| 2 | fa0887a | 0 | 3 | 10 | 4 |
| 3 | 53a59b5 | 0 | 1 (M1) | 9 | 9 |
| 4 (M1 closure) | 25a7c53 | 0 | 1 (Q4-M1) | 4 | 3 |
| 5 (M1 closure) | bed21bc | 0 | 1 (Q5-M1) | 1 | 1 |
| 6 (M1 closure, final) | 1b1e5a1 | 0 | **0** | 1 | 1 |

## MEDIUM findings

| ID | Finding | Disposition |
| --- | --- | --- |
| M1 / F1 | Stock `apply_workflow` reloads the document and ignores the caller's `modified`; a concurrent change between the adapter's re-read and the apply is not detected, and the server does not de-duplicate by idempotency key. | **CLOSED** (pass 6 on 1b1e5a1). PO/SA "PAEP IB4 — M1 DECISION, WORKFLOW CONCURRENCY / ADR-011" (2026-10-16, APPROVED — ADD METHOD): the adapter writes a transition only through the atomic `pmra.api.v1.apply_transition` method, which checks the expected version and applies the action in one backend operation; the pre-check is advisory; no fallback. ADR-011 amended (§2.8, §2.12, §4; stays ACCEPTED); method contract in design §4.1; proofs A–F and the fail-safe case in `workflow.test.mjs`; fixtures 1.1.0; frappe-qa F05 with N36/N37. Production use depends on the OPEN backend-adoption obligation PAEP-IB4-BACKEND-ATOMIC-TRANSITION. |
| M2 | Writes auto-retried after a timeout or 5xx although Frappe does not de-duplicate. | Fixed in fa0887a: writes are re-sent only after a 429; confirmed by pass 2. |
| M3 | Full document JSON in the `get_transitions` query. | Fixed in fa0887a: only `{doctype, name}` (and the version on apply); confirmed by pass 2. |
| M4 | A failed sign-out cleared the token, so a retry always failed. | First fix (fa0887a) kept the token, which pass 2 found contradicts ADR-011 §5 (F2). Reworked: the adapter clears the token whatever the result (§5); the binding re-checks the session after a failed sign-out for a fresh token, so the retry works. |
| M5 | A 403 on the session method for a signed-in user was treated as unauthenticated (login loop). | Fixed in fa0887a: `invalid` with `PERMISSION_DENIED`; confirmed by pass 2. |
| M6 | Record ids containing `/` refused. | Fixed in fa0887a: `/` allowed as one encoded segment, empty/`.`/`..` segments refused; no path escape found by pass 2. F8 side effect fixed: an unusual server name no longer fails a page. |
| F2 | M4 fix contradicted ADR-011 §5. | Fixed: see M4. |
| F21 (pass 3, LOW) | The pending sign-out state ended before the session re-check settled, so a repeat click could race it. | Fixed after pass 3: the pending state lasts until the re-check settles; the promise chain has a catch (F25); a gated test proves a click during the re-check is ignored (it fails on the previous binding). |
| Q4-M1 (pass 4) | The advisory pre-check's `RECORD_CONFLICT` and `WORKFLOW_ACTION_NOT_ALLOWED` carried no correlation id. | Fixed in bed21bc (the re-read's id is carried; asserted in M1-B, M1-E and two fixtures); confirmed by pass 5. |
| Q5-M1 (pass 5) | Two fail-safe test replies inherited the caller's version, so the new unchanged-version guard masked the same-record and envelope checks (two mutants survived). | Fixed in 1b1e5a1 (each misrouted success targets its own check); pass 6: both mutants killed. |
| F3 | Every authentication-category sign-out error (including `CSRF_REJECTED`) treated as "already signed out". | Fixed: only `SESSION_EXPIRED` and `AUTHENTICATION_REQUIRED` sign the user out; any other failure keeps the user signed in, is reported, and refreshes the token. |

## LOW and INFO findings

Fixed: L3 (malformed scope refused at subscription), L7 (idempotency key validated), F8 (unusual server names in
results), L9/L10 records (counts, retargeting note, unused N55). Documented in the design record, not changed: L1
(compatibility method must be callable signed out), L2 (blocked startup recovers on reload), L4 (100 attachments per
record), L5 (deployment serves files as attachments with `nosniff`), L6/F13 (a rejected CSRF token is refreshed by the
next session check), L8 (transition result carries no allowed actions; `getState` gives the next set), F7 (an unmapped
but well-formed scope still fails polls), F9 (session expiry between the two startup calls reports instead of
redirecting), INFO items. None of these is HIGH or MEDIUM.

## M1 closure LOW and INFO findings

Fixed: Q4-L1 and Q5-L1 (method contract in design §4.1: lock order, key scope, retention and uniqueness, command
identity, 409 vs 417, rollback), Q4-L3 (ADR references §2.8 / §2.12), Q4-I1 (a success that reports the caller's
version unchanged is not trusted), Q4-I2 (transport comment), Q6-L1 (a duplicate key is refused with
`ValidationError`, design §4.1, in the records commit after pass 6). Documented: Q4-L2 (the compatibility check
cannot detect a backend that claims `pmra-api-v1` without the method; the fail-safe is the technical control and the
backend-adoption obligation the governance control). Records: Q4-L4 (this file, the acceptance report and the
traceability, updated after pass 6). No action: Q4-I3, Q5-I1, Q6-I1.

## CI hang in `PAEP / shell-browser` (heads d2f8bdd and fa0887a)

The browser-QA negative suite hung inside a strict-CSP case until the job was cancelled (after S46 on d2f8bdd, after
S41 on fa0887a). Reproduced locally with a stress loop of the strict-CSP case on two cores: `serveStrict().close()`
waited up to 66 s for keep-alive connections that the still-open browser context held (`server.close()` waits for
every open connection). Fix (`tooling/enterprise-shell/shell-qa.mjs`): `close()` also calls
`server.closeAllConnections()` after the page work is done. Same stress loop after the fix: 60/60 iterations, longest
close 17 ms. No check, case or expectation changed.
