# Text export of ProSEIT_PAEP_Design-to-Code_Handoff_Standard_v1.0.docx

> Convenience text export for Claude Code. The original controlled document under `../originals/` remains authoritative.

ENGINEERING CONTROL SERIES

ProSEIT PAEP

Design-to-Code Handoff Standard

Controlled UX Design, Claude Design Handoff & Claude Code Production Realisation

| DOCUMENT ID | PROSEIT-STD-PMRA-AF-006-DCH01 | VERSION | 1.0 |

| --- | --- | --- | --- |

| ISSUE DATE | 23 September 2026 | STATUS | Review-ready controlled implementation standard |

| OWNER | Solutions Architect & Main Product Owner | DEVELOPING ORGANISATION | PROSEIT ORGANISATION OF SOFTWARE PROFESSIONALS LTD |

| PARENT ARCHITECTURE | PAEP v1.1 - PROSEIT-STD-PMRA-AF-006 | PARENT EXECUTION PROTOCOL | PAEP-EQP-01 v1.1 |

| PRIMARY DESIGN TOOL | Claude Design under controlled design work orders | IMPLEMENTATION AGENT | Claude Code under repository/CI controls |



| PURPOSE OF THIS COPY: Establishes the mandatory design-to-code control for PAEP design-significant user experiences so visual intent, responsive behaviour, accessibility, states, component mapping and provenance are approved before Claude Code production implementation begins. |

| --- |



## Document Control

| Field | Controlled Value |

| --- | --- |

| Document title | ProSEIT PAEP Design-to-Code Handoff Standard |

| Document ID | PROSEIT-STD-PMRA-AF-006-DCH01 / PAEP-DCH-01 |

| Version | 1.0 |

| Status | Review-ready controlled implementation standard |

| Effective date | Upon Product Owner / Architecture approval |

| Parent architecture | PAEP v1.1 - PROSEIT-STD-PMRA-AF-006 |

| Parent execution protocol | ProSEIT PAEP Claude Engineering Execution & Quality Assurance Protocol v1.1 - PAEP-EQP-01 |

| Implementation baseline | PAEP-IB-01 v1.0 |

| Initial roadmap | PAEP-IR-01 v1.0 |

| Main-text formatting | 12 pt body text; every new enumerated list restarts at lowercase Roman (i) |

| Prompt formatting | Claude Design and Claude Code prompts are visually separated from normative body text |

| Code formatting | Code/configuration snippets are presented in monospace shaded blocks |



### Revision History

| Version | Date | Disposition | Principal Change |

| --- | --- | --- | --- |

| 1.0 | 23 Sep 2026 | Review candidate | Initial controlled design-to-code handoff standard; formalises the PAEP-EQP-01 v1.1 amendment and introduces design classification, design work orders, controlled handoff manifests, implementation conformance and design deviation controls. |



### Approval and Decision Rights

| Decision Domain | Primary Authority | Required Evidence / Review |

| --- | --- | --- |

| PAEP architecture and package/security boundaries | Solutions Architect | PAEP v1.1, ADRs, architecture review |

| Product experience priorities and design acceptance | Main Product Owner | Approved design work package and handoff review |

| Design-system standards and UX consistency | Frontend Platform Council / Quality Lead | Token/component mapping, accessibility and UX evidence |

| Claude Design exploration execution | Design/engineering team operating Claude Design | Design brief, provenance, iterations and controlled export |

| Claude Code production implementation | Engineering team operating Claude Code | Approved handoff, tests, QA logs and conformance evidence |

| Security/privacy acceptance | Security and Assurance Authority / authorised reviewer | Threat model contribution, negative tests, sensitive-data review |

| Release acceptance | Solutions Architect + Main Product Owner | Implementation QA, UAT, deviations, compatibility and release evidence |



## Contents

| PART I — FOUNDATION AND CONTROL POSITION | Section 17 — Design Review and Approval Gate |

| --- | --- |

| Section 1 — Purpose, Scope and Status | Section 18 — Claude Code Implementation Contract |

| Section 2 — Normative Relationship and Source Hierarchy | Section 19 — Design Deviation and Change Control |

| Section 3 — Design-to-Code Principles | Section 20 — Quality Assurance and Fix-Until-Pass |

| Section 4 — Roles and Decision Rights | Section 21 — Visual Conformance and Regression Evidence |

| Section 5 — Work Classification and Handoff Trigger | Section 22 — Evidence Repository and Traceability |

| PART II — DESIGN WORK PACKAGE | PART V — PROVENANCE, STATUS AND ADOPTION |

| Section 6 — Design Brief and Design Work Order | Section 23 — Clean-Room Provenance and Licensing |

| Section 7 — Claude Design Execution Controls | Section 24 — Handoff Status Model |

| Section 8 — Required Design Artifacts | Section 25 — Adoption and Evolution |

| Section 9 — Controlled Handoff Bundle | Section 26 — Initial Application to IB2-IB4 |

| Section 10 — PAEP Component and Token Mapping | Appendix A — Design Work Package Template |

| PART III — UX, QUALITY AND SPECIAL PROFILES | Appendix B — Handoff Manifest Example |

| Section 11 — Responsive and Adaptive Design | Appendix C — Claude Design Prompt Template |

| Section 12 — Accessibility and Usability Intent | Appendix D — Claude Code Implementation Prompt Template |

| Section 13 — Security, Privacy and Trust Constraints | Appendix E — Acceptance Checklist |

| Section 14 — Reporting and Analytics Design Profile | Appendix F — Design Deviation Record |

| Section 15 — Offline/PWA and Conflict Design Profile | Appendix G — Validation Matrix |

| Section 16 — Internationalisation and RTL | Appendix H — References |

| PART IV — REVIEW, IMPLEMENTATION AND ACCEPTANCE | Approval and Activation Record |



| PART I — FOUNDATION AND CONTROL POSITION |

| --- |



## Section 1 — Purpose, Scope and Status

This Standard defines how PAEP design-significant user experiences move from requirements and design exploration into production Angular implementation. It introduces an explicit design approval and handoff boundary so Claude Design, Claude Code and human reviewers operate within clear responsibilities. The Standard does not alter PAEP architecture; it operationalises the design-to-code amendment in PAEP-EQP-01 v1.1.

### 1.1 Purpose

(i)  preserve a traceable chain from user task and requirement through approved design intent to production implementation and acceptance;

(ii)  ensure Claude Design explores experiences using the PAEP design system without acquiring architecture, security, backend or release authority;

(iii)  ensure Claude Code implements approved experiences using PAEP components, tokens, contracts and repository controls rather than copying prototype code as production code;

(iv)  make responsive behaviour, accessibility intent, states, content, data assumptions and deviations explicit before implementation;

(v)  require fix-until-pass conformance evidence where implementation differs from the approved design intent; and

(vi)  preserve clean-room provenance and repeatable handoff evidence for later maintenance, procurement diligence and product adoption.

### 1.2 Scope

The Standard applies to enterprise shell screens, dashboards, reporting workspaces, data-heavy operational screens, mobile/field workflows, offline conflict experiences, AI/agent workspaces, new navigation/information-architecture patterns, new cross-product interaction patterns, and other PAEP work classified as design-significant. It also defines a lighter path for design extensions and a direct-code path for bounded maintenance that introduces no new experience decision.

### 1.3 Non-goals

(i)  This Standard does not replace PAEP v1.1, PAEP-IB-01, ADRs, backend domain specifications or the Claude Engineering Execution & Quality Assurance Protocol.

(ii)  This Standard does not authorise Claude Design to decide package boundaries, persistence models, authentication, tenant isolation, entitlements, fiscal logic, reporting data authority or deployment security.

(iii)  This Standard does not require every primitive component change to use Claude Design.

(iv)  This Standard does not require literal pixel equality where PAEP responsiveness, accessibility, content expansion or browser rendering requires adaptive implementation.

## Section 2 — Normative Relationship and Source Hierarchy

Where design intent conflicts with a higher architectural or quality control, the higher control prevails. The design shall be revised or a governed exception shall be raised; Claude Code shall not implement the conflict silently.

(i)  PAEP v1.1 governs platform architecture, design foundations, reusable component architecture, security, accessibility, reporting, portability and release controls.

(ii)  PAEP-IB-01 governs concrete repository, package, contract, runtime-configuration and implementation boundaries.

(iii)  PAEP-EQP-01 v1.1 governs Claude execution, fix-until-pass QA, traceability, evidence and acceptance.

(iv)  Approved ADRs and product/workflow specifications govern authorised decisions within their scope.

(v)  This Standard governs design classification, design work orders, handoff artifacts, design approval, implementation conformance and design deviations.

(vi)  The current bounded work-package prompt may narrow scope but may not relax any higher control.

| CONFLICT RULE: A design cannot override PAEP architecture. When the approved visual/interaction concept requires an architectural change, the design work package becomes BLOCKED until an ADR or architecture decision resolves the issue. |

| --- |



## Section 3 — Design-to-Code Principles

(i)  Design intent before production code — significant new experiences are reviewed before Claude Code commits production implementation.

(ii)  PAEP vocabulary first — design uses approved tokens, components and enterprise patterns before introducing new primitives.

(iii)  States are part of the design — loading, empty, validation, permission, edition, error, offline/conflict and recovery states are designed when applicable.

(iv)  Adaptive rather than desktop-shrunk — narrow-screen behaviour is explicitly designed rather than inferred from a desktop canvas.

(v)  Accessible by design — keyboard/focus, semantics, contrast, error recovery and alternative representations are considered before code.

(vi)  Backend authority remains intact — designs may present access, workflow and reporting state but may not imply client-side authority.

(vii)  Prototype code is non-authoritative — exported HTML/CSS/JavaScript may demonstrate intent but does not define PAEP production structure.

(viii)  Deviations are visible — material implementation departures are recorded, reviewed and either corrected or accepted through controlled change.

(ix)  Clean-room provenance is retained — design prompts and artifacts avoid copied proprietary source/assets or distinctive implementation replication.

Figure 1. Controlled PAEP design-to-code flow.

## Section 4 — Roles and Decision Rights

| Role | Primary Responsibility | May Not |

| --- | --- | --- |

| Main Product Owner | Prioritises user/business outcomes; accepts significant experience intent and product release | Override security/architecture controls without governed decision |

| Solutions Architect | Protects PAEP architecture, package/trust boundaries and exceptions | Delegate architecture authority to design tooling |

| Frontend Platform Council / Quality Lead | Maintains design-system coherence, UX/a11y standards and design review evidence | Treat visual preference as authority to weaken mandatory quality gates |

| Claude Design | Explores wireframes, mockups, prototypes, responsive variants and design intent within the brief | Define backend authority, package structure, security policy or release approval |

| Claude Code | Implements approved intent in Angular/PAEP and runs required QA | Silently redesign approved interactions or copy prototype code around PAEP controls |

| Security / Assurance Reviewer | Reviews sensitive data, authentication, tenant and trust implications | Use client-side concealment as an authorization control |

| Representative users / UAT participants | Validate task clarity, efficiency and usability where required | Approve architecture exceptions |



## Section 5 — Work Classification and Handoff Trigger

Every UI work package shall be classified before implementation. Classification determines whether Claude Design and a controlled handoff are mandatory.

| Class | Typical Work | Required Route |

| --- | --- | --- |

| D1 — Design Significant | New enterprise shell pattern; executive/reporting workspace; complex data-heavy workflow; mobile field workflow; offline conflict resolution; AI/agent workspace; new navigation/IA; new cross-product interaction pattern | Full Design Work Package → Claude Design → design review → approved handoff → Claude Code |

| D2 — Design Extension | New screen composed primarily from approved PAEP patterns but with a new task arrangement, responsive composition or domain presentation | Light Design Work Package → annotated design/variants → review → Claude Code |

| D3 — Direct-Code Maintenance | Defect fix; token correction; accessibility correction; refactor with unchanged UX; already-approved component variant with no new interaction decision | Claude Code may implement directly under PAEP-EQP-01; visual regression and affected tests remain mandatory |



### 5.1 Escalation rule

(i)  A D3 task becomes D2 or D1 if implementation discovers a new user-flow, layout, interaction, responsive or component-design decision.

(ii)  A D2 task becomes D1 if it introduces a new reusable pattern, new shell/reporting behaviour, material accessibility trade-off or multi-state workflow.

(iii)  Claude Code shall stop and request reclassification when a work package cannot be completed without making an unapproved design decision.

| PART II — DESIGN WORK PACKAGE |

| --- |



## Section 6 — Design Brief and Design Work Order

A Design Work Package (DWP) is the controlled input to Claude Design. It should be concise enough to guide exploration while specific enough to prevent arbitrary visual invention.

### 6.1 Required DWP fields

| Field | Required Content |

| --- | --- |

| DWP ID / version | Unique identifier and controlled version |

| Related requirement IDs | Functional, quality, accessibility, security and reporting requirements |

| User / primary task | Who performs the task and the outcome they need |

| Context | Product, tenant/project/site context and navigation location |

| Screen/workflow IDs | Stable identifiers for each screen or flow step |

| PAEP design-system baseline | Token/component version to use |

| Viewport profiles | Desktop, tablet and narrow/mobile profiles required |

| Required states | Loading, empty, populated, validation, permission, edition, error, offline/conflict, recovery as applicable |

| Data assumptions | Read-only description of required data and freshness; no database schema authority |

| Accessibility intent | Keyboard flow, focus, semantics, announcements, non-colour cues, alternative representation |

| Content/i18n | Message keys, long-text expectation, locale/RTL applicability |

| Acceptance criteria | Objective design-review criteria and known constraints |



### 6.2 Design brief quality rule

(i)  State the user task and business outcome before describing visual composition.

(ii)  Reference existing PAEP patterns and components when known.

(iii)  Do not request arbitrary third-party template imitation or direct reproduction of proprietary screens.

(iv)  Identify unavailable decisions as open questions instead of prompting Claude Design to invent architecture or business rules.

(v)  Separate mandatory requirements from exploratory preferences.

## Section 7 — Claude Design Execution Controls

Claude Design is used to explore and communicate experience intent. Anthropic supports team design systems, interactive prototypes and handoff bundles to Claude Code; PAEP uses those capabilities as design tooling while retaining its own controlled manifest and approval evidence.

(i)  Load or reference the accepted PAEP design-system baseline where the Claude Design environment supports it.

(ii)  Use the approved DWP as the primary brief; do not broaden the workflow without recording the new scope.

(iii)  Explore alternatives where useful, but identify the selected candidate explicitly before handoff.

(iv)  Produce required viewport variants and required operational states, not only the populated desktop state.

(v)  Use domain-realistic sample content that does not expose confidential production data.

(vi)  Keep generated prototype logic non-authoritative; security, domain validation and workflow permission decisions remain represented as assumptions or backend-provided state.

(vii)  Retain the prompt/brief version and a provenance reference for the final selected design.

(viii)  Export or package the final design in a form Claude Code can inspect, while also creating the PAEP handoff manifest defined in Section 9.

| CLAUDE DESIGN — CONTROLLED DESIGN WORK ORDER<br>You are designing a PAEP user experience under ProSEIT architecture governance.<br>Use the attached DWP and the accepted PAEP design system as the controlling design inputs.<br>Do not create or change backend authority, package boundaries, authentication, tenant rules, entitlements, fiscal logic or reporting data authority.<br>Produce the required viewport variants and all required states. Reuse PAEP components/tokens where available and identify any genuinely missing reusable pattern.<br>Record open questions instead of inventing unsupported business or architecture rules. Prepare the selected design for controlled handoff using the PAEP handoff manifest. |

| --- |



## Section 8 — Required Design Artifacts

(i)  Screen/workflow inventory with stable screen IDs and version.

(ii)  Desktop, tablet and narrow/mobile variants where required by the DWP.

(iii)  Annotated information hierarchy and primary/secondary actions.

(iv)  All required UI states and transitions applicable to the workflow.

(v)  PAEP component mapping and any proposed new component/pattern.

(vi)  Responsive adaptation rules, including data-table and complex-visual behaviour.

(vii)  Keyboard/focus and accessibility intent for complex interactions.

(viii)  Content/message-key inventory, including empty/error/permission messages and localisation considerations.

(ix)  Data-assumption notes that identify information needed without prescribing database or private transport structures.

(x)  Asset inventory with ownership/provenance and alternative text intent where applicable.

(xi)  Open questions, rejected alternatives where materially relevant, and approval record.

## Section 9 — Controlled Handoff Bundle

The handoff bundle is the controlled bridge between design and implementation. A native Claude Design handoff bundle may be included, but the PAEP handoff manifest is the authoritative inventory of what was approved and what Claude Code must implement.

Figure 2. Mandatory content surrounding the PAEP handoff manifest.

### 9.1 Minimum bundle structure

| REFERENCE FOLDER STRUCTURE<br>handoff/HOF-IB3-001/<br>├── handoff.manifest.yaml<br>├── design-brief.md<br>├── screens/<br>│   ├── SCR-SHELL-001-desktop.png<br>│   ├── SCR-SHELL-001-tablet.png<br>│   └── SCR-SHELL-001-mobile.png<br>├── prototype/                 # optional design reference<br>├── interaction-notes.md<br>├── component-map.md<br>├── accessibility-intent.md<br>├── content-keys.md<br>├── assets/<br>├── provenance.md<br>├── approvals.md<br>└── deviations/                # empty at initial approval |

| --- |



### 9.2 Bundle integrity

(i)  The manifest shall identify every screen/flow artifact by ID and version.

(ii)  The implementation work package shall reference the exact approved handoff version.

(iii)  Changes after approval shall increment the handoff version or create an approved deviation record.

(iv)  Assets without clear ownership/provenance shall not move into production implementation.

(v)  Prototype HTML, CSS or JavaScript is reference material unless separately reviewed and accepted as PAEP-conforming production code.

## Section 10 — PAEP Component and Token Mapping

The design handoff shall map visible/interactive elements to existing PAEP primitives wherever practical. This prevents each product screen from becoming a local design system.

| Design Element | Preferred Production Mapping | Control |

| --- | --- | --- |

| Typography | PAEP semantic type tokens | No ad-hoc per-screen type scale |

| Spacing/layout | PAEP spacing/layout tokens and approved grid/container patterns | Avoid raw values where semantic token exists |

| Actions | PAEP button/action components | All focus/loading/destructive states preserved |

| Forms | PAEP form controls/field wrapper | Labels, errors, locale formats, read-only/dirty states |

| Tables/data views | PAEP table/data patterns + server paging/virtualisation rules | Explicit narrow-screen strategy |

| Overlays | PAEP dialog/drawer/popover | Focus trap/restore, escape and mobile sizing |

| Feedback | PAEP alert/toast/progress/status patterns | Persistent vs transient semantics maintained |

| Reporting visuals | PAEP analytics abstraction | No vendor chart object in public contracts |



### 10.1 Missing pattern rule

(i)  If the design requires a pattern not available in PAEP, the handoff shall mark it as PROPOSED NEW PATTERN rather than silently styling a local component.

(ii)  A proposed reusable pattern requires design-system review before it is treated as a shared PAEP primitive.

(iii)  Product-specific composition may remain product-owned when reuse is not established.

| PART III — UX, QUALITY AND SPECIAL PROFILES |

| --- |



## Section 11 — Responsive and Adaptive Design

(i)  Design intent shall preserve task, context and meaning across approved viewport profiles rather than merely scaling dimensions.

(ii)  Critical content shall remain usable at the PAEP controlled narrow viewport target; exceptions require an accessible alternative for inherently two-dimensional content.

(iii)  Enterprise tables shall specify a narrow-screen approach such as priority columns, summary cards, drill-down detail or bounded internal scrolling.

(iv)  Primary actions shall remain discoverable without whole-page horizontal scrolling.

(v)  Hover-only affordances are prohibited for essential functionality.

(vi)  Long translated labels, browser zoom and touch target requirements shall be represented in the design or its acceptance notes.

## Section 12 — Accessibility and Usability Intent

(i)  Complex interactions shall identify expected keyboard sequence and focus entry/restoration behaviour.

(ii)  Dialogs, drawers, menus, grids and command interfaces shall identify accessible names, roles, status/error announcement intent and escape/recovery behaviour.

(iii)  Design shall not use colour alone to communicate status, selection, validation or risk.

(iv)  Forms shall show label/help/error relationships and error-recovery intent.

(v)  Critical workflows shall include representative-user validation before release where PAEP-EQP-01 requires it.

(vi)  Charts and complex visuals shall identify an accessible summary or tabular alternative where visual encoding alone would prevent equivalent access.

## Section 13 — Security, Privacy and Trust Constraints

(i)  Designs may hide or disable unavailable actions for usability, but shall not imply that client-side hiding is the authorization control.

(ii)  Designs shall not display secrets, private storage paths, privileged tokens or sensitive payloads merely because they are convenient for a prototype.

(iii)  Impersonation/support mode, tenant context, offline/sync state and other high-risk context shall be visibly distinguishable where applicable.

(iv)  File preview/upload designs shall assume server authorization, validation and scanning.

(v)  Analytics and reporting designs shall assume server-authoritative datasets, metrics, tenant filters and export authorization.

(vi)  Cached/offline sensitive information shall be minimised and its lifecycle governed by the security/offline profile rather than visual design convenience.

## Section 14 — Reporting and Analytics Design Profile

Power BI-class interaction goals are supported through PAEP analytics contracts and governed reporting services. Design intent may be rich, but it shall preserve metric governance, tenant isolation, performance and accessible alternatives.

(i)  Identify dataset/report context, freshness, filters, metrics, dimensions and permitted drill paths without exposing SQL or database structures.

(ii)  Design KPI cards, cross-filtering, drill-down/drill-through, saved views, table/pivot experiences and export job status as governed interactions.

(iii)  Provide loading, no-data, partial-data, permission, failed-query and stale/freshness states.

(iv)  For dense visualisations, specify responsive simplification or alternative views rather than forcing desktop dashboards onto narrow screens.

(v)  Provide accessible labels/summaries and a tabular representation where required.

(vi)  Keep any visualization-vendor-specific configuration inside implementation adapters rather than the handoff contract.

## Section 15 — Offline/PWA and Conflict Design Profile

(i)  Design shall distinguish online/current, local draft, queued, synced, conflict and failed states where the workflow is offline-enabled.

(ii)  Queued and local-only work shall not be visually indistinguishable from server-accepted state.

(iii)  Conflict resolution shall make both attempted local change and authoritative server state understandable to the user.

(iv)  Logout, tenant switch, device handover and service-worker update scenarios shall expose unsynchronised-work risk when applicable.

(v)  Offline presentation does not grant permission to bypass backend rules; the design should communicate deferred validation where relevant.

## Section 16 — Internationalisation and RTL

(i)  Design artifacts shall use externalisable content/message keys for reusable UI rather than embedding production strings as structural assumptions.

(ii)  Layouts shall tolerate language expansion and explicit business date/number/currency contexts.

(iii)  Activated RTL profiles shall verify layout direction, directional icons, form flow, table behaviour and mixed-direction content.

(iv)  Long-text variants should be included for screens where clipping or layout collapse is a material risk.

| PART IV — REVIEW, IMPLEMENTATION AND ACCEPTANCE |

| --- |



## Section 17 — Design Review and Approval Gate

A D1 handoff is not Ready for Claude Code until the design review records PASS or an approved exception for every applicable gate.

| Gate | Minimum Evidence | Outcome |

| --- | --- | --- |

| Requirement coverage | Every screen/state traces to DWP requirement IDs | PASS / FAIL |

| PAEP design-system conformity | Component/token map; proposed new patterns isolated | PASS / FAIL |

| Responsive intent | Required viewport variants and adaptation rules | PASS / FAIL |

| Accessibility intent | Keyboard/focus/error/status/alternative representation notes | PASS / FAIL |

| Security/trust | No client-authority, secret, tenant or data-boundary conflict | PASS / FAIL |

| State completeness | Required loading/empty/error/permission/offline/conflict/recovery states | PASS / FAIL |

| Content/i18n | Content keys and long-text/RTL applicability recorded | PASS / FAIL |

| Provenance | Prompts/source references/assets/ownership recorded | PASS / FAIL |

| Open decisions | No unresolved decision required for production implementation | PASS / BLOCKED |



### 17.1 Design approval statuses

(i)  DRAFT — design exploration is in progress and not implementable as a controlled baseline.

(ii)  REVIEW — candidate design is under review; Claude Code may prepare technical analysis but shall not treat it as approved production intent.

(iii)  APPROVED FOR IMPLEMENTATION — required design gates pass and exact handoff version is recorded.

(iv)  BLOCKED — unresolved architecture, security, product or design decision prevents implementation.

(v)  SUPERSEDED — a later controlled handoff version replaces the design.

## Section 18 — Claude Code Implementation Contract

Claude Code receives the approved handoff as an implementation input, not as authority to bypass PAEP architecture. Production code shall be reconstructed using PAEP packages, semantic tokens, Angular engineering rules and controlled contracts.

(i)  Read the approved HOF manifest, DWP, relevant PAEP source-of-truth sections and existing tests before editing.

(ii)  Map each approved screen element and interaction to PAEP components/tokens or record a proposed/missing pattern.

(iii)  Implement required states and viewport behaviours, not only the default populated desktop screenshot.

(iv)  Do not copy prototype code wholesale when it violates Angular package structure, accessibility, security, state-management or token rules.

(v)  Run all mandatory architecture, type, unit/component, accessibility, visual, responsive, security and performance gates applicable to the work package.

(vi)  Generate a Design Conformance Report that identifies matched intent, justified technical adaptations and any design deviations.

(vii)  Stop and escalate when implementation requires a design, architecture or product decision absent from the approved handoff.

| CLAUDE CODE — CONTROLLED DESIGN IMPLEMENTATION<br>Implement the attached approved PAEP handoff package exactly within the controlling PAEP architecture and repository rules.<br>The design defines approved experience intent; it does not override package boundaries, backend authority, security, accessibility, contracts or runtime configuration controls.<br>Reuse PAEP components and semantic tokens. Treat prototype HTML/CSS/JavaScript as design reference only unless separately approved as production-conforming code.<br>Implement all required states and responsive variants. If a requirement is ambiguous or cannot be implemented without a new design/architecture decision, stop and report BLOCKED.<br>Run the specified QA commands, repair failures without weakening the criteria, rerun affected regression gates, and produce the Design Conformance Report and retained evidence. |

| --- |



## Section 19 — Design Deviation and Change Control

### 19.1 What counts as a material deviation

(i)  change to information hierarchy, primary task path or action priority;

(ii)  change to responsive adaptation that affects task completion or context;

(iii)  new component/pattern not identified in the approved handoff;

(iv)  removal or substantial alteration of a required state;

(v)  change to accessibility/focus/keyboard behaviour;

(vi)  change to content/terminology with business meaning;

(vii)  change that exposes or conceals data, permissions, tenant context or sync/freshness information; or

(viii)  implementation choice that changes approved analytics, drill, filter or export interaction.

### 19.2 Deviation procedure

(i)  Record a Design Deviation Record (DDR) with the handoff and screen IDs.

(ii)  State the reason, user impact, architecture/quality impact and proposed treatment.

(iii)  Classify the deviation as correction-required, design-update-required or acceptable adaptation.

(iv)  Obtain the applicable design/product/architecture decision before marking the deviation resolved.

(v)  Update the approved design/handoff version when the accepted deviation changes the baseline intent.

## Section 20 — Quality Assurance and Fix-Until-Pass

Figure 3. Design conformance uses the same mandatory fix-until-pass discipline as PAEP engineering QA.

(i)  Every mandatory acceptance criterion uses PASS/FAIL/BLOCKED, not “mostly complete”.

(ii)  When a criterion fails, Claude Code shall diagnose and fix the root cause without weakening the test or silently changing the design baseline.

(iii)  After a fix, rerun the failed gate and all affected regression gates.

(iv)  Visual differences caused by approved responsive/accessibility adaptation are assessed against design intent and recorded, not automatically treated as defects.

(v)  Final acceptance requires both executable QA evidence and required human design/product review.

## Section 21 — Visual Conformance and Regression Evidence

(i)  Capture representative screenshots for the approved viewport profiles and material states.

(ii)  Compare hierarchy, component identity, semantic token use, spacing/rhythm, content, state behaviour and responsive adaptation against the approved handoff.

(iii)  Use visual-regression tooling for stable component/shell baselines; approve intentional changes explicitly.

(iv)  Do not use pixel equality as the sole acceptance criterion because font rendering, browser differences, localisation and responsive adaptation may create legitimate variation.

(v)  Where design intent cannot be represented by screenshot comparison alone, retain interaction/video/test evidence as appropriate.

## Section 22 — Evidence Repository and Traceability

| CONTROLLED EVIDENCE STRUCTURE<br>evidence/design-handoff/HOF-IB3-001/<br>├── dwp/<br>├── design-export/<br>├── handoff.manifest.yaml<br>├── design-review/<br>├── implementation/<br>├── qa/<br>│   ├── a11y/<br>│   ├── visual/<br>│   ├── responsive/<br>│   ├── security/<br>│   └── performance/<br>├── deviations/<br>├── conformance-report.md<br>└── acceptance.md |

| --- |



(i)  Every handoff package shall trace to requirement IDs and implementation work-package IDs.

(ii)  Every implementation acceptance report shall identify the exact handoff version used.

(iii)  Deviation records shall be linked both to the design and to the implementing commit/work package.

(iv)  Final release evidence shall preserve the accepted design baseline and implementation conformance record for critical workflows.

| PART V — PROVENANCE, STATUS AND ADOPTION |

| --- |



## Section 23 — Clean-Room Provenance and Licensing

(i)  Design briefs and prompts shall describe capabilities, tasks and PAEP-specific product intent rather than request replication of proprietary commercial-template screens.

(ii)  Proprietary template source, theme files, assets or distinctive implementation artifacts shall not be inserted into PAEP design or handoff bundles.

(iii)  Approved open-source or licensed design assets shall retain source, licence and approval evidence.

(iv)  Claude Design-generated assets/code shall be reviewed before adoption and linked to the design provenance record.

(v)  External inspiration may inform capabilities and interaction requirements, but the final PAEP design rationale shall demonstrate independent composition and implementation.

## Section 24 — Handoff Status Model

| Status | Meaning | Implementation Effect |

| --- | --- | --- |

| DRAFT | Design or handoff incomplete | Claude Code shall not treat as approved intent |

| REVIEW | Candidate awaiting controlled review | Technical feasibility analysis allowed; production implementation not accepted |

| APPROVED FOR IMPLEMENTATION | Design gates passed and version fixed | Claude Code may implement under referenced work package |

| IMPLEMENTED | Production implementation exists but QA/acceptance may remain | Not equivalent to accepted |

| PASS | Automated/manual conformance gates pass | Ready for required human acceptance |

| ACCEPTED | Authorised reviewer records acceptance | Controlled baseline may be used/released |

| BLOCKED | Decision/evidence missing | Stop affected implementation |

| SUPERSEDED | Replaced by newer approved version | Do not use for new work |



## Section 25 — Adoption and Evolution

(i)  Adopt this Standard first for IB3 enterprise shell, reporting workspace and other D1 experiences after the initial IB2 design-system kernel is accepted.

(ii)  Onboard Claude Design to the accepted PAEP design system rather than a provisional or untested token/component set.

(iii)  Use the first handoff packages to refine the manifest and evidence templates without weakening mandatory fields.

(iv)  Promote repeated product-specific patterns into shared PAEP components/domain kits only after reuse and governance criteria are met.

(v)  Version the Standard when handoff tooling or PAEP architecture changes materially; tooling convenience shall not silently change the controlled artifacts.

## Section 26 — Initial Application to IB2-IB4

| Milestone | Design-to-Code Application | Exit Evidence |

| --- | --- | --- |

| IB2 — Foundation/Core Components | Use Claude Code directly for bounded primitives; use design review for new foundational visual/interaction patterns. Establish PAEP design-system source for Claude Design after acceptance. | Token/component tests, UI-lab examples, visual/a11y evidence, accepted design-system baseline |

| IB3 — Enterprise Shell | D1 mandatory: Claude Design explores shell/navigation/workspace responsive states; approved HOF required before production shell implementation. | Approved shell handoff + Claude Code conformance + QA |

| IB4 — Integration experiences | Use D1/D2 for login/session expiry, permission, file, workflow, realtime and error experiences where new interaction intent is required. Backend contracts remain independent. | Approved interaction handoffs where applicable + integration/security evidence |



## Appendix A — Design Work Package Template

| DWP TEMPLATE<br>DWP ID: DWP-IB3-001<br>Version: 1.0<br>Work class: D1 — Design Significant<br>Related requirements: [REQ-...]<br>Primary user/task: [...]<br>Product/context: [...]<br>Screen/workflow IDs: [SCR-...]<br>PAEP design-system baseline: [...]<br>Required viewports: [desktop, tablet, narrow-mobile]<br>Required states: [loading, empty, populated, error, permission, offline...]<br>Accessibility intent: [...]<br>Data assumptions: [...]<br>Content/i18n: [...]<br>Acceptance criteria: [DAC-...]<br>Open questions: [...] |

| --- |



## Appendix B — Handoff Manifest Example

| YAML MANIFEST EXAMPLE<br>handoffId: HOF-IB3-001<br>version: 1.0<br>status: APPROVED_FOR_IMPLEMENTATION<br>dwpId: DWP-IB3-001<br>requirements:<br>  - REQ-SHELL-001<br>screens:<br>  - id: SCR-SHELL-001<br>    viewports: [desktop, tablet, narrow-mobile]<br>    states: [default, loading, permission, offline]<br>componentMap:<br>  - designElement: primaryNavigation<br>    paepTarget: '@proseit/paep-enterprise/navigation'<br>accessibility:<br>  keyboardFlow: 'see accessibility-intent.md'<br>assets:<br>  - id: ASSET-LOGO-001<br>    provenance: approved-brand-asset<br>designApproval:<br>  approvedBy: '[name/role]'<br>  approvedDate: '[date]'<br>openDecisions: [] |

| --- |



## Appendix C — Claude Design Prompt Template

| CLAUDE DESIGN — TEMPLATE<br>Context: You are creating design intent for [DWP ID] under PAEP v1.1 and PAEP-DCH-01.<br>Objective: Design [screen/workflow] for [user/task].<br>Use: [PAEP design-system baseline], [requirements], [content/data assumptions].<br>Required outputs: [viewports], [states], component mapping, interaction notes, accessibility intent and open questions.<br>Constraints: do not redefine architecture/security/backend authority; do not replicate proprietary template implementations; use PAEP components/tokens first.<br>Before handoff: verify the design-review checklist and package the selected design with a PAEP handoff manifest. |

| --- |



## Appendix D — Claude Code Implementation Prompt Template

| CLAUDE CODE — TEMPLATE<br>Context: Implement [work-package ID] from approved handoff [HOF ID/version] under PAEP v1.1, PAEP-IB-01, PAEP-EQP-01 v1.1 and PAEP-DCH-01.<br>Permitted change boundary: [packages/directories].<br>Implementation: map approved design elements to PAEP components/tokens; implement all required states/viewports and accessibility behaviour.<br>Prohibitions: do not copy prototype code around PAEP architecture; do not create unapproved design decisions; do not weaken tests or security/accessibility controls.<br>QA: run [commands]. Repair until every mandatory criterion passes. Retain screenshots/logs and the Design Conformance Report.<br>Stop condition: report BLOCKED if the handoff conflicts with architecture or lacks a material design/product decision. |

| --- |



## Appendix E — Acceptance Checklist

| Check | Acceptance Question |

| --- | --- |

| Traceability | Does the handoff identify DWP, requirements, screen IDs and exact version? |

| Design-system conformity | Are approved PAEP tokens/components mapped and proposed new patterns isolated? |

| States | Are all applicable loading/empty/validation/permission/edition/error/offline/conflict/recovery states defined? |

| Responsive | Are required viewport variants and adaptation rules explicit? |

| Accessibility | Are keyboard/focus/semantics/error/status/alternative representations defined where applicable? |

| Security/trust | Does design avoid client-only authority, secrets, private paths and unsafe data assumptions? |

| Content/i18n | Are content keys, long-text and RTL/locale considerations represented? |

| Reporting/offline special profile | Are applicable rich-reporting or sync/conflict controls satisfied? |

| Provenance | Are prompts, assets, source references and approvals retained? |

| Implementation conformance | Does production code use PAEP architecture and match approved intent? |

| Deviations | Are all material deviations recorded and resolved? |

| Evidence | Do automated/manual QA and acceptance records exist? |



## Appendix F — Design Deviation Record

| DESIGN DEVIATION RECORD<br>DDR ID: DDR-HOF-IB3-001-01<br>Handoff: HOF-IB3-001 v1.0<br>Screen/flow: SCR-SHELL-001<br>Detected during: implementation \| QA \| review<br>Description: [...]<br>Reason: technical constraint \| accessibility \| responsive adaptation \| design change \| defect correction<br>User impact: [...]<br>Architecture/security impact: [...]<br>Proposed treatment: correct implementation \| update design \| accept adaptation<br>Decision authority: [...]<br>Decision: APPROVED \| REJECTED \| BLOCKED<br>Resulting handoff version: [...] |

| --- |



## Appendix G — Validation Matrix

This Standard was proofed against the controlled PAEP corpus before issue. The matrix records the principal conflict checks performed.

| Validation Area | Checked Against | Result |

| --- | --- | --- |

| Architecture authority | PAEP v1.1 Sections 3-5, 10-12, 17 | Conforms: design tooling receives no architecture/security authority |

| Design-system/component model | PAEP v1.1 Sections 6-8 and PAEP-IB-01 Sections 12, 17 | Conforms: token/component mapping and ui-lab baseline preserved |

| Claude execution model | PAEP-EQP-01 v1.1 | Conforms: bounded prompts, DoR/DoD, fix-until-pass and evidence retained |

| Reporting | PAEP v1.1 Section 27 and PAEP-IB-01 Sections 15-16 | Conforms: design uses governed datasets/metrics; no SQL/vendor public contract |

| Offline/PWA | PAEP v1.1 Section 14 | Conforms: explicit local/queued/synced/conflict/failed meaning preserved |

| Security/backend authority | PAEP v1.1 Sections 11 and 17 | Conforms: server authority preserved; client presentation is not authorization |

| Responsive/accessibility | PAEP v1.1 Sections 6.2, 16 and implementation baseline Section 12 | Conforms: adaptive viewports, 320px intent, keyboard/focus and alternative representations required |

| Clean-room provenance | PAEP v1.1 Section 19 and PAEP-EQP-01 Section 22 | Conforms: proprietary-source copying prohibited; generated design/code evidence retained |

| Anthropic tooling capability | Anthropic, Introducing Claude Design, 17 Apr 2026 | Consistent: Claude Design supports team design systems, prototypes and handoff bundles to Claude Code; PAEP remains tool-independent at the control-record level |



## Appendix H — References

(i)  ProSEIT Organisation of Software Professionals Ltd, ProSEIT Angular Experience Platform (PAEP) v1.1, PROSEIT-STD-PMRA-AF-006.

(ii)  ProSEIT Organisation of Software Professionals Ltd, PAEP Implementation Architecture & Repository Baseline v1.0, PAEP-IB-01.

(iii)  ProSEIT Organisation of Software Professionals Ltd, PAEP Implementation Roadmap IB0-IB2 v1.0, PAEP-IR-01.

(iv)  ProSEIT Organisation of Software Professionals Ltd, PAEP Claude Engineering Execution & Quality Assurance Protocol v1.1, PAEP-EQP-01.

(v)  Anthropic, “Introducing Claude Design by Anthropic Labs,” 17 April 2026; describes team design-system use, interactive prototypes and handoff bundles to Claude Code.

(vi)  W3C, Web Content Accessibility Guidelines (WCAG) 2.2, as inherited by PAEP v1.1.

## Approval and Activation Record

Complete this record only after the Standard has been reviewed against PAEP v1.1, PAEP-IB-01 and PAEP-EQP-01 v1.1. Activation establishes the controlled handoff method; it does not transfer architecture, security or release authority to Claude Design or Claude Code.

| Control Field | Recorded Value |

| --- | --- |

| Standard ID | PROSEIT-STD-PMRA-AF-006-DCH01 / PAEP-DCH-01 |

| Version | 1.0 |

| Architecture review | [INSERT REFERENCE AND DATE] |

| Product Owner acceptance | [INSERT REFERENCE AND DATE] |

| Frontend/UX review | [INSERT REFERENCE AND DATE] |

| Security/quality review | [INSERT REFERENCE AND DATE] |

| Effective date | [INSERT] |

| Next review date | [INSERT] |



### Authorised Signatures

Solutions Architect / Main Product Owner — signature and date:  __________________________________________

Frontend Platform / UX Lead — signature and date:  __________________________________________

Security / Quality reviewer — name, capacity, signature and date:  __________________________________________
