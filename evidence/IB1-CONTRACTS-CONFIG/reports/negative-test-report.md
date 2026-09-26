# IB1-CONTRACTS-CONFIG — Negative Test Report

Commit `7ae5bca`, fresh clone (`../logs/verification-7ae5bca/`).

| Suite | Result | Log |
| --- | --- | --- |
| Runtime-config negative tests (`qa:runtime-config`, file `runtime-config-negative.test.mjs`) | 143/143 | `../logs/verification-7ae5bca/qa-runtime-config.log` |
| Loader and startup negatives (`runtime-config-loader-startup.test.mjs`) | included in 24/24 | same |
| Mutation tests (`npm run qa:runtime-config:negative`) | 40/40 mutations killed, 0 survived, control passed | `../logs/verification-7ae5bca/qa-runtime-config-negative.log` |
| Portability fail-safe scenarios F1–F9 (headless Chromium) | 9/9 fail safe; Angular never rendered; no content echoed | `../logs/verification-7ae5bca/qa-runtime-config-portability.log` |
| Contracts negative fixtures and neutrality injections (`qa:contracts` S5, S7) | 32/32 and 19/19 | `../logs/verification-7ae5bca/qa-contracts.log` |
| IB0-WP05 CI-control negatives (`qa:ib0-wp05:negative`) | PASS 98/98 (10 controls, 88 negatives), including IB1 cases K01–K08 and GJ10–GJ12 | `../logs/verification-7ae5bca/qa-ib0-wp05-negative.log` |
| Baseline-governance negatives (`qa:baseline:negative`) | PASS 105/105 | `../logs/verification-7ae5bca/qa-baseline-negative.log` |

## Runtime-config negative coverage

| Stage | Examples (each asserts stage, code, bounded issues, and that no probe value or key is echoed) |
| --- | --- |
| load | empty body, over 64 KiB, 404, redirect, wrong content type, declared length too large, network error |
| decode | BOM, overlong and surrogate UTF-8, truncated sequences, 400-case byte-mutation robustness |
| parse | syntax errors, duplicate keys (root, nested, escaped), `__proto__`/`constructor`/`prototype`, depth over 8, `1e400`, non-object root, trailing content |
| version | missing, unsupported, future |
| content | secret key names and secret-shaped keys, secret values (PEM, JWT, bearer, cloud keys, credential assignments, URL userinfo), data-store locators, markup and script URLs, unsafe Unicode, `$`/`@` keys |
| schema | unknown keys at every level, missing required keys, types, enums, patterns, lengths, bounds, uiHints limits, ports above 65535, dot path segments |
| semantic | http outside development, non-canonical numeric hosts (`127.1`, `2130706433`, `0x7f000001`, `0177.0.0.1`, …), loopback/private/CGNAT/private-name hosts in staging and production, punycode, locales, OIDC, telemetry, analytics, embedded BI, PWA, production security, base path, PAEP range |
| compatibility | product id, API contract, PAEP minimum and maximum |
| startup / internal | repeated start, forged frozen outcome, unfrozen outcome, null outcome, load exception, onReady rejection, malformed build context |

## Mutation kill matrix

M01–M40 remove or weaken one safeguard each (duplicate keys, forbidden keys, depth, numbers, BOM, UTF-8, schema version, size, issue bound, secret values and keys, markup, data access, unsafe text, `$` keys, closed schema, patterns, insecure URL, punycode, base path, PAEP range, production security, compatibility checks, product id, deep freeze, startup catch, onReady on failure, validated-store check, latch, loader redirect/content type/length/status, numeric hosts, private names, path redaction, build-context check, secret-shaped keys). Every mutant is killed by at least one test.
