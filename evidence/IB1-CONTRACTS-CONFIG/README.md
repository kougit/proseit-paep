# IB1-CONTRACTS-CONFIG Evidence

Evidence for product-neutral contracts and governed runtime configuration. Status: **PASS (technical), not accepted**; PO/SA acceptance pending. Baseline generation 3 is CANDIDATE; IB2 not started.

| File | Content |
| --- | --- |
| `reports/preflight.md` | Pre-flight checks (i)–(xvi) on `origin/main` before any change |
| `reports/contract-catalogue.md` | Every public contract type, by file |
| `reports/contract-public-api.md` | Public API properties and the reviewed snapshot |
| `reports/runtime-config-schema.md` | Every schema field and definition |
| `reports/bootstrap-sequence.md` | Fail-safe startup sequence and the forbidden behaviours it prevents |
| `reports/deployment-profile-evidence.md` | Same-build cloud SaaS, private cloud, on-premise and sub-path proof |
| `reports/security-review.md` | Threats and controls |
| `reports/positive-test-report.md` | Positive suites and results |
| `reports/negative-test-report.md` | Negative, mutation and CI-control suites and results |
| `reports/independent-qa.md` | QA lanes Q1–Q8, rounds 1 and 2, findings and fixes |
| `reports/residual-risk.md` | Residual risks RR1–RR14 |
| `reports/ci-report.md` | Pull request, GitHub Actions run and `PAEP / gate` result |
| `logs/preflight/` | Pre-flight command logs on `035593b` |
| `logs/verification-7ae5bca/` | Full verification on a fresh clone of `7ae5bca` with a clean `npm ci`: every command, exit code, lockfile hash before/after, tree status after install and after the run |

Work-package records: `work-packages/IB1-CONTRACTS-CONFIG/` (WORK_PACKAGE, ACCEPTANCE, TRACEABILITY, ACCEPTANCE_REPORT, work-package.json). Design: `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md`. Guide: `docs/architecture/RUNTIME-CONFIGURATION-GUIDE.md`.
