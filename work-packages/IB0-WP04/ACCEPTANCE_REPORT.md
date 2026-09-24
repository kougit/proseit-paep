# IB0-WP04 Acceptance Report

**Work package:** IB0-WP04 — Project Graph, Package Boundaries and Dependency Enforcement (PAEP-IR-01 IB0-WP4)  
**Commit / revision:** implementation `9347807`, `f74fb78`, QA round 1 fixes `3ec81fc`, QA round 2 fix `499ae29`, QA round 3 fix `be181cf`, QA round 4 fix `dcda855`, QA round 5 fix `9c74dbe`, PO/SA decision changes `c745a74`, `9c50108`, `b084402`, final-review fixes `05e593d`, `d2f142c` (commit under test); PR head recorded in `evidence/IB0-WP04/reports/acceptance-readiness.md`  
**Baseline:** IB0-WP03 ACCEPTED and CLOSED, merge commit `ac6b786`  
**Technical reviewer:** Claude Code (execution); independent QA by a separate clean-context Claude review  
**Review date:** 2026-09-24

## Implemented scope

The PAEP architecture is now machine-readable and enforced. `tooling/architecture-boundaries/architecture-model.json` classifies all 20 projects into the PAEP-IB-01 §6.1 layers with Nx-style tags and transcribes the Appendix B dependency matrix, which the checker compares cell by cell with the controlled text. `npm run arch:check` (also `npm run qa:architecture`) builds the project graph (Nx ProjectGraph shape, without Nx) from every import form and workspace dependency and fails on forbidden edges (direct, or through a chain whose end pair Appendix B forbids), same-category edges not on the explicit allowlist, cycles, deep imports, entry-point bypasses, contracts neutrality breaches, analytics vendor re-exports, copied package code, unclassified projects and alias drift. `tsconfig.base.json` is the single alias registry; `tsconfig.json` extends it and keeps the WP03 strictness literally. No dependency, lockfile, app, package or `angular.json` changed. Nx disposition: NOT REQUIRED FOR IB0-WP04.

## Requirement traceability

`work-packages/IB0-WP04/TRACEABILITY.csv` maps 21 requirement rows to implementation, AC01–AC29, verification and evidence. Every evidence path exists. Definition audit: `evidence/IB0-WP04/reports/definition-audit.md`.

## Automated gates

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` (fresh clone, pinned toolchain) | Exit 0 | `evidence/IB0-WP04/logs/npm-ci.log` |
| Lockfile unchanged after `npm ci` and identical to `ac6b786` | Exit 0 | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` / `build:ui-lab` | Exit 0 / exit 0 | `logs/build-reference-app.log`, `logs/build-ui-lab.log` |
| `npm run arch:check` / `npm run qa:architecture` | PASS, 0 violations | `logs/arch-check-cli.log` |
| `npm run qa:ib0-wp04` | PASS 24/24 | `logs/verify-ib0-wp04.log`; `reports/ib0-wp04-verification.json` |
| `npm run qa:ib0-wp04:negative` | PASS 86/86 (16 controls, 70 rejections) | `logs/negative-architecture-tests.log`; `reports/negative-tests.json` |
| WP03 regression | 13/18 + bounded V05/V08/V10/V12/V17 | `logs/verify-ib0-wp03-regression.log` |
| WP02 regression | 19/20 + bounded V17 | `logs/verify-ib0-wp02-regression.log` |
| WP01 regression | PASS 15/15 | `logs/verify-ib0-wp01-regression.log` |
| Controlled-source integrity | 13/13 | `logs/controlled-source-integrity.log` |
| Scope and secrets | 0 violations; 0 findings | `logs/scope-and-secret-scan.log` |

## Manual checks

| Check | Reviewer | Date | Result |
| --- | --- | --- | --- |
| Definition audit (scope traced to controlled sources) | Claude Code | 2026-09-24 | PASS |
| Independent QA, fresh clones and copies (10 rounds) | Independent Claude reviewer | 2026-09-24 | Rounds 1 and 4 FAIL (all findings closed); rounds 2, 3, 5–7 PASS; final review round 8 (lanes A–D) PASS; rounds 9 and 10 PASS on the final code; every High and Medium closed; `evidence/IB0-WP04/reports/independent-qa.md` |
| Definition approval; decisions 1–5; IB-01 Appendix B Optional links; transitive forbidden dependencies | Product Owner / Solutions Architect | 2026-09-24 | APPROVED |

## Acceptance criteria

AC01–AC29: **29/29 PASS** (per-criterion evidence in `evidence/IB0-WP04/reports/technical-verification.md`). AC23 and AC24 pass under the bounded exceptions approved by the PO/SA.

## Defects

D1 (medium, closed): checker gaps from independent QA round 1 (M1–M3, L2, L3 augmentation and `require.resolve`, L4 relative `imports` targets, L5, L6, L8), fixed in `3ec81fc`; criteria strengthened, none relaxed. D2 (medium, closed): §6.1/Appendix B conflict now reported for PO/SA decision (exception (iii)). D3 (low, closed): evidence-index and status-vocabulary fixes (L7, R2-L4). D4 (low, closed): `package.json` `imports` bare-name bypass and pattern false positive (R2-L1, R2-L2), fixed in `499ae29`. D5 (low, closed): conditional `imports` branches and longest-prefix patterns (R3-L1), fixed in `be181cf`, N40–N42. D6 (high, closed): nested `package.json` and chained `#` targets (round 4 F-1, F-2), fixed in `dcda855`, N43–N44. D7 (medium, closed): symlinks inside projects (round 5 R5-M1), fixed in `9c74dbe`, N45. D8 (low, closed): app allowlist entries and V08 wording (round 7 L3, L4), `9c50108`, N52. D9 (medium, closed): workspace package reached under another name (final review M1), `05e593d`, N53–N54. D10 (medium, closed): `node_modules` link outside every project and plain-path manifest references (round 9 F1, F2), `d2f142c`, N55–N56. Details: `evidence/IB0-WP04/reports/technical-verification.md`.

## PO/SA decisions (2026-09-24)

| Decision | Disposition |
| --- | --- |
| PAEP-EQP-01 Appendix B command naming | APPROVED; `qa:architecture` exposed for the existing gate; no empty QA commands |
| Same-category dependencies | Permitted only through the explicit `sameCategoryAllowlist` (empty); unlisted pairs fail closed, directly or transitively |
| WP03 bounded exception | APPROVED; exceptions (i) and (ii) below |
| `tsconfig.base.json` design | APPROVED |
| Final WP04 definition | APPROVED |
| IB-01 Appendix B Optional links | APPROVED: permitted, not required (O1–O8) |
| Transitive forbidden dependencies | ENFORCED: "No" is a reachability constraint (T1–T5, 5/5) |
| Nx | NOT REQUIRED for IB0-WP04 |

## Exceptions (approved by the PO/SA)

(i) **WP03 bounded exception.** The accepted WP03 verifier is not edited. Its scope checks were written for the WP03 window: V05 reports `extends` added, V08 reports the aliases moved to `tsconfig.base.json`, V10 reports the WP04 scripts, V12 reports WP04 paths and `tsconfig.base.json`, and V17 reports the WP02 V17 finding below. The WP04 verifier accepts each only when its finding is exactly that authorised change, and re-checks the substance of V05 and V08 itself (V04–V06). All other WP03 checks pass.

(ii) **WP02 V17.** Adds `out-of-scope file present: tsconfig.base.json` to the WP03 exception the PO/SA already accepted.

(iii) **Source conflict C1, resolved.** IB-01 §6.1 states the general rule; Appendix B, the more specific matrix, qualifies it, so the eight same-layer Optional edges are permitted (`evidence/IB0-WP04/reports/definition-audit.md` §6).

## Provenance and licences

No dependency was added, removed or re-versioned; `package-lock.json` is byte-identical to IB0-WP03. The checker, model and verifiers are original PAEP code using Node built-ins and the already-pinned `typescript`. No template, theme or third-party source or configuration was copied. `docs/provenance/PROVENANCE-REGISTER.md` records the orchestration-tooling disposition.

## Residual risk

(i) ESLint-based boundary rules are deferred with lint/format tooling (PO/SA, WP03 closure); `arch:check` is the enforcing gate until then.

(ii) No CI exists until IB0-WP05, which should run `npm run arch:check` as its architecture stage. Until then enforcement is by the command and the verifier.

(iii) Rules not mechanically checked: analytics "arbitrary transport calls" (§6.2(v)) and domain business validation (§6.2(vii)); analytics vendor exposure is checked as "no external module or imported vendor binding exported", not by type analysis. Not detected: computed dynamic import specifiers, JSDoc `import()` types, near-duplicate (non-identical) copied code, analytics exporting a vendor object through a new variable (`export const x = vendor`), path aliases defined in config files not named `tsconfig*.json`, and imports reaching into a package's own `node_modules` (QA L1, L3, O1, R2-L3, R2-L5, R2-O1). Also, fail-closed or informational only (round 6): a library `package.json` that is a directory stops the checker with exit 2 and no named rule (R6-L1); a symlinked or unclassified directory directly under `packages/` or `apps/` that nothing imports is not flagged, though any import of it is (R6-L2, R6-I1). They become checkable when those packages gain code (definition audit D9–D10).

(iv) Deep imports are blocked by the checker, not by the compiler: npm workspace links would let TypeScript resolve `@proseit/<pkg>/src/...`. Package `exports` manifests are a later packaging decision.

(v) `docs/architecture/toolchain-version-manifest.json` still says Nx is "deferred to IB0-WP04"; it is left unchanged because WP02 verifies it.

(vi) `npm run qa:ib0-wp03:negative` is a WP03-window tool: its positive control assumes the WP03 tree and two of its mutations edit `paths` in `tsconfig.json`. It is not a WP04 gate; WP04 N22–N24 cover the alias mutations against `tsconfig.base.json`.

(vii) **Low findings from rounds 7–10, not bypasses today.** The suppression-directive scan (V05) misses a template in a non-`.html` file, `$any(` in an inline template string and `jit: true` (R7-L1). The scope check does not see git-ignored files (R7-L2). A symlinked directory directly under `packages/` or `apps/` that nothing imports is not reported (R8-L1). Real folders under a `node_modules` directory or outside the repository are treated as external (R10-L1). Manifest paths with a leading space or a Windows drive letter are not flagged (R10-L2). One message prints an empty path (R10-L3). Today V17 (apps and packages frozen), V16 (lockfile byte-identical) and git ignoring `node_modules/` block every one of these. Owner: the first work package that opens `apps/**` or `packages/**` or changes the lockfile (IB1) must extend the checker, or re-confirm these residuals, before relying on it.

(viii) **Stricter than required:** every symlink below a project root is rejected whatever its real path, and a bare import is judged by the real path of its `node_modules` entry (PO/SA security edge-case decision).

## Residual-risk disposition

All residual risks (i)–(viii) are ACCEPTED as non-blocking: none makes a mandatory criterion fail, none is an active architecture or security violation (the graph has 0 edges and 0 violations), each has an owner (lint/format owner WP, IB0-WP05, IB1, or the packaging decision), and the rationale is recorded above.

## Technical result

**PASS** (29/29)

## Human acceptance decision

| Field | Value |
| --- | --- |
| Technical Verification | PASS |
| Independent QA | PASS |
| Architecture Conformance | PASS |
| Acceptance Criteria | 29/29 PASS |
| Acceptance Status | ACCEPTED |
| Acceptance Authority | Product Owner / Solutions Architect |
| Acceptance Date | 2026-09-24 |
| Recorded under | PO/SA instructions "IB0-WP04 — FINAL ACCEPTANCE, MERGE AND POST-MERGE CLOSURE" and "IB0-WP04 — RESOLUTION OF THE TWO OUTSTANDING ARCHITECTURE DECISIONS" (project thread, 2026-09-24), after every mandatory gate passed |
