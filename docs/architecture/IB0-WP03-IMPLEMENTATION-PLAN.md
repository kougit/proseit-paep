# IB0-WP03 Implementation Plan

Recorded before any compiler, package or verifier file was changed (IB0-WP03-AC01). Status at time of writing: IN PROGRESS. Baseline: IB0-WP02 ACCEPTED and CLOSED, merge commit `de13629` on `main`.

## Objective

Make the TypeScript and Angular template strictness controls explicit, and configure the package path aliases and public entry points, so that the controlled compiler posture no longer depends on toolchain defaults and can be verified mechanically. Scope source: PAEP-IR-01 §4.4 row IB0-WP3 ("Configure strict TypeScript/template settings and package path aliases/public entry points." Required evidence: "Compiler configuration; package API checks.") and PAEP-IB-01 §4.1 TypeScript row ("strict=true; strictTemplates=true; no implicit any; production build treats type errors as failures.").

## Controlled inputs read

| Source | Sections relied on |
| --- | --- |
| `CLAUDE.md` | Whole contract (work-package-neutral authorisation rule; mandatory rules; stop conditions) |
| `.paep-control/SOURCE_OF_TRUTH.md` | Priority table; controlled decisions (ii), (iii), (v), (vi) |
| `.paep-control/text/PAEP_v1.1_text.md` | §5.4 "Production builds shall use AOT compilation, strict TypeScript/template checking and approved lint/static-analysis rules"; App. G "Compilation" row |
| `.paep-control/text/PAEP_IB_01_v1.0_text.md` | §4.1 TypeScript row; §5.2(ii) packages expose public APIs through the package entry point; §6.2(ii) shared code consumed only from public entry points; §6.2(viii) architecture tags and import rules in lint/CI (WP04) |
| `.paep-control/text/PAEP_IR_01_v1.0_text.md` | §4.3(iv) public entry points; §4.4 IB0-WP3 / WP4 / WP5 rows; §4.5 "Type safety" and "Public API discipline" gates |
| `.paep-control/text/PAEP_EQP_01_v1.1_text.md` | §13(iii) strict type checking; §15 `qa:types`; §16(v) public entry points; §8.2(vi) no suppression of TypeScript/Angular errors; §23 no test laundering; §29.1(iii) strict checks, formatting and linting |
| `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md`, `evidence/IB0-WP01/reports/independent-qa.md` | Deferral: explicit `strict`/`strictTemplates` to IB0-WP03; `nx.json`/`tsconfig.base.json` with the project graph to IB0-WP04 |
| `work-packages/IB0-WP02/WORK_PACKAGE.md` §5, `work-package.json` | Out-of-scope owner table: strict flags, `tsconfig.base.json`, path aliases, lint/format to IB0-WP03 |
| `tooling/verification/verify-ib0-wp01.mjs`, `verify-ib0-wp02.mjs` | Regression behaviour (both rewrite tracked evidence; WP02 V17 guards WP02 scope) |

The audit ran as four read-only lanes (A requirements, B compiler configuration, C negative-test design, D regression and repository). Their consolidated findings are in `evidence/IB0-WP03/reports/definition-audit.md`.

## Lane B: current compiler posture (at `de13629`)

(i) `tsconfig.json` sets no `strict` and no `noImplicitAny`. TypeScript 6.0.3 defaults `strict` to on, so it is enabled only by default.

(ii) `angularCompilerOptions` sets no `strictTemplates`. Angular 22 compiler-cli treats it as `strictTemplates !== false`, so it is enabled only by default.

(iii) Both app `tsconfig.app.json` files extend the root file and override only `types`.

(iv) Explicit options already present, and kept unchanged: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `skipLibCheck`, `isolatedModules`, `experimentalDecorators`, `importHelpers`, `target`, `module`, `enableI18nLegacyMessageIdFormat`, `strictInjectionParameters`, `strictInputAccessModifiers`.

(v) No `paths`. The 18 workspace packages hold only `package.json` and `README.md`; none has an entry point.

## Decisions and defaults

(i) **Where strictness lives.** `strict`, `noImplicitAny` and `strictTemplates` are set to `true` in the root `tsconfig.json`, which both applications extend. This is the Angular CLI 22 configuration structure. The app files are not changed.

(ii) **`tsconfig.base.json`.** Not created. The accepted IB0-WP01 acceptance report assigns `nx.json`/`tsconfig.base.json` to IB0-WP04 with the project graph, while the IB0-WP02 ownership table lists it under WP03. No controlled source ties the file to WP03, and the Angular CLI root `tsconfig.json` already carries the aliases. Default taken: defer to IB0-WP04.

(iii) **Path aliases.** One exact alias per workspace package, keyed by its `package.json` name and mapped to `./packages/<dir>/src/index.ts`. No wildcard or sub-path alias is declared, so no deep path is published. `baseUrl` is not added (deprecated in TypeScript 6.0; `paths` resolve relative to the tsconfig).

(iv) **Public entry points.** Each package gets `src/index.ts` containing `export {};` and a placeholder comment. No implementation, export or dependency is added (IB1 and later own content).

(v) **Package API checks.** The WP03 verifier checks alias/entry-point agreement, the absence of deep aliases, alias resolution through the TypeScript resolver, and a strict compile of all entry points. Deep-import *enforcement* on consumers (lint/graph rules) stays with IB0-WP04.

(vi) **Lint and format tooling.** EQP §29.1(iii) lists formatting and linting for IB0, and the IB0-WP02 record names WP03 as owner. They require new third-party dependencies, a lockfile change and a licence review. Default taken, pending the PO/SA decision: defer, keep the lockfile unchanged, and record lint/format as an open IB0 item. WP03 adds a dependency-free static-quality check instead: no compiler-suppression directives (`@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, `$any(`) in `apps/**` or `packages/**` (EQP §8.2(vi)).

(vii) **IB0-WP02 regression.** WP02 check V17 fails whenever `tsconfig.json`, `apps/**` or `packages/**` differ from the WP01 baseline, by design. Default taken, pending the PO/SA decision: the WP02 verifier is not edited. WP03 requires every other WP02 check to pass and V17 to report only WP03-authorised paths.

## Intended file changes

| Path | Change |
| --- | --- |
| `docs/architecture/IB0-WP03-IMPLEMENTATION-PLAN.md` | New (this plan) |
| `work-packages/IB0-WP03/**` | New: work package, acceptance criteria, runbook, traceability, acceptance report, `work-package.json` |
| `tsconfig.json` | Add `strict: true`, `noImplicitAny: true`, `paths`; add `strictTemplates: true` |
| `packages/*/src/index.ts` (18) | New placeholder public entry points |
| `tooling/verification/verify-ib0-wp03.mjs` | New verifier (Node built-ins plus the pinned `typescript` and `@angular/compiler-cli`) |
| `tooling/verification/negative-ib0-wp03.mjs` | New negative-test runner (scratch copy only) |
| `package.json` | Add `qa:ib0-wp03` and `qa:ib0-wp03:negative` scripts only |
| `docs/adr/ADR-REGISTER.md` | Work-package note (no ADR needed) |
| `evidence/IB0-WP03/**` | New evidence |

Not changed: `package-lock.json`, dependencies, `angular.json`, `apps/**`, `.paep-control/**`, `CLAUDE.md`, all IB0-WP01/WP02 work-package and evidence files, and both earlier verifiers.

## Verification approach

Positive gates: fresh-clone `npm ci`, both production builds (output compared with the WP02 build), the WP03 verifier, WP02 and WP01 regression with evidence restored, controlled-source integrity. Negative gates (scratch copy): a TypeScript strict violation and an Angular template strict violation must fail the production build, with controls showing the explicit flags are what reject them; and a mutation matrix must show the WP03 verifier fails when each explicit control is removed or weakened.
