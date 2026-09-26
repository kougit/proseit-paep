# IB1-PREFLIGHT-R7 Acceptance Report

**Work package:** IB1-PREFLIGHT-R7 — controlled baseline-governance remediation of residual risk R7 (IB1 pre-flight; not substantive IB1)
**Authorisation:** PO/SA instruction "IB1 PRE-FLIGHT — R7 CONTROLLED BASELINE REMEDIATION" (project thread, 2026-09-25)
**Baseline:** IB0 ACCEPTED; registry generation 1 = merge `5fbbedde4ed97899e88cfd4bd4cad02e34101914` (tree `fb10ab5db706e41f70c37384787740966a8d0d2f`)
**Candidate:** registry generation 2 (IB1-PREFLIGHT-R7), status CANDIDATE
**Commits:** `7b37af8` (implementation), `b165a5d` (traceability, inventory), `360e671` (QA round 1), `7f2d01c` (QA round 2), `80e2b03` (QA round 3), `367bf02` (QA round 4), then evidence commits. The PR head and CI run are in `evidence/IB1-PREFLIGHT-R7/reports/github-actions-run.md`.
**Technical reviewer:** Claude Code (execution). Independent QA by separate clean-clone Claude reviewers.
**Review date:** 2026-09-25

| Item | Status |
| --- | --- |
| Technical status | PASS (local gates, independent QA; GitHub run recorded in `github-actions-run.md`) |
| Acceptance Status | ACCEPTED |
| Acceptance Authority | Product Owner / Solutions Architect |
| Acceptance Date | 2026-09-26 |
| R7 Status | ACCEPTED FOR PROMOTION |
| Registry generation 2 | CANDIDATE until the separate post-merge promotion |
| R7 | Remediated; CLOSED only after promotion and post-promotion verification |
| IB1 substantive implementation | NOT STARTED |

## Implemented scope

* `tooling/governance/baseline-registry.json`: append-only generations. Generation 1 is the accepted IB0 baseline, bound to git (merge, tree, PO/SA records, 29 fingerprints). Generation 2 is this CANDIDATE with its authorised scope.
* `tooling/governance/baseline-governance.mjs`: `verify` (rules B01–B13, read-only) and `promote` (only for a PO/SA-accepted first-parent mainline merge).
* `tooling/governance/negative-baseline-governance.mjs`: positive, negative, tampering and simulated acceptance/merge/promotion tests.
* `tooling/verification/verify-ib0-wp05.mjs`: the fixed `BASELINE_COMMIT` and WP05 path lists are replaced by the registry (W02, W05–W08, bounds; new W26).
* `.github/workflows/paep-ci.yml` and `ib0-wp05-ci-policy.json`: one added step in `PAEP / negative-ci`.
* `package.json`: scripts `qa:baseline`, `qa:baseline:negative`.
* `docs/architecture/BASELINE-ROLLOVER.md`: rules and procedure for every later work package.

No dependency, lockfile, application, package, `angular.json`, tsconfig or controlled source changed. Nx: NOT REQUIRED.

## Automated gates (local, clean `npm ci`, Node 24.21.0, npm 11.19.0)

| Command | Result | Evidence |
| --- | --- | --- |
| `npm ci` | Exit 0; tree unchanged; lockfile sha256 `be1154cb…6b69` (unchanged) | `evidence/IB1-PREFLIGHT-R7/logs/npm-ci.log` |
| `npm run qa:baseline` | PASS 13/13 | `logs/qa-baseline.log` |
| `npm run qa:baseline:negative` | PASS 104/104 (13 positive, 91 negative) | `logs/qa-baseline-negative.log`; `reports/baseline-governance-tests.json` |
| `npm run qa:ib0-wp05` (full, both builds, WP01–WP04 regressions) | PASS 25/25 | `logs/qa-ib0-wp05-full.log`; `reports/ib0-wp05-verification.json` |
| `npm run qa:ib0-wp05:negative` | PASS 87/87 | `logs/qa-ib0-wp05-negative.log` |
| `npm run qa:architecture` | PASS, 0 violations | `logs/qa-architecture.log` |

Per-criterion results: `evidence/IB1-PREFLIGHT-R7/reports/technical-verification.md`.

## Independent QA

Five review rounds by clean-clone reviewers found 2 High, 5 Medium, several Low and Info items. Every High and Medium item is fixed and re-tested; round 5 is PASS. Details: `evidence/IB1-PREFLIGHT-R7/reports/independent-qa.md`.

## Residual risks

`evidence/IB1-PREFLIGHT-R7/reports/residual-risk.md` (Low/Info only; PO/SA disposition required).

## Defect found during pre-acceptance rehearsal

**D-R7-01 (medium, closed): the baseline test suite depended on the live acceptance state.** Rehearsing acceptance, merge and promotion in a scratch clone showed `negative-baseline-governance.mjs` failing 27 cases once the record says ACCEPTED, and after promotion, so `PAEP / negative-ci` would have failed. Fixed in the acceptance commit: the suite builds a fixture of the R7 lifecycle start; no case or assertion changed. Independent QA round 6: PASS. The rehearsal then passed every gate on the promoted state.

**D-R7-02 (high, closed): after promotion the WP05 regression bounds would have rejected the promotion itself.** The same rehearsal, run through every gate on the promoted state, failed W17, W18, W20 and W21 (21/25) and WP05 negative controls C07/C08: with no CANDIDATE, the older-verifier bound refused the promoted `baseline-registry.json`, which is the one change B11 permits after an accepted merge. Fixed in `authorisedSince` (the registry is accepted only when there is no CANDIDATE and B11 passes); new test G17 fails without the fix and passes with it. The suite is now 105 cases (13 positive, 92 negative). The rehearsal is repeated on the acceptance commit before it is pushed.

## PO/SA decisions (2026-09-26)

Recorded under the PO/SA instruction "IB1-PREFLIGHT-R7 — FINAL ACCEPTANCE, MERGE, GENERATION-2 PROMOTION AND POST-PROMOTION CLOSURE" (project chat, 2026-09-26T12:25Z).

| # | Decision | Disposition |
| --- | --- | --- |
| 1 | R7 remediation (IB1-PREFLIGHT-R7) | APPROVED; ACCEPTED |
| 2 | Recorded Low and Info residual risks (R7-RR1–RR10) | ACCEPTED, subject to final revalidation (passed before this record was committed) |
| 3 | `CLAUDE.md` (R7-RR3) | PROTECTED GOVERNED ARTIFACT: locked by default, governed and versionable under explicit PO/SA authority; not immutable |
| 4 | Merge of PR #6 (merge commit) and promotion of generation 2 | AUTHORISED, subject to new-head CI, the final pre-merge check and the promotion race gate |

Generation 1 remains the historical accepted IB0 baseline. Generation 2 remains CANDIDATE in this commit; it becomes ACCEPTED only through the separate post-merge `promote` step (`BASELINE-ROLLOVER.md` steps 8–9). Substantive IB1 is not started.
