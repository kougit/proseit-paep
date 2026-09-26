# IB1-CONTRACTS-CONFIG — Independent QA

Reviewers were separate agents with read-only access to the repository; they worked in disposable clones and did not change the branch. Round 1 reviewed commit `7a18429`; round 2 re-checked the fixes on `5d983da`.

## Lanes

| Lane | Scope | Round 1 result |
| --- | --- | --- |
| Q1 | Contracts: neutrality, readonly, Appendix C/D conformance, contracts QA strength | 1 Medium, 3 Low/Info |
| Q2 | Schema and validator generator (compared with Ajv 8.20, 60,024 cases, 0 mismatches) | 1 High, 1 Medium, 4 Low/Info |
| Q3 | Strict decoding, parser, content guard (adversarial) | 1 Medium, 5 Low/Info |
| Q4 | Semantic and compatibility rules | 1 High (same defect as Q2-1), 4 Low/Info |
| Q5 | Loader, fail-safe startup, reference app, portability proof | 1 Medium, 4 Low/Info |
| Q6 | CI, baseline governance, IB0 verifier bounds | 1 High, 1 Low |
| Q7 | Scope, dependencies, secrets, non-scope | 0 High/Medium, 2 Low/Info |
| Q8 | Documentation, records, traceability | 2 Medium, 7 Low/Info |

## High and Medium findings

| ID | Severity | Finding | Fix | Round 2 |
| --- | --- | --- | --- | --- |
| Q2-1 / Q4-1 | High | Numeric host forms (`127.1`, `2130706433`, `0x7f000001`, `0177.0.0.1`, `10.1`, `0`) bypassed the no-loopback/private rule in production | Numeric hosts must be canonical dotted-decimal in every environment; CGNAT and private names refused in staging/production; tests and mutations M36, M37 | CLOSED |
| Q6-1 | High | A candidate could drop or weaken accepted CI jobs, commands or the gate by editing the policy and the workflow together | W11/W12 compare with the policy at the active accepted commit (jobs may only be added); WP05 negatives K04–K07 | CLOSED |
| Q2-2 | Medium | Ports above 65535 and unparsable hosts accepted | Port bounded 1–65535 in the schema; numeric-host rule | CLOSED |
| Q3-1 | Medium | Document-supplied key names echoed in issue paths | Paths truncated at the first non-schema key (`redactPointer`); secret-shaped keys rejected; mutations M38, M40 | CLOSED (792 probe documents, no echo) |
| Q5-1 | Medium | Sub-path hosting unproven for the same build | Portability scenario S4 serves the same bundle under `/erp/` (only `<base href>` set at deploy time); guide step 3 | CLOSED |
| Q1-1 | Medium | Report cells and totals could not carry `MoneyValue`; Appendix D deviations unrecorded | `ReportCellValue = ScalarValue \| MoneyValue`; deviations recorded in the contracts README and design §2 | CLOSED |
| Q8-01 / Q8-02 | Medium | Traceability and READMEs claimed PASS before evidence existed | Statuses set to IN PROGRESS until the evidence is retained | CLOSED |
| R2-1 | Medium | (Round 2, pre-existing since IB0-WP05) An empty workflow file made W09–W14 skip and the provenance gate pass | Every selected check must report or it fails; WP05 negative K08 | Fixed after round 2; verified locally (empty workflow: provenance FAIL 2/8) |

Also found during integration: new WP05 negative case ids collided with existing I01–I04; renamed K01–K08 and the suite now fails on duplicate ids.

## Low and Info findings

Fixed: Q2-3 (dot path segments), Q3-2 (partial: credential assignments after whitespace, URL userinfo anywhere, more storage schemes), Q3-6 (secret-shaped keys), Q4-2 (private names, CGNAT), Q4-3 (build context type check), Q5-2 (bootstrap failure shows the fail-safe page), Q7-01 (bound limited to the two entry points), Q7-02, Q8-03 to Q8-09 (documentation). The remainder is recorded in `residual-risk.md`.

## Result

No open High or Medium finding.
