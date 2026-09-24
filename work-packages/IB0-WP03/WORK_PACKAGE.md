# Work Package IB0-WP03 — Compiler, Type-Safety and Static-Quality Baseline

**Controlled roadmap mapping:** PAEP-IR-01 §4.4, IB0-WP3 ("Configure strict TypeScript/template settings and package path aliases/public entry points." Required evidence: "Compiler configuration; package API checks.")  
**Milestone:** IB0 — Workspace and Architecture Governance Baseline (PAEP-EQP-01 WBS W1 / IB0)  
**Predecessor:** IB0-WP02 — ACCEPTED and CLOSED 2026-09-24 (merge commit `de13629`)  
**Design classification:** D0 — not a UI work package; no design handoff required  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Definition status:** DRAFTED by Claude Code on 2026-09-24 under the PO/SA instruction of 2026-09-24 that authorised execution of IB0-WP03 and creation of its definition "only for requirements actually supported by the controlled sources". The controlled pack supplied no IB0-WP03 definition. Claude may not approve this definition; the PO/SA approves or amends it at acceptance. The definition audit is `evidence/IB0-WP03/reports/definition-audit.md`.

## 1. Objective

Make the controlled TypeScript and Angular template strictness explicit instead of inherited from toolchain defaults, configure one path alias and one public entry point per workspace package, and add checks that fail when any of these controls is removed or weakened.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-STRICT | `strict=true`; `strictTemplates=true`; no implicit any; production build treats type errors as failures | PAEP-IB-01 §4.1 TypeScript row; PAEP-IR-01 §4.4 IB0-WP3 and §4.5 "Type safety"; PAEP v1.1 §5.4 and App. G; EQP §13(iii), §15 `qa:types` |
| R-DEFER | Replace the reliance on defaults recorded when IB0-WP01 was accepted | IB0-WP01 ACCEPTANCE_REPORT deferred actions; IB0-WP01 independent QA observation 2 |
| R-NOWEAKEN | No existing compiler option weakened; no suppression of TypeScript/Angular errors; AOT production builds kept | EQP §8.2(v)-(vi), §23; PAEP v1.1 §5.4 |
| R-ALIAS | Package path aliases and public entry points | PAEP-IR-01 §4.4 IB0-WP3; §4.3(iv); PAEP-IB-01 §5.2(ii), §6.2(ii); EQP §16(v) |
| R-API | Package API checks (evidence named for IB0-WP3) | PAEP-IR-01 §4.4 IB0-WP3 required evidence; §4.5 "Public API discipline" |
| R-BASE | IB0 baseline kept: clean install, builds, pinned toolchain, lockfile, controlled sources, WP01/WP02 regression | PAEP-IR-01 §4.5; PAEP-IB-01 §4.1-§4.2; IB0-WP01/WP02 acceptance |
| R-SCOPE | No WP04/WP05 or IB1+ work; no Nx | PAEP-IR-01 §2.3, §4.4; CLAUDE.md mandatory rules; PO/SA instruction |
| R-EVID | Objective evidence, traceability and acceptance report | EQP §24, §32, App. C; SOURCE_OF_TRUTH decision (vi) |

## 3. Required outcome

(i) The root `tsconfig.json` sets `"strict": true` and `"noImplicitAny": true` in `compilerOptions`, and `"strictTemplates": true` in `angularCompilerOptions`. Both application build configurations inherit them, and nothing in the repository turns any strict-family option off.

(ii) Every pre-existing compiler and Angular compiler option keeps its value. Production builds remain AOT.

(iii) A TypeScript strict violation and an Angular template strict violation each make the production build fail.

(iv) Each of the 18 workspace packages has a placeholder public entry point `packages/<dir>/src/index.ts`, and the root `tsconfig.json` maps exactly one alias per package (its `package.json` name) to that file. No deep or wildcard alias exists.

(v) `tooling/verification/verify-ib0-wp03.mjs` (`npm run qa:ib0-wp03`) checks all of the above and fails if any explicit control is removed or weakened. `tooling/verification/negative-ib0-wp03.mjs` (`npm run qa:ib0-wp03:negative`) proves the negative cases in a scratch copy.

## 4. Permitted change boundary

Claude may create or modify:

(i) `tsconfig.json`: add `strict`, `noImplicitAny`, `paths` and `strictTemplates`. No other key changes.

(ii) New `packages/<dir>/src/index.ts` for each workspace package (placeholder, `export {};` only).

(iii) Root `package.json`: add the `qa:ib0-wp03` and `qa:ib0-wp03:negative` scripts only.

(iv) New `tooling/verification/verify-ib0-wp03.mjs` and `tooling/verification/negative-ib0-wp03.mjs`.

(v) New `docs/architecture/IB0-WP03-IMPLEMENTATION-PLAN.md`; a work-package note in `docs/adr/ADR-REGISTER.md`.

(vi) New `work-packages/IB0-WP03/**` and `evidence/IB0-WP03/**`.

Claude shall **not** modify: `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md`, `package-lock.json`, dependency names or versions, `angular.json`, `apps/**`, `apps/*/tsconfig.app.json`, existing `packages/*/package.json` or `README.md`, the earlier verifiers, or any file under `work-packages/IB0-WP01|02/` or `evidence/IB0-WP01|02/`.

## 5. Out of scope

(i) **IB0-WP04:** Nx or another project graph, `nx.json`, `project.json`, `tsconfig.base.json`, architecture tags, dependency-direction rules, cycle detection and deep-import *enforcement* (PAEP-IR-01 §4.4 IB0-WP4; IB0-WP01 acceptance record).

(ii) **IB0-WP05:** CI workflows, unit-test runner, `qa:*` CI stages.

(iii) **IB1 and later:** any exported contract, type, component or runtime behaviour in a package; product screens; Frappe, analytics, offline or shell work.

(iv) **Lint and format tooling (ESLint, Prettier):** default deferral, pending the PO/SA decision recorded in the implementation plan §"Decisions and defaults"(vi). It needs new dependencies and a licence review. It remains an open IB0 item (EQP §29.1(iii)).

## 6. Decisions taken by default

(i) `tsconfig.base.json` is deferred to IB0-WP04 with `nx.json` (IB0-WP01 acceptance record). The Angular CLI root `tsconfig.json` holds the controls.

(ii) IB0-WP02 regression: the WP02 verifier is not edited. Its V17 scope guard was written for the WP02 change window and flags any change to `tsconfig.json` or `packages/**`. IB0-WP03 requires all other WP02 checks to pass and V17 to list only paths this work package is permitted to change (AC21). This default is pending the PO/SA decision.

## 7. Required evidence

Stored under `evidence/IB0-WP03/` and indexed in its README: verifier JSON and log, clean-clone reproduction, `npm ci`, lockfile unchanged, both production builds and build-output comparison, negative strictness logs with controls, verifier mutation matrix, WP02 and WP01 regression logs with evidence-restore proof, controlled-source integrity, scope and secret scan, definition audit, independent QA report, technical verification report and acceptance-readiness report.

## 8. Completion rule

Technical PASS requires every criterion in `ACCEPTANCE.md` to pass. Claude reports TECHNICAL PASS, INDEPENDENT QA PASS and READY FOR AUTHORIZATION at most. ACCEPTED and merge are decisions of the Product Owner / Solutions Architect.

## 9. Drafting changes

(i) 2026-09-24, before the first recorded verification run: AC20 was clarified from "writes nothing outside `evidence/IB0-WP03/`" to "no tracked file outside `evidence/IB0-WP03/` is modified after the run", because the WP02 and WP01 verifiers it runs as regression rewrite, and it restores, their own tracked JSON. The check itself is unchanged and is proven by `logs/post-run-git-status.log`.
