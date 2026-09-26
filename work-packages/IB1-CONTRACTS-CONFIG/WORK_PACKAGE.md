# Work Package IB1-CONTRACTS-CONFIG — Product-Neutral Contracts and Governed Runtime Configuration

**Authorisation:** Product Owner / Solutions Architect instruction "IB1 — PRODUCT-NEUTRAL CONTRACTS AND RUNTIME CONFIGURATION" (project thread, 2026-09-26T13:52Z). This file is the authorisation reference of baseline registry generation 3 (CANDIDATE).  
**Milestone:** IB1 (PAEP-IR-01 §5.6 IB1-WP1..IB1-WP6, delivered as one work package)  
**Predecessor:** IB1-PREFLIGHT-R7 ACCEPTED and CLOSED; active accepted baseline generation 2 (merge `035593b`)  
**Design classification:** D0 (no product UI; only a fixed fail-safe message in the reference app)  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Naming:** no controlled naming rule exists for IB1 work packages; the identifier `IB1-CONTRACTS-CONFIG` is used.

## 1. Objective

1. Make `@proseit/paep-contracts` a real, framework-neutral TypeScript boundary: type-only, readonly shapes with no Angular, Frappe/ERPNext, DOM, visualisation-library, domain-package or app dependency (PAEP v1.1 §7, §10; PAEP-IB-01 §7, Appendix D).
2. Deliver governed runtime configuration: a versioned, closed JSON Schema; strict loading; schema, semantic and compatibility validation; fail-safe startup; a deep-frozen, once-only store; the same build deployable to cloud SaaS, private cloud and on-premise (PAEP v1.1 §9, §19; PAEP-IB-01 §9, Appendix C; PAEP-IR-01 IB1-WP4/WP5).
3. Wire only the minimum reference-app bootstrap: runtime configuration is loaded and validated before `bootstrapApplication`; failure shows a fixed diagnostic and Angular never starts.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-NEUTRAL | Contracts have no framework, DOM, backend, visualisation, domain or app dependency | PAEP v1.1 §7; IB-01 §7; Appendix B |
| R-CFG | Runtime configuration is versioned, schema-validated, compatibility-checked and fail-safe | PAEP v1.1 §9; IB-01 §9; QAC-CFG-01 |
| R-PORT | One build serves every deployment profile | PAEP v1.1 §19; QAC-PORT-01 |
| R-SEC | No secrets, credentials or data-store locators in configuration; https only outside local development | PAEP v1.1 §13; IB-01 §9.4; CLAUDE.md |
| R-DEP | No new dependency | Authorising instruction; CLAUDE.md |
| R-GOV | Baseline registry: generation 2 stays ACCEPTED, generation 3 is a CANDIDATE and is never promoted by Claude | IB1-PREFLIGHT-R7; `docs/architecture/BASELINE-ROLLOVER.md` |
| R-CI | New mandatory jobs feed the unchanged `PAEP / gate` | IB0-WP05; authorising instruction |

## 3. Authorised change scope (registry generation 3 `authorisedScope`)

* `packages/contracts/`, `packages/platform/` (runtime-configuration subsystem only)
* `apps/reference-app/src/main.ts`, `apps/reference-app/src/app/runtime-config.ts`, `apps/reference-app/public/config/`
* `config/README.md`, `config/runtime-config.schema.json`, `config/runtime-config.example.json`
* `tooling/config-validation/`, `tooling/test-utils/`
* `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md`, `docs/architecture/RUNTIME-CONFIGURATION-GUIDE.md`
* `package.json` (IB1 scripts only; no dependency change)
* `.github/workflows/paep-ci.yml`, `tooling/verification/ib0-wp05-ci-policy.json`, `tooling/verification/verify-ib0-wp05.mjs`, `tooling/verification/negative-ib0-wp05.mjs` (policy change: new jobs and the bounds in §7)
* `tooling/governance/baseline-registry.json` (append generation 3 CANDIDATE)
* `work-packages/IB1-CONTRACTS-CONFIG/`, `evidence/IB1-CONTRACTS-CONFIG/`

The baseline-governance verifier enforces this scope (B11, W05).

## 4. Out of scope

IB2 foundations and components; the enterprise shell; the Frappe SDK, Frappe API integration, authentication and session; offline/PWA implementation; observability; reporting UI or engine, Power BI and ECharts; `domain-*` packages and product workflows; fiscalisation; edition-gating UI; state management; Angular DI providers beyond one injection token; dependencies and the lockfile; controlled sources; earlier work-package records; CLAUDE.md.

## 5. Deliverables

| Deliverable | Location |
| --- | --- |
| Contract catalogue and public API | `packages/contracts/`; `evidence/IB1-CONTRACTS-CONFIG/reports/contract-catalogue.md`, `contract-public-api.md` |
| Runtime-configuration schema and example | `config/`; `evidence/.../reports/runtime-config-schema.md` |
| Zero-dependency validator generator and generated validator | `tooling/config-validation/generate-validator.mjs`; `packages/platform/src/lib/runtime-config/generated/` |
| Loader, validation pipeline, frozen store, fail-safe startup | `packages/platform/src/lib/runtime-config/` |
| Reference-app wiring | `apps/reference-app/src/main.ts`, `src/app/runtime-config.ts` |
| Test doubles for contracts | `tooling/test-utils/` |
| Positive, negative, mutation and portability tests | `tooling/config-validation/`, `tooling/test-utils/` |
| Design, guide, bootstrap sequence | `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md`, `docs/architecture/RUNTIME-CONFIGURATION-GUIDE.md` |
| CI jobs `PAEP / contracts`, `PAEP / runtime-config`, `PAEP / runtime-config-negative` | `.github/workflows/paep-ci.yml` |
| Evidence set, traceability, acceptance readiness | `evidence/IB1-CONTRACTS-CONFIG/`, `TRACEABILITY.csv`, `ACCEPTANCE_REPORT.md` |

## 6. Acceptance boundary

Claude Code may implement, verify, document, push, open one ready PR and run CI. Claude Code may not mark IB1 ACCEPTED, promote generation 3, merge, or begin IB2. Those require explicit PO/SA authorisation.

## 7. Bounded successor-work exceptions

The accepted IB1-PREFLIGHT-R7 mechanism (registry bounds: accepted history up to the active accepted commit, or an in-scope change with B11 passing) is reused. The historical WP03/WP04 verifiers and negative suites are not modified. IB1 necessarily fills the two package entry points and adds the first architecture edges, which those verifiers were written to reject while IB0 required placeholders. The WP05 verifier therefore evaluates exactly these findings with the same registry bound; each one is listed in `ACCEPTANCE_REPORT.md` §4 for PO/SA acceptance and none widens an authorised path:

| Historical finding | Why it appears | Bound applied in `verify-ib0-wp05.mjs` |
| --- | --- | --- |
| WP04 V07 / WP03 V09 "entry point is a placeholder" failing for `packages/contracts` or `packages/platform` | IB1 replaces the IB0 `export {}` placeholders with real public APIs | Accepted only for those entry points, only while they are in the CANDIDATE scope with B11 passing |
| WP04 negative suite edge-count controls | The architecture graph now has the IB1 edges (`platform` → `contracts`, `reference-app` → `platform`, `reference-app` → `contracts`) | Every affected case must still report its intended rule; only the absolute edge count may differ, by exactly the edges `qa:architecture` reports |

Any other finding still fails.
