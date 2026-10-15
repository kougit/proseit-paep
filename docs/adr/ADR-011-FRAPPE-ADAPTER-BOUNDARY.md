# ADR-011 — Frappe adapter boundary, cookie session + CSRF, polling freshness and the `pmra-api-v1` compatibility contract

| Field | Value |
| --- | --- |
| Status | **ACCEPTED — PO/SA** |
| Date | 2026-10-15 |
| Authority | Product Owner / Solutions Architect (Dr Kamulegeya Grace B (PhD)), "PAEP IB4 — IMPLEMENTATION AUTHORISATION, IB4-FRAPPE-ADAPTER / GENERATION 6", decision D8 |
| Work package | IB4-FRAPPE-ADAPTER (IB4 = EQP W5), baseline registry Generation 6 (CANDIDATE) |
| Supersedes | — |
| Related | ADR-003 "Product-neutral paep-contracts and Frappe adapter separation" and ADR-008 "Production AOT, CSP, Trusted Types and browser-storage profile" (PAEP-IB-01 App. F). Both stay PROPOSED; this ADR does not change their status or content. |

This record transcribes decisions the PO/SA has already taken (D1-D10). It introduces no decision of its own.

## 1. Context

PAEP-IB-01 §23 makes IB4 the Frappe adapter: session, typed list/detail/workflow/files/errors/realtime and compatibility checks. PAEP v1.1 places the ProSEIT-owned adapter `@proseit/frappe-sdk` at layer L2, behind the product-neutral contracts of `@proseit/paep-contracts`. The Generation 5 baseline had the adapter as an empty placeholder and no operation ports in the contracts (only `ReportingGateway`). The reference application is a separately hosted single-page application, the IB3 shell exposes synchronous signal-based ports, and the initial bundle must not contain the adapter (bundle-composition C1).

## 2. Decision

1. **Contract boundary vs adapter boundary.** `@proseit/paep-contracts` holds every type the rest of PAEP sees: framework-, Frappe-, DOM- and transport-neutral, type-only, Promise-based `*Gateway` ports. `@proseit/frappe-sdk` is the only place that knows Frappe: endpoint paths, DocType names, `exc_type` values, the CSRF header and the `modified` timestamp. No Frappe, Socket.IO, Engine.IO or browser-transport type crosses the boundary.
2. **Apps-only composition.** Only applications import `@proseit/frappe-sdk` (architecture matrix unchanged: enterprise, analytics and domain packages never import it). The reference application loads it with one dynamic `import()` so it stays out of the initial bundle (D7, C1 unchanged), and binds it to the existing IB3 shell ports.
3. **Server authority.** The server decides permissions, workflow transitions and file access. The adapter may refuse a request early (an unknown resource, an action absent from the latest server set, a file URL that fails the origin check) but never grants anything the server did not.
4. **Approved resources only.** The adapter is constructed with a compiled resource map from a neutral record-type key to a DocType and its allowlisted fields, sort keys and filter operators. Callers only ever pass the key. Runtime configuration carries no data-access content.
5. **Cookie session + CSRF (D3).** `identity.mode` stays `frappe-session`. The browser carries the session cookie; application and adapter code never read, parse, persist or write it. Credentialed requests go only to the configured backend origin. Every state-changing request (POST, PUT, PATCH, DELETE) carries the CSRF header and fails closed locally without a token. The token is obtained from the backend's `pmra-api-v1` session endpoint, held in memory only and never placed in `localStorage`, `sessionStorage`, IndexedDB, cookies, the DOM or a URL. Sign-out is a server call; local state is cleared whatever its result, and success is reported only on a server success. No bearer token. Nothing credential-like is logged or reported.
6. **Authentication entry (D6).** Login is the server-hosted Frappe login, reached through an approved redirect: the backend origin plus a fixed path, with a same-origin relative return path only. PAEP adds no `/login` route, screen or dialog.
7. **Errors.** Every failure becomes a `PaepError` with a controlled code and message key. Classification uses only the HTTP status and the `exc_type`; `_server_messages`, `exception`, `exc` and tracebacks are never surfaced. Correlation ids are generated per request (`X-Correlation-Id`) and replaced by a well-formed server id when one is returned.
8. **Concurrency and idempotency.** The server's `modified` value is the concurrency token (`ConcurrencyMetadata`); a stale write maps to `conflict`. A write carries an idempotency key that is preserved on every retry. Only retryable failures are retried, a bounded number of times.
9. **Freshness, Generation 6 implementation (D4).** Bounded polling of a lightweight change token per subscribed scope produces invalidation signals only. Signals carry no domain data; consumers reconcile through an authoritative read. Recovery after a failure, and reconnection, trigger reconciliation. Polling starts only on subscription and has an enforced minimum interval.
10. **Native socket transport deferred.** Frappe's Socket.IO realtime server is not used in Generation 6. A later generation may add a socket transport behind the same vendor-neutral port under separate governance.
11. **No new runtime dependency.** The transport is a framework-neutral, injectable `fetch` (no `HttpClient`, no client library). `package-lock.json`, dependencies, engines and the runtime-config schema are unchanged.
12. **`pmra-api-v1` compatibility contract (D10).** `pmra-api-v1` is the single identifier, in `backend.compatibility.apiContract`, of the backend API contract the Generation 6 adapter supports. It means: the Frappe/ERPNext REST resource and method interface the adapter calls (`/api/resource/...`, `frappe.auth.get_logged_user`, `logout`, `frappe.model.workflow.get_transitions`, `frappe.model.workflow.apply_workflow`), plus two backend methods published by the ProSEIT backend application: a compatibility method that returns the contract identifier and the supported PAEP range, and a session method that returns the CSRF token for the current session. The adapter checks compatibility fail-safe: compatible → protected integration may proceed; known incompatible → blocked; unknown or unverifiable → blocked and surfaced through the approved PAEP failure state. No other alias for this contract exists.
13. **Fixture-backed deterministic CI (D2).** Conformance is proven against recorded, synthetic, credential-free, versioned fixtures tied to the declared compatibility profile, with malformed, error and security cases as first-class fixtures. CI has no production backend, no live credentials and no Frappe runtime. A live pinned environment is optional later evidence.

## 3. Alternatives considered

* **Angular `HttpClient` transport:** rejected; it ties the adapter to Angular DI, would add `provideHttpClient` to the eager application graph and is not needed for testability.
* **Bearer or API-key authentication:** rejected (D3); it would put credentials in browser memory and code for convenience.
* **Socket.IO client dependency for realtime:** rejected for Generation 6 (D4); a new runtime dependency with licence review, bundle and CSP impact.
* **Adapter in the initial bundle:** rejected (D7); C1 stays unchanged.
* **A live Frappe instance in CI:** rejected for acceptance (D2); not deterministic and needs credentials.

## 4. Consequences

* The contracts gain operation ports and DTOs (additions only; API snapshot updated).
* A backend for PAEP must publish the two `pmra-api-v1` methods (compatibility and session/CSRF) and must be served same-site with the application (same origin, or a reverse proxy that keeps the session cookie first-party) with the backend origin listed in the deployment's CSP `connect-src`. A cross-site deployment is not supported by this decision.
* Idempotency keys protect against duplicate writes only where the backend method honours them; plain Frappe resource writes do not, so the adapter never claims a resource write is replay-safe.
* Freshness latency is bounded by the polling interval until a socket transport is governed.

## 5. Affected packages and contracts

`@proseit/paep-contracts` (additions), `@proseit/frappe-sdk` (implementation), `apps/reference-app` (lazy binding). No change to foundation, components, enterprise, i18n, observability, platform, analytics, offline or domain packages.

## 6. Portability and migration impact

The contracts stay backend-neutral, so an alternative backend adapter implements the same `*Gateway` ports with its own resource map, session model and compatibility identifier. Nothing outside the adapter and the composition root changes when a backend is replaced. Moving to a socket transport later changes only the adapter's freshness implementation behind the same port.

## 7. Rollback / exit

The adapter is composed only by applications and loaded lazily. Removing the binding returns the reference application to its sample providers; the contract additions are additive and can stay unused. Generation 5 remains the last accepted baseline until Generation 6 is promoted.
