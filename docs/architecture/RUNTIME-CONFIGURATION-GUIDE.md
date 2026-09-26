# Runtime Configuration Guide

For operators deploying a PAEP application and for developers changing the schema. Design: `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md`.

## 1. What it is

A PAEP application is built once. Everything that differs between deployments (backend URLs, identity mode, locales, telemetry, analytics, PWA, security profile) is read at startup from one JSON file served next to the application:

```
<base path>/config/runtime-config.json
```

If the file is missing, invalid, unsafe or incompatible, the application does not start. It shows a short message and a diagnostic id such as `PAEP-CFG_URL_INSECURE-1a2b3c4d`. There is no fallback configuration.

## 2. Deploying

1. Start from `config/runtime-config.example.json`.
2. Set `deployment.environment` (`development`, `test`, `staging`, `production`) and `deployment.profile` (`cloud-saas`, `private-cloud`, `on-premise`).
3. Set `deployment.basePath` to the path the application is served under. It must match the page's `<base href>`. To serve the same build under a sub-path such as `/erp/`, set `<base href="/erp/">` in the deployed `index.html` (the only file that changes; scripts and styles stay byte-identical) and `basePath` to `/erp/`. A mismatch fails with `CFG_BASE_PATH`.
4. Set the backend URLs. They must be `https://`; `http://` is accepted only for `localhost`, `127.0.0.1` or `[::1]` in `development`. In `staging` and `production` the host must be a public name (no loopback or private address). Punycode (`xn--`) host names are rejected in every environment.
5. Choose the identity mode. `oidc` needs `issuer`, `clientId` and the `openid` scope. Other modes must leave the OIDC fields `null`/empty.
6. For `production`, include `security.cspProfile: "strict"`.
7. Serve the file with `Content-Type: application/json`, status 200, no redirect, from the same origin as the application. Prefer `Cache-Control: no-store`.

The file must never contain passwords, client secrets, tokens, API keys, private keys, database or ERP credentials, or data-store connection strings. The validator rejects them by key name and by value shape.

## 3. Failure codes

The code in the diagnostic id tells you which rule failed. The stage runs in this order; the first failing stage is reported.

| Stage | Codes (prefix `CFG_`) | Usual cause |
| --- | --- | --- |
| load | `LOAD_*` | file missing (404), wrong content type (for example an HTML fallback page), redirect, empty or over 64 KiB |
| decode | `DECODE_UTF8`, `DECODE_BOM` | file not saved as UTF-8 without BOM |
| parse | `PARSE_*` | JSON syntax error, duplicate key, nesting too deep |
| version | `VERSION_MISSING`, `VERSION_UNSUPPORTED` | `schemaVersion` absent or newer than this build supports |
| content | `CONTENT_SECRET`, `CONTENT_DATA_ACCESS`, `CONTENT_MARKUP`, `CONTENT_TEXT`, `CONTENT_KEY` | a secret, a database/ERP locator, HTML or script, or unsafe characters |
| schema | `SCHEMA_*` | unknown key, missing key, wrong type or format |
| semantic | `URL_*`, `LOCALE_*`, `IDENTITY_*`, `TELEMETRY_ENDPOINT`, `ANALYTICS_ENDPOINT`, `EMBEDDED_BI`, `PWA_PROFILE`, `SECURITY_PROFILE`, `PAEP_RANGE`, `BASE_PATH` | values valid on their own but inconsistent or unsafe for the environment |
| compatibility | `COMPAT_PRODUCT`, `COMPAT_API_CONTRACT`, `COMPAT_PAEP` | configuration for another product, API contract or PAEP version |
| startup | `STARTUP_REPEATED` | the startup gate was called twice |
| internal | `INTERNAL` | unexpected error; the application still does not start |

The message never repeats configuration values, so it is safe to share with support.

## 4. Changing the schema (developers)

1. Edit `config/runtime-config.schema.json`. Keep it closed: `additionalProperties: false`, anchored patterns, bounded arrays. The generator refuses anything else.
2. Update the contract types in `packages/contracts/src/lib/config/runtime-config.ts`.
3. Regenerate: `node tooling/config-validation/generate-validator.mjs`.
4. Update the example and fixtures, then run `npm run qa:ib1` and `npm run qa:ib1:negative`.
5. A change that rejects previously valid files needs a new `schemaVersion` and PO/SA approval.

## 5. Commands

| Command | What it checks |
| --- | --- |
| `npm run qa:contracts` | contracts compile alone, public API, neutrality, test doubles |
| `npm run qa:runtime-config` | generator drift, schema, validator, loader, startup positive and negative tests |
| `npm run qa:runtime-config:negative` | mutation tests: each validator rule, when removed, is caught |
| `npm run qa:runtime-config:portability` | one production build started in headless Chromium with cloud, private-cloud and on-premise files, and failing safely on bad files |
