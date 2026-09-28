# IB2-FOUNDATION-COMPONENTS — Independent QA (authorising instruction §21)

Status: technical record. PASS is technical; ACCEPTED is the PO/SA's decision.

## Method

Each lane was a separate Claude Code reviewer. None of them implemented the lane it reviewed, and all worked from the shared brief (read-only review; scratch copies only; concrete evidence for every finding). Severity scale: **High** means a mandatory criterion, WCAG 2.2 AA or a governance control is broken. **Medium** means a real defect or spec deviation a user or consumer would hit, or a gate that could falsely pass. **Low** means polish. **Info** means a note. Round 1 ran concurrently on commit `f534f53` plus the working tree. Every High and Medium finding was fixed, and round 2 re-checked the fixes (§3).

| Lane | §21 item(s) | Reviewer scope |
| --- | --- | --- |
| D/R | Q1 design-handoff conformance, Q4 responsive/visual | Specs vs source for all 25 components; 560 page loads over 40 lab pages at 320/375/834/1280/1440 px, LTR/RTL, 200 % and 400 % zoom; overlay scripts; screenshots vs renders |
| A/T | Q2 component API/architecture, Q6 test quality | Every component and foundation source; 58 mutations, each run against its own spec; overlay runs of the static gate |
| X | Q3 accessibility | Keyboard-only traversal of every page at 1440/320; CDP accessibility tree; axe on open states; forced colours; zoom |
| P/C/G/Q | Q5 clean-room/provenance, Q7 CI/verifier security, Q8 baseline governance, Q9 regression | Lockfile/licence delta; 20 CI bypass attempts; registry scope and self-promotion attempts; IB0/IB1 regressions in a clean copy |
| E | Q10 evidence completeness | Requirement → design → implementation → test → evidence traceability (§3, round 2) |

## 1. Round 1 findings and dispositions

| ID | Sev | Finding (short) | Disposition | Proof of fix |
| --- | --- | --- | --- | --- |
| X1 | High | Overflowing dialog/drawer body and long popover content not keyboard-scrollable (axe `scrollable-region-focusable`) | Fixed: an overflowing modal body, or a long content-only popover, becomes a focusable `role="region"` named by the title/trigger | dialog.spec "makes an overflowing body a focusable region…"; popover.spec "makes long content without controls a focusable region…"; browser QA O1 (axe on every open overlay) |
| X2 | High | Pagination: overridden visible label not in the accessible name (2.5.3) | Fixed: override is used for the name | pagination.spec label-in-name test |
| D4 | Medium | Same defect as X2 (design lane) | Fixed with X2 | as X2 |
| X3 | Medium | Page behind an open modal scrolls; focus can return off-screen | Fixed: document scroll locked while open; restore uses `scrollIntoView({block:'nearest'})` | dialog.spec scroll-lock assertions |
| X4 | Medium | Tabs selected indicator and progress fill vanish in forced colours | Fixed: `forced-colors` rules (Highlight / CanvasText) | tabs.css, progress.css; qa:design-system S04 |
| X5 / D5 | Medium / Low | Informational popover stays open after Tab leaves its trigger | Fixed: trigger focus-out closes a non-menu popover when focus leaves both | popover.spec "closes an informational panel when Tab moves on…" |
| D1 | Medium | Tab max width wider than the list at 320 px; label hidden, focus ring clipped | Fixed: `max-inline-size: min(18rem, 100cqi - 2 * var(--paep-space-8))` | browser QA at 320 LTR/RTL; visual captures |
| D2 | Medium | Narrow table broke ordinary words ("Recor\|d", "Samp\|le") | Fixed for the reported cases (lab panel inset and Details toggle margin at narrow widths). Residual: words of 11 or more characters in a key cell break at 320 px only where the column physically cannot hold them. Recorded as a DDR in `evidence/design-handoff/HOF-IB2-001/deviations/` | Word-level line measurement: no ordinary word breaks at 375 px; at 320 px only "descriptive" and "exceptionally" break (see DDR) |
| D3 | Medium | Lab state switch used `outline` for pressed state, masking the focus ring | Fixed: pressed state is an inset box-shadow | table/list specimens; browser F1 |
| T1 | Medium | Checkbox read-only test could pass with read-only broken | Fixed: assert after each interaction | mutation killed |
| T2 | Medium | Pagination "single skipped page" test never skipped a page | Fixed: new page-4 case | mutation `=== 2 → gap` re-run: killed |
| T3 | Medium | Link-mode `aria-current` never asserted | Fixed | pagination.spec link test |
| A1 | Medium | Locale hard-coded: plural rules and numbers always English | Fixed: components pass Angular `LOCALE_ID`; every numeric placeholder and page number formatted with `Intl` | messages.spec (pl plurals, de grouping, ar-EG digits); pagination.spec LOCALE_ID `de` |
| Q1 | Medium | S05 missed double-quoted import specifiers | Fixed | negative N26 |
| Q2 | Medium | S04 scanned only the first `styles` array element and no host style bindings | Fixed | negatives N27, N28 |
| Q3 | Medium | axe never ran on open overlays | Fixed: browser check O1 opens 12 overlays at 1440 and 320 px | O1 PASS; negatives B09 (defect inside open dialog), B10 (nothing opens) |
| C1 | Medium | WP05 bounds admitted any dependency once the lockfile was in scope | Fixed: exact approved delta (runtime deps unchanged, dev deps = baseline + 4 pins, new lock entries dev-only) and lockfile hash must equal the toolchain manifest | qa:ib2:ci-negative I10, I11; WP05 negatives L03, P11 |
| C2 | Low | W11 accepted any negative-ci timeout 1–30 | Fixed: exactly 20 (RR14) | qa:ib2:ci-negative I05 |
| C3 | Info | I09 ran only with `--full` | Fixed: all cases run in CI | qa:ib2:ci-negative 16/16 |
| P1 | Low | Licence review §1 NOTICE statement and register licence list incomplete | Fixed | licence review §8; provenance register |
| G1 | Info | Unused scope entry `negative-ib0-wp05.mjs` | Fixed: removed from generation 4 scope | qa:baseline B11 |
| Doc | Info | WORK_PACKAGE said angular.json gains the foundation stylesheet | Fixed | WORK_PACKAGE §3, §7 |
| X6 | Low | Modal title focus ring removed | Fixed: only `:focus:not(:focus-visible)` suppressed | dialog.css, drawer.css |
| X7 | Low | Hash links left the lab | Fixed: router links | specimens |
| D6 | Low | Field with affixes: focus ring and invalid border not around the control box | Fixed | field.css |
| T4 | Low | Destructive reordering in the More menu untested | Fixed: new fixture | action-group.spec |
| T5 | Low | Announcer: one shared timer could drop a polite message | Fixed: one timer per politeness | foundation.spec announcer tests |
| A2 | Low | `applyBrandProfile` read values twice (validate then apply) | Fixed: frozen snapshot | foundation.spec "applies exactly the values it validated" |
| Q5 | Low | S09 did not reject `it.fails` | Fixed | negative N29 |
| A3 | Low | Action-group menu is its own `popover="manual"` menu rather than PaepPopover variant menu | Not changed: behaviour matches the handoff interaction notes and is fully tested; recorded as a DDR | action-group.spec (12+ tests) |
| A4 | Low | Two identical heading-level types; three override-default conventions | Not changed (public API naming; no user impact); residual risk | residual-risk.md |
| Q4 | Low | Browser checks M1/D1/C1/F1 have no negative case | Partly: O1 (B09, B10) and M1 (B12) now have negatives; D1/C1/F1 remain; residual risk | residual-risk.md |
| D7 | Low | Lab specimen polish (state matrix, native buttons in lab controls) | Partly (dialog delete icon added); remainder residual | residual-risk.md |
| D8, D9, X8, P2, Q1-Q2 (gov lane) | Info | Notes | No action | — |

Round 1 totals as reported per lane: D/R High 0, Medium 4, Low 3, Info 2; A/T High 0, Medium 7, Low 7, Info 1; X High 2, Medium 3, Low 2, Info 1; P/C/G/Q High 0, Medium 1, Low 2, Info 6. Two findings were reported twice (X2 = D4; X5 = D5, rated Medium by X and Low by D/R). **Open after fixes: High 0, Medium 0.**

## 2. Evidence-review findings (during evidence drafting)

The evidence author reported discrepancies while writing the reports. They were fixed like QA findings:

- The DCH class labels were inverted: corrected in WORK_PACKAGE and work-package.json (`design-classification.md` §3).
- S01 pinned only the manifest. It now pins every retained handoff file plus the pin list itself (negatives N03, N32, N34).
- The requirements source was not retained. It now is (`evidence/design-handoff/HOF-IB2-001/requirements/`).
- Focus ring width and offset were not flagged as protected. They now are.
- Reference tokens are now allowlisted to where the handoff names them (N30).
- CSS `@import` is now checked (N31).
- Breakpoints are now checked against the handoff (N33).
- The S09 count is now exact.
- The provenance register link and the design-doc counts are fixed.
- The §4 tsconfig wording is clarified.

Remaining Low items are listed in `residual-risk.md`.

## 3. Round 2 (re-check of fixes)

A fresh reviewer re-verified every round-1 High and Medium item on commit `0132ff6`, in a scratch copy, by reproducing the original failure mode and then re-running mutations and browser measurements.

| Item | Result | How it was checked |
| --- | --- | --- |
| X1 | VERIFIED | Overflowing dialog, drawer and popover bodies become named `role="region"`, `tabindex="0"`; PageDown scrolls each at 1440 and 320 px; axe on each open overlay is clean; a non-overflowing drawer gets no region |
| X2 / D4 | VERIFIED | Accessible names equal the overridden visible text; reverting `previousName` fails the spec |
| X3 | VERIFIED | `html` is `overflow: hidden` while a modal is open (wheel does not scroll) and restored on close; focus returns to the invoker in view |
| X4 | VERIFIED | Forced colours: selected-tab indicator 3 px Highlight; progress fills visible |
| X5 / D5 | VERIFIED | Tab and Shift+Tab from an informational trigger close its panel; the menu keeps its own keyboard model |
| D1 | VERIFIED | 320 px LTR/RTL: long tab label not clipped; inset focus ring fully visible |
| D2 | VERIFIED (residual as recorded) | Per-character measurement over every table cell on all 40 pages: 0 ordinary words broken at 375 px; at 320 px only "descriptive" and "exceptionally" (DDR-IB2-01, RR15) |
| D3 | VERIFIED | Pressed and focused lab state switch shows the 2 px focus outline |
| T1, T2, T3 | VERIFIED | Each mutation is killed by exactly one test |
| A1 | VERIFIED | `de` and `pl` locale tests; hard-coding `en` fails the LOCALE_ID test |
| Q1, Q2, Q3 | VERIFIED | S05 double-quoted and multi-line imports; S04 third styles element; O1 reports each injected defect in an open overlay |
| C1, C2 | VERIFIED | Unapproved dependency (with and without lockfile) fails W16 and W06; negative-ci timeout 19 or 21 fails W11 |

Round 2 result: 19 items checked, 19 VERIFIED, 0 not fixed. No regression: form dialogs and drawers open on the first field, show the error on an empty submit, and return focus on save; no console errors.

### New round-2 findings

| ID | Sev | Finding | Disposition | Proof of fix |
| --- | --- | --- | --- | --- |
| R2-1 | Medium | S04 missed other style channels: single-quoted `styles` strings, double-quoted host bindings, `[style]` objects, static host `style`, `@HostBinding('style…')`, template `style=""` and `[style.x]` literals, and `.style` assignments in code | Fixed: S04 reads every style channel and rejects the ones it cannot check | negatives N37–N44 |
| R2-2 | Low | S05 missed a template-literal dynamic import (`arch:check` already caught it) | Fixed: template literals read; computed specifiers rejected | negatives N45, N46 |
| R2-3 | Low | Popover Escape could leave focus on a trigger scrolled out of view | Fixed: the trigger is scrolled into view (`nearest`) when focus returns | popover.spec "keeps the trigger in view when Escape returns focus to it" (fails on the previous code) |
| R2-4 | Low | An informational popover stayed open when Tab left the document from its trigger | Fixed: closes when focus settles outside the document | popover.spec "closes an informational panel when focus leaves the document…" (fails on the previous code) |
| R2-5 | Info | Menu items stay in the Tab sequence; Tab past the last item closes the menu | No change: matches the handoff (`interaction-notes.md`: "Tab past last element closes") | — |

**Open after round 2: High 0, Medium 0.**

## 4. §18 negative coverage added during QA

While closing the findings, the gates gained the §18 negatives that were still missing: S10 and N35 (clickable non-interactive element); K1 and B11 (keyboard trap); O1 dismissal and B13 (focus lost after dismissal); U1 and B14 (status by colour alone); B12 and B15 (reduced motion); S07 state coverage and N36 (required lab state removed); and I12–I15 with the W11 IB2 command floor (job skipped, commands dropped from the policy and the workflow together, candidate scope bypass). `negative-test-report.md` maps every §18 item to its case.

## 5. Q10 evidence completeness

See the section appended below after the evidence-completeness lane completes.
