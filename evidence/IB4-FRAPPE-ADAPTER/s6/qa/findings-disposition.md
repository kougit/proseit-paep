# IB4-FRAPPE-ADAPTER — independent QA findings and dispositions

Independent, read-only QA passes were run by a separate reviewer on exact heads (reports in this folder).

| Pass | Head | HIGH | MEDIUM | LOW | INFO |
| --- | --- | --- | --- | --- | --- |
| 1 | d2f8bdd | 0 | 6 | 10 | 8 |
| 2 | fa0887a | 0 | 3 | 10 | 4 |
| 3 | 53a59b5 | 0 | 1 (M1) | 9 | 9 |

## MEDIUM findings

| ID | Finding | Disposition |
| --- | --- | --- |
| M1 / F1 | Stock `apply_workflow` reloads the document and ignores the caller's `modified`; a concurrent change between the adapter's re-read and the apply is not detected, and the server does not de-duplicate by idempotency key. | **OPEN — PO/SA decision requested** (not resolvable in the adapter: ADR-011 §12, ACCEPTED, names stock `apply_workflow`; closing it needs a server-side atomic check, a change to the `pmra-api-v1` definition). Documented as an open limitation in the design record §6. |
| M2 | Writes auto-retried after a timeout or 5xx although Frappe does not de-duplicate. | Fixed in fa0887a: writes are re-sent only after a 429; confirmed by pass 2. |
| M3 | Full document JSON in the `get_transitions` query. | Fixed in fa0887a: only `{doctype, name}` (and the version on apply); confirmed by pass 2. |
| M4 | A failed sign-out cleared the token, so a retry always failed. | First fix (fa0887a) kept the token, which pass 2 found contradicts ADR-011 §5 (F2). Reworked: the adapter clears the token whatever the result (§5); the binding re-checks the session after a failed sign-out for a fresh token, so the retry works. |
| M5 | A 403 on the session method for a signed-in user was treated as unauthenticated (login loop). | Fixed in fa0887a: `invalid` with `PERMISSION_DENIED`; confirmed by pass 2. |
| M6 | Record ids containing `/` refused. | Fixed in fa0887a: `/` allowed as one encoded segment, empty/`.`/`..` segments refused; no path escape found by pass 2. F8 side effect fixed: an unusual server name no longer fails a page. |
| F2 | M4 fix contradicted ADR-011 §5. | Fixed: see M4. |
| F21 (pass 3, LOW) | The pending sign-out state ended before the session re-check settled, so a repeat click could race it. | Fixed after pass 3: the pending state lasts until the re-check settles; the promise chain has a catch (F25); a gated test proves a click during the re-check is ignored (it fails on the previous binding). |
| F3 | Every authentication-category sign-out error (including `CSRF_REJECTED`) treated as "already signed out". | Fixed: only `SESSION_EXPIRED` and `AUTHENTICATION_REQUIRED` sign the user out; any other failure keeps the user signed in, is reported, and refreshes the token. |

## LOW and INFO findings

Fixed: L3 (malformed scope refused at subscription), L7 (idempotency key validated), F8 (unusual server names in
results), L9/L10 records (counts, retargeting note, unused N55). Documented in the design record, not changed: L1
(compatibility method must be callable signed out), L2 (blocked startup recovers on reload), L4 (100 attachments per
record), L5 (deployment serves files as attachments with `nosniff`), L6/F13 (a rejected CSRF token is refreshed by the
next session check), L8 (transition result carries no allowed actions; `getState` gives the next set), F7 (an unmapped
but well-formed scope still fails polls), F9 (session expiry between the two startup calls reports instead of
redirecting), INFO items. None of these is HIGH or MEDIUM.

## CI hang in `PAEP / shell-browser` (heads d2f8bdd and fa0887a)

The browser-QA negative suite hung inside a strict-CSP case until the job was cancelled (after S46 on d2f8bdd, after
S41 on fa0887a). Reproduced locally with a stress loop of the strict-CSP case on two cores: `serveStrict().close()`
waited up to 66 s for keep-alive connections that the still-open browser context held (`server.close()` waits for
every open connection). Fix (`tooling/enterprise-shell/shell-qa.mjs`): `close()` also calls
`server.closeAllConnections()` after the page work is done. Same stress loop after the fix: 60/60 iterations, longest
close 17 ms. No check, case or expectation changed.
