# IB0-WP04 Evidence Folder

Evidence for IB0-WP04 (project graph, package boundaries and dependency enforcement).

**Commit under test:** `9c74dbe9235ed34df3ee465a4bb2d0b9e9a8fe94`, run from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24. Later branch commits change documentation and evidence only. **Baseline:** IB0-WP03 merge commit `ac6b786`. **Status:** technical PASS; independent QA recorded in `reports/independent-qa.md`; not ACCEPTED (PO/SA decision).

## Reports

| Path | Content |
| --- | --- |
| `reports/definition-audit.md` | Pre-flight, controlled requirements, current graph, criterion trace, defaults D1–D12, conflict C1 (§6.1 versus Appendix B) for PO/SA decision |
| `reports/architecture-boundaries.md` | Classification, allowed dependencies, rules and tsconfig inheritance |
| `reports/project-graph.json` | Generated project graph (Nx ProjectGraph shape, edges, depConstraints) |
| `reports/ib0-wp04-verification.json` | Verifier output, 24/24 PASS, with commit, Node, npm and TypeScript versions |
| `reports/negative-tests.json` | Negative runner output, 50/50 |
| `reports/technical-verification.md` | All gates, negative cases and per-criterion result |
| `reports/independent-qa-round1.md` | Independent QA round 1 (commit `1c16f80`): FAIL, 4 Medium findings, all closed |
| `reports/independent-qa-round2.md` | Independent QA round 2 (commit `7a8f4e9`): PASS |
| `reports/independent-qa-round3.md` | Independent QA round 3 (commit `7fa2462`): PASS, one Low finding closed afterwards |
| `reports/independent-qa-round4.md` | Independent QA round 4 (commit `5d92109`, re-review of the R3-L1 fix): FAIL, F-1 High and F-2 Medium, closed in `dcda855`; probe harness in `logs/independent-qa-round4/` |
| `reports/independent-qa-round5.md` | Independent QA round 5 (commit `dcda855`, delta): PASS for the delta; R5-M1 Medium (older symlink gap) closed in `9c74dbe`; probes in `logs/independent-qa-round5/` |
| `reports/independent-qa-round6.md` | Independent QA round 6 (commit `9c74dbe`, delta): PASS; Low residuals only; probes in `logs/independent-qa-round6/` |
| `reports/independent-qa.md` | Independent QA summary of all rounds |
| `reports/acceptance-readiness.md` | Readiness for PO/SA authorisation |

## Logs

| Path | Gate | Result |
| --- | --- | --- |
| `logs/clean-clone-reproduction.log` | Summary of every gate in the fresh clone | All exit 0 |
| `logs/pre-clone-state.log` | No `node_modules`, `dist`, `.angular` before install | Confirmed |
| `logs/toolchain-versions.log`, `logs/ng-version.log` | Node, npm, `.nvmrc`, `devEngines`, npm policy; Angular/TypeScript | Match pins |
| `logs/npm-ci.log` | `npm ci` | Exit 0 |
| `logs/lockfile-unchanged.log` | Lockfile unchanged after `npm ci` and identical to `ac6b786` | Exit 0 |
| `logs/build-reference-app.log`, `logs/build-ui-lab.log` | Production builds | Exit 0 |
| `logs/arch-check-cli.log`, `logs/arch-check.log` | `npm run arch:check` (standalone and inside the verifier) | Exit 0 |
| `logs/verify-ib0-wp04.log` | `npm run qa:ib0-wp04` | PASS 24/24 |
| `logs/verify-ib0-wp03-regression.log`, `logs/ib0-wp03-verification.regression.json` | WP03 regression | 13/18 + 5 bounded |
| `logs/verify-ib0-wp02-regression.log`, `logs/ib0-wp02-verification.regression.json` | WP02 regression | 19/20 + V17 bounded |
| `logs/verify-ib0-wp01-regression.log`, `logs/ib0-wp01-verification.regression.json` | WP01 regression | 15/15 |
| `logs/negative-tests.log`, `logs/negative-architecture-tests.log` | `npm run qa:ib0-wp04:negative` | 50/50 |
| `logs/post-run-git-status.log` | No tracked change outside `evidence/IB0-WP04/`; earlier WP records unchanged | Confirmed |
| `logs/controlled-source-integrity.log` | PACK_MANIFEST SHA-256 check and diff | 13/13 |
| `logs/scope-and-secret-scan.log` | Changed files, out-of-scope files, Nx, apps/packages diff, entry points, secrets | 0 violations |
| `logs/independent-qa-round1/`, `logs/independent-qa-round2/`, `logs/independent-qa-round3/` | Independent QA raw logs and scripts | See `reports/independent-qa.md` |
