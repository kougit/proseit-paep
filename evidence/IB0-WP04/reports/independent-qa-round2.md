# IB0-WP04 Independent QA, Round 2

**Commit under review:** `7a8f4e918edbd56fa0b42d050363e109f733dab9` (branch `claude/ib0-wp04-011ntv`). Its evidence was recorded at `bbe3dee`; `7a8f4e9` changes only docs and evidence.
**Baseline:** `ac6b786` (IB0-WP03 merge).
**Round 1:** commit `1c16f80`, verdict FAIL with M1–M4, L1–L8 and O1–O7.
**Reviewer:** an independent clean-context Claude QA reviewer. I did not write this work.
**Date:** 2026-09-24

## Verdict

**INDEPENDENT QA: PASS**

- All four round-1 Medium findings are closed.
  - M1, M2 and M3 are now rejected by `arch:check`. I checked this with my own round-1 reproductions, including the production-build versions.
  - M4 is reported accurately and completely in the definition audit, and is pending a PO/SA decision.
- No High or Medium finding remains.
- Every mandatory gate reproduces:
  - `npm ci`, with the lockfile identical to `ac6b786`
  - both production builds
  - `qa:ib0-wp04`: 24/24
  - `qa:ib0-wp04:negative`: 42/42
  - regression for WP03, WP02 and WP01
  - controlled sources: 13/13
  - scope checks
- **Remaining:** 6 Low findings (R2-L1 to R2-L6) and 5 Observations, listed in section 4. Two of the Low findings matter for how the fixes are described:
  - The author says L4 is closed, but my exact round-1 reproduction of it still passes. That is a `package.json` `imports` alias pointing at a bare package name.
  - The subpath fix introduced a new false positive: legitimate `#name/*` pattern imports are now rejected.

## 1. Method and environment

**Setup**
- Fresh `git clone` into `/tmp/paep-wp04-qa2-*/repo`, with no `node_modules`, `dist` or `.angular` beforehand.
- Mutations ran only in a separate scratch copy.
- Node 24.21.0, npm 11.19.0 and TypeScript 6.0.3 from `/opt/node24/bin`. No pin bypass. Nothing was installed beyond `npm ci`.
- `/home/claude/proseit-paep` was not touched, and it is still clean.

**Mutation harnesses**
- I re-ran my round-1 harnesses (82 cases), my build-level demonstrations, and 33 new probes. The probes cover new false positives and edge cases of the new rules.
- **Harness correction:** `.gitignore` ignores `dist/` at every depth, so `git clean -fd` leaves behind a mutation written under `packages/*/src/dist/`. The first attempt at run 08 was contaminated this way; its results were overwritten and not used. The restore step now also runs `git clean -fdqx -- packages apps`.
- The round-1 results are unaffected: the round-1 checker could not see nested `dist/` folders.

**Log format:** every log starts with the date, Node and npm versions and HEAD, and ends with `EXIT_CODE`.

## 2. Checks

| # | Check | Result | Log (qa2/…) |
| --- | --- | --- | --- |
| 1a | **M1–M3 build-level reproductions** (round-1 B1–B3) now fail `arch:check`. The strictness cases S1–S3 still fail the build. | PASS | `12-round1-build-demos-rerun.log` |
| 1b | **Round-1 Low findings now rejected by `arch:check`:** L2 (reference path: F15, B4); L3 module augmentation (F16) and `require.resolve` (F18); L5 (`.tsx`/`.js` in contracts: C03, C04); L6 (K07); L8 (V02). | PASS | `08-*.log`, `09-*.log` |
| 1c | **L4 (`#imports`)** is fixed only when the imports target is a relative path (the author's N37, and my NN02). My round-1 case F19 still passes: its target is a bare package name. See R2-L1. | PARTIAL | `08-*.log` F19; `10-*.log` NN01; `11-*.log` R2 |
| 1d | **Full 82-case harness re-run for regressions.** 72/82 match the round-1 expectations. The 10 that differ are listed below the table: every one is a known item or a test artefact, and no previously passing case regressed. | PASS | `08-*.log`, `09-*.log` |
| 2 | **M4 write-up.** The definition audit (§6 C1 and D12), plan (i-a), WORK_PACKAGE §6(v), ACCEPTANCE_REPORT exception (iii) and `work-package.json` all name the same 8 cells. I checked them against my independent scan: platform→observability, observability→platform, i18n→platform, i18n→observability, frappe-sdk→offline, analytics→enterprise, domain→enterprise, domain→analytics. The audit states openly that "The first version of this audit said there was no conflict. That was wrong." It gives the default (Appendix B governs), the alternative and the consequences. | PASS; minor gaps in R2-L4 | `17-matrix-and-classification.log`; audit §5 and §6 |
| 3 | **L7 evidence consistency.** Fixed: TRACEABILITY statuses are all `PASS` (21), all evidence paths exist, and the commit under test is `bbe3dee` consistently in the README, JSON and logs. Still wrong: the README indexes `reports/independent-qa.md`, `reports/acceptance-readiness.md` and `logs/independent-qa-round2/`, which do not exist, while AC28 is marked PASS. The README row for the definition audit still reads "defaults D1–D11, conflicts (none)". | PARTIAL; see R2-L4 | Section 3 |
| 4 | `npm ci` exit 0. Lockfile sha256 `be1154cb…` equals `ac6b786` before and after install; `git status` is clean after install. | PASS | `01`–`03` |
| 4 | `npm run build:reference-app` and `build:ui-lab` | Exit 0 / exit 0 | `04`, `05` |
| 4 | `npm run arch:check`: 20 projects, 0 edges | Exit 0 | `06` |
| 4 | `npm run qa:ib0-wp04:negative`: 4 controls and 38 negative cases | PASS 42/42 | `13` |
| 4 | `npm run qa:ib0-wp04` (full): WP03 13/18 + 5 bounded, WP02 19/20 + V17, WP01 15/15 | PASS 24/24 | `14` |
| 4 | **Post-run state.** Only `evidence/IB0-WP04/*` changed. The WP01, WP02 and WP03 `evidence/` and `work-packages/` tree hashes equal `ac6b786`, with 0 working-tree diff and 0 untracked files. The lockfile is unchanged. | PASS | `15` |
| 4 | **Controlled sources:** 13/13 match sha256 and size, with no diff. **No Nx:** no dependency, lockfile entry, `node_modules` folder, `nx.json` or `project.json`. **Matrix:** 144/144 cells, 20/20 classified (my own parser). | PASS | `16`, `18`, `17` |
| 5 | `git diff --name-status bbe3dee 7a8f4e9` touches only `evidence/IB0-WP04/**` and `work-packages/IB0-WP04/{ACCEPTANCE_REPORT.md,work-package.json}`. The full diff against `ac6b786` stays within WORK_PACKAGE §4. `apps`, `packages`, `angular.json`, `config`, the lockfile and controlled files are unchanged. | PASS | `07` |
| 5a | The retained round-1 report and all 31 round-1 logs, JSON files and scripts under `evidence/IB0-WP04/logs/independent-qa-round1/` are byte-identical to what I produced. | PASS | `cmp`, see section 3 |
| 6 | **New false positives.** 16 of 17 legitimate-code probes pass. These cover:<br>- nested intra-project relative imports<br>- an app importing its own nested files<br>- `/// <reference types="@angular/localize" />` in an app<br>- ambient `declare module '*.svg'` and `'*.html'`<br>- an in-project `/// <reference path>`<br>- exact and conditional `#lib` imports<br>- Angular `Injectable`/`signal` in analytics<br>- a parameter that shadows a vendor name<br>- Angular and rxjs subpath imports in apps<br>- clean contracts `.ts`, `.d.ts`, `declare global` and JSDoc-typed `.js`<br>- nested `dist/` and `.angular/` folders with legitimate app code<br>- `config/raw` and `docs/x` npm subpaths (O4 fixed)<br>- a non-literal `require.resolve`<br>- a package-root `node_modules` folder<br>One probe (FP06) is a new false positive: see R2-L2. | PASS with one Low | `10-round2-probes.log`, `11-round2-build-probes.log` |

**The 10 cases in row 1d that differ from round-1 expectations:**
- F06, F07 (computed dynamic import specifiers) are still missed. This is round-1 L1, now acknowledged as residual risk.
- F17 (JSDoc `import()` type) is still missed. This part of round-1 L3 is now acknowledged as residual risk.
- F19 is still missed: see R2-L1.
- P16 is still missed: see R2-L5.
- V03, V04, V03b, V05 and C09 are the round-1 test artefacts and O1/O2 (unchanged by design).

## 3. Status of round-1 findings

| Round 1 | Status at `7a8f4e9` | Evidence |
| --- | --- | --- |
| M1 nested dist/node_modules/.angular | **Closed.** F14 and B1 now give DIRECTION. A forbidden import in `src/.angular/` or `src/node_modules/` is also rejected (NN08, NN09). | `08`, `12`, `10` |
| M2 `.d.ts` excluded | **Closed** (F13, B2) | `08`, `12` |
| M3 `/// <reference lib="dom">` in contracts | **Closed** (C01b, B3, and NN10 for a `.d.ts`); the types directive is also caught (C01c). A reference path to TypeScript's `lib.dom.d.ts` gives OUTSIDE_PROJECT (NN13). | `09`, `12`, `10` |
| M4 §6.1 vs Appendix B | **Closed as reported** (pending PO/SA) | Check 2 |
| L1 computed dynamic specifiers | Open; disclosed as residual risk (iii) | F06, F07 |
| L2 reference path | Closed | F15, B4 |
| L3 augmentation / require.resolve / JSDoc | Augmentation and `require.resolve` closed; the JSDoc part is open and disclosed | F16, F18, F17 |
| L4 `#imports` / non-tsconfig alias | **Partial.** Relative targets are closed. A bare-package target (F19) and P16 are still missed, and are **not** disclosed. See R2-L1 and R2-L5. | F19, NN01, R2, P16 |
| L5 contracts `.tsx`/`.js` | Closed (C03, C04, NN11, NN12) | |
| L6 category vs directory | Closed (K07, NN14) | |
| L7 evidence index | Partial: see R2-L4 | |
| L8 analytics import-then-export | Closed for `export {x}`, `export default x` and `export import =` (V02, NN05, NN06). **Not** closed for `export const y = x` (NN07): see R2-L3. | |
| O4 rooted false positive | Closed (FP15) | |

## 4. Remaining findings

### Low

**R2-L1. The `package.json` `imports` alias to a bare workspace package is still not detected, although the fix is claimed.**
- `subpathTarget()` resolves every imports target as a path relative to the package: `path.resolve(project.root, t)`. A target such as `"#ent": "@proseit/paep-enterprise"` therefore resolves to `packages/components/@proseit/paep-enterprise`. That path is owned by components itself, so the import is skipped.
- **Reproduction** (`11-round2-build-probes.log` R2; `08` F19; `10` NN01):
  1. In `packages/components/package.json`, set `"imports": {"#ent": "@proseit/paep-enterprise"}`.
  2. In components, add `import { qaEnt } from '#ent'`.
  3. Use it from the app.
- **Result:** `arch:check` exits 0, and `ng build reference-app --configuration production` exits 0. The forbidden components→enterprise dependency ships in the build.
- **Why this matters beyond the gap:** `ACCEPTANCE_REPORT.md` D1 and WORK_PACKAGE §9(ii) record L4 as fixed. N37 tests only a relative target.
- **Fix:** when an imports target does not start with `.` or `/`, treat it as a bare specifier and route it through the `@proseit/*` / external branch. Then add a negative case for it.

**R2-L2. New false positive: legitimate `package.json` `imports` subpath patterns are rejected.**
- `subpathTarget()` looks up only exact keys, so `"#lib/*"` patterns never resolve. The import is then reported as "imports map does not resolve" (OUTSIDE_PROJECT).
- **Reproduction** (`11-round2-build-probes.log` R1; `10` FP06):
  1. In `packages/components/package.json`, set `"imports": {"#lib/*": "./src/lib/*.ts"}`.
  2. Add `import { qaX } from '#lib/x'` in components.
- **Result:** `arch:check` exits 1, but the production build exits 0.
- A pattern pointing into another package (NN03) is still rejected, but under OUTSIDE_PROJECT rather than ENTRY_BYPASS.
- **Fix:** implement Node's `*` pattern matching for imports keys.

**R2-L3. An analytics `export const y = importedVendorBinding` is not flagged.**
- **Reproduction** (`10` NN07): in analytics, `import * as echarts from 'echarts'; export const charts = echarts;` gives exit 0.
- AC14 now says "exporting a binding it imported". This exports the vendor object under a new name.
- Residual risk (iii) describes the check as "no external module or imported vendor binding exported", which overstates it for this form.

**R2-L4. Evidence and closure wording (partial L7).**
- The README indexes `reports/independent-qa.md`, `reports/acceptance-readiness.md` and `logs/independent-qa-round2/`, but none of them exist at `7a8f4e9`.
- The README says "independent QA recorded in `reports/independent-qa.md`", while `technical-verification.md` marks AC28 PASS. `ACCEPTANCE_REPORT.md` D3 records L7 as closed.
- The README row for `reports/definition-audit.md` still says "defaults D1–D11, conflicts (none)". That contradicts the corrected audit, which now has D12 and conflict C1.
- In the audit, D1's rationale still cites §6.1 ("lists only lower layers") while D12 lets Appendix B override §6.1. This is disclosed, but worth one sentence of reconciliation.
- `ACCEPTANCE_REPORT.md` says "L2–L8 fixed", while `technical-verification.md` says "L2–L6 and L8". Neither mentions that L4 is only partly fixed (R2-L1).
- The claim that the PO/SA instruction describes direction as "lower/equal architectural categories" could not be verified here, because project-thread tools were out of scope for this review.
- `ACCEPTANCE_REPORT.md` and `work-package.json` honestly show Independent QA as "Pending".
- **Fix:** add the round-2 report, the readiness report and the logs; correct the README audit row; and state the partial L4 closure.

**R2-L5. Round-1 P16 is unchanged and not listed as residual risk.**
- A non-`@proseit` alias defined in an extends-chain file not named `tsconfig*.json` is not detected (`08` P16).
- Example: `apps/reference-app/paths.json` adds `"~ent/*": ["../../packages/enterprise/src/*"]`, and components then uses `import '~ent/index'`.
- In this work package, the verifier's V05 and V17 would catch the app tsconfig change. But `arch:check` alone, the intended WP05 CI gate, does not.

**R2-L6. L1 and the JSDoc part of L3 remain open.**
- Computed dynamic specifiers (F06, F07) and JSDoc `import()` types (F17) are still missed.
- Both are now disclosed as residual risk (iii). They are recorded here only for completeness.

### Observations

- **R2-O1.** Code in a package-root `node_modules/` folder is skipped. This is intended, and the folder is gitignored. But a relative import into it, `../../node_modules/evil/index` from components, hides that code's forbidden imports (`10` NN16). This is contrived.
- **R2-O2.** `.gitignore` ignores `dist/`, `.angular/` and `node_modules/` at every depth. Source placed there (M1) could not be committed without `git add -f`, which lowers M1's practical risk. The checker now scans it anyway.
- **R2-O3.** A contracts file may contain `declare module '*.json'` or a similar ambient wildcard declaration. It would be recorded as an external import, "*.json", and flagged as CONTRACTS_NEUTRAL. This is arguably correct for L0.
- **R2-O4.** Round-1 O1 (copied-code detection is exact, so near-copies evade it) and O2 (`declare const window` in contracts) are unchanged, as designed.
- **R2-O5.** The bounded WP03/WP02 regression matchers are unchanged since round 1 and still tight.

## 5. Raw logs (qa2/)

| Log | Content |
| --- | --- |
| `01-pre-clone-state.log`, `02-npm-ci.log`, `03-lockfile-after-install.log` | Clean clone, install, lockfile, versions |
| `04-build-reference-app.log`, `05-build-ui-lab.log`, `06-arch-check.log` | Builds and `arch:check` |
| `07-diff-bbe3dee-7a8f4e9.log` | Docs/evidence-only diff; full scope against `ac6b786` |
| `08-qa-mutations-82-part1.log`/`.json`, `09-qa-mutations-82-part2.log`/`.json` | Round-1 82-case harness re-run |
| `10-round2-probes.log`/`.json` | 17 false-positive probes and 16 new negative probes |
| `11-round2-build-probes.log` | R1 (subpath-pattern false positive, with build) and R2 (bare-target `#ent` bypass, with build) |
| `12-round1-build-demos-rerun.log` | S1–S3 and B1–B4 re-run |
| `13-negative-ib0-wp04.log`, `14-verify-ib0-wp04-full.log` | Author gates: 42/42, 24/24 |
| `15-post-run-git-status.log`, `16-controlled-source-integrity.log`, `17-matrix-and-classification.log`, `18-no-nx.log` | Post-run state, integrity, matrix, Nx |

- **Scripts** are in `qa2/scripts/`: the round-1 scripts, with the restore step corrected, plus `qa-round2-probes.mjs` and `qa2-builds.sh`.
- **Clean-up:** the clone and scratch copy were deleted after the review.
