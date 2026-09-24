# Work Package IB0-WP04 — Project Graph, Package Boundaries and Dependency Enforcement

**Controlled roadmap mapping:** PAEP-IR-01 §4.4, IB0-WP4 ("Implement architecture tags/boundaries, circular-dependency detection and deep-import restrictions." Required evidence: "Negative boundary tests demonstrating CI rejection.")  
**Milestone:** IB0 — Workspace and Architecture Governance Baseline (PAEP-EQP-01 WBS W1 / IB0)  
**Predecessor:** IB0-WP03 — ACCEPTED and CLOSED 2026-09-24 (merge commit `ac6b786`)  
**Design classification:** D0 — not a UI work package; no design handoff required  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Definition status:** **APPROVED** by the Product Owner / Solutions Architect on 2026-09-24 ("IB0-WP04 — FINAL ACCEPTANCE, MERGE AND POST-MERGE CLOSURE", Decision 5), including the refinements from the independent review rounds (§9). Drafted by Claude Code on 2026-09-24 under the PO/SA instruction "IB0-WP04 — PROJECT GRAPH, PACKAGE BOUNDARIES AND DEPENDENCY ENFORCEMENT, EXECUTION + QA + PR READINESS" (project thread, 2026-09-24T09:59Z). The controlled pack supplied no IB0-WP04 definition. Claude may not approve this definition. The definition audit is `evidence/IB0-WP04/reports/definition-audit.md`.

## 1. Objective

Make the PAEP project and package architecture explicit and machine-enforceable: classify every project with Nx-compatible tags, generate the project dependency graph, and reject forbidden dependency directions, circular package dependencies, deep/internal imports and public-entry-point bypasses, with negative tests proving each rejection.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-GRAPH | Nx-compatible project graph and module boundaries, without a runtime dependency on workspace tooling; Nx not an immutable dependency | IB-01 §2.3(ii), §4.1 and §4.2 workspace orchestration rows, App. F ADR-002; IR-01 §4.2; IB-01 §22 "project graph generated" |
| R-CLASS | Every package is placed in a layer; architecture tags | IB-01 §6.1, §6.2(viii), §2.2(ii); EQP §29.1(iv) |
| R-DIR | Dependency direction per the layer table and the package dependency matrix | IB-01 §6.1, App. B; IR-01 §4.3(i)-(iii), §4.5 "Architecture"; PAEP v1.1 §3, §5.3; EQP §16(i)-(ii) |
| R-CYCLE | Circular package dependencies prohibited and fail CI | IB-01 §6.2(i); IR-01 §4.3(v), §4.5; PAEP v1.1 §5.3; EQP §16(ii) |
| R-DEEP | Cross-package imports only through public entry points; deep/internal imports prohibited | IB-01 §5.2(ii), §6.2(ii); IR-01 §4.3(iv), §4.5 "Public API discipline"; PAEP v1.1 §5.3; EQP §16(v) |
| R-NEUTRAL | contracts free of Angular, Frappe, DOM/browser and visualization dependencies; L0 approved externals only | IB-01 §6.1 L0 row, §6.2(iii), §7.1(i); EQP §16(iii) |
| R-SPECIFIC | frappe-sdk never imports UI packages; analytics does not import Frappe; analytics public contracts expose no visualization-vendor objects; apps do not duplicate platform code | IB-01 §6.2(iv)-(vi); EQP §16(iv), Claude contract; PAEP v1.1 §5.3; IR-01 §2.3(v) |
| R-TSBASE | `tsconfig.base.json` at the workspace root; aliases consistent with packages | IB-01 §5.1 and App. A topology; IR-01 §4.2; IB0-WP03 closure decision (iv) |
| R-NEG | Negative boundary tests demonstrating rejection | IR-01 §4.4 IB0-WP4 evidence, §4.6(iii), §8 IB0 evidence row |
| R-BASE | IB0 baseline kept: clean install, builds, pinned toolchain, lockfile, WP03 strictness, controlled sources, WP01–WP03 regression | IR-01 §4.5; IB-01 §4.1; IB0-WP01/02/03 acceptance |
| R-SCOPE | No WP05 or IB1+ work; no Nx unless approved | IR-01 §2.3, §4.4; CLAUDE.md; PO/SA instruction |
| R-EVID | Objective evidence, traceability and acceptance report | EQP §24, §32, App. C; SOURCE_OF_TRUTH decision (vi) |

## 3. Required outcome

(i) `tooling/architecture-boundaries/architecture-model.json` classifies all 20 projects (18 packages, 2 applications) into the IB-01 §6.1 layers and categories with Nx-style tags, and transcribes IB-01 Appendix B exactly.

(ii) `tooling/architecture-boundaries/check-boundaries.mjs` (`npm run arch:check`) generates the project graph and exits non-zero on any unclassified project, model/matrix drift, alias inconsistency, forbidden edge, cycle, deep import, entry-point bypass, contracts neutrality breach, analytics vendor re-export or app copy of package code.

(iii) `tsconfig.base.json` holds the workspace alias registry; `tsconfig.json` extends it and keeps every WP03 control literally.

(iv) `tooling/verification/verify-ib0-wp04.mjs` (`npm run qa:ib0-wp04`) checks all of the above plus baseline and regression; `tooling/verification/negative-ib0-wp04.mjs` (`npm run qa:ib0-wp04:negative`) proves each rejection in a scratch copy.

## 4. Permitted change boundary

Claude may create or modify:

(i) New `tsconfig.base.json` containing only `compilerOptions.paths`.

(ii) `tsconfig.json`: add `"extends": "./tsconfig.base.json"` and remove `paths`. No other key changes.

(iii) Root `package.json`: add the `arch:check`, `qa:architecture` (PAEP-EQP-01 Appendix B name for the same command; PO/SA Decision 1), `qa:ib0-wp04` and `qa:ib0-wp04:negative` scripts only.

(iv) `tooling/architecture-boundaries/**` (model, checker, README).

(v) New `tooling/verification/verify-ib0-wp04.mjs` and `tooling/verification/negative-ib0-wp04.mjs`.

(vi) New `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md`; work-package notes in `docs/adr/ADR-REGISTER.md` and `docs/provenance/PROVENANCE-REGISTER.md`.

(vii) New `work-packages/IB0-WP04/**` and `evidence/IB0-WP04/**`.

Claude shall **not** modify: `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md`, `package-lock.json`, dependency names or versions, `angular.json`, `apps/**`, `packages/**`, the earlier verifiers, or any file under `work-packages/IB0-WP01|02|03/` or `evidence/IB0-WP01|02|03/`.

## 5. Out of scope

(i) **Nx installation, `nx.json`, `project.json`:** not required (plan decision (iii)); any Nx proposal needs an ADR, dependency/licence review and PO/SA approval.

(ii) **Lint/format tooling (ESLint, Prettier), including ESLint boundary rules:** deferred by the PO/SA at WP03 closure.

(iii) **IB0-WP05:** CI workflows, unit-test runner, CI stages.

(iv) **IB1 and later:** any exported contract, type, component or runtime behaviour in a package; package `exports` manifests; product screens; Frappe, analytics, offline or shell work.

## 6. Decisions (approved by the PO/SA on 2026-09-24)

(i) Appendix B "-" cells off the diagonal are not allowed. A dependency between two projects of the same category is permitted only when the model's `sameCategoryAllowlist` names the exact pair with a rationale and an approval; category membership alone gives no permission; an unlisted pair, direct or transitive, fails closed; applications cannot be listed (PO/SA Decision 2).

(ii) `tsconfig.base.json` holds only the alias registry; strictness stays literal and auditable in `tsconfig.json` (PO/SA Decision 4).

(iii) WP03 regression bounded exception: V05, V08, V10, V12 and V17 may report only WP04-authorised changes; every other WP03 check must pass; the substantive WP03 controls are re-proven by WP04 (AC06, S1–S9) (PO/SA Decision 3).

(iv) "Optional" Appendix B cells are permitted, never required; the generated graph marks every Optional edge for justification at review.

(v) IB-01 §6.1 states the general layering rule; IB-01 Appendix B is the more specific matrix and qualifies it, so its eight same-layer Optional links are permitted, each subject to every other control (definition audit §6, C1; PO/SA decision "IB-01 Appendix B Optional links").

(vi) Appendix B "No" is a reachability constraint: a chain of individually allowed edges is rejected when its end pair is not allowed (PO/SA decision "Transitive forbidden dependencies").

(vii) PAEP-EQP-01 Appendix B is the QA command-naming standard: `qa:architecture` is exposed for the existing architecture gate; no other QA command is created without its capability (PO/SA Decision 1).

(viii) Nested `package.json`, `#` subpath chains and symlinks below a project root stay permanently rejected (PO/SA security edge-case decisions; N43–N45).

## 7. Required evidence

Stored under `evidence/IB0-WP04/` and indexed in its README: verifier JSON and log, project graph, clean-clone reproduction, `npm ci`, lockfile unchanged, both production builds, negative architecture tests, WP03/WP02/WP01 regression logs with evidence-restore proof, controlled-source integrity, scope and secret scan, definition audit, independent QA report, technical verification report and acceptance-readiness report.

## 8. Completion rule

Technical PASS requires every criterion in `ACCEPTANCE.md` to pass. Claude reports technical PASS, independent QA PASS and readiness for authorisation at most. ACCEPTED and merge are decisions of the Product Owner / Solutions Architect.

## 9. Drafting changes

(i) 2026-09-24, before the first recorded verification run: AC16 was made concrete with the case identifiers of the negative runner and extended from 26 to 29 negative cases (adding `import = require()` and the two Nx cases that prove AC17) and 4 controls (adding a production-build control and a verifier control). No criterion was relaxed.

(ii) 2026-09-24, after independent QA round 1 (findings M1–M3, L2–L8): the checker missed violations placed in nested `dist/`, `node_modules/` or `.angular/` folders (M1), in `.d.ts` files (M2), DOM globals pulled into contracts by `/// <reference lib>` (M3), `/// <reference path>`, module augmentation, `require.resolve` and `package.json` `imports` aliases (L2–L4), non-TypeScript contracts files (L5), a project category inconsistent with its directory (L6) and analytics exporting an imported vendor binding (L8). The checker was fixed and AC03, AC09, AC13, AC14 and AC16 were **strengthened** (negative cases N30–N38 added). The §6.1/Appendix B conflict (M4) is now reported (§6(v)). No criterion was relaxed.

(iii) 2026-09-24, after independent QA round 2 (R2-L1, R2-L2): `package.json` `imports` targets that are bare package names are now checked like any import, and `#prefix/*` patterns resolve; AC16 gains N39 and control C4. No criterion was relaxed.

(iv) 2026-09-24, after independent QA round 3 (R3-L1): every target of a conditional or array `imports` entry is checked, and pattern keys follow Node's longest-prefix rule; AC16 gains N40–N42. No criterion was relaxed.

(v) 2026-09-24, after independent QA rounds 4 and 5 (F-1, F-2, R5-M1): a nested `package.json` or a symbolic link below a project root, and an `imports` target that is another `#` subpath, are rejected; AC16 gains N43–N45. No criterion was relaxed.

(vi) 2026-09-24, applying the PO/SA decisions: AC06 also requires no suppression directive and cites S1–S9; AC09 adds the same-category allowlist and the transitive reachability rule; AC15 adds `qa:architecture`; AC16 gains C5, O1–O8, T1–T5, N46–N52 and S1–S9 (82 cases); AC21 counts four scripts; AC23 records the approval. After independent QA round 7, allowlist entries linking two applications are rejected (N52). No criterion was relaxed.
