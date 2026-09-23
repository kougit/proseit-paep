# Text export of ProSEIT_PAEP_Implementation_Roadmap_IB0-IB2_v1.0.docx

> Convenience text export for Claude Code. The original controlled document under `../originals/` remains authoritative.

PROSEIT ANGULAR EXPERIENCE PLATFORM

PAEP

| IMPLEMENTATION ROADMAP<br>MILESTONES IB0–IB2 |

| --- |



Workspace Governance • Product-Neutral Contracts • Runtime Configuration • Design Foundations • Core Components • UI Laboratory

| Document ID | PROSEIT-STD-PMRA-AF-006-IR01 \| PAEP-IR-01 |

| --- | --- |

| Version | 1.0 \| 15 September 2026 |

| Status | Implementation roadmap candidate |

| Parent Architecture | PAEP v1.1 - PROSEIT-STD-PMRA-AF-006 |

| Implementation Baseline | PAEP-IB-01 - Implementation Architecture & Repository Baseline v1.0 |

| Solutions Architect & Main Product Owner | Dr Kamulegeya Grace B (PhD) |

| Developing Organisation | PROSEIT ORGANISATION OF SOFTWARE PROFESSIONALS LTD |

| Roadmap Scope | IB0 Workspace & Governance; IB1 Contracts & Configuration; IB2 Foundation & Components |



CONTROLLED IMPLEMENTATION ROADMAP

Defines the sequenced engineering work, mandatory evidence and exit gates required to establish the PAEP platform kernel before enterprise-shell implementation begins.

## Document Control

| Field | Controlled Value |

| --- | --- |

| Document title | ProSEIT Angular Experience Platform (PAEP) - Implementation Roadmap: Milestones IB0–IB2 |

| Document ID | PROSEIT-STD-PMRA-AF-006-IR01 / PAEP-IR-01 |

| Version | 1.0 |

| Status | Implementation roadmap candidate |

| Effective date | Upon Product Owner / Architecture approval |

| Parent architecture | PAEP v1.1 - PROSEIT-STD-PMRA-AF-006 |

| Implementation baseline | PAEP-IB-01 - Implementation Architecture & Repository Baseline v1.0 |

| Backend decision | ERPNext + Frappe retained; no backend replacement introduced |

| Main-text formatting | 12 pt body text; enumerated lists use lowercase Roman numerals and restart at (i) for every new list |

| Roadmap boundary | IB0 through IB2 only; IB3 begins enterprise-shell and reference-application composition |



| NORMATIVE RELATIONSHIP<br>This roadmap is subordinate to PAEP v1.1 and PAEP-IB-01. It sequences implementation work and acceptance evidence but shall not weaken or reverse the parent architecture. If a roadmap action conflicts with PAEP security, portability, accessibility, reporting, backend-authority or package-boundary controls, the parent architecture prevails. |

| --- |



### Revision History

| Version | Date | Disposition | Principal change |

| --- | --- | --- | --- |

| 1.0 | 15 Sep 2026 | Implementation roadmap candidate | Formalises IB0–IB2 into governed work packages, mandatory evidence, exit gates and developer handover criteria. |



### Approval and Decision Rights

| Decision domain | Primary authority | Required supporting review |

| --- | --- | --- |

| Roadmap sequence and architecture gates | Solutions Architect | Frontend Platform Council / PMRA Architecture Review Board |

| Platform implementation priorities and milestone acceptance | Main Product Owner | Affected engineering leads and QA |

| Package boundaries and public contracts | Solutions Architect / Platform Lead | Architecture review and CI evidence |

| Security and runtime configuration controls | Security & Assurance Authority | Threat model and negative test evidence |

| Design system, accessibility and UX acceptance | Frontend Platform Council / Quality Lead | UI lab, accessibility and regression evidence |

| Milestone release evidence | Solutions Architect + Main Product Owner | Compatibility, test and provenance records |



## Table of Contents

1. Executive Summary

2. Roadmap Purpose, Scope and Conformance

3. Roadmap Structure and Sequencing

4. IB0 - Workspace and Architecture Governance Baseline

5. IB1 - Product-Neutral Contracts and Runtime Configuration

6. IB2 - Design Foundation, Core Components and UI Laboratory

7. Cross-Milestone Governance and Engineering Controls

8. Completion Baseline Before IB3

9. Handover to IB3

Appendix A. Developer Verification Commands

Appendix B. Milestone Evidence Register

## 1. Executive Summary

This roadmap converts the first three PAEP implementation milestones into a controlled execution sequence. IB0 establishes the governed Angular workspace and automated architecture controls. IB1 introduces product-neutral contracts and validated runtime configuration so the frontend can remain portable while ERPNext/Frappe stays the strategic backend. IB2 establishes the visual and interaction foundation through semantic design tokens, responsive rules, reusable components and the PAEP UI laboratory.

(i) Architecture before screens. The first objective is to make architectural boundaries enforceable in source control and CI before product teams begin assembling rich screens.

(ii) Contracts before backend coupling. The second objective is to ensure that UI packages depend on product-neutral contracts rather than Frappe implementation details.

(iii) Foundation before enterprise shell. The third objective is to make accessibility, responsiveness, visual consistency and state completeness properties of reusable components before IB3 composes the enterprise shell.

(iv) Evidence before milestone closure. Each milestone closes only when its defined evidence is retained and the next milestone can build on it without bypassing prior controls.

Figure 1. PAEP IB0–IB2 implementation sequence and architectural intent.

| ROADMAP OUTCOME<br>At the end of IB2, PAEP shall exist as an enforceable engineering platform kernel: a reproducible workspace, independently compiling product-neutral contracts, validated runtime configuration, semantic design foundations, initial reusable components, a running UI laboratory and evidence-backed architecture gates. |

| --- |



## 2. Roadmap Purpose, Scope and Conformance

### 2.1 Purpose

The purpose of PAEP-IR-01 is to give the platform team an implementation road that is specific enough to execute, review and accept IB0–IB2 without re-deciding the architecture during delivery. It does not replace PAEP v1.1 or PAEP-IB-01; it turns their first implementation decisions into sequenced engineering work and evidence gates.

### 2.2 In Scope

(i) Creation and governance of the PAEP Angular workspace, shared package layout, reference applications and tooling areas.

(ii) Automated enforcement of package dependency direction, public entry points, circular-dependency restrictions and clean-build reproducibility.

(iii) Implementation of framework-neutral contracts for configuration, common errors, identity/domain concerns, reporting and adapter boundaries.

(iv) Implementation of versioned runtime configuration, startup validation, compatibility checks and fail-safe application bootstrap.

(v) Implementation of semantic design tokens, responsive layout rules, initial reusable components and the PAEP UI laboratory.

(vi) Accessibility, responsive, visual, security, provenance and test evidence required for IB0–IB2 acceptance.

### 2.3 Explicit Non-goals

(i) IB0–IB2 do not implement the production enterprise shell, which begins in IB3.

(ii) IB0–IB2 do not connect the platform directly to arbitrary ERPNext/Frappe DocTypes; the Frappe adapter implementation is a later milestone and remains behind PAEP contracts.

(iii) IB0–IB2 do not deliver the full Power BI-class dashboard workspace; they define and compile the reporting contracts required for later analytics implementation.

(iv) IB0–IB2 do not implement the offline command queue, private-deployment identity integrations or product-specific domain workflows.

(v) IB0–IB2 do not permit product teams to fork shared foundation or component code to accelerate local delivery.

## 3. Roadmap Structure and Sequencing

The sequence is intentionally dependency-driven. IB0 creates the engineering environment and enforcement mechanisms. IB1 introduces stable abstractions and validated configuration inside that environment. IB2 then builds reusable visual and interaction primitives on top of those governed foundations. A later milestone may depend on an earlier one, but it shall not bypass its exit gate.

| Milestone | Primary question | Required outcome | Exit gate |

| --- | --- | --- | --- |

| IB0 - Workspace & Governance | Can developers work in a governed Angular platform without violating architecture boundaries? | Reproducible workspace, package topology, CI and boundary enforcement. | Clean build; boundary tests pass; deterministic install. |

| IB1 - Contracts & Configuration | Can the frontend describe capabilities without knowing Frappe or deployment internals? | Framework-neutral contracts, reporting interfaces, versioned runtime schema and safe bootstrap. | Contracts compile independently; valid config boots; invalid config fails closed. |

| IB2 - Foundation & Components | Can teams build accessible, responsive and consistent enterprise UI without product-specific duplication? | Semantic tokens, responsive foundations, initial component set and UI laboratory. | Component, a11y, responsive and visual-regression evidence passes. |



(i) No product-specific screen shall be used to justify bypassing package boundaries established in IB0.

(ii) No UI component shall import Frappe implementation types if the capability can be expressed through PAEP contracts established in IB1.

(iii) No IB2 component shall be accepted on visual appearance alone; states, accessibility, responsive behaviour, documentation and retained test evidence are part of its definition of done.

(iv) Where a later discovery requires changing a parent architecture decision, the change shall be handled through architecture governance rather than hidden inside the roadmap implementation.

## 4. IB0 - Workspace and Architecture Governance Baseline

### 4.1 Objective

IB0 establishes the physical PAEP repository, toolchain boundaries and automated controls that make the architecture enforceable from the first commit. Its purpose is not feature delivery. Its purpose is to ensure that every later feature is built inside a reproducible, governed platform structure.

### 4.2 Target Repository Baseline

Code Block 1. Target PAEP repository topology for IB0.

| paep/<br>├── apps/<br>│   ├── reference-app/<br>│   └── ui-lab/<br>├── packages/<br>│   ├── contracts/<br>│   ├── foundation/<br>│   ├── components/<br>│   ├── platform/<br>│   ├── enterprise/<br>│   ├── analytics/<br>│   ├── offline/<br>│   ├── i18n/<br>│   ├── observability/<br>│   ├── frappe-sdk/<br>│   └── domain-*/<br>├── tooling/<br>│   ├── architecture-boundaries/<br>│   ├── config-validation/<br>│   ├── test-utils/<br>│   ├── visual-regression/<br>│   ├── a11y/<br>│   └── build-release/<br>├── config/<br>├── docs/<br>├── evidence/<br>├── angular.json<br>├── nx.json<br>├── tsconfig.base.json<br>├── package.json<br>└── package-lock.json |

| --- |



The exact orchestration tool remains an implementation choice controlled by PAEP-IB-01, but the ownership boundaries above are architectural. Shared packages are governed centrally; product applications compose them and shall not copy platform code into product repositories as a delivery shortcut.

Figure 2. Mandatory package dependency direction to be enforced by linting and CI.

### 4.3 Mandatory Package Rules

(i) Product applications may depend on approved experience, component, adapter, cross-cutting and base packages, but shared packages shall not depend on product applications.

(ii) Experience packages may depend downward on reusable components, adapters, cross-cutting platform services and architectural base packages.

(iii) Foundation and product-neutral contracts shall not depend on enterprise, domain, Frappe, analytics implementation or application packages.

(iv) Cross-package imports shall use public entry points. Deep imports into another package implementation directory are prohibited.

(v) Circular package dependencies are prohibited and shall fail CI.

(vi) Package-boundary exceptions require an approved architecture decision record with an explicit sunset or compatibility plan.

### 4.4 IB0 Work Packages

| Work package | Implementation activity | Required evidence |

| --- | --- | --- |

| IB0-WP1 | Create the governed workspace, package namespaces, applications, tooling, configuration, documentation and evidence areas. | Repository tree; clean clone and install. |

| IB0-WP2 | Pin the approved Angular/toolchain baseline and commit the lockfile. | Version manifest; package-lock; build log. |

| IB0-WP3 | Configure strict TypeScript/template settings and package path aliases/public entry points. | Compiler configuration; package API checks. |

| IB0-WP4 | Implement architecture tags/boundaries, circular-dependency detection and deep-import restrictions. | Negative boundary tests demonstrating CI rejection. |

| IB0-WP5 | Create baseline CI stages for install, lint, type-check, unit test, build and architecture verification. | Successful CI run from clean source checkout. |



### 4.5 IB0 CI Acceptance Gates

| Gate | Acceptance requirement |

| --- | --- |

| Clean install | A fresh checkout completes the approved package-manager clean installation from the committed lockfile. |

| Build | All current applications and libraries compile successfully. |

| Type safety | Strict TypeScript and strict Angular template checks pass. |

| Architecture | Forbidden upward or cross-layer dependencies are rejected. |

| Circular dependencies | No circular package dependency remains. |

| Public API discipline | No package consumes another package through an internal/deep implementation path. |

| Unit baseline | Current deterministic unit tests pass. |

| Reproducibility | A clean environment reproduces the workspace build without local machine assumptions. |



### 4.6 IB0 Exit Criteria

(i) The repository structure is committed and approved against the PAEP package ownership model.

(ii) A clean installation and full workspace build succeed from a fresh checkout.

(iii) Architecture-boundary, circular-dependency and public-entry-point controls are active and demonstrated by negative tests.

(iv) Baseline CI is operational and retains build/test evidence.

(v) No production feature work depends on ungoverned local code outside the approved workspace/package boundaries.

| IB0 EXIT DECISION<br>IB0 is not complete merely because the reference application runs. It is complete when the workspace can actively reject architecture violations and reproduce a clean build from source. |

| --- |



## 5. IB1 - Product-Neutral Contracts and Runtime Configuration

### 5.1 Objective

IB1 establishes the abstraction boundary between PAEP user experiences and backend/deployment implementations. It preserves ERPNext/Frappe as the strategic system of record while ensuring that reusable UI packages depend on stable PAEP concepts rather than Frappe implementation details.

| ARCHITECTURAL RULE<br>@proseit/paep-contracts is a framework-neutral TypeScript package. It shall not import Angular, browser DOM APIs, Frappe types, visualization-library types or product-specific implementation code. |

| --- |



### 5.2 Contract Package Baseline

Code Block 2. Initial product-neutral contract package structure.

| packages/contracts/src/lib/<br>├── core/<br>├── config/<br>├── identity/<br>├── domain/<br>├── reporting/<br>├── offline/<br>└── public-api.ts |

| --- |



The package defines stable data and capability contracts that can be implemented by adapters. The initial contract families include pagination and common result shapes, structured error contracts, concurrency metadata, money/value types, capability discovery, identity context, file/workflow abstractions, reporting queries and future offline command envelopes.

### 5.3 Core Contract Examples

Code Block 3. Common transport-independent contracts.

| export interface PageResult<T> {<br>  readonly items: readonly T[];<br>  readonly nextCursor?: string;<br>}<br><br>export interface PaepError {<br>  readonly code: string;<br>  readonly messageKey: string;<br>  readonly correlationId?: string;<br>  readonly retryable: boolean;<br>  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;<br>}<br><br>export interface ConcurrencyMetadata {<br>  readonly etag?: string;<br>  readonly serverVersion?: string;<br>} |

| --- |



Code Block 4. Value and capability contracts.

| export interface MoneyValue {<br>  readonly amount: string;<br>  readonly currency: string;<br>}<br><br>export interface Capability {<br>  readonly id: string;<br>  readonly enabled: boolean;<br>} |

| --- |



### 5.4 Reporting Contracts Introduced in IB1

Rich reporting is architecturally prepared in IB1 even though the Power BI-class reporting workspace is implemented later. The browser expresses governed datasets, metrics, dimensions, filters, drill requests and export jobs; it does not receive SQL, analytical-store credentials or unrestricted persistence access.

Code Block 5. Initial reporting contract examples.

| export interface MetricDefinition {<br>  readonly id: string;<br>  readonly labelKey: string;<br>  readonly valueType: 'number' \| 'currency' \| 'percentage' \| 'duration';<br>  readonly aggregation: 'sum' \| 'average' \| 'min' \| 'max' \| 'count' \| 'custom';<br>}<br><br>export interface ReportQuery {<br>  readonly datasetId: string;<br>  readonly metrics: readonly string[];<br>  readonly dimensions: readonly string[];<br>  readonly filters: readonly ReportFilter[];<br>}<br><br>export interface ReportingGateway {<br>  execute(query: ReportQuery): Promise<ReportResult>;<br>  export(request: ExportRequest): Promise<ExportJob>;<br>} |

| --- |



(i) Reporting contracts describe governed datasets, metrics, dimensions, filters, drill context and export intent rather than database implementation details.

(ii) Operational reporting will later resolve through bounded PMRA/product reporting APIs; historical or cross-domain analytics may resolve through an approved reporting service and curated analytical store when justified.

(iii) Power BI or another external BI system may be introduced later through an optional adapter, but no external BI product becomes a mandatory PAEP runtime dependency.

(iv) Tenant, row/field security, metric definitions, aggregation and export authorization remain server-governed.

### 5.5 Runtime Configuration and Safe Bootstrap

Figure 3. Versioned runtime configuration validation and fail-safe bootstrap sequence.

IB1 shall implement a versioned runtime configuration schema and generated validator. Environment-specific public settings are supplied at deployment/runtime where practical so the same approved frontend artifact can move across development, test, SaaS, private-cloud and on-premise profiles without source forks.

| Configuration area | Representative content |

| --- | --- |

| Product | Product ID, display name, release, brand profile and product manifest references. |

| Deployment | Environment, deployment profile, base path and approved public origins. |

| Backend | API base, realtime endpoint, file endpoint and public compatibility metadata. |

| Identity | Authentication mode and non-secret identity-provider metadata. |

| Localisation | Default locale, supported locales, currency/timezone context and RTL activation. |

| Capabilities | Capability discovery mode and UI hints; never authority grants. |

| Telemetry | Enabled state, public endpoint and release/environment identifiers. |

| Analytics | Reporting endpoint, approved reporting mode and optional external-BI provider descriptor. |

| PWA | Offline profile and cache/update policy identifiers. |

| Security | CSP profile, Trusted Types policy identifier and other non-secret client security settings. |



(i) Runtime configuration shall never contain database passwords, private keys, privileged credentials, BI access tokens or server secrets.

(ii) Configuration validation shall occur before protected application composition.

(iii) Invalid or incompatible configuration shall fail closed and present controlled diagnostic information rather than silently falling back to unsafe defaults.

(iv) Validated configuration shall be exposed to the application through an immutable runtime configuration service/store.

(v) Feature flags and edition hints may alter presentation but shall not grant backend authority.

### 5.6 IB1 Work Packages

| Work package | Implementation activity | Required evidence |

| --- | --- | --- |

| IB1-WP1 | Create @proseit/paep-contracts with public entry points and zero Angular/Frappe/DOM dependencies. | Independent package compilation and dependency audit. |

| IB1-WP2 | Implement core, config, identity, domain and reporting contract families. | Contract tests and API review. |

| IB1-WP3 | Create versioned runtime-config.schema.json and representative valid/invalid configuration fixtures. | Schema and fixture set. |

| IB1-WP4 | Generate/implement runtime validator and fail-safe bootstrap path. | Positive and negative startup tests. |

| IB1-WP5 | Introduce compatibility metadata and immutable RuntimeConfigStore boundary. | Compatibility tests; public provider contract. |

| IB1-WP6 | Create contract mocks/test doubles for IB2 and later adapter development. | Reusable test fixtures in tooling/test-utils. |



### 5.7 IB1 Exit Criteria

(i) @proseit/paep-contracts compiles independently with no prohibited framework or backend dependencies.

(ii) Core and reporting contracts are documented through their public entry points and covered by deterministic tests.

(iii) A valid runtime configuration passes schema validation and produces the immutable runtime configuration context.

(iv) Invalid, incomplete or incompatible configuration produces the controlled fail-safe startup state.

(v) No secret-bearing configuration is required by the browser implementation.

(vi) IB2 can use contract mocks and validated configuration without connecting directly to ERPNext/Frappe.

## 6. IB2 - Design Foundation, Core Components and UI Laboratory

### 6.1 Objective

IB2 makes PAEP visibly tangible by implementing the design-system foundation and a deliberately small, high-value component set. The milestone shall prove that consistency, accessibility, responsiveness and state completeness can be delivered once at platform level rather than rediscovered in each product.

### 6.2 Foundation Token Model

(i) Colour tokens shall separate semantic meaning from brand accents so success, warning, error and accessibility states cannot be overridden by product branding.

(ii) Typography tokens shall define a controlled scale, weights, line heights and truncation/wrapping rules.

(iii) Spacing, size, radius, elevation and density tokens shall replace ad-hoc per-screen literals.

(iv) Motion tokens shall be bounded and shall respect reduced-motion preferences.

(v) Breakpoint and layout tokens shall define adaptive behaviour rather than assuming a fixed desktop canvas.

(vi) Focus and state tokens shall ensure keyboard focus and interaction states remain visually consistent and testable.

Code Block 6. Preferred token-driven component styling.

| /* Preferred: semantic platform tokens */<br>.component {<br>  background: var(--paep-color-surface);<br>  color: var(--paep-color-text-primary);<br>  padding: var(--paep-space-3);<br>  border-radius: var(--paep-radius-md);<br>} |

| --- |



Code Block 7. Example of uncontrolled styling that should not become a reusable PAEP pattern.

| /* Prohibited outside controlled foundation code */<br>.component {<br>  background: #ffffff;<br>  padding: 14px;<br>  border-radius: 7px;<br>} |

| --- |



### 6.3 Responsive Interaction Baseline

| Viewport/context | Required interaction posture |

| --- | --- |

| Wide desktop | Full enterprise layout, complete table columns where justified, persistent workspace context and efficient keyboard operation. |

| Tablet / constrained desktop | Priority columns, collapsible navigation, bounded toolbars and touch-safe controls. |

| Mobile / narrow web | Summary cards or drill-down alternatives for wide data; primary actions remain discoverable; no page-wide horizontal scrolling for ordinary workflows. |

| 320 CSS-pixel reflow | Critical content and actions remain usable without loss of information/functionality except for genuinely two-dimensional content with an accessible alternative. |

| Zoom / long translation / RTL | Layout remains usable under zoom/reflow, expanded translated text and activated RTL direction. |



(i) Hover shall never be the only means of exposing an essential action.

(ii) Touch targets and spacing shall remain usable on supported touch devices.

(iii) Data-heavy patterns shall adapt through priority columns, row detail, cards or bounded inner scrolling rather than forcing the entire page to overflow horizontally.

(iv) Navigation shall adapt between expanded sidebar, collapsed navigation and mobile drawer patterns without changing the meaning of routes or permissions.

### 6.4 Initial Reusable Component Set

| Family | Initial components | Mandatory acceptance concerns |

| --- | --- | --- |

| Actions | Button, icon button, action group | Loading/disabled/destructive states, labels, keyboard operation and focus. |

| Forms | Field wrapper, input, select, textarea, checkbox, radio | Labels/help, validation association, read-only/disabled/dirty states and locale-ready input. |

| Data | Table shell, list, pagination, empty state | Loading, empty, populated, filtered-no-results, error, adaptive behaviour and bounded data volume. |

| Feedback | Alert, status badge, progress, skeleton | Non-colour cues, persistent vs transient semantics and screen-reader announcements. |

| Overlay | Dialog, drawer, popover | Accessible name, focus entry/trap/restore, escape behaviour and mobile sizing. |

| Navigation | Tabs, breadcrumb, pagination controls | Current/selected semantics, keyboard order, overflow and narrow-screen behaviour. |

| Structure | Card, panel, divider | Token-only styling, responsive composition and consistent spacing. |



### 6.5 State Completeness Rule

(i) Every reusable screen-level pattern shall define loading, empty, populated and unexpected-error states.

(ii) Where filtering exists, the filtered/no-results state shall be distinguishable from a genuinely empty dataset.

(iii) Form-capable components shall define validation, disabled, read-only and dirty-state behaviour.

(iv) Permission, edition, offline/queued and conflict states shall be supported where the component participates in those flows.

(v) Retry and recovery affordances shall be explicit when an operation can safely be repeated.

Figure 4. IB2 component delivery cycle: implementation is accepted only with documentation and retained quality evidence.

### 6.6 PAEP UI Laboratory

The UI laboratory is a permanent platform application, not a disposable demonstration. Each reusable component shall appear with purpose, variants, states, accessibility notes, responsive behaviour, localisation/RTL considerations and links to retained test evidence. It also serves as clean-room evidence that the design system exists independently of any single product screen.

Code Block 8. Example UI laboratory component specimen structure.

| BUTTON<br>────────────────────────────────<br>Purpose<br>Primary and secondary task actions<br><br>Variants<br>[ Primary ] [ Secondary ] [ Destructive ]<br><br>States<br>Normal \| Disabled \| Loading \| Focus<br><br>Accessibility<br>Keyboard: Enter / Space<br>Focus: visible<br>Name: required<br>Icon-only: aria-label required<br><br>Responsive<br>Desktop ✓   Tablet ✓   320px ✓<br><br>RTL<br>✓<br><br>Evidence<br>Unit ✓   Accessibility ✓   Visual regression ✓ |

| --- |



### 6.7 IB2 Work Packages

| Work package | Implementation activity | Required evidence |

| --- | --- | --- |

| IB2-WP1 | Implement foundation tokens and approved brand/theme override model. | Token catalogue; unit tests; theme regression evidence. |

| IB2-WP2 | Implement responsive layout primitives and 320px/zoom/RTL validation harnesses. | Responsive and localisation evidence. |

| IB2-WP3 | Implement the initial reusable component set using public contracts and semantic tokens only. | Component tests and API review. |

| IB2-WP4 | Create UI laboratory routes/specimen pages for all accepted components and states. | Running UI lab and documentation. |

| IB2-WP5 | Activate accessibility automation, manual keyboard/focus checks and visual-regression baselines. | Automated and manual evidence retained under /evidence. |

| IB2-WP6 | Validate representative components on supported browser/device profiles. | Compatibility and responsive test record. |



### 6.8 IB2 Exit Criteria

(i) Semantic design tokens are versioned, documented and used by all accepted IB2 components.

(ii) The initial component set is available through approved public package entry points with no product-specific business logic.

(iii) Every accepted component demonstrates its required states in the UI laboratory.

(iv) Keyboard, focus, semantics, contrast, responsive behaviour and representative manual accessibility checks pass.

(v) Visual-regression baselines are retained for representative component variants and breakpoints.

(vi) The UI laboratory runs from a clean build and provides sufficient evidence for IB3 to compose the enterprise shell from approved primitives.

| IB2 EXIT DECISION<br>A component is not complete because it looks polished. It is complete when its API, states, responsive behaviour, accessibility, documentation and retained test evidence are all accepted. |

| --- |



## 7. Cross-Milestone Governance and Engineering Controls

### 7.1 Roles and Accountability

| Role | IB0–IB2 accountability |

| --- | --- |

| Solutions Architect | Own architecture conformance, dependency boundaries, exception decisions and milestone architecture acceptance. |

| Main Product Owner | Prioritise milestone outcomes, approve platform acceptance from product/reuse perspective and prevent premature product-specific divergence. |

| Frontend Platform Lead | Own workspace implementation, package APIs, component engineering and developer guidance. |

| Platform Integration Lead | Review contract/adapter boundaries and prepare later Frappe integration without leaking persistence coupling into IB1/IB2. |

| Security & Assurance | Review runtime configuration, browser trust assumptions, dependency posture and negative security tests. |

| Quality / Accessibility Lead | Own accessibility, responsive, regression and UI-lab evidence gates. |

| DevOps / Release Engineering | Own deterministic builds, CI evidence, artefact publication and provenance/SBOM automation where introduced. |



### 7.2 Evidence Retention

(i) IB0 evidence shall retain clean-build logs, architecture-boundary checks, compiler/lint results and baseline CI execution records.

(ii) IB1 evidence shall retain contract tests, dependency audit, runtime schema/fixtures, valid/invalid bootstrap tests and compatibility checks.

(iii) IB2 evidence shall retain token/component tests, accessibility results, responsive/RTL evidence, visual-regression baselines and UI-lab documentation.

(iv) Exceptions shall be linked to an approved ADR and retained with their rationale, owner, scope and sunset/compatibility condition.

(v) Milestone acceptance shall be recorded before the next milestone is treated as the controlled baseline.

### 7.3 Principal Risks and Controls

| Risk | Consequence | Control |

| --- | --- | --- |

| UI work starts before IB0 governance | Architecture drift and duplicate patterns become expensive to reverse. | Block uncontrolled package/screen work until workspace/boundary gates are operational. |

| Contracts leak Frappe/Angular implementation | Reduced portability and difficult testing/replacement of adapters. | Independent contract compilation and forbidden dependency checks. |

| Runtime configuration becomes secret storage | Credential leakage into browser bundles or deployment files. | Schema excludes secrets; security review and fail-safe configuration policy. |

| IB2 becomes a visual theme only | Products still duplicate states, accessibility and behaviour. | Component acceptance includes state completeness, a11y, responsive and test evidence. |

| Too many components built too early | Platform backlog grows before patterns are validated. | Start with small high-value primitive set and expand only through reuse demand. |

| Product branding overrides semantic states | Accessibility/security meaning becomes inconsistent. | Semantic state tokens are non-overridable by product brand profiles. |



## 8. Completion Baseline Before IB3

IB0–IB2 shall leave PAEP with a credible platform kernel, not a complete business application. The following readiness matrix defines what must and must not exist before IB3 begins.

| Capability | Expected state after IB2 |

| --- | --- |

| Governed monorepo | Complete and reproducible. |

| Package dependency rules | Automatically enforced in CI. |

| @proseit/paep-contracts | Compiles independently and exposes reviewed public contracts. |

| Runtime configuration schema | Implemented, versioned and covered by valid/invalid fixtures. |

| Runtime validator / fail-safe bootstrap | Working and test-backed. |

| Reporting contracts | Defined and compiling; no dashboard implementation required yet. |

| Foundation tokens | Implemented and documented. |

| Responsive layout rules | Implemented and represented in UI lab. |

| Initial reusable components | Implemented with required states and evidence. |

| UI laboratory | Running and retained as platform documentation/evidence. |

| Accessibility automation | Operational with manual critical checks. |

| Visual regression | Operational for accepted components. |

| ERPNext/Frappe production adapter | Not required until later integration milestone. |

| Enterprise shell | Not yet; begins in IB3. |

| Power BI-class dashboard workspace | Not yet; later analytics milestone. |

| Offline command queue | Not yet; later offline milestone. |



| PRACTICAL CHECKPOINT<br>A developer receiving the repository after IB2 should be able to run a clean install, build the workspace, launch the UI lab, inspect tokens/components, compile product-neutral contracts, validate runtime configuration and deliberately violate a package boundary to observe CI reject it. |

| --- |



## 9. Handover to IB3

IB3 begins only after the IB0–IB2 kernel is accepted. Its purpose is to compose the first real PAEP enterprise experience from the approved foundations rather than inventing a parallel application structure.

(i) Create the runtime bootstrap in the reference application using the validated immutable RuntimeConfigStore.

(ii) Compose the enterprise shell from approved IB2 primitives: topbar, navigation, tenant/product context, workspace frame, error boundary and offline/status indicators.

(iii) Wire i18n, observability, identity/adapter provider boundaries and route composition without bypassing PAEP contracts.

(iv) Implement public/protected route composition and the first golden workflow scaffold using mocks or approved backend adapters as the integration milestone permits.

(v) Preserve responsive, accessibility, configuration, security and package-boundary evidence as shell capabilities are assembled.

| NEXT CONTROLLED MILESTONE<br>IB3 should not redesign IB0–IB2 foundations. Where a genuine shell requirement exposes a missing foundation capability, the foundation/component package should be extended through its governed public API rather than patched locally inside the reference application. |

| --- |



## Appendix A. Developer Verification Commands

The exact package scripts are established in the repository baseline. The following command names express the minimum verification intent expected from the workspace; teams may map them to the approved orchestration tool without changing the acceptance outcome.

Code Block A1. Expected clean-build and verification command surface.

| npm ci<br>npm run lint<br>npm run typecheck<br>npm run test<br>npm run build<br>npm run test:boundaries<br>npm run test:a11y<br>npm run test:visual |

| --- |



(i) `npm ci` or the approved equivalent shall install from the committed lockfile without manual local fixes.

(ii) Boundary verification shall include at least one negative test proving that a prohibited dependency is rejected.

(iii) Accessibility and visual-regression commands may initially target only the UI laboratory/component scope implemented by IB2.

(iv) Build/test script names may change through tooling governance, but the evidence obligations in this roadmap remain unchanged.

## Appendix B. Milestone Evidence Register

| Milestone | Evidence category | Minimum retained artefact |

| --- | --- | --- |

| IB0 | Workspace | Repository structure and controlled project/package manifest. |

| IB0 | Architecture | Boundary rules, negative violation test and circular-dependency result. |

| IB0 | Build | Clean install, type-check, test and build logs. |

| IB1 | Contracts | Public API review, independent compile and dependency audit. |

| IB1 | Configuration | Schema, valid/invalid fixtures, fail-safe startup tests and compatibility checks. |

| IB1 | Reporting | Initial reporting interfaces and contract tests. |

| IB2 | Foundation | Token catalogue, responsive rules and theme regression evidence. |

| IB2 | Components | Component tests, state specimens and public API documentation. |

| IB2 | Accessibility | Automated results plus retained keyboard/focus/manual evidence for critical components. |

| IB2 | Visual | Approved visual-regression baselines at representative breakpoints. |

| IB2 | Documentation | UI laboratory examples and usage guidance. |

| IB2 | Milestone acceptance | Recorded Product Owner / Solutions Architect acceptance and unresolved-exception register. |



| CONTROLLED COMPLETION RULE<br>No IB0–IB2 milestone shall be declared complete solely from narrative review. Completion requires the implemented artefacts, automated/manual evidence and recorded architecture acceptance defined in this roadmap. |

| --- |


