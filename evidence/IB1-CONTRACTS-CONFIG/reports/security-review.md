# IB1-CONTRACTS-CONFIG — Security Review

Scope: the runtime-configuration boundary (the only IB1 surface that handles untrusted input) and the CI/governance changes. Reviewed by the implementation lanes and by independent QA Q3–Q6 (rounds 1 and 2, `independent-qa.md`).

## Threats and controls

| Threat | Control | Evidence |
| --- | --- | --- |
| Secrets or credentials shipped in configuration | Content guard rejects secret key names (token-split), secret value shapes (PEM, JWT, bearer/basic, cloud and SaaS key formats, credential assignments after whitespace or a URL delimiter, URL userinfo anywhere in text) and secret-shaped keys; the example and fixtures hold none | content negatives; mutations M11, M12, M40; W08 and WP02–WP04 secret scans |
| Browser given direct data access | Database, ERP, object-store and analytical-store locators (`postgres:`, `jdbc:`, `s3:`, `Server=…;` and others) and data-access key names rejected | content negatives; mutation M14 |
| Script or markup injection | `javascript:`, `data:`, `vbscript:`, markup and event-handler text rejected; failure page built with `textContent` from fixed strings | content negatives; mutation M13; portability F6 |
| Unicode spoofing | Control, bidi, zero-width, tag and lone-surrogate characters rejected; punycode hosts rejected | content and semantic negatives; mutation M15 |
| Parser attacks | Strict UTF-8 (no BOM, overlongs, surrogates), own JSON parser (duplicate keys, `__proto__`/`constructor`/`prototype`, depth 8, non-finite numbers), 64 KiB limit, null-prototype objects | parse negatives; prototype-pollution test; 400-case byte-mutation test; mutations M01–M09 |
| Insecure or internal endpoints | https only; http only for loopback in development; canonical numeric hosts only (every environment); loopback, private, CGNAT and private-name hosts refused in staging/production; bounded ports; no dot path segments | semantic and schema negatives; mutations M19, M20, M36, M37 |
| Information leakage in diagnostics | Issue paths truncated at the first document-supplied key; values never echoed; issues capped at 20; diagnostic id is code + FNV-1a fingerprint | redaction negatives; mutation M38 |
| Fail-open startup | Once-only latch; only validator-produced stores accepted; any exception or odd outcome is CFG_INTERNAL; bootstrap failure shows the fail-safe page | startup tests; mutations M28–M31 |
| Loader abuse | same-origin mode, no-store, `redirect: 'error'` plus redirect/url checks, strict JSON content type, declared and actual size limits | loader tests; mutations M32–M35 |
| CI or baseline weakening | New jobs mandatory in `PAEP / gate`; the CI policy may only add jobs relative to the accepted baseline (gate, commands and workflow policy fixed); no check may be skipped; generation 3 CANDIDATE only | W11, W12; WP05 negatives K01–K08; `qa:baseline` |

## Residual security risks

See `residual-risk.md` (RR1–RR4 concern security).
