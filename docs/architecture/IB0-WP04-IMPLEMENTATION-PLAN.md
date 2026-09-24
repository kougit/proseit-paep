# IB0-WP04 Implementation Plan

Recorded before any configuration, tooling or verifier file was changed (IB0-WP04-AC01). Status at time of writing: IN PROGRESS. Baseline: IB0-WP03 ACCEPTED and CLOSED, merge commit `ac6b786` on `main`.

## Objective

Make the PAEP project and package architecture explicit and machine-enforceable: classify every project, generate the project/package dependency graph, and reject upward or cross-layer dependencies, circular package dependencies, deep/internal imports and public-entry-point bypasses. Scope source: PAEP-IR-01 §4.4 row IB0-WP4 ("Implement architecture tags/boundaries, circular-dependency detection and deep-import restrictions." Required evidence: "Negative boundary tests demonstrating CI rejection.").

## Controlled inputs read

| Source | Sections relied on |
| --- | --- |
| `CLAUDE.md` | Whole contract (authorisation, mandatory rules, stop conditions) |
| `.paep-control/SOURCE_OF_TRUTH.md` | Priority table; controlled decisions (ii), (iii), (v), (vi) |
| `.paep-control/text/PAEP_v1.1_text.md` | §3 "Dependency direction" principle; §5.1, §5.1.1 package responsibilities; §5.3 package dependency and public API rule |
| `.paep-control/text/PAEP_IB_01_v1.0_text.md` | §2.2(i)-(ii); §2.3(ii) Nx is not an immutable dependency; §4.1 workspace orchestration row; §4.2 (Nx-compatible project graph and module boundaries); §5.1 topology (`nx.json`, `tsconfig.base.json`); §5.2 ownership rules; **§6.1 layer table; §6.2 mandatory dependency controls; Appendix B package dependency matrix**; §20 static architecture gate; App. F ADR-002 |
| `.paep-control/text/PAEP_IR_01_v1.0_text.md` | §2.2(ii); §2.3(v); §4.2 topology; §4.3 mandatory package rules; §4.4 IB0-WP4 row; §4.5 Architecture, Circular dependencies, Public API discipline gates; §4.6 exit criteria (iii) |
| `.paep-control/text/PAEP_EQP_01_v1.1_text.md` | §16 architecture and modularity assurance; §8.2 prohibited shortcuts; §23 no test laundering; §29.1(iv) |
| IB0-WP01/WP02/WP03 acceptance records | Nx not installed; `tsconfig.base.json` deferred to WP04; `nx.json` not created; WP02 V17 bounded exception |

## Current graph (at `ac6b786`)

(i) npm workspaces: `packages/*` (18 packages). `angular.json`: 2 application projects (`reference-app`, `ui-lab`).

(ii) Each package has `package.json` (name, version, private, description; no dependencies) and a placeholder public entry point `src/index.ts` (`export {};`).

(iii) Root `tsconfig.json` holds 18 exact path aliases; there is no `tsconfig.base.json`, `nx.json` or `project.json`, and no Nx.

(iv) No source file imports any `@proseit/*` package; the graph has 20 nodes and 0 edges. No cycles, no deep imports.

## Decisions and defaults

(i) **Rule set.** The exact allowed dependencies are IB-01 Appendix B ("Yes" and "Optional" allowed; "No" prohibited). A cell shown as "-" off the diagonal (an upward dependency) is not allowed, which is what §6.1 "May depend on" states for every layer. Public entry-point and cycle controls apply to allowed edges too.

(ii) **Same-category projects.** Appendix B shows "-" (self) for `domain-*` → `domain-*` and `apps/*` → `apps/*`. Default: one domain package may not depend on another, and one app may not depend on another, unless an ADR approves it (IB-01 §6.2(viii), IR-01 §4.3(vi)). Pending PO/SA confirmation.

(iii) **Nx.** Not installed. The graph uses Nx-compatible semantics without Nx: Nx-style project tags (`layer:*`, `type:*`), dependency constraints in the `@nx/enforce-module-boundaries` shape, and a generated graph in the Nx `ProjectGraph` JSON shape (`nodes`, `dependencies`). `nx.json` is not created (PO/SA decision at WP03 closure). Nx disposition: NOT REQUIRED FOR IB0-WP04.

(iv) **`tsconfig.base.json`.** Created. Both controlled topologies (IB-01 §5.1, IR-01 §4.2) list it at the workspace root, and it is the file an Nx-compatible graph reads path aliases from. Minimum inheritance model: `tsconfig.base.json` holds only the workspace package alias registry (`compilerOptions.paths`); root `tsconfig.json` extends it and keeps every WP03 option, including the literal `strict`, `noImplicitAny` and `strictTemplates`; the app `tsconfig.app.json` files are unchanged and still extend `tsconfig.json`. `paths` moves out of `tsconfig.json` so there is one alias registry.

(v) **Enforcement tool.** No new dependency. A PAEP checker, `tooling/architecture-boundaries/check-boundaries.mjs`, uses Node built-ins and the pinned `typescript` parser. It reads the machine-readable model `tooling/architecture-boundaries/architecture-model.json`, scans every import form in `apps/**` and `packages/**` plus workspace `package.json` dependencies, and fails on: unclassified or unknown projects; a matrix that differs from the controlled Appendix B text; alias inconsistency; forbidden edges; cycles; deep `@proseit/<pkg>/<path>` imports; relative or rooted imports that leave the importing project (entry-point bypass and app/package ownership); any external import or browser global in `contracts`; external re-exports from `analytics`; and app files copying package source. ESLint-based enforcement stays with the deferred lint work.

(vi) **Package `exports` fields.** Not added. Publishing `exports` would add a compiler-level block on deep imports but changes all 18 package manifests; the checker already rejects them. Recorded for a later packaging work package.

(vii) **Regression.** The earlier verifiers are not edited. The WP03 verifier's scope checks were written for the WP03 window and will report WP04's authorised changes (V05 `extends` added, V08 aliases moved to `tsconfig.base.json`, V10 WP04 scripts, V12 WP04 paths, V17 WP02 V17 reporting `tsconfig.base.json`). Default taken, pending PO/SA decision: WP04 requires every other WP03 check to pass and each of those five to report only WP04-authorised changes; the substance of V05 and V08 is re-checked by the WP04 verifier. The same bounded approach covers WP02 V17. `qa:ib0-wp03:negative` is a WP03-window tool (its positive control assumes the WP03 tree) and is not a WP04 gate.

(viii) **CI.** No CI exists until IB0-WP05. "CI rejection" is demonstrated by the non-zero exit of `npm run arch:check`, the command WP05's architecture stage will run.

## Intended file changes

| Path | Change |
| --- | --- |
| `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md` | New (this plan) |
| `work-packages/IB0-WP04/**` | New: work package, acceptance criteria, runbook, traceability, acceptance report, `work-package.json` |
| `tsconfig.base.json` | New: workspace alias registry (18 aliases) |
| `tsconfig.json` | Add `"extends": "./tsconfig.base.json"`; move `paths` to the base |
| `tooling/architecture-boundaries/architecture-model.json` | New: layers, categories, tags, Appendix B matrix, 20 classified projects |
| `tooling/architecture-boundaries/check-boundaries.mjs` | New: boundary checker and graph generator |
| `tooling/architecture-boundaries/README.md` | Update status and usage |
| `tooling/verification/verify-ib0-wp04.mjs`, `negative-ib0-wp04.mjs` | New verifier and negative runner (scratch copy only) |
| `package.json` | Add `arch:check`, `qa:ib0-wp04`, `qa:ib0-wp04:negative` scripts only |
| `docs/adr/ADR-REGISTER.md`, `docs/provenance/PROVENANCE-REGISTER.md` | Work-package note; orchestration tooling row |
| `evidence/IB0-WP04/**` | New evidence |

Not changed: `package-lock.json`, dependencies, `angular.json`, `apps/**`, `packages/**`, `.paep-control/**`, `CLAUDE.md`, the earlier verifiers and all IB0-WP01/02/03 work-package and evidence files.
