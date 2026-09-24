# IB0-WP03 Technical Verification Report

**Commit under test:** `15386a95361b7a95c100bebd76d3c0907e5e6554` (implementation commit), from a fresh `git clone` of `origin/claude/ib0-wp03-7s51em`, Node 24.21.0 / npm 11.19.0, linux-x64, 2026-09-24. Later commits on the branch change only documentation and evidence; the independent QA re-runs every gate on the final PR head.

**Result: TECHNICAL PASS — 24/24 criteria.**

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Clean clone, no `node_modules`/`dist`/`.angular` | Confirmed | `logs/pre-clone-state.log` |
| Toolchain | Node 24.21.0, npm 11.19.0, engine-strict and strict-allow-scripts on | `logs/toolchain-versions.log` |
| `npm ci` | Exit 0 | `logs/npm-ci.log` |
| Lockfile unchanged after `npm ci`; identical to `de13629` | Exit 0 | `logs/lockfile-unchanged.log` |
| `build:reference-app`, `build:ui-lab` (production) | Exit 0, exit 0 | `logs/build-reference-app.log`, `logs/build-ui-lab.log` |
| Build output against `de13629` | 12/12 files byte-identical | `logs/build-output-vs-baseline.log` |
| `ng version` | Angular/CLI 22.1.8, TypeScript 6.0.3 | `logs/ng-version.log` |
| `npm run qa:ib0-wp03` | PASS 18/18 | `logs/verify-ib0-wp03.log`, `reports/ib0-wp03-verification.json` |
| WP02 regression (in V17) | 19/20; V17 flags only `tsconfig.json` and the 18 `packages/*/src/index.ts` | `logs/verify-ib0-wp02-regression.log` |
| WP01 regression (in V18) | PASS 15/15 | `logs/verify-ib0-wp01-regression.log` |
| Tracked files after all runs; WP01/WP02 records vs baseline | Clean; empty diff | `logs/post-run-git-status.log` |
| Controlled sources | 13/13 SHA-256 match; empty diff for `.paep-control`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md` | `logs/controlled-source-integrity.log` |
| Scope and secrets | 26 changed paths, all permitted; no out-of-scope files; 0 Nx; dependencies identical; apps unchanged; 0 secret findings | `logs/scope-and-secret-scan.log` |
| `npm run qa:ib0-wp03:negative` | PASS 19/19 | `logs/negative-strictness.log`, `logs/negative-verifier-mutations.log`, `reports/negative-tests.json` |

## Negative cases

| Case | Expected | Observed |
| --- | --- | --- |
| B0 unmodified build | exit 0 | exit 0 |
| B1 TS strict violation | fail, TS7006 + TS2322 | exit 1, both codes |
| B1c B1 with strict/noImplicitAny false | exit 0 | exit 0 |
| B2 template strict violation | fail, TS2345 | exit 1, TS2345 |
| B2c B2 with strictTemplates false | exit 0 | exit 0 |
| M0 unmutated verifier | PASS | exit 0 |
| M1 `strict` removed | V01 FAIL | V01, V03 |
| M2 `strict` false | V01 FAIL | V01, V03, V04 |
| M3 `noImplicitAny` removed | V01 FAIL | V01, V03 |
| M4 `strictTemplates` removed | V02 FAIL | V02, V03 |
| M5 `strictTemplates` false | V02 FAIL | V02, V03, V04 |
| M6 app `strictNullChecks: false` | V04 FAIL | V03, V04, V05, V12 |
| M7 app `strictDomEventTypes: false` | V04 FAIL | V03, V04, V05, V12 |
| M8 `noImplicitReturns: false` | V05 FAIL | V05 |
| M9 `aot: false` (production) | V06 FAIL | V06, V12 |
| M10 `@ts-ignore` in app source | V07 FAIL | V07, V12 |
| M11 alias removed | V08 FAIL | V08, V09 |
| M12 wildcard deep alias | V08 FAIL | V08 |
| M13 entry point deleted | V09 FAIL | V09 |

M1, M3 and M4 matter most: removing a flag leaves the default on, so a build would still pass, and only the explicit-configuration checks catch it.

## Defects found and fixed during execution

| ID | Severity | Finding | Fix |
| --- | --- | --- | --- |
| D1 | Low (tooling) | First negative run: every verifier mutation case failed for the wrong reason. The scratch copy links `node_modules` as a symlink, which `/node_modules/` in `.gitignore` does not match, so V12 saw an untracked path and V14 tried to read it as a file (EISDIR). | Runner adds `/node_modules` to the copy's local `.git/info/exclude`; V14 scans regular files only. No criterion or check was relaxed; re-run 19/19. |

## Criteria

| AC | Result | Basis |
| --- | --- | --- |
| AC01 | PASS | Plan in `8d7a643`, parent of `15386a9`, the first commit touching `tsconfig.json`/`packages/**` |
| AC02–AC08 | PASS | Verifier V01–V09 |
| AC09–AC11 | PASS | Negative runner 19/19 |
| AC12–AC14 | PASS | Fresh-clone gates |
| AC15–AC19 | PASS | V10–V14; scope, lockfile and integrity logs |
| AC20 | PASS | Verifier 18/18; post-run status clean |
| AC21 | PASS | V17 (bounded V17 exception, pending PO/SA decision) |
| AC22 | PASS | V18 |
| AC23 | PASS | `evidence/IB0-WP03/README.md` |
| AC24 | PASS | `TRACEABILITY.csv`, `ACCEPTANCE_REPORT.md` |
