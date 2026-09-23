# Work Package IB0-WP01 — Repository and Angular Workspace Bootstrap

**Controlled roadmap mapping:** PAEP-IR-01, IB0-WP1  
**Milestone:** IB0 — Workspace and Architecture Governance Baseline  
**Design classification:** D0 — no design handoff required  
**Execution agent:** Claude Code  
**Acceptance authority:** Solutions Architect / Main Product Owner or delegated technical reviewer  
**Initial status:** READY

## 1. Objective

Create the first buildable PAEP repository and Angular workspace skeleton so subsequent IB0 work can pin the toolchain, enforce architecture boundaries, and establish CI without re-creating the repository structure.

## 2. Required outcome

(i) A valid Angular workspace exists at the repository root.

(ii) `apps/reference-app` exists as a minimal Angular starter application and builds successfully.

(iii) `apps/ui-lab` exists as a minimal Angular starter application and builds successfully.

(iv) The approved PAEP package topology exists as placeholders only where implementation belongs to later milestones.

(v) The approved `tooling/`, `config/`, `docs/`, and `evidence/` areas exist.

(vi) npm is the repository package manager and a lockfile is generated.

(vii) A clean install and clean build are reproducible from the repository contents.

(viii) Exact bootstrap tool versions and material generated dependencies are recorded as evidence for the subsequent toolchain-pinning work package.

## 3. Required repository topology after implementation

```text
paep/
├── apps/
│   ├── reference-app/
│   └── ui-lab/
├── packages/
│   ├── contracts/
│   ├── foundation/
│   ├── components/
│   ├── platform/
│   ├── enterprise/
│   ├── analytics/
│   ├── offline/
│   ├── i18n/
│   ├── observability/
│   ├── frappe-sdk/
│   ├── domain-manufacturing/
│   ├── domain-quality/
│   ├── domain-maintenance/
│   ├── domain-construction/
│   ├── domain-commerce/
│   ├── domain-fiscal/
│   ├── domain-ai/
│   └── domain-iot/
├── tooling/
│   ├── architecture-boundaries/
│   ├── config-validation/
│   ├── test-utils/
│   ├── visual-regression/
│   ├── a11y/
│   └── build-release/
├── config/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── provenance/
│   ├── licences/
│   └── migration/
├── evidence/
│   ├── tests/
│   ├── accessibility/
│   ├── performance/
│   ├── security/
│   ├── sbom/
│   ├── releases/
│   ├── portability/
│   ├── usability/
│   ├── analytics/
│   └── IB0-WP01/
├── CLAUDE.md
├── package.json
├── package-lock.json
└── README.md
```

The exact monorepo metadata files may differ according to the selected Angular/Nx-compatible bootstrap, but the ownership boundaries above shall be preserved.

## 4. Permitted change boundary

Claude may create or modify repository-root Angular/workspace metadata, `apps/`, empty/shared-package placeholders, `tooling/`, `config/`, `docs/`, `evidence/IB0-WP01/`, the root `README.md`, and files required by the selected Angular workspace generator.

Claude may update the pre-supplied work-package traceability and evidence files to record implementation results.

## 5. Out of scope

(i) Frappe/ERPNext authentication, SDK clients, DocType access, API clients or backend integration.

(ii) Enterprise shell, navigation, tenant context, command palette or notifications.

(iii) Analytics dashboards, chart libraries, reporting services or Power BI adapters.

(iv) Offline queues, service-worker business logic or synchronization.

(v) Product-specific screens, workflows or domain rules.

(vi) Final package dependency enforcement, circular-dependency tooling and deep-import CI rules; those are later IB0 work packages.

(vii) Production design-system tokens and reusable component implementation; those are IB2.

(viii) Any proprietary commercial UI template or copied implementation.

## 6. Architecture constraints

(i) Keep `apps/*` thin; do not place reusable platform logic in starter app files.

(ii) Create package areas consistent with PAEP-IB-01 even if some are placeholders at this stage.

(iii) Do not introduce direct UI-to-Frappe coupling.

(iv) Do not introduce secrets or environment-specific credentials.

(v) Do not change the controlled Angular 22.x / TypeScript 6.0.x major/minor family without an approved ADR.

(vi) Use the minimum dependencies needed for the workspace bootstrap; do not add UI kits, chart libraries, state frameworks, authentication libraries or backend clients in this work package.

## 7. Implementation tasks

(i) Inspect all controlled source-of-truth files relevant to IB0-WP01.

(ii) Record a bounded implementation plan in `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md` before changing the workspace.

(iii) Bootstrap the Angular workspace at repository root using npm and the controlled Angular baseline.

(iv) Create `reference-app` and `ui-lab` as minimal standalone Angular applications without product-specific UI.

(v) Establish the approved top-level package/tooling/config/docs/evidence topology. Package folders may contain minimal README files/placeholders but no later-milestone implementation.

(vi) Add deterministic npm scripts sufficient to build both starter applications and run the IB0-WP01 verification script.

(vii) Record the exact bootstrap versions and material generated dependencies.

(viii) Perform a clean install from the generated lockfile.

(ix) Build both starter applications from a clean dependency state.

(x) Run `node tooling/verification/verify-ib0-wp01.mjs`.

(xi) Store command logs and the technical acceptance result under `evidence/IB0-WP01/`.

(xii) Update the traceability register and acceptance report.

## 8. Mandatory QA commands

The implementation shall expose or support the following checks. Claude may adapt the exact Angular CLI command syntax to the generated project names, but the observable outcomes shall not change.

```text
npm ci
npm run build:reference-app
npm run build:ui-lab
node tooling/verification/verify-ib0-wp01.mjs
```

If `npm ci` is not meaningful until after the first generated lockfile exists, generate the lockfile through the normal bootstrap, remove installation artefacts as appropriate, then perform the clean-install evidence run.

## 9. Evidence required

(i) `evidence/IB0-WP01/logs/npm-ci.log`

(ii) `evidence/IB0-WP01/logs/build-reference-app.log`

(iii) `evidence/IB0-WP01/logs/build-ui-lab.log`

(iv) `evidence/IB0-WP01/reports/ib0-wp01-verification.json`

(v) `evidence/IB0-WP01/reports/toolchain-baseline.md`

(vi) `evidence/IB0-WP01/reports/dependency-baseline.md`

(vii) `evidence/IB0-WP01/notes/implementation-summary.md`

(viii) completed `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md` or a copy based on the supplied template.

## 10. Exit rule

IB0-WP01 reaches technical PASS only when every mandatory criterion in `ACCEPTANCE.md` is satisfied and the required evidence exists. PASS is not ACCEPTED until an authorised human reviewer records acceptance.
