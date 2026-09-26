# tooling/config-validation

Development/CI tooling for the runtime-configuration schema, validator and startup (IB1). Not part of any production bundle.

| Path | Command | Purpose |
| --- | --- | --- |
| `generate-validator.mjs` | `node tooling/config-validation/generate-validator.mjs [--check]` | Generates `packages/platform/src/lib/runtime-config/generated/runtime-config-schema.validator.ts` from `config/runtime-config.schema.json`; refuses unsupported schema constructs; `--check` fails on drift |
| `runtime-config-qa.mjs` | `npm run qa:runtime-config` | Generator drift and refusal checks, schema hash binding, platform compile, the `node:test` suites (exact expected count, no skipped tests), `validate-configs.mjs` |
| `negative-runtime-config.mjs` | `npm run qa:runtime-config:negative` | Mutation tests: each validator, loader and startup safeguard is removed in a scratch copy and the suites must catch it |
| `portability-proof.mjs` | `npm run qa:runtime-config:portability` | One production build of the reference app, started in headless Chromium with cloud-SaaS, private-cloud and on-premise files, and failing safely on bad files |
| `validate-configs.mjs` | (run by `qa:runtime-config`) | Validates `config/runtime-config.example.json`, every `apps/*/public/config/*.json` and the fixture manifest |
| `test/` | | `node:test` suites (positive, negative, loader and startup) |
| `fixtures/` | | Valid and invalid configuration documents and `manifest.json` (credential-like inputs are built at runtime; the committed manifest holds only obviously fake `example.test` values such as `https://u:p@…`) |
| `lib/compile-platform.mjs` | | Compiles `packages/platform` with the TypeScript API into `os.tmpdir()` for the tests |

All tools write only to `os.tmpdir()` and, when set, `$PAEP_EVIDENCE_DIR`. When adding a test, update `EXPECTED_TESTS` in `runtime-config-qa.mjs`.

**Status:** delivered by IB1-CONTRACTS-CONFIG (IN PROGRESS; not accepted).
