# IB1-CONTRACTS-CONFIG — Positive Test Report

Commit `7ae5bca`, fresh clone, clean `npm ci`, Node 24.21.0, npm 11.19.0 (`../logs/verification-7ae5bca/env.log`). Runner: Node's built-in `node:test`; every runner fails unless the executed test count equals the declared count and nothing is skipped.

| Suite | Command | Result | Log |
| --- | --- | --- | --- |
| Contracts QA | `npm run qa:contracts` | PASS 148/148 checks, 10 sections, 21 `node:test` tests (test doubles), 101 public exports | `../logs/verification-7ae5bca/qa-contracts.log` |
| Runtime-config QA | `npm run qa:runtime-config` | PASS 24/24 checks; 187/187 tests (20 positive, 143 negative, 24 loader/startup) | `../logs/verification-7ae5bca/qa-runtime-config.log` |
| Generator drift | `node tooling/config-validation/generate-validator.mjs --check` | OK (schema sha256 `819dc92b…`) | `../logs/verification-7ae5bca/generator-check.log` |
| Portability (positive scenarios) | `npm run qa:runtime-config:portability` | S1 cloud-saas production, S2 private-cloud staging, S3 on-premise production, S4 same bundle under `/erp/`: all ready | `../logs/verification-7ae5bca/qa-runtime-config-portability.log` |
| Strict typecheck | `npm run qa:types` | PASS (no diagnostics) | `../logs/verification-7ae5bca/qa-types.log` |
| Architecture | `npm run qa:architecture` | PASS: 3 edges, 0 violations | `../logs/verification-7ae5bca/qa-architecture.log` |
| Production builds | `npm run build:reference-app`, `npm run build:ui-lab` | PASS | `../logs/verification-7ae5bca/build-*.log` |

Positive coverage includes: every valid fixture (`tooling/config-validation/fixtures/valid/`: cloud-saas, private-cloud, on-premise, OIDC, development loopback, minimal) and the IB-01 §9.3 example; every profile × environment combination of the base fixture; deep-frozen, null-prototype store; compatibility report; once-only startup; the committed example and the reference-app configuration validated with the reference-app build context; contract positive fixtures (Appendix D shapes, §9.3 example) with 0 diagnostics; test doubles (in-memory reporting gateway, runtime-config store, session outcome).
