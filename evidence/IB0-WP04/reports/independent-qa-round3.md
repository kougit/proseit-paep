# IB0-WP04 Independent QA — Round 3 (delta)

**Commit under review:** `7fa24627a6ea7998a73dec5e713b12b64fe5274d` (branch `claude/ib0-wp04-011ntv`).
- The checker change is in `499ae29`: bare-name and `#prefix/*` handling for `package.json` `imports`, plus new negative case N39 and control C4.
- `7fa2462` changes only documentation and evidence.

**Baseline:** `ac6b786`. **Previous round:** round 2 at `7a8f4e9` — PASS, with Low findings R2-L1 to R2-L6.
**Reviewer:** independent clean-context Claude QA reviewer (did not write the work). **Date:** 2026-09-24.

## Verdict

**INDEPENDENT QA: PASS**

- **R2-L1 and R2-L2 are fixed for the reproductions I gave in round 2.** My R2-L1 bypass (`"#ent": "@proseit/paep-enterprise"`) now fails `arch:check` with DIRECTION. My R2-L2 false positive (`"#lib/*": "./src/lib/*.ts"`) now passes, and the production build succeeds.
- **No regressions.** Nothing regressed across the 82-case harness, the 33 round-2 probes and 20 new imports-map variants.
- **All gates pass:**
  - `npm ci` exits 0, and the lockfile is identical to `ac6b786`.
  - Both production builds exit 0.
  - `qa:ib0-wp04` gives 24/24 and `qa:ib0-wp04:negative` gives 44/44.
  - Post-run state is clean: only `evidence/IB0-WP04/` changed.
  - Controlled sources match 13/13.
  - The `499ae29..7fa2462` diff contains only docs and evidence.
- **One new Low finding (R3-L1).** Three imports-map forms still bypass the checker, and in each the forbidden code ships in the build:
  - a conditional object whose `import` branch points elsewhere than its `default` branch
  - the same with a `browser` branch
  - two overlapping `#prefix/*` patterns, where the more specific one is listed second

  The evidence records R2-L1 as closed, which is not fully true.
- **Severity:** these are the same class as round-1 L4/F19 and round-2 R2-L1, both rated Low. So there are no High or Medium findings.

## 1. Method and environment

- **Clone and toolchain:** fresh `git clone` into `/tmp/paep-wp04-qa3-*/repo`, with no `node_modules`, `dist` or `.angular` beforehand. Node 24.21.0, npm 11.19.0, TypeScript 6.0.3 from `/opt/node24/bin`. No version pins were bypassed and nothing was installed beyond `npm ci`.
- **Isolation:** all mutations ran in a separate scratch copy. Each one was restored with `git checkout -- .`, `git clean -fdq` and `git clean -fdqx -- packages apps`. The last command removes gitignored nested `dist/` leftovers, the harness problem noted in round 2.
- **Author's tree:** `/home/claude/proseit-paep` was not touched.
- **Log format:** every log begins with the date, Node and npm versions and HEAD, and ends with `EXIT_CODE`.
- **Clean-up:** the clone and scratch copy were deleted at the end.

## 2. Checks

| # | Check | Result | Log (qa3/…) |
| --- | --- | --- | --- |
| 1 | **R2-L1** (`#ent` → bare `@proseit/paep-enterprise`, used by the app): `arch:check` now exits 1 with DIRECTION. The build still accepts the code, which confirms the case is real. | FIXED | `12-imports-build-probes.log` R2-L1; `08` F19; `10` NN01 |
| 1 | **R2-L2** (`#lib/*` → `./src/lib/*.ts`, `import '#lib/x'`): `arch:check` exits 0, and the build exits 0 with no enterprise code in the bundle. | FIXED | `12` R2-L2; `10` FP06 |
| 2 | **82-case harness.** 73 of 82 cases behave as expected, one more than round 2 (F19 now caught). The other 9 are known open items or test artefacts: F06, F07, F17 (R2-L6), P16 (R2-L5), V03, V04, V03b, V05 (O1) and C09 (O2). No regression. | PASS | `08-*.log`, `09-*.log` |
| 2 | **Round-2 supplementary probes (33).** 31 behave as expected. FP06 and NN01 now behave correctly, and NN03 is now reported as ENTRY_BYPASS. The two that don't are the known NN07 (R2-L3) and NN16 (R2-O1). All 17 false-positive probes pass. No regression. | PASS | `10-round2-probes.log` |
| 3 | **Imports-map variants (20).** 17 behave as expected; the 3 exceptions are R3-L1, below. The ones that behave correctly: <br>• conditional `{default: bare}` and `{types: local, default: bare}` (DIRECTION)<br>• nested conditional `{node: {import: ../enterprise/…}}` (ENTRY_BYPASS)<br>• a legitimate conditional pattern (exit 0)<br>• nested pattern `#ent/*` → `../enterprise/src/*` (ENTRY_BYPASS)<br>• `#p/*` → a bare package (DIRECTION)<br>• `#c/*` → `@proseit/paep-components/*` (DEEP_IMPORT)<br>• an exact key taking precedence over a pattern (DIRECTION)<br>• contracts `#rx/*` → `rxjs/*` and `#ng` → `@angular/core` (CONTRACTS_NEUTRAL)<br>• a contracts pattern to its own files (exit 0)<br>• analytics `export * from '#ec'` → `echarts` (ANALYTICS_VENDOR_EXPORT)<br>• unresolvable `#x` with no map, with a non-matching map, in an app, or with a `null` target (OUTSIDE_PROJECT)<br>• an array target (DIRECTION) | PASS with Low R3-L1 | `11-imports-map-variants.log` |
| 3 | **Build-level check of the misses.** M03, M04 and M10 each give `arch:check` exit 0, a production build exit 0, and an enterprise marker in the bundle. | R3-L1 | `12-imports-build-probes.log` |
| 4 | `npm ci` exits 0. Lockfile sha256 `be1154cb…` equals `ac6b786` before and after install, and `git status` is clean after install. | PASS | `01`–`03` |
| 4 | `build:reference-app` and `build:ui-lab` | Exit 0 / 0 | `04`, `05` |
| 4 | `arch:check`: 20 projects, 0 edges | Exit 0 | `06` |
| 4 | `qa:ib0-wp04:negative`: 4+1 controls (C0–C4) and 39 negatives. N39 and C4 pass. | PASS 44/44 | `13` |
| 4 | `qa:ib0-wp04` (full): WP03 13/18 plus 5 bounded, WP02 19/20 plus V17, WP01 15/15 | PASS 24/24 | `14` |
| 4 | **Post-run state.** Changes are only under `evidence/IB0-WP04/`. WP01–03 `evidence/` and `work-packages/` tree hashes equal `ac6b786`, with no diffs and no untracked files. The lockfile is unchanged. | PASS | `15` |
| 4 | Controlled sources match 13/13, with no diff against the baseline. | PASS | `16` |
| 5 | **`git diff --name-status 499ae29 7fa2462`.** It touches only `evidence/IB0-WP04/**` and `work-packages/IB0-WP04/ACCEPTANCE_REPORT.md`; there are no tooling, app, package, config or lockfile changes. The full diff against `ac6b786` stays within WORK_PACKAGE §4. | PASS | `07` |
| 5 | **R2-L4 evidence wording.** Fixed:<br>• The README definition-audit row now reads "defaults D1–D12, conflict C1 … for PO/SA decision".<br>• `reports/independent-qa.md` and `logs/independent-qa-round2/` exist.<br>• Every README-indexed path exists except `reports/acceptance-readiness.md`, which you permitted.<br>• The commit under test (`499ae29`) is consistent across the README, reports, JSON and the clean-clone log.<br>• TRACEABILITY: 21/21 `PASS`.<br>• The ACCEPTANCE_REPORT D1 now says "L4 relative `imports` targets".<br>• Residual risk (iii) lists R2-L3, R2-L5, R2-L6 and R2-O1.<br>• Independent QA is honestly shown as "Pending".<br>The retained round-2 report and all 31 round-2 logs, JSON files and scripts are byte-identical to what I produced. | PASS; minor items in R3-O1 | `17-evidence-consistency.log` |

## 3. Findings

### Low

**R3-L1. `package.json` `imports`: only one branch of a conditional object is checked, and overlapping patterns resolve by order instead of specificity. The build resolves them differently, so forbidden code ships.**

- **Cause:**
  - `subpathTarget()` collapses a conditional object to a single string: `t.default ?? t.import ?? t.types ?? Object.values(t)[0]`.
  - For patterns, it takes the *first* matching `#prefix/*` key in object order.
  - Node and bundlers take the first *matching condition in key order* (esbuild's browser build activates `browser`, `import` and `default`). Node also takes the *longest matching prefix* among pattern keys.

- **Reproductions** (`11-imports-map-variants.log` M03, M04, M10; `12-imports-build-probes.log` with builds). Each one: components imports the specifier, and the app uses components.

  | Case | `packages/components/package.json` `imports` | Specifier | `arch:check` | Build | Enterprise marker in bundle |
  | --- | --- | --- | --- | --- | --- |
  | M03 | `{"#ent": {"import": "@proseit/paep-enterprise", "default": "./src/lib/x.ts"}}` | `#ent` | exit 0 | exit 0 | yes |
  | M04 | `{"#ent": {"browser": "@proseit/paep-enterprise", "default": "./src/lib/x.ts"}}` | `#ent` | exit 0 | exit 0 | yes |
  | M10 | `{"#a/*": "./src/lib/*.ts", "#a/b/*": "@proseit/paep-enterprise"}` | `#a/b/x` | exit 0 | exit 0 | yes |

- **Evidence status:** ACCEPTANCE_REPORT D4 and technical-verification D4 record R2-L1 as closed.
- **Why Low:** the severity is the same as round-1 L4 and R2-L1. It needs a deliberate `package.json` edit, which is visible in review.
- **Smallest fix:**
  1. Walk every string leaf of a conditional object, including nested objects and arrays, and check each target.
  2. Order pattern keys by Node's specificity rule: longest prefix first, then the longer key.
  3. Add negative cases for M03, M04 and M10.

### Observations

- **R3-O1. Minor evidence wording:**
  - `reports/independent-qa-round2.md` exists but is not listed in the README Reports table. It is referenced only from `reports/independent-qa.md`, whose README row says "summary and round 2".
  - The technical-verification D1 still says "Low gaps L2–L6 and L8" without the qualifications that the ACCEPTANCE_REPORT D1 now carries: L3 only partly closed, L4 closed only for relative targets.
  - The `reports/independent-qa.md` "Round 3 (delta)" section is still an empty placeholder. It is expected to be filled from this report.
- **R3-O2. Carried forward unchanged and disclosed as residual risk:** R2-L3 (NN07), R2-L5 (P16), R2-L6 (F06, F07, F17), R2-O1 (NN16), O1 and O2.
- **R3-O3. The fix introduced no new false positives.** All 17 round-2 false-positive probes pass, as do the new legitimate-code variants: a conditional `#lib/*` pattern, and a contracts pattern pointing at its own files.

## 4. Raw logs (qa3/)

| Log | Content |
| --- | --- |
| `01-pre-clone-state.log`, `02-npm-ci.log`, `03-lockfile-after-install.log` | Clean clone, install, lockfile |
| `04-build-reference-app.log`, `05-build-ui-lab.log`, `06-arch-check.log` | Builds, `arch:check` |
| `07-diff-499ae29-7fa2462.log` | Docs/evidence-only delta; full scope against `ac6b786` |
| `08-qa-mutations-82-part1.log`/`.json`, `09-qa-mutations-82-part2.log`/`.json` | 82-case harness |
| `10-round2-probes.log`/`.json` | Round-2 supplements (33) |
| `11-imports-map-variants.log`/`.json` | 20 imports-map variants |
| `12-imports-build-probes.log` | R2-L1, R2-L2, M03, M04, M10 with production builds and bundle-marker check |
| `13-negative-ib0-wp04.log`, `14-verify-ib0-wp04-full.log` | Author gates: 44/44 and 24/24 |
| `15-post-run-git-status.log`, `16-controlled-source-integrity.log` | Post-run state, integrity |
| `17-evidence-consistency.log` | README index against files, retained-copy comparison, statuses, closure wording |

**Scripts** (`qa3/scripts/`): the round-1 and round-2 scripts, plus `qa-round3-imports-variants.mjs`, `qa3-builds.sh` and `evidence-check.sh`.
