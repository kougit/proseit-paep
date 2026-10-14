# IB3-ENTERPRISE-SHELL: human gates H1 to H6

These are the evidence forms for the human gates in the PO/SA instruction of 2026-10-08 (sections 5 to 13). IB3 cannot be ACCEPTED until each gate has a human result on record. Claude prepared these forms. Claude does not perform, infer or fabricate any judgment in them. Automated evidence (axe, `qa:shell`, `qa:accessibility`, screenshots) is never a human result.

## PO/SA human-gate disposition 2026-10-14

The human review boundary H1 to H6 was approved for IB3 by Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect, on 2026-10-14, against the frozen candidate `9b03d484df19e1002c2e48091f837fc1d24d8b57` (exact-head CI run 37733276322, 19 of 19 jobs green, `PAEP / gate` PASS). Claude recorded the disposition below. Claude performed no review and recorded no result the PO/SA did not give. Where specialist validation was deferred, the deferral is recorded as such; a deferred review is not described as performed.

| Gate | Disposition |
| --- | --- |
| H1 keyboard | APPROVED BY PO/SA (for AC-IB3-07: PO/SA HUMAN ACCESSIBILITY ACCEPTANCE — APPROVED) |
| H2 NVDA / assistive technology | APPROVED BY PO/SA (for AC-IB3-07: PO/SA HUMAN ACCESSIBILITY ACCEPTANCE — APPROVED; specialist assistive-technology validation deferred to product pilot/UAT, obligation PAEP-A11Y-AT-PILOT) |
| H3 Arabic | APPROVED FOR IB3, WITH CONTROLLED DEFERRAL; carried obligation PAEP-LOC-AR-PILOT (OPEN) |
| H4 Hebrew | APPROVED FOR IB3, WITH CONTROLLED DEFERRAL; carried obligation PAEP-LOC-HE-PILOT (OPEN) |
| H5 visuals | PASS — PO/SA APPROVED (44/44 ACCEPTED BY PO/SA) |
| H6 provenance | PASS — PO/SA APPROVED |

## Candidate and freeze

- **Candidate:** the frozen human-gate head `9b03d484df19e1002c2e48091f837fc1d24d8b57`, frozen on 2026-10-08 at 16:17 UTC. It follows the records commit for the 2026-10-08 DDR dispositions (3befb2e) and has green exact-head CI (run 37733276322). The same SHA is in the project's shared review folder (`/mnt/project-files/ib3/human-gates/README.md`, outside the repository).
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
| `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | Product Owner / Solutions Architect | 2026-10-14 | Not recorded | APPROVED BY PO/SA | The PO/SA accepted the keyboard / focus interaction evidence. No item-by-item walkthrough result was recorded, and none is claimed here | n/a |

Disposition (PO/SA 2026-10-14): H1 APPROVED BY PO/SA. Deeper keyboard validation may continue in product pilots / UAT without reopening IB3, unless a material platform defect is found.

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
| `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | Product Owner / Solutions Architect | 2026-10-14 | Not recorded | Not recorded | Not recorded | APPROVED BY PO/SA | CLOSED — PO/SA HUMAN ACCESSIBILITY ACCEPTANCE | No transcript or per-item result was recorded, and none is claimed here | n/a |

Disposition (PO/SA 2026-10-14), recorded verbatim: "IB3 human accessibility acceptance approved by the PO/SA. Specialist assistive-technology validation may be extended during product pilot/UAT. Any material PAEP platform accessibility defect discovered there shall be raised against the PAEP backlog."

DDR-IB3-08: CLOSED — PO/SA HUMAN ACCESSIBILITY ACCEPTANCE. Deeper assistive-technology qualification may continue during product pilots/UAT. This is not a record that NVDA was independently verified; the Windows, NVDA and browser versions were not recorded.

### AC-IB3-07 disposition (PO/SA 2026-10-14)

PO/SA decision on AC-IB3-07 (Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect, 2026-10-14): YES. The H1 and H2 PO/SA human-review approvals cover the two outstanding human-evidence records of AC-IB3-07 for IB3 (the manual NVDA record and the structured independent usability evaluation). They are recorded as: H1 PO/SA HUMAN ACCESSIBILITY ACCEPTANCE — APPROVED; H2 PO/SA HUMAN ACCESSIBILITY ACCEPTANCE — APPROVED, specialist assistive-technology validation deferred to product pilot/UAT. The deferral is authorised by the PO/SA and is not an IB3 blocker; it is carried as obligation PAEP-A11Y-AT-PILOT (OPEN). No specialist keyboard or NVDA execution, Windows, NVDA or Chromium version, transcript or test observation is recorded or claimed, and no usability-evaluation session is claimed. ACCEPTANCE.md is unchanged.

- AC-IB3-07: PASS — PO/SA AUTHORIZED HUMAN-REVIEW DISPOSITION.
- Implementation candidate: `9b03d484df19e1002c2e48091f837fc1d24d8b57`.
- Human-gate record: `a45105f81a6ff7244cecedb8fcedaa8f24abfb3d`; this disposition is recorded in the records commit that follows it.
- Carried obligation PAEP-A11Y-AT-PILOT (OPEN): specialist assistive-technology validation (NVDA with Chromium on Windows, exact versions recorded) and specialist keyboard validation in product pilot/UAT; any material PAEP platform accessibility defect found is raised against the PAEP backlog. Not an IB3 blocker.

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
| H3 | Arabic | `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | Product Owner / Solutions Architect (native review not performed) | 2026-10-14 | APPROVED FOR IB3, WITH CONTROLLED DEFERRAL | Native Arabic copy review was not performed | Carried obligation PAEP-LOC-AR-PILOT |
| H4 | Hebrew | `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | Product Owner / Solutions Architect (native review not performed) | 2026-10-14 | APPROVED FOR IB3, WITH CONTROLLED DEFERRAL | Native Hebrew copy review was not performed | Carried obligation PAEP-LOC-HE-PILOT |

Dispositions (PO/SA 2026-10-14). The Arabic text is the PO/SA's verbatim; the PO/SA directed the same text with Hebrew wording for H4:
- H3: "Arabic platform/RTL mechanics are accepted for IB3 on the available engineering and PO/SA evidence. Advanced native Arabic terminology and copy validation is deferred to product pilots / product-specific localisation qualification."
- H4: "Hebrew platform/RTL mechanics are accepted for IB3 on the available engineering and PO/SA evidence. Advanced native Hebrew terminology and copy validation is deferred to product pilots / product-specific localisation qualification."

**Carried obligations PAEP-LOC-AR-PILOT and PAEP-LOC-HE-PILOT (OPEN).** Each is required before a product claims production-qualified Arabic (respectively Hebrew):
1. native or fluent copy review;
2. product-domain terminology review;
3. long-content review;
4. RTL product workflow validation;
5. corrections fed back to the shared PAEP catalogue where they are platform-generic.

Neither obligation blocks IB3. Both are also recorded in `work-package.json` (`carried_obligations`) and in `ACCEPTANCE_REPORT.md`.

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
| `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | 2026-10-14 | 44 | 0 | PASS — PO/SA APPROVED | None |

The overall result is BLOCKED if there is any material CONCERN. AC-IB3-16 is PASS only when all 44 pass.

Disposition (PO/SA 2026-10-14): 44/44 ACCEPTED BY PO/SA. The set is exactly the 44 retained captures (44 PNG files in `evidence/IB3-ENTERPRISE-SHELL/visual/`, 44 rows in its README), unchanged since the candidate; no capture was regenerated. AC-IB3-16: PASS — PO/SA VISUAL ACCEPTANCE.

## H6. Provenance review (AC-IB3-19)

- **Reviewer:** the PO/SA, or a delegated governance / provenance reviewer.

Verify that the candidate retains each of these (the per-item form is in `/mnt/project-files/ib3/human-gates/H6-provenance.md`):
- [x] Approved HOF-IB3-001 (manifest `645dd2e9…fce5`).
- [x] Approved HOF-IB2-001 v1.2.
- [x] The DWP / work-package linkage.
- [x] The human similarity PASS.
- [x] Source / input hashes.
- [x] The asset register.
- [x] Shell icon provenance.
- [x] The C2PA explanation.
- [x] Implementation provenance.
- [x] Dependency / SBOM evidence.
- [x] DDR records and dispositions.
- [x] The design conformance mapping.
- [x] The exact candidate SHA.
- [x] No prohibited third-party template source or assets.
- [x] Dependency and package-lock status.
- [x] Reviewer / approval history.

| Candidate SHA | Reviewer | Role | Date | Result | Findings | Corrective action if FAILED |
| --- | --- | --- | --- | --- | --- | --- |
| `9b03d484df19e1002c2e48091f837fc1d24d8b57` | Dr Kamulegeya Grace B (PhD) | Product Owner / Solutions Architect | 2026-10-14 | PASS — PO/SA APPROVED | None | n/a |

Disposition (PO/SA 2026-10-14): AC-IB3-19 PASS — PO/SA PROVENANCE ACCEPTANCE, against the frozen candidate. The PO/SA confirmation covers:
- the clean-room records;
- the design prompts and source records, retained;
- the approved dependencies and licences;
- the controlled package-lock and dependency state;
- no proprietary template source or assets;
- the human similarity review, retained;
- the DDRs, traceable;
- HOF / DWP / work-package traceability.

**Repository visibility review.** The PO/SA instruction of 2026-10-14 states that the repository was made public, and the PO/SA confirmed each check below. The pointers name the existing evidence:

| PO/SA-confirmed check | Existing evidence on the frozen candidate (run 37733276322, attempt 7, all jobs green) |
| --- | --- |
| No credentials or secrets | `PAEP / governance` runs `qa:ib0-wp05` W08 (no credential or secret signatures in files added or modified since the accepted baseline); `PAEP / security-provenance` (workflow security, action pinning, install-script and lockfile provenance; registry signatures); `qa:enterprise` E05 |
| No private tenant or customer data | The reference app uses neutral sample data only (`apps/reference-app/src/app/shell-sample.ts`: `sample-tenant-a`, `sample-tenant-b`) |
| No confidential commercial material | `qa:enterprise` E11 clean-room scan with negatives N28 to N30; the provenance register and the HOF similarity review |
| No restricted evidence | `evidence/` holds gate output, captures of the sample app and the retained design-handoff records; W08 covers every evidence file added or modified since the accepted baseline |

No repository content changed between the candidate and the visibility change: the branch head stayed `9b03d484df19e1002c2e48091f837fc1d24d8b57` until this records-only commit. So the existing evidence above is referenced, and no new scan was run. At the time of recording, the GitHub API reported the repository as private again; this does not change the review.
