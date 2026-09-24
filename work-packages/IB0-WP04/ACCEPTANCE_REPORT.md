# IB0-WP04 Acceptance Report

**Work package:** IB0-WP04 — Project Graph, Package Boundaries and Dependency Enforcement (PAEP-IR-01 IB0-WP4)  
**Commit / revision:** implementation `9347807`, `f74fb78`, QA round 1 fixes `3ec81fc`, QA round 2 fix `499ae29` (commit under test); PR head recorded in `evidence/IB0-WP04/reports/acceptance-readiness.md`  
**Baseline:** IB0-WP03 ACCEPTED and CLOSED, merge commit `ac6b786`  
**Technical reviewer:** Claude Code (execution); independent QA by a separate clean-context Claude review  
**Review date:** 2026-09-24

## Implemented scope

The PAEP architecture is now machine-readable and enforced. `tooling/architecture-boundaries/architecture-model.json` classifies all 20 projects into the PAEP-IB-01 §6.1 layers with Nx-style tags and transcribes the Appendix B dependency matrix, which the checker compares cell by cell with the controlled text. `npm run arch:check` builds the project graph (Nx ProjectGraph shape, without Nx) from every import form and workspace dependency and fails on forbidden edges, cycles, deep imports, entry-point bypasses, contracts neutrality breaches, analytics vendor re-exports, copied package code, unclassified projects and alias drift. `tsconfig.base.json` is the single alias registry; `tsconfig.json` extends it and keeps the WP03 strictness literally. No dependency, lockfile, app, package or `angular.json` changed. Nx disposition: NOT REQUIRED FOR IB0-WP04.

## Requirement traceability

`work-packages/IB0-WP04/TRACEABILITY.csv` maps 21 requirement rows to implementation, AC01–AC29, verification and evidence. Every evidence path exists. Definition audit: `evidence/IB0-WP04/reports/definition-audit.md`.

## Automated gates

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` (fresh clone, pinned toolchain) | Exit 0 | `evidence/IB0-WP04/logs/npm-ci.log` |
| Lockfile unchanged after `npm ci` and identical to `ac6b786` | Exit 0 | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` / `build:ui-lab` | Exit 0 / exit 0 | `logs/build-reference-app.log`, `logs/build-ui-lab.log` |
| `npm run arch:check` | PASS, 0 violations | `logs/arch-check-cli.log` |
| `npm run qa:ib0-wp04` | PASS 24/24 | `logs/verify-ib0-wp04.log`; `reports/ib0-wp04-verification.json` |
| `npm run qa:ib0-wp04:negative` | PASS 44/44 | `logs/negative-architecture-tests.log`; `reports/negative-tests.json` |
| WP03 regression | 13/18 + bounded V05/V08/V10/V12/V17 | `logs/verify-ib0-wp03-regression.log` |
| WP02 regression | 19/20 + bounded V17 | `logs/verify-ib0-wp02-regression.log` |
| WP01 regression | PASS 15/15 | `logs/verify-ib0-wp01-regression.log` |
| Controlled-source integrity | 13/13 | `logs/controlled-source-integrity.log` |
| Scope and secrets | 0 violations; 0 findings | `logs/scope-and-secret-scan.log` |

## Manual checks

| Check | Reviewer | Date | Result |
| --- | --- | --- | --- |
| Definition audit (scope traced to controlled sources) | Claude Code | 2026-09-24 | PASS |
| Independent QA, fresh clone | Independent Claude reviewer | 2026-09-24 | See `evidence/IB0-WP04/reports/independent-qa.md` |
| Definition approval; defaults D1–D4 and the WP03 bounded exception | Product Owner / Solutions Architect | — | Pending |

## Acceptance criteria

AC01–AC29: **29/29 PASS** (per-criterion evidence in `evidence/IB0-WP04/reports/technical-verification.md`). AC23 and AC24 pass under the bounded exceptions pending PO/SA decision.

## Defects

D1 (medium, closed): checker gaps from independent QA round 1 (M1–M3, L2, L3 augmentation and `require.resolve`, L4 relative `imports` targets, L5, L6, L8), fixed in `3ec81fc`; criteria strengthened, none relaxed. D2 (medium, closed): §6.1/Appendix B conflict now reported for PO/SA decision (exception (iii)). D3 (low, closed): evidence-index and status-vocabulary fixes (L7, R2-L4). D4 (low, closed): `package.json` `imports` bare-name bypass and pattern false positive (R2-L1, R2-L2), fixed in `499ae29`. Details: `evidence/IB0-WP04/reports/technical-verification.md`.

## Exceptions (pending PO/SA decision)

(i) **WP03 bounded exception.** The accepted WP03 verifier is not edited. Its scope checks were written for the WP03 window: V05 reports `extends` added, V08 reports the aliases moved to `tsconfig.base.json`, V10 reports the WP04 scripts, V12 reports WP04 paths and `tsconfig.base.json`, and V17 reports the WP02 V17 finding below. The WP04 verifier accepts each only when its finding is exactly that authorised change, and re-checks the substance of V05 and V08 itself (V04–V06). All other WP03 checks pass.

(ii) **WP02 V17.** Adds `out-of-scope file present: tsconfig.base.json` to the WP03 exception the PO/SA already accepted.

(iii) **Source conflict C1.** IB-01 §6.1 allows only lower-layer dependencies; Appendix B allows eight same-layer Optional edges. Default: Appendix B governs. No current edge depends on it (`evidence/IB0-WP04/reports/definition-audit.md` §6).

## Provenance and licences

No dependency was added, removed or re-versioned; `package-lock.json` is byte-identical to IB0-WP03. The checker, model and verifiers are original PAEP code using Node built-ins and the already-pinned `typescript`. No template, theme or third-party source or configuration was copied. `docs/provenance/PROVENANCE-REGISTER.md` records the orchestration-tooling disposition.

## Residual risk

(i) ESLint-based boundary rules are deferred with lint/format tooling (PO/SA, WP03 closure); `arch:check` is the enforcing gate until then.

(ii) No CI exists until IB0-WP05, which should run `npm run arch:check` as its architecture stage. Until then enforcement is by the command and the verifier.

(iii) Rules not mechanically checked: analytics "arbitrary transport calls" (§6.2(v)) and domain business validation (§6.2(vii)); analytics vendor exposure is checked as "no external module or imported vendor binding exported", not by type analysis. Not detected: computed dynamic import specifiers, JSDoc `import()` types, near-duplicate (non-identical) copied code, analytics exporting a vendor object through a new variable (`export const x = vendor`), path aliases defined in config files not named `tsconfig*.json`, and imports reaching into a package's own `node_modules` (QA L1, L3, O1, R2-L3, R2-L5, R2-O1). They become checkable when those packages gain code (definition audit D9–D10).

(iv) Deep imports are blocked by the checker, not by the compiler: npm workspace links would let TypeScript resolve `@proseit/<pkg>/src/...`. Package `exports` manifests are a later packaging decision.

(v) `docs/architecture/toolchain-version-manifest.json` still says Nx is "deferred to IB0-WP04"; it is left unchanged because WP02 verifies it.

(vi) `npm run qa:ib0-wp03:negative` is a WP03-window tool: its positive control assumes the WP03 tree and two of its mutations edit `paths` in `tsconfig.json`. It is not a WP04 gate; WP04 N22–N24 cover the alias mutations against `tsconfig.base.json`.

## Technical result

**PASS** (29/29)

## Human acceptance decision

| Field | Value |
| --- | --- |
| Technical Verification | PASS |
| Independent QA | Pending |
| Architecture Conformance | PASS |
| Acceptance Criteria | 29/29 PASS |
| Acceptance Status | NOT ACCEPTED (awaiting PO/SA) |
| Acceptance Authority | Product Owner / Solutions Architect |
| Acceptance Date | — |
