# Work Package IB3-ENTERPRISE-SHELL — Enterprise Application Shell

**Authorisation:** Product Owner / Solutions Architect instruction "PAEP IB3 — FINAL DESIGN APPROVAL + GENERATION 5 IMPLEMENTATION AUTHORIZATION" (project thread, 2026-10-06T09:48Z): HOF-IB3-001 v1.0 APPROVED_FOR_IMPLEMENTATION, Generation 5 CANDIDATE, IB3-ENTERPRISE-SHELL AUTHORIZED IMPLEMENTATION. This file is the authorisation reference of baseline registry generation 5 (CANDIDATE).  
**Design approval:** HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION by the PO/SA (Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect) on 2026-10-05. Approved manifest SHA-256 `645dd2e9bb4274c9b787bbbcc52cf53eb4f08dc21d733b5985aa3ab572f4fce5` (577 / 577 PASS). Human similarity review PASS (R-1..R-12 DISTINCT). Earlier candidate manifests: `7cc8d8c9…f2f3bd` (revision 1), `b2056fe2…ec9be` (revision 2, reviewed).  
**Milestone:** IB3 — Enterprise Application Shell  
**Predecessor:** IB2 CLOSED; Generation 4 ACCEPTED at `81c223c84c98d6bae80dd45044489e777931049b` (promotion merge `929387b4dc33c1ee66fad3a54a4366f871ad5a47`); active candidate NONE at authorisation.  
**Design classification (PAEP-DCH-01 §5):** D1 (Design Significant), implemented from the approved HOF-IB3-001. Stage S1a (DDR-IB2-07 closure) is D3 direct-code maintenance reproducing already-approved HOF-IB2-001 boards.  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect. Technical PASS is not ACCEPTED. Claude does not accept IB3, does not promote Generation 5 and does not merge the implementation pull request.

## 1. Objective

Deliver the shared, product-neutral enterprise application shell in `@proseit/paep-enterprise`, composed from the accepted Generation 4 foundation and components and conforming to the approved HOF-IB3-001 v1.0. Thin `apps/*` keep route ownership and product-specific information architecture. Close DDR-IB2-07 first, and record HOF-IB2-001 v1.2 before the Q-02 component changes land.

## 2. Inputs (source of truth below the controlled texts)

| Input | Version / location |
| --- | --- |
| HOF-IB3-001 | v1.0, APPROVED_FOR_IMPLEMENTATION, manifest `645dd2e9…fce5`; retained under `evidence/design-handoff/HOF-IB3-001/` |
| HOF-IB2-001 | v1.1 (retained, not overwritten); v1.2 documentation revision under this WP |
| DDRs | DDR-IB2-01, -02, -04, -05, -07, -08 (ACCEPTED WITH FOLLOW-UP) |
| Pre-flight pack | IB3 pre-flight `09` (work-package draft), `13` (Generation 5 plan), `14` (acceptance-criteria draft), `17` (PO/SA decision register) |
| Decisions | Q-01..Q-14, X-01..X-05, RD-01..RD-03 as recorded in HOF-IB3-001 `decision-record.md` |

## 3. Stages (one Generation 5 candidate; stages are sequencing only)

| Stage | Content | Precondition |
| --- | --- | --- |
| S0 | Generation 5 CANDIDATE, these records, narrow `CLAUDE.md` amendment | HOF-IB3-001 approved; this authorisation |
| S1a | DDR-IB2-07 closure in the UI lab (F07 focus surfaces and 9-state matrix; full R03 320 px board); new IB3 captures at 1440 / 834 / 320; G-DDR07 sequence, content, seeded negative and release guard | S0 |
| S1b | HOF-IB2-001 v1.2 (documentation revision, PO/SA approval required before the Q-02 component code lands); approved design-system extensions | S1a CLOSED |
| S1c | Minimal seams in `paep-platform`, `paep-i18n`, `paep-observability`; enterprise public API and provider ports; governance and CI scaffolding | S1a CLOSED |
| S2 | Shell frame, topbar, navigation (sidebar, rail, sheet) | S1b, S1c |
| S3 | Workspace / page frame | S2 |
| S4 | Command / search experience | S1b, S2 |
| S5 | Notifications, locked, error, not found, connectivity, context surfaces | S2 |
| S6 | Responsive, accessibility and RTL qualification | S2-S5 |
| S7 | Reference-app demonstration and UI-lab shell showcase | S2-S5 |
| S8 | Integrated QA, evidence, acceptance readiness | all |

No change under `packages/foundation/` or `packages/components/` is committed to the IB3 integration branch before DDR-IB2-07 is recorded CLOSED. No change to `PaepPopover`, the action-group overflow or a `PaepMenu` on the shared positioning base lands before HOF-IB2-001 v1.2 is approved by the PO/SA.

## 4. Authorised change scope (registry generation 5 `authorisedScope`)

Exact, path-bounded entries; no whole `apps/`, `packages/` or `tooling/` entry:

* `CLAUDE.md` (narrow amendment: §6), `.github/workflows/paep-ci.yml` (two new mandatory jobs), `angular.json` (test target include for the new seams), `package.json` (new scripts only)
* `apps/reference-app/` (shell composition, bounded routes); `apps/ui-lab/src/app/` (DDR-07 pages, new primitive specimens, enterprise-shell showcase) and `apps/ui-lab/tsconfig.spec.json` (spec include)
* `docs/architecture/IB3-ENTERPRISE-SHELL-DESIGN.md`, `docs/provenance/PROVENANCE-REGISTER.md`
* `evidence/IB3-ENTERPRISE-SHELL/`, `evidence/design-handoff/HOF-IB3-001/`, `evidence/design-handoff/HOF-IB2-001/` (v1.2 revision files and DDR closure records only; v1.1 files unchanged)
* `packages/components/src/` (only the approved component changes of §5), `packages/foundation/src/` (only the approved icons and tokens of §5)
* `packages/enterprise/src/`, `packages/enterprise/README.md`
* `packages/i18n/src/`, `packages/observability/src/`, `packages/platform/src/` (minimal seams only)
* `tooling/design-system/`, `tooling/enterprise-shell/`, `tooling/test-utils/`, `tooling/governance/baseline-registry.json`
* `tooling/verification/ib0-wp05-ci-policy.json`, `tooling/verification/negative-ib0-wp05.mjs`, `tooling/verification/verify-ib0-wp05.mjs` (the approved IB3 jobs and bounds)
* `work-packages/IB3-ENTERPRISE-SHELL/`

Not authorised: `package-lock.json`, any new npm dependency, `packages/*/package.json`, `packages/contracts/`, the runtime-config schema, `tsconfig*.json`, `tooling/architecture-boundaries/`, `docs/licences/`, `docs/architecture/toolchain-version-manifest.json`, any accepted protected record, Nx.

## 5. Approved implementation content

**Components (`@proseit/paep-components`):** `PaepPopover` inline-end alignment (governed flip/shift, 16 px viewport edge margin); `PaepMenu` on the governed positioning base; `PaepCombobox` + listbox; count badge; field-style search trigger; `EmptyState` `unavailable` kind. The action-group overflow is rebuilt on the shared base where technically compatible.

**Foundation (`@proseit/paep-foundation`):** `.paep-skip-link`; the 24 approved shell icons; the six `--paep-shell-*` structural tokens; the six `--paep-layer-*` semantic layer tokens. No new colour or tone. No content-max alias (`--paep-layout-content-max` is used). The placeholder mark is not a public foundation API; it exists only as synthetic reference-app / UI-lab / design evidence.

**Enterprise (`@proseit/paep-enterprise`, one public entry point):** PaepShell, Topbar, Nav, NavSheet, PageFrame, CommandPalette, NotificationPanel, ContextSwitcher, AccountMenu, LockedState, ErrorBoundary, NotFound, StatusStrip, ShellPreferences, RouteFocus; typed navigation manifest; shell provider ports with test doubles in `tooling/test-utils`.

**Seams:** `paep-platform` (RuntimeConfigStore Angular exposure, connectivity signal port, minimal shell provider wiring); `paep-i18n` (active locale, direction, `lang`/`dir`, message-key resolution with English defaults); `paep-observability` (error-reporting/correlation interface with a safe default). No full i18n or observability system. `@proseit/paep-contracts` is not reopened.

**Design decisions** are implemented exactly as recorded in HOF-IB3-001 (light topbar; 5.5 rem labelled rail with optional authored `shortLabel`; non-modal inset notifications panel, max 24 rem, 16 px margin; Go to / Actions / Records; non-online status always represented; tenant context in the page header and sheet below 600 px; no Toast; inline-start modal navigation sheet, max 20 rem, not `paep-drawer`; denied items hidden with an explanatory locked page on direct links; explicit context switching; Ctrl/Command-K plus visible trigger; neutral/info locked tones; comfortable chrome; top status plus accessible "n more"; status order impersonation → connectivity → session → environment; a language control when more than one locale exists, without LTR/RTL as topbar copy).

## 6. CLAUDE.md amendment (governed change, policyChange)

The mandatory rule "Do not implement … the enterprise shell …" is narrowed so that the enterprise shell may be implemented only under this work package and this authorisation. The amendment keeps explicit work-package bounds, the prohibition on later milestones, no self-acceptance, no baseline self-promotion and every security and provenance requirement. It is reviewed in the RR6-style governance review.

## 7. Exclusions

Analytics / reporting engine, saved views and reporting gateways; offline queue, sync, conflict and service worker; Frappe integration; full authentication or session flows; `/login`, `/analytics…`, `/offline-demo`; domain components, fiscal logic, AI / IoT domain UI; any later milestone. Navigation visibility, disabled controls, locked presentation and context selection are explanatory UI only and never grant authority.

## 8. Budget (AC-IB3-15)

Reference-app production build, initial chunks: at most **500 kB raw** and **150 kB estimated transfer** with the shell composed (pre-IB3 baseline 221.65 kB raw / 59.44 kB transfer, 2026-10-06). The existing Angular budgets (initial warning 500 kB, error 1 MB; any component style warning 4 kB, error 8 kB) stay unchanged.

**PO/SA decision 2026-10-07 (DDR-IB3-07, ACCEPTED with controlled budget adjustment).** 500 kB raw is retained as the engineering target. The IB3 hard limits are **525 kB raw** and **150 kB estimated transfer** (unchanged); IB3 fails if either is exceeded, measured in exact bytes from the production build and never rounded (`qa:shell` B1, with negatives). The size reference is 516.75 kB raw / 121.44 kB transfer; a later material increase before IB3 acceptance must be investigated, and a result approaching or exceeding 525 kB needs optimisation or separate PO/SA authorisation. This decision authorises no further increase.

## 8a. Strict CSP (AC-IB3-12)

**PO/SA decision 2026-10-07 (strict-CSP finding of the independent QA, H-01): APPROVE STRICT NONCE-BASED CSP.** The production profile uses a cryptographically strong nonce generated by the deployment layer for every HTML response, placed in both the `Content-Security-Policy` header and Angular's nonce mechanism; it is never hard-coded, committed as a build value or reused. Minimum posture: `default-src 'self'; script-src 'self' 'nonce-…'; style-src 'self' 'nonce-…'` plus the deployment's own directives, keeping any stricter directive. Prohibited: `'unsafe-inline'` or `'unsafe-eval'` in any form, a static or build-time nonce, wildcard script or style origins, `data:` in `script-src`, third-party origins added to make tests pass. Trusted Types stay enforced with only the Angular policies the AOT build needs (never `angular#unsafe-jit`; `angular#unsafe-bypass` only after a security review). A deployment profile that cannot supply a per-response nonce is a security exception for PO/SA and security disposition. The decision authorises no new dependency, lockfile change, runtime-config schema change, JIT or security-bypass API.

## 9. CI

Two new mandatory jobs feed `PAEP / gate`: `PAEP / enterprise-shell` (`test:enterprise`, `qa:enterprise`, `qa:enterprise:negative`, `qa:ib3:ci-negative`) and `PAEP / shell-browser` (`build:reference-app`, `qa:shell`, `qa:shell:negative`). No IB3 case goes into `negative-ci` or `negative-ci-b`; both keep `timeout-minutes: 20`. Actual timings are recorded. Insufficient headroom is a STOP for PO/SA authorisation.

**PO/SA decision 2026-10-07 (CI-control repartition, APPROVE THREE-WAY PARALLEL SPLIT).** `PAEP / negative-ci-b` passed every case but reached its 20-minute timeout (13 m 41 s on mainline 929387b; 19 m 47 s to 20 m 16 s on the IB3 heads). The WP05 CI-control negative suite is split into three parallel parts by an explicit, deterministic case-to-part mapping: part a in `PAEP / negative-ci` (with `qa:baseline:negative`), part b in `PAEP / negative-ci-b` and part c in the new mandatory job `PAEP / negative-ci-c`, all feeding `PAEP / gate`. Every existing case is kept with the same semantics, each case belongs to exactly one part, the total case count is pinned, and each part keeps `timeout-minutes: 20` (no increase, no automatic escalation). The CI definition fails if a part is omitted, a case is unassigned, repeated or dropped, the gate stops depending on a part, or a part's timeout changes (`qa:ib0-wp05` W11/W12; negatives in `qa:ib3:ci-negative`). Actual run times of the three parts are recorded from exact-head CI; a part that still regularly reaches its timeout is a STOP for PO/SA (no fourth part, no timeout increase). The decision authorises no other change.

**PO/SA pre-acceptance disposition 2026-10-07 (Generation 5 CANDIDATE; acceptance, merge and promotion not authorised).** DDR-IB3-06: remediate, do not accept the deviation; the per-item unread text and the "Account: {name}" button name become catalogued `paep.shell.*` keys with English defaults, host overrides and the existing interpolation (no new i18n subsystem); E04 pins the new count. DDR-IB3-07: ACCEPTED, unchanged. DDR-IB3-08: design disposition approved (the exact visible locale token occurs in the accessible name, visible token + descriptive language name, for every locale; direction is not added to the name to meet it); manual accessibility verification pending, so not closed. DDR-IB3-02: accepted as an implementation divergence on the governed PaepMenu / PaepPopover positioning base (no second positioning engine, enterprise-local popover or ad-hoc side placement; keyboard, focus restoration, dismissal, LTR/RTL, viewport collision and shift and the 16 px edge margin retained). DDR-IB3-01, -03, -04 and -05: not self-disposed; a decision table goes to the PO/SA and no implementation change is made for them before their disposition. Mandatory pre-acceptance hardening: notification route targets constrained to internal application routes (navigation safety, not an authorization control); shell help links under an explicit safe-scheme policy with Angular sanitisation kept and `rel` protection for external links; `qa:shell` asserts at 320 px the current tenant context and every applicable non-online connectivity status. The two Lows "IB3 package.json script bodies not content-pinned" and "bundle-composition uses the hoisted source-map-js" may remain as documented non-blocking follow-ups (no dependency or lockfile change). Accessibility CI rule: if `PAEP / accessibility` stalls again on the final candidate, automatic re-runs stop and per-page/per-audit diagnostics (route, viewport, direction, audit number, navigation start and end, failure point) decide between a harness flake and an application defect; the navigation timeout is not raised. Human gates before acceptance: keyboard-only walkthrough, NVDA with current Chromium on Windows, Arabic and Hebrew native-copy review, PO/SA disposition of the visual captures (AC-IB3-16) and attestation of the provenance rows (AC-IB3-19).

**PO/SA final DDR disposition 2026-10-08 (Generation 5 CANDIDATE; acceptance, merge and promotion not authorised).** DDR-IB3-01 ACCEPTED AS IMPLEMENTED (no `trailingMarker` option field, no sub-line key). DDR-IB3-03 ACCEPTED AS IMPLEMENTED (no `paep.shell.context.current` key). DDR-IB3-04 ACCEPTED, TEST-ONLY LOCATION EXCEPTION: the shell test doubles stay in `packages/enterprise/src/lib/testing/` while they are not exported, not imported by production source, not bundled and used only by specs; `qa:contracts` S10 is not changed. DDR-IB3-05 ACCEPTED AS IMPLEMENTED (no secondary entry point, breaking API change or ADR; `@defer` is not described as a separate chunk; DDR-IB3-07 controls retained). Help-link trust disposition (PO/SA 2026-10-08): no host allowlist is required for IB3, and the product-neutral shell embeds none. Policy: same-origin internal routes; absolute external links `https:` only; `javascript:`, `data:`, `file:`, `http:` and every other or custom scheme rejected; no raw HTML; Angular URL sanitisation retained; `rel="noopener noreferrer"` on external links. The host application that supplies the help-link configuration is a trusted configuration boundary for IB3; a future product that takes help URLs from untrusted users, tenants or remote mutable content must add its own governed origin/host validation (outside IB3). CI timing: no change; the 20-minute timeout stays. After the record commit and its exact-head CI the candidate is frozen for the human gates H1 to H6 (`HUMAN_GATES.md`); only completed human evidence may be recorded while review is in progress, and Claude does not perform or fabricate any human judgment.

## 10. Stop rules

STOP and request PO/SA authorisation for: a new dependency; a changed architecture direction; a runtime-config schema change; a `paep-contracts` change; a secondary entry point; a new semantic colour or tone; analytics or offline scope; a CI timeout increase; widening the authorised scope; a new material design decision beyond the approved Q / X / RD decisions; any divergence from approved design intent (recorded as DDR-IB3-*).

## 11. Records

`work-packages/IB3-ENTERPRISE-SHELL/{WORK_PACKAGE.md, ACCEPTANCE.md, ACCEPTANCE_REPORT.md, TRACEABILITY.csv, work-package.json}`; `evidence/IB3-ENTERPRISE-SHELL/`; `evidence/design-handoff/HOF-IB3-001/` (with the conformance report); `docs/architecture/IB3-ENTERPRISE-SHELL-DESIGN.md`.
