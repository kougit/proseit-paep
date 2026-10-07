# IB3-ENTERPRISE-SHELL — Acceptance Report

**Status: IN PROGRESS.** Not complete and not ready for acceptance. HOF-IB2-001 v1.2 was approved by the PO/SA on 2026-10-07, and the parts that waited for it (P-01 popover `align`, P-02 `PaepMenu`, the ActionGroup overflow, `PaepAccountMenu`, `PaepNotificationPanel`, the language menu and help) are built and tested. The reference-app budget follows the PO/SA decision of 2026-10-07 (DDR-IB3-07 ACCEPTED: 500 kB raw target, 525 kB raw / 150 kB transfer hard limits). Technical PASS is not ACCEPTED; acceptance, merge and Generation 5 promotion are PO/SA decisions.

| Item | Status |
| --- | --- |
| Generation 5 | CANDIDATE (not accepted, not promoted) |
| Design handoff | HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION; retained and verified (`qa:enterprise` E12, 577/577 files) |
| Conformance | `evidence/design-handoff/HOF-IB3-001/conformance-report.md`: 24/24 component-map rows and 111/114 states implemented and tested; 1 partial (020 focus-order: no check compares the full Tab order with the design map) and 2 divergent states (DDR-IB3-01, -02 candidates) |
| DDR-IB3 candidates | DDR-IB3-07 ACCEPTED (2026-10-07); DDR-IB3-01..06 and DDR-IB3-08 (language button name) awaiting PO/SA disposition |
| Native-copy review (ar, he) | NOT STARTED (human); never claimed |
| Independent QA / RR6 | First run on 574f028: independent QA High 1 / Medium 4 / Low 7; RR6 FAIL (High 0 / Medium 2 / Low 5). Medium findings fixed on the next head; H-01 (strict CSP) fixed under the PO/SA strict-nonce decision of 2026-10-07. Both reviews re-run on the final head |

## 1. Criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-IB3-01 | PASS (local) | `qa:architecture`; `qa:enterprise` E01, E09; negatives in `qa:enterprise:negative` (33 + control) |
| AC-IB3-02 | IN PROGRESS | Conformance report; DDR-IB3 dispositions pending |
| AC-IB3-03 | PASS (local) | `TRACEABILITY.csv` covers notifications, account, language and help (IB3-ENT-002) |
| AC-IB3-04 | PASS (local) | `qa:enterprise` 12/12 (E02 all 15 §12 parts from the one entry point, E03 no private overlay); `qa:design-system` S03/S07 incl. the menu and popover align; extension negatives E28-E33 |
| AC-IB3-05 | PASS (local) | `qa:shell` H, N1 (incl. notifications with count and account with sign-out at 320 and 320×256), T1 (`evidence/IB3-ENTERPRISE-SHELL/gates/shell-qa.json`); negatives S21-S23 |
| AC-IB3-06 | IN PROGRESS | `qa:shell` K1-K7, F1; `test:enterprise`; manual keyboard walkthrough NOT RUN |
| AC-IB3-07 | IN PROGRESS | `qa:shell` axe over 124 state × viewport × direction combinations, 0 violations; `qa:shell` A1 label in name (WCAG 2.5.3) for every named control at 1440, 834 and 320 px with each menu open (negative S34; language button now named "EN, Language: English", DDR-IB3-08 candidate); manual NVDA, keyboard-only review and usability evaluation NOT RUN (human) |
| AC-IB3-08 | PASS for mechanics | `qa:shell` R1, L1; long-text tests in `test:enterprise`; captures in `evidence/IB3-ENTERPRISE-SHELL/visual/`; wording not validated |
| AC-IB3-09 | PASS (local) | `qa:shell` M1; negatives S15, S16 |
| AC-IB3-10 | PASS (local) | Conformance report Table B is the state coverage table with test ids: 111/114 tested, 1 partial, 2 divergent (DDR candidates) |
| AC-IB3-11 | PASS (local) | `qa:enterprise` E07; palette, nav, context and locked tests against doubles; impersonation row test |
| AC-IB3-12 | PASS (local) | `qa:enterprise` E05, E06; `qa:ib0-wp05` W08 secret scan; Angular URL sanitisation of host help links (account-menu.spec). Strict CSP per the PO/SA decision of 2026-10-07 (WORK_PACKAGE §8a; independent QA H-01): `index.html` carries the `ngCspNonce` placeholder, the deployment profile `apps/reference-app/deployment/csp-strict.json` defines the per-response nonce and the policy (no `'unsafe-inline'`, no `'unsafe-eval'`, Trusted Types `angular` only), and `qa:shell` serves every page under it: C1 (header is the profile with a fresh 16-byte nonce matching the page; inventory of `index.html`; every Angular style element nonced; blocked probes for an inline script without or with a wrong nonce, an inline style without a nonce, eval and an HTML sink) and H5 (no violation in 124 state combinations); negatives S35-S47 (unsafe-inline, unsafe-eval, static, missing, unsubstituted and wrong nonce, no placeholder, inline handler, unsafe-bypass, Trusted Types off, wildcard, an un-nonced style; control). The policy each real deployment emits is that deployment's evidence |
| AC-IB3-13 | PASS (local) | error-boundary, lazy-load, version, not-retryable and not-found tests; `qa:shell` S03 negative (raw detail in the report line) |
| AC-IB3-14 | PASS (local) | `qa:design-system` 12/12 (incl. the menu specimen and popover align); `qa:accessibility` PASS incl. the framed shell previews; negatives B16, B17, E25-E33 |
| AC-IB3-15 | PASS (local) | `qa:shell` 22/22 on the production build, incl. B1 (counts every file `index.html` loads and every file those import, followed recursively): initial files 516 799 bytes raw (516.80 kB; 16.80 kB over the 500 kB target, 8.20 kB under the 525 kB hard maximum) and 121 528 bytes transfer (121.53 kB; 28.47 kB under the 150 kB hard maximum); +53 bytes raw since the 516 746-byte reference, from the language button's label-in-name fix; B1 negatives S28-S33 (S32 no preload hint, S33 second-level import); bundle composition 7/7 (no UI-lab, test, analytics, offline, Frappe or domain code; no duplicate source, selector or positioning; Angular, rxjs and tslib only; production optimisation and AOT on) in `evidence/IB3-ENTERPRISE-SHELL/gates/bundle-composition.json`; routes E08; DDR-IB3-07 ACCEPTED |
| AC-IB3-16 | IN PROGRESS | 44 captures with README (incl. notifications, account and language); PO/SA disposition pending |
| AC-IB3-17 | PASS (local) | `qa:enterprise:negative` 34/34, design-system extension negatives 34/34, `qa:shell:negative` 48/48 (41 seeded + 7 controls, pinned), `qa:ddr07:negative` 19/19 (N16: record dropped from HEAD), `qa:ib3:ci-negative` 12/12 (11 seeded + 1 control, pinned), `qa:ib2:ci-negative` 27/27 |
| AC-IB3-18 | PASS (local) | `test:enterprise` 122 tests in 14 files; `test:components` 292 in 30 files. Every shell part has at least 3 direct tests (table in section 2) |
| AC-IB3-19 | IN PROGRESS | Similarity review PASS (HOF); provenance rows added (pending PO/SA); E11 and negatives |
| AC-IB3-20 | IN PROGRESS | `qa:ib0-wp05` 25/25 on a clean clone; full regression logs to be retained on the final head |
| AC-IB3-21 | IN PROGRESS | PR #12 head 574f028: all 18 jobs green incl. `PAEP / gate` (run 37572300138); re-run on the final head |
| AC-IB3-22 | PASS (local) | `qa:enterprise` E09 (lockfile, dependencies, schema, contracts unchanged) |
| AC-IB3-23 | PASS (local) | `qa:enterprise` E06, E08, E09 |
| AC-IB3-24 | PASS | `evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md` |
| AC-IB3-25 | PASS | HOF-IB2-001 v1.2 APPROVED_FOR_IMPLEMENTATION by the PO/SA (2026-10-07), retained under `evidence/design-handoff/HOF-IB2-001/v1.2/`; S01 pins its sha256 and status line; negatives E28, E29; v1.1 retained |
| AC-IB3-26 | IN PROGRESS | First independent QA and RR6 run on 574f028 (see header); both re-run on the final head until High 0 / Medium 0 |
| AC-IB3-27 | n/a | PO/SA decision |

## 2. Direct tests per shell part (AC-IB3-18)

| Part | Spec | Tests |
| --- | --- | --- |
| `PaepShell` | shell.spec | 7 |
| `PaepShellTopbar` | shell.spec | 9 |
| `PaepShellNav` | nav.spec | 12 |
| `PaepShellNavSheet` | nav.spec | 4 |
| `PaepStatusStrip` | status-strip.spec | 5 |
| `PaepContextSwitcher` | context-switcher.spec | 7 |
| `PaepCommandPalette` | command-palette.spec | 11 |
| `PaepNotificationPanel` | notification-panel.spec | 10 |
| `PaepAccountMenu` | account-menu.spec | 10 |
| `PaepPageFrame` | page-frame.spec | 8 |
| `PaepErrorBoundary` | error-boundary.spec | 6 |
| `PaepNotFound` | error-boundary.spec | 3 |
| `PaepLockedState` | locked-state.spec | 5 |
| `PaepRouteFocus` | provide-shell.spec | 3 (plus shell integration tests) |
| `PaepShellPreferences` | provide-shell.spec | 3 (plus shell integration tests) |

The remaining `test:enterprise` tests cover `providePaepShell`, the shell messages and the connectivity source. Browser checks in `qa:shell` add keyboard, layout, axe and label-in-name coverage for each part.
