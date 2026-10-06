# IB3-ENTERPRISE-SHELL — Acceptance Report

**Status: IN PROGRESS.** Not complete and not ready for acceptance. The HOF-IB2-001 v1.2-dependent parts (P-01 popover `align`, P-02 `PaepMenu`, ActionGroup overflow, and on them `PaepAccountMenu`, `PaepNotificationPanel`, the language menu and help) are not built, because v1.2 is awaiting PO/SA approval (AC-IB3-25). Technical PASS is not ACCEPTED; acceptance, merge and Generation 5 promotion are PO/SA decisions.

| Item | Status |
| --- | --- |
| Generation 5 | CANDIDATE (not accepted, not promoted) |
| Design handoff | HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION; retained and verified (`qa:enterprise` E12, 577/577 files) |
| Conformance | `evidence/design-handoff/HOF-IB3-001/conformance-report.md`: 19/24 component-map rows and 86/114 states implemented and tested; the rest wait for v1.2, except 2 divergent states (DDR-IB3-01, -02 candidates) |
| DDR-IB3 candidates | DDR-IB3-01..05, awaiting PO/SA disposition |
| Native-copy review (ar, he) | NOT STARTED (human); never claimed |
| Independent QA / RR6 | NOT RUN (runs on the final head) |

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-IB3-01 | PASS (local) | `qa:architecture`; `qa:enterprise` E01, E09; negatives in `qa:enterprise:negative` (33 + control) |
| AC-IB3-02 | IN PROGRESS | Conformance report; DDR-IB3 dispositions pending; v1.2-blocked rows |
| AC-IB3-03 | IN PROGRESS | `TRACEABILITY.csv`; areas for notifications, account and language wait for v1.2 |
| AC-IB3-04 | IN PROGRESS | `qa:enterprise` E02 FAIL (missing `PaepNotificationPanel`, `PaepAccountMenu`), E03 PASS; S03/S07 PASS for the built extensions; the governed menu base is P-01/P-02 (v1.2) |
| AC-IB3-05 | PASS for the built parts | `qa:shell` H, N1, T1 (`evidence/IB3-ENTERPRISE-SHELL/gates/shell-qa.json`); the never-hidden notifications and account controls wait for v1.2 |
| AC-IB3-06 | IN PROGRESS | `qa:shell` K1-K5, F1; `test:enterprise`; manual keyboard walkthrough NOT RUN |
| AC-IB3-07 | IN PROGRESS | `qa:shell` axe over 88 states, 0 violations; manual NVDA, keyboard-only review and usability evaluation NOT RUN (human) |
| AC-IB3-08 | PASS for mechanics | `qa:shell` R1, L1; long-text tests in `test:enterprise`; captures in `evidence/IB3-ENTERPRISE-SHELL/visual/`; wording not validated |
| AC-IB3-09 | PASS (local) | `qa:shell` M1; negatives S15, S16 |
| AC-IB3-10 | IN PROGRESS | Conformance report Table B is the state coverage table with test ids; v1.2-blocked states open |
| AC-IB3-11 | PASS (local) | `qa:enterprise` E07; palette, nav, context and locked tests against doubles; impersonation row test |
| AC-IB3-12 | PASS (local) | `qa:enterprise` E05, E06; `qa:ib0-wp05` W08 secret scan |
| AC-IB3-13 | PASS (local) | error-boundary, lazy-load, version, not-retryable and not-found tests; `qa:shell` S03 negative (raw detail in the report line) |
| AC-IB3-14 | PASS (local) | `qa:design-system` 12/12; `qa:accessibility` PASS incl. the framed shell previews; negatives B16, B17, E25-E27 |
| AC-IB3-15 | PASS (local) | `qa:shell` 15/15 on the production build; routes E08; budget 479.85 kB raw / 111.64 kB transfer (limit 500 / 150) |
| AC-IB3-16 | IN PROGRESS | 31 captures with README; PO/SA disposition pending |
| AC-IB3-17 | PASS (local) | `qa:enterprise:negative` 34/34, design-system extension negatives 28/28, `qa:shell:negative` 21/21, `qa:ib3:ci-negative` |
| AC-IB3-18 | PASS (local) | `test:enterprise` 92 tests in 12 files; `test:components` 276 |
| AC-IB3-19 | IN PROGRESS | Similarity review PASS (HOF); provenance rows added (pending PO/SA); E11 and negatives |
| AC-IB3-20 | IN PROGRESS | `qa:ib0-wp05` 25/25 on a clean clone; full regression logs to be retained on the final head |
| AC-IB3-21 | FAIL (current head) | PR #12: `PAEP / enterprise-shell` red on E02 only; other jobs green or running |
| AC-IB3-22 | PASS (local) | `qa:enterprise` E09 (lockfile, dependencies, schema, contracts unchanged) |
| AC-IB3-23 | PASS (local) | `qa:enterprise` E06, E08, E09 |
| AC-IB3-24 | PASS | `evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md` |
| AC-IB3-25 | BLOCKED | HOF-IB2-001 v1.2 awaiting PO/SA approval |
| AC-IB3-26 | NOT RUN | Independent QA and RR6 on the final head |
| AC-IB3-27 | n/a | PO/SA decision |
