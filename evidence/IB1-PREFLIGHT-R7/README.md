# IB1-PREFLIGHT-R7 Evidence

Evidence for the controlled baseline-governance remediation of residual risk R7. Status: **READY FOR AUTHORIZATION**. Registry generation 2 is a CANDIDATE; acceptance is the PO/SA's decision.

| File | Content |
| --- | --- |
| `reports/preflight.md` | Pre-flight checks (i)–(xvi) before any change |
| `reports/baseline-inventory.json` | Classification of every tracked file at `5fbbedd` (immutable, governed, record, mutable) |
| `reports/technical-verification.md` | VERIFY lanes A–H, commands and per-criterion results R7-AC01–AC26 |
| `reports/baseline-governance-tests.json` | Machine-readable results of `qa:baseline:negative` |
| `reports/ib0-wp05-verification.json` | Machine-readable results of the full `qa:ib0-wp05` run |
| `reports/independent-qa.md` | QA lanes 1–6, rounds 1–5, findings and fixes |
| `reports/residual-risk.md` | Residual risks R7-RR1–RR10 |
| `reports/github-actions-run.md` | Pull request, head SHA, GitHub Actions run and `PAEP / gate` result |
| `logs/main-5fbbedd-qa-ib0-wp05-full.log` | Reference run on the accepted IB0 baseline |
| `logs/env.log` | Node, npm and the commit the local logs came from |
| `logs/npm-ci.log`, `logs/post-npm-ci-status.log`, `logs/post-run-status.log`, `logs/lockfile.sha256` | Clean install, tree state and lockfile hash |
| `logs/qa-baseline.log` | `npm run qa:baseline` |
| `logs/qa-baseline-negative.log`, `logs/baseline-governance-tests.log` | `npm run qa:baseline:negative` |
| `logs/qa-ib0-wp05-full.log` | `npm run qa:ib0-wp05` (full) |
| `logs/qa-ib0-wp05-negative.log` | `npm run qa:ib0-wp05:negative` |
| `logs/qa-architecture.log` | `npm run qa:architecture` |

Work-package records: `work-packages/IB1-PREFLIGHT-R7/` (WORK_PACKAGE, ACCEPTANCE, R7_ROOT_CAUSE, BASELINE_GOVERNANCE_DESIGN, TRACEABILITY, ACCEPTANCE_REPORT, work-package.json). Procedure: `docs/architecture/BASELINE-ROLLOVER.md`.
