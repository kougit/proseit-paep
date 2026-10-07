# HOF-IB2-001 v1.2: controlled documentation revision

**Status:** APPROVED_FOR_IMPLEMENTATION by the PO/SA (Kouga) on 2026-10-07 ("version v1.2 is approved", project thread message of 2026-10-07T02:39:03Z). Claude prepared this revision and recorded the approval; it did not approve it.
**Revision of:** HOF-IB2-001 v1.1, APPROVED_FOR_IMPLEMENTATION 2026-09-27, manifest SHA-256 `24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53`. v1.1 is retained unchanged under `../design-export/` and stays the accepted IB2 record; this revision only adds.
**Prepared:** 2026-10-06 by Claude Code under IB3-ENTERPRISE-SHELL (`work-packages/IB3-ENTERPRISE-SHELL/WORK_PACKAGE.md` §3 stage S1b; PO/SA authorisation §10).
**Inputs:** the six accepted DDR records in `../deviations/` (PO/SA, 2026-09-29) and the PO/SA decisions Q-02 and RD-01 recorded in HOF-IB3-001 v1.0 (`decision-record.md`, `component-map.md` §2 P-01..P-06 and §2a, board SCR-SHELL-023), approved for implementation on 2026-10-05 (manifest `645dd2e9…fce5`).

## 0. What this revision is

v1.1 §19.2(v) obligation (DCH-01): accepted deviations that change baseline intent are recorded in a later handoff version. This revision records:

1. the accepted behaviour of DDR-IB2-01, -02, -04, -05 and -08 (documentation only, no component change);
2. the approved Q-02 change to component intent: `PaepPopover` logical alignment, `PaepMenu` on the same positioning base, and the action-group overflow rebuilt on it;
3. the IB3-approved generic component additions that belong to the design-system handoff (P-03..P-06), by reference;
4. the closure history of DDR-IB2-03, -06 and -07.

It introduces **no new design decision**. Every statement below is either an accepted DDR behaviour or an already-approved Q / RD / P decision; the source is cited on each row. If the PO/SA finds a statement that is not, it is removed rather than decided here.

## 1. Amendments to v1.1 (accepted DDR behaviour)

Each row amends the named v1.1 file. Where this text and v1.1 differ, this text prevails.

| DDR | v1.1 location | Amendment |
| --- | --- | --- |
| DDR-IB2-01 | `responsive-rules.md` §6 (table) | Below a **40 rem container** (not viewport) inline size, every table cell uses `overflow-wrap: anywhere`, so long words may break mid-word at 320 px. The breakpoint is the container: a shell side navigation narrows the content area and moves the breakpoint to wider viewports. The bounded horizontal scroll strategy remains the fallback only where the table opts into it. |
| DDR-IB2-02 | `component-map.md` row "Overflow ("More") menu"; §"Menu / menubar" | Superseded by §2 below (Q-02). Historical note: in IB2 the overflow menu was its own `popover="manual"` element with a document pointer listener, because `PaepPopover` anchored only at the trigger's inline-start edge. |
| DDR-IB2-04 | `interaction-notes.md` keyboard map (Dialog, Drawer) and focus model | In `PaepModalBase` (dialog and drawer): (1) a body that overflows becomes a focusable region (`tabindex="0"`, `role="region"`, named by the title), an extra Tab stop so keyboard users can scroll it; (2) the document element gets `overflow: hidden` while a modal is open. Consumers (including the shell) do not manage `html` overflow themselves. |
| DDR-IB2-05 | `interaction-notes.md` focus table, Popover (informational) row | An informational popover whose content is long and non-interactive moves focus into the panel (`role="region"`, named by the trigger, no `aria-describedby`). Short informational content keeps focus on the trigger and is referenced by `aria-describedby`; interactive content moves focus into the panel (unchanged). |
| DDR-IB2-08 | `component-map.md` (Dialog, Drawer) | `PaepDialogFooter` and `PaepDialogClose` are public sub-elements of Dialog and Drawer. The footer is end-aligned and stacks full width below 600 px. It has **no automatic `role="group"`** and no destructive separator (PO/SA PD §12; HOF-IB3-001 component map "Not included"). |

## 2. Approved change of intent: governed positioning base (Q-02, RD-01)

Source: HOF-IB3-001 Q-02 and RD-01 (PO/SA, 2026-10-05), component map P-01 / P-02 and §2a, board SCR-SHELL-023. This replaces the v1.1 component-map statements that the overflow menu is "Not a general Menu component" and that a general menu is "Not in tranche".

### 2.1 `PaepPopover` (P-01, D2 extension of an approved component)

| Option | Values | Default |
| --- | --- | --- |
| `align` | `start` \| `end`, logical (inline-start / inline-end edge of the trigger) | `start` (the v1.1 / Generation 4 behaviour, unchanged) |
| side | block-end, flipping to block-start when there is not enough room below; alignment is kept on flip | block-end |
| shift | along the inline axis to keep the accepted **16 px viewport edge margin** (`--paep-space-4`; RD-01, not 8 px); never clipped | on |
| `variant` | `info` \| `menu` (both existing) | `info` |
| max inline size | `min(20rem, 100% − 2 × --paep-space-4)` (v1.1 value) | — |

- **LTR / RTL:** alignment is logical. In RTL `start` is the right edge and `end` is the left edge, so an end-aligned topbar menu sits at the left end of the bar. No physical-direction option exists.
- **Mobile (< 600 px):** the same base; maximum inline size is the viewport minus 2 × 16 px; long items wrap; item target height at least 40 px. No bottom sheet.
- **Dismissal:** platform light dismiss (`popover="auto"`): pointer down outside closes and the outside target still receives the event; Escape closes the top-most popover only and returns focus to its trigger; Tab past the last element closes it (non-modal); opening another menu closes the first (one open menu at a time); a route change closes all; scroll and resize reposition, and close only if the trigger leaves the viewport.
- **Motion:** unchanged from v1.1 (`interaction-notes.md`: enter 200 ms opacity + 4 px, exit 150 ms; instant under reduced motion).

### 2.2 `PaepMenu` (P-02, D1, components)

`PaepMenu` is the reusable menu-button interaction component composed on the `PaepPopover` positioning base. It is **not a second positioning engine**. Items are `menuitem` buttons, link items (`a role="menuitem"`) and `menuitemradio` groups.

| Key | On the menu button | In the menu |
| --- | --- | --- |
| Enter / Space | open, focus the first item | activate the item, close; focus returns to the button (or moves as the action requires) |
| ↓ / ↑ | open on the first / last item | next / previous item, wrapping |
| Home / End | — | first / last item |
| Printable character | — | type-ahead to the next matching item |
| Escape | — | close, focus to the button |
| Tab / Shift+Tab | — | close and move focus in page order |
| Enter / Space on a `menuitemradio` | — | check it (`aria-checked`), uncheck the others in its group, close |

The button carries `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the menu has `role="menu"` and an accessible name. Focus is visible on every item (F07 ring, inset where the menu scrolls).

### 2.3 Action-group overflow migration (P-01, "where technically compatible")

The action-group "More" menu is rebuilt on the base with `align="end"`, replacing the separate `popover="manual"` element and its document listener. Parity, from SCR-SHELL-023:

| Aspect | IB2 (DDR-IB2-02) | On the governed base |
| --- | --- | --- |
| Dismissal | `popover="manual"` + document pointerdown listener | `popover="auto"` light dismiss; same outcome |
| Items | generated from the projected buttons at open; activation runs the original button | kept (the collection stays in the action group) |
| Alignment | menu aligned to More's inline-end edge | base option `align="end"`; kept |
| Keys | ↑ opens on last, Enter on first, Escape returns to More, Tab closes | the base menu key map (same); kept |
| Visual | divider before the destructive item, elevation-3, radius-md | same tokens; kept |

If the rebuild proves technically incompatible with any row, the overflow keeps its IB2 implementation and the gap is recorded as a DDR-IB3 deviation for PO/SA disposition; it is not redesigned here.

## 3. IB3-approved component additions (by reference)

These generic primitives were approved as design intent in HOF-IB3-001 v1.0 (component map §2) and belong to `@proseit/paep-components`. Their full specification stays in HOF-IB3-001; they are listed here so the design-system handoff names every component in the package.

| ID | Component | Class | Specification |
| --- | --- | --- | --- |
| P-03 | `PaepCombobox` + listbox (`aria-activedescendant`, groups) | D1 | HOF-IB3-001 SCR-SHELL-008, `interaction-notes.md` |
| P-04 | `PaepCountBadge` and `PaepIconButton` `count` ("99+" cap, hidden text, `dir="ltr"`) | D2 | SCR-SHELL-009, -006 |
| P-05 | `PaepButton` `variant="field"` (search-trigger presentation) | D2 | SCR-SHELL-001, -005 |
| P-06 | `PaepEmptyState` `kind="unavailable"` | D2 | SCR-SHELL-012 |

No new colour or tone is introduced (Q-13). The foundation additions (P-07 skip link, P-08 24 icons, P-10 tokens) are recorded in HOF-IB3-001 `token-use-map.md` and `asset-register.md`.

## 4. DDR history (appended, IB2 history not rewritten)

| DDR | Original disposition (PO/SA 2026-09-29) | Status after this revision |
| --- | --- | --- |
| DDR-IB2-01 | ACCEPTED WITH FOLLOW-UP (wording) | Recorded in §1; closes on approval of v1.2 |
| DDR-IB2-02 | ACCEPTED WITH FOLLOW-UP (either/or) | Resolved by Q-02 (§2); closes when the rebuilt overflow lands and passes, or with a DDR-IB3 record if incompatible |
| DDR-IB2-03 | CLOSED | unchanged |
| DDR-IB2-04 | ACCEPTED WITH FOLLOW-UP (record) | Recorded in §1; closes on approval of v1.2 |
| DDR-IB2-05 | ACCEPTED WITH FOLLOW-UP (record) | Recorded in §1; closes on approval of v1.2 |
| DDR-IB2-06 | CLOSED | unchanged; the checkbox error API stays deferred |
| DDR-IB2-07 | ACCEPTED WITH FOLLOW-UP (lab, deadline) | Closed in IB3 stage S1a: `evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/` |
| DDR-IB2-08 | ACCEPTED WITH FOLLOW-UP (record; consider `role="group"`) | Recorded in §1 without `role="group"` (PD §12); closes on approval of v1.2 |

Scope note (closure report C2): the F04, F05, F06 and F08 lab omissions were accepted as they are (DDR-IB2-07); their v1.1 boards remain the design reference and no lab change is required.

## 5. Approval

| Field | Value |
| --- | --- |
| Review | bounded documentation-revision review (pre-flight `08` OD-8): incorporation of approved intent only |
| New material decisions | none identified by the preparer |
| Approval | **APPROVED_FOR_IMPLEMENTATION**, PO/SA (Kouga), 2026-10-07T02:39:03Z: "version v1.2 is approved" |
| Effect of approval | v1.2 becomes the design-system handoff for the Q-02 component code (`PaepPopover` alignment, `PaepMenu`, action-group overflow); v1.1 stays the accepted IB2 record |
