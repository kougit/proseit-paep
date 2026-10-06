# IB3-ENTERPRISE-SHELL visual captures

Captures of the production reference-app build taken by `node tooling/enterprise-shell/shell-qa.mjs --capture <dir>` on the head named in `ACCEPTANCE_REPORT.md`, after each state passed the H1-H4 audit (no page scroll, no console error, one h1 and one main, axe). The run captures 88 state × viewport × direction combinations; this folder retains 1440, 834 and 320 in LTR and 1440 and 320 in RTL. The sheet and context states have no capture at a width where the control is not shown (the sheet is below 1024 px; the context button is removed below 600 px, Q-07).

RTL is set with `dir="rtl"` and `lang="ar"` on the document; the text stays English. Arabic and Hebrew wording has not had native-speaker review.

Each capture is compared with the HOF-IB3-001 render named below (`evidence/design-handoff/HOF-IB3-001/handoff/screens/`). The reference app shows neutral sample data, so names and content differ from the renders by design; the comparison is of layout, components, order and states. Parts blocked on HOF-IB2-001 v1.2 (language, notifications, account, help menu) are absent from every capture. The disposition of each baseline is a PO/SA decision (AC-IB3-16).

| Capture | State | Viewport | Direction | HOF-IB3-001 render | PO/SA disposition |
| --- | --- | --- | --- | --- | --- |
| `context--1440--ltr.png` | context | 1440 | LTR | SCR-SHELL-007 switch-dialog | PENDING |
| `context--1440--rtl.png` | context | 1440 | RTL | SCR-SHELL-007 switch-dialog; SCR-SHELL-017 (RTL) | PENDING |
| `context--834--ltr.png` | context | 834 | LTR | SCR-SHELL-007 switch-dialog | PENDING |
| `error--1440--ltr.png` | error | 1440 | LTR | SCR-SHELL-013 recoverable | PENDING |
| `error--1440--rtl.png` | error | 1440 | RTL | SCR-SHELL-013 recoverable; SCR-SHELL-017 (RTL) | PENDING |
| `error--320--ltr.png` | error | 320 | LTR | SCR-SHELL-013 recoverable | PENDING |
| `error--320--rtl.png` | error | 320 | RTL | SCR-SHELL-013 recoverable; SCR-SHELL-017 (RTL) | PENDING |
| `error--834--ltr.png` | error | 834 | LTR | SCR-SHELL-013 recoverable | PENDING |
| `locked--1440--ltr.png` | locked | 1440 | LTR | SCR-SHELL-012 page-edition | PENDING |
| `locked--1440--rtl.png` | locked | 1440 | RTL | SCR-SHELL-012 page-edition; SCR-SHELL-017 (RTL) | PENDING |
| `locked--320--ltr.png` | locked | 320 | LTR | SCR-SHELL-012 page-edition | PENDING |
| `locked--320--rtl.png` | locked | 320 | RTL | SCR-SHELL-012 page-edition; SCR-SHELL-017 (RTL) | PENDING |
| `locked--834--ltr.png` | locked | 834 | LTR | SCR-SHELL-012 page-edition | PENDING |
| `not-found--1440--ltr.png` | not-found | 1440 | LTR | SCR-SHELL-013 not-found | PENDING |
| `not-found--1440--rtl.png` | not-found | 1440 | RTL | SCR-SHELL-013 not-found; SCR-SHELL-017 (RTL) | PENDING |
| `not-found--320--ltr.png` | not-found | 320 | LTR | SCR-SHELL-013 not-found | PENDING |
| `not-found--320--rtl.png` | not-found | 320 | RTL | SCR-SHELL-013 not-found; SCR-SHELL-017 (RTL) | PENDING |
| `not-found--834--ltr.png` | not-found | 834 | LTR | SCR-SHELL-013 not-found | PENDING |
| `palette--1440--ltr.png` | palette | 1440 | LTR | SCR-SHELL-008 results | PENDING |
| `palette--1440--rtl.png` | palette | 1440 | RTL | SCR-SHELL-008 results; SCR-SHELL-017 (RTL) | PENDING |
| `palette--320--ltr.png` | palette | 320 | LTR | SCR-SHELL-008 results | PENDING |
| `palette--320--rtl.png` | palette | 320 | RTL | SCR-SHELL-008 results; SCR-SHELL-017 (RTL) | PENDING |
| `palette--834--ltr.png` | palette | 834 | LTR | SCR-SHELL-008 results | PENDING |
| `sheet--320--ltr.png` | sheet | 320 | LTR | SCR-SHELL-003 nav-open (834); SCR-SHELL-004 nav-open (320) | PENDING |
| `sheet--320--rtl.png` | sheet | 320 | RTL | SCR-SHELL-003 nav-open (834); SCR-SHELL-004 nav-open (320); SCR-SHELL-017 (RTL) | PENDING |
| `sheet--834--ltr.png` | sheet | 834 | LTR | SCR-SHELL-003 nav-open (834); SCR-SHELL-004 nav-open (320) | PENDING |
| `workspace--1440--ltr.png` | workspace | 1440 | LTR | SCR-SHELL-001 default; SCR-SHELL-015 default; SCR-SHELL-011 title-context-status, aside | PENDING |
| `workspace--1440--rtl.png` | workspace | 1440 | RTL | SCR-SHELL-001 default; SCR-SHELL-015 default; SCR-SHELL-011 title-context-status, aside; SCR-SHELL-017 (RTL) | PENDING |
| `workspace--320--ltr.png` | workspace | 320 | LTR | SCR-SHELL-001 default; SCR-SHELL-015 default; SCR-SHELL-011 title-context-status, aside | PENDING |
| `workspace--320--rtl.png` | workspace | 320 | RTL | SCR-SHELL-001 default; SCR-SHELL-015 default; SCR-SHELL-011 title-context-status, aside; SCR-SHELL-017 (RTL) | PENDING |
| `workspace--834--ltr.png` | workspace | 834 | LTR | SCR-SHELL-001 default; SCR-SHELL-015 default; SCR-SHELL-011 title-context-status, aside | PENDING |
