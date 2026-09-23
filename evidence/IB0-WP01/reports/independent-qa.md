# IB0-WP01 — Independent QA Report (PR #1)

| | |
| --- | --- |
| Repository | kougit/proseit-paep |
| Pull request | #1, branch `claude/project-thread-1vn0d9` |
| Head audited | `1d722c33c3cf5a0571dd2504df9766f9557387f3` (base `origin/main` = `bed3771`) |
| Commits in PR | `8259317` restore `.paep-control/` + `.gitignore` · `b9904d0` bootstrap · `1d722c3` evidence |
| QA date | 2026-09-23 |
| Reviewer | Claude Code, independent QA session (separate from the implementation session; its claims were not relied on) |
| Method | Fresh clone from GitHub, clean `npm ci`, all gates re-run, config and source inspection, negative strictness tests, hash checks, evidence cross-check |
| Changes made to PR | None. Read-only audit. |

## Overall recommendation

**QA PASS** (with 9 non-blocking observations, listed below).

Every requested check (i)–(x) and every acceptance criterion AC01–AC15 passes on independently produced evidence. No defect blocks technical PASS. This report does **not** record human acceptance; the work package is **not ACCEPTED** until an authorised reviewer says so.

## Environment used for the re-run

- Node **v24.21.0**, downloaded from nodejs.org and SHA-256-checked against the official `SHASUMS256.txt` (`fd8e59d5…cb2d6`).
- npm **11.19.0** (bundled with Node 24.21.0).
- Control check: the container's default Node 22.22.2 is rejected by Angular CLI 22 ("requires a minimum Node.js version of v22.22.3 or v24.15.0 or v26.0.0", exit 3). That confirms the PR's stated environment issue.

## Gate re-runs (fresh clone, no `node_modules`, `dist` or `.angular` beforehand)

| Gate | Exit | Result |
| --- | --- | --- |
| `npm ci` | 0 | 324 packages added, 0 vulnerabilities |
| `npm run build:reference-app` | 0 | initial bundle 190.65 kB, no warnings (budget 500 kB) |
| `npm run build:ui-lab` | 0 | initial bundle 190.65 kB, no warnings |
| `node tooling/verification/verify-ib0-wp01.mjs` | 0 | PASS, 15/15 |
| `npx ng version` | 0 | Angular 22.1.8, CLI 22.1.8, TypeScript 6.0.3, rxjs 7.8.2 |
| `npm ls --all` | 0 | no invalid or extraneous packages; no Nx |
| `npm audit` / `npm audit --omit=dev` | 0 | 0 vulnerabilities in both |
| `node tooling/verification/validate-pack.mjs` | 1 | 9 hash mismatches, 0 missing (see check vi) |

Build output hashes, sizes and versions are **identical** to the committed logs, so the builds are deterministic and the committed evidence reflects real runs. The fresh verifier JSON matches the committed one apart from timestamps and paths.

Raw logs from this QA run: `evidence/IB0-WP01/logs/independent-qa/` (each command log ends with `EXIT_CODE=n`).

## Requested checks (i)–(x)

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| i | Node 24.21.0 is the declared implementation target | **PASS** | Declared in `README.md:45`, implementation plan (lines 49, 50, 75), `evidence/IB0-WP01/reports/toolchain-baseline.md` (lines 7, 17), `ACCEPTANCE_REPORT.md` (lines 10, 70), `logs/npm-ci.log:3`. Matches IB-01 §4.1 ("Node 24 LTS"). `packageManager: npm@11.19.0` is the npm bundled with Node 24.21.0. No document names Node 22 as the target. Formal pinning (`.nvmrc`/`engines`) is correctly left to WP02 (IR-01 §4.4 WP2; SOURCE_OF_TRUTH (iii)). |
| ii | Angular CLI and framework versions exact and compatible | **PASS** | Every `@angular/*` package, `@angular/build` and `@angular/cli` is exactly `22.1.8` in `package.json` and the lockfile; `typescript 6.0.3`, `rxjs 7.8.2`, `tslib 2.8.1`; no `^` or `~`. Peers met: compiler-cli needs TS `>=6.0 <6.1`; core needs rxjs `^6.5.3 \|\| ^7.4.0`; build needs tslib `^2.3.0`. CLI `engines` (`^22.22.3 \|\| ^24.15.0 \|\| >=26`) accepts 24.21.0. `zone.js` is absent (zoneless apps). |
| iii | No Nx dependency introduced | **PASS** | No `nx`, `@nx/*` or `@nrwl/*` in `package.json`, any `packages/*/package.json`, `package-lock.json` or `node_modules` after `npm ci`. No `nx.json`, `project.json` or `workspace.json`. |
| iv | "Nx-compatible / Nx-style" not read as permission to add Nx early | **PASS** (observation 1) | Controlled sources require *Nx-compatible* orchestration, not Nx itself: IB-01 §2.3(ii) (line 205, Nx is not an immutable dependency), IR-01 §4.2 ("exact orchestration tool remains an implementation choice"), WORK_PACKAGE §3 ("metadata files may differ"). The PR did not add Nx and records the deferral in the plan (lines 25, 51, 73), `toolchain-baseline.md:13` and `ACCEPTANCE_REPORT.md:68`. It did not replace Nx either, so no ADR is required yet. |
| v | All 13 restored control files match their fingerprints | **PASS** | Recomputed SHA-256 of `.gitignore` + 12 files under `.paep-control/` at `1d722c3`: 13/13 match `PACK_MANIFEST.json`. They are byte-identical to the contents of main's `PAEP_CTRL.zip`, and none changed in `b9904d0` or `1d722c3`. |
| vi | The nine pack-integrity differences are confined to files WP01 must populate | **PASS** | `validate-pack.mjs` reports exactly 9 HASH MISMATCH, 0 MISSING: root `README.md`, `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md`, `docs/provenance/PROVENANCE-REGISTER.md`, `evidence/IB0-WP01/README.md`, `…/notes/implementation-summary.md`, `…/reports/dependency-baseline.md`, `…/reports/toolchain-baseline.md`, `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md`, `…/TRACEABILITY.csv`. Each is authorised by WORK_PACKAGE §4 (root README, docs, evidence, "pre-supplied traceability and evidence files"), §7(ii)/(vii)/(xi)/(xii) or §9(v)–(viii). Diffs only fill in or add; no heading, AC row or requirement ID was removed. |
| vii | Both apps build from `npm ci` in a fresh checkout | **PASS** | Fresh GitHub clone at `1d722c3`; see gate table above. |
| viii | Strict type and template checking remain enabled | **PASS** (observation 2) | `tsconfig.json` does not set `strict` or `strictTemplates`, but both default to **on**: TypeScript 6.0.3 defaults `strict` to true unless set false; Angular 22 compiler-cli returns `strictTemplates !== false`. Proven by negative production builds in a scratch copy: a TS strict error failed (TS2322, TS7006); template errors failed (TS2345, TS2339, TS2531); a wrong input type failed (TS2322). Control builds with `strict:false` / `strictTemplates:false` passed, which shows the defaults are what is enforcing it. `ng new` 22.1.8 generates the same compiler options, so nothing was removed by the implementer. |
| ix | No tests, compiler settings, lint rules or acceptance criteria weakened | **PASS** (observation 8) | `ACCEPTANCE.md`, `WORK_PACKAGE.md`, `work-package.json`, `QUALITY_GATE_RUNBOOK.md`, `ACCEPTANCE_REPORT_TEMPLATE.md`, `prompts/`, `tooling/verification/*.mjs`, `CLAUDE.md` and `docs/adr/` are byte-unchanged from `origin/main`. The base had no tests, lint or compiler config to weaken. `angular.json` matches Angular 22.1.8 generator output (same 500 kB/1 MB and 4 kB/8 kB budgets). |
| x | AC01–AC15 evidence supports the claimed PASS | **PASS** (observations 4–6) | See the table below. All 24 evidence paths in `TRACEABILITY.csv` exist. |

## Acceptance criteria AC01–AC15

| AC | Result | Why | Evidence |
| --- | --- | --- | --- |
| AC01 | **PASS** | Plan lists sources read and intended file changes. See observation 4 on timing. | `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md` |
| AC02 | **PASS** | Valid Angular CLI workspace at root; Angular 22.1.8; npm. Re-verified with `ng version` and builds. | `angular.json`, `package.json`, `reports/toolchain-baseline.md`, `logs/ng-version.log` |
| AC03 | **PASS** | `reference-app` is CLI generator output plus a neutral placeholder page and empty routes; no workflow. | `apps/reference-app/**`, `logs/build-reference-app.log` |
| AC04 | **PASS** | `ui-lab` likewise; empty styles, no tokens, components or theme. | `apps/ui-lab/**`, `logs/build-ui-lab.log` |
| AC05 | **PASS** | All 18 packages and required tooling/config/docs/evidence folders exist (verifier V06, plus manual check). | `reports/ib0-wp01-verification.json` |
| AC06 | **PASS** | `package-lock.json` (lockfileVersion 3) committed; `packageManager: npm@11.19.0`. | `package.json`, `package-lock.json` |
| AC07 | **PASS** | `npm ci` exit 0 in a fresh clone (this QA run). | `logs/npm-ci.log`; QA log `npm-ci.log` |
| AC08 | **PASS** | Production build exit 0 (this QA run). | `logs/build-reference-app.log`; QA log |
| AC09 | **PASS** | Production build exit 0 (this QA run). | `logs/build-ui-lab.log`; QA log |
| AC10 | **PASS** | Verifier PASS 15/15 and JSON emitted (observation 7 on verifier depth). | `reports/ib0-wp01-verification.json`; QA log |
| AC11 | **PASS** | Exact versions and all direct dependencies with licences recorded; they match the lockfile. | `reports/toolchain-baseline.md`, `reports/dependency-baseline.md` |
| AC12 | **PASS** | 0 violations. Packages hold only a README and a four-field `package.json`. No Frappe, analytics, offline, shell, domain, design-system or PrimeNG/Ultima code or dependency. No IB1 (contracts, runtime config) or IB2 (tokens, components, UI-lab specimens) work present. `favicon.ico` is byte-identical to the Angular CLI template. | independent grep of full PR diff; `logs/scope-and-secret-scan.log` |
| AC13 | **PASS** | 0 findings in an independent secret scan of the PR diff (observation 5 on the PR's own scan log). | independent scan; `logs/scope-and-secret-scan.log` |
| AC14 | **PASS** | All eight WORK_PACKAGE §9 items exist and are indexed. | `evidence/IB0-WP01/README.md` |
| AC15 | **PASS** | 9 requirements mapped to implementation, verification and evidence for AC01–AC15; all paths exist. | `work-packages/IB0-WP01/TRACEABILITY.csv` |

## Observations (non-blocking)

1. **Nx / project graph has no clear owner.** The plan defers it to "IB0-WP04" (line 51) and "IB0-WP03/WP04" (line 73), but no IR-01 §4.4 work package explicitly owns orchestration, while IB-01 §22 and §23 expect "Nx/project graph" at IB0 exit and IR-01 §4.2 shows `nx.json` / `tsconfig.base.json`. The "user direction" for no Nx is not recorded in the repo. **Action:** assign it to a named work package (WP04 is the natural fit). If Nx is ever dropped permanently rather than deferred, raise an ADR against ADR-002 as IB-01 §2.3(ii) requires.
2. **Strictness relies on toolchain defaults.** It is enforced today (proven above), but a future toolchain change could switch it off silently. IB-01 §4.1 lists these as controls. **Action (WP03):** set `strict: true` and `strictTemplates: true` explicitly.
3. **Node version is declared but not enforced.** No `engines`, `.nvmrc` or `devEngines`. Also, npm 11 skipped install scripts for `@parcel/watcher`, `esbuild`, `lmdb` and `msgpackr-extract` (builds still pass). **Action (WP02):** pin Node and decide the `allowScripts` policy. Both are already disclosed by the PR.
4. **AC01 timing can't be proven from git.** The plan was committed in the same commit as the bootstrap (`b9904d0`) and contains facts learned during bootstrap, so "written before any workspace change" is shown only by the plan's own statement. Supporting evidence outside the repository: a pre-implementation report kept in the project's shared folder (not in this repository) lists the intended file changes before any change was made. AC01's wording (sources read, intended changes recorded) is still met.
5. **The PR's scope/secret scan log is a summary, not raw output.** It ran on the working tree about 30 seconds before the commit, reports 89 files scanned (the commit has 84 text files) and does not record the exact commands. The hits it lists are correctly triaged false positives (`@inquirer/password`, `@angular/service-worker` as an optional peer). This QA's own scans found 0 issues.
6. **Minor evidence gaps.** `logs/clean-clone-reproduction.log` is an excerpt, not full output. `ib0-wp01-verification.json` carries no commit hash (the pack's verifier doesn't write one). Committed logs name `b9904d0`; `1d722c3` changes only evidence and docs, so they still apply.
7. **The pack verifier is shallow and overwrites evidence.** V01–V11 check existence only; V12 is a 12-name blocklist on direct dependencies; V13 is a three-pattern secret scan over apps/packages/config; only V14–V15 run real builds; nothing checks the 22.x / 6.0.x families. Re-running it rewrites the tracked verification JSON. This is the pack's design, not a PR defect, but it means AC05, AC12 and AC13 depend on manual review (done here).
8. **Generator test and format tooling omitted.** The PR skipped the generator's Vitest test target, spec files and Prettier config. Nothing pre-existing was removed and WP01 does not require them, but IR-01 §4.5 and EQP §29.1 need unit test and lint baselines by IB0 exit. **Action:** WP05 (CI) or earlier.
9. **`PAEP_CTRL.zip` deleted outside the §4 change boundary.** The only record is the `8259317` commit message. Its content is fully restored byte-for-byte and it remains recoverable from `bed3771`. Low severity; worth confirming as intended.

Also expected, not a defect: `validate-pack.mjs` exits 1 after WP01 because WP01 must fill in 9 templated files. The manifest should be re-baselined (or the validator scoped to immutable files) so it can serve as a gate in later work packages.

## Scope of this QA run

- Per `prompts/02_INDEPENDENT_QA.md`, the QA result would normally be written to `evidence/IB0-WP01/reports/independent-qa.md` and summarised in `ACCEPTANCE_REPORT.md`. This audit was run read-only, so neither PR file was changed.
- Human ACCEPTED status is not recorded by this QA.

This report was filed into the repository unchanged in substance during the IB0-WP01 acceptance closeout on 2026-09-23. The acceptance decision itself is recorded in `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md`.
