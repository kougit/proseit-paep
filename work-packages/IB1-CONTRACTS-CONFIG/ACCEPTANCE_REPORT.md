# IB1-CONTRACTS-CONFIG — Acceptance Report

**Status: ACCEPTED by the PO/SA (2026-09-26).** Baseline generation 3 stays CANDIDATE in this commit; it becomes ACCEPTED only through the separate post-merge `promote` step (`docs/architecture/BASELINE-ROLLOVER.md` steps 8–9). IB2 is not started.

| Item | Status |
| --- | --- |
| Technical status | PASS (local gates, independent QA, GitHub Actions in `reports/ci-report.md`) |
| Acceptance Status | ACCEPTED |
| Acceptance Criteria | 27/27 PASS |
| Acceptance Authority | Product Owner / Solutions Architect |
| Acceptance Date | 2026-09-26 |
| RR6 | PASS |
| RR11 | ACCEPTED |
| RR14 | ACCEPTED — LOW |
| High findings open | 0 |
| Medium findings open | 0 |
| Registry generation 3 | CANDIDATE until the separate post-merge promotion |
| IB2 | NOT STARTED |

Code commit verified: `7ae5bca` (fresh clone, clean `npm ci`, Node 24.21.0, npm 11.19.0; `evidence/IB1-CONTRACTS-CONFIG/logs/verification-7ae5bca/`). GitHub Actions result on the PR head: `evidence/IB1-CONTRACTS-CONFIG/reports/ci-report.md`.

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| IB1-AC01 | PASS | `reports/preflight.md` |
| IB1-AC02 | PASS | `qa:contracts` S2–S4 (148/148); `reports/contract-catalogue.md`, `contract-public-api.md` |
| IB1-AC03 | PASS | `qa:contracts` S1, S5, S7; `qa:architecture` (0 violations) |
| IB1-AC04 | PASS | `qa:contracts` S6–S8; deviations from Appendix D recorded (`packages/contracts/README.md`) |
| IB1-AC05 | PASS | `qa:contracts` S9 (21 tests) |
| IB1-AC06 | PASS | `reports/runtime-config-schema.md`; schema negatives |
| IB1-AC07 | PASS | `qa:runtime-config` G1–G4; generator `--check` OK |
| IB1-AC08 | PASS | loader and parser tests; mutations M01–M09, M32–M35 |
| IB1-AC09 | PASS | content tests; mutations M11–M16, M38, M40; portability F5 |
| IB1-AC10 | PASS | semantic tests; mutations M19–M23, M36, M37 |
| IB1-AC11 | PASS | compatibility and version tests; portability F2–F4 |
| IB1-AC12 | PASS | startup tests; portability F1–F9; `reports/bootstrap-sequence.md` |
| IB1-AC13 | PASS | freeze, latch and forged-outcome tests; mutations M27–M31 |
| IB1-AC14 | PASS | portability 17/17 (S1–S4, B0–B3); `reports/deployment-profile-evidence.md` |
| IB1-AC15 | PASS | 40/40 mutations killed |
| IB1-AC16 | PASS | `main.ts` gate + one injection token; W05 scope; QA Q7 |
| IB1-AC17 | PASS | 3 edges (`platform→contracts`, `reference-app→platform`, `reference-app→contracts`), 0 violations |
| IB1-AC18 | PASS | no dependency change; lockfile sha256 `be1154cb…6b69` before and after; clean `npm ci` |
| IB1-AC19 | PASS | `qa:types`; both builds; WP04 S1c (builds with strict off) |
| IB1-AC20 | PASS | `qa:baseline` 13/13 (active G2, candidate G3 NOT ACCEPTED); `qa:baseline:negative` 105/105 |
| IB1-AC21 | PASS | `qa:ib0-wp05` 25/25; `qa:ib0-wp05:negative` 98/98 |
| IB1-AC22 | PASS | run 36252266440 (`reports/ci-report.md`); W11, W12; K01–K08, GJ10–GJ12 |
| IB1-AC23 | PASS | W08 and WP02–WP04 secret scans (in `qa:ib0-wp05`); QA Q7 |
| IB1-AC24 | PASS | W02, W04 |
| IB1-AC25 | PASS | `evidence/IB1-CONTRACTS-CONFIG/README.md`; `TRACEABILITY.csv` |
| IB1-AC26 | PASS | `reports/independent-qa.md`: no open High or Medium |
| IB1-AC27 | PASS | ready PR #8, run 36252266440 on `4c4c351`, 13/13 checks and `PAEP / gate` success (`reports/ci-report.md`) |

## 2. Decisions recorded for the PO/SA

1. Unit tests run on Node's built-in `node:test`, not Vitest (no new dependency). IB-01 names Vitest as the default. **PO/SA decision (RR11, ACCEPTED, 2026-09-26):** `node:test` is approved for the IB1 framework-neutral contracts and runtime-configuration tests; Vitest is not to be introduced merely to replace working IB1 tests; the choice is re-evaluated when Angular component/UI testing becomes substantive in IB2. This also activates the IB0-WP05 deferred unit-test stage through the new CI jobs.
2. Zero new dependencies: the schema validator is generated from the schema by project tooling.
3. PAEP compatibility version `1.1`; runtime-config schema version `1.0`; configuration signing not implemented (not required for IB1).
4. The Angular provider layer, error experience and other platform abstractions remain IB3.
5. Reporting contracts tighten IB-01 Appendix D (listed in `packages/contracts/README.md`).

## 3. Items for PO/SA review before acceptance

* `tooling/verification/verify-ib0-wp05.mjs`, `tooling/verification/negative-ib0-wp05.mjs`, `tooling/verification/ib0-wp05-ci-policy.json` and `.github/workflows/paep-ci.yml` are inside the CANDIDATE scope (`policyChange: true`). An automated gate cannot detect an edit that disables the verifier's own checks (residual risk RR6). **Done:** the PO/SA completed an independent line-by-line review of every change under `tooling/verification/**` and `.github/**` between `035593b` and `19eac59` (RR6: PASS, 2026-09-26).

## 4. Bounded successor-work findings (reuse of the accepted R7 registry bound)

Listed in `WORK_PACKAGE.md` §7 for acceptance: WP04 V07 and WP03 V09 "entry point is a placeholder" for exactly `packages/contracts/src/index.ts` and `packages/platform/src/index.ts` (in scope with B11 passing, or after promotion changed in accepted history); WP04 negative edge-count controls that differ only by the 3 edges of the unmutated graph. No other historical finding is accepted, and no authorised path was widened to obtain PASS.

**D-IB1-01 (found by the pre-acceptance rehearsal, fixed in the acceptance commit).** Rehearsing acceptance, merge and promotion of generation 3 in a scratch clone showed `qa:ib0-wp05` failing W17, W18, W20 and W21 (21/25) once generation 3 is ACCEPTED: the filled-entry bound accepted the two entry points only while they were CANDIDATE changes, so `main` would have failed right after promotion. Under the PO/SA authorisation of 2026-09-26T18:14Z, the bound in `tooling/verification/verify-ib0-wp05.mjs` now also accepts those two files as changes in accepted history since the historical verifier's baseline (the same `authorisedSince` bound every other historical finding uses). It still applies to those two files only. The rehearsal then passed before the merge, after the merge and after the promotion.

## 5. Residual risks

`evidence/IB1-CONTRACTS-CONFIG/reports/residual-risk.md`: RR1–RR14, all Low or Info. RR14 (`PAEP / negative-ci` about 71–76% of its 20-minute timeout; typically 12:08–12:27 before IB1, with a 7:27 outlier) is ACCEPTED as Low; the timeout is unchanged; a CI-performance work package is triggered if the job reaches 17 minutes or more on two consecutive successful runs, times out once, or becomes the persistent critical path.

## 6. PO/SA acceptance (2026-09-26)

Recorded under the PO/SA instruction "IB1 — FINAL PO/SA ACCEPTANCE, EVIDENCE CORRECTION, MERGE, GENERATION-3 PROMOTION AND CLOSURE" (project chat, 2026-09-26T16:32Z), after the pre-acceptance revalidation lanes A–H passed.

| # | Decision | Disposition |
| --- | --- | --- |
| 1 | IB1-CONTRACTS-CONFIG | ACCEPTED (27/27 PASS) |
| 2 | RR6 verifier and CI self-review | PASS |
| 3 | RR11 `node:test` | ACCEPTED |
| 4 | RR14 `PAEP / negative-ci` timeout headroom | ACCEPTED — LOW |
| 5 | Merge of PR #8 (merge commit) and promotion of generation 3 | AUTHORISED, subject to new-head CI, the final pre-merge gate and the promotion race gate |
