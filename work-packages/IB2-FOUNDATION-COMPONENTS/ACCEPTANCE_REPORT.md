# IB2-FOUNDATION-COMPONENTS — Acceptance Report

**Status: technical PASS; NOT ACCEPTED.** Acceptance is the PO/SA's decision. Baseline generation 4 is CANDIDATE and must not be promoted before acceptance, merge and the separate promotion step (`docs/architecture/BASELINE-ROLLOVER.md`). The enterprise shell is NOT STARTED.

| Item | Status |
| --- | --- |
| Technical status | PASS (local gates, independent QA, GitHub Actions in `evidence/IB2-FOUNDATION-COMPONENTS/reports/ci-report.md`) |
| Acceptance status | NOT ACCEPTED (awaiting PO/SA) |
| Acceptance criteria | 22/24 PASS (technical); AC22 and AC23 PENDING the final CI run |
| High findings open | 0 |
| Medium findings open | 0 |
| Design handoff | HOF-IB2-001 v1.1, APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-09-27) |
| Design deviations | 6 proposed adaptations pending PO/SA decision; 2 defects resolved, closure pending PO/SA confirmation |
| Visual baselines | CANDIDATE (not self-approved) |
| RR6 | Open: PO/SA line-by-line review of the governance diff |
| RR14 | ACCEPTED LOW (carried); negative-ci timeout 20 minutes, no IB2 workload |
| Registry generation 4 | CANDIDATE |

Code commit verified: see `evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/summary.txt` (fresh clone, clean `npm ci`, Node 24.21.0, npm 11.19.0).

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| IB2-AC01 | PASS | `reports/preflight.md` |
| IB2-AC02 | PASS | `qa:design-system` S01 (manifest and 176 handoff files pinned); `reports/design-handoff-reference.md`, `design-classification.md` |
| IB2-AC03 | PASS | S02 (generator `--check`, breakpoints); foundation tests; `reports/token-catalogue.md` |
| IB2-AC04 | PASS | brand validator tests (rules 1–7, Navy/Gold, synthetic petrol, rejected yellow); browser B1; negative B08; `reports/token-governance.md` |
| IB2-AC05 | PASS | `qa:design-system` S02 recomputes all 54 required pairs of `token-values.md` §1.7 from token values (negative N48); foundation contrast tests recompute 30 pairs from the catalogue |
| IB2-AC06 | PASS | browser M1 (media and simulation); component tests; negatives B12, B15 |
| IB2-AC07 | PASS | S03, S05; `qa:architecture` 0 violations; `reports/component-catalogue.md`, `component-api.md` |
| IB2-AC08 | PASS | `test:components` 254 tests in 27 spec files; zero-test guard; S09; `reports/unit-component-test-report.md`, `keyboard-focus.md` |
| IB2-AC09 | PASS | S04 over every style channel; negatives N07–N13, N27, N28, N30, N37–N44 |
| IB2-AC10 | PASS | A1: 240 page audits, 0 violations; O1 (24 overlay audits, focus returned); U1; K1; S10; `reports/accessibility-report.md` |
| IB2-AC11 | PASS | A2 at 320 px on every page; D1; `reports/responsive-320-report.md` (residual RR15, DDR-IB2-01) |
| IB2-AC12 | PASS | C1, D1, F1, B1 |
| IB2-AC13 | PASS | S07 (25 specimens, 185 required states); `reports/ui-lab-coverage.md` |
| IB2-AC14 | PASS (baselines CANDIDATE) | `visual/` (156 captures); `reports/visual-conformance.md` (49 rows: 37 conform, 12 conform with a recorded deviation, 0 do not conform) |
| IB2-AC15 | PASS | S06; `reports/clean-room-provenance.md` |
| IB2-AC16 | PASS | W06, W16, W22; negatives I06–I08, I10, I11; `reports/dependency-review.md` |
| IB2-AC17 | PASS | W11, W12 (IB2 command floor); negatives I01–I05, I12–I14; `reports/ci-report.md`, `performance-timing.md` |
| IB2-AC18 | PASS | `qa:ib0-wp05` full; WP05 negatives; `qa:ib1`; `qa:ib1:negative`; `qa:baseline`; `qa:baseline:negative` (logs) |
| IB2-AC19 | PASS | `qa:types`; both production builds; `qa:architecture`; W04; Angular 22.1.8 / TypeScript 6.0.3 |
| IB2-AC20 | PASS | `qa:baseline` 13/13 (active G3, candidate G4 NOT ACCEPTED); W07, W26; negative I15 |
| IB2-AC21 | PASS | `reports/independent-qa.md`: rounds 1 and 2 and Q10 (with its fixes); High 0, Medium 0 |
| IB2-AC22 | PENDING (generated after the final CI run) | `evidence/IB2-FOUNDATION-COMPONENTS/review/PO-SA-GOVERNANCE-DIFF.txt` (untracked, delivered separately) |
| IB2-AC23 | PENDING CI | `reports/ci-report.md` |
| IB2-AC24 | PASS | W02, W08; WP02–WP04 secret scans |

## 2. Decisions recorded for the PO/SA

1. Design classification: D1 (Design Significant) for the foundation and the 25 components; D2 (Design Extension) for the UI laboratory; tooling, CI and governance are not UI work and are not classified (`reports/design-classification.md`).
2. Component tests use Angular's `@angular/build:unit-test` with Vitest browser mode in the installed Chromium (the approved dependency set; RR11 re-evaluation for UI tests).
3. The IB2 browser and static gates run in the new parallel `PAEP / components` and `PAEP / accessibility` jobs, both mandatory in `PAEP / gate`. `PAEP / negative-ci` is unchanged (RR14).
4. The WP05 verifier is tightened for IB2 (exact dependency delta, lockfile hash, negative-ci timeout exactly 20, IB2 command floor). Bounded historical findings are listed in `WORK_PACKAGE.md` §7.

## 3. Items for PO/SA review before acceptance

- The governance diff (RR6): every change under `.github/**`, `tooling/verification/**` and `tooling/governance/**`.
- The eight design deviation records and the CANDIDATE visual baselines.
- `reports/acceptance-readiness.md` lists these decisions.

## 4. Residual risks

`evidence/IB2-FOUNDATION-COMPONENTS/reports/residual-risk.md`: all Low or Info.
