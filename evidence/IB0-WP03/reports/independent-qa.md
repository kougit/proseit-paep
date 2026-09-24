# IB0-WP03 Independent QA Report

Two rounds. Round 1 (below, verbatim apart from log paths) reviewed `f19a422` and passed with findings F1–F8. The implementer fixed F1, F3, F5 and F6 in `0f2d381`. Round 2 (at the end) re-verified the PR head.

## Round 1

| Field | Value |
| --- | --- |
| Work package | IB0-WP03: Compiler, Type-Safety and Static-Quality Baseline |
| Reviewer | Independent Claude QA context. Separate from the implementer. None of the implementer's reports were relied on. Every result below comes from my own runs. |
| Date | 2026-09-24 |
| Commit under review | `f19a4223748be90d98b99e3c47c6477910c5a17f` (branch `claude/ib0-wp03-7s51em`). Implementation commit `15386a9`. `15386a9..f19a422` changes only `evidence/IB0-WP03/**` and `work-packages/IB0-WP03/**`. |
| Baseline | `de13629` (IB0-WP02 merge on `main`) |
| Toolchain | Node v24.21.0, npm 11.19.0 (`/opt/node24/bin`), linux-x64. Resolved TypeScript 6.0.3 and Angular 22.1.8 from the lockfile. |
| Method | 1. Fresh `git clone` of GitHub. No `node_modules`, `dist` or `.angular` before `npm ci`. 2. A separate clone at `de13629` for the baseline build. 3. Independent negative tests in a copy of the tracked files, with `node_modules` symlinked. 4. Independent verifier mutations in a local clone with `.git`. 5. The repo's own runners. 6. Manual review of the controlled sources and the WP03 records. The repository at `/home/claude/proseit-paep` was not modified. Nothing was pushed or committed. |
| Raw logs | `logs/independent-qa-round1/NN-*.log`. Each has a header (date, node, npm, dir, commit, command) and ends with `EXIT_CODE=n`. The helper scripts are in `logs/independent-qa-round1/scripts/`. |

### Checks (i)–(xiii)

| # | Check | Result | Evidence (logs/independent-qa-round1/) |
| --- | --- | --- | --- |
| (i) | **Scope traceability.** AC01–AC24 each trace to a controlled requirement: IB-01 §4.1 TypeScript row; IR-01 §4.3(iv), §4.4 IB0-WP3 and §4.5; PAEP v1.1 §5.4; EQP §8.2(v)-(vi), §13(iii), §15, §16(v), §23, §24, §32 and App. C; the IB0-WP01 deferral; and IB0 baseline regression. No criterion implements WP04 scope (Nx, graph, tags, boundaries, cycles, deep-import enforcement, `tsconfig.base.json`), WP05 scope (CI) or IB1+ scope. AC16 and AC17 are *absence* checks only. Controlled items not implemented: lint/format (EQP §29.1(iii); PAEP §5.4 "approved lint/static-analysis rules"; assigned to WP03 by IB0-WP02 WORK_PACKAGE §5(i)) and `tsconfig.base.json` (also assigned to WP03 by IB0-WP02 §5(i)). Both deferrals are recorded transparently: plan "Decisions and defaults" (ii) and (vi); WORK_PACKAGE §5(iv) and §6(i); definition-audit §(iii); ACCEPTANCE_REPORT manual checks ("Pending") and residual risk (i)-(ii); `work-package.json` `defaults_pending_decision`. Both are marked as awaiting a PO/SA decision. | PASS (see F2, F4) | manual review; 19-evidence-paths.log |
| (ii) | `"strict": true` and `"noImplicitAny": true` appear literally in the root `tsconfig.json` `compilerOptions` (lines 6–7). | PASS | 08-effective-config.log |
| (iii) | `"strictTemplates": true` appears literally in `angularCompilerOptions` (line 76). `@angular/compiler-cli` `readConfiguration` for each `angular.json` build tsConfig gives `strict=true`, `noImplicitAny=true` and `strictTemplates=true` for both reference-app and ui-lab, with 0 config errors. No strict-family key is set to false. Only 3 `tsconfig*.json` files exist, and the app files only extend the root and set `types`. | PASS | 08-effective-config.log |
| (iv) | After a clean `npm ci` (exit 0, 324 packages, 0 vulnerabilities), `npm run build:reference-app` and `npm run build:ui-lab` each exit 0. I built `de13629` in a separate clone. All 12 dist files have identical SHA-256 hashes across the two builds (6 per app). The hashes also match the implementer's `build-output-vs-baseline.log`. | PASS | 01, 02, 04, 05, 06, 07 |
| (v) | **My negative tests.** Q1 is a TS strict violation using a different mechanism: an uninitialised property plus `x.length` on `string\|undefined`. The build fails with exit 1 (TS2564, TS18048). Control Q1c, with `strict:false` and `noImplicitAny:false`, builds with exit 0. Q2 is a template violation: a string bound to a `number` `@Input` of a child component. The build fails with exit 1 (TS2322). Control Q2c, with `strictTemplates:false`, builds with exit 0. Positive control Q0 exits 0. Informational: Q3, a nullable `{{ x.length }}`, fails *with and without* strictTemplates (TS2531), so it is not a strictTemplates-only proof. **Repo runner:** `npm run qa:ib0-wp03:negative` gives PASS 19/19: B0–B2c as specified (TS7006/TS2322; TS2345; controls exit 0) and M0–M13 13/13 detected. Its output matches the committed logs apart from timestamps and the scratch path. It left no scratch directory behind. | PASS | 09, 15 |
| (vi) | `npm run qa:ib0-wp03` gives PASS 18/18 at f19a422 (full mode, builds and regressions included). Of my 11 mutations, 7 were caught: M3 (noImplicitAny moved into the app tsconfig), M4 (duplicate `"strict": false` key), M5 (a re-exporting entry point plus an impl file), M8 (a sub-path alias with no wildcard), M9 (`@ts-ignore` in a `.js` file under apps), M10b (lowercase `@ts-nocheck` in an entry point) and M2 (uppercase `@TS-NOCHECK` in app.ts, which V12 catches only because apps must stay unchanged). **Missed:** M1 `"noCheck": true` in root compilerOptions (verifier PASS 14/14, and the production build then accepts both a TS strict violation and the template violation, exit 0; F1). M10 uppercase `// @TS-NOCHECK` in `packages/foundation/src/index.ts` (verifier PASS; TypeScript honours the uppercase form, as shown by the M2 build passing with a violation; F3). M7 `allowUnreachableCode`/`allowUnusedLabels` added (F1). M6 `extendedDiagnostics.defaultCategory: suppress` (F5). | PASS for the gate as specified. Coverage gaps F1, F3, F5 | 12, 13, 14 |
| (vii) | `verify-ib0-wp02.mjs` was run first, on a clean tree. Result: 19/20. V01–V16 and V18–V20 pass. V17's only finding is "protected paths changed", listing exactly `tsconfig.json` and the 18 `packages/*/src/index.ts`. It rewrote 2 tracked WP02 JSON files, which I restored with `git checkout`. | PASS | 10, 11 (restore) |
| (viii) | `verify-ib0-wp01.mjs` gives 15/15 PASS. I restored its rewritten JSON. `git diff de13629 -- evidence/IB0-WP01 evidence/IB0-WP02 work-packages/IB0-WP01 work-packages/IB0-WP02` is empty. | PASS | 11 |
| (ix) | `package-lock.json` is byte-identical to `de13629` (sha256 `be1154cb…6b46b69`) and unchanged after `npm ci`. Non-script `package.json` fields are identical, including every dependency name and version. The script diff is exactly two additions (`qa:ib0-wp03`, `qa:ib0-wp03:negative`), with nothing changed or removed. | PASS | 03, 17 |
| (x) | No `nx`, `@nx/*` or `@nrwl/*` in the lockfile or `package.json`. No `nx.json` or `project.json`. | PASS | 17 |
| (xi) | None of these exist: `tsconfig.base.json`, eslint/prettier/vitest/jest/karma/dependency-cruiser/madge config, `.github/`. `tooling/architecture-boundaries/` holds only README.md. All 18 entry points strip to exactly `export{};`. 18 aliases map 1:1 to the `package.json` names and each resolves through the TS resolver to its `src/index.ts`, with no wildcard. `apps/**` and `angular.json` are unchanged against `de13629`, and no app imports `@proseit/*`. | PASS | 17, 18 |
| (xii) | 13/13 controlled files (`.gitignore` plus 12 under `.paep-control/`) match the SHA-256 and byte size in `PACK_MANIFEST.json`, with no unlisted file. `.paep-control`, `.gitignore`, `PACK_MANIFEST.json` and `CLAUDE.md` are unchanged against `de13629`. | PASS | 16 |
| (xiii) | Every path in `evidence/IB0-WP03/README.md` and in the `TRACEABILITY.csv` evidence column exists, except the two expected missing files (`reports/independent-qa.md`, `reports/acceptance-readiness.md`). Every AC01–AC24 appears in the traceability file. The committed logs agree with what I observed: same exit codes, 18/18, 19/19, same V17 path list, same dist hashes. The committed logs record commit `15386a9`, and the later commits are docs/evidence only. The ACCEPTANCE_REPORT has all 11 EQP §32 fields. TRACEABILITY statuses are PASS and IN PROGRESS only. Some other records use tokens outside App. C (F6). Secret scan of the 57 changed files: 0 real findings. The only hit is a log that quotes the scan regex itself. | PASS (see F6, F7) | 18, 19 |
| — | `git diff --name-status de13629..HEAD`: 57 paths, all within WORK_PACKAGE §4 (i)–(vi). The plan commit `8d7a643` comes before the first `tsconfig.json`/`packages/**` commit `15386a9`. | PASS | 17, 19 |

### Per-criterion results

| Criterion | QA result | Basis |
| --- | --- | --- |
| AC01 | PASS | `git log --reverse`: the plan was added in 8d7a643, the parent of 15386a9. The plan covers sources, posture, decisions and file changes. |
| AC02 | PASS | Literal keys (log 08); verifier V01 |
| AC03 | PASS | Literal key (log 08); V02 |
| AC04 | PASS | My readConfiguration (log 08); V03/V04; 3 tsconfigs, none sets a strict key to false |
| AC05 | PASS | The tsconfig diff only adds keys; 13 baseline options unchanged; angular.json and app tsconfigs unchanged; builder default AOT. The F1 gap concerns *added* keys and is outside AC05's wording. |
| AC06 | PASS | V07, 0 findings. Case-sensitivity gap: F3. |
| AC07 | PASS | 18/18, no wildcard or deep key (log 18) |
| AC08 | PASS | All entry points are `export {};`; the resolver maps each alias to its entry (log 18); V09 reports 0 diagnostics |
| AC09 | PASS | Runner B1/B1c, and my Q1/Q1c with different codes (logs 09, 15) |
| AC10 | PASS | Runner B2/B2c, and my Q2/Q2c (logs 09, 15) |
| AC11 | PASS | Runner M0 plus 13/13 (log 15). The additional gaps are in F1/F3. |
| AC12 | PASS | Fresh clone, clean state, `npm ci` exit 0 (logs 01, 02) |
| AC13 | PASS | exit 0 (log 04) |
| AC14 | PASS | exit 0 (log 05) |
| AC15 | PASS | Logs 03, 17 |
| AC16 | PASS | Log 17 |
| AC17 | PASS | Log 17 |
| AC18 | PASS | Log 16 |
| AC19 | PASS | Log 18; V14 |
| AC20 | PASS | Verifier PASS. JSON has commit, node 24.21.0, npm 11.19.0 and per-check results. After the run, only `evidence/IB0-WP03/**` was modified (log 12). The wording was amended by Claude after the plan commit (F4). |
| AC21 | PASS | 19/20; bounded V17 finding (log 10); WP02 records restored with 0 diffs (log 11). The exception is pending PO/SA (F2). |
| AC22 | PASS | 15/15; 0 diffs (log 11) |
| AC23 | PASS | README indexes the §7 evidence and names the commit under test (15386a9). The QA and readiness reports are expected later. |
| AC24 | PASS | TRACEABILITY is complete, and its paths exist apart from the expected QA report. §32 fields are all present. See F6 on vocabulary. |

### Findings

| ID | Severity | Finding | Recommended action |
| --- | --- | --- | --- |
| F1 | **Medium** | **Verifier does not guard against added weakening compiler keys.** V05 checks only that *baseline* keys keep their values. WORK_PACKAGE §4(i) says "No other key changes", but nothing enforces it, and V12 permits any `tsconfig.json` edit. I added `"noCheck": true` to the root compilerOptions. The static verifier still passed 14/14. The production build then exited 0 on both the TS strict violation (TS7006/TS2322 suppressed) and the template violation (TS2345 suppressed). So the requirement "production build treats type errors as failures" (IB-01 §4.1) can be switched off undetected. The same gap lets `allowUnreachableCode`/`allowUnusedLabels` in. The committed configuration contains none of these, so the current state is correct. The gap is in regression protection (WORK_PACKAGE §3(v)). | Before acceptance, make V05 an allow-list: root `compilerOptions`/`angularCompilerOptions` keys = baseline ∪ {`strict`, `noImplicitAny`, `paths`, `strictTemplates`}. Also add a denylist check (`noCheck`, `skipDefaultLibCheck`, etc.) over every tsconfig. Add `noCheck: true` as a mutation in the negative runner. Alternatively, the PO/SA records acceptance of the gap with a follow-up. |
| F2 | Medium (decision required) | Two scope defaults are pending a PO/SA decision. (a) Lint/format (EQP §29.1(iii); PAEP §5.4; IB0-WP02 §5(i) named WP03 as owner) is deferred with no tooling added. (b) The IB0-WP02 V17 bounded exception (AC21). Both are recorded transparently. `tsconfig.base.json` is also deferred to WP04, against the IB0-WP02 §5(i) ownership table but consistent with the WP01 acceptance record, and this is also recorded. | PO/SA to decide on lint/format ownership (WP03 follow-up or WP05) and to approve the V17 exception and the `tsconfig.base.json` placement before recording ACCEPTED. |
| F3 | Low | V07's suppression regex is case-sensitive. TypeScript honours `// @TS-NOCHECK`: in my M2 test a violating app.ts built with exit 0. In `packages/*/src/index.ts`, which is a WP03-permitted path, an uppercase `@TS-NOCHECK` passes both V07 and the placeholder check, because comments are stripped. The effect today is nil, since entry points are empty, but the check is weaker than it appears. | Make the V07 regex case-insensitive (`/i`), and consider rejecting any `@ts-` directive in entry-point comments. |
| F4 | Low | Claude reworded AC20 in f19a422, after the plan commit 8d7a643, from "writes nothing outside `evidence/IB0-WP03/`" to "no tracked file outside … is modified after the run". This is disclosed in WORK_PACKAGE §9 and is technically necessary because the WP01 and WP02 verifiers rewrite their own JSON. The claim that it happened "before the first recorded verification run" cannot be proven from git, because the logs and the change landed in the same commit. The definition is still a DRAFT awaiting PO/SA approval. | PO/SA to approve the AC20 wording explicitly when approving the definition (EQP §23). |
| F5 | Observation | `angularCompilerOptions.extendedDiagnostics.defaultCategory: "suppress"` goes undetected. Extended diagnostics are warnings, not strictness, so this is outside the WP03 criteria. It falls under the EQP §8.2(vi) concern about suppression and is relevant to future lint/static-analysis work. | Consider including it in the F1 allow-list. |
| F6 | Low | Some records use status tokens outside the App. C vocabulary: `evidence/IB0-WP03/README.md` "TECHNICAL PASS"; `work-package.json` `"acceptance.status": "PENDING"`, `"independent_qa": "PENDING"` and `definition_status` "DRAFTED". WORK_PACKAGE §8's "TECHNICAL PASS / INDEPENDENT QA PASS / READY FOR AUTHORIZATION" appears to come from the PO/SA instruction. TRACEABILITY and the ACCEPTANCE_REPORT technical result use App. C terms. | Use App. C statuses (PASS, IN PROGRESS, NOT STARTED) in status fields. Keep the reporting phrases in prose only. |
| F7 | Observation | The evidence was recorded at `15386a9`, not at the PR head. I confirmed that `15386a9..f19a422` touches only `evidence/IB0-WP03/**` and `work-packages/IB0-WP03/**`, and I re-ran every gate at f19a422 with the same results. | None. The readiness report should name f19a422, or the final head, as QA-verified. |
| F8 | Observation | No `qa:types` script (EQP §15 / App. B, "recommended"). Type checking is enforced through the production builds and verifier V09. A negative Q3 test showed that nullable template access is rejected even with `strictTemplates:false` (full mode), so negative proofs for strictTemplates must use input or event typing, as both the runner and my Q2 do. | Consider a `qa:types` script with the WP05 CI stages. |

No critical or high findings. Every mandatory criterion AC01–AC24 passes on my independent evidence. F1 is a real gap in verifier coverage, and I recommend fixing it before the PO/SA records ACCEPTED. It does not make the delivered configuration non-conformant or any criterion as written fail.

QA RESULT: PASS

## Round 2

| Field | Value |
| --- | --- |
| Commit under review | `813b7ca0359763a75ca445343ef586c5122f5a67` (PR head, branch `claude/ib0-wp03-7s51em`). Verifier changes in `0f2d381`; evidence re-recorded in `813b7ca`. |
| Date | 2026-09-24 |
| Reviewer | Independent Claude QA context, the same reviewer as round 1. The implementer's round-2 reports were not relied on. |
| Method | 1. Fresh `git clone` from GitHub, with no `node_modules`, `dist` or `.angular` present beforehand. Node 24.21.0 and npm 11.19.0 from `/opt/node24/bin`. 2. Full gate re-run on the head. 3. My own verifier mutations, run with `--static-only` in a separate local clone that has `node_modules` symlinked. 4. Diff review of `f19a422..813b7ca`. `/home/claude/proseit-paep` was not modified. Nothing was pushed. |
| Raw logs | `logs/independent-qa-round2/01..11-*.log`, each with a header and a trailing `EXIT_CODE=n`. The mutation script is at `logs/independent-qa-round2/scripts/mut3.sh`. |

### Results

| # | Check | Result | Evidence (logs/independent-qa-round2/) |
| --- | --- | --- | --- |
| 1 | **F1 reproduction on the verifier.** Positive control P0 passes 14/14. Each of the following now fails with verifier exit 1: R1 `noCheck: true` (V04, V05); R2 `allowUnreachableCode: true` (V04, V05); R3 `allowUnusedLabels: true` (V04, V05); R4 `extendedDiagnostics.defaultCategory: "suppress"` (V04, V05). **New mutations of my own**, all caught: N1 `typeCheckHostBindings: false` added (V05 allow-list); N2 per-check `extendedDiagnostics.checks.invalidBananaInBox: "suppress"` (V04, V05); N3 top-level `exclude` added to the root tsconfig (V05); N4 `noCheck: true` in `apps/ui-lab/tsconfig.app.json` only (V04, V05, V12); N5 `skipDefaultLibCheck: true` added (V05). | PASS | 10 |
| 2 | **F3.** Uppercase `// @TS-NOCHECK` fails V07 both in `packages/foundation/src/index.ts` (R5) and in `apps/reference-app/src/app/app.ts` (R6, where V12 also fails). Mixed-case `// @Ts-Ignore` in an entry point fails V07 (R7). The regex now carries the `/i` flag. | PASS | 10 |
| 3 | **F6 status wording.** `work-package.json` now uses `"status": "PASS"`, `technical_verification: "PASS"` and `independent_qa: "PASS"`. `acceptance.status` is `null`, with a note that it awaits the PO/SA. "PENDING" and "DRAFTED" no longer appear as status values. The README says "technical PASS", and ACCEPTANCE.md's technical result rule now reads "Technical **PASS**". TRACEABILITY uses only PASS (18) and IN PROGRESS (1: the QA row). No "TECHNICAL PASS", "PENDING" or "READY FOR AUTHORI…" token remains in the WP03 records. | PASS | 11 |
| 4 | **Full regression on the head.** `npm ci` exits 0 (0 vulnerabilities). Both production builds exit 0, and `main-*.js` hashes are identical to round 1 and to the `de13629` build. `npm run qa:ib0-wp03` passes 18/18. Its WP02 regression gives 19/20, with V17 listing exactly `tsconfig.json` plus the 18 `packages/*/src/index.ts`. WP01 gives 15/15. Afterwards the tracked tree was modified only under `evidence/IB0-WP03/`, and the WP01/WP02 records match `de13629`. `npm run qa:ib0-wp03:negative` passes 23/23: B0–B2c 5/5, M0–M17 18/18, and the new M14–M17 are all detected. No scratch directory was left behind. The lockfile is byte-identical to `de13629`. Controlled files match 13/13. | PASS | 01–09 |
| 5 | **Change boundary and criteria.** `0f2d381` touches only `tooling/verification/verify-ib0-wp03.mjs`, `tooling/verification/negative-ib0-wp03.mjs` and `work-packages/IB0-WP03/{ACCEPTANCE.md, WORK_PACKAGE.md, work-package.json}`. `813b7ca` touches only `evidence/IB0-WP03/**` and `work-packages/IB0-WP03/**`. There is no change to `tsconfig.json`, `package.json`, `package-lock.json`, `apps/**`, `packages/**`, `angular.json`, `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json` or `CLAUDE.md` since `f19a422`. **ACCEPTANCE.md, f19a422 vs 813b7ca:** AC04 adds the check-disabling options and extendedDiagnostics suppression. AC05 adds the root-key allow-list. AC06 becomes "in any letter case". AC11 grows from 13/13 to 17/17 mutations. The result rule changes only in wording. These are strengthenings only. No criterion was removed or relaxed. | PASS | diff review; 03 |
| 6 | **Evidence.** Every README path and every TRACEABILITY evidence path exists. `reports/acceptance-readiness.md` is missing, as expected. All 14 headed logs and all 3 JSON reports record commit `0f2d38174d57…`. The committed results (18/18, 23/23) match what I observed. The round-1 QA report is retained verbatim, apart from disclosed log-path and heading adaptations, with its raw logs under `logs/independent-qa-round1/`. | PASS | 11 |

### Status of round-1 findings

| ID | Round-1 severity | Status | Note |
| --- | --- | --- | --- |
| F1 | Medium | CLOSED | V05 now allow-lists root keys and V04 deny-lists check-disabling options in every tsconfig. R1–R3 and N1, N3, N4, N5 all confirm it. |
| F2 | Medium | DECISION | The lint/format deferral, the `tsconfig.base.json` placement and the WP02 V17 bounded exception still await the PO/SA. They remain recorded transparently. |
| F3 | Low | CLOSED | V07 is case-insensitive (R5–R7). |
| F4 | Low | DECISION | The AC20 rewording still needs explicit PO/SA approval together with the draft definition. |
| F5 | Observation | CLOSED | extendedDiagnostics suppression is detected at both the default and per-check level (R4, N2). |
| F6 | Low | CLOSED | Status fields now use App. C vocabulary or `null` with a note. |
| F7 | Observation | CLOSED | The evidence now names `0f2d381`. `813b7ca` changes evidence and docs only, and I re-ran the gates at `813b7ca`. |
| F8 | Observation | OPEN | There is still no `qa:types` script. It is recommended only (EQP App. B) and fits naturally with WP05. It does not block. |

### New findings

| ID | Severity | Finding | Recommended action |
| --- | --- | --- | --- |
| G1 | Observation | `CHECK_DISABLING` in the verifier includes `checkJs`. Setting it to `true` *enables* JS checking, so it is not a weakening. It is harmless here, because `allowJs` is off and the V05 allow-list would flag it anyway. ACCEPTANCE.md AC04 repeats the same wording. | Optional: drop `checkJs` from the list, or rename the list "unapproved options". No action needed for acceptance. |
| G2 | Observation | `work-package.json` already records `independent_qa: "PASS"`, and TRACEABILITY row IB0-QA-003 is still IN PROGRESS, both before this round-2 verdict. | Update both after round 2 is recorded. |

No critical, high or medium technical findings remain open. The only open items are F2 and F4, which are PO/SA decisions.

QA RESULT: PASS
