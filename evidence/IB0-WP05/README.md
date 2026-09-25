# IB0-WP05 Evidence Folder

Evidence for IB0-WP05: CI/CD, automated quality gates, security/provenance and the pull-request enforcement baseline.

**Code commit under test:** `089f8640b07cfdbf880601903543513b27776784`.
- Run locally from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24.
- Run on GitHub Actions: run 36052554946, all 10 checks successful.
- Later branch commits change evidence and work-package records only.

**Baseline:** IB0-WP04 merge commit `c5c0eb0`.

**Status:** 27/27 PASS; independent QA PASS; **ACCEPTED** by the Product Owner / Solutions Architect on 2026-09-25 (AC25 as an approved deferred capability; `main` enforcement approved and technically advisory until GitHub capability permits). Final revalidation: `logs/acceptance-revalidation/`.

## Reports

| Path | Content |
| --- | --- |
| `reports/definition-audit.md` | Definition audit: controlled requirements, the WP05 definition drafted from the PO/SA brief, and defaults |
| `reports/technical-verification.md` | Every gate, negative case family and per-criterion result |
| `reports/github-actions-run.md` | Real runs: inventory, check-run ids, timestamps, token permissions, audit signatures, artifacts, the invalid-workflow first run, and the deliberate-failure run |
| `reports/ib0-wp05-verification.json` | Full verifier output, 24/24 PASS, with commit and versions |
| `reports/negative-ci-tests.json` | Negative suite output, 87/87 (10 controls, 77 negatives) |
| `reports/independent-qa.md` | Independent QA: round 1 (3 lanes), round 2 (fix re-check), round 3 (final re-check); findings and dispositions |
| `reports/residual-risk.md` | Residual risks R1–R10 |
| `reports/acceptance-readiness.md` | PR readiness record, the PO/SA decisions of 2026-09-25 and the final revalidation |

The workflow security review is `docs/architecture/IB0-WP05-CI-DESIGN.md` §4. The enforcement design is `docs/architecture/IB0-WP05-PR-ENFORCEMENT.md`. The action register is `docs/provenance/GITHUB-ACTIONS-REGISTER.md`.

## Logs (fresh clone at `089f864`)

| Path | Gate | Result |
| --- | --- | --- |
| `logs/clean-clone-reproduction.log` | Summary of every step | All exit 0 |
| `logs/toolchain-versions.log` | Node, npm, `.nvmrc`, `packageManager`, `devEngines`; no `node_modules`/`dist`/`.angular` before install | Match pins |
| `logs/npm-ci.log` | `npm ci` | Exit 0 |
| `logs/lockfile-unchanged.log` | Tracked tree unchanged after install; lockfile identical to `c5c0eb0`; sha256 | Exit 0 |
| `logs/build-reference-app.log`, `logs/build-ui-lab.log` | Production builds | Exit 0 |
| `logs/qa-architecture.log` | `npm run qa:architecture` | PASS, 0 violations |
| `logs/qa-types.log` | `npm run qa:types` | Exit 0 |
| `logs/verify-ib0-wp05-full.log` | `npm run qa:ib0-wp05` | PASS 24/24 |
| `logs/negative-ci-tests.log`, `logs/negative-ci-tests.detail.log` | `npm run qa:ib0-wp05:negative` (summary, and per-case detail) | PASS 87/87 |
| `logs/post-run-git-status.log` | Earlier WP records unchanged after the run | Exit 0, no diff |
| `logs/ci-gates/full/` | Outputs of the earlier verifiers and negative suites as run by the full verifier (WP04 static/full, WP04 negatives, WP03 negative runner, WP03/WP02/WP01 regression, `qa:types`, licence inventory) | As in `technical-verification.md` |

In CI, each job's equivalent logs are uploaded as the artifact `paep-<job>-attempt-<n>`, kept for 30 days.
