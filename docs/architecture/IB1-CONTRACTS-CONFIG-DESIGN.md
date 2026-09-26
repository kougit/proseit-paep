# IB1-CONTRACTS-CONFIG — Design

Work package: `work-packages/IB1-CONTRACTS-CONFIG/WORK_PACKAGE.md`. Controlling sources: PAEP v1.1 §7, §9, §13, §19; PAEP-IB-01 §6, §7, §9, Appendices B, C, D; PAEP-IR-01 §5.6 IB1-WP1..WP6; PAEP-EQP-01.

## 1. Package placement

| Concern | Package | Reason |
| --- | --- | --- |
| Contract types (including the runtime-config shapes and outcome) | `@proseit/paep-contracts` (L0) | IB-01 §6.1: product-neutral typed contracts |
| Loader, validator, store, startup gate | `@proseit/paep-platform` (L1) | IB-01 §6.1 and the platform README: "runtime configuration store"; IR-01 IB1-WP4/WP5 |
| Schema, example | `config/` | IB-01 §5.2(iv) |
| Validator generator, tests, portability proof | `tooling/config-validation/` | IB-01 §5.2 (tooling, not bundled) |
| Test doubles | `tooling/test-utils/` | IB-01 §8.2 |
| Bootstrap wiring | `apps/reference-app/src/main.ts` | Authorised minimum wiring (instruction §2C); the Angular provider layer and error experience stay IB3 (IR-01 §9(i)) |

Architecture edges added (all allowed by Appendix B): `platform → contracts`, `reference-app → platform`, `reference-app → contracts`. `arch:check` reports 0 violations.

## 2. Contract design rules

1. Type-only (`export type *` barrel); no runtime value, class or side effect.
2. Every property `readonly`; arrays `readonly T[]`; records `Readonly<Record<…>>`.
3. No `any`; unions are closed string literals; optional properties use `exactOptionalPropertyTypes` semantics.
4. Compiles standalone with `lib: ["ES2022"]`, `types: []` (no DOM, no Node) — enforced by `packages/contracts/tsconfig.json` and the architecture checker's CONTRACTS_NEUTRAL rule.
5. Reporting shapes follow IB-01 Appendix D, which takes precedence over the IR-01 examples. Deliberate tightenings, listed for PO/SA review in `packages/contracts/README.md`: `unknown` values narrowed to `ScalarValue`/`FilterValue`, report cells and totals typed `ReportCellValue` (scalar or `MoneyValue`), `FieldDataType` adds `'duration'`, metrics may declare `aggregation`, and `ExportJob` carries the optional `error` of `JobStatus`.
6. Offline contracts are envelopes and conflict descriptions only; no queue (offline is out of scope).

## 3. Runtime-configuration design

### 3.1 Schema

`config/runtime-config.schema.json` is a closed JSON Schema 2020-12 subset: every object has `additionalProperties: false`; every string has a pattern, enum or length bound; every array has `maxItems`. Required top-level keys follow IB-01 Appendix C; `security` is optional except in production (semantic rule). Schema version `1.0`; PAEP compatibility line `1.1`.

### 3.2 Validator without a dependency

No schema-validator library is added (authorising instruction: no new dependency). `tooling/config-validation/generate-validator.mjs` compiles the schema into plain TypeScript. It supports only the keywords the schema uses and refuses (fails closed) on any other keyword, an unanchored pattern, an object without `additionalProperties`, or an external or forward `$ref`. `--check` fails CI when the generated file differs from the schema.

### 3.3 Validation pipeline (first failing stage wins)

| # | Stage | Rejects |
| --- | --- | --- |
| 1 | load | network error, redirect, non-200, non-JSON content type, empty body, body over 64 KiB |
| 2 | decode | BOM, invalid UTF-8 |
| 3 | parse | syntax errors, duplicate keys, `__proto__`/`constructor`/`prototype`, depth over 8, non-finite numbers; builds null-prototype objects |
| 4 | version | missing or unsupported `schemaVersion` (future versions fail; no silent downgrade) |
| 5 | content | secrets (key and value shapes), markup and script URLs, database/ERP/analytical-store locators, unsafe Unicode, `$`/`@` keys |
| 6 | schema | the generated closed-schema validator |
| 7 | semantic | https only (http only for loopback in development); no loopback or private hosts in staging/production; no IDN (`xn--`) hosts in any environment; locale rules; OIDC consistency; telemetry and analytics endpoints; registered embedded-BI providers; PWA consistency; production needs a CSP profile; `basePath` equals the document base |
| 8 | compatibility | wrong product id, unsupported API contract, PAEP outside the backend's `minimumPaep`–`maximumPaep` range |

Failure: a frozen `{ ok: false, stage, code, issues (≤ 20, each {stage, code, path}), diagnosticId }`. Values and unknown key names are never echoed. `diagnosticId` is `PAEP-<CODE>-<fnv8>` (FNV-1a of the bytes), or `PAEP-<CODE>-nodoc` when no document was received (load and startup failures), so support can correlate without seeing the content. Any unexpected exception becomes `CFG_INTERNAL`.

Success: a deep-frozen `{ ok: true, store: { config, compatibility, configId } }`.

### 3.4 Fail-safe startup and bootstrap sequence

```
main.ts
  └─ startWithRuntimeConfig({ load, onReady, onFailure })     (once-only latch)
       ├─ loadRuntimeConfig(context, { fetch, configUrl, documentBasePath })
       │     fetch config/runtime-config.json  (same-origin, no-store, redirect: error)
       │     └─ validateRuntimeConfigBytes → stages 1–8
       ├─ ok + frozen  → onReady(store)
       │                  set data-paep-config="ready", data-paep-profile
       │                  bootstrapApplication(App, { providers: [RUNTIME_CONFIG_STORE = store] })
       └─ otherwise    → onFailure(failure)
                          replace the page with a fixed alert (title, text, diagnostic id)
                          set data-paep-config="failed"; Angular never starts
```

Not allowed, and tested: partial startup, silent defaults, a localhost or built-in fallback, a mutable or emergency configuration, disabling security to start, a second startup (`CFG_STARTUP_REPEATED`).

### 3.5 Deployment portability

The build embeds no endpoint or profile. The same output starts as cloud SaaS, private cloud and on-premise by changing only the deployed `config/runtime-config.json`; the portability proof hashes the build before and after every scenario.

## 4. Decisions

| # | Decision | Reason |
| --- | --- | --- |
| D1 | One work package covers IR-01 IB1-WP1..WP6 | The PO/SA instruction authorises IB1 as one delivery |
| D2 | Tests use Node's built-in `node:test`, not Vitest | No new dependency; IB-01 names Vitest as the unit-test default, so this is recorded for the PO/SA (decision card in the IB1 thread) |
| D3 | Own validator generator instead of a schema library | No new dependency; the closed subset is small and fully tested |
| D4 | PAEP compatibility version `1.1` | PAEP v1.1 is the controlling architecture |
| D5 | Configuration signing is not implemented | Not required by the controlling sources for IB1; same-origin, no-store loading and strict validation apply |
| D6 | Angular providers, error UX and the other platform abstractions stay IB3 | IR-01 §9(i) |
| D7 | Reuse the accepted registry bound for historical-verifier findings caused by filling the entry points and adding the first edges | `WORK_PACKAGE.md` §7 |
