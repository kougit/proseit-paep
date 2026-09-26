# @proseit/paep-platform

**Status:** runtime-configuration subsystem implemented by IB1-CONTRACTS-CONFIG (IN PROGRESS; not accepted). Other platform abstractions remain IB3.

**Layer:** L1 - Cross-cutting platform (PAEP-IB-01 §6.1)

**Responsibility:** Browser/platform abstractions (secure storage, connectivity, clipboard, download, viewport, environment) and runtime configuration store.

**Implementation milestone:** IB1 (runtime configuration, PAEP-IR-01 IB1-WP4/WP5); IB3 (everything else, including Angular providers and the error experience).

Consumers import this package only through its public entry point `src/index.ts` (PAEP-IB-01 §6.2).

## Runtime configuration (IB1)

`src/lib/runtime-config/` is framework-neutral (no Angular, no DOM types) and has no dependency:

| Module | Role |
| --- | --- |
| `load.ts` | `loadRuntimeConfig`: fetches `config/runtime-config.json` same-origin, no-store, no redirects; never throws |
| `strict-json.ts` | strict UTF-8 decoding and a strict JSON parser (duplicate keys, prototype keys, depth limits) |
| `content-guard.ts` | rejects secrets, markup, data-store locators and unsafe characters |
| `generated/` | validator generated from `config/runtime-config.schema.json` (do not edit) |
| `semantic.ts`, `compatibility.ts` | environment, identity, security, product and PAEP-range rules |
| `validate.ts` | the ordered pipeline; returns a frozen success or a frozen failure with a diagnostic id |
| `startup.ts` | `startWithRuntimeConfig`: once-only fail-safe gate before the application starts |

Guide: `docs/architecture/RUNTIME-CONFIGURATION-GUIDE.md`.
