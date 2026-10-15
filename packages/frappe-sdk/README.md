# @proseit/frappe-sdk

**Status:** IB4-FRAPPE-ADAPTER (Generation 6 CANDIDATE). Implements the approved PAEP contracts against a Frappe/ERPNext
backend that exposes the `pmra-api-v1` methods.

**Layer:** L2 - Adapter (PAEP-IB-01 §6.1). Depends only on `@proseit/paep-contracts` (types). Never imports PAEP UI or
product packages; applications load it lazily with one dynamic `import()`.

**Design:** [docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md](../../docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md) and
[ADR-011](../../docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md).

## Public entry point

| Export | Purpose |
| --- | --- |
| `createFrappeAdapter(options)` | Session, records, workflow, files, capabilities, compatibility and freshness gateways over one transport. |
| `compileResourceMap(definition)` | Validates the approved resource map; the adapter accepts only a compiled map, so no free-form DocType or path reaches the backend. |
| `createFreshnessPoller(options)` | Bounded polling (5–300 s) of the freshness gateway, with a resync after recovery or reconnect. |
| `isPaepError(value)` | Narrows an adapter failure to the contracts' `PaepError` (category, code, `paep.errors.<category>` message key, correlation id). |

## Rules it enforces

- Cookie session with `credentials: 'include'`, `redirect: 'error'` and `cache: 'no-store'`; the backend origin must be HTTPS and origin-only.
- The CSRF token is held in memory only and sent as `X-Frappe-CSRF-Token` on state-changing requests; it is never stored, logged or returned.
- Bounded retry of retryable failures only; a state-changing request is retried only with an idempotency key.
- Server error text, tracebacks and `_server_messages` never leave the adapter; callers get a category, code and reference.
- Login goes to the server-hosted Frappe login with an application-relative return path; PAEP has no login screen.

## Verification

`node tooling/frappe-adapter/run-frappe-tests.mjs --suite unit|integration`, `node tooling/frappe-adapter/frappe-qa.mjs`
and `node tooling/frappe-adapter/frappe-qa-negative.mjs` (CI job `frappe-adapter`).
