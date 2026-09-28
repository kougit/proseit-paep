# IB2-FOUNDATION-COMPONENTS — Acceptance Readiness

**IB2 STATUS: READY FOR AUTHORIZATION.** Technical status is PASS. IB2 is NOT ACCEPTED: acceptance, the visual baselines, the proposed design deviations and the governance review are the PO/SA's decisions. Generation 4 stays CANDIDATE, and nothing was merged or promoted.

## 1. What is ready

| Area | State | Evidence |
| --- | --- | --- |
| Acceptance criteria IB2-AC01–AC24 | 23/24 PASS (technical); AC23 (exact-head CI of the final commit) is confirmed in the PR readiness report | `work-packages/IB2-FOUNDATION-COMPONENTS/ACCEPTANCE_REPORT.md` |
| Independent QA Q1–Q10 | High 0, Medium 0 open, after two rounds and the Q10 evidence lane | `independent-qa.md` |
| §18 negatives | Every item mapped to a case that fails its gate | `negative-test-report.md` §2 |
| Full verification | Fresh clone, clean `npm ci`, every suite exit 0, lockfile unchanged | `logs/verification-1b8882a/summary.txt` |
| GitHub Actions | Run 36392688454 on `1b8882a`: 15/15 mandatory jobs and `PAEP / gate` success after the split and its review fixes; the exact-head run of the final commit is in the PR readiness report | `ci-report.md` |
| Generation 4 | CANDIDATE, exact scope, generation 3 unchanged, self-promotion refused | `qa:baseline` 13/13 |
| Visual captures | Recaptured on the final code; CANDIDATE, not self-approved | `visual-conformance.md`; `visual/` |

## 2. Decisions the PO/SA needs to make

1. **Accept or reject IB2** against IB2-AC01–AC24.
2. **Visual baselines.** Accept the 156 CANDIDATE captures as the IB2 visual baseline, or ask for changes. No pixel-diff tool is installed (RR25).
3. **Design deviations** (`evidence/design-handoff/HOF-IB2-001/deviations/`):
   - Six proposed acceptable adaptations need a decision: DDR-IB2-01 (table words at 320 px), -02 (action-group menu is its own popover), -04 (modal body region and scroll lock), -05 (popover content region), -07 (foundation page demonstrations) and -08 (dialog footer component).
   - Two defects are resolved and need confirmation of closure: DDR-IB2-03 and DDR-IB2-06.
4. **Governance review (RR6).** Review `review/PO-SA-GOVERNANCE-DIFF.txt` line by line. It covers every change to `.github/**`, `tooling/verification/**` and `tooling/governance/**`. These files are inside the CANDIDATE scope, and no automated gate can detect an edit to the verifier's own checks.
5. **RR14.** The first CI run timed out; the authorised split into `PAEP / negative-ci` (part a) and `PAEP / negative-ci-b` (part b) keeps the 20-minute timeout on both and every case. Before and after durations are in `performance-timing.md`. RR14 stays an open CI-performance risk until the PO/SA is satisfied the split holds on real Actions.
6. **Merge authorisation**, and afterwards the separate promotion of generation 4 (`docs/architecture/BASELINE-ROLLOVER.md`).

## 3. Residual risks

All Low or Info: `residual-risk.md` (RR6 and RR14 carried; RR15–RR25 new).

## 4. Not started

Enterprise shell, Frappe SDK, offline/PWA, domain kits and reporting/analytics are NOT STARTED.
