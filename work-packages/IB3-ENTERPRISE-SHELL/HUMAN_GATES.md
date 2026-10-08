# IB3-ENTERPRISE-SHELL: human gates H1 to H6

These are the evidence forms for the human gates in the PO/SA instruction of 2026-10-08 (sections 5 to 13). IB3 cannot be ACCEPTED until each gate has a human result on record. Claude prepared these forms. Claude does not perform, infer or fabricate any judgment in them. Automated evidence (axe, `qa:shell`, `qa:accessibility`, screenshots) is never a human result.

## Candidate and freeze

- **Candidate:** the frozen human-gate head. That is the commit that records the 2026-10-08 DDR dispositions and has green exact-head CI. Its full SHA is in the PR #12 readiness reply and in `/mnt/project-files/ib3/human-gates/README.md`.
- **Freeze:** while review is in progress, no code or controlled record changes, except to record human evidence a reviewer has submitted.
- **SHA check:** each reviewer writes down the SHA they reviewed. A result for any other SHA does not count.
- **Serving:** run `npm run build:reference-app`, then serve `dist/reference-app/browser`. The sample shell is at `/workspace`. RTL is `?dir=rtl`.

Every record identifies:
- the exact candidate SHA;
- the reviewer and their role;
- the date;
- the environment, where relevant;
- the result, PASS or FAILED (H5 uses PASS or CONCERN per capture);
- the findings;
- the corrective action required, if FAILED.

**If a gate fails** (section 13):
1. Record the finding and classify it.
2. Make only an authorised correction.
3. Re-run the affected automated gates and exact-head CI.
4. Re-run the affected human gate.
5. Refresh provenance to the new SHA.
6. Assess, for each earlier human result, whether it is still valid on the new head.

## H1. Keyboard-only walkthrough (AC-IB3-06)

- **Reviewer:** a human accessibility reviewer: the PO/SA or a delegate, never Claude or automation.
- **Browser:** a supported Chromium-family browser. No pointing device.

Areas to walk through:
- Skip link.
- Expanded navigation.
- Collapsed rail.
- Rail flyout.
- Mobile navigation sheet.
- Command palette.
- Locked palette result.
- Notification panel.
- Account menu.
- Language menu.
- Help menu.
- Context switch dialog.
- Status expansion.
- Locked / unavailable page.
- Error / not-found recovery.
- Route-change focus.

Verify in each area:
- every operation is reachable by keyboard;
- the focus order is logical;
- focus is visible and not obscured;
- focus enters dialogs and sheets correctly;
- there is no keyboard trap;
- Escape dismisses;
- focus is restored on close;
- route changes move focus;
- the current or checked state is perceivable;
- interaction still works at 320 px where applicable.

| Candidate SHA | Reviewer | Role | Date | Browser + version | Result | Findings | Corrective action if FAILED |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | NOT STARTED | | |

AC-IB3-06 stays IN PROGRESS until this row records PASS.

## H2. NVDA with Chromium on Windows (AC-IB3-07, DDR-IB3-08)

- **Reviewer:** a human assistive-technology reviewer. One qualified person may do both H1 and H2.
- **Versions:** record the exact Windows, NVDA and browser versions.

Check:
- Shell landmarks.
- Navigation names and current state.
- Collapsed-rail labels.
- Menu names, roles and states.
- The command palette combobox and listbox.
- The locked-result reason.
- The notification unread state ("Notifications, n unread"; per item "Unread").
- The notification panel.
- The account trigger ("Account: {name}").
- The context radio group and its current (checked) state.
- The language control.
- Status announcements.
- The locked / unavailable explanation.
- The error with its correlation reference.
- Route-change focus and announcement.

**DDR-IB3-08:**
- The visible control is "EN" and its accessible name is "EN, Language: English".
- Confirm that the visible token occurs in the name and that the control is understandable and operable.
- The same rule applies to every other locale token offered.

| Candidate SHA | Reviewer | Role | Date | Windows | NVDA | Browser | Result | DDR-IB3-08 | Findings | Corrective action if FAILED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | NOT STARTED | NOT STARTED | | |

If PASS, DDR-IB3-08 may be recorded as CLOSED — MANUAL ACCESSIBILITY VERIFIED. If FAILED, DDR-IB3-08 stays OPEN with the exact defect recorded.

## H3 and H4. Arabic and Hebrew native-copy review

- **Reviewer:** a fluent or native reviewer, competent to judge UI wording in that language.
- **Scope:**
  - the shell copy in the controlled `paep.shell.*` catalogue (123 keys, `packages/enterprise/src/lib/messages/shell-messages.ts`), as the host would localise it;
  - the IB3 screens and the HOF RTL renders (`SCR-SHELL-017--ar-*`, `--he-*`);
  - two composed accessible names with fixed separators: the context button "{label}: {context}. {switch}" and the unread announcement "{button}, {n unread}" (independent QA L-21).

Judge the wording for:
- naturalness;
- clarity;
- fit for an enterprise UI;
- consistent terminology;
- grammar;
- ambiguity;
- misleading literal translation.

This is copy validation. RTL mechanics already passed and are not reopened unless the wording exposes a real layout or interaction issue.

| Gate | Language | Candidate SHA | Reviewer | Role / language competence | Date | Result | Findings | Corrective action if FAILED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H3 | Arabic | | | | | NOT STARTED | | |
| H4 | Hebrew | | | | | NOT STARTED | | |

## H5. PO/SA visual acceptance (AC-IB3-16)

- **Reviewer:** Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect.
- **Captures:** the 44 captures, listed with their HOF renders in `evidence/IB3-ENTERPRISE-SHELL/visual/README.md`.
- **Mark:** each capture PASS or CONCERN.

Review against the approved HOF:
- shell hierarchy;
- topbar;
- navigation;
- page / workspace frame;
- menus;
- command palette;
- notifications;
- context / account;
- locked / error states;
- responsive adaptation and 320 px;
- RTL;
- focus presentation;
- long content;
- reduced motion, where visible.

Automated screenshot generation is not this review. Use the per-capture form in `/mnt/project-files/ib3/human-gates/H5-visual-captures.md`.

| Candidate SHA | Reviewer | Date | PASS | CONCERN | Overall | Material concerns (capture, screen, correction) |
| --- | --- | --- | --- | --- | --- | --- |
| | | | 0 | 0 | NOT STARTED | |

The overall result is BLOCKED if there is any material CONCERN. AC-IB3-16 is PASS only when all 44 pass.

## H6. Provenance review (AC-IB3-19)

- **Reviewer:** the PO/SA, or a delegated governance / provenance reviewer.

Verify that the candidate retains each of these (the per-item form is in `/mnt/project-files/ib3/human-gates/H6-provenance.md`):
- [ ] Approved HOF-IB3-001 (manifest `645dd2e9…fce5`).
- [ ] Approved HOF-IB2-001 v1.2.
- [ ] The DWP / work-package linkage.
- [ ] The human similarity PASS.
- [ ] Source / input hashes.
- [ ] The asset register.
- [ ] Shell icon provenance.
- [ ] The C2PA explanation.
- [ ] Implementation provenance.
- [ ] Dependency / SBOM evidence.
- [ ] DDR records and dispositions.
- [ ] The design conformance mapping.
- [ ] The exact candidate SHA.
- [ ] No prohibited third-party template source or assets.
- [ ] Dependency and package-lock status.
- [ ] Reviewer / approval history.

| Candidate SHA | Reviewer | Role | Date | Result | Findings | Corrective action if FAILED |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | NOT STARTED | | |

AC-IB3-19 stays IN PROGRESS until this row records PASS.
