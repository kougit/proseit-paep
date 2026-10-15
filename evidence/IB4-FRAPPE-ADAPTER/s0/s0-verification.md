# IB4-FRAPPE-ADAPTER — S0 pre-push verification

Verified on local commit `2b6eb9281a08bdadde0964e212da9d2453698dbe` (S0 scaffold plus the recorded PO/SA scope decision),
before any push, as required by the PO/SA S0 scope decision of 2026-10-15T13:06Z (`s0-scope-decision.md`).
Node 24.21.0, npm 11.19.0. Logs are in `logs/`.

## Required checks for case I24 (`logs/s0-i24-verification.log`, 7/7 PASS)

| # | Required verification | Result |
| --- | --- | --- |
| V1 | The authoritative WP05 suite contains exactly 105 declared cases | PASS: 105 declared at run time; pinned list, `EXPECTED_CASES`, `WP05_NEGATIVE_CASES` and the partition check (26 + 32 + 47) agree |
| V2 | The increase 104 → 105 is attributable only to the frappe-adapter mandatory-job case | PASS: only GJ19 added; `MANDATORY_JOBS` gained only `frappe-adapter` (job 19); static case declarations unchanged |
| V3 | I24 still verifies exactly 32 cases for part b | PASS: weakened harness reports "ran 1 of 105 declared cases; expected exactly its 32" |
| V4 | I24 fails if the declared total is incorrect | PASS: the old 104 expectation, 103/106 and part-b 31/33 variants do not match |
| V5 | No other line in `tooling/design-system/ci-governance-negative.mjs` changed | PASS: numstat 1/1 against Generation 5; the single line is exactly the approved delta |
| V6 | `package-lock.json` and the dependency set unchanged | PASS |
| V7 | Every changed path inside the frozen 21-path S0 `authorisedScope` | PASS |

## Gates and negative suites

| Suite | Result |
| --- | --- |
| Governance (`qa:baseline`) | PASS 13/13; candidate G6 NOT ACCEPTED |
| Governance negatives (`qa:baseline:negative`) | PASS 105/105 |
| IB0-WP05 verification (full) | PASS 25/25 |
| IB0-WP05 negatives part a / b / c | PASS 26/26, 32/32, 47/47 (105) |
| IB2 CI-governance negatives (includes I24) | PASS 27/27 |
| IB3 CI-governance negatives | PASS 20/20 |
| IB4 CI-governance negatives | PASS 9/9 |
| Enterprise-shell QA / negatives | PASS 12/12, 63/63 |
| Design-system IB3 extension negatives | PASS 34/34 |
| Frappe adapter static QA / negatives | PASS 9/9, 34/34 |
| Frappe unit / integration runners (no suites yet at S0) | PASS 0/0, strict compile 0 diagnostics |
| Contracts QA | PASS 148/148 |
| Architecture boundaries | PASS, 0 violations |
