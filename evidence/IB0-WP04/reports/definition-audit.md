# IB0-WP04 Definition Audit

**Date:** 2026-09-24. **Baseline:** `main` at `ac6b786` (IB0-WP03 merge). **Method:** read-only review of the controlled sources in priority order (CLAUDE.md), the IB0-WP01/02/03 acceptance records and the repository, as six lanes: A requirements, B current graph, C enforcement design, D tsconfig/path model, E negative-test design, F regression. **Result:** PASS — every criterion traces to a controlled requirement or governance rule; one intra-document conflict (§6 below, found by independent QA round 1) is reported for PO/SA decision with a default that affects no current edge; defaults listed in §5 need PO/SA confirmation.

## 1. Pre-flight (all PASS)

| Check | Result | How verified |
| --- | --- | --- |
| IB0-WP03 CLOSED on main; PR #3 merged | PASS | `origin/main` = `ac6b786` "Merge pull request #3 … (ACCEPTED)"; `work-packages/IB0-WP03/work-package.json` status ACCEPTED; `evidence/IB0-WP03/notes/closure-authorisation.md` |
| WP01/WP02/WP03 acceptance evidence present | PASS | `work-packages/IB0-WP0{1,2,3}/ACCEPTANCE_REPORT.md`, `evidence/IB0-WP0{1,2,3}/reports/independent-qa.md` |
| Controlled-file fingerprints | PASS | 13/13 SHA-256 and size match `PACK_MANIFEST.json` (`logs/controlled-source-integrity.log`) |
| Toolchain | PASS | Node 24.21.0, npm 11.19.0 (`devEngines`, `.nvmrc`), Angular/CLI 22.1.8, TypeScript 6.0.3 (`logs/ng-version.log`); Angular CLI + npm workspaces; no Nx |
| No WP05 / IB1 implementation | PASS | No `.github/`, CI, test runner or lint config; all 18 entry points `export {};`; apps unchanged since WP01 bootstrap |
| Existing WP04 material | Only `tooling/architecture-boundaries/README.md` (placeholder) | `grep -rn WP04` |
| WP03 verifier on `ac6b786` | PASS 18/18 | Run before any change |

## 2. Controlled requirements (Lane A)

| Req | Controlled text (quoted) | Source |
| --- | --- | --- |
| R-GRAPH | "Angular CLI workspace with Nx-compatible orchestration and project graph"; "Nx-compatible project graph, caching and module boundaries. Dev/build-time only"; "does not make Nx … an immutable architecture dependency"; "Workspace builds; project graph generated; public entry points defined; prohibited dependency tests green" | IB-01 §4.1, §4.2, §2.3(ii), §22 |
| R-CLASS | §6.1 layer table L0–L4 with packages; "Architecture tags and import rules are evaluated in lint/CI" | IB-01 §6.1, §6.2(viii); EQP §29.1(iv) "implement architecture tags" |
| R-DIR | Appendix B matrix; "shared packages shall not depend on product applications"; "Foundation and product-neutral contracts shall not depend on enterprise, domain, Frappe, analytics implementation or application packages" | IB-01 App. B; IR-01 §4.3(i)-(iii); PAEP v1.1 §5.3 |
| R-CYCLE | "Circular package dependencies are prohibited and fail CI" | IB-01 §6.2(i); IR-01 §4.3(v); EQP §16(ii) |
| R-DEEP | "Deep imports such as @proseit/paep-components/src/internal/... are prohibited. Shared code is consumed only from public entry points." | IB-01 §6.2(ii), §5.2(ii); IR-01 §4.3(iv); EQP §16(v) |
| R-NEUTRAL | "@proseit/paep-contracts shall not import Angular, Frappe, DOM/browser APIs or visualization libraries"; L0 "Approved external dependencies only"; "must compile without Angular or browser globals" | IB-01 §6.2(iii), §6.1, §7.1(i); EQP §16(iii) |
| R-SPECIFIC | frappe-sdk "shall not import PAEP UI or product packages"; analytics "shall not import Frappe persistence models"; no visualization-vendor objects in public reporting contracts; apps "shall not reimplement platform contracts locally" / "shall not duplicate platform code" | IB-01 §6.2(iv)-(vi); EQP Claude contract; PAEP v1.1 §5.3 |
| R-TSBASE | `tsconfig.base.json` at the root of both target topologies | IB-01 §5.1, App. A; IR-01 §4.2; WP03 closure decision (iv) |
| R-NEG | "Negative boundary tests demonstrating CI rejection"; "controls are active and demonstrated by negative tests" | IR-01 §4.4 IB0-WP4, §4.6(iii) |

## 3. Current graph (Lane B, at `ac6b786`)

20 projects: 18 npm-workspace packages (`packages/*`, each with `package.json` and placeholder `src/index.ts`) and 2 `angular.json` applications. 18 exact aliases in root `tsconfig.json`. No `tsconfig.base.json`, `nx.json` or `project.json`. 26 source files, 18 import statements (all Angular framework imports in the apps), 0 workspace edges, 0 cycles, 0 deep imports. Every package directory maps to one category; no ambiguous ownership.

## 4. Criterion trace

| Criteria | Requirement |
| --- | --- |
| AC01 | EQP §11-§12; CLAUDE.md execution discipline 1-2 |
| AC02, AC03 | R-CLASS, R-DIR (model = IB-01 §6.1 + App. B) |
| AC04 | R-GRAPH |
| AC05, AC07 | R-TSBASE, R-DEEP (alias registry cannot publish deep paths) |
| AC06 | R-BASE (WP03 strictness, IB-01 §4.1) |
| AC08 | R-DEEP (public entry points), R-SCOPE (placeholders only) |
| AC09 | R-DIR, R-SPECIFIC (frappe-sdk/analytics "No" cells) |
| AC10, AC11 | R-DEEP; IB-01 §5.2(i) app ownership |
| AC12 | R-CYCLE |
| AC13 | R-NEUTRAL |
| AC14 | R-SPECIFIC |
| AC15, AC16 | R-NEG |
| AC17 | R-SCOPE; IB-01 §2.3(ii); PO/SA instruction §6 |
| AC18–AC22 | R-BASE (IR-01 §4.5; IB-01 §4.1) |
| AC23–AC25 | R-BASE (WP01–WP03 regression) |
| AC26 | R-SCOPE; CLAUDE.md secrets rule |
| AC27–AC29 | R-EVID (EQP §24, §32, App. C) |

No criterion adds WP05 (CI, test runner), IB1 (contracts, runtime config) or lint/format scope.

## 5. Ambiguities and defaults (need PO/SA confirmation)

| # | Ambiguity | Default taken | Why |
| --- | --- | --- | --- |
| D1 | Appendix B uses "-" both for self and for every upward cell | Off-diagonal "-" = not allowed | §6.1 "May depend on" lists only lower layers; IR-01 §4.3 |
| D2 | `domain-*` → another `domain-*`, app → app | Not allowed without an ADR | Matrix grants no such cell; §6.2(viii), IR-01 §4.3(vi) route exceptions through ADRs; domain kits must be reusable across products (PAEP v1.1 §5.1) |
| D3 | "Optional" cells | Allowed; the graph flags each Optional edge for justification | Matrix note: "allowed but should be justified by actual responsibility" |
| D4 | `tsconfig.base.json` content | Alias registry only; strictness stays literal in `tsconfig.json`; `paths` moved (one registry) | Topology lists it; Nx-compatible graphs read aliases from it; keeps WP03 controls literal |
| D5 | `nx.json` in the topology | Not created | PO/SA decision at WP03 closure (iv) |
| D6 | "evaluated in lint/CI" (IB-01 §6.2(viii)); EQP §16(i) "lint/graph rules" | Graph rules via the PAEP checker; ESLint rules deferred with lint/format | Lint deferred by PO/SA; graph rules satisfy §16(i) |
| D7 | "demonstrating CI rejection" with no CI yet | Non-zero exit of `npm run arch:check`; WP05 wires it into CI | IR-01 §4.4 assigns CI to IB0-WP5 |
| D8 | WP03 verifier scope checks flag WP04 changes | Bounded exception V05/V08/V10/V12/V17 (AC23) | Same pattern the PO/SA accepted for WP02 V17 at WP03 |
| D9 | Analytics vendor exposure (App. D, §6.2(v)) | Mechanical proxy: analytics may not re-export an external module; semantic review of contract types stays with the analytics milestone | No analytics code exists; a vendor list would be invented |
| D10 | §6.2(v) "arbitrary transport calls", §6.2(vii) domain business validation | Not mechanically checked in WP04 | Runtime/behavioural rules; no code exists; owners are the IB1+ milestones |
| D12 | IB-01 §6.1 (lower layers only) versus Appendix B (eight same-layer Optional cells) | Appendix B governs | See §6 |
| D11 | `docs/architecture/toolchain-version-manifest.json` says Nx "deferred to IB0-WP04" | Left unchanged; disposition recorded here, in the plan and provenance register | File is under WP02 verification |

## 6. Conflicts

**Corrected after independent QA round 1 (finding M4).** The first version of this audit said there was no conflict. That was wrong.

**C1 — IB-01 §6.1 versus IB-01 Appendix B (same document, same priority).** §6.1 says L1 may depend on "L0 only", L2 on "L0-L1" and L3 on "L0-L2 as required". Appendix B allows eight same-layer edges, all "Optional": platform ↔ observability, i18n → platform, i18n → observability (L1); frappe-sdk → offline (L2); analytics → enterprise, domain-* → enterprise, domain-* → analytics (L3).

- **Default taken (pending PO/SA):** Appendix B governs. It is the per-pair rule set; §6.1's own L2 row adds a per-pair detail ("frappe-sdk may depend on observability/contracts"); and the PO/SA instruction for IB0-WP04 describes the direction as "lower/equal architectural categories". The only allowed cycle this permits is platform ↔ observability, which the CYCLE rule rejects (negative case N05).
- **Why this is not a stop:** the graph has 0 edges, so no code depends on the choice; both options keep every "No" cell, upward edge, cycle and deep-import rule; the stricter reading is a small checker change the PO/SA can order.
- **Alternative:** §6.1 governs (strict layering; the eight cells become forbidden, cycles become impossible without a DIRECTION finding).
- **Resolved by the PO/SA on 2026-09-24:** YES, the eight Optional links are permitted. §6.1 states the general rule and Appendix B, the more specific matrix, qualifies it. Optional means permitted, not required, and subject to every other control. The PO/SA also decided that "No" is a reachability constraint: a chain of allowed edges whose end pair is "No" is rejected. The matrix's transitive closure has exactly four such pairs (observability → foundation, offline → foundation, frappe-sdk → foundation, frappe-sdk → i18n), reached by five two-step chains, each covered by negative cases T1–T5.

## 7. PO/SA decisions (2026-09-24)

D1 is confirmed. D2 is replaced by an explicit, fail-closed `sameCategoryAllowlist` (Decision 2). D3: Optional permitted, not required. D4 approved (Decision 4). D8 approved (Decision 3). D12/C1 resolved as above. PAEP-EQP-01 Appendix B is the QA command-naming standard; `qa:architecture` is exposed for the existing gate (Decision 1). The WP04 definition is approved (Decision 5).

Other areas agree: direction for all cross-layer pairs, cycles, deep imports and contracts neutrality. Nx is optional by IB-01 §2.3(ii). No other CLAUDE.md stop condition applies.
