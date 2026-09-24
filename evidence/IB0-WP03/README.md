# IB0-WP03 Evidence Folder

Evidence for IB0-WP03 (compiler, type-safety and static-quality baseline).

**Commit under test:** `0f2d38174d57dda229e62a545477e8d8288e8a00` (implementation `15386a9` plus the verifier hardening from independent QA round 1), run from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24. Later branch commits change documentation and evidence only; independent QA re-ran every gate on the PR head (`reports/independent-qa.md`). **Baseline:** IB0-WP02 merge commit `de13629`. **Status:** technical PASS; independent QA PASS; **ACCEPTED** 2026-09-24 by the Product Owner / Solutions Architect (`work-packages/IB0-WP03/ACCEPTANCE_REPORT.md`). Pre-merge revalidation of PR head `3ae5588` passed (`logs/pre-merge-revalidation/`).

## Reports

| Path | Content |
| --- | --- |
| `reports/definition-audit.md` | Lane A (with B–D): controlled requirements, criterion trace, scope analysis, ambiguities and defaults |
| `reports/compiler-configuration.md` | Before/after compiler options, effective values, negative proof, alias and entry-point table |
| `reports/technical-verification.md` | All gates, negative cases, defects and per-criterion result |
| `reports/ib0-wp03-verification.json` | Verifier output, 18/18 PASS, with commit, Node, npm and TypeScript versions |
| `reports/negative-tests.json` | Negative runner output, 23/23 |
| `reports/independent-qa.md` | Independent clean-context QA |
| `reports/acceptance-readiness.md` | Readiness for PO/SA authorisation |

## Logs (positive gates)

| Path | Gate | Result |
| --- | --- | --- |
| `logs/clean-clone-reproduction.log` | Summary of every gate in the fresh clone | All exit 0 |
| `logs/pre-clone-state.log` | No `node_modules`, `dist`, `.angular` before install | Confirmed |
| `logs/toolchain-versions.log` | Node, npm, `.nvmrc`, `devEngines`, npm policy | Matches pins |
| `logs/npm-ci.log` | `npm ci` | Exit 0 |
| `logs/lockfile-unchanged.log` | Lockfile unchanged after `npm ci` and identical to `de13629` | Exit 0 |
| `logs/build-reference-app.log`, `logs/build-ui-lab.log` | Production builds | Exit 0 |
| `logs/build-output-vs-baseline.log` | Output hashes against the `de13629` build | 12/12 identical |
| `logs/ng-version.log` | `ng version` | 22.1.8 / TS 6.0.3 |
| `logs/verify-ib0-wp03.log` | `npm run qa:ib0-wp03` | PASS 18/18 |
| `logs/verify-ib0-wp02-regression.log`, `logs/ib0-wp02-verification.regression.json` | WP02 verifier | 19/20, V17 bounded exception |
| `logs/verify-ib0-wp01-regression.log`, `logs/ib0-wp01-verification.regression.json` | WP01 verifier | PASS 15/15 |
| `logs/post-run-git-status.log` | Tracked files after all runs; WP01/WP02 records vs baseline | Clean; empty |
| `logs/controlled-source-integrity.log` | PACK_MANIFEST SHA-256; git diff of controlled files and `CLAUDE.md` | 13/13; empty |
| `logs/scope-and-secret-scan.log` | Changed files, out-of-scope files, Nx, dependencies, apps, entry points, secrets | 0 violations |

## Logs (negative gates, scratch copy)

| Path | Cases | Result |
| --- | --- | --- |
| `logs/negative-strictness.log` | B0–B2c: TypeScript and template violations with flag-off controls | 5/5 as expected |
| `logs/negative-verifier-mutations.log` | M0–M17: verifier positive control and 17 weakening mutations | 18/18 as expected |
| `logs/independent-qa-round2/` | Independent QA round 2 raw logs and helper scripts (at `813b7ca`) | QA PASS; F1, F3, F5, F6 closed |
| `logs/pre-merge-revalidation/` | All positive and negative gates re-run on a fresh clone of PR head `3ae5588` before acceptance | All exit 0; verifier 18/18; negative 23/23 |
| `logs/independent-qa-round1/` | Independent QA round 1 raw logs and helper scripts (at `f19a422`) | QA PASS with findings F1–F8 |
| `logs/negative-tests.log` | Runner console output | PASS 23/23 |

## Notes

| Path | Content |
| --- | --- |
| `notes/implementation-summary.md` | Changes, commits, defaults (since decided, see `notes/closure-authorisation.md`), notes for later work packages |
| `notes/closure-authorisation.md` | PO/SA acceptance and decisions of 2026-09-24 |
