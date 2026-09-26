# IB1-CONTRACTS-CONFIG — Residual Risks

Open risks after technical PASS, for PO/SA acceptance. None is High or Medium.

| ID | Risk | Severity | Mitigation now | Owner / trigger |
| --- | --- | --- | --- | --- |
| RR1 | The content guard is pattern-based: some credential phrasings in free text (for example `token <value>`, base64 blobs) and some HTTPS analytical-store hosts (for example `*.snowflakecomputing.com`) are not recognised (QA Q3-2) | Low | Only `product.name` is free text; all endpoints are https and reach the browser anyway; configuration is non-secret by policy and reviewed at deployment | Security review at the release gate |
| RR2 | Some default-ignorable characters (U+034F, U+2800, U+FE0F …) are accepted (QA Q3-3) | Low | Bidi, zero-width, tag and control characters are rejected | Next change to the content guard |
| RR3 | Some legitimate product names are rejected, e.g. `Oracle: Retail` (QA Q3-4) | Low | Fails safe; the operator sees a fixed diagnostic | On first real report |
| RR4 | Guard regexes can take about 300 ms on a crafted 64 KiB value (QA Q3-5) | Low | Bounded by the 64 KiB limit; runs once at startup | Next change to the content guard |
| RR5 | `rtlLocales` is not checked against real right-to-left scripts; production does not require `trustedTypesPolicyName` (QA Q4-4) | Info | Policy points left to the i18n and security work packages (IB-01 §11) | IB2/IB3 |
| RR6 | The verifier, the WP05 negative suite and the CI policy are inside the CANDIDATE scope (`policyChange: true`), so an edit to the verifier's own checks is not detectable by any automated gate (QA round 2, item 4(f)); the same holds for the IB1-PREFLIGHT-R7 design | Low | PO/SA diff review of `tooling/verification/*` and `.github/` before acceptance (listed in `ACCEPTANCE_REPORT.md`); the accepted-policy floor makes a policy-only weakening fail | PO/SA review; a future ADR could pin the verifier or run the accepted baseline's verifier in CI |
| RR7 | Generator hardening: the "anchored" check is textual, and bounds (`maxLength`, `maxItems`) are required by review rather than by the generator (QA Q2-4, Q2-5) | Low | The current schema is fully anchored and bounded (verified against Ajv 8, 60,024 cases, 0 mismatches) | Next schema change |
| RR8 | Contracts QA S4 does not flag accessors or `-readonly` mapped types (QA Q1-2); `CompatibilityReport.schemaVersion` is `string` (QA Q1-3) | Low | The public API snapshot (S2) flags any such change for review | Next contracts change |
| RR9 | The config body is read in full before the size check when Content-Length is missing or wrong (QA Q5-3) | Low | Rejected afterwards; memory use only | IB3 platform work |
| RR10 | The portability proof checks that the app renders, not that `App` consumes the store (QA Q5-4) | Low | Unit tests cover the store; the reference app has no store consumer until IB3 | IB3 |
| RR11 | Unit tests use Node's built-in `node:test`, while IB-01 names Vitest as the default (decision card in the IB1 thread, unanswered; default followed) | Info | No new dependency; exact expected-count gates | PO/SA decision |
| RR12 | Branch protection on `main` stays advisory (IB0-WP05 accepted risk R1) | Info | `PAEP / gate` runs on every PR | Unchanged |
| RR13 | Deployment under a sub-path requires setting `<base href>` in `index.html` at deploy time | Info | Proven with the same bundle (portability S4); documented in the guide | Deployment tooling (IB3 or release) |
