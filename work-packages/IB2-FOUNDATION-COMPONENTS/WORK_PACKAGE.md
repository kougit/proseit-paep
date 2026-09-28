# Work Package IB2-FOUNDATION-COMPONENTS — Design Foundations, Core Components and UI Laboratory

**Authorisation:** Product Owner / Solutions Architect instruction "PAEP IB2 — DESIGN FOUNDATIONS, CORE COMPONENTS AND UI LABORATORY" (project thread, 2026-09-26T20:00Z, revised 2026-09-26T20:30Z). This file is the authorisation reference of baseline registry generation 4 (CANDIDATE).  
**Design approval:** HOF-IB2-001 v1.1 (DWP-IB2-001), APPROVED_FOR_IMPLEMENTATION by the PO/SA on 2026-09-27 (brand primary `#24364B`, brand accent `#D4A62A`, protected semantic tokens approved and non-overridable, component scope 25/25, open design decisions none).  
**Dependency approval:** PO/SA, 2026-09-27: `vitest@4.1.11`, `@vitest/browser-playwright@4.1.11`, `playwright@1.63.0`, `axe-core@4.13.0` (dev dependencies, exact pins; axe-core MPL-2.0 under its own licence review). Browsers come from the runner (`CHROME_BIN`); nothing is downloaded.  
**Milestone:** IB2 (PAEP-IR-01 §6.7 IB2-WP1..IB2-WP6, delivered as one work package)  
**Predecessor:** IB1-CONTRACTS-CONFIG ACCEPTED and CLOSED; active accepted baseline generation 3 (`b6ae8427e4d54840f71dadd5fedcce99d50f4584`, promotion merge `d33ab91`)  
**Design classification (PAEP-DCH-01 §5):** D1 (Design Significant) for the foundation and the 25 components: they are new reusable foundational visual and interaction patterns (§5.1(ii)), delivered on the full route DWP-IB2-001 → Claude Design → PO/SA review → approved handoff HOF-IB2-001 v1.1 → Claude Code. D2 (Design Extension) for the UI laboratory: it is composed only of approved components, and its information architecture was approved in the same handoff (OD-21). Tooling, CI and governance are not UI work and have no DCH class. (Corrected on 2026-09-27 during evidence review: an earlier draft of this line had the D1/D2 labels inverted and used a non-existent class "D0"; the route followed is unchanged.)  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Naming:** no controlled naming rule exists for IB2 work packages; the identifier `IB2-FOUNDATION-COMPONENTS` is used.

## 1. Objective

1. `@proseit/paep-foundation`: versioned design tokens with the approved HOF-IB2-001 v1.1 values, separated into reference, semantic (protected) and brand (overridable) layers; density, reduced-motion, focus and responsive primitives; a fail-closed brand-profile validator; PAEP-owned icons; a polite/assertive live-region announcer.
2. `@proseit/paep-components`: the 25 components of PAEP-IR-01 §6.4, styled only through semantic tokens, consumed only through the public entry point, with behaviour tests in a real browser.
3. `apps/ui-lab`: the permanent PAEP UI laboratory (IR-01 §6.6) with a token catalogue, foundation pages and one specimen page per component (purpose, variants, states, accessibility, responsive, RTL, evidence).
4. Quality infrastructure: component behaviour tests, static token and clean-room checks, browser accessibility/responsive/reduced-motion/RTL checks with axe-core, visual CANDIDATE captures, negative tests, and mandatory CI jobs feeding `PAEP / gate`.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-TOKENS | Semantic tokens are versioned, documented and used by every IB2 component; protected tokens cannot be overridden | IR-01 §6.8(i); EQP §29.3; HOF-IB2-001 token-values |
| R-COMP | Exactly the 25 components of IR-01 §6.4, with the state completeness rule | IR-01 §6.4, §6.5 |
| R-A11Y | WCAG 2.2 AA intent: names, keyboard, focus, non-colour cues, announcements, 320 px reflow, reduced motion, RTL | IR-01 §6.3; EQP; HOF-IB2-001 accessibility-intent |
| R-LAB | UI laboratory shows every component, state and evidence link | IR-01 §6.6, IB2-WP4 |
| R-CLEAN | Clean-room: no Ultima, PrimeNG template, SAP Fiori, commercial theme, proprietary CSS/assets or screenshot translation | PAEP v1.1; CLAUDE.md; DCH |
| R-DEP | Only the four approved dev dependencies | PO/SA dependency approval 2026-09-27 |
| R-GOV | Generation 3 stays ACCEPTED; generation 4 is a CANDIDATE never promoted by Claude | `docs/architecture/BASELINE-ROLLOVER.md` |
| R-CI | New mandatory jobs feed `PAEP / gate`; its context and gate logic stay unchanged; `PAEP / negative-ci` keeps its 20-minute timeout and gets no IB2 workload (RR14) | IB0-WP05; authorising instruction |

## 3. Authorised change scope (registry generation 4 `authorisedScope`)

* `packages/foundation/`, `packages/components/`, `apps/ui-lab/`
* `angular.json` (the ui-lab `test` target only; the foundation stylesheet is imported from `apps/ui-lab/src/styles.css`, so the build options are unchanged)
* `package.json`, `package-lock.json` (the four approved dev dependencies and IB2 scripts)
* `tooling/design-system/` (IB2 static, browser, visual and negative checks)
* `docs/architecture/IB2-FOUNDATION-COMPONENTS-DESIGN.md`, `docs/architecture/toolchain-version-manifest.json`
* `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md`, `docs/licences/THIRD-PARTY-NOTICES.md`, `docs/provenance/PROVENANCE-REGISTER.md`
* `.github/workflows/paep-ci.yml`, `tooling/verification/ib0-wp05-ci-policy.json`, `tooling/verification/verify-ib0-wp05.mjs` (policy change: new jobs and the bounds in §7). The WP05 negative suite `tooling/verification/negative-ib0-wp05.mjs` is not changed and is outside the scope.
* `tooling/governance/baseline-registry.json` (append generation 4 CANDIDATE)
* `tooling/governance/negative-baseline-governance.mjs` (fixture repair, added during implementation: the generation 2 lifecycle fixture restores `package.json` dependency fields to their generation 2 form, so IB2's approved dev dependencies do not break the historical simulation; every case and expectation is unchanged)
* `evidence/design-handoff/HOF-IB2-001/` (the approved handoff, DCH controlled evidence structure)
* `work-packages/IB2-FOUNDATION-COMPONENTS/`, `evidence/IB2-FOUNDATION-COMPONENTS/`

The baseline-governance verifier enforces this scope (B11, W05).

## 4. Out of scope

The enterprise shell and navigation frame; the Frappe SDK and any Frappe/ERPNext integration; authentication and session; offline/PWA; reporting and analytics UI; charts; domain kits and product screens or workflows; an i18n runtime service (content keys and English defaults only); dark mode; lint/format tooling; Nx; any other dependency; the Angular or TypeScript major; existing `tsconfig*.json` files (the only new one is `apps/ui-lab/tsconfig.spec.json`, inside `apps/ui-lab/`, which the Angular unit-test builder requires); `tooling/architecture-boundaries/`; controlled sources; earlier work-package records; CLAUDE.md.

## 5. Deliverables

| Deliverable | Location |
| --- | --- |
| Token stylesheet, typed token catalogue, brand validator, icons, announcer | `packages/foundation/` |
| 25 components with behaviour tests | `packages/components/src/lib/<component>/` |
| UI laboratory | `apps/ui-lab/` |
| Static token/clean-room checks, browser QA, visual captures, negatives | `tooling/design-system/` |
| Design and API notes | `docs/architecture/IB2-FOUNDATION-COMPONENTS-DESIGN.md` |
| Approved handoff and design conformance | `evidence/design-handoff/HOF-IB2-001/` |
| CI jobs `PAEP / components`, `PAEP / accessibility` | `.github/workflows/paep-ci.yml` |
| Evidence set, traceability, acceptance readiness | `evidence/IB2-FOUNDATION-COMPONENTS/`, `TRACEABILITY.csv`, `ACCEPTANCE_REPORT.md` |

## 6. Acceptance boundary

Claude Code may implement, verify, document, push, open one ready PR and run CI. Claude Code may not mark IB2 ACCEPTED, promote generation 4, self-approve visual baselines, merge, or begin later PAEP work. Those require explicit PO/SA authorisation.

## 7. Bounded successor-work exceptions

The accepted registry-bound mechanism (accepted history up to the active accepted commit, or an in-scope change with B11 passing) is reused. The historical WP02/WP03/WP04 verifiers and negative suites are not modified. The findings below appear because IB2 does what those verifiers were written to reject while IB0 required placeholders and a frozen dependency set; the WP05 verifier evaluates exactly these findings with the same registry bound. Any other finding still fails.

| Historical finding | Why it appears | Bound applied in `verify-ib0-wp05.mjs` |
| --- | --- | --- |
| WP04 V07 / WP03 V09 "entry point is a placeholder" for `packages/foundation` or `packages/components` | IB2 replaces the IB0 `export {}` placeholders with real public APIs | The IB1 filled-entry bound, extended to these two entry points |
| WP02 V13 "lockfile differs from the IB0-WP01 baseline" | The PO/SA approved four dev dependencies | Accepted only with a clean working tree, `package-lock.json` changed in scope (or accepted history), W06 passing and the exact approved delta: `dependencies` equal to the accepted baseline, `devDependencies` equal to the baseline plus exactly the four approved exact pins, the lockfile root matching `package.json`, and every new lockfile entry `dev: true` (not optional) |
| WP02 V15 `node_modules/axe-core: MPL-2.0 allowed only for review L1 packages` | axe-core is MPL-2.0; its review is L5 (`docs/licences/THIRD-PARTY-LICENCE-REVIEW.md`) | Accepted only for `axe-core` at dev scope, with the L5 review row present; any other licence finding fails |
| WP03 V06 "angular.json changed" | IB2 adds the ui-lab `test` target | Accepted only while `angular.json` is in scope or accepted history, and only if every other `angular.json` property equals the accepted baseline |

The WP05 verifier itself is tightened, not loosened, for IB2:

* W06: when `package-lock.json` differs from the accepted baseline, it passes only with the exact approved delta above and with the `lockfile.sha256` in `docs/architecture/toolchain-version-manifest.json` equal to the committed lockfile.
* W11: the `negative-ci` job timeout must be exactly 20 minutes (review rule RR14). Before, it only had to be present.
* W11: the `components` and `accessibility` jobs and their IB2 commands (`test:components`, `qa:design-system`, `qa:design-system:negative`, `qa:ib2:ci-negative`, `build:ui-lab`, `qa:accessibility`, `qa:accessibility:negative`) are a floor even while the CI policy is a CANDIDATE, so removing one from the policy and the workflow together fails (authorising instruction §18). Later changes may add commands, never drop these.
* The IB2 CI-governance negatives (`qa:ib2:ci-negative`) prove each: raising the timeout to 30 fails W11 (I05); an unapproved dev dependency (I10) or `axe-core` moved to runtime dependencies (I11) fails the V13 bound; dropping an IB2 command from the policy and the workflow together fails W11 (I13, I14).
