# IB0-WP04 Independent QA Report

**Work package:** IB0-WP04, Project Graph, Package Boundaries and Dependency Enforcement
**Commit under review:** `1c16f80539b17c9797a6b194fac63c1fbdb3f8a2` (branch `claude/ib0-wp04-011ntv`)
**Baseline:** `ac6b786caf3485ce2b45724be2b437c28f04b66b` (IB0-WP03 merge on `main`)
**Reviewer:** independent clean-context Claude QA reviewer. I did not write this work.
**Date:** 2026-09-24

## Verdict

**INDEPENDENT QA: FAIL**

All 17 mandatory checks and both production builds reproduce the author's results. The author's gates pass: verifier 24/24, negative runner 33/33, `arch:check` exit 0.

The verdict is FAIL because the review found **4 Medium findings**:

- **M1, M2, M3:** the boundary checker misses real violations that it is required to catch. Each is shown with a production build that succeeds while `arch:check` still reports PASS.
- **M4:** a conflict between two controlled sources that the author did not report.

There are no High findings. The review also recorded 8 Low findings and 7 Observations.

## 1. Scope and method

**What I read:**
- `CLAUDE.md`
- IB-01 §5.1–5.2, §6.1, §6.2, §7 and Appendices B and D
- IR-01 §4.2–§4.6
- EQP §32 and Appendix C
- `work-packages/IB0-WP04/*` and `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md`
- All of `evidence/IB0-WP04/**`
- `architecture-model.json` and `check-boundaries.mjs`
- `verify-ib0-wp04.mjs` and `negative-ib0-wp04.mjs`
- `verify-ib0-wp0{1,2,3}.mjs`

**Where I ran things:**
- A fresh `git clone` of the commit went to `/tmp/paep-wp04-qa-580y7m/repo`. It had no `node_modules`, `dist` or `.angular` beforehand.
- Mutations ran only in a separate scratch copy, `/tmp/paep-wp04-qa-580y7m/scratch`. Each case was restored with `git checkout -- . && git clean -fdq`.
- I did not modify, commit to or push the author's working tree (`/home/claude/proseit-paep`). It is still at `1c16f80` and clean.

**Independent checks:**
- I wrote my own parser for the Appendix B matrix, the §6.1 layers and the classification (`scripts/matrix_compare.py`). It does not use the checker's own label mapping or comparison.
- I wrote my own harness with 82 mutation cases (`scripts/qa-mutations.mjs`, `scripts/qa-mutations-2.mjs`). The cases differ from N01–N29.
- I wrote a build-level script (`scripts/qa-builds.sh`). It runs `arch:check` and `ng build reference-app --configuration production` on each mutation.
- I enumerated every cycle over allowed matrix edges (`scripts/allowed_cycles.py`).
- I verified controlled-source integrity with my own script (`scripts/integrity.py`).

**Log format:** every raw log starts with the date, the Node and npm versions and `git rev-parse HEAD`, and ends with `EXIT_CODE=<n>`.

## 2. Environment

| Item | Value |
| --- | --- |
| Node / npm | 24.21.0 / 11.19.0 (`/opt/node24/bin`), with no pin bypass (`--force`, `--engine-strict=false` and `--ignore-scripts` not used) |
| Angular / CLI / TypeScript | 22.1.8 / 22.1.8 / 6.0.3 (`03-lockfile-after-install.log`) |
| OS | linux-x64 |
| Packages installed | None beyond `npm ci` from the committed lockfile |

## 3. Checks

| # | Check | Result | Evidence (qa/…) |
| --- | --- | --- | --- |
| (i) | **WP04 traceability.** Every AC traces to a controlled source; all 36 TRACEABILITY evidence paths exist at HEAD; no WP05 or IB1 scope. AC16 was strengthened (26 to 29 negatives), not weakened (diff `eef883a..f74fb78`). The plan in `eef883a` precedes the config/tooling commit `9347807`, so AC01 holds. | PASS, but see L7 and M4 | `18-scope-diff.log`; git log shown in the report body |
| (ii) | **Graph completeness.** 18 packages and 2 apps are each classified once, with correct tags. My own parser matches all 12 §6.1 layer assignments and **144/144** Appendix B cells, with 0 mismatches. | PASS, but see M4 and L6 | `07-matrix-and-classification.log` |
| (iii) | **Dependency direction, own mutations.** Every requested case behaved as expected. These edges exit 1 with DIRECTION: offline→foundation, observability→i18n, enterprise→frappe-sdk, platform→components, foundation→contracts, contracts→foundation, domain→frappe-sdk, offline→components, and a peerDependencies manifest edge. These edges exit 0: i18n→platform, analytics→enterprise, domain-ai→analytics, components→contracts, ui-lab→frappe-sdk, and an optionalDependencies manifest edge. These import forms are detected: `export {x} from` in a nested folder, `export * as`, `import = require` in `.cts`, `import()` types, no-substitution template literals, `.mts`, `.js`, `.mjs`, `.cjs` and `.tsx`. **These are not detected:** computed or templated dynamic specifiers, `.d.ts` files, any folder named `dist`, triple-slash `reference path`, `declare module` augmentation, JSDoc `import()`, `require.resolve`, and package.json `imports` aliases. | PASS for the requested cases; gaps are M1, M2, L1–L4 | `09-qa-mutations.log` D01–D15, F01–F19 |
| (iv) | **tsconfig.base.json.** Top-level keys are only `compilerOptions`, which holds only `paths` (18 aliases). `tsconfig.json` extends it. The app `tsconfig.app.json` files are unchanged. No other tsconfig has `paths` or `baseUrl`. `tsc --showConfig` gives 18 paths for both apps, and `readConfiguration` gives 18 paths, 0 errors and strict for both. | PASS | `08-tsconfig-effective.log`, `08a/08b-showconfig-*.json` |
| (v) | **WP03 strictness.** `strict`, `noImplicitAny` and `strictTemplates` are still literal. The `tsconfig.json` diff is only `extends` added and `paths` removed. Each of three violations fails the production build (exit 1): an implicit-any parameter (TS7006), a strictNullChecks error in a package reached through the alias (TS2322), and a template error (TS2339). | PASS | `11-qa-build-demonstrations.log` S1–S3 |
| (vi) | **Public entry-point enforcement.** These are rejected with ENTRY_BYPASS or OUTSIDE_PROJECT: a relative directory import, a rooted `packages/...` path, an absolute path, an app importing package source, a relative import through the `node_modules` workspace symlink, and an import from `config/`. Deleting `src/index.ts` gives ENTRY_POINT plus ALIAS. A dual alias target, `baseUrl` and an app alias each give ALIAS. | PASS; gaps are L2 and L4 | `09-qa-mutations.log` P05–P15 |
| (vii) | **Deep imports.** These are rejected with DEEP_IMPORT: a deep import through dynamic `import()`, an `import()` type, `.../package.json`, and a deep import in an app file. An unknown `@proseit/*` name loaded with `require()` gives UNKNOWN_PACKAGE. | PASS | `09-qa-mutations.log` P01–P04, P11 |
| (viii) | **Cycles.** No 3-package cycle exists over allowed matrix edges. The only allowed cycle is platform↔observability. These cycles are rejected: i18n→platform→observability→i18n (CYCLE plus DIRECTION); domain-ai→iot→fiscal→ai (CYCLE plus DIRECTION); platform↔observability through a manifest dependency plus an `import()` type (CYCLE without DIRECTION); app↔components (CYCLE, DIRECTION and ENTRY_BYPASS). The allowed chain i18n→platform→observability exits 0. | PASS | `12-allowed-cycle-enumeration.log`; `09-qa-mutations.log` Y01–Y05 |
| (ix) | `npm run qa:ib0-wp04:negative` | PASS 33/33 (4 controls, 29 negatives) | `13-negative-ib0-wp04.log` |
| (x) | **No Nx.** No nx, `@nx` or `@nrwl` in package.json or the lockfile; none in `node_modules` or `.bin`; no `nx.json` or `project.json`. | PASS | `17-no-nx.log` |
| (xi) | **Lockfile.** `npm ci` exits 0. The lockfile sha256 `be1154cb…` equals `ac6b786` before and after install, and `git status` is clean after install. | PASS | `01-pre-clone-state.log`, `02-npm-ci.log`, `03-lockfile-after-install.log` |
| (xii) | **WP03 regression (full, via `npm run qa:ib0-wp04`).** 13/18 pass. V05, V08, V10 and V12 each report exactly the WP04 change, and V17 reports only WP02 V17. The matchers are exact strings or file lists, so they cannot hide a real regression (see O6). | PASS | `14-verify-ib0-wp04-full.log` |
| (xiii) | **WP02 regression.** 19/20 pass. V17 reports only `tsconfig.base.json`, the 18 `src/index.ts` files and `tsconfig.json`. | PASS | as above |
| (xiv) | **WP01 regression.** 15/15 pass. Afterwards `git status` shows changes only under `evidence/IB0-WP04/`. The WP01, WP02 and WP03 `evidence/` and `work-packages/` trees have tree hashes identical to `ac6b786` and no working-tree diff. | PASS | `15-post-run-git-status.log` |
| (xv) | **Controlled sources.** 13/13 files match PACK_MANIFEST sha256 and size, with no unlisted file. `.paep-control`, `.gitignore`, `PACK_MANIFEST.json` and `CLAUDE.md` have no diff against the baseline. | PASS | `16-controlled-source-integrity.log` |
| (xvi) | **Evidence completeness.** Every WORK_PACKAGE §7 log and report exists and agrees with my re-run (24/24, 33/33, same counts). However, `reports/independent-qa.md`, `reports/acceptance-readiness.md` and `logs/independent-qa/` are named in the README but missing. | PASS with a gap; see L7 | Section 4, L7 |
| (xvii) | **Scope.** `git diff --name-status ac6b786 1c16f80` lists only paths WORK_PACKAGE §4 permits. `apps/**`, `packages/**`, `angular.json`, `config/**`, the lockfile and the earlier verifiers are unchanged. No secret signatures. | PASS | `18-scope-diff.log` |
| builds | `npm run build:reference-app` and `npm run build:ui-lab` | Exit 0 / exit 0 | `04-build-reference-app.log`, `05-build-ui-lab.log` |
| arch | `npm run arch:check` on the clean clone: 20 projects, 0 edges, 144 cells, 36 alias resolutions | Exit 0 | `06-arch-check.log` |

## 4. Findings

### Medium

**M1. The checker skips every directory named `dist`, `node_modules` or `.angular` at any depth, so real source there is never scanned.**

- **Cause:** in `check-boundaries.mjs`, `SKIP_DIRS` is tested inside `walk()` for every nested directory, not only at the workspace root. Files under `packages/<p>/src/**/dist/` are never scanned, even though Angular compiles them. The same gap hides nested `tsconfig*.json` files and files that COPIED_CODE should compare.
- **Criterion affected:** AC09 says "any import form in apps/** or packages/**".
- **Reproduction** (`11-qa-build-demonstrations.log` B1; `09-qa-mutations.log` F14):
  1. Add `packages/components/src/dist/impl.ts` containing `import { qaEnt } from '@proseit/paep-enterprise'; export const qaFromEnt = qaEnt;`.
  2. Add `export * from './dist/impl';` to the components entry point.
  3. Make the app use `qaFromEnt`.
- **Result:** `arch:check` exits 0. `ng build reference-app --configuration production` exits 0. The forbidden components→enterprise dependency (an upward edge the matrix does not allow) ships in the build.
- **Fix:** skip those names only at the repository root, or skip only `node_modules`. Add a negative case for this.

**M2. Hand-written `.d.ts` files are excluded from the import scan.**

- **Cause:** line 252 filters files with `!f.endsWith('.d.ts')`. The acceptance criteria define "import" to include `import type`, and a `.d.ts` file under `packages/**` or `apps/**` is source.
- **Reproduction** (B2; F13):
  1. Add `packages/components/src/lib/types.d.ts` containing `import type { QaEnt } from '@proseit/paep-enterprise'; export type QaFromEnt = QaEnt;`.
  2. Add `export type { QaFromEnt } from './lib/types';` to the components entry point.
  3. Use the type from the app.
- **Result:** `arch:check` exits 0 and the production build exits 0.
- **Fix:** include `.d.ts` files in the scan. Declaration files are not emitted into `packages/**` by any build, so there are no generated ones to exclude.

**M3. A contracts file can use the DOM by adding `/// <reference lib="dom" />`, and CONTRACTS_NEUTRAL still passes.**

- **Cause:** the neutrality compile passes `lib: ['lib.es2022.d.ts']`, but a lib reference directive inside a source file still loads `lib.dom.d.ts`. This breaks IB-01 §6.2(iii) ("shall not import … DOM/browser APIs"), §7.1(i) ("compile without … browser globals") and AC13.
- **Reproduction** (B3; `10-qa-mutations-supplement.log` C01b):
  1. Add `packages/contracts/src/lib/dom.ts` that starts with `/// <reference lib="dom" />` and contains `export const qaTitle = (): string => document.title;`.
  2. Re-export it from the contracts entry point and call it from the app.
- **Result:** `arch:check` exits 0 and the production build exits 0.
- **Contrast:** the same directive appended below existing code is ignored by TypeScript, and the case correctly fails (C01). `/// <reference types="node" />` is also caught (C01c).
- **Fix:** reject any `libReferenceDirectives` or `typeReferenceDirectives` in contracts files. Alternatively, assert that `program.getSourceFiles()` contains no default-library file outside the ES2022 set.

**M4. A conflict between IB-01 §6.1 and Appendix B is not reported.**

- **The two sources disagree.** §6.1 "May depend on" allows L1 → "L0 only", L2 → "L0-L1" and L3 → "L0-L2". Appendix B allows 8 edges within a layer that §6.1 forbids:
  - platform→observability, i18n→platform, i18n→observability, observability→platform (all L1→L1)
  - frappe-sdk→offline (L2→L2)
  - analytics→enterprise, domain→enterprise, domain→analytics (all L3→L3)

  My scan in `07-matrix-and-classification.log` lists them.
- **The author's documents do not address it:**
  - The model silently follows Appendix B for these cells.
  - The plan (decision (i)) and the definition audit (D1) justify treating the off-diagonal "-" cells as forbidden by citing §6.1, "which is what §6.1 'May depend on' states for every layer". That same §6.1 rule forbids the 8 Optional cells.
  - Definition audit §6 states "Conflicts: None material… Appendix B is the exact rule set".
  - The negative runner's own N05 and C1 (frappe-sdk→offline) depend on these same-layer allowances.
- **Why it matters:** `CLAUDE.md` requires conflicts to be reported, and applying one source over the other materially affects later architecture. It decides which edges IB1+ packages may use.
- **Reproduction:** `python3 scripts/matrix_compare.py <clone>`, section "Appendix B allowed edges that §6.1 … does not allow".
- **Fix:** record the conflict in the definition audit, the plan and the ADR register. Ask the PO/SA to decide which source governs same-layer edges, for example Appendix B as the detailed refinement of §6.1, together with D1.

### Low

**L1. Dynamic `import()` or `require()` with a non-literal specifier is silently ignored.** It is neither an edge nor a violation.
- **Reproduction:** add ``import(`@proseit/${n}`)`` or `import(scope + 'paep-enterprise')` in components. `arch:check` exits 0 (F06, F07).
- **Fix:** flag unanalysable specifiers.

**L2. Triple-slash `/// <reference path="../../enterprise/src/index.ts" />` from components is not detected.** It pulls another package's source into the compilation.
- **Reproduction:** B4 and F15. `arch:check` exits 0 and the build exits 0.

**L3. Three further reference forms create no edge:** `declare module '@proseit/paep-enterprise' {…}` (module augmentation, F16), JSDoc `@type {import('@proseit/…')}` in `.js` (F17), and `require.resolve('@proseit/…')` (F18).

**L4. Resolution is by naming convention, not by the TypeScript resolver.**
- A package.json `imports` entry (`"#ent": "@proseit/paep-enterprise"` plus `import '#ent'`) is treated as an external import (F19).
- A non-`@proseit` alias in an extends-chain file not named `tsconfig*.json` is also missed: for example, `apps/reference-app/paths.json` adding `~ent/*` → `packages/enterprise/src/*`, used as `import '~ent/index'` from components (P16).
- In both cases `arch:check` exits 0. For P16 in this work package, the WP04 verifier V05/V17 would catch the app tsconfig change, but `arch:check` alone, the intended WP05 CI gate, would not.

**L5. Contracts files with the extensions `.tsx`, `.js` or `.mjs` are not type-checked for DOM globals.**
- **Reproduction:** add `packages/contracts/src/lib/w.tsx` (or `w.js`) containing `export const w = window.location.href;`. `arch:check` exits 0 (C03, C04).

**L6. A project's category is not anchored to anything outside the model, although the matrix is.**
- **Reproduction:** recategorise `@proseit/paep-domain-ai` as `enterprise` with matching tags. `arch:check` exits 0 (K07).
- **Effect:** other domain packages could then depend on it (domain→enterprise is Optional), while a matrix tamper (N21, K06) is caught.
- **Fix:** derive the expected category from the directory (`packages/<category>` or `packages/domain-*`).

**L7. Evidence and status wording at `1c16f80`.**
- The evidence README names `reports/independent-qa.md`, `reports/acceptance-readiness.md` and `logs/independent-qa/`. None of them exist, and the README says "independent QA recorded in reports/independent-qa.md".
- `technical-verification.md` nevertheless marks AC28 PASS. `ACCEPTANCE_REPORT.md` says Independent QA "Pending", which is inconsistent with the README.
- TRACEABILITY row IB0-REG-004 uses the status "PASS (bounded exceptions pending PO/SA)", which is outside the EQP Appendix C vocabulary that AC29 requires.
- The evidence names `f74fb78` as the commit under test, but the commit under review is `1c16f80`. The difference is documentation and evidence only, and my run at `1c16f80` reproduces 24/24 and 33/33.

**L8. ANALYTICS_VENDOR_EXPORT only sees `export … from`.**
- **Reproduction:** in analytics, `import * as echarts from 'echarts'; export { echarts };` passes with exit 0 (V02). AC14 says "re-exports no external module".

### Observations

- **O1.** COPIED_CODE matches only files that are identical once whitespace is removed. A one-line comment change or a single renamed identifier evades it (V03b, V05); whitespace-only reformatting is caught (V04b). This is consistent with the wording of AC14.
- **O2.** `declare const window: …` in contracts evades the neutrality compile (C09). This is an inherent limit of the approach.
- **O3.** Stylesheet (`@use`/`@import`) and `angular.json` asset or style references to package internals are not scanned. This becomes relevant once foundation styling exists (IB2).
- **O4. False positive:** the rooted-specifier heuristic treats any bare specifier beginning `config/`, `docs/`, `apps/`, `packages/`, `tooling/` or `evidence/` as a workspace path. For example, `import 'config/raw'` (an npm package subpath) is reported as OUTSIDE_PROJECT with exit 1 (`19-false-positive-rooted-specifier.log`).
- **O5.** Package code is type-checked only when an app reaches it. Unreachable package code has no strict type-check gate until the WP05 type-check stage.
- **O6. The bounded-exception matchers in `verify-ib0-wp04.mjs` are tight.**
  - V05 and V10 are exact-string matches.
  - V08 is an exact set of 18 "no alias" messages.
  - V12 accepts only three segment kinds, with every file required to be `tsconfig.base.json` or on the WP04 PERMITTED list. A change to `apps` or an eslint config adds a different segment and fails.
  - V17 is an exact echo of the WP02 V17 details, and each WP02 segment is validated.
  - The only masking left inside WP03 (script values in WP03 V10; `packages/*/src/index.ts` in WP03 V12 and WP02 V17) is re-checked by WP04 V16, V07 and V17.
  - No finding.
- **O7.** IB-01 §7.2 names the contracts entry point `public-api.ts`; the repository uses `src/index.ts`. This was inherited from the accepted WP03 and is not a WP04 change.

## 5. Recommended smallest corrective actions

1. **For M1:** in `check-boundaries.mjs` `walk()`, apply `SKIP_DIRS` only for top-level entries, or skip only `node_modules`. Add a negative case with source under a nested `dist/` folder.
2. **For M2:** remove the `.d.ts` exclusion, and add a negative case.
3. **For M3:** in CONTRACTS_NEUTRAL, flag any lib or types reference directive in contracts source, or any non-ES2022 default-library file in the program. Add a negative case.
4. **For M4:** document the §6.1 versus Appendix B conflict for the 8 same-layer cells in the definition audit, the plan, the ADR register and the acceptance report, and obtain a PO/SA decision.
5. **For L1–L8:** fix these or accept them as residual risk, as the PO/SA prefers. L1–L5 could be added to the WP05 lint/ESLint boundary work.

## 6. Raw logs (qa/)

| Log | Content |
| --- | --- |
| `01-pre-clone-state.log` | Fresh clone state and lockfile against `ac6b786` |
| `02-npm-ci.log` | `npm ci` |
| `03-lockfile-after-install.log` | Lockfile after install; `ng version` |
| `04-build-reference-app.log`, `05-build-ui-lab.log` | Production builds |
| `06-arch-check.log` | `npm run arch:check` |
| `07-matrix-and-classification.log` | Independent 144-cell, layer, classification and conflict scan |
| `08-tsconfig-effective.log`, `08a/08b-showconfig-*.json` | Inheritance and effective options |
| `09-qa-mutations.log` / `.json` | 76 own mutation cases |
| `10-qa-mutations-supplement.log` / `.json` | 6 supplementary cases (C01b, C01c, C09, V03b, V04b, V05) |
| `11-qa-build-demonstrations.log` | S1–S3 strictness; B1–B4 checker misses shown with production builds |
| `12-allowed-cycle-enumeration.log` | Cycles over allowed edges |
| `13-negative-ib0-wp04.log` | Author negative runner, 33/33 |
| `14-verify-ib0-wp04-full.log` | Author full verifier, 24/24 |
| `15-post-run-git-status.log` | Post-run status; earlier WP records byte-identical |
| `16-controlled-source-integrity.log` | 13/13 |
| `17-no-nx.log` | No Nx |
| `18-scope-diff.log` | Diff scope, config/package.json/ADR diffs, secrets |
| `19-false-positive-rooted-specifier.log` | O4 |

Helper scripts are in `qa/scripts/`: `runlog.sh`, `matrix_compare.py`, `effective-config.mjs`, `qa-mutations.mjs`, `qa-mutations-2.mjs`, `qa-builds.sh`, `allowed_cycles.py` and `integrity.py`. The clone and scratch copy under `/tmp/paep-wp04-qa-580y7m` were deleted after the review.
