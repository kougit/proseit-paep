# IB4-FRAPPE-ADAPTER — Acceptance Report

**Overall technical status: PASS — every mandatory Claude criterion (AC-IB4-01 to AC-IB4-21) is PASS on the candidate head; M1 is closed under the PO/SA M1 decision of 2026-10-16.** Technical PASS is not ACCEPTED; AC-IB4-22 is the PO/SA's decision. Generation 6 stays
CANDIDATE; nothing is merged or promoted.

| Item | Status |
| --- | --- |
| Work package | IB4-FRAPPE-ADAPTER (= EQP W5), PO/SA implementation authorisation 2026-10-15 |
| Generation 6 | CANDIDATE (`tooling/governance/baseline-registry.json`); active accepted baseline Generation 5 (1046243) |
| S0 scope decision | PO/SA 2026-10-15 13:06Z APPROVED WITH BOUNDARY: `tooling/design-system/ci-governance-negative.mjs` I24 104 → 105 only; scope frozen at 21 paths; no later path added (`evidence/IB4-FRAPPE-ADAPTER/s0/`) |
| Candidate head | implementation 1b1e5a1 (the regression and QA basis) plus this records-only commit; PR #14 (draft) |
| CI | 1b1e5a1 run 38972620462: 20/20 green, `PAEP / gate` success. CI on the final records head is cited in the readiness pack |
| Local regression on the candidate head | 20/20 suites PASS on 1b1e5a1, run one at a time, plus types, production build and bundle composition (`evidence/IB4-FRAPPE-ADAPTER/s6/m1/logs/`; the earlier run on 97bb548 is in `s6/logs/`) |
| Independent QA | Pass 1 (d2f8bdd) H0/M6; pass 2 (fa0887a) H0/M3; pass 3 (53a59b5) H0/M1; M1 closure passes 4 (25a7c53) H0/M1, 5 (bed21bc) H0/M1, **6 (1b1e5a1) H0/M0/L1**. Open HIGH 0, MEDIUM 0 (`evidence/IB4-FRAPPE-ADAPTER/s6/qa/`) |
| M1 decision | PO/SA 2026-10-16 "PAEP IB4 — M1 DECISION, WORKFLOW CONCURRENCY / ADR-011": APPROVED — ADD METHOD. Implemented: workflow writes only through the atomic `pmra.api.v1.apply_transition` method; ADR-011 amended (§2.8, §2.12, §4) and still ACCEPTED |
| Backend-adoption obligation | PAEP-IB4-BACKEND-ATOMIC-TRANSITION: OPEN. Workflow writes must not be enabled in a product pilot or production until the target backend implements and validates the method (ADR-011 §4; design §4.1). Until then a transition fails safe |
| Carried obligations | PAEP-LOC-AR-PILOT, PAEP-LOC-HE-PILOT, PAEP-A11Y-AT-PILOT: OPEN, unchanged |

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-IB4-01 | PASS | `run-frappe-tests --suite integration` 39/39 (manifest check plus one test per fixture; 38 synthetic fixtures (set 1.1.0) over 4 compatibility profiles, sha256-pinned); every contract port implemented (`packages/frappe-sdk/src/lib/`); `frappe-qa` F06 |
| AC-IB4-02 | PASS | `session.test.mjs` 8, transport CSRF cases, `reference-binding.test.mjs`; CSRF in memory only (session test with storage/cookie/global traps); fails closed before any request; sign-out server-authoritative and clears the token whatever its result (ADR-011 §5); 403 on the session method for a signed-in user is `invalid` (no login loop); F04/F05/F07; negatives |
| AC-IB4-03 | PASS | `records.test.mjs` 6 (compiled map, allowlisted fields/operators/sort, cursor paging, refusal before any request, `/` ids as one encoded segment, dot/empty segments refused); F05 keeps `/api/resource/` in `resources.ts` only |
| AC-IB4-04 | PASS | `workflow.test.mjs` 16: actions from the latest server set and the approved vocabulary only; refusal before any write; the write goes only through the atomic transition method, which revalidates the action (M1-D: an action no longer allowed is rejected by the server, no transition); server denial → authorization (M1-F); fixtures `transition-denied`, `transition-permission-denied`, `action-not-offered`; frappe-qa F05 (no `apply_workflow`), N36/N37 |
| AC-IB4-05 | PASS | `files.test.mjs` 7 and 6 file fixtures: only server URLs on the backend origin; foreign, protocol-relative, script, data, credentialed, traversal URLs refused; attachment owner checked; checksum when present |
| AC-IB4-06 | PASS | transport error-normalisation cases; conformance leak checks on every error fixture (no `_server_messages`, `exc`, `exception` or traceback text in any error) |
| AC-IB4-07 | PASS | stale token → `RECORD_CONFLICT` with a correlation id: by the advisory re-read before any write, and by the server in the same operation as the apply (M1-B, M1-C: a change after the re-read is a conflict, nothing applied, then reconcile and succeed); key kept on every retry and sent to the method; one business effect for a repeated command (M1-E); writes re-sent only after a 429, bounded; absent method fails safe with no fallback; fixtures `transition-stale`, `transition-server-conflict`, `transition-method-absent` |
| AC-IB4-08 | PASS | `freshness.test.mjs` 7: data-free invalidation signals; resync after recovery and reconnect; bounded scopes and interval; malformed scope refused at subscription |
| AC-IB4-09 | PASS | `compatibility.test.mjs` 5 and compatibility fixtures: compatible proceeds; known incompatible blocked; unknown/unverifiable blocked; the binding locks navigation with the existing `environment` state and reports kind `version` |
| AC-IB4-10 | PASS | correlation id on every request and in every `PaepError` after a request (including the advisory pre-check refusals, Q4-M1); malformed server ids ignored; reports carry kind and reference only |
| AC-IB4-11 | PASS | `qa:architecture` 0 violations (20 edges, 1 optional); `qa:enterprise` E01 (lazy/type-only adapter import in the app); `frappe-qa` F01-F03; bundle composition 7/7 incl. C1 (no Frappe SDK source in the initial bundle; the adapter is a lazy chunk). Initial bundle B1 on 97bb548: 520,359 bytes raw (hard maximum 525,000) and 122,308 bytes transfer (hard maximum 150,000); +2,795 raw against the IB3 figure 517,564 |
| AC-IB4-12 | PASS | `qa:contracts` 200/200; API snapshot 101 → 128 exports (27 added, 0 removed or changed); new positives and negatives (`evidence/IB4-FRAPPE-ADAPTER/s1/`) |
| AC-IB4-13 | PASS | `qa:enterprise` E09; IB0-WP05 W06/W11: no runtime-config schema, dependency, lockfile, engine or existing CI timeout change |
| AC-IB4-14 | PASS | `frappe-qa-negative` 38/38 (37 seeded + control); `qa:enterprise:negative` 63/63; `qa:ib4:ci-negative` 9/9 |
| AC-IB4-15 | PASS | `qa:enterprise:negative` P03-P07, N40-N54, N56 (identifier N55 not used; N26 retargeted to an equivalent frozen path); WP05 filled-entry controls |
| AC-IB4-16 | PASS on the candidate head (see CI row) | `PAEP / frappe-adapter` mandatory in the gate, WP05 policy and partition (GJ19); `qa:ib4:ci-negative` 9/9 |
| AC-IB4-17 | PASS | full local regression 20/20 suites; IB0-WP05 25/25; parts a/b/c 26/26, 32/32, 47/47; IB2 CI negatives 27/27; IB3 CI negatives 20/20; baseline 13/13 and 105/105 |
| AC-IB4-18 | PASS | `frappe-qa` F07 secret scan; IB0-WP05 W08; fixtures synthetic with recorded provenance; no proprietary source |
| AC-IB4-19 | PASS | this report; `TRACEABILITY.csv`; `evidence/IB4-FRAPPE-ADAPTER/` (preflight, s0, s1, s2-s4, s5, s6) |
| AC-IB4-20 | PASS | carried obligations OPEN in `work-package.json`; no new copy, route, screen, dialog or component (`qa:enterprise` E08, `frappe-qa` F09) |
| AC-IB4-21 | PASS | M1 closure pass 6 on 1b1e5a1: HIGH 0, MEDIUM 0 (LOW Q6-L1 addressed in design §4.1 in the records commit); M1 CLOSED; passes 4 and 5 MEDIUMs fixed (`s6/qa/independent-qa-4..6`, `findings-disposition.md`) |
| AC-IB4-22 | PO/SA decision | not a Claude criterion |

## 2. Fixes made during S6

| Finding | Change |
| --- | --- |
| M2 | Writes re-sent only after a 429 |
| M3 | Workflow requests carry only the record reference and version |
| M4 / F2 / F3 / F21 | Adapter clears the token on every sign-out; binding signs out only on an expired or missing session, otherwise reports, re-checks for a fresh token, and stays pending until that settles |
| M5 | 403 on the session method for a signed-in user → `invalid` |
| M6 / F8 | `/` in ids; dot and empty segments refused; unusual server names do not fail a page |
| L3, L7 | Malformed freshness scope refused at subscription; idempotency key validated |
| WP04 S1c | Compatibility range check typed explicitly so the app builds under the relaxed-strictness control |
| M1 | Workflow writes only through the atomic `pmra.api.v1.apply_transition` method (PO/SA 2026-10-16); contract double and proofs A–F; fixtures 1.1.0; F05 no-fallback rule |
| Q4-M1 | Advisory pre-check refusals carry the re-read's correlation id |
| Q5-M1 | Fail-safe test replies target each success check separately |
| CI hang | Strict-CSP test server drops the browser's keep-alive connections on close (stress 60/60, longest close 17 ms) |

Documented, not changed (LOW/INFO): compatibility method callable signed out; a blocked startup recovers on reload; 100
attachments per record; deployment serves `/files/` as attachments with `nosniff`; a rejected CSRF token on a write is
kept until the next session check (no automatic refresh); transition results carry no allowed actions; an unmapped well-formed freshness
scope still fails polls; session expiry between the two startup calls reports instead of redirecting.
