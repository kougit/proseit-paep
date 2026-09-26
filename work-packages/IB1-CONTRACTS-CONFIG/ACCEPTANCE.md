# IB1-CONTRACTS-CONFIG — Acceptance Criteria

All criteria are mandatory. PASS is technical; ACCEPTED is the PO/SA's decision.

| ID | Criterion | Verification |
| --- | --- | --- |
| IB1-AC01 | Pre-flight (i)–(xvi) on `origin/main`: generation 2 ACCEPTED and active, no candidate, IB0 and R7 gates green, main CI green | `evidence/IB1-CONTRACTS-CONFIG/reports/preflight.md` |
| IB1-AC02 | `@proseit/paep-contracts` exposes the catalogue through one type-only entry point; every property readonly; no `any` | `qa:contracts` (public API, readonly and shape tests); contract catalogue report |
| IB1-AC03 | Contracts are framework-neutral: compile alone with `lib: ES2022`, `types: []`; no Angular, Frappe/ERPNext, DOM, chart, domain or app import | `qa:contracts`; `qa:architecture` CONTRACTS_NEUTRAL; negative neutrality cases |
| IB1-AC04 | Reporting contracts match IB-01 Appendix D; offline contracts are envelopes only | `qa:contracts`; catalogue review |
| IB1-AC05 | Test doubles implement the contracts without framework dependencies | `qa:contracts` |
| IB1-AC06 | Runtime-configuration schema is versioned and closed (every object `additionalProperties: false`, bounded strings and arrays), covering IB-01 Appendix C | `qa:runtime-config` schema tests; `runtime-config-schema.md` |
| IB1-AC07 | Validator is generated from the schema with no dependency; the generator refuses unsupported constructs; drift fails CI | `qa:runtime-config` generator tests; `generate-validator.mjs --check` |
| IB1-AC08 | Strict loading: same-origin, no-store, no redirect, JSON content type, size limit; strict UTF-8 and JSON (duplicate keys, prototype keys, depth, non-finite numbers) | `qa:runtime-config` loader and parser tests |
| IB1-AC09 | Secrets, credentials, data-store locators, markup and unsafe characters are rejected and never echoed | `qa:runtime-config` content tests; portability F5 |
| IB1-AC10 | Semantic rules (https, host policy by environment, locale, identity, telemetry, analytics, embedded BI, PWA, security, base path) enforced | `qa:runtime-config` semantic tests |
| IB1-AC11 | Compatibility: product id, API contract and PAEP range checked against the build context; unsupported schema versions fail | `qa:runtime-config` compatibility tests; portability F2–F4 |
| IB1-AC12 | Fail-safe startup: no partial start, no silent default, no localhost fallback, no mutable or emergency configuration, no disabled security; fixed diagnostic id | `qa:runtime-config` startup tests; portability F1–F9 |
| IB1-AC13 | Store is deep-frozen and set once; a second startup fails | `qa:runtime-config` freeze and latch tests |
| IB1-AC14 | Same build serves cloud SaaS, private cloud and on-premise; build output unchanged across scenarios; no endpoint embedded | `qa:runtime-config:portability` B0–B3, S1–S3 |
| IB1-AC15 | Every validator rule is shown to matter: removing it is detected | `qa:runtime-config:negative` |
| IB1-AC16 | Reference app: minimum wiring only (gate before `bootstrapApplication`, one injection token); no shell, UI or domain work | review of `apps/reference-app/src/`; W05 scope |
| IB1-AC17 | Architecture: only Appendix B edges; 0 violations | `qa:architecture` |
| IB1-AC18 | No new dependency; lockfile byte-identical; clean `npm ci` | W06; setup action; lockfile hash |
| IB1-AC19 | Strict typecheck and both production builds pass | `qa:types`; `build:reference-app`; `build:ui-lab` |
| IB1-AC20 | Baseline governance: generation 2 ACCEPTED and active; generation 3 CANDIDATE with exact scope; every change in scope | `qa:baseline` B01–B13; `qa:baseline:negative` |
| IB1-AC21 | IB0 regressions (WP01–WP05, WP05 negatives) pass with only the bounds in `WORK_PACKAGE.md` §7 | `qa:ib0-wp05`; `qa:ib0-wp05:negative` |
| IB1-AC22 | CI: `PAEP / contracts`, `PAEP / runtime-config`, `PAEP / runtime-config-negative` run in parallel and feed the unchanged `PAEP / gate` | W11, W12; WP05 negatives I01–I03 |
| IB1-AC23 | No secret in source, fixtures, logs or evidence | W08; WP02–WP04 secret scans |
| IB1-AC24 | Controlled sources and CLAUDE.md unchanged; no Nx | W02, W04 |
| IB1-AC25 | Evidence set, traceability, residual risks and readiness report complete | `evidence/IB1-CONTRACTS-CONFIG/`; `TRACEABILITY.csv`; `ACCEPTANCE_REPORT.md` |
| IB1-AC26 | Independent QA with no open High or Medium finding | `evidence/IB1-CONTRACTS-CONFIG/reports/independent-qa.md` |
| IB1-AC27 | One ready PR to `main`; real GitHub Actions run with `PAEP / gate` success on the exact head; mergeable; not merged; generation 3 CANDIDATE; IB2 not started | `evidence/IB1-CONTRACTS-CONFIG/reports/ci-report.md` |
