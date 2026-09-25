# IB1-PREFLIGHT-R7 Acceptance-Readiness Report

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
| Acceptance Status | PENDING (PO/SA decision) |
| Registry generation 2 | CANDIDATE (not promoted) |
| R7 | Remediated, not CLOSED |
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

## Decisions required from the PO/SA

1. Accept or reject IB1-PREFLIGHT-R7 and the residual risks.
2. If accepted: record the acceptance in `work-packages/IB1-PREFLIGHT-R7/work-package.json`, authorise the merge (merge commit), then authorise the promotion of generation 2 (`BASELINE-ROLLOVER.md` steps 6–9).
3. Whether `CLAUDE.md` should become immutable (residual R7-RR3).

Claude Code has not merged, has not promoted generation 2, has not marked R7 CLOSED and has not started substantive IB1.
