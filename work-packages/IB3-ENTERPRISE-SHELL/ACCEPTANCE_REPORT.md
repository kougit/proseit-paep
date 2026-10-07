# IB3-ENTERPRISE-SHELL — Acceptance Report

**Status: IN PROGRESS.** Not complete and not ready for acceptance. HOF-IB2-001 v1.2 was approved by the PO/SA on 2026-10-07, and the parts that waited for it (P-01 popover `align`, P-02 `PaepMenu`, the ActionGroup overflow, `PaepAccountMenu`, `PaepNotificationPanel`, the language menu and help) are built and tested. The reference-app budget follows the PO/SA decision of 2026-10-07 (DDR-IB3-07 ACCEPTED: 500 kB raw target, 525 kB raw / 150 kB transfer hard limits). Technical PASS is not ACCEPTED; acceptance, merge and Generation 5 promotion are PO/SA decisions.

| Item | Status |
| --- | --- |
| Generation 5 | CANDIDATE (not accepted, not promoted) |
| Design handoff | HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION; retained and verified (`qa:enterprise` E12, 577/577 files) |
| Conformance | `evidence/design-handoff/HOF-IB3-001/conformance-report.md`: 24/24 component-map rows and 111/114 states implemented and tested; 1 state conforms by approved DDR-IB3-02 (002 rail flyout on the governed popover); 1 partial (020 focus-order: no check compares the full Tab order with the design map) and 1 divergent state (DDR-IB3-01 candidate) |
| DDR-IB3 status | PO/SA pre-acceptance disposition 2026-10-07: DDR-IB3-02 ACCEPTED (ACCEPTED IMPLEMENTATION DIVERGENCE; rail flyout on the governed `PaepPopover`); DDR-IB3-06 CLOSED, REMEDIATED TO CONFORMANCE (two catalogued keys, 123 in total); DDR-IB3-07 ACCEPTED; DDR-IB3-08 PO/SA DESIGN DISPOSITION APPROVED, MANUAL ACCESSIBILITY VERIFICATION PENDING; DDR-IB3-01, -03, -04 and -05 CANDIDATES, PO/SA decision required (`DDR-DECISION-TABLE.md`). Lows allowed to remain: package.json script bodies not content-pinned; hoisted `source-map-js` |
| Native-copy review (ar, he) | NOT STARTED (human); never claimed |
| CI headroom | Resolved by the PO/SA three-way split (2026-10-07): on f23006d the three CI-control jobs took 11 m 40 s (a), 12 m 48 s (b) and 11 m 39 s (c) as whole-job durations (setup included; job a also runs `qa:baseline:negative`), each under its unchanged 20-minute limit (AC-IB3-21) |
| Independent QA / RR6 | Round 1 on 574f028: independent QA High 1 / Medium 4 / Low 7; RR6 FAIL (High 0 / Medium 2 / Low 5); all fixed. Round 2 on 28c3552: independent QA High 0 / Medium 1 (C1 could pass a weakened policy; fixed on the next head); RR6 FAIL High 0 / Medium 1 (the CI headroom STOP, recorded here). Round 3 on a403020: independent QA High 0 / Medium 0 / Low 6 (L-11 and L-16 fixed on 50e7171, record lows L-12 to L-15 fixed on the next head); RR6 PASS High 0 / Medium 0 / Low 4 |

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
| AC-IB3-10 | PASS (local) | Conformance report Table B is the state coverage table with test ids: 111/114 tested, 1 conforms by approved DDR-IB3-02, 1 partial, 1 divergent (DDR-IB3-01 candidate) |
| AC-IB3-11 | PASS (local) | `qa:enterprise` E07; palette, nav, context and locked tests against doubles; impersonation row test |
| AC-IB3-12 | PASS (local) | `qa:enterprise` E05, E06; `qa:ib0-wp05` W08 secret scan; Navigation safety (mandatory Low fixes A and B, 2026-10-07; presentation only, not an authorization control): `shell/safe-links.ts` renders a notification route as a link only if it is an internal path (`/…`, not `//`, no backslash, control or space characters; otherwise plain text), and keeps a host help link only if it is a `run()` action, an internal route or an `https:` URL with a host and no credentials; every other scheme (`javascript:`, `data:`, `http:`, `vbscript:`, `//host` …) is dropped, Angular URL sanitisation still applies, and an external help link gets `rel="noopener noreferrer"` (safe-links.spec, notification-panel.spec, account-menu.spec positive and negative cases). Strict CSP per the PO/SA decision of 2026-10-07 (WORK_PACKAGE §8a; independent QA H-01): `index.html` carries the `ngCspNonce` placeholder, the deployment profile `apps/reference-app/deployment/csp-strict.json` defines the per-response nonce and the policy (no `'unsafe-inline'`, no `'unsafe-eval'`, Trusted Types `angular` only), and `qa:shell` serves every page under it: C1 (header is the profile with a fresh 16-byte nonce matching the page; policy rules over every script- and style-deciding directive incl. the -elem and -attr overrides, case-insensitive with no repeated directive, and closed object-src, base-uri, form-action and frame-ancestors; inventory of `index.html`; every Angular style element nonced, also after navigating to a lazily loaded route; blocked probes for an inline script without or with a wrong nonce, an inline style without a nonce, eval and an HTML sink) and H5 (no violation in 124 state combinations); negatives S35-S50 (unsafe-inline, unsafe-eval, static, missing, unsubstituted and wrong nonce, no placeholder, inline handler, unsafe-bypass, Trusted Types off, wildcard, an un-nonced style, a wildcard in script-src-elem, a repeated directive in other capitals, frame-ancestors dropped; control). The policy each real deployment emits is that deployment's evidence |
| AC-IB3-13 | PASS (local) | error-boundary, lazy-load, version, not-retryable and not-found tests; `qa:shell` S03 negative (raw detail in the report line) |
| AC-IB3-14 | PASS (local) | `qa:design-system` 12/12 (incl. the menu specimen and popover align); `qa:accessibility` PASS incl. the framed shell previews; negatives B16, B17, E25-E33 |
| AC-IB3-15 | PASS (local) | `qa:shell` 22/22 on the production build, incl. B1 (counts every file `index.html` loads and every file those import, followed recursively): initial files 516 799 bytes raw (516.80 kB; 16.80 kB over the 500 kB target, 8.20 kB under the 525 kB hard maximum) and 121 528 bytes transfer (121.53 kB; 28.47 kB under the 150 kB hard maximum); +53 bytes raw since the 516 746-byte reference, from the language button's label-in-name fix; B1 negatives S28-S33 (S32 no preload hint, S33 second-level import); bundle composition 7/7 (no UI-lab, test, analytics, offline, Frappe or domain code; no duplicate source, selector or positioning; Angular, rxjs and tslib only; production optimisation and AOT on) in `evidence/IB3-ENTERPRISE-SHELL/gates/bundle-composition.json`; routes E08; DDR-IB3-07 ACCEPTED |
| AC-IB3-16 | IN PROGRESS | 44 captures with README (incl. notifications, account and language); PO/SA disposition pending |
| AC-IB3-17 | PASS (local) | `qa:enterprise:negative` 35/35 (34 seeded + control; N34 renames a DDR-IB3-06 key), design-system extension negatives 34/34, `qa:shell:negative` 56/56 (49 seeded + 7 controls, pinned; S51-S55 hide or truncate the 320 px tenant context, name another tenant, hide the sheet context header, hide the offline row), `qa:ddr07:negative` 19/19 (N16: record dropped from HEAD), `qa:ib3:ci-negative` 20/20 (19 seeded + 1 control, pinned; J12-J19 cover the three-way split), `qa:ib2:ci-negative` 27/27 |
| AC-IB3-18 | PASS (local) | `test:enterprise` 131 tests in 15 files; `test:components` 292 in 30 files. Every shell part has at least 3 direct tests (table in section 2) |
| AC-IB3-19 | IN PROGRESS | Similarity review PASS (HOF); provenance rows added (pending PO/SA); E11 and negatives |
| AC-IB3-20 | PASS | `qa:ib0-wp05` 25/25 on a403020 (W18 and W19 hold the legacy `qa:ib0-wp04:negative` / `qa:ib0-wp03:negative` results to their recorded pre-existing outcomes; W20-W23 re-run the IB0-WP04 to WP01 regressions); `test:components` 292 (not reduced); every IB0-IB2 job green in CI with its logs in the run's evidence artifacts (run 37636360636; the final head's run is cited in the readiness block) |
| AC-IB3-21 | PASS (f23006d and a403020; the final head's run is cited in the readiness block) | CI-control parts (PO/SA decision 2026-10-07, three-way split, `timeout-minutes: 20` each). Whole-job durations, setup included; job a also runs `qa:baseline:negative`: f23006d run 37632520362, all 19 jobs green: `PAEP / negative-ci` (part a, 25 cases) 11 m 40 s, `PAEP / negative-ci-b` (part b, 32 cases) 12 m 48 s, `PAEP / negative-ci-c` (part c, 47 cases) 11 m 39 s. a403020 (records only) run 37636360636: attempt 1 failed because `PAEP / accessibility` timed out (30 s) loading one page, `/enterprise-shell/notifications` desktop rtl, of 348 page audits; that page reaches network idle in about 1.5 s locally (6 of 6) and the same code was green on f23006d, so the job was re-run once, and attempt 2 was green with `PAEP / gate` success (parts 11 m 37 s, 12 m 43 s, 11 m 18 s). The mapping is explicit in `tooling/verification/negative-ib0-wp05.mjs` and checked by `--check-partition` in W11 (104 declared = 104 assigned, none unassigned, none repeated; W11 also pins the total at 104). The count went from 103 to 104 because the WP05 suite generates one gate case per mandatory job (GJ01-GJ18), and `PAEP / negative-ci-c` is the 18th; no existing case was removed or moved out of the suite. History: 574f028 run 37572300138 green; ff67819 run 37589312832 green; 28c3552 run 37593439108 and 53f4fbe run 37599431042 failed only because the two-part `PAEP / negative-ci-b` reached its 20-minute timeout (20 m 16 s and 20 m 19 s, cancelled; mainline 929387b 13 m 41 s). That STOP went to PO/SA, who approved the split and kept the timeout |
| AC-IB3-22 | PASS (local) | `qa:enterprise` E09 (lockfile, dependencies, schema, contracts unchanged) |
| AC-IB3-23 | PASS (local) | `qa:enterprise` E06, E08, E09 |
| AC-IB3-24 | PASS | `evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md` |
| AC-IB3-25 | PASS | HOF-IB2-001 v1.2 APPROVED_FOR_IMPLEMENTATION by the PO/SA (2026-10-07), retained under `evidence/design-handoff/HOF-IB2-001/v1.2/`; S01 pins its sha256 and status line; negatives E28, E29; v1.1 retained |
| AC-IB3-26 | PASS (technical) | Round 3 on a403020: independent QA High 0 / Medium 0 / Low 6; RR6 PASS High 0 / Medium 0 / Low 4 (rounds 1 and 2 in the header). The later commits fix lows only (W11 total pin, negatives J18/J19, records) and were re-checked by the independent QA reviewer |
| AC-IB3-27 | n/a | PO/SA decision |

## 2. Direct tests per shell part (AC-IB3-18)

| Part | Spec | Tests |
| --- | --- | --- |
| `PaepShell` | shell.spec | 7 |
| `PaepShellTopbar` | shell.spec | 9 |
| `PaepShellNav` | nav.spec | 14 |
| `PaepShellNavSheet` | nav.spec | 4 |
| `PaepStatusStrip` | status-strip.spec | 5 |
| `PaepContextSwitcher` | context-switcher.spec | 7 |
| `PaepCommandPalette` | command-palette.spec | 11 |
| `PaepNotificationPanel` | notification-panel.spec | 12 |
| `PaepAccountMenu` | account-menu.spec | 11 |
| `PaepPageFrame` | page-frame.spec | 8 |
| `PaepErrorBoundary` | error-boundary.spec | 6 |
| `PaepNotFound` | error-boundary.spec | 3 |
| `PaepLockedState` | locked-state.spec | 5 |
| `PaepRouteFocus` | provide-shell.spec | 3 (plus shell integration tests) |
| `PaepShellPreferences` | provide-shell.spec | 3 (plus shell integration tests) |

The remaining `test:enterprise` tests cover `providePaepShell`, the shell messages, the connectivity source and the shell link policy (safe-links.spec). Browser checks in `qa:shell` add keyboard, layout, axe and label-in-name coverage for each part.
