# tooling/test-utils

Shared test doubles, harnesses and contract-test fixtures (PAEP-IB-01 §8.2). Not part of any production bundle; nothing under `packages/` or `apps/` imports this folder (checked by `qa:contracts` S10).

| Path | Content |
| --- | --- |
| `src/in-memory-reporting-gateway.ts` | `InMemoryReportingGateway`, a deterministic `ReportingGateway` with seeded datasets and a staged export job |
| `src/runtime-config-store.ts` | `createTestRuntimeConfigStore(overrides)`: a deep-frozen store for tests, from a base configuration the real validator accepts |
| `src/session-outcome.ts` | `createTestSessionOutcome(status, …)` |
| `src/deep-freeze.ts`, `src/index.ts` | helpers and the entry point for the doubles |
| `test/*.test.mjs` | `node:test` suites for the doubles |
| `fixtures/` | positive contract fixtures (type-checked with `satisfies`) |
| `contract-api-report.json` | reviewed snapshot of the contracts public API; a change fails `qa:contracts` until reviewed (`--update`) |
| `contracts-qa.mjs` | `npm run qa:contracts`: independent compile, public API, type-only surface, neutrality, negative fixtures, doubles |

The doubles import contracts with `import type` only and contain no Frappe or framework fake.

**Status:** delivered by IB1-CONTRACTS-CONFIG (ACCEPTED by the PO/SA, 2026-09-26).
