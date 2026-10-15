# Work Package IB4-FRAPPE-ADAPTER — Frappe Adapter

**Authorisation:** Product Owner / Solutions Architect instruction "PAEP IB4 — IMPLEMENTATION AUTHORISATION, IB4-FRAPPE-ADAPTER / GENERATION 6" (Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect; project timeline, 2026-10-15T09:59Z). It approves pre-flight decisions D1-D10 and authorises exactly one Generation 6 CANDIDATE for this work package. This file is the authorisation reference of baseline registry generation 6 (CANDIDATE).  
**Pre-flight:** "PAEP IB4 — PRE-FLIGHT READINESS" (2026-10-15), retained under `evidence/IB4-FRAPPE-ADAPTER/preflight/`.  
**Milestone:** IB4 — Frappe adapter. **IB4 = EQP W5** (D10).  
**Predecessor:** IB3-ENTERPRISE-SHELL ACCEPTED; Generation 5 ACCEPTED at `10462434ebb9d9dc1dfe0a3e89fb4f754b4b4473` (promotion merge `a50120017fc84f869043be0c2837286a6f598ef3`); Generation 6 NONE at authorisation.  
**Design classification (PAEP-DCH-01):** no new user-visible screen, dialog, component or copy (D6). The adapter itself has no user interface. No HOF-IB4 / Claude Design cycle is required for this scope.  
**Execution agent:** Claude Code.  
**Acceptance authority:** Product Owner / Solutions Architect. Technical PASS is not ACCEPTED. Claude does not accept IB4, does not merge the implementation pull request and does not promote Generation 6.

## 1. Objective

Implement the ProSEIT-owned adapter `@proseit/frappe-sdk` against the existing PAEP contract boundary (`@proseit/paep-contracts`). The backend remains ERPNext/Frappe. The adapter provides session outcomes, typed record list and detail reads, server-validated workflow transitions, server-authorised file access, normalised errors, polling-based freshness signals with authoritative reconciliation, idempotency and concurrency handling, correlation, and a fail-safe `pmra-api-v1` compatibility check. No dependency-direction change is made: only applications compose the adapter.

## 2. Inputs

| Input | Version / location |
| --- | --- |
| Controlled texts | PAEP v1.1; PAEP-IB-01 v1.0 §23 (IB4: session, typed list/detail/workflow/files/errors/realtime, compatibility checks); IR-01 v1.0; EQP-01 v1.1 |
| Pre-flight | `evidence/IB4-FRAPPE-ADAPTER/preflight/PAEP-IB4-PRE-FLIGHT-READINESS.md` |
| Decisions | D1-D10 as recorded in §6 |
| ADR | ADR-011 (`docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md`), ACCEPTED — PO/SA |
| Baseline | Generation 5 ACCEPTED (`tooling/governance/baseline-registry.json`) |

## 3. Stages (one Generation 6 candidate; stages are sequencing only)

| Stage | Content | Precondition |
| --- | --- | --- |
| S0 | Generation 6 CANDIDATE; these records; narrow `CLAUDE.md` amendment; ADR-011 (ACCEPTED — PO/SA); E01/E09/E10 and WP05 filled-entry rescoping with positive and negative proofs; `PAEP / frappe-adapter` CI scaffold and its governance negatives | this authorisation; baseline revalidated |
| S1 | Product-neutral contract additions in `@proseit/paep-contracts`; API snapshot; contract positives and negatives | S0 green in CI |
| S2 | Adapter transport; session and CSRF; `PaepError` mapping; correlation; `pmra-api-v1` compatibility | S1 |
| S3 | Record list and detail; ETag / concurrency; workflow; files; idempotency | S2 |
| S4 | Polling-based freshness and reconciliation / recovery | S2 |
| S5 | Reference-app lazy adapter binding to the shell ports; CSP `connect-src` deployment documentation; no new screen | S2-S4 |
| S6 | Regression, security / adversarial verification, independent QA, evidence, acceptance report | all |

## 4. Authorised change scope (registry generation 6 `authorisedScope`)

Exact, path-bounded entries, frozen at the end of S0:

* `CLAUDE.md` (narrow amendment: §7), `.github/workflows/paep-ci.yml` (one new mandatory job), `package.json` (scripts only)
* `packages/frappe-sdk/src/`, `packages/frappe-sdk/README.md`
* `packages/contracts/src/` (the canonical `@proseit/paep-contracts` source; additions only)
* `apps/reference-app/` (lazy adapter binding; no new route or screen)
* `tooling/frappe-adapter/` (new), `tooling/test-utils/`, `tooling/enterprise-shell/` (gate rescoping only)
* `tooling/verification/ib0-wp05-ci-policy.json`, `tooling/verification/verify-ib0-wp05.mjs`, `tooling/verification/negative-ib0-wp05.mjs`
* `tooling/design-system/ci-governance-negative.mjs` (case I24 only: the WP05 declared-case total 104 → 105 that the new mandatory job forces; PO/SA S0 scope decision "APPROVED WITH BOUNDARY", 2026-10-15T13:06Z, no other change in the file authorised; the S0 authorisedScope is frozen after this addition)
* `tooling/governance/baseline-registry.json`
* `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md`, `docs/adr/ADR-REGISTER.md`, `docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md`, `docs/provenance/PROVENANCE-REGISTER.md`
* `evidence/IB4-FRAPPE-ADAPTER/`, `work-packages/IB4-FRAPPE-ADAPTER/`

Explicitly excluded: `package-lock.json`; any dependency addition; engine changes; `config/runtime-config.schema.json`; `packages/*/package.json`; foundation, components, enterprise implementation, analytics, offline, i18n and domain packages; CI timeout increases; unrelated ADRs (ADR-003 and ADR-008 stay PROPOSED); product screens. A path needed outside this scope is a STOP; Generation 6 is never widened silently.

## 5. Approved implementation content

1. **Contracts (S1, D5).** Promise-based `*Gateway` operation ports for session, records (list/detail), workflow, files, capabilities and freshness; a product-neutral record DTO; product-neutral invalidation / reconcile types; a blocked-compatibility result. Framework-, Frappe-, DOM- and transport-neutral, strictly typed, additions only, with the API snapshot updated and reviewed.
2. **Adapter (S2-S4).** A framework-neutral, injectable-fetch transport (no `HttpClient`, no new dependency). Credentialed requests only to the configured backend origin. Cookie session + CSRF (D3). An approved, compiled resource map (no arbitrary DocType access). Server-authoritative permissions, workflow and file URLs. `PaepError` normalisation without raw server text or stack traces. Idempotency keys preserved on retry; stale concurrency token maps to `conflict`. Fail-safe `pmra-api-v1` compatibility (D10). Bounded polling freshness that only invalidates and triggers authoritative reconciliation (D4).
3. **Reference app (S5).** The adapter is loaded only through a dynamic `import()` and stays out of the initial bundle (D7, C1 unchanged). It is bound to the existing IB3 shell ports. Authentication entry is the server-hosted Frappe login reached through an approved redirect (D6). No `/login` route, no conflict dialog, no new component, no new copy.

## 6. PO/SA decisions D1-D10 (2026-10-15)

| ID | Disposition |
| --- | --- |
| D1 | APPROVED: this work package; Generation 6 CANDIDATE opened in S0; one narrow, baseline-aware CLAUDE.md amendment (§7) |
| D2 | APPROVED: recorded, credential-free, deterministic, versioned fixtures plus contract doubles are the authoritative CI conformance backend; no production backend, live credentials, session cookie values or real CSRF tokens; no Docker/Frappe runtime in CI; a live pinned environment is optional later evidence and not required for acceptance |
| D3 | APPROVED: Frappe cookie session + CSRF; `identity.mode` stays `frappe-session`; application code never reads, parses, persists or writes the session cookie; CSRF on every state-changing request and never in persistent browser storage; server-authoritative sign-out; no bearer token; nothing credential-like logged |
| D4 | APPROVED: no new runtime dependency; bounded polling → invalidation signal → authoritative reconciliation; recovery reconciles; vendor-neutral port; native Socket.IO / WebSocket transport deferred; no runtime-config schema change |
| D5 | APPROVED: governed S1 contract additions in the canonical `@proseit/paep-contracts` package; API snapshot updated; positive and forbidden-import tests |
| D6 | APPROVED: no new user-visible screen; reuse IB3 shell behaviour; server-hosted login through an approved redirect; no `/login`, no conflict dialog, no new component; STOP on any genuinely new interaction intent |
| D7 | APPROVED: `@proseit/frappe-sdk` stays lazy-loaded; C1 unchanged |
| D8 | APPROVED: one IB4 ADR at the next available identifier (ADR-011), ACCEPTED — PO/SA; ADR-003 and ADR-008 unchanged |
| D9 | APPROVED: narrow rescoping of E01, E09, E10 and the WP05 filled-entry controls, with pre- and post-promotion proofs and seeded negatives; no criterion weakened |
| D10 | APPROVED: IB4 = EQP W5; `pmra-api-v1` is the Generation 6 backend compatibility contract identifier (defined in ADR-011); compatible → proceed, incompatible → blocked, unknown → blocked and surfaced |

## 7. CLAUDE.md amendment (D1)

Exactly one line changes. The baseline line

`- Do not implement Frappe/ERPNext integration in this work package.`

becomes

``- Do not implement Frappe/ERPNext integration, except under the PO/SA-authorised work package `IB4-FRAPPE-ADAPTER` (PO/SA authorisation 2026-10-15), within its `WORK_PACKAGE.md`, `ACCEPTANCE.md` and the Generation 6 `authorisedScope`; this exception grants no permission for any later milestone, for self-acceptance, or for baseline promotion.``

E10 (enterprise-shell gate) and W02 (IB0-WP05) enforce it: before promotion CLAUDE.md must be the accepted baseline with exactly this replacement; after promotion it must equal the promoted baseline. Seeded negatives reject an altered, removed or broadened line.

## 8. CI (§14 of the authorisation)

One new mandatory job, `PAEP / frappe-adapter` (20-minute timeout), runs `npm run qa:frappe` and `npm run qa:ib4:ci-negative`. It is registered in the gate `needs`, `MANDATORY_JOBS`, the WP05 CI policy and the WP05 gate-case partition. No other job's timeout changes. A seeded negative proves that removing the job from the gate fails closed.

## 9. Stop rules

Stop and report BLOCKED, with one consolidated decision request, if IB4 would need: a path outside the frozen scope; a new dependency or lockfile change; a runtime-config schema change; a dependency-direction change; a change to an accepted IB0-IB3 control beyond the approved E01/E09/E10/WP05 rescoping; a CI timeout increase; a new screen, dialog, component, copy or interaction intent; the adapter in the initial bundle; a contract that mirrors Frappe internals; a credential, cookie value, token or secret anywhere in source, fixtures, configuration, logs or evidence.

## 10. Records

`ACCEPTANCE.md` (AC-IB4-01..22), `TRACEABILITY.csv`, `work-package.json`, `ACCEPTANCE_REPORT.md` (S6), evidence under `evidence/IB4-FRAPPE-ADAPTER/`. Carried obligations PAEP-LOC-AR-PILOT, PAEP-LOC-HE-PILOT and PAEP-A11Y-AT-PILOT stay OPEN; IB4 does not close them and, because it adds no UI or copy, they do not block it.
