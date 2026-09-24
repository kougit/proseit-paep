> **Record note (2026-09-24).** Read-only definition audit (closure lane A) run on commit `39bf00e` before the closure changes, as required by the PO/SA approval condition for the IB0-WP02 definition. Disposition of findings:
> F1: `TRACEABILITY.csv` row `IB0-NPM-001` now also cites the IB0-WP01 deferral. F2: disclosed deviation, owned by IB0-WP04, unchanged. F3: closed by the PO/SA approval of the definition and the authorised `CLAUDE.md` amendment (`WORK_PACKAGE.md` §13). F4: justification added to the implementation plan. F5: `WORK_PACKAGE.md` §4(vii) wording clarified. F6: observation only.

# LANE A — Requirements / Definition Audit — IB0-WP02

Repo: `/home/claude/proseit-paep`, branch `claude/ib0-wp02-c625bb`, HEAD `39bf00e`, baseline `b6b023f`. Audit is read-only (`git status --short` is empty before and after).

Abbreviations: **IR** = `.paep-control/text/PAEP_IR_01_v1.0_text.md`, **IB** = `PAEP_IB_01_v1.0_text.md`, **EQP** = `PAEP_EQP_01_v1.1_text.md`, **V11** = `PAEP_v1.1_text.md`, **WP01-AR** = `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md`. `l.N` is the line number in that file.

## 0. Root authority for IB0-WP02

- The controlled pack defines IB0-WP2 in exactly one place: IR l.247 `| IB0-WP2 | Pin the approved Angular/toolchain baseline and commit the lockfile. | Version manifest; package-lock; build log. |`. `grep -rl "IB0-WP02\|IB0-WP2" .paep-control` returns only that file.
- IB0-WP02 is assigned by the IB0-WP01 deferrals: WP01-AR l.86 `| Node/npm version pinning and npm install-script policy | IB0-WP02 |` and l.87 `| Dependency/licence review for lightningcss and caniuse-lite | IB0-WP02 |`. Residual risk (ii), l.93, says the same.
- `WORK_PACKAGE.md` and `ACCEPTANCE.md` were drafted by Claude in commit `8525598` and have not changed since. `git log` on both files shows only `8525598`, so no criterion was rewritten after implementation began.

## 1. Criterion trace table

| AC | Controlled source (quote, line) | Classification | In WP02 scope |
| --- | --- | --- | --- |
| AC01 Plan before toolchain change | EQP l.382–386: "(i) read the current source-of-truth documents and the work-package brief before modifying code; … (iii) produce a short implementation plan before substantive modification"; EQP §11(iii) "Plan — describe intended files, interfaces, risks and tests before implementation"; EQP §12 Definition of Ready (l.510ff) | TRACED-GOVERNANCE | Y |
| AC02 `.nvmrc` exact Node 24 LTS + devEngines.runtime | IB l.257: "\| Node.js \| Node 24 LTS in the Angular-supported range. \| Exact version pinned in .nvmrc/Volta/asdf or equivalent developer tooling. \|" | TRACED (IB-01) | Y |
| AC03 Node pin enforced (npm ci passes on the pin; fails on a non-matching Node) | IB l.257 (as above, "Exact version pinned"); IR l.277: "\| Reproducibility \| A clean environment reproduces the workspace build without local machine assumptions. \|" | TRACED (IB-01/IR-01) | Y |
| AC04 npm exact pin (packageManager + devEngines) | WP01-AR l.86 "Node/npm version pinning … \| IB0-WP02"; supported by IB l.265 "\| Package manager \| npm workspaces + committed package-lock. \| CI uses npm ci; lockfile drift is release-blocking. \|" and IR l.277 (Reproducibility) | TRACED-GOVERNANCE (IB/IR support only; see F1) | Y |
| AC05 identical exact `@angular/*` 22.y.z; core = CLI | IB l.255: "\| Angular \| 22.x active major; latest approved compatible patch pinned per release. \| @angular/core and Angular CLI remain aligned in the controlled manifest. \|"; IB l.281: "(i) Exact Angular, Node, TypeScript, RxJS, Nx and build-tool versions are recorded in the PAEP release manifest and lockfile." | TRACED (IB-01) | Y |
| AC06 TypeScript exact 6.0.z within the compiler-cli peer range | IB l.259: "\| TypeScript \| 6.0.x for Angular 22 compatibility. \| …"; IB l.281 | TRACED (IB-01). Covers the version only. The same row's `strict=true; strictTemplates=true` is not asserted, so WP03 scope is correctly excluded. | Y |
| AC07 RxJS exact 7.y.z; all other direct deps exact | IB l.261: "\| RxJS \| Supported 7.x line. \| …"; IB l.281; IB l.747: "\| Deterministic dependency gate \| npm ci succeeds from committed lockfile; prohibited unapproved dependency changes fail review. \|" | TRACED (IB-01) | Y |
| AC08 build tools recorded exactly; "Nx: not used (IB0-WP04)" | IB l.281 ("… Nx and build-tool versions are recorded …"); IB l.263: "\| Build system \| Angular application builder. \| No deprecated webpack browser builder …"; WP01-AR l.84: "Nx-compatible project/dependency graph ownership \| IB0-WP04" | TRACED (IB-01), with a documented Nx deviation (F2) | Y. The Nx entry is a scope guard, not Nx adoption. |
| AC09 machine-readable version manifest | IR l.247 "Version manifest"; IB l.281 "recorded in the PAEP release manifest and lockfile"; V11 l.1049: "\| Angular version \| Framework version is pinned in the PAEP release manifest and upgrade policy …" | TRACED (IR-01/IB-01) | Y. This is a toolchain manifest, not the W11 release manifest (WP §5(v)). |
| AC10 lockfile committed, in sync, no drift; negative drift test | IR l.247 "commit the lockfile … package-lock"; IB l.265 "lockfile drift is release-blocking"; IB l.747 (Deterministic dependency gate); IB l.285: "(iii) Framework upgrades are executed in a dedicated branch …" (basis for the no-resolution-change rule) | TRACED (IR-01/IB-01) | Y |
| AC11 fresh-clone `npm ci` | IR l.263: "\| Clean install \| A fresh checkout completes the approved package-manager clean installation from the committed lockfile. \|"; IR l.285: "(ii) A clean installation and full workspace build succeed from a fresh checkout."; IR l.723: "(i) `npm ci` or the approved equivalent shall install from the committed lockfile without manual local fixes." | TRACED (IR-01) | Y. This is a local fresh clone. The CI-hosted run stays in WP05. |
| AC12 reference-app production build in the fresh clone | IR l.247 "build log"; IR l.265: "\| Build \| All current applications and libraries compile successfully. \|"; IR l.285 | TRACED (IR-01) | Y |
| AC13 ui-lab production build in the fresh clone | Same as AC12 | TRACED (IR-01) | Y |
| AC14 install-script (`allowScripts`) policy | WP01-AR l.86 "npm install-script policy \| IB0-WP02"; WP01-AR l.93: "The npm 11 `allowScripts` policy (esbuild, lmdb, msgpackr-extract, @parcel/watcher install scripts) is not yet decided."; supported by IB l.535: "(viii) Dependency lockfiles, vulnerability review, licences and SBOM form part of the release gate." | TRACED-GOVERNANCE | Y |
| AC15 `lightningcss`/`caniuse-lite` licence review, approval pending | WP01-AR l.87; WP01-AR l.76 "Two build-time transitive licences are flagged for review in WP02/SBOM"; IB l.841: "(vi) Preserve clean-room provenance … and review third-party licences before dependency adoption."; V11 l.931 | TRACED (IB-01) and TRACED-GOVERNANCE (WP01 deferral) | Y |
| AC16 full licence inventory, 0 unreviewed | V11 l.931: "\| Open-source dependencies \| Package inventory, licence, version, rationale and approval; obligations reflected in distribution/documentation. \|"; IB l.841; IB l.535 | TRACED-GOVERNANCE (V11 §19), supported by IB-01 | Y. It is not an SPDX release SBOM (W11), and WP §5(v) keeps that distinction explicit. |
| AC17 provenance register updated | EQP l.760: "(iii) every new dependency requires recorded package name, version, licence, rationale and approval status;"; V11 l.931; EQP §13(viii) "new dependencies are approved and reflected in licence/SBOM evidence" | TRACED-GOVERNANCE | Y |
| AC18 no scope creep (absence of WP03/04/05 artefacts, unchanged apps/packages/angular.json/tsconfig) | IR l.249–253 (WP3 strict/aliases, WP4 boundaries/cycles/deep imports, WP5 CI owned by later WPs); IR l.171–177 (IB0–IB2 non-goals); EQP l.400 "(i) changing controlled architecture decisions without an approved ADR …"; CLAUDE.md mandatory rules | TRACED (IR-01). **Scope guard:** it asserts absence and does not introduce WP03/04/05 scope. | Y |
| AC19 no secrets or registry tokens | CLAUDE.md l.30: "Do not introduce secrets, credentials, private keys, database credentials, or bearer tokens into source, examples, runtime configuration, logs, or evidence."; EQP l.406 "(iv) embedding secrets, private keys, privileged credentials … in browser configuration"; IB l.529 | TRACED-GOVERNANCE | Y |
| AC20 controlled-source integrity (13/13) | EQP §2 (l.206–220, source-of-truth hierarchy; "A lower-level prompt may narrow a task but shall not relax higher-level controls"); CLAUDE.md source-of-truth priority; WP §4 "shall not modify (i) `.paep-control/**`, `.gitignore` or `PACK_MANIFEST.json`". The reference commit `8259317` exists ("Restore .paep-control/ and .gitignore from PAEP_CTRL.zip"). | TRACED-GOVERNANCE | Y |
| AC21 IB0-WP01 regression; WP01 evidence byte-unchanged | EQP l.392: "(vi) when a gate fails, diagnose and repair the cause, then rerun the failed gate and affected regression set;"; EQP §11(vii) "Regress"; EQP §23(v) "rerun all affected regression gates" | TRACED-GOVERNANCE | Y |
| AC22 `verify-ib0-wp02.mjs` PASS and JSON report | EQP l.1150: "PRINCIPLE: Exit code 0 denotes technical PASS for an executable gate. A non-zero exit denotes FAIL."; EQP l.810 "(i) evidence must identify the source commit/release under test;"; EQP §24(ii) "machine-readable reports are preferred" | TRACED-GOVERNANCE | Y. A per-WP `qa:ib0-wp02` script is not an aggregate WP05 `qa:*` stage. |
| AC23 evidence retained and indexed with the commit | EQP l.810 (§24(i)); IR l.613: "(i) IB0 evidence shall retain clean-build logs, architecture-boundary checks, compiler/lint results and baseline CI execution records."; IR l.741: "\| IB0 \| Build \| Clean install, type-check, test and build logs. \|" | TRACED-GOVERNANCE (and IR-01) | Y |
| AC24 traceability, §32 report fields, App. C vocabulary | EQP §25 (trace fields incl. "Status \| NOT STARTED / IN PROGRESS / BLOCKED / FAILED / PASS / ACCEPTED"); EQP §32 (acceptance report template, l.1050ff); EQP App. C (l.1156ff) | TRACED-GOVERNANCE | Y |

**Tally:** 13 TRACED to IB-01/IR-01 (AC02, 03, 05–13, 15, 18). 11 TRACED-GOVERNANCE (AC01, 04, 14, 16, 17, 19–24). 0 UNTRACED. AC15 also carries the WP01 deferral trace.

## 2. Scope analysis (WP03 / WP04 / WP05 / later)

- **No criterion introduces WP03 scope.** None requires `strict`/`strictTemplates`, `tsconfig.base.json`, path aliases, public entry points or lint. AC06 pins only the TypeScript version. AC18 requires `tsconfig*.json` to stay unchanged.
- **No criterion introduces WP04 scope.** AC08 records Nx as "not used (IB0-WP04)", and AC18 requires `nx.json`/`project.json` to be absent. There are no tag, boundary, cycle or deep-import criteria.
- **No criterion introduces WP05 scope.** AC11–AC13 are local fresh-clone runs, not CI. AC18 requires CI workflow files to be absent. `qa:ib0-wp02` is a per-WP verifier script, like the existing `qa:ib0-wp01`, not an aggregate stage.
- **No criterion introduces W11 or IB1+ scope.** AC16's licence inventory is explicitly not a release SBOM (WP §5(v)). No SPDX/SBOM tooling exists under `tooling/build-release/`.
- **Scope guards (not creep):** AC18, and the Nx clause of AC08.

## 3. Repository verification: WP03/WP04 still deferred

| Check | Command / observation | Result |
| --- | --- | --- |
| tsconfig/angular.json unchanged | `git diff b6b023f HEAD -- tsconfig.json angular.json` gives 0 lines; `git diff --stat b6b023f HEAD -- 'tsconfig*.json' apps packages` is empty | PASS |
| No explicit `strict`/`strictTemplates` | `grep '"strict' tsconfig*.json apps/*/tsconfig*.json` finds only `strictInjectionParameters` and `strictInputAccessModifiers`. Both are pre-existing baseline values (the diff is empty). | PASS |
| No WP03/WP04/WP05 files | `git ls-files` and `find` (excluding node_modules) find no `nx.json`, `project.json`, `tsconfig.base.json`, `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `vitest/jest/karma` config, or `.github/` (`.github` does not exist) | PASS |
| No Nx in the lockfile | `grep -c '"nx' package-lock.json` = 0; no `@nx/` entries; `node_modules/nx` absent | PASS |
| Dependency names unchanged | The `package.json` diff adds only `devEngines`, the `qa:ib0-wp02` script and `allowScripts`. The dependency and devDependency blocks are untouched. `package-lock.json` is not in `git diff --name-status b6b023f..HEAD` (byte-unchanged). | PASS |
| Changed paths within WP §4 | `.npmrc`, `.nvmrc`, `README.md`, `docs/adr/ADR-REGISTER.md` (note only), `docs/architecture/{plan,manifest}`, `docs/licences/{README,THIRD-PARTY-LICENCE-REVIEW}.md`, `docs/provenance/PROVENANCE-REGISTER.md`, `evidence/IB0-WP02/**`, `package.json`, `tooling/verification/verify-ib0-wp02.mjs`, `work-packages/IB0-WP02/**`. No `apps/**`, `packages/**`, `.paep-control/**`, `work-packages/IB0-WP01/**` or `evidence/IB0-WP01/**`. | PASS (see F4, F5) |
| AC01 commit order | `git log --reverse -- plan package.json package-lock.json .nvmrc` lists `8525598` (plan), then `591b266` (package.json/.nvmrc/.npmrc). `8525598` is the parent. | PASS |

## 4. Traceability completeness

- `TRACEABILITY.csv` has 18 rows and the 8 EQP §25 columns (Requirement ID, Source, Work Package, Implementation Artifact, Acceptance Criteria, Verification, Status, Evidence Location). There are no duplicate requirement IDs.
- AC coverage: all 24 IDs (AC01–AC24) appear in at least one row. None is missing and none is unknown.
- Evidence paths: every `;`-separated path in "Evidence Location" exists on disk (0 missing). This includes the `docs/licences/` directory and the extra logs cited (`lockfile-regenerate-check.log`, `build-output-vs-baseline.log`, `negative-install-script.log`, `erratum-baseline-install-scripts.log`, `licence-dist-check.log`, `verify-ib0-wp01-restore.log`, `ib0-wp01-verification.regression.json`). File paths named in "Implementation Artifact" also exist.
- Statuses: the only value in the CSV is `PASS`, which is in the App. C vocabulary. `ACCEPTANCE_REPORT.md` uses PASS, FAILED, BLOCKED, ACCEPTED, REJECTED and CONDITIONAL. CONDITIONAL and REJECTED appear only in the §32 "Acceptance decision" placeholder (l.130, `[INSERT]`), which EQP §32 itself defines. No COMPLETE, PARTIAL or WAIVED appears.
- Cited sections check out against the controlled text: IB §4.1 (l.249), §4.2 (l.279), §11.1(viii) (l.535), §18.1 (l.741/747), §21.1(vi) (l.841); IR §4.4 (l.239/247), §4.5 (l.257), §4.6(ii) (l.285), §7.2(i) (l.613), App. A(i) (l.723), App. B (l.737); V11 §17 Dependencies row (l.853), §19 (l.931), §22 (l.1049).

## 5. Findings (none blocking)

- **F1 (minor, traceability wording).** Row `IB0-NPM-001` cites only "PAEP-IB-01 §3 Workspace orchestration row and §4.1 Package manager row". Those rows require npm workspaces and a committed lockfile, not an exact npm version. The exact npm pin traces to the WP01 deferral "Node/npm version pinning" (WP01-AR l.86) and to IR-01 Reproducibility (l.277). Recommend adding the WP01 deferral to that row's Source. This does not affect PASS.
- **F2 (known, documented deviation).** IB l.281 requires the Nx version to be recorded, and IB l.219/267 expect Nx-compatible orchestration. The manifest records "Nx: not used (IB0-WP04)". WORK_PACKAGE §11(ii) discloses this, it matches WP01 deferral l.84, and WP04 owns it (ADR-002). It is not a silent reinterpretation, but it remains an open architecture item for WP04.
- **F3 (acceptance condition, not technical).** The whole WP02 definition (WORK_PACKAGE/ACCEPTANCE) was drafted by Claude because the pack had no IB0-WP02 definition beyond IR l.247. It is marked "pending human approval" (R1). R2 is open because `CLAUDE.md` still names IB0-WP01 as the bounded objective. Both must be resolved by a human at or before ACCEPTED. Neither blocks technical PASS under the ACCEPTANCE "Technical result rule".
- **F4 (minor, boundary wording).** WP §4(iii) permits `.npmrc` "only if a policy setting cannot live in `package.json`". `.npmrc` holds `engine-strict=true` and `strict-allow-scripts=true`, which are npm config keys with no `package.json` equivalent, so it is permitted. The plan (l.52, l.54, l.73) records the purpose but does not state the "cannot live in package.json" justification in those words. No credentials are present.
- **F5 (minor, boundary wording).** WP §4(vii) permits `work-packages/IB0-WP02/**`, with the parenthetical "(traceability and acceptance report)". The definition commit also added `prompts/*`, `QUALITY_GATE_RUNBOOK.md` and `ACCEPTANCE_REPORT_TEMPLATE.md`. They are inside the permitted glob and are definition or control artefacts, not implementation.
- **F6 (observation).** WP §7(v) says "Regenerate the lockfile". `package-lock.json` is byte-unchanged vs `b6b023f`, which satisfies AC10 ("no third-party lockfile entry changes") and is the strictest outcome. §7(iii) explains why `engines` was not added.

## 6. Verdict

**DEFINITION AUDIT PASS.**

Reasons:
- All 24 criteria are traced: 13 to IB-01/IR-01, 11 to EQP, PAEP v1.1, CLAUDE.md or the WP01 deferrals, and 0 are untraced.
- No criterion introduces IB0-WP03, WP04, WP05, W11 or IB1+ scope. AC18 and the Nx clause of AC08 are scope guards.
- The repository confirms that WP03/WP04 remain deferred: tsconfig and angular.json are unchanged, there are no Nx, lint or CI artefacts, and there is no Nx in the lockfile.
- `TRACEABILITY.csv` covers AC01–AC24, every evidence path exists, and every status is from the App. C vocabulary.
- The criteria are unchanged since the definition commit `8525598`, which precedes the toolchain changes.
- F1–F6 are wording or acceptance-condition items. F3 (human approval of the self-drafted definition, and the `CLAUDE.md` R2 update) must be closed before ACCEPTED.
