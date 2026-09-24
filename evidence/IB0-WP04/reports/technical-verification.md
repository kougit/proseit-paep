# IB0-WP04 Technical Verification Report

**Commit under test:** `f74fb78ac871b0a302a7819a5c1d7752544f2409` (branch `claude/ib0-wp04-011ntv`), run from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24. **Baseline:** `ac6b786` (IB0-WP03 merge). **Result:** technical **PASS**, AC01–AC29.

## Positive gates

| Gate | Result | Evidence |
| --- | --- | --- |
| No `node_modules`, `dist`, `.angular` before install | Confirmed | `logs/pre-clone-state.log` |
| Toolchain | Node 24.21.0, npm 11.19.0; Angular/CLI 22.1.8; TypeScript 6.0.3 | `logs/toolchain-versions.log`, `logs/ng-version.log` |
| `npm ci` | Exit 0 | `logs/npm-ci.log` |
| Lockfile unchanged after `npm ci` and byte-identical to `ac6b786` | Exit 0 | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` / `build:ui-lab` | Exit 0 / exit 0 | `logs/build-reference-app.log`, `logs/build-ui-lab.log` |
| `npm run arch:check` | PASS: 20 projects, 0 edges, 0 cycles, 0 violations | `logs/arch-check-cli.log` |
| `npm run qa:ib0-wp04` | PASS 24/24 | `logs/verify-ib0-wp04.log`, `reports/ib0-wp04-verification.json` |
| Project graph | 20 nodes, 12 depConstraints | `reports/project-graph.json`, `reports/architecture-boundaries.md` |
| WP03 regression (inside V22) | 13/18 pass + bounded V05, V08, V10, V12, V17 (only WP04-authorised change) | `logs/verify-ib0-wp03-regression.log`, `logs/ib0-wp03-verification.regression.json` |
| WP02 regression (run by WP03) | 19/20 + V17 bounded (`tsconfig.base.json` and the accepted WP03 paths) | `logs/verify-ib0-wp02-regression.log`, `logs/ib0-wp02-verification.regression.json` |
| WP01 regression (run by WP03) | 15/15 | `logs/verify-ib0-wp01-regression.log`, `logs/ib0-wp01-verification.regression.json` |
| No tracked change outside `evidence/IB0-WP04/` after the runs; earlier WP records byte-identical to baseline | Confirmed | `logs/post-run-git-status.log` |
| Controlled-source integrity | 13/13; no diff to `.paep-control`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md` | `logs/controlled-source-integrity.log` |
| Scope, Nx, entry points, secrets | 0 violations | `logs/scope-and-secret-scan.log` |

## Negative architecture tests

`npm run qa:ib0-wp04:negative`: **PASS 33/33** (`logs/negative-architecture-tests.log`, `logs/negative-tests.log`, `reports/negative-tests.json`).

| Cases | Result |
| --- | --- |
| C0 unmutated; C1 allowed edges (3 edges, 1 Optional); C2 production build via `tsconfig.base.json` alias; C3 verifier static | 4/4 PASS |
| N01–N27 checker mutations (upward, contracts → Angular, foundation → enterprise, deep import, cycle, bypass, unknown/unclassified project, app → app, package → app, DOM global, frappe-sdk → UI, analytics → frappe-sdk, domain → domain, manifest, dynamic/type-only/re-export/require forms, vendor re-export, copied code, matrix tamper, wildcard/retargeted/second alias registry, unknown package, tooling import) | 27/27 exit 1 with the expected rule |
| N28 `nx` devDependency, N29 `nx.json` | 2/2 verifier V15 FAIL |

N05 is the key cycle proof: platform → observability and observability → platform are each allowed ("Optional"), so only the CYCLE rule rejects the pair, and the run shows no DIRECTION finding.

## Per-criterion result

| AC | Result | Evidence |
| --- | --- | --- |
| AC01 | PASS | Plan commit `eef883a` is the parent of the first config/tooling commit `9347807` |
| AC02 | PASS | V01: 144/144 cells, layers match §6.1 |
| AC03 | PASS | V02: 20/20 |
| AC04 | PASS | V03: 20 nodes |
| AC05 | PASS | V04 |
| AC06 | PASS | V05 |
| AC07 | PASS | V06: 18/18 aliases, 36/36 resolutions |
| AC08 | PASS | V07: 18/18 placeholders |
| AC09 | PASS | V08: 0 forbidden edges |
| AC10 | PASS | V09 |
| AC11 | PASS | V10 |
| AC12 | PASS | V11: 0 cycles |
| AC13 | PASS | V12: 0 findings, 0 diagnostics |
| AC14 | PASS | V13 |
| AC15 | PASS | V14; `logs/arch-check-cli.log` exit 0 |
| AC16 | PASS | 4/4 controls; 29/29 rejected |
| AC17 | PASS | V15; N28, N29. Nx disposition: NOT REQUIRED FOR IB0-WP04 |
| AC18 | PASS | `npm ci` exit 0 |
| AC19 | PASS | exit 0 |
| AC20 | PASS | exit 0 |
| AC21 | PASS | V16; lockfile sha256 `be1154cb…6b69` |
| AC22 | PASS | V18: 13/13 |
| AC23 | PASS (bounded exception pending PO/SA) | V22 |
| AC24 | PASS (accepted WP03 exception plus `tsconfig.base.json`, pending PO/SA) | V23 |
| AC25 | PASS | V24: 15/15 |
| AC26 | PASS | V17, V19 |
| AC27 | PASS | Verifier JSON; `logs/post-run-git-status.log` |
| AC28 | PASS | `evidence/IB0-WP04/README.md` |
| AC29 | PASS | `work-packages/IB0-WP04/TRACEABILITY.csv`, `ACCEPTANCE_REPORT.md` |

## Defects found during execution

None. Every gate passed on its first recorded run. Later branch commits change documentation and evidence only.
