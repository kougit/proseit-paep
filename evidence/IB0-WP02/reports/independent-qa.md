> **Record note (2026-09-24).** Retained verbatim from the independent QA run. In the repository the raw logs are under `evidence/IB0-WP02/logs/independent-qa/` (the report's `iqa/logs/` paths), and the recomputation script is kept as `recompute.mjs.txt` there. Low defects D1–D4 were corrected after this run, without changing code, gates or criteria: D1 requirement count in `ACCEPTANCE_REPORT.md`; D2 summary-table wording now uses the App. C status vocabulary; D3 duplicate section number in `WORK_PACKAGE.md` (amendments section renumbered §13); D4 `logs/clean-clone-reproduction.log` now contains the full output of every gate log from the `0078bb2` run.

# IB0-WP02 Independent QA Report

**Commit under test:** `fd096c1ab0a92921c1d789fe241bb33299b28da1` (branch `claude/ib0-wp02-c625bb`, fresh `git clone` of https://github.com/kougit/proseit-paep.git, clean tree, no `node_modules`/`dist`/`.angular` before `npm ci`)
**Baseline:** `b6b023fea11625360f0bf43cd0bdcba968cda90d` (IB0-WP01 merge). **Controlled-source commit:** `8259317`.
**Reviewer:** independent QA sub-agent, clean context. I did not use any report, log or evidence file in the repository as proof. Every result below comes from my own commands. Raw logs are in `iqa/logs/`.
**Date:** 2026-09-24
**Scope of role:** QA only. I did not modify code, did not record ACCEPTED, and did not approve licences.

## Environment

| Item | Value | Evidence |
| --- | --- | --- |
| OS | Linux 6.18 x64 | — |
| Node (positive gates) | v24.21.0 at `/opt/node24/bin`. PATH was `/opt/node24/bin:/usr/bin:/bin` (Node 22 and `/usr/local/bin` removed). | `logs/toolchain-versions.log` |
| npm (positive gates) | 11.19.0, the npm bundled with Node 24.21.0 | `logs/toolchain-versions.log` |
| Node binary provenance | The nodejs.org `SHASUMS256.txt` was fetched (not blocked). The `node-v24.21.0-linux-x64.tar.xz` download matched sha256 `fd8e59d5…cb2d6`. Its `bin/node` is byte-identical to `/opt/node24/bin/node` (sha256 `7fde7b8a…df4c`, `cmp` exit 0). Its `lib/node_modules/npm` (11.19.0) matches `/opt/node24/lib/node_modules/npm` (`diff -rq` exit 0). | `logs/node-binary-verification.log` |
| Negative toolchain | Node 22.22.2 at `/opt/node22/bin` with npm 10.9.7 | `logs/negative-a-*.log`, `logs/negative-b-*.log` |

## Gate table (positive gates, QUALITY_GATE_RUNBOOK.md)

| # | Gate / command | Result | Log |
| --- | --- | --- | --- |
| i | `node --version` / `npm --version` against `.nvmrc` and `packageManager` | v24.21.0 / 11.19.0: match | `toolchain-versions.log` |
| ii | `npm ci --loglevel=info` (fresh clone) | Exit 0. 324 packages added. **0 install scripts run** (0 `info run` lines). **0 allowScripts warnings.** 0 vulnerabilities. | `npm-ci.log` |
| iii | `git diff --exit-code -- package.json package-lock.json` after ci | Exit 0 | `lockfile-unchanged.log` |
| iii-b | Lockfile sha256, and `git diff --exit-code b6b023f -- package-lock.json` | `be1154cb…6b69` at HEAD and at the baseline. Diff exit 0 (byte-identical). | `lockfile-unchanged.log` |
| iv | `npm install-scripts ls` | "No packages with unreviewed install scripts." Exit 0. | `install-scripts-ls.log` |
| v | `npm run build:reference-app` (production) | Exit 0 | `build-reference-app.log` |
| v | `npm run build:ui-lab` (production) | Exit 0 | `build-ui-lab.log` |
| v | `npx ng version` | CLI, Angular and all 9 `@angular/*` packages at 22.1.8; rxjs 7.8.2; typescript 6.0.3; Node 24.21.0; npm 11.19.0 | `ng-version.log` |
| vi | `npm run qa:ib0-wp02` | **PASS 20/20**, exit 0. Afterwards `git status` shows changes only in `evidence/IB0-WP02/reports/{ib0-wp02-verification.json,licence-inventory.json}`. | `qa-ib0-wp02.log` |
| vii | `node tooling/verification/verify-ib0-wp01.mjs`, then `git checkout -- evidence/IB0-WP01` and `git diff --exit-code b6b023f -- work-packages/IB0-WP01 evidence/IB0-WP01` | **PASS 15/15**, exit 0. After the restore, the baseline diff exits 0. | `verify-ib0-wp01-regression.log` |
| viii | `git diff --stat 8259317 HEAD -- .paep-control .gitignore PACK_MANIFEST.json` | Empty (exit 0) | `recompute.log` |
| extra | Baseline `b6b023f` cloned separately: `npm ci` then both builds on 24.21.0/11.19.0 | Exit 0. At the baseline, npm ran 4 install scripts and printed the "not yet covered by allowScripts" warning. This confirms the WP02 erratum. | `baseline-npm-ci.log`, `baseline-build.log` |
| extra | sha256 of all dist files, candidate against baseline | 12/12 files identical (diff exit 0) | `dist-check.log` |

## Negative tests (each in its own `cp -a` copy of the clean clone; `<nodebin>/node <npm-cli.js> ci` with PATH=`<nodebin>:/usr/bin:/bin`)

| # | Mutation | Expected | Observed | Log |
| --- | --- | --- | --- | --- |
| a | Node 22.22.2 + npm 10.9.7 | non-zero | **Exit 1**, `EBADDEVENGINES` "Invalid devEngines.runtime … does not match v22.22.2". `npm run build:reference-app` on Node 22 also exits 1. | `negative-a-wrong-node.log`, `ac02-ac03-extra.log` |
| b | Node 24.21.0 running the npm 10.9.7 CLI | non-zero | **Exit 1**, `EBADDEVENGINES` "Invalid devEngines.packageManager … 11.19.0 does not match 10.9.7" | `negative-b-wrong-npm.log` |
| c | `rxjs` 7.8.2 → 7.8.1 in `package.json` only | non-zero | **Exit 1**, `EUSAGE` "package.json and package-lock.json … are not in sync … lock file's rxjs@7.8.2 does not satisfy rxjs@7.8.1" | `negative-c-lockfile-drift.log` |
| d | `allowScripts.esbuild` removed | non-zero, `ESTRICTALLOWSCRIPTS` | **Exit 1**, `ESTRICTALLOWSCRIPTS` "esbuild@0.28.2 … not covered by allowScripts" | `negative-d-unreviewed-script.log` |
| e | After `npm ci`: manifest `node_modules/vite` 8.1.5 → 8.1.4, then run the WP02 verifier | exit 1, V11 FAIL | **Exit 1**, "FAIL V11 … manifest 8.1.4 != lockfile 8.1.5; … != installed 8.1.5", 19/20 | `negative-e-manifest-drift.log` |

All five negative tests exited non-zero, as required.

## Independent recomputation (my own script, `iqa/recompute.mjs`, Node built-ins only; `logs/recompute.log`)

| Check | Result |
| --- | --- |
| Install-script coverage | The lockfile has 5 `hasInstallScript` entries: `@parcel/watcher@2.6.0`, `esbuild@0.28.2`, `fsevents@2.3.3`, `lmdb@3.5.6`, `msgpackr-extract@3.0.4`. All 5 have an explicit `allowScripts` entry (all `false`). 0 uncovered. No surplus entries. |
| Licence inventory from the lockfile | 434 third-party entries: MIT 372, ISC 23, MPL-2.0 12, BSD-2-Clause 11, Apache-2.0 8, BSD-3-Clause 5, CC-BY-4.0 1, BlueOak-1.0.0 1, 0BSD 1. 0 missing, unknown or UNLICENSED. The non-permissive entries are only `lightningcss` and its 11 platform binaries (MPL-2.0) plus `caniuse-lite` (CC-BY-4.0). All are `dev: true`. 36 private `@proseit/*` workspace entries (18 links and 18 packages) are listed separately. These counts match the committed `licence-inventory.json` summary. |
| Lockfile licences against installed metadata | 306 installed third-party packages compared, 0 licence or version discrepancies (`licence-installed-crosscheck.log`) |
| Manifest against `.nvmrc`/`package.json`/lockfile/installed tree | 88 comparisons, **0 mismatches**. This covers runtime node/npm (against `.nvmrc`, `devEngines`, `packageManager` and the running Node), the Angular engine range, 12 direct dependencies (package.json, lockfile root, lockfile entry, installed), 15 build tools (lockfile and installed), lockfileVersion, lockfile sha256 and the denied-script set. All AC08 tools are present: @angular/build 22.1.8, esbuild 0.28.2, vite 8.1.5, sass 1.101.0, postcss 8.5.28, lightningcss 1.33.0, browserslist 4.29.0, caniuse-lite 1.0.30001810. Nx is recorded as "not used; … deferred to IB0-WP04". |
| Exact pins / peer ranges | 0 non-exact direct pins. TypeScript 6.0.3 satisfies the compiler-cli peer range `>=6.0 <6.1`. rxjs 7.8.2 satisfies the core peer range `^6.5.3 \|\| ^7.4.0`. |
| Controlled sources | 13/13 files (`.paep-control/**` and `.gitignore`) match the `PACK_MANIFEST.json` sha256 and byte size. `git diff 8259317 HEAD -- .paep-control .gitignore PACK_MANIFEST.json` is empty. `PACK_MANIFEST.json` is unchanged from `b6b023f`. |

## Scope, secrets and distribution (`logs/scope.log`, `logs/secret-scan.log`, `logs/dist-check.log`)

- **Changed paths:** `git diff --name-status b6b023f HEAD` shows 66 paths. All of them fall inside WORK_PACKAGE §4: `.npmrc`, `.nvmrc`, `CLAUDE.md` (the one authorised amendment), `README.md`, `docs/adr/ADR-REGISTER.md`, `docs/architecture/{IB0-WP02-IMPLEMENTATION-PLAN.md,toolchain-version-manifest.json}`, `docs/licences/*`, `docs/provenance/PROVENANCE-REGISTER.md`, `evidence/IB0-WP02/**`, `package.json`, `tooling/verification/verify-ib0-wp02.mjs` and `work-packages/IB0-WP02/**`.
- **Absent files:** there is no nx.json, project.json, tsconfig.base.json, eslint, prettier, vitest, vite, jest or karma config, and no `.github/`. The lockfile contains no Nx.
- **Unchanged from the baseline:** `apps/`, `packages/`, `angular.json` and all 3 `tsconfig*.json` files (diff exit 0).
- **Dependencies:** the dependency and devDependency names are unchanged. `package.json` differs only by the added `devEngines`, the added `allowScripts` and the new `qa:ib0-wp02` script.
- **Runtime closure (`npm ls --omit=dev --all`):** `@angular/{common,compiler,core,forms,platform-browser,router}`@22.1.8, rxjs 7.8.2, tslib 2.8.1, zod 4.4.3, `@standard-schema/spec` 1.1.0 and 18 `@proseit/*` workspace links. `zone.js` and `@angular/animations` appear only as UNMET OPTIONAL peers and are not installed.
- **`.npmrc`:** exactly `engine-strict=true` and `strict-allow-scripts=true` (45 bytes). There are no credentials.
- **Secret signatures:** I scanned the 65 added or modified files. The pattern matched in 2 places, and neither is a credential:
  - the regex source line in `verify-ib0-wp02.mjs:131`;
  - the criterion text in `ACCEPTANCE.md` AC19.

  There are no proxy URLs, JWTs or userinfo URLs in the evidence or docs. **0 real findings.**
- **Dist licence check:**
  - `grep -rilE 'lightningcss|caniuse|MPL-2\.0|Mozilla Public|CC-BY|Creative Commons|Attribution 4\.0' dist` found no match (exit 1).
  - The positive control `grep -cE 'rxjs|tslib' dist/*/3rdpartylicenses.txt` matched 2 lines per app (exit 0).
  - `3rdpartylicenses.txt` lists only @angular/{core,common,platform-browser,router}, rxjs and tslib.
- **lightningcss removed:** with `node_modules/lightningcss*` deleted in a scratch copy, both builds exit 0 and the dist output is byte-identical (`lightningcss-removed-build.log`). This confirms the review's claim that the build does not load it.
- **Upstream licence:** the installed `lightningcss/LICENSE` is byte-identical to upstream tag `v1.33.0` (`lightningcss-upstream-licence.log`).

## Governance checks

(i) **CLAUDE.md compared with b6b023f** (`logs/claude-md-diff.log`; one commit, `0078bb2`):
- **What changed:**
  - The title lost its "— IB0-WP01" suffix.
  - Source-of-truth items 6–7 and execution-discipline items 7–8 now point to `<authorised work package>`.
  - "Implement only what IB0-WP01 requires" became "…the authorised work package requires".
  - The "Current bounded objective" section became "Work-package authorisation", containing the required rule verbatim: "Claude shall execute only the work package explicitly authorised by the Product Owner / Solutions Architect in the current instruction. Claude shall not begin, implement, merge, or otherwise advance a subsequent work package without new explicit authorisation." It also adds that ACCEPTED and merge authorisation remain PO/SA decisions.
- **Absent:** "IB0-WP02" appears nowhere in the file (grep exit 1).
- **Retained, unchanged:**
  - the source-of-truth hierarchy and conflict rule;
  - the Angular 22.x / TS 6.0.x / npm-workspaces baseline and the ADR rule;
  - the clean-room, secret and anti-weakening rules;
  - the "no COMPLETE while failing" rule;
  - execution discipline 1–10, including fix-until-pass (5–6), evidence (7–8) and "Technical PASS does not equal human ACCEPTED" (10);
  - the stop conditions.
- **Result:** no relaxation found. **PASS.**

(ii) **Licence records** (`THIRD-PARTY-LICENCE-REVIEW.md` §3/§4, `THIRD-PARTY-NOTICES.md` N1/N2, `PROVENANCE-REGISTER.md`). For both lightningcss and caniuse-lite, these files record:
- the resolved version: 1.33.0 and 1.0.30001810, matching the lockfile and installed tree;
- the direct/transitive status: transitive dev only. `npm explain` confirms `@angular/build` → vite 8.1.5 → lightningcss and `@angular/build` → browserslist 4.29.0 → caniuse-lite. `npm ls --omit=dev` returns empty.
- the build-time purpose;
- the licence: MPL-2.0 and CC-BY-4.0, matching package metadata and the LICENSE files;
- the upstream provenance: github.com/parcel-bundler/lightningcss, and github.com/browserslist/caniuse-lite with the data from caniuse.com. The installed caniuse-lite author is Ben Briggs, which matches the record.
- the distribution assessment: not distributed, which my dist checks confirm;
- the notice obligations;
- the disposition "APPROVED BUILD-TIME DEPENDENCY" (PO/SA, 2026-09-24);
- the re-review triggers, with the wording required by the authorisation;
- caniuse-lite attribution to caniuse.com (Alexis Deveria).

**PASS.** See observation O1 on decision rights.

(iii) **TRACEABILITY.csv** (`logs/traceability-evidence.log`): 20 rows with 8 columns each, covering AC01–AC24 (0 missing). Every status is PASS. All evidence paths exist (0 missing). All 23 evidence files required by WORK_PACKAGE §10, plus the docs, report and CSV, are present and non-empty. **PASS.**

(iv) **No IB0-WP03 or IB0-WP04 work:** `tsconfig*.json` and `angular.json` are unchanged, so there are no strict/strictTemplates changes and no path aliases. There is no tsconfig.base, lint or format config, no Nx, no project.json and no graph or boundary tooling. **PASS.**

(v) **Definition integrity:** `ACCEPTANCE.md` and `QUALITY_GATE_RUNBOOK.md` are byte-unchanged since their drafting commit `8525598` (diff empty). The WORK_PACKAGE.md changes since then are limited to the status and approval records and to the §4(vii)–(ix) boundary updates that the PO/SA approved (`logs/definition-changes.log`). No criterion text changed.

## Acceptance criteria AC01–AC24

| AC | Result | My evidence |
| --- | --- | --- |
| AC01 | PASS | `git log --reverse`: the plan was added in `8525598`, which is the parent of `591b266`, the first commit touching package.json, .nvmrc or .npmrc. The lockfile was never changed. The plan records sources read, R1–R3, selected versions, the install-script and licence approach, and intended file changes (`ac01-plan-order.log`). |
| AC02 | PASS | `.nvmrc` is `24.21.0\n` and matches the regex. The version is inside `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`. `devEngines.runtime` is {node, 24.21.0, onFail error} (`ac02-ac03-extra.log`, `recompute.log`). |
| AC03 | PASS | `npm ci` exits 0 on 24.21.0. On Node 22.22.2, `npm ci` exits 1 with `EBADDEVENGINES` (negative a). |
| AC04 | PASS | `packageManager` is npm@11.19.0 and `devEngines.packageManager` is {npm, 11.19.0, error}. The running npm is 11.19.0 and byte-identical to the npm in the official Node 24.21.0 tarball. Negative b exits 1. |
| AC05 | PASS | All 9 `@angular/*` packages are exactly 22.1.8 in package.json, the lockfile root, the lockfile entries, the installed tree and `ng version`. There are no ranges, tags, URLs or git specs. |
| AC06 | PASS | typescript 6.0.3 is exact and within the peer range `>=6.0 <6.1`. The lockfile and installed tree agree. |
| AC07 | PASS | rxjs 7.8.2 is within `^6.5.3 \|\| ^7.4.0`. All 12 direct dependencies are exact. |
| AC08 | PASS | The manifest has all 8 AC08 tools, equal to the lockfile and installed tree, and records Nx as "not used; … IB0-WP04". |
| AC09 | PASS | `docs/architecture/toolchain-version-manifest.json` has reviewedOn 2026-09-23 and references `registry-review.log`. My recomputation found 0 mismatches in 88 comparisons. Negative e shows the verifier detects drift. `reports/version-manifest.md` exists. |
| AC10 | PASS | Lockfile v3. The post-ci diff exits 0. The lockfile is byte-identical to `b6b023f`, so there are 0 third-party changes. Negative c exits 1. |
| AC11 | PASS | Fresh clone with no node_modules, dist or .angular; `npm ci` exits 0. |
| AC12 | PASS | `build:reference-app` exits 0. |
| AC13 | PASS | `build:ui-lab` exits 0. |
| AC14 | PASS | All 5 `hasInstallScript` packages are explicitly denied. `install-script-policy.md` records the rationale and the name-only (not version-pinned) entries. `npm ci` shows no "not yet covered" warning and runs 0 scripts. `install-scripts ls` is clean. Builds pass. Negative d exits 1 with `ESTRICTALLOWSCRIPTS`. |
| AC15 | PASS | The review under `docs/licences/` has the versions, the dependency paths (verified with `npm explain`), and build-time use. That use is verified by my dist grep with a positive control and by the identical build with lightningcss removed. It also records obligations, the disposition and an explicit approval status (a human approval, dated). |
| AC16 | PASS | The inventory JSON and MD exist. My recomputation from the lockfile matches the counts. There are 0 missing or unknown licences. Every licence is in the recorded permissive set or covered by L1/L2. The 36 workspace entries are listed separately. |
| AC17 | PASS | The register has rows for every direct dependency, Node, npm, the AC08 tools (Angular row plus material-tools row), lightningcss, caniuse-lite and the install-script policy. Each row has version, source, licence, rationale and approval status. The only "Approved" rows (lightningcss, caniuse-lite) name the PO/SA and the date 2026-09-24. |
| AC18 | PASS | See the scope section: dependency names unchanged, no forbidden files, protected paths unchanged, runtime closure as expected, all paths within §4. |
| AC19 | PASS | 0 credential findings across the 65 added or modified files. `.npmrc` holds policy settings only. |
| AC20 | PASS | 13/13 files match sha256 and size. The diff since `8259317` is empty. `PACK_MANIFEST.json` is unchanged. |
| AC21 | PASS | The WP01 verifier reports 15/15. After the restore, `git diff --exit-code b6b023f -- work-packages/IB0-WP01 evidence/IB0-WP01` exits 0. |
| AC22 | PASS | The verifier reports 20/20 and exits 0. The JSON contains commit, node, npm and per-check results. Tracked changes after the run are only under `evidence/IB0-WP02/`. See observation O3. |
| AC23 | PASS | All §10 evidence exists. `evidence/IB0-WP02/README.md` indexes it and names commit `0078bb2` as the commit under test. `0078bb2..fd096c1` changes only `evidence/IB0-WP02/**` and `ACCEPTANCE_REPORT.md`. The committed evidence (lockfile sha, 20/20, 15/15, 13/13, licence counts, dist hashes, negative outcomes, the erratum) agrees with what I observed at `fd096c1`. See D4. |
| AC24 | PASS | The CSV covers AC01–AC24 and all its evidence paths exist. `ACCEPTANCE_REPORT.md` contains all 11 fields from §32. The work-package status values (Technical result, CSV status) are PASS, from the App. C vocabulary. See D1 and D2. |

**Counts:** AC 24/24 PASS, 0 FAIL, 0 BLOCKED, 0 N/A. Positive gates all exit 0 (qa:ib0-wp02 20/20, verify-ib0-wp01 15/15). Negative tests 5/5 non-zero.

## Defects found

| ID | Severity | Description | Smallest corrective action |
| --- | --- | --- | --- |
| D1 | Low | The "Requirement traceability" section of `ACCEPTANCE_REPORT.md` says TRACEABILITY.csv "maps 18 requirements", but the CSV has 20 rows (IB0-LIC-002 and IB0-GOV-001 were added later). | Change "18" to "20". |
| D2 | Low | The `ACCEPTANCE_REPORT.md` summary table uses non-App. C wording as status values: "Independent QA: Not yet run" and "Acceptance status: Not accepted". I did not treat this as a failure of AC24. The work-package status fields use PASS, and the §32 acceptance-decision field is correctly left blank. | Use App. C terms, for example "Acceptance status: PASS (human ACCEPTED pending)", and record this independent QA result. |
| D3 | Low (cosmetic) | `WORK_PACKAGE.md` has two sections numbered "## 12." ("Exit rule" and "Controlled amendments at approval"). | Renumber the second as §13 and update the references to "§12" that mean the amendments. |
| D4 | Low (evidence form) | WORK_PACKAGE §10 lists `logs/clean-clone-reproduction.log` as "(full output, not an excerpt)". The committed file is a 961-byte summary of gate exit codes that points to the per-gate logs. The full per-gate outputs from the same clone are in those logs (e.g. `npm-ci.log`, 34.6 KB), and I reproduced every result myself. | Make the log contain, or concatenate, the full output of the fresh-clone run, or state explicitly that the per-gate logs make up the full output. |

No Critical, High or Medium defects.

## Observations (not defects)

- **O1 – licence decision rights.** PAEP v1.1 gives licence decisions to the Engineering Governance / IP owner. The lightningcss and caniuse-lite dispositions were issued by the PO/SA. The repository says this openly (`closure-authorisation.md`, `THIRD-PARTY-LICENCE-REVIEW.md` status line), and the acceptance report's "Licence dispositions (Engineering Governance / IP owner)" field is still `[INSERT]`. The accepting reviewer must decide at acceptance whether this is sufficient. I cannot see the PO/SA instruction itself, and I recorded no licence approval.
- **O2 – stale plan text.** The implementation plan keeps pre-approval text ("Dispositions stay Proposed…", "Not changed: … CLAUDE.md") next to a closure note. It is historical and does not affect any criterion.
- **O3 – verifier side effects.** The WP02 verifier runs the production builds, which write the gitignored `dist/` and `.angular/`. No tracked file outside `evidence/IB0-WP02/` changes.
- **O4 – commit under test in the evidence.** The committed evidence names `0078bb2` as the commit under test. `fd096c1` adds only evidence and acceptance-report changes, and my runs at `fd096c1` reproduce the same results.
- **O5 – not verified.** `npm audit signatures` was not run by the implementer. The review records this, and I did not run it either.

INDEPENDENT QA RESULT: PASS
