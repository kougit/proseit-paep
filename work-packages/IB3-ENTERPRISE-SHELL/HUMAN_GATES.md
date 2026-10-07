# IB3-ENTERPRISE-SHELL: human gate checklist

IB3 cannot be ACCEPTED until every gate below is recorded as passed by a named human reviewer (PO/SA pre-acceptance disposition, 2026-10-07, sections 9 to 11). Automated evidence (axe, `qa:shell`, screenshots) never counts as a pass here.

Candidate: the exact head named in the final human-gate readiness block. Serve the production reference app (`npm run build:reference-app`, then serve `dist/reference-app/browser`) and use its sample shell at `/workspace`.

For each gate record: reviewer, date, environment, the result (PASS or FAILED) and any findings. Every gate is NOT STARTED until a reviewer records it.

## 1. Keyboard-only walkthrough (AC-IB3-06)

Use no mouse. Check every item at 1440 px and at 320 px, in LTR and RTL.

| # | Area | Checks |
| --- | --- | --- |
| 1 | Skip link | It is the first Tab stop, is visible when focused, and moves focus to main. |
| 2 | Navigation expanded / collapsed | Logical order; the current page is identifiable. |
| 3 | Rail flyout | Opens from its group button; Escape closes it and returns focus to the button. |
| 4 | Mobile navigation sheet | Takes focus when opened; Escape returns focus to "Open navigation". |
| 5 | Command palette | Ctrl/Cmd+K opens it; arrow keys and Enter work; Escape returns focus to the opener. |
| 6 | Notification panel | Opens on Enter with focus on its heading; Escape closes it and focus returns to the bell. |
| 7 | Account menu | Arrow keys, Home and End work; Sign out is reachable; Escape restores focus. |
| 8 | Language menu | Opens, a choice changes the language, and Escape restores focus. |
| 9 | Help menu | Every entry can be reached and opened. |
| 10 | Locked / unavailable | The reason is reachable; the explanation action works. |
| 11 | Error / not-found recovery | "Try again", "Go to Home" and "Search or go to…" can be reached and work. |
| 12 | Status expansion | The "n more status messages" disclosure opens and closes. |
| 13 | Route-change focus | After each navigation, focus is on the new page h1. |
| 14 | Focus restoration | Focus returns to the opener after every overlay closes. |

Across all items, verify:
- the order is logical;
- there is no keyboard trap;
- Escape dismisses;
- focus is always visible and never hidden behind sticky chrome;
- focus is restored on close.

| Reviewer | Date | Browser / OS | Result | Findings |
| --- | --- | --- | --- | --- |
| | | | NOT STARTED | |

## 2. NVDA with current Chromium on Windows (AC-IB3-07)

Record the exact Windows version, NVDA version, and browser and version.

Checks:
- Shell landmarks: banner, navigation, main and the status region.
- Navigation and its current state.
- Collapsed-rail labels.
- The command palette combobox and listbox (name, expanded, active option).
- The notification bell's unread state ("Notifications, n unread") and each item's "Unread" marker.
- The account button ("Account: {name}").
- The language button.
- Status announcements, including a connectivity change, announced once.
- Locked reasons.
- The error message with its correlation reference.
- Route-change announcements and focus.

DDR-IB3-08 (design approved, manual verification pending):
- The visible label is "EN" and the accessible name is "EN, Language: English".
- Confirm that the button can be activated by its visible token, for example a speech command "click EN".
- Confirm the same rule for every other locale offered.

| Reviewer | Date | Windows | NVDA | Browser | Result | Findings |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | NOT STARTED | |

## 3. Native-copy review (wording only; RTL mechanics are qualified separately)

Review every `paep.shell.*` string (123 keys, `packages/enterprise/src/lib/messages/shell-messages.ts`) as the host would localise it, together with the Arabic and Hebrew HOF renders (`SCR-SHELL-017--ar-*`, `--he-*`). Return any material layout or interaction defect for implementation correction. Also review two composed accessible names whose separators are fixed in code (independent QA L-21, not changed by the disposition; a PO/SA follow-up if the wording does not work): the context button "{label}: {context}. {switch}" (`context/context-switcher.ts`) and the unread announcement "{button}, {n unread}" (`notifications/notification-panel.ts`).

| Language | Reviewer | Date | Result | Findings |
| --- | --- | --- | --- | --- |
| Arabic | | | NOT STARTED | |
| Hebrew | | | NOT STARTED | |

## 4. Visual captures (AC-IB3-16)

Dispose of each baseline in `evidence/IB3-ENTERPRISE-SHELL/visual/README.md`, one row per capture, against the HOF-IB3-001 render named in that row. Check layout, components, order and state; sample content differs by design. Automated screenshot generation is not approval.

| Reviewer (PO/SA or designate) | Date | Captures disposed | Result | Findings |
| --- | --- | --- | --- | --- |
| | | 0 of 44 | NOT STARTED | |

## 5. Provenance attestation (AC-IB3-19)

Review and attest:
- [ ] HOF-IB3-001 provenance is complete (`evidence/design-handoff/HOF-IB3-001/handoff/provenance.md` and `provenance/`), and its human similarity review PASS is on record.
- [ ] `docs/provenance/PROVENANCE-REGISTER.md` row "PAEP enterprise shell (IB3)" is correct.
- [ ] `docs/provenance/PROVENANCE-REGISTER.md` row "Reference application favicon and product mark (IB3)" is correct.
- [ ] The clean-room scan (`qa:enterprise` E11) covers enterprise and the reference app, and has its negatives.
- [ ] The favicon and product mark are the approved placeholder mark (P-09).

| Reviewer | Date | Result | Findings |
| --- | --- | --- | --- |
| | | NOT STARTED | |
