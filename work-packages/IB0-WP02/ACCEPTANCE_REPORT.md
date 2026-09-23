# IB0-WP02 Acceptance Report

**Work package:** IB0-WP02 — Toolchain/Version Baseline and Lockfile Control  
**Commit / revision:** implementation `916cb9dde3b1502441c346c06e9aaba9ab097ea7` (commits `8525598`, `591b266`, `916cb9d`); evidence in the following commit on branch `claude/ib0-wp02-c625bb`  
**Baseline:** IB0-WP01 ACCEPTED, merge commit `b6b023f`  
**Technical reviewer:** Claude Code implementation session (self-assessment). Independent QA per `prompts/02_INDEPENDENT_QA.md` has not yet run.  
**Review date:** 2026-09-23

## Verification and acceptance summary

| Item | Result | Evidence |
| --- | --- | --- |
| Technical verification | PASS | AC01–AC24 below; `evidence/IB0-WP02/` |
| Independent QA | Not yet run | |
| Acceptance status | Not accepted | Human decision below is blank |
| Open human actions | 3 | Approve the work-package definition (R1); update `CLAUDE.md` to IB0-WP02 (R2); decide the licence dispositions |

## Implemented scope

Node 24.21.0 is pinned in `.nvmrc` and, with npm 11.19.0, enforced by `package.json` `devEngines` (`onFail: "error"`), so npm refuses to install, clean-install or run scripts on any other Node or npm. `.npmrc` turns on `engine-strict` and `strict-allow-scripts`. `allowScripts` denies all five install scripts in the lockfile. A version manifest (`docs/architecture/toolchain-version-manifest.json`) records every pinned version, and a new verifier (`npm run qa:ib0-wp02`) checks it against the lockfile and installed tree. The licence review for `lightningcss` and `caniuse-lite` and the provenance register update are recorded.

No dependency was added, removed or re-versioned. `package-lock.json` and the production build output are byte-identical to IB0-WP01.

## Requirement traceability

`TRACEABILITY.csv` maps 18 requirements to implementation artefacts, AC01–AC24, verification and evidence. Every evidence path exists. Material artefacts: `.nvmrc`, `.npmrc`, `package.json`, `docs/architecture/toolchain-version-manifest.json`, `tooling/verification/verify-ib0-wp02.mjs`, `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md`, `docs/provenance/PROVENANCE-REGISTER.md`, `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md`.

## Pinned toolchain

| Tool | Controlled family | Pinned version | Where pinned / enforced |
| --- | --- | --- | --- |
| Node.js | 24 LTS | 24.21.0 | `.nvmrc`, `devEngines.runtime` |
| npm | bundled with pinned Node | 11.19.0 | `packageManager`, `devEngines.packageManager` |
| Angular / CLI / build | 22.x (aligned) | 22.1.8 | `package.json`, `package-lock.json` |
| TypeScript | 6.0.x | 6.0.3 | `package.json`, `package-lock.json` |
| RxJS | 7.x | 7.8.2 | `package.json`, `package-lock.json` |
| Orchestration | Nx-compatible | Not used (IB0-WP04) | manifest |

## Automated gates

All run from a fresh `git clone` of `916cb9d` from GitHub, Node 24.21.0 / npm 11.19.0, linux-x64.

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` (fresh clone, pinned toolchain) | PASS: exit 0; 0 install scripts run; 0 warnings | `logs/npm-ci.log`, `logs/npm-ci-analysis.log` |
| `git diff --exit-code -- package.json package-lock.json` after `npm ci` | PASS: exit 0; lockfile also identical to `b6b023f` | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` | PASS: exit 0 | `logs/build-reference-app.log` |
| `npm run build:ui-lab` | PASS: exit 0 | `logs/build-ui-lab.log` |
| `node tooling/verification/verify-ib0-wp02.mjs` | PASS: 20/20 | `reports/ib0-wp02-verification.json`, `logs/verify-ib0-wp02.log` |
| `node tooling/verification/verify-ib0-wp01.mjs` (regression; IB0-WP01 evidence preserved) | PASS: 15/15; IB0-WP01 files byte-identical afterwards | `logs/verify-ib0-wp01-regression.log`, `logs/verify-ib0-wp01-restore.log` |
| Negative: `npm ci` on non-pinned Node or npm (scratch) | PASS: exit 1 in all three combinations (`EBADDEVENGINES`) | `logs/negative-node-version.log` |
| Negative: `npm ci` with lockfile drift (scratch) | PASS: exit 1 | `logs/negative-lockfile-drift.log` |
| Negative: unreviewed install script (scratch) | PASS: exit 1 (`ESTRICTALLOWSCRIPTS`) | `logs/negative-install-script.log` |
| Negative: manifest disagrees with lockfile (scratch) | PASS: verifier V11 FAIL, exit 1 | `logs/negative-verifier-manifest.log` |
| `npm install-scripts ls` | PASS: no unreviewed install scripts | `logs/install-scripts-ls.log` |
| Controlled-source integrity (13/13) | PASS | `logs/controlled-source-integrity.log` |
| Build output versus IB0-WP01 baseline | PASS: 12/12 files byte-identical | `logs/build-output-vs-baseline.log` |
| `npm audit` (all and `--omit=dev`) | PASS: 0 vulnerabilities | `logs/npm-audit.log` |

## Manual checks

| Check | Reviewer | Date | Result |
| --- | --- | --- | --- |
| Licence review (`lightningcss`, `caniuse-lite`) | Claude Code (engineering review; not legal advice) | 2026-09-23 | Recorded; build-time only, not shipped; dispositions proposed, pending human approval |
| Scope review | Claude Code | 2026-09-23 | 0 violations (`logs/scope-and-secret-scan.log`) |

## Acceptance criteria

| Criterion | Result | Evidence / note |
| --- | --- | --- |
| AC01 | PASS | `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md` records sources, R1–R3, versions, policies and intended changes. It was committed in `8525598`, the parent of `591b266`, the first commit to change `package.json` or add `.nvmrc`. |
| AC02 | PASS | `.nvmrc` = `24.21.0`, inside the lockfile's Angular engine range; `devEngines.runtime` = node 24.21.0, onFail error. Verifier V01–V03. |
| AC03 | PASS | `npm ci` exit 0 on 24.21.0; exit 1 with `EBADDEVENGINES` on Node 22.22.2 (npm 10 and 11). `logs/npm-ci.log`, `logs/negative-node-version.log`. |
| AC04 | PASS | `packageManager: npm@11.19.0`; `devEngines.packageManager` npm 11.19.0 onFail error; running npm 11.19.0, the npm bundled with Node 24.21.0 (`logs/registry-review.log`). Verifier V05. |
| AC05 | PASS | All nine `@angular/*` at 22.1.8; lockfile root and installed tree match; `logs/ng-version.log`. Verifier V07, V08. |
| AC06 | PASS | `typescript` 6.0.3, inside compiler-cli peer `>=6.0 <6.1`. Verifier V09. |
| AC07 | PASS | `rxjs` 7.8.2 inside core peer `^6.5.3 \|\| ^7.4.0`; all 12 direct dependencies exact. Verifier V07, V10. |
| AC08 | PASS | Manifest records `@angular/build` (direct), esbuild, vite, sass, postcss, lightningcss, browserslist, caniuse-lite and 7 more, and "Nx: not used … IB0-WP04". Verifier V11. |
| AC09 | PASS | `docs/architecture/toolchain-version-manifest.json` with review date and registry evidence reference; 0 mismatches (V11); `reports/version-manifest.md`. |
| AC10 | PASS | Lockfile v3 committed, byte-identical to baseline, unchanged by `npm ci` and by `npm install --package-lock-only`; 0 third-party changes; drift rejected. `reports/lockfile-diff.md`. |
| AC11 | PASS | Fresh GitHub clone with no `node_modules`/`dist`/`.angular`; `npm ci` exit 0. `logs/clean-clone-reproduction.log`. |
| AC12 | PASS | `logs/build-reference-app.log` exit 0. |
| AC13 | PASS | `logs/build-ui-lab.log` exit 0. |
| AC14 | PASS | `allowScripts` has explicit `false` for all five `hasInstallScript` packages; name-only entries (recorded in `reports/install-script-policy.md`); no warning in `npm ci`; `npm install-scripts ls` clean; builds pass. Verifier V14. |
| AC15 | PASS | `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` L1/L2: versions, paths, build-time use, not in `dist/` (`logs/licence-dist-check.log`, including an identical build with `lightningcss` removed), obligations, proposed disposition, status "pending human approval". |
| AC16 | PASS | `reports/licence-inventory.json` and `.md`: 434 entries, all SPDX, all permissive or covered by L1/L2; 0 unreviewed; 36 workspace entries listed separately. Verifier V15. |
| AC17 | PASS | `docs/provenance/PROVENANCE-REGISTER.md` has rows for all direct dependencies, Node, npm, build tools, `lightningcss`, `caniuse-lite` and the install-script policy; no row marked approved. |
| AC18 | PASS | Dependency names unchanged; no Nx/tsconfig.base/lint/test/CI files; `apps/**`, `packages/**`, `angular.json`, `tsconfig.json` unchanged; every changed path within WORK_PACKAGE §4. Verifier V17; `logs/scope-and-secret-scan.log`. |
| AC19 | PASS | 0 secret findings in added or modified files; `.npmrc` holds only two policy settings. Verifier V06, V18. |
| AC20 | PASS | 13/13 controlled files match `PACK_MANIFEST.json` sha256 and size; no diff since `8259317`; `PACK_MANIFEST.json` unchanged. Verifier V16. |
| AC21 | PASS | IB0-WP01 verifier 15/15; `git diff --exit-code b6b023f -- work-packages/IB0-WP01 evidence/IB0-WP01` exit 0 after restore. |
| AC22 | PASS | Verifier PASS 20/20; JSON records commit, Node and npm; after the run `git status` shows only `evidence/IB0-WP02/`. |
| AC23 | PASS | `evidence/IB0-WP02/README.md` indexes all evidence and names the commit under test. |
| AC24 | PASS | `TRACEABILITY.csv` complete with existing evidence paths; this report has every PAEP-EQP-01 §32 field; statuses use the App. C vocabulary. |

## Defects

None open. Closed during execution: the first verifier version counted but did not list the private workspace entries required by AC16 (fixed in `916cb9d`, QA re-run on that commit).

## Exceptions

None.

## Provenance and licences

All 434 third-party lockfile entries come from registry.npmjs.org with sha512 integrity. Licences: MIT 372, ISC 23, MPL-2.0 12, BSD-2-Clause 11, Apache-2.0 8, BSD-3-Clause 5, CC-BY-4.0 1, BlueOak-1.0.0 1, 0BSD 1. `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) are build-time only and nothing from them is shipped; proposed disposition: accept under the recorded conditions, **pending Engineering Governance / IP owner approval**. `zod` and `@standard-schema/spec` (MIT, runtime scope through `@angular/forms`) are newly recorded.

**Erratum to IB0-WP01 evidence:** the IB0-WP01 reports say npm 11.19.0 did not run the four warned install scripts; it did (`evidence/IB0-WP02/logs/erratum-baseline-install-scripts.log`). The IB0-WP01 result is unaffected because the build output is identical either way. See `evidence/IB0-WP02/reports/install-script-policy.md`.

## Residual risk

(i) `CLAUDE.md` still names IB0-WP01 as the bounded objective (R2); a human should update it.

(ii) The IB0-WP02 work-package definition was drafted by Claude and needs human approval (R1).

(iii) `npm audit signatures` was not run (proxy blocked Sigstore). Owner: IB0-WP05 CI.

(iv) Not tested on macOS or Windows. Owner: IB0-WP05 CI matrix.

(v) Deployments must ship `dist/<app>/3rdpartylicenses.txt` (outside `browser/`), and the Angular-logo favicon should be replaced before external release. Owner: later build-release work.

(vi) Nx/project graph remains deferred to IB0-WP04; explicit strict flags to IB0-WP03.

## Technical result

**PASS / FAILED / BLOCKED:** PASS (technical, self-assessed; independent QA pending)

## Human acceptance decision

**ACCEPTED / REJECTED / CONDITIONAL:** [INSERT]

**Licence dispositions (Engineering Governance / IP owner):** [INSERT: accepted / rejected / conditional, with date]

**Authorised reviewer:** [INSERT]  
**Date:** [INSERT]
