# Work Package IB0-WP02 — Toolchain/Version Baseline and Lockfile Control

**Controlled roadmap mapping:** PAEP-IR-01, IB0-WP2 ("Pin the approved Angular/toolchain baseline and commit the lockfile." Required evidence: "Version manifest; package-lock; build log.")  
**Milestone:** IB0 — Workspace and Architecture Governance Baseline (PAEP-EQP-01 WBS W1 / IB0)  
**Predecessor:** IB0-WP01 — ACCEPTED 2026-09-23 (merge commit `b6b023f`)  
**Design classification:** D0 — not a UI work package; no design handoff required (PAEP-DCH-01 §5 applies to UI work packages only)  
**Execution agent:** Claude Code  
**Acceptance authority:** Solutions Architect / Main Product Owner or delegated technical reviewer; licence dispositions additionally require the Engineering Governance / IP owner (PAEP v1.1 Approval and Decision Rights)  
**Definition status:** **APPROVED** on 2026-09-24 by the Product Owner / Solutions Architect (24 acceptance criteria, unchanged). Drafted by Claude Code on 2026-09-23 from PAEP-IR-01 §4.4 (IB0-WP2), PAEP-IB-01 §4 and the IB0-WP01 deferrals, because the controlled pack supplied no IB0-WP02 definition. The approval was conditional on every criterion tracing to IB-01/IR-01 requirements without WP03, WP04 or later scope; the definition audit that confirmed this is `evidence/IB0-WP02/reports/definition-audit.md`. Controlled amendments made at approval are listed in §13.

## 1. Objective

Formally pin and enforce the approved PAEP toolchain baseline recorded during IB0-WP01 (Node.js, npm, Angular framework/CLI, TypeScript, RxJS, build tools), commit a lockfile that is provably in sync and unchanged by a clean install, record the versions in a machine-readable version manifest, and close the IB0-WP01 deferrals for the npm install-script policy and the `lightningcss` / `caniuse-lite` licence review. Later IB0 work packages then add strictness, boundaries and CI on a fixed, reproducible toolchain.

## 2. Readiness conditions (PAEP-EQP-01 §12)

The implementation plan (`docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md`) records how each condition is met:

(i) **R1: execution authorised.** The Product Owner / Solutions Architect instructed execution of IB0-WP02 in the PAEP project thread on 2026-09-23. Claude drafted this `WORK_PACKAGE.md` and `ACCEPTANCE.md` and may not approve them itself. They are submitted with the implementation for human approval, and the acceptance authority may amend a criterion, in which case the work is re-verified against the amended criterion before ACCEPTED. **Closed 2026-09-24:** the PO/SA approved the definition with all 24 criteria unchanged.

(ii) **R2: execution contract.** The root `CLAUDE.md` still names IB0-WP01 as the current bounded objective, and its items 6–7 point to `work-packages/IB0-WP01/`. Claude does not edit its own execution contract. The Product Owner / Solutions Architect instruction to execute IB0-WP02 is the authority for this run; every mandatory rule and stop condition in `CLAUDE.md` is still applied. **Closed 2026-09-24:** the PO/SA expressly authorised Claude to amend `CLAUDE.md` once, replacing the IB0-WP01-specific objective with a durable, work-package-neutral authorisation rule. See §11(i) and §13.

(iii) **R3: Node enforcement strictness.** Default taken: an exact `24.21.0` in both `.nvmrc` and `devEngines.runtime`, with `onFail: "error"`, as PAEP-IB-01 §4.1 requires an exact pin. See §11.

## 3. Required outcome

(i) The Node.js version is pinned exactly in `.nvmrc`, as PAEP-IB-01 §4.1 requires. npm enforces the same version: `npm ci` and `npm run` fail on a non-matching Node.

(ii) The npm version is pinned exactly (`packageManager`), and npm enforces it.

(iii) Every direct dependency is an exact version. `@angular/core` and the Angular CLI stay aligned on a single 22.x.y version. TypeScript is an exact 6.0.x and RxJS is an exact 7.x.

(iv) A machine-readable version manifest records the exact Node, npm, Angular, Angular CLI/build, TypeScript, RxJS, tslib and material build-tool versions. It states that Nx is not used (orchestration deferred to IB0-WP04). Every value in it matches `.nvmrc`, `package.json`, `package-lock.json` and the installed tree.

(v) `package-lock.json` is committed. It is in sync with `package.json`, and a clean `npm ci` leaves it byte-identical. Drift is shown to be rejected.

(vi) A fresh clone installs with `npm ci` and builds both starter applications in production configuration on the pinned toolchain.

(vii) An explicit npm install-script (`allowScripts`) policy covers every lockfile package that declares an install script, and records the rationale for each.

(viii) A full third-party licence inventory exists, with no unreviewed licence. The review and proposed disposition for `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) are recorded, and their approval status is explicit.

(ix) The provenance register reflects the pinned toolchain.

## 4. Permitted change boundary

Claude may create or modify:

(i) Root `package.json`. Allowed changes: `engines`, `devEngines`, `packageManager`, `allowScripts`, and a `qa:ib0-wp02` script. The dependency and devDependency *names* shall not change. Version values may change only as described in §6(iv).

(ii) Root `package-lock.json`, regenerated only by npm itself (for example `npm install --package-lock-only` on the pinned toolchain). Manual edits are not allowed.

(iii) New `.nvmrc`. Optionally a new `.npmrc`, only if a policy setting cannot live in `package.json`. It shall contain no registry credentials.

(iv) `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md` (new) and `docs/architecture/toolchain-version-manifest.json` (new, or another path recorded in the plan).

(v) `docs/licences/` (new licence register/inventory), `docs/provenance/PROVENANCE-REGISTER.md`, and `docs/adr/ADR-REGISTER.md` (a note only; see §8).

(vi) `tooling/verification/verify-ib0-wp02.mjs` (new; Node built-ins only).

(vii) `evidence/IB0-WP02/**` (new), `work-packages/IB0-WP02/**` (traceability, acceptance report, and this package's prompts, runbook and report template), and the root `README.md` (toolchain/pinning section).

(viii) `CLAUDE.md`: one amendment only, expressly authorised by the PO/SA on 2026-09-24 (§13). It replaces the work-package-specific scope restriction with a work-package-neutral rule and relaxes no control.

(ix) Nothing else.

Claude shall **not** modify:

(i) `.paep-control/**`, `.gitignore` or `PACK_MANIFEST.json`.

(ii) The pack verifiers `tooling/verification/validate-pack.mjs` and `verify-ib0-wp01.mjs`.

(iii) Any file under `work-packages/IB0-WP01/` or `evidence/IB0-WP01/`. This is accepted evidence.

(iv) `apps/**`, `packages/**`, `angular.json` or `tsconfig*.json`.

## 5. Out of scope

(i) **IB0-WP03:** explicit `strict`/`strictTemplates`, other compiler-option changes, `tsconfig.base.json`, path aliases, package public entry points, and lint/format tooling.

(ii) **IB0-WP04:** Nx or any other orchestration/project-graph tool, `nx.json`, `project.json`, architecture tags, boundary rules, cycle detection and deep-import rules.

(iii) **IB0-WP05:** CI workflows (for example `.github/workflows/**`), the unit-test runner (Vitest), aggregate `qa:*` stages, and CI-hosted reproducibility runs.

(iv) **IB1 and later:** the runtime configuration schema/validator (IB1), design tokens and components (IB2), the enterprise shell (IB3), Frappe/ERPNext integration, analytics/reporting UI, offline/PWA, domain kits and product screens.

(v) **Release engineering (W11):** the release manifest, SPDX release SBOM tooling under `tooling/build-release/`, and release attestation. WP02 may keep a non-release SBOM snapshot as supplementary evidence, but it shall not claim release SBOM compliance.

(vi) Adding, removing or replacing any dependency, including UI kits, chart libraries, state frameworks, auth libraries, backend clients and commercial/proprietary templates.

(vii) Re-baselining `PACK_MANIFEST.json`.

## 6. Architecture and control constraints

(i) Do not change the controlled Angular 22.x / TypeScript 6.0.x / Node 24 LTS / npm-workspaces posture (PAEP-IB-01 §3, §4.1). Changing it needs an approved ADR.

(ii) `@angular/core` and the Angular CLI shall remain aligned in the controlled manifest (PAEP-IB-01 §4.1).

(iii) Do not use developer-preview or experimental Angular APIs or builders (PAEP-IB-01 §4.2(iv)). Do not use the deprecated webpack browser builder (§4.1).

(iv) Retain the IB0-WP01 versions (Angular/CLI 22.1.8, TypeScript 6.0.3, RxJS 7.8.2, tslib 2.8.1, Node 24.21.0, npm 11.19.0) unless the plan records a registry review showing a newer stable patch *within the same controlled family*, together with the human approval of that change. A framework upgrade is executed as a dedicated change with a compatibility run (PAEP-IB-01 §4.2(iii)). Registry state on 2026-09-23: `@angular/cli`/`@angular/build` `latest` = 22.1.8, `@angular/core` `latest` = 22.2.0, TypeScript 6.0.x newest = 6.0.3, RxJS `latest` = 7.8.2, Node v24 newest LTS = 24.21.0 (npm 11.19.0). No change is indicated.

(v) The lockfile is generated by npm. Third-party `resolved`/`integrity`/`version` values shall not change relative to `b6b023f` unless §6(iv) applies. Any change shall be listed in the lockfile diff report.

(vi) Do not introduce secrets, registry tokens or credentials, including in `.npmrc`.

(vii) Licence approval is a human (Engineering Governance / IP owner) decision. Claude records the analysis and a *proposed* disposition only (PAEP-EQP-01 §1.3(iv)). The `lightningcss` and `caniuse-lite` dispositions were decided by the PO/SA on 2026-09-24 and are recorded in `docs/licences/`.

## 7. Implementation tasks

(i) Read the controlled sources, the IB0-WP01 acceptance report/QA findings and this package. Record the plan, readiness conditions R1–R3, selected versions and intended file changes in `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md`. Commit it before any toolchain file changes.

(ii) Capture the registry dist-tags and Node release index used for the version review into evidence.

(iii) Add `.nvmrc` and `devEngines` (runtime + packageManager, `onFail: "error"`), and confirm `packageManager`. A root `engines` field is not added: npm records it in the root lockfile entry, so adding it would change `package-lock.json` without adding enforcement that `devEngines` does not already give (see the implementation plan).

(iv) Decide and record the `allowScripts` policy for every lockfile entry with `hasInstallScript: true`: `@parcel/watcher`, `esbuild`, `fsevents` (macOS-only), `lmdb` and `msgpackr-extract`. Record whether entries are version-pinned. Do not run `npm install-scripts prune` on a platform where optional packages are absent.

(v) Regenerate the lockfile with npm on the pinned toolchain. Prove there is no third-party resolution change against `b6b023f`.

(vi) Create the version manifest.

(vii) Produce the licence inventory (machine-readable plus summary), the `lightningcss`/`caniuse-lite` review, and the provenance register update.

(viii) Write `tooling/verification/verify-ib0-wp02.mjs` and the `qa:ib0-wp02` script. The verifier writes only under `evidence/IB0-WP02/`.

(ix) Run the gates in `QUALITY_GATE_RUNBOOK.md`: a fresh clone, the negative tests, and the IB0-WP01 regression. Retain the evidence and update the traceability and the acceptance report.

## 8. ADR position

No ADR is required. Exact Node pinning ("in .nvmrc/Volta/asdf or equivalent developer tooling"), npm workspaces with a committed lockfile, and `npm ci` are already controlled by PAEP-IB-01 §4.1. `devEngines` and `allowScripts` are "equivalent developer tooling" and dependency-hygiene controls. They are not new cross-cutting dependencies (PAEP-IB-01 §21.1(ii)) and not package/dependency-direction changes (PAEP-EQP-01 §16(vi)).

If execution finds that a controlled decision must change, Claude shall stop and draft an ADR proposal (PAEP-EQP-01 §33.3). Examples: a different Node major, a TypeScript 7 requirement, or permanently dropping Nx (ADR-002 in PAEP-IB-01 App. F, owned by IB0-WP04).

## 9. Mandatory QA commands

```text
nvm use            # or equivalent; node --version must print v24.21.0
npm ci
git diff --exit-code -- package.json package-lock.json
npm run build:reference-app
npm run build:ui-lab
node tooling/verification/verify-ib0-wp02.mjs
node tooling/verification/verify-ib0-wp01.mjs   # regression; see runbook: must not alter IB0-WP01 evidence
```

Negative checks, run only in a scratch copy:

(i) `npm ci` on a non-pinned Node (for example 22.x) exits non-zero.

(ii) `npm ci` after a deliberate `package.json` version edit, without a lockfile update, exits non-zero.

## 10. Evidence required

(i) `evidence/IB0-WP02/README.md`: the evidence index, naming the commit under test.

(ii) `evidence/IB0-WP02/logs/`:
- `npm-ci.log`
- `lockfile-unchanged.log`
- `build-reference-app.log`
- `build-ui-lab.log`
- `ng-version.log`
- `toolchain-versions.log`
- `registry-review.log`
- `install-scripts-ls.log`
- `negative-node-version.log`
- `negative-lockfile-drift.log`
- `clean-clone-reproduction.log` (full output, not an excerpt)
- `verify-ib0-wp02.log`
- `verify-ib0-wp01-regression.log`
- `controlled-source-integrity.log`
- `scope-and-secret-scan.log` (raw commands and output)

(iii) `evidence/IB0-WP02/reports/`:
- `ib0-wp02-verification.json`
- `version-manifest.md`
- `lockfile-diff.md`
- `install-script-policy.md`
- `licence-inventory.json`
- `licence-inventory.md`

(iv) `evidence/IB0-WP02/notes/implementation-summary.md`.

(v) `docs/architecture/toolchain-version-manifest.json`, `docs/licences/` licence register (including the `lightningcss`/`caniuse-lite` review), and the updated `docs/provenance/PROVENANCE-REGISTER.md`.

(vi) The completed `work-packages/IB0-WP02/ACCEPTANCE_REPORT.md` and `TRACEABILITY.csv`.

## 11. Known source conflicts and handling

(i) **`CLAUDE.md` bounded objective names IB0-WP01 only.** Handling: readiness condition R2. Claude executed IB0-WP02 under the Product Owner / Solutions Architect instruction and applied every `CLAUDE.md` rule and stop condition. **Resolved 2026-09-24:** under express PO/SA authorisation, Claude amended `CLAUDE.md` once. The objective is now work-package neutral ("execute only the work package explicitly authorised by the Product Owner / Solutions Architect in the current instruction"), not "IB0-WP02 only". No architecture decision or engineering control is changed.

(ii) **PAEP-IB-01 §3/§4.1/§4.2(i) expect Nx-compatible orchestration and an Nx version in the manifest; no Nx exists (user direction at IB0-WP01).** Handling: the manifest records `nx: "not used — orchestration deferred to IB0-WP04"`. WP02 does not add Nx and does not raise an ADR against ADR-002; IB0-WP04 does that.

(iii) **PAEP-IR-01 §4.2 and PAEP-IB-01 §5.1/App. A show `nx.json` and `tsconfig.base.json`.** Handling: out of scope (IB0-WP03/WP04). Neither file is created in WP02.

(iv) **`validate-pack.mjs` fails on 9 files that IB0-WP01 was required to populate.** Handling: it is not used as a gate. The WP02 verifier checks only the immutable controlled subset (`.paep-control/**`, `.gitignore`) against `PACK_MANIFEST.json`. `PACK_MANIFEST.json` is not rewritten.

(v) **`verify-ib0-wp01.mjs` rewrites the tracked file `evidence/IB0-WP01/reports/ib0-wp01-verification.json`.** Handling: run the regression in a scratch clone, or restore the file with `git checkout` after capturing the output into `evidence/IB0-WP02/logs/`. The accepted IB0-WP01 evidence shall remain byte-unchanged.

(vi) **Exact Node pin versus developer friction.** An exact `devEngines` pin blocks any other Node patch. This is intended: IB-01 §4.1 requires an exact pin, and drift is release-blocking. Handling: readiness condition R3.

(vii) **Accepted IB0-WP01 evidence misstates npm 11.19.0 install-script behaviour.** `evidence/IB0-WP01/reports/toolchain-baseline.md` (vi), `dependency-baseline.md` and `independent-qa.md` say the four warned install scripts were not run. In npm 11.19.0 `allowScripts` is advisory and those scripts did run. Handling: record an erratum in `evidence/IB0-WP02/reports/install-script-policy.md` and the IB0-WP02 acceptance report. IB0-WP01 files are not edited (§4). The IB0-WP01 build outcome is unaffected, because the build output is byte-identical with the scripts run or denied.

## 12. Exit rule

IB0-WP02 reaches technical PASS only when every mandatory criterion in `ACCEPTANCE.md` passes and the required evidence exists. PASS is not ACCEPTED. Human acceptance, and the separate licence dispositions, are recorded by the authorised reviewers.

## 13. Controlled amendments at approval (2026-09-24)

Authority: Product Owner / Solutions Architect instruction "IB0-WP02 — Product Owner / Solutions Architect authorization, controlled amendment, final QA and merge", 2026-09-24. Record: `evidence/IB0-WP02/notes/closure-authorisation.md`.

(i) **Definition approved.** `WORK_PACKAGE.md` and `ACCEPTANCE.md` approved with all 24 criteria unchanged. Readiness conditions R1 and R2 closed. This section and the status lines in §2, §4(vii)–(ix), §6(vii) and §11(i) record the approval; no criterion text changed.

(ii) **`CLAUDE.md` amended once.** The "Current bounded objective" section became "Work-package authorisation", with the durable rule quoted in §11(i). Source-of-truth items 6–7 and execution-discipline items 7–8 now refer to the authorised work package instead of IB0-WP01. The source-of-truth hierarchy, controlled baseline, mandatory rules, clean-room, security and anti-weakening rules, execution discipline and stop conditions are otherwise unchanged. The amendment adds that acceptance and merge authorisation remain PO/SA decisions.

(iii) **Licence dispositions.** `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) approved as build-time dependencies, with the re-review triggers the PO/SA set. Recorded in `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md`, `docs/licences/THIRD-PARTY-NOTICES.md` (new, within §4(v)) and `docs/provenance/PROVENANCE-REGISTER.md`.

(iv) **Deferrals preserved.** Explicit `strict`/`strictTemplates` stays with IB0-WP03 and the Nx project graph with IB0-WP04.
