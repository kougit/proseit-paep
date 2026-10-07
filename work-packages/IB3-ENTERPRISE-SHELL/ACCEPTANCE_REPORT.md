# IB3-ENTERPRISE-SHELL — Acceptance Report

**Status: IN PROGRESS.** Not complete and not ready for acceptance. HOF-IB2-001 v1.2 was approved by the PO/SA on 2026-10-07, and the parts that waited for it (P-01 popover `align`, P-02 `PaepMenu`, the ActionGroup overflow, `PaepAccountMenu`, `PaepNotificationPanel`, the language menu and help) are built and tested. The reference-app budget follows the PO/SA decision of 2026-10-07 (DDR-IB3-07 ACCEPTED: 500 kB raw target, 525 kB raw / 150 kB transfer hard limits). Technical PASS is not ACCEPTED; acceptance, merge and Generation 5 promotion are PO/SA decisions.

| Item | Status |
| --- | --- |
| Generation 5 | CANDIDATE (not accepted, not promoted) |
| Design handoff | HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION; retained and verified (`qa:enterprise` E12, 577/577 files) |
| Conformance | `evidence/design-handoff/HOF-IB3-001/conformance-report.md`: 24/24 component-map rows and 111/114 states implemented and tested; 1 partial (020 focus-order: no check compares the full Tab order with the design map) and 2 divergent states (DDR-IB3-01, -02 candidates) |
| DDR-IB3 candidates | DDR-IB3-07 ACCEPTED (2026-10-07); DDR-IB3-01..06 awaiting PO/SA disposition |
| Native-copy review (ar, he) | NOT STARTED (human); never claimed |
| Independent QA / RR6 | NOT RUN (runs on the final head) |

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-IB3-01 | PASS (local) | `qa:architecture`; `qa:enterprise` E01, E09; negatives in `qa:enterprise:negative` (33 + control) |
| AC-IB3-02 | IN PROGRESS | Conformance report; DDR-IB3 dispositions pending |
| AC-IB3-03 | PASS (local) | `TRACEABILITY.csv` covers notifications, account, language and help (IB3-ENT-002) |
| AC-IB3-04 | PASS (local) | `qa:enterprise` 12/12 (E02 all 15 §12 parts from the one entry point, E03 no private overlay); `qa:design-system` S03/S07 incl. the menu and popover align; extension negatives E28-E33 |
| AC-IB3-05 | PASS (local) | `qa:shell` H, N1 (incl. notifications with count and account with sign-out at 320 and 320×256), T1 (`evidence/IB3-ENTERPRISE-SHELL/gates/shell-qa.json`); negatives S21-S23 |
| AC-IB3-06 | IN PROGRESS | `qa:shell` K1-K7, F1; `test:enterprise`; manual keyboard walkthrough NOT RUN |
| AC-IB3-07 | IN PROGRESS | `qa:shell` axe over 124 state × viewport × direction combinations, 0 violations; manual NVDA, keyboard-only review and usability evaluation NOT RUN (human) |
| AC-IB3-08 | PASS for mechanics | `qa:shell` R1, L1; long-text tests in `test:enterprise`; captures in `evidence/IB3-ENTERPRISE-SHELL/visual/`; wording not validated |
| AC-IB3-09 | PASS (local) | `qa:shell` M1; negatives S15, S16 |
| AC-IB3-10 | PASS (local) | Conformance report Table B is the state coverage table with test ids: 111/114 tested, 1 partial, 2 divergent (DDR candidates) |
| AC-IB3-11 | PASS (local) | `qa:enterprise` E07; palette, nav, context and locked tests against doubles; impersonation row test |
| AC-IB3-12 | PASS (local) | `qa:enterprise` E05, E06; `qa:ib0-wp05` W08 secret scan |
| AC-IB3-13 | PASS (local) | error-boundary, lazy-load, version, not-retryable and not-found tests; `qa:shell` S03 negative (raw detail in the report line) |
| AC-IB3-14 | PASS (local) | `qa:design-system` 12/12 (incl. the menu specimen and popover align); `qa:accessibility` PASS incl. the framed shell previews; negatives B16, B17, E25-E33 |
| AC-IB3-15 | PASS (local) | `qa:shell` 20/20 on the production build, incl. B1: initial files 516 746 bytes raw (516.75 kB; 16.75 kB over the 500 kB target, 8.25 kB under the 525 kB hard maximum) and 121 444 bytes transfer (121.44 kB; 28.56 kB under the 150 kB hard maximum); B1 negatives S28-S31; bundle composition 7/7 (no UI-lab, test, analytics, offline, Frappe or domain code; no duplicate source, selector or positioning; Angular, rxjs and tslib only; production optimisation and AOT on) in `evidence/IB3-ENTERPRISE-SHELL/gates/bundle-composition.json`; routes E08; DDR-IB3-07 ACCEPTED |
| AC-IB3-16 | IN PROGRESS | 44 captures with README (incl. notifications, account and language); PO/SA disposition pending |
| AC-IB3-17 | PASS (local) | `qa:enterprise:negative` 34/34, design-system extension negatives 34/34, `qa:shell:negative` 32/32, `qa:ddr07:negative` 18/18, `qa:ib3:ci-negative` 12/12, `qa:ib2:ci-negative` 27/27 |
| AC-IB3-18 | PASS (local) | `test:enterprise` 115 tests in 14 files; `test:components` 292 in 30 files |
| AC-IB3-19 | IN PROGRESS | Similarity review PASS (HOF); provenance rows added (pending PO/SA); E11 and negatives |
| AC-IB3-20 | IN PROGRESS | `qa:ib0-wp05` 25/25 on a clean clone; full regression logs to be retained on the final head |
| AC-IB3-21 | IN PROGRESS | PR #12 head b122015: CI running |
| AC-IB3-22 | PASS (local) | `qa:enterprise` E09 (lockfile, dependencies, schema, contracts unchanged) |
| AC-IB3-23 | PASS (local) | `qa:enterprise` E06, E08, E09 |
| AC-IB3-24 | PASS | `evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md` |
| AC-IB3-25 | PASS | HOF-IB2-001 v1.2 APPROVED_FOR_IMPLEMENTATION by the PO/SA (2026-10-07), retained under `evidence/design-handoff/HOF-IB2-001/v1.2/`; S01 pins its sha256 and status line; negatives E28, E29; v1.1 retained |
| AC-IB3-26 | NOT RUN | Independent QA and RR6 on the final head |
| AC-IB3-27 | n/a | PO/SA decision |
