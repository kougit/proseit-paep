# IB2-FOUNDATION-COMPONENTS — Visual Conformance Report (HOF-IB2-001 v1.1)

Reviewed 2026-09-27 against handoff **HOF-IB2-001 v1.1 (APPROVED_FOR_IMPLEMENTATION)**, standard PAEP-DCH-01 v1.0 §20–§21. First review: HEAD `80bbb8d` with an uncommitted working tree (captures of 2026-09-27 19:25). **Re-review (§4):** the six DOES NOT CONFORM rows were rechecked against the regenerated captures (same file names, 2026-09-27 19:52) at commit `0132ff6` ("IB2: visual conformance fixes"). All 156 captures (120 page + 36 overlay) were then recaptured on the final code commit (`logs/verification-6dc71cc/`); source line numbers cited below are as at `0132ff6`.

**Status of the captures: CANDIDATE.** Every capture under `evidence/IB2-FOUNDATION-COMPONENTS/visual/` is a CANDIDATE visual baseline awaiting the Product Owner / Solutions Architect's acceptance. Nothing in this report is self-approved. The verdicts here are the reviewer's technical assessment. They are not the design acceptance, and they do not resolve any deviation record (DDR).

## 1. Method

1. **Inputs.** The approved renders are `evidence/design-handoff/HOF-IB2-001/design-export/screens/renders/*.png`: 28 screens at desktop 1440, tablet 834 and narrow320, plus two reduced-motion renders. I also read `component-specs.md`, `component-map.md`, `interaction-notes.md`, `responsive-rules.md`, `accessibility-intent.md` and `decision-record.md`. The implementation captures are `evidence/IB2-FOUNDATION-COMPONENTS/visual/*.png`: 156 files. They are full-page captures of the 40 lab pages at the three viewports (LTR), plus 12 viewport captures of open overlays × 3 viewports. They were produced by `node tooling/design-system/browser-qa.mjs --capture`.
2. **Matching.** Each handoff screen was matched to the lab page or pages that implement it. The handoff boards group components by family (for example C01 = button + icon button + action group), while the lab has one page per component (L02 specimen template, OD-21). So one render usually maps to several captures.
3. **Viewing.** The images were read directly, with render and capture composited side by side at native resolution in the scratchpad (not retained).
   - Every **narrow320** pair was viewed, all 28 screens, including all 12 overlay captures.
   - **Every overlay pair** was viewed at all three viewports.
   - Desktop/tablet pages were sampled: C01, C03 (desktop and tablet), C07 (tablet), R02 (desktop), L01 (desktop), plus all C06 overlays at desktop and tablet.
4. **Criteria (DCH §21(ii)).** Anatomy and hierarchy; token use (colour, spacing, radius, typography, elevation); the states shown; responsive behaviour at 320 px; focus indication; iconography; content.
   - Pixel equality is not the criterion (§21(iv)).
   - Differences caused only by the lab's neutral sample content ("Record 1", "Rename depot", "North depot" where a render says "supplier record REC-2026-000184", "Create record" and so on) are **content-only** and not deviations.
   - Initial focus rings appear in renders but not in captures. That is the difference between pointer and keyboard entry, and it is not a deviation where a component test proves the focus entry. Proven by: `dialog.spec.ts:101` (destructive → Cancel), `:106` (informational → title), `:114` (form → first field); `drawer.spec.ts:79`, `:90`; `popover.spec.ts:83`, `:159`; `action-group.spec.ts:126`, `:137` (menu → first/last item).
5. **Code reading.** Every candidate deviation was checked in the source (file:line cited in the DDRs), not assumed.
6. **Limits.**
   - The captures show each page in its initial state. For the lab state switchers (table, list), the loading, empty, no-results and error states the renders show are not captured. For those states the evidence is the component tests (`test:components`, 254 tests; the S09 static count is also 254) and the S07 specimen metadata. They are not visual.
   - RTL whole-page captures are not produced (captures are LTR only). The RTL proof page and the RTL overlay captures are compared; whole-page RTL is covered by `qa:accessibility` (A1/A2, 240 audits).
   - Reduced-motion renders (`*--desktop-reduced-motion.png`) have no capture counterpart; M1 in `qa:accessibility` is the evidence.

Verdicts:
- **CONFORMS**: approved intent matched.
- **CONFORMS WITH DEVIATION (DDR id)**: intent met with a recorded adaptation awaiting PO/SA decision.
- **DOES NOT CONFORM**: a defect against the approved handoff, recorded as a DDR classified "defect".

Two DDRs are API/architecture-level with no visible difference (DDR-IB2-02, DDR-IB2-08). They are listed in the notes but do not by themselves change a visual verdict.

Capture names below drop the `evidence/IB2-FOUNDATION-COMPONENTS/visual/` prefix and the `--{desktop,tablet,narrow320}.png` suffix. Render names drop `design-export/screens/renders/` and the same suffix.

## 2. Per-screen results

### SCR-IB2-C01 Actions — render `C01-actions`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--button` | CONFORMS | Variants, icons, loading (spinner + label), disabled (dashed), block and compact match; navy primary, error-strong destructive with delete icon. Content-only differences. |
| `components--icon-button` | CONFORMS | Bordered secondary / borderless tertiary, disabled dashed, compact 32 px, mirrored chevrons in RTL. The arrangement differs (content-only). |
| `components--action-group`, `overlay--action-group--more-actions` | CONFORMS (DDR-IB2-03 resolved; DDR-IB2-02 API-level) | Wide/narrow/footer/long-label/RTL all match: primary at inline-end, More at inline-end below 30 rem, menu aligned to the More button's inline-end, destructive last after a divider. The menu flips above More when there is no space below (tablet/narrow overlay), as specified. *Re-review:* the destructive menu item now shows the trash icon + "Delete record" in error colour at all three viewports, as in the C01 render. The first review had found it missing. |

### SCR-IB2-C02 Forms — render `C02-forms`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--field` | CONFORMS | Label 600 + asterisk, help, 2 px error + icon + text, read-only/disabled dashed, prefix/suffix adornments, RTL swap. The validation example starts valid (error on blur/submit, per interaction-notes §2). |
| `components--input` | CONFORMS | Adornments, placeholder never a label, long value, compact, RTL. |
| `components--select` | CONFORMS | Chevron, invalid, disabled, read-only (as read-only input), truncated long option, RTL chevron at inline-end. |
| `components--textarea` | CONFORMS | Min height, dirty meta text, invalid, read-only/disabled, inner vertical scroll. |
| `components--checkbox` | CONFORMS (DDR-IB2-06 resolved) | Box, tick/dash glyphs, states and RTL match. *Re-review:* the "Invalid (with a message)" example now shows the 2 px error box + error icon + message (`checkbox.specimen.ts:77`). The first review had found the icon missing. |
| `components--radio` | CONFORMS | Vertical/horizontal wrap, invalid group with icon, disabled, read-only, long labels, RTL. |

### SCR-IB2-C03 Table shell — render `C03-table-shell`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--table` | CONFORMS WITH DEVIATION (DDR-IB2-01; DDR-IB2-06 resolved) | Priority columns → Details at < 60 rem, icon-only Details and 8 px cells at < 40 rem, key cell with ID line, status never hides, compact density, bounded scroll fallback with sticky first column: all match. *Re-review:* "Create record" is now a primary navy button with the plus icon (`table.specimen.ts:122`) at all viewports, as in the render. Remaining: mid-word breaks of long words at 320 px (DDR-IB2-01). Low note: the lab-only state switcher (`:104`) is still native buttons. |

### SCR-IB2-C03N Table narrow strategies — render `C03N-table-narrow-strategies`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `proofs--table-strategies` | CONFORMS WITH DEVIATION (DDR-IB2-01) | Strategy A (primary), C (bounded scroll, sticky key column) and B (card summary, rejected as a table mode) are all present. At 320 px the capture breaks fewer words mid-word than the render ("Sampl e", "descri ptive" in the render). The render's evaluation table is design-record content, not reproduced (content-only). |

### SCR-IB2-C04 List, pagination, empty state — render `C04-list-pagination-empty`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--list` | CONFORMS | Leading icon, link primary text, badge meta, per-item tertiary action. Meta moves below the text in a < 20 rem container, per responsive-rules §2; the 320 render keeps it beside the text, and the capture follows the written rule. |
| `components--pagination` | CONFORMS | Compact "8 / 20" below 36 rem, aria-disabled ends kept in place, selected page 2 px border + fill (desktop). |
| `components--empty-state` | CONFORMS | Tray vs search-with-cross icons, distinct text/actions, disabled action with reason, long text. |

### SCR-IB2-C05 Feedback — render `C05-feedback`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--alert` | CONFORMS (DDR-IB2-06 resolved) | Tints, icon shapes, dismiss, long content and inserted alerts match. *Re-review:* "Retry" and the "Insert …" / "Show the alert again" controls are now PAEP secondary buttons (`alert.specimen.ts:52`, `:59`, `:70`), as in the render. |
| `components--status-badge` | CONFORMS | Five tones with icon + text, word-boundary wrap in a narrow cell, inline in text. |
| `components--progress` | CONFORMS | 8 px track `--paep-ref-color-neutral-200` and brand-primary fill, as the handoff specifies (component-specs "Progress" token usage). Step variant; indeterminate captured mid-travel (motion on). Low note: the lab-only Decrease/Increase controls are still native buttons (DDR-IB2-06 residual note). |
| `components--skeleton` | CONFORMS | Text/list/cell shapes in `--paep-ref-color-neutral-100` (named in the handoff as foundation-internal), last line 60%. |

### SCR-IB2-C06A Dialog, destructive — render `C06A-dialog-destructive`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `overlay--dialog--delete-record-1`, `components--dialog` | CONFORMS | sm, radius lg, elevation 5, scrim, title + close, description, divider above the footer, Cancel then destructive primary with delete icon, stacked full width at < 600 px. The render's ring on Cancel is keyboard entry; Cancel entry is proven by `dialog.spec.ts:101`. Footer element: DDR-IB2-08 (no visual difference). |

### SCR-IB2-C06B Dialog, long content — render `C06B-dialog-long-content`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `overlay--dialog--read-the-retention-rules` | CONFORMS WITH DEVIATION (DDR-IB2-04) | Max height viewport − 48 px (− 32 px narrow), fixed header and footer, body scrolls. The header divider appears only once scrolled, per spec. The render shows it at rest; the capture follows the text. Title entry is proven by `dialog.spec.ts:106`. The overflowing body becomes a focusable named region and page scroll is locked: DDR-IB2-04. |

### SCR-IB2-C06C Dialog, large form — render `C06C-dialog-form-large`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `overlay--dialog--rename-depot` | CONFORMS (DDR-IB2-06 resolved) | lg 50 rem on desktop, full screen without radius at 320 px, first-field entry (`dialog.spec.ts:114`). *Re-review:* the form is now `paep-field` + `input[paepInput]` in a `novalidate` form (`dialog.specimen.ts:81-84`): label weight 600, required asterisk, field max 40 rem, focus ring on the first field. This matches the render's field anatomy. The error state is not in the capture (initial state); `paep-field`'s icon + text error is shown on `components--field`. |

### SCR-IB2-C06D Drawer — render `C06D-drawer`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `overlay--drawer--show-record-1-details` | CONFORMS WITH DEVIATION (DDR-IB2-04) | Inline-end sheet, full height, 30 rem on desktop; on tablet min(30 rem, 100vw − 48 px) leaves a context strip; full width at 320. Leading border, elevation 4, header divider, scrolling body, footer. Content-only difference: a field list instead of the render's badge/tabs detail. Overflowing body region / scroll lock: DDR-IB2-04. |
| `overlay--drawer--edit-record-1` | CONFORMS (DDR-IB2-06 resolved) | Drawer anatomy conforms. *Re-review:* the form is now `paep-field` + `input[paepInput]` (`drawer.specimen.ts:66-69`): label 600 with asterisk, first-field focus. |
| `components--drawer` | CONFORMS | Specimen page: triggers for end/lg/start, form and RTL drawers. |

### SCR-IB2-C06E Popover — render `C06E-popover`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `overlay--popover--about-the-pending-status` | CONFORMS | Informational panel (surface overlay, border subtle, radius md, elevation 3, ≤ 20 rem). Anchored below the trigger's inline-start edge on desktop and flipped above at 320 px when space below is short, as the render's "Status help" example shows. Focus stays on the trigger (`popover.spec.ts:83`). Closing when Tab leaves the trigger (`popover.spec.ts:195`, `popover.ts:158-160`) matches the handoff's non-modal "Tab … closes and continues in page order". Not a deviation. |
| `overlay--popover--related-records` | CONFORMS | Interactive content: focus moves to the first link (ring visible, `popover.spec.ts:159`). |
| `overlay--popover--retention-details` | CONFORMS WITH DEVIATION (DDR-IB2-05) | Long content: max-height 60%, inner scroll, shifted 16 px inside the viewport, flipped above. The panel takes focus as a named region (ring on panel): DDR-IB2-05. |
| `overlay--popover--more-actions` | CONFORMS | `PaepPopover variant="menu"`: role menu, first item focused with a ring. |
| `components--popover` | CONFORMS | Specimen page including the disabled trigger. |

### SCR-IB2-C07 Navigation — render `C07-navigation`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--tabs` | CONFORMS | 3 px indicator + weight 600, count badge, error icon + "Contains 2 errors", bounded scroll with edge buttons (the clipped third tab at 320 px matches the render's clipped "Attac…"), long labels wrap within 18 rem, manual activation, RTL. |
| `components--breadcrumb` | CONFORMS | Full, collapsed (first · … · parent · current), narrow-container collapse, long segments wrap, current not a link (600), RTL separators mirror. |

### SCR-IB2-C08 Structure — render `C08-structure`

| Capture(s) | Verdict | Note |
| --- | --- | --- |
| `components--card` | CONFORMS | Title/description/actions/footer. Actions move under the title below 30 rem; long title wraps. The render's actions are an action group (Refresh + More) and the lab's are "Edit" (content-only). |
| `components--panel` | CONFORMS | Subtle header, collapsible with chevron, "Contains 2 errors" when collapsed, long title, RTL chevron mirrors. |
| `components--divider` | CONFORMS | Full/inset horizontal, vertical hides on wrap, compact. |

### Foundations F01–F09

| Screen / render | Capture(s) | Verdict | Note |
| --- | --- | --- | --- |
| F01 `F01-colour` | `foundations--colour` | CONFORMS | Neutral ramp, protected semantic/status, brand layer and contrast evidence present, with values equal to the approved tokens (S02). The presentation is a token list instead of large swatches (lab layout). |
| F02 `F02-typography` | `foundations--typography` | CONFORMS | Full type scale and font families (system stack, OD-01). |
| F03 `F03-spacing-size-radius` | `foundations--spacing` | CONFORMS | Spacing 0–10 + 0-5, icon/target sizes, radius scale. |
| F04 `F04-surfaces-elevation` | `foundations--surfaces` | CONFORMS WITH DEVIATION (DDR-IB2-07) | Six elevation levels shown with borders. The render's role mapping (page/card/popover/drawer/dialog) and rules section are not reproduced. |
| F05 `F05-motion` | `foundations--motion` | CONFORMS WITH DEVIATION (DDR-IB2-07) | All duration/easing/loop tokens and a live spinner. The render's side-by-side reduced-motion frame is not reproduced (M1 gate is the evidence). |
| F06 `F06-density` | `foundations--density` | CONFORMS WITH DEVIATION (DDR-IB2-07) | Density token list + comfortable/compact control. The render's composed comparison (field + buttons + table in both densities) is not reproduced (D1 gate). |
| F07 `F07-focus-states` | `foundations--focus` | CONFORMS WITH DEVIATION (DDR-IB2-07) | Focus-ring tokens and a keyboard demo (link, button, region). The render's ring on white/page/status tint/dark surface/tab inset/compact and the interaction-state matrix are not reproduced. The ring itself is proven by F1 in `qa:accessibility`. The missing ring in the capture is keyboard vs pointer, not a defect. |
| F08 `F08-icons` | `foundations--icons` | CONFORMS WITH DEVIATION (DDR-IB2-07) | The same 25 PAEP-owned glyphs, 24 px only. The render's 20/16 px columns and "mirrors in RTL" column are not reproduced. |
| F09 `F09-brand-override` | `proofs--brand` | CONFORMS | Navy/gold default profile, protected status/focus/validation, a live protected-token table and a link to the synthetic petrol profile (B1 gate). One profile at a time instead of side by side (lab setting, OD-21). |

### UI lab L01–L02

| Screen / render | Capture(s) | Verdict | Note |
| --- | --- | --- | --- |
| L01 `L01-ui-lab-home` | `home` | CONFORMS | OD-21 IA: contents list at inline-start from 64 em and a disclosure below it; flat Foundations / Components (per family) / Proofs; the "how the lab is organised" text. Minor lab-chrome styling: the Contents toggle is a compact button without the `contents` icon, and the settings selects are regular weight. Not material (DCH §19.1). |
| L02 `L02-ui-lab-specimen-button` | `components--button` | CONFORMS | Specimen template order: purpose, examples, variants and states, keyboard, accessibility, responsive/localisation, content keys, evidence (with real evidence text instead of the render's placeholder). |

### Proofs R01–R03

| Screen / render | Capture(s) | Verdict | Note |
| --- | --- | --- | --- |
| R01 `R01-long-content` | `proofs--long-content` | CONFORMS WITH DEVIATION (DDR-IB2-01) | ~2× buttons and tabs, three-line label/help/error, long alert with unbroken URL, long badge, long card title with actions below, long IDs in the table. "exceptionally"/"descriptive" break mid-word in the 320 px key column (DDR-IB2-01). |
| R02 `R02-rtl` | `proofs--rtl` | CONFORMS | Arabic samples with `dir="rtl"`: form, tabs, breadcrumb, pagination, directional icons, alert and table; identifiers `dir="ltr"`, numeric columns at inline-end. The render sets the whole lab to RTL; the capture keeps the lab LTR with RTL sample regions (content/setting). |
| R02D `R02D-drawer-rtl` | `overlay--drawer--open-right-to-left-drawer`, `overlay--dialog--open-right-to-left-dialog` | CONFORMS | The drawer attaches to the left edge, close at inline-end (left), title wraps. The RTL dialog mirrors close and footer order (C06 rule). |
| R03 `R03-reflow-320` | `proofs--responsive` | CONFORMS WITH DEVIATION (DDR-IB2-07; also DDR-IB2-01) | Action group, field error, alert, tabs, breadcrumb and table + pagination reflow at 320 px with no page scroll. The R03 board's table header action, standalone pagination, card-and-panel section and "Overlays at 320" index are not on the proof page; they are proven on their own page captures and in the overlay captures. |

### Captures without a handoff render

`tokens--*` (token catalogue page) has no render. It is part of the approved lab IA (Overview group) and was not compared. The `components--*` specimen pages not named above are all mapped in the tables.

## 3. Totals

49 comparison rows covering all 28 handoff screens (mapped to 39 of the 40 captured lab pages, all but the token catalogue, and to the 12 overlay capture sets, each at three viewports).

| Verdict | First review (captures 19:25) | **Re-review (captures 19:52, `0132ff6`)** |
| --- | --- | --- |
| CONFORMS | 32 | **37** |
| CONFORMS WITH DEVIATION | 11 | **12** (C03 table, C03N, C06B, C06D details, C06E retention, F04, F05, F06, F07, F08, R01, R03) |
| DOES NOT CONFORM | 6 (C01 action group, C02 checkbox, C03 table, C05 alert, C06C rename-depot dialog, C06D edit drawer) | **0** |

Deviation records (in `evidence/design-handoff/HOF-IB2-001/deviations/`):

| DDR | Subject | Classification |
| --- | --- | --- |
| DDR-IB2-01 | Table < 40 rem: `overflow-wrap: anywhere`; long words break mid-word at 320 px | proposed acceptable adaptation, pending PO/SA decision |
| DDR-IB2-02 | Action-group overflow menu is its own `popover="manual"` menu, not `PaepPopover variant="menu"` | proposed acceptable adaptation, pending PO/SA decision |
| DDR-IB2-03 | Overflow menu drops the destructive item's delete icon | defect: **RESOLVED** by correction in `0132ff6`, verified in re-review (closure pending PO/SA confirmation) |
| DDR-IB2-04 | Overflowing dialog/drawer body becomes a focusable named region; document scroll locked while modal | proposed acceptable adaptation, pending PO/SA decision |
| DDR-IB2-05 | Informational popover with overflowing plain content takes focus as a named region | proposed acceptable adaptation, pending PO/SA decision |
| DDR-IB2-06 | UI-lab specimens compose native / hand-rolled controls instead of PAEP components | defect: **RESOLVED** by correction in `0132ff6`, verified in re-review (closure pending PO/SA confirmation); Low residual note on lab-only switchers |
| DDR-IB2-07 | Foundation and R03 lab pages reproduce the tokens but not all board demonstrations | proposed acceptable adaptation, pending PO/SA decision |
| DDR-IB2-08 | Dialog/drawer footer is `paep-dialog-footer`, not an action group (footer variant) | proposed acceptable adaptation, pending PO/SA decision |

Verified as conforming, with no DDR:
- Progress and skeleton use `--paep-ref-color-neutral-200` / `-100`. The handoff names exactly these foundation-internal tokens (component-specs "Progress" and "Skeleton" token usage; component-map rows 16–17).
- Informational popovers close when focus leaves the trigger: interaction-notes §3 "Tab past last element closes (non-modal)"; focus stays on the trigger for informational content (§4).

**Overall visual conformance (re-review): no DOES NOT CONFORM rows remain.** The two defects (DDR-IB2-03, DDR-IB2-06) are corrected and verified against the regenerated captures. Still open:
- **Decisions:** the six proposed adaptations (DDR-IB2-01, -02, -04, -05, -07, -08) need a PO/SA decision.
- **Baselines:** the regenerated CANDIDATE baselines need PO/SA acceptance.
- **Low note:** lab-only native controls remain (table and list state switchers `table.specimen.ts:104`, `list.specimen.ts:60`; progress Decrease/Increase `progress.specimen.ts:44-45`). They are not in any render and are optional.

## 4. Re-review of the DOES NOT CONFORM rows (captures regenerated at `0132ff6`)

Method: the regenerated captures (same file names) were viewed side by side with the renders. The six rows were viewed at narrow320, and the overlays also at tablet/desktop. The corrected source lines were read.

| Row | Captures rechecked | Correction verified in source | New verdict |
| --- | --- | --- | --- |
| C01 action group | `overlay--action-group--more-actions--{narrow320,tablet,desktop}`, `components--action-group--desktop` | `action-group.ts:24` (`icon` on the entry), `:106-107` (`<svg [paepIcon]>` in the menu item), `:240` (`icon: b.icon()`); `action-group.spec.ts:100-101` (the destructive item has an aria-hidden svg; an icon-less item has none) | CONFORMS |
| C02 checkbox | `components--checkbox--narrow320` | `checkbox.specimen.ts:77` (error icon + text; style with `--paep-color-status-error-fg`) | CONFORMS |
| C03 table | `components--table--{narrow320,desktop}` | `table.specimen.ts:122` (`paepButton` primary, `icon="plus"`) | CONFORMS WITH DEVIATION (DDR-IB2-01) |
| C05 alert | `components--alert--narrow320` | `alert.specimen.ts:52`, `:59`, `:70` (`paepButton`) | CONFORMS |
| C06C rename dialog | `overlay--dialog--rename-depot--{narrow320,desktop}` | `dialog.specimen.ts:81-84` (`novalidate` form, `paep-field` + `paepInput`) | CONFORMS |
| C06D edit drawer | `overlay--drawer--edit-record-1--{narrow320,desktop}` | `drawer.specimen.ts:66-69` (`novalidate` form, `paep-field` + `paepInput`) | CONFORMS |

The regenerated captures remain CANDIDATE baselines awaiting PO/SA acceptance. Nothing is self-approved.
