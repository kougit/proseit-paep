# IB1-CONTRACTS-CONFIG — Deployment-Profile Evidence

Command: `npm run qa:runtime-config:portability` (`tooling/config-validation/portability-proof.mjs`). Commit `7ae5bca`, fresh clone. Log: `../logs/verification-7ae5bca/qa-runtime-config-portability.log`. Result: **PASS 17/17**.

Method: the reference app is built **once** in production configuration. Each scenario serves that exact output with a different `config/runtime-config.json` and loads it in headless Chromium (`--dump-dom`). The build output is hashed before and after all scenarios.

| ID | Scenario | Served configuration | Outcome |
| --- | --- | --- | --- |
| B1 | Build once | — | build output sha256 `95a7e7c1…32ad2` |
| B2 | No environment endpoint in the bundle | — | none of the example endpoints appear |
| S1 | Cloud SaaS | `cloud-saas`, `production` | ready, profile `cloud-saas`, app rendered |
| S2 | Private cloud | `private-cloud`, `staging`, OIDC | ready, profile `private-cloud`, app rendered |
| S3 | On-premise | `on-premise`, `production`, SSO proxy, no external telemetry or analytics | ready, profile `on-premise`, app rendered |
| S4 | On-premise under a sub-path | same bundle served under `/erp/`; only `index.html` `<base href>` set at deploy time; `basePath` `/erp/` | ready, app rendered; every file except `index.html` byte-identical to the build |
| F1–F9 | Malformed JSON, future schema, incompatible PAEP range, other product, secret, unsafe scheme, 404, HTML fallback, insecure http in production | — | fail-safe page with the expected code; Angular never rendered; configuration not echoed |
| B3 | Identical build throughout | — | sha256 before = after |

Conclusion: the same build is deployment-portable across cloud SaaS, private cloud and on-premise (including sub-path hosting) by changing only deployed configuration, and fails safe on invalid configuration (PAEP v1.1 §19 QAC-PORT-01; IB-01 §9).
