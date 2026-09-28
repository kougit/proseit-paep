# IB2-FOUNDATION-COMPONENTS — Accessibility Report

Target: WCAG 2.2 AA (PAEP-IR-01 §6.3; HOF-IB2-001 `accessibility-intent.md`). Status: PASS (technical). Acceptance is the PO/SA's decision.

## 1. Automated browser gate (`npm run qa:accessibility`, CI job `PAEP / accessibility`)

`tooling/design-system/browser-qa.mjs` serves the production `ui-lab` build and discovers every laboratory page from the contents list. It runs installed Chromium with axe-core 4.13.0, tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`.

| Check | Scope | Result |
| --- | --- | --- |
| A1 axe-core: zero violations | 40 pages × 1440/834/320 px × LTR/RTL = 240 page audits | 0 violations |
| A2 no page-level horizontal overflow | same 240 audits | none |
| A3 no console or page error | same | none |
| A4 exactly one `h1` and one `main` | same | PASS |
| O1 axe on every open overlay | 12 overlays (4 dialogs, 3 drawers, 4 popovers incl. the menu variant, the action-group More menu) × 1440 and 320 px = 24 audits; Escape then closes each and focus must return to its trigger | 0 violations; focus returned in all 24 |
| U1 status never by colour alone | every visible status badge, alert and field error on the status-badge, alert, field and table pages has a visible icon and text (WCAG 1.4.1) | PASS |
| K1 no keyboard trap | Tab pressed 60 times from the top of every `/components/*` page at 1440 px; focus must move on every press (WCAG 2.1.2) | PASS |
| M1 reduced motion | media emulation and the lab simulation: every `--paep-motion-duration-*` is 0 ms, the spinner stops; default base duration 150 ms | PASS |
| D1 density | comfortable 40 px; compact 32 px on a fine pointer, 40 px on a coarse pointer | PASS |
| C1 computed tokens | page background, Navy primary button `rgb(36, 54, 75)`, focus-ring token `#2D4FD1` | PASS |
| B1 brand isolation | synthetic petrol changes the brand layer only; all 46 protected tokens keep their approved values | PASS |
| F1 focus ring | keyboard focus on a component shows 2 px solid `rgb(45, 79, 209)` | PASS |

The negative suite (`qa:accessibility:negative`, 16 cases) proves the gate can fail:

- B01 image-alt, B02 button-name, B03 colour-contrast and B04 label (axe A1);
- B05 fixed width causing overflow at 320 px;
- B06 console error;
- B07 second `h1`;
- B08 brand override of a protected token;
- B09 a defect inside an open dialog (O1);
- B10 an overlay that fails to open (O1);
- B11 a control that swallows Tab, i.e. a keyboard trap (K1);
- B12 a motion duration left at 150 ms under reduced motion (M1);
- B13 focus lost after a dialog is dismissed (O1);
- B14 a status badge with its icon hidden, i.e. status by colour alone (U1);
- B15 the reduced-motion rules removed from the stylesheets (M1);
- B00 positive control.

## 2. Behaviour tests (`npm run test:components`, 254 tests)

Keyboard, focus and semantics are asserted in a real browser. `keyboard-focus.md` gives the per-component keyboard model and focus behaviour, with the proving test titles. Examples:

- dialog and drawer: focus entry (first field, Cancel for destructive, else the title), Tab containment, Escape as cancel (ignored while busy), focus return to the invoker or `returnFocusTo`, overflowing body as a named focusable region, page scroll lock;
- popover: menu arrow keys and Home/End, Escape, light dismiss, closing when Tab leaves an informational trigger, long content-only panel as a focusable region;
- tabs: roving tabindex, arrows following visual direction in RTL, automatic activation;
- radio group: arrow navigation by native semantics;
- field: `aria-describedby` for help and errors; `aria-invalid`; error summary;
- pagination: `aria-current`, `aria-disabled` ends, label in name (2.5.3), focus moved to the paged heading;
- announcer: polite and assertive live regions, with repeats announced.

## 3. Independent accessibility QA (lane X, §21 Q3)

| Round | Findings | Status |
| --- | --- | --- |
| Round 1 | 7 findings plus 1 Info. Two High: X1 scroll regions not keyboard-operable; X2 label in name. Three Medium: X3 background scroll; X4 forced colours; X5 popover Tab-out. Two Low: X6, X7 | All fixed; see `independent-qa.md` §1 for each fix and its proving test |
| Round 2 | Re-check of the round-1 fixes (X1–X5 VERIFIED); new Low R2-3, R2-4 (popover focus) and Info R2-5 | R2-3, R2-4 fixed; see `independent-qa.md` §3 |

Open accessibility findings: **High 0, Medium 0**.

## 4. Contrast and non-colour cues

- Token pairs: the handoff records its 54 required pairs as passing (`token-values.md` §1.7). The foundation contrast tests recompute 30 of them (22 text, 8 non-text) from the generated catalogue, and the brand validator enforces the brand pairs for any override.
- Brand validator rules 1–7 reject any profile that would lower the approved contrast (see `token-governance.md`).
- Status is never conveyed by colour alone: the badge and alert carry an icon and text. Invalid fields carry an icon, text and `aria-invalid`.
- Forced colours: the focus ring, the tabs selected indicator, progress and the field control box use system colours.

## 5. Not automated

Screen-reader speech output (NVDA/JAWS/VoiceOver) was not recorded. Names, roles, states and live regions are verified through the DOM and the CDP accessibility tree (lane X), not through audio.
