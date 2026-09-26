# config

Runtime configuration schema and the non-secret example configuration (PAEP-IB-01 §5.2(iv), §9, Appendix C).

| File | Purpose |
| --- | --- |
| `runtime-config.schema.json` | Closed JSON Schema (2020-12 subset) for schema version `1.0`. Source of the generated validator in `packages/platform`. |
| `runtime-config.example.json` | A valid development example (cloud SaaS). Every URL uses the reserved `example.test` domain. |

Rules:

* Configuration is data, not code. It never contains secrets, credentials, tokens, database or ERP credentials, or analytical-store locators; the validator rejects them.
* Environment-specific configuration is deployed next to the built application at `config/runtime-config.json`, never compiled into it. One build serves every deployment profile.
* After editing the schema, regenerate the validator with `node tooling/config-validation/generate-validator.mjs`. CI fails when the generated file is out of date.

Guide: `docs/architecture/RUNTIME-CONFIGURATION-GUIDE.md`.

**Status:** delivered by IB1-CONTRACTS-CONFIG (IN PROGRESS; not accepted).
