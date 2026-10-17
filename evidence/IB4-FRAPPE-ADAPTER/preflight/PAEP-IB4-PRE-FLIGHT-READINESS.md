# PAEP IB4 — PRE-FLIGHT READINESS

**Status: PRE-FLIGHT COMPLETE. STOPPED FOR PO/SA AUTHORISATION.**

- Prepared 2026-10-15 as read-only analysis of `main` @ `a50120017fc84f869043be0c2837286a6f598ef3`.
- Nothing was changed in the repository:
  - no Generation 6 was created;
  - no IB4 code was written;
  - no IB4 branch or PR was opened.
- Source authority:
  - PAEP v1.1;
  - PAEP-IB-01 §23 ("Session, typed list/detail/workflow/files/errors/realtime; compatibility checks");
  - IR-01, EQP-01 and the ADR register.
- Line references (`file:line`) are to that commit.

---

## 1. Generation 5 baseline

| Item | Value |
|---|---|
| Active generation | 5, ACCEPTED (`tooling/governance/baseline-registry.json:348-372`) |
| Accepted commit | `10462434ebb9d9dc1dfe0a3e89fb4f754b4b4473` (PR #12 merge) |
| Promotion | PR #13, merged as `a501200`; CI run 38705367133, 19/19 green |
| Candidate | none (`qa:baseline`: "active G5, candidate none") |
| Toolchain | Angular 22.1.8, TypeScript 6.0.x, RxJS 7.8.2, Node 24 (unchanged) |
| Carried obligations | PAEP-LOC-AR-PILOT, PAEP-LOC-HE-PILOT and PAEP-A11Y-AT-PILOT, all OPEN, required before any product pilot or production claim |

**Consequence of "candidate none":** governance (W07/B11) admits no repository change. The first IB4 commit must therefore open a Generation 6 CANDIDATE, and it may do so only after PO/SA authorisation.

## 2. IB4 objective

Implement `@proseit/frappe-sdk`, the ProSEIT-owned **Frappe adapter**.

**What it does:** it implements the approved PAEP contracts against a Frappe/ERPNext backend.

**What the rest of PAEP gets from it:**
- session and identity outcomes;
- typed list and detail reads;
- server-validated workflow transitions;
- authorised file access;
- normalised errors;
- realtime freshness signals;
- a compatibility check that blocks protected routes when the backend is out of range.

**What it must never do:**
- Expose Frappe types or DocType names to UI packages.
- Decide permissions in the client. The server stays authoritative.

**Exit evidence (IB-01 §23):**
- conformance tests against a reference backend;
- contract test doubles;
- `qa:contracts`, `qa:integration` and a new `qa:frappe`;
- security-negative tests.

## 3. Scope

### In scope (proposed)

- **Adapter source:** `packages/frappe-sdk/src/`.
- **Adapter capabilities:**
  - session check, sign-out and expiry;
  - CSRF handling;
  - list with cursor or page paging;
  - detail with ETag/concurrency metadata;
  - workflow actions and transitions;
  - file metadata and authorised URLs;
  - error mapping to `PaepError`;
  - realtime "something changed, reconcile" signals;
  - idempotency keys on writes;
  - correlation ids into observability;
  - backend compatibility check.
- **Contract additions (governed):** the operation *ports* the adapter implements. Today only `ReportingGateway` exists as a port. A detail/record DTO and a realtime/freshness type are also needed.
- **Contract test doubles** in `tooling/test-utils/`, plus a new `tooling/frappe-adapter/` for QA and negatives.
- **Reference-app wiring:** the app binds the adapter to the enterprise-shell ports (session, access, notifications, command search). Only apps may import the adapter.
- **A new mandatory CI job** for adapter conformance and security negatives.
- **Governance records:** a work package, the Generation 6 candidate, and a narrow CLAUDE.md amendment like IB3's.

### Out of scope

- Product screens, domain workflows and domain kits.
- Analytics/reporting UI.
- Offline queues.
- A new UI design system.
- Arbitrary DocType access.
- Client-side permission decisions.
- Production backend connections, real credentials, and any secret in a fixture, config, log or evidence.
- Changes to the Angular, TypeScript or Node majors.
- Any new runtime dependency, unless the PO/SA separately approves one (see D4).

## 4. Package ownership and dependency direction

Ownership follows `tooling/architecture-boundaries/architecture-model.json`. No rule change is proposed.

| Package | Layer | IB4 role | May import | Imported by |
|---|---|---|---|---|
| `@proseit/frappe-sdk` | L2 adapter | Implements contracts against Frappe | contracts, observability (Yes); platform, offline (Optional) | apps only |
| `@proseit/contracts` | L0 | Gains the operation ports and DTOs (governed change) | nothing external | everyone |
| `@proseit/enterprise` | L3 | Unchanged; its ports are bound by the app | — | apps |
| `apps/reference-app` | L4 | Composition root: binds adapter to shell ports | adapter + all | — |

**Placeholder package:** `packages/frappe-sdk` already exists as an IB0 placeholder. `src/index.ts` is `export {};`.

**Things the adapter must not touch:**
- It must never import foundation, i18n or components.
- enterprise, analytics and domain packages must never import the adapter.

**How the ports are bound:** the app binds them through `providePaepShell`. This keeps the shell backend-agnostic, so the Frappe dependency is visible in exactly one place.

## 5. Architecture, contract and security impact

### Architecture

- **No dependency-direction change.** The adapter fits the existing matrix.
- **ADR state:** ADR-003 and ADR-008 are still *proposed*, and no ADR covers the Frappe adapter. The PO/SA should decide whether an IB4 adapter ADR is required (D8).

### Contracts (governed change; an IB3 stop item, so it needs explicit authorisation)

**What already exists:**
- `IdentityContext` and `SessionOutcome`;
- `PaepError` and its categories;
- `Capability`;
- `ListQuery`, `PageRequest`/`PageResult`;
- `ConcurrencyMetadata` and `IdempotencyKey`;
- workflow types and file types;
- `BackendCompatibility`/`CompatibilityReport`.

**What is missing:**
- Operation ports: session, records list/detail, workflow, files, capabilities, realtime.
- A record/detail DTO.
- Any realtime/freshness type.

**Effect:** adding these changes the contract API snapshot (`tooling/test-utils/contract-api-report.json`) that `qa:contracts` compares.

### Runtime config

**No schema change is needed if IB4 stays on HTTPS.** The required keys already exist:
- `backend.apiBaseUrl`, `realtimeUrl`, `fileBaseUrl`;
- `backend.compatibility`;
- `identity.mode: "frappe-session"`.

**The constraint:** URLs must be `https://`, or `http://` on loopback. A native `wss://` realtime URL is rejected today. Socket.IO negotiated over HTTPS passes.

### Security and trust boundaries

**Trust boundary:** the browser holds no authority. The server decides permissions, workflow validity and file access. The adapter only relays and normalises.

**Session model (D3):** Frappe session cookie (`identity.mode: frappe-session`) plus a CSRF token, or a token mode.

**IB3 shell rules on cookies and storage:**
- E06 bans cookies and storage in the reference-app code. A cookie session works if the *browser* carries the cookie (`withCredentials`) and the app code never reads or writes it.
- Where the CSRF token is held must not use web storage.

**CSP:** `connect-src 'self'` is the strict profile. Deployments add backend origins. IB4 needs a documented connect-src addition for the API and realtime origins, with no wildcard.

**Errors and observability:**
- Server messages are never shown raw. They map to `messageKey`.
- Correlation ids pass through `createCorrelationId`.
- Error reports stay sanitised, with no tokens and no PII.

**Fixtures:** no credential, cookie value or token appears in a fixture, log or evidence. The test backend uses generated, non-secret identities.

## 6. Design classification (DCH-01)

**Classification: D0 for the adapter itself.** It has no user-visible surface.

**Where D1/D2 applies:** only where IB4 introduces *new interaction intent*. The reference-app candidates are:
- a sign-in entry point (`/login` is banned by E08 today);
- session-expired / re-authenticate;
- permission-denied mapping;
- a stale-data / "updated elsewhere" notice from realtime;
- file download failure.

**Recommendation (D6):**
- Reuse the existing IB3 shell states, which already cover these: session-expiring, signing-out, locked/not-permitted and the error boundary with a reference.
- Add **no new screens** in IB4.
- Treat sign-in as a server-hosted Frappe login, reached by redirect.

**Result:** no HOF / Claude Design handoff is needed.

**If the PO/SA wants an in-app sign-in or a conflict dialog:** that is D1/D2 and needs a HOF-IB4 handoff before implementation. It also enters the open localisation and AT pilot obligations.

## 7. Work-package decomposition

**Proposed ID:** `IB4-FRAPPE-ADAPTER`. It is one work package with stages, mirroring IB3.

| Stage | Content | Gate |
|---|---|---|
| S0 | Open Generation 6 CANDIDATE; WORK_PACKAGE/ACCEPTANCE/TRACEABILITY/work-package.json; pre-flight evidence; one-line CLAUDE.md amendment; IB3-gate rescoping (§9) | `qa:baseline`, WP05 W-checks, enterprise E-checks green |
| S1 | Contract additions: ports, record DTO, realtime type; API snapshot update | `qa:contracts` |
| S2 | Adapter core: HTTP transport, session/CSRF, error mapping, correlation, compatibility check | `qa:frappe` unit + negatives |
| S3 | Lists, detail (ETag), workflow, files (authorised URLs) | `qa:frappe` conformance |
| S4 | Realtime freshness and reconnect, which triggers a reconcile | `qa:frappe` realtime cases |
| S5 | Reference-app binding to shell ports; CSP connect-src documentation | enterprise + browser QA |
| S6 | Regression, independent QA, acceptance report; human gates | full CI 19+1 jobs |

Each stage is a commit series in a single IB4 PR, as with IB3. Promotion is a separate PR after PO/SA acceptance.

## 8. Generation 6 treatment

**Strategy (one candidate): open Generation 6 in S0 of the IB4 PR**, the same way Generation 5 was opened.

- **Entry:**
  - `generation: 6`, `predecessorGeneration: 5`, `status: CANDIDATE`, `workPackages: ["IB4-FRAPPE-ADAPTER"]`;
  - `authorisation {PO/SA, date, reference: work-packages/IB4-FRAPPE-ADAPTER/WORK_PACKAGE.md}`;
  - `policyChange: true`;
  - `protectedRecords: [evidence/IB4-FRAPPE-ADAPTER/, work-packages/IB4-FRAPPE-ADAPTER/]`;
  - `null` for accepted commit, tree and fingerprints.
- **authorisedScope (exact paths, sorted; final list to be confirmed in the WP):**
  - `CLAUDE.md`
  - `.github/workflows/paep-ci.yml`
  - `package.json` (scripts only)
  - `packages/frappe-sdk/src/`, `packages/frappe-sdk/README.md`
  - `packages/contracts/src/`, `tooling/test-utils/`
  - `apps/reference-app/`
  - `tooling/frappe-adapter/`
  - `tooling/enterprise-shell/` (gate rescoping only)
  - `tooling/verification/ib0-wp05-ci-policy.json`, `verify-ib0-wp05.mjs`, `negative-ib0-wp05.mjs`
  - `tooling/governance/baseline-registry.json`
  - `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md`, `docs/provenance/PROVENANCE-REGISTER.md`
  - `evidence/IB4-FRAPPE-ADAPTER/`, `work-packages/IB4-FRAPPE-ADAPTER/`
- **Explicitly excluded:**
  - `package-lock.json`, dependencies and engines;
  - `config/runtime-config.schema.json`;
  - other packages;
  - CI timeouts.
- **Frozen afterwards:** the scope does not change after S0. Widening it is a stop.
- **Lifecycle:** CANDIDATE → IB4 accepted by PO/SA → merge → promotion PR → Generation 6 ACCEPTED. B13 freezes the merged candidate until it is promoted.

## 9. CI and gate plan

**Current state:** 18 mandatory jobs plus `gate` (19 checks). Jobs are capped at 20 minutes, and enterprise-shell already uses about 17.5 minutes.

**Plan:**
1. **Add one new mandatory job `frappe-adapter`** running `qa:frappe` (unit, conformance against the reference fixture, security negatives). Keep it separate from enterprise-shell and the negative-ci jobs because of headroom.
   - Add it to `MANDATORY_JOBS`, the WP05 CI policy and the gate case count (W11 total 104 rises).
   - Add it to the IB3 CI-governance negative suite.
2. **`qa:contracts`:** update the API snapshot for the new ports.
3. **Rescope the IB3 gates that would otherwise block IB4.** The rule is no weakening: every rescoped check stays as strict for every path outside the Generation 6 authorisedScope.

| Gate | Today | IB4 change (needs authorisation) |
|---|---|---|
| E09 freeze | frappe-sdk, contracts, schema, lockfile frozen | Freeze stays for schema, lockfile, analytics/offline/domain; frappe-sdk/contracts admitted **only** within active G6 authorisedScope |
| E01 app imports | allowlist without frappe-sdk | Add `@proseit/frappe-sdk` to the reference-app allowlist only |
| E08 routes | fixed list, `/login` banned | Unchanged if D6 = no new screens |
| E10 CLAUDE.md | equals G5 baseline | Generalised to "baseline + the one authorised G6 line", pre- and post-promotion, fail closed |
| Bundle C1/C3 | no frappe-sdk in initial bundle; 3rd-party only @angular/rxjs/tslib | C3 unchanged (no deps); C1 either kept (adapter lazy-loaded) or bounded by size budget — D7 |
| W06 lockfile | no delta | Unchanged |
| WP05 IB1_FILLED_ENTRIES | placeholder list | Add `packages/frappe-sdk/src/index.ts` |

4. **IB3 lessons built in from S0:**
   - Every baseline-relative check gets positive and negative proofs against synthetic pre- and post-promotion baselines, as E10 P01/P02 and N35–N39 do.
   - Browser QA uses mocked transports, never live sockets, to avoid `networkidle` stalls. Stall diagnostics are on from the start.
   - A run blocked by billing or infrastructure is recorded as "not executed" and re-run on the exact head. It is never counted as PASS or FAIL.

## 10. Negative-test plan (security and conformance)

All of these must fail closed:

- **Scope and boundaries:**
  - The adapter imports UI (foundation, components, i18n).
  - enterprise or domain code imports the adapter.
  - Frappe types leak through the public API.
  - A raw DocType name is accepted outside the approved list.
- **Server authority:**
  - The client grants an action the server denied.
  - A workflow transition is not in the server's allowed set.
  - A file URL is built client-side instead of authorised.
- **Session and CSRF:**
  - A write is sent without the CSRF token.
  - Expiry is not mapped to `SessionOutcome: expired`.
  - App code reads or writes a cookie or uses storage.
- **Errors:**
  - A raw server message or stack trace reaches the UI or a log.
  - A token, cookie or PII appears in an error report.
  - The correlation id is missing.
- **Concurrency:**
  - A stale ETag write is not mapped to `conflict`.
  - A retried write lacks its idempotency key.
- **Compatibility:**
  - Protected routes open when the backend version is out of range or unknown.
- **Realtime:**
  - A realtime payload is applied as data instead of triggering a reconcile.
  - Reconnect does not trigger a reconcile.
- **Config:**
  - A non-https URL is admitted.
  - A wildcard connect-src is added.
  - A secret is placed in a runtime-config example.
- **Governance:**
  - A change falls outside the G6 authorisedScope.
  - The CLAUDE.md amendment drifts or is reverted.
  - A lockfile or dependency delta appears.
  - A CI timeout is raised.
  - The new job is missing from `MANDATORY_JOBS`.

## 11. Acceptance criteria (draft AC-IB4-xx, for PO/SA review)

1. The adapter implements every approved IB4 contract port and passes conformance against the reference backend or fixture (D2).
2. Session outcomes map exactly to `SessionOutcome`, and CSRF is enforced on every state-changing request.
3. List and detail reads are typed and paged, with no arbitrary DocType access.
4. Workflow transitions are server-validated, and invalid ones are rejected with a mapped error.
5. File access uses server-authorised URLs only, with integrity metadata.
6. All errors normalise to `PaepError` (code, messageKey, fieldErrors, correlationId, retryable), with no raw server text.
7. Concurrency (ETag → conflict) and idempotency work on writes.
8. Realtime signals only trigger reconciliation, and reconnect reconciles.
9. The compatibility check blocks protected routes when the backend is out of range.
10. Observability: correlation ids propagate and reports are sanitised.
11. Package boundaries hold, with no architecture-matrix change.
12. Contract additions are recorded and the API snapshot is updated.
13. There is no runtime-config schema change, no dependency or lockfile change, and no CI timeout change, unless separately authorised.
14. Every security negative in §10 is present and failing closed.
15. Every IB3 gate keeps its strictness outside the G6 scope, with pre- and post-promotion proofs for each rescoped gate.
16. The new CI job is mandatory, and all checks are green on the exact head.
17. Full regression: IB0–IB3 gates are unchanged and green.
18. There are no secrets or credentials anywhere, and no proprietary template material.
19. Traceability, evidence and the acceptance report are complete.
20. Carried obligations are recorded as still OPEN, with IB4 in scope for them if any user-visible copy is added.
21. Independent QA review.
22. PO/SA human acceptance (technical PASS ≠ ACCEPTED).

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | No reference backend: conformance cannot be shown (probable BLOCKED point) | Decide D2 before S0 |
| R2 | Realtime needs socket.io; a client library is a new dependency | D4: hand-written minimal client vs approved dependency + ADR + licence review |
| R3 | Rescoping IB3 gates could be read as weakening | Path-bounded rescoping, unchanged strictness elsewhere, explicit negatives |
| R4 | CI headroom (20 min cap) | Separate job; mocked transports |
| R5 | Baseline-relative checks break at promotion (the E10 lesson) | Synthetic-baseline proofs from S0 |
| R6 | Cookie/CSRF model conflicts with E06 storage ban or CSP | D3 settles the model before S2 |
| R7 | Scope creep into product screens or domain workflows | D6 = no new screens; stop rule |
| R8 | Live-backend credentials leaking into CI or evidence | Credential-free fixture backend; secret-scan negative |

## 13. Unresolved decisions (PO/SA)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Authorise IB4 `IB4-FRAPPE-ADAPTER` and a narrow CLAUDE.md line-29 amendment (IB3 pattern) | Yes; one line, WP- and generation-bounded |
| D2 | Reference backend for conformance: pinned Frappe version in CI container, external test instance, or recorded fixtures | **Recorded, credential-free fixtures + contract doubles in CI**; live pinned instance as a later, separate evidence step |
| D3 | Session model: Frappe cookie session + CSRF, or token/OIDC | **Cookie session + CSRF** (`identity.mode: frappe-session`, already in schema); app code never touches the cookie |
| D4 | Realtime: hand-written minimal socket.io/Engine.IO client, polling-based freshness, or an approved dependency | **No dependency in IB4**: freshness via polling/reconcile with a realtime port defined; socket transport deferred unless approved |
| D5 | Authorise contract additions (ports, record DTO, realtime type) | Yes, as a governed change in S1 |
| D6 | Any new user-visible screens (`/login`, conflict dialog)? | **No**: reuse IB3 shell states; server-hosted login via redirect; no HOF handoff |
| D7 | Bundle: adapter lazy-loaded (C1 kept) or in initial bundle with a budget | **Lazy-load**, keep C1 unchanged |
| D8 | Need an IB4 adapter ADR? Also the status of proposed ADR-003/008 | One short ADR for the adapter boundary and session model |
| D9 | Authorise path-bounded rescoping of E01/E09/E10 (and WP05 entries) | Yes, with no weakening outside G6 scope |
| D10 | Numbering: EQP wave W5 vs IB4; `pmra-api-v1` compatibility contract name | Record IB4 = EQP W5 mapping in the WP; name the compatibility contract in D8's ADR |

## 14. Recommended execution sequence

1. **PO/SA reviews this pre-flight** and answers D1–D10.
2. **PO/SA issues the IB4 implementation authorisation**, naming the work package and the Generation 6 scope.
3. **S0:** open the Generation 6 CANDIDATE and the records, apply the CLAUDE.md amendment, rescope the gates with proofs, and open the IB4 draft PR. CI must be green before continuing.
4. **S1–S5 in order**, with gates green at each stage.
5. **S6:** regression, independent QA, acceptance report, then the human gates.
6. **PO/SA acceptance.** Then pre-merge revalidation, merge, post-merge verification, the promotion PR, post-promotion verification and the Generation 6 closeout.

**STOP.** Nothing beyond step 1 is started until the PO/SA authorises it.
