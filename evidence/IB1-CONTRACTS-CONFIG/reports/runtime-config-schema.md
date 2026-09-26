# IB1-CONTRACTS-CONFIG — Runtime Configuration Schema

Source: `config/runtime-config.schema.json` (`$id` `https://schemas.proseit.org/paep/runtime-config/1.0/schema.json`, dialect `https://json-schema.org/draft/2020-12/schema`). Schema version `1.0`. Generated validator: `packages/platform/src/lib/runtime-config/generated/runtime-config-schema.validator.ts` (drift check: `node tooling/config-validation/generate-validator.mjs --check`).

Closed-schema rules, enforced by the generator (it refuses the schema otherwise): every object declares `additionalProperties: false`; every pattern is anchored `^…$`; `$ref` only to an earlier `$defs` entry; only the supported keywords.

Semantic and compatibility rules that a schema cannot express are in `packages/platform/src/lib/runtime-config/semantic.ts` and `compatibility.ts` (see `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md` §3.3).

## Fields

| Pointer | Required | Constraint |
| --- | --- | --- |
| `/` | yes | object; closed |
| `/schemaVersion` | yes | const "1.0" |
| `/product` | yes | object; closed |
| `/product/id` | yes | see `slug` |
| `/product/name` | yes | string; minLength 1; maxLength 120 |
| `/product/release` | yes | string; pattern `^(0\|[1-9][0-9]*)\.(0\|[1-9][0-9]*)\.(0\|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$`; minLength 5; maxLength 64 |
| `/product/brandProfile` | no | see `slug` |
| `/deployment` | yes | object; closed |
| `/deployment/environment` | yes | enum "development", "test", "staging", "production" |
| `/deployment/profile` | yes | enum "cloud-saas", "private-cloud", "on-premise" |
| `/deployment/basePath` | yes | string; pattern `^/([A-Za-z0-9][A-Za-z0-9._~-]*/)*$`; minLength 1; maxLength 256 |
| `/backend` | yes | object; closed |
| `/backend/apiBaseUrl` | yes | see `url` |
| `/backend/realtimeUrl` | no | see `nullableUrl` |
| `/backend/fileBaseUrl` | no | see `nullableUrl` |
| `/backend/compatibility` | yes | object; closed |
| `/backend/compatibility/apiContract` | yes | string; pattern `^[a-z][a-z0-9]*(-[a-z0-9]+)*-v[1-9][0-9]{0,2}$`; minLength 4; maxLength 64 |
| `/backend/compatibility/minimumPaep` | yes | see `paepVersion` |
| `/backend/compatibility/maximumPaep` | no | string\|null; pattern `^(0\|[1-9][0-9]{0,3})\.(0\|[1-9][0-9]{0,3})$`; maxLength 9 |
| `/identity` | yes | object; closed |
| `/identity/mode` | yes | enum "frappe-session", "oidc", "sso-proxy" |
| `/identity/issuer` | no | see `nullableUrl` |
| `/identity/clientId` | no | string\|null; pattern `^[A-Za-z0-9][A-Za-z0-9._:-]*$`; minLength 1; maxLength 128 |
| `/identity/scopes` | no | array; maxItems 32; unique; items: string; pattern `^[A-Za-z0-9][A-Za-z0-9:._/-]*$`; minLength 1; maxLength 128 |
| `/localisation` | yes | object; closed |
| `/localisation/defaultLocale` | yes | see `locale` |
| `/localisation/supportedLocales` | yes | see `localeList` |
| `/localisation/rtlLocales` | no | array; maxItems 50; unique; items: see `locale` |
| `/features` | yes | object; closed |
| `/features/capabilityDiscovery` | yes | enum "server", "manifest" |
| `/features/uiHints` | no | object; maxProperties 32; keys: pattern `^[a-z][A-Za-z0-9]{0,63}$`; values: boolean |
| `/telemetry` | yes | object; closed |
| `/telemetry/enabled` | yes | boolean |
| `/telemetry/endpoint` | no | see `nullableUrl` |
| `/telemetry/sampleRate` | no | number; minimum 0; maximum 1 |
| `/analytics` | yes | object; closed |
| `/analytics/enabled` | yes | boolean |
| `/analytics/reportingBaseUrl` | no | see `nullableUrl` |
| `/analytics/embeddedBi` | no | object; closed |
| `/analytics/embeddedBi/enabled` | yes | boolean |
| `/analytics/embeddedBi/provider` | no | see `slug` |
| `/pwa` | yes | object; closed |
| `/pwa/enabled` | yes | boolean |
| `/pwa/offlineProfile` | yes | enum "none", "drafts-only", "bounded-commands" |
| `/security` | no | object; closed |
| `/security/trustedTypesPolicyName` | no | string; pattern `^[a-z][a-z0-9-]{0,63}$`; minLength 1; maxLength 64 |
| `/security/cspProfile` | no | enum "strict" |

## Definitions

| Name | Constraint |
| --- | --- |
| `slug` | string; pattern `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`; minLength 1; maxLength 64 |
| `url` | string; pattern `^(https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\|http://(localhost\|127\.0\.0\.1\|\[::1\]))(:[1-9][0-9]{0,4})?(/[A-Za-z0-9._~-]+)*/?$`; minLength 1; maxLength 2048 |
| `nullableUrl` | string\|null; pattern `^(https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\|http://(localhost\|127\.0\.0\.1\|\[::1\]))(:[1-9][0-9]{0,4})?(/[A-Za-z0-9._~-]+)*/?$`; minLength 1; maxLength 2048 |
| `paepVersion` | string; pattern `^(0\|[1-9][0-9]{0,3})\.(0\|[1-9][0-9]{0,3})$`; maxLength 9 |
| `locale` | string; pattern `^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}\|[0-9]{3}))?$`; minLength 2; maxLength 16 |
| `localeList` | array; minItems 1; maxItems 50; unique; items: see `locale` |
