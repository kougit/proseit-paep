# IB0-WP02 Acceptance Report

**Work package:** IB0-WP02 — Toolchain/Version Baseline and Lockfile Control  
**Commit / revision:** [INSERT]  
**Baseline:** IB0-WP01 ACCEPTED, merge commit `b6b023f`  
**Technical reviewer:** [INSERT]  
**Review date:** [INSERT]

## Implemented scope

[Concise summary]

## Requirement traceability

[Confirm that `TRACEABILITY.csv` is complete, and identify the material implementation artefacts.]

## Pinned toolchain

| Tool | Controlled family | Pinned version | Where pinned / enforced |
| --- | --- | --- | --- |
| Node.js | 24 LTS | [INSERT] | `.nvmrc`, `devEngines.runtime` |
| npm | bundled with pinned Node | [INSERT] | `packageManager`, `devEngines.packageManager` |
| Angular / CLI / build | 22.x (aligned) | [INSERT] | `package.json`, `package-lock.json` |
| TypeScript | 6.0.x | [INSERT] | `package.json`, `package-lock.json` |
| RxJS | 7.x | [INSERT] | `package.json`, `package-lock.json` |
| Orchestration | Nx-compatible | Not used (IB0-WP04) | manifest |

## Automated gates

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` (fresh clone, pinned toolchain) |  |  |
| `git diff --exit-code -- package.json package-lock.json` after `npm ci` |  |  |
| `npm run build:reference-app` |  |  |
| `npm run build:ui-lab` |  |  |
| `node tooling/verification/verify-ib0-wp02.mjs` |  |  |
| `node tooling/verification/verify-ib0-wp01.mjs` (regression; IB0-WP01 evidence preserved) |  |  |
| Negative: `npm ci` on non-pinned Node (scratch) |  |  |
| Negative: `npm ci` with lockfile drift (scratch) |  |  |
| `npm install-scripts ls` |  |  |
| Controlled-source integrity (13/13) |  |  |

## Manual checks

| Check | Reviewer | Date | Result |
| --- | --- | --- | --- |
| Licence review (`lightningcss`, `caniuse-lite`) |  |  |  |
| Scope review |  |  |  |

## Acceptance criteria

| Criterion | Result | Evidence / note |
| --- | --- | --- |
| AC01 |  |  |
| AC02 |  |  |
| AC03 |  |  |
| AC04 |  |  |
| AC05 |  |  |
| AC06 |  |  |
| AC07 |  |  |
| AC08 |  |  |
| AC09 |  |  |
| AC10 |  |  |
| AC11 |  |  |
| AC12 |  |  |
| AC13 |  |  |
| AC14 |  |  |
| AC15 |  |  |
| AC16 |  |  |
| AC17 |  |  |
| AC18 |  |  |
| AC19 |  |  |
| AC20 |  |  |
| AC21 |  |  |
| AC22 |  |  |
| AC23 |  |  |
| AC24 |  |  |

## Defects

[Open/closed defects by severity, or "None".]

## Exceptions

[Approved exception IDs, or "None".]

## Provenance and licences

[Dependency/generator provenance status; licence inventory result; disposition and approval status for `lightningcss` and `caniuse-lite`.]

## Residual risk

[Known limitations and planned follow-up (owner work package), or "None identified for this work package".]

## Technical result

**PASS / FAILED / BLOCKED:** [INSERT]

## Human acceptance decision

**ACCEPTED / REJECTED / CONDITIONAL:** [INSERT]

**Licence dispositions (Engineering Governance / IP owner):** [INSERT: accepted / rejected / conditional, with date]

**Authorised reviewer:** [INSERT]  
**Date:** [INSERT]
