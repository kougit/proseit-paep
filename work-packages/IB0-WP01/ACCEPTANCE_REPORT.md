# IB0-WP01 Acceptance Report

**Work package:** IB0-WP01 — Repository and Angular Workspace Bootstrap  
**Commit / revision:** implementation `b9904d023a5a8a8df6c4d9b9900b48188ff5095f`; evidence in the following commit on branch `claude/project-thread-1vn0d9` (draft PR kougit/proseit-paep#1)  
**Technical reviewer:** Claude Code (implementation session; this is a self-assessment). Independent QA per `prompts/02_INDEPENDENT_QA.md` is pending.  
**Review date:** 2026-09-23

## Implemented scope

The repository root is now a plain Angular CLI workspace (Angular/CLI 22.1.8, TypeScript 6.0.3) that uses npm workspaces and no Nx. Direct versions are pinned exactly, `package-lock.json` is committed, and the workspace was built on Node 24.21.0 LTS with npm 11.19.0.

`apps/reference-app` and `apps/ui-lab` are minimal standalone, zoneless starter applications with neutral placeholder pages and empty routes. There are 18 `@proseit/*` placeholder packages and the approved `tooling/`, `config/`, `docs/` and `evidence/` areas, each with a README.

The npm scripts `build:reference-app`, `build:ui-lab` and `qa:ib0-wp01` exist. No Frappe integration, shell, analytics, offline, domain or design-system work was added.

## Requirement traceability

`TRACEABILITY.csv` is complete: 9 requirements map to implementation artefacts, verification and evidence, covering AC01–AC15. Every evidence path exists.

Material artefacts are `package.json`, `package-lock.json`, `angular.json`, `tsconfig.json`, `apps/reference-app/**`, `apps/ui-lab/**`, `packages/*/{README.md,package.json}`, the placeholder areas and `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md`.

## Automated gates

All gates were run from a clean dependency state (`node_modules`, `dist` and `.angular` removed) on the committed implementation tree, with Node 24.21.0 and npm 11.19.0. They were then repeated in a fresh `git clone`.

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` | PASS (exit 0; 0 vulnerabilities) | `evidence/IB0-WP01/logs/npm-ci.log`; `logs/clean-clone-reproduction.log` |
| `npm run build:reference-app` | PASS (exit 0) | `evidence/IB0-WP01/logs/build-reference-app.log`; `logs/clean-clone-reproduction.log` |
| `npm run build:ui-lab` | PASS (exit 0) | `evidence/IB0-WP01/logs/build-ui-lab.log`; `logs/clean-clone-reproduction.log` |
| `node tooling/verification/verify-ib0-wp01.mjs` | PASS (15/15 checks; exit 0) | `evidence/IB0-WP01/reports/ib0-wp01-verification.json`; `logs/verify-ib0-wp01.log` |
| Scope and secret scan | PASS (0 scope violations; 0 secret findings after triage) | `evidence/IB0-WP01/logs/scope-and-secret-scan.log` |

## Acceptance criteria

| Criterion | Result | Evidence / note |
| --- | --- | --- |
| AC01 | PASS | Controlled sources (`.paep-control/SOURCE_OF_TRUTH.md` and the text exports of PAEP v1.1, IB-01, IR-01 and EQP-01) plus the work package were read. The plan with intended file changes was recorded in `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md` before any workspace file was created. |
| AC02 | PASS | `angular.json` is a valid CLI workspace (both projects build). `ng version` shows Angular/CLI 22.1.8 and TypeScript 6.0.3. `packageManager: npm@11.19.0`. See `logs/ng-version.log` and `reports/toolchain-baseline.md`. |
| AC03 | PASS | `apps/reference-app` contains only generated bootstrap files, an empty route table and a placeholder page. It has no business workflow. It builds in `logs/build-reference-app.log`. |
| AC04 | PASS | `apps/ui-lab` contains only generated bootstrap files, an empty route table and a placeholder page. It has no tokens, components or theme, and its styles are empty. It builds in `logs/build-ui-lab.log`. |
| AC05 | PASS | Verifier V06 finds all 42 required directories. `tooling/analytics-test` and `docs/reporting-metrics` were also added, per PAEP-IB-01 §5.1/App. A and PAEP v1.1 App. A. |
| AC06 | PASS | `package-lock.json` (lockfileVersion 3) is committed. `packageManager: npm@11.19.0`. Verifier V01, V02 and V05 pass. |
| AC07 | PASS | `npm ci` exits 0 from the committed lockfile, both in the repository and in a fresh clone. |
| AC08 | PASS | `npm run build:reference-app` (production) exits 0. |
| AC09 | PASS | `npm run build:ui-lab` (production) exits 0. |
| AC10 | PASS | The verifier reports `PASS` (15/15) and wrote `reports/ib0-wp01-verification.json`. |
| AC11 | PASS | `reports/toolchain-baseline.md` records exact Node, npm, Angular, CLI, TypeScript and RxJS versions and the orchestration decision. `reports/dependency-baseline.md` records every direct dependency with version and licence, plus material transitive build tools. |
| AC12 | PASS | 0 violations. No Frappe, analytics, offline, shell, domain or commercial-template dependency or code. See `logs/scope-and-secret-scan.log` and verifier V12. |
| AC13 | PASS | 0 findings across all 89 new or modified files; binary files are skipped (triaged false positives are listed in `logs/scope-and-secret-scan.log`). Verifier V13 passes. |
| AC14 | PASS | Every item in WORK_PACKAGE §9 exists under `evidence/IB0-WP01/`, indexed in `evidence/IB0-WP01/README.md`. |
| AC15 | PASS | `TRACEABILITY.csv` maps requirements to implementation, verification and evidence for AC01–AC15. |

## Defects

None open. During execution, the preinstalled Node 22.22.2 was rejected by Angular CLI 22 (an environment issue). It was resolved by using Node 24.21.0 LTS, as directed by the user and PAEP-IB-01 §4.1.

## Exceptions

None.

## Provenance

`docs/provenance/PROVENANCE-REGISTER.md` is updated. All direct dependencies are open source: MIT, Apache-2.0 or 0BSD. No proprietary or commercial template material was used. Two build-time transitive licences are flagged for review in WP02/SBOM: `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0). Dependency approval is pending human review.

## Residual risk

(i) **Orchestration.** A later IB0 work package must decide how to deliver the Nx-compatible project graph and module boundaries expected by PAEP-IB-01 §4.1/§22, and the `nx.json`/`tsconfig.base.json` shown in IR-01 §4.2. This bootstrap intentionally has no Nx (user direction; IB-01 §2.3(ii)).

(ii) **Pinning (IB0-WP02).** Node is not yet pinned in `.nvmrc`/`engines`. The npm 11 `allowScripts` policy (esbuild, lmdb, msgpackr-extract, @parcel/watcher install scripts) is not yet decided.

(iii) **Strictness (IB0-WP03).** Strict TypeScript and template checking rely on toolchain defaults, which are verified as enabled. Explicit settings are WP03 scope.

(iv) **Pack integrity script.** `tooling/verification/validate-pack.mjs` reports hash mismatches for the pack templates this work package was required to populate. This is expected and not an IB0-WP01 gate.

## Technical result

**PASS / FAILED / BLOCKED:** PASS. All 15 mandatory criteria pass with retained evidence. Independent QA is still to be run.

## Human acceptance decision

**ACCEPTED / REJECTED / CONDITIONAL:** [INSERT: pending authorised human reviewer]

**Authorised reviewer:** [INSERT]  
**Date:** [INSERT]
