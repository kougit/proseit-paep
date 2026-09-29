# DDR-IB2-02: Action-group overflow menu is its own manual popover, not PaepPopover variant="menu"

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-02 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C01, SCR-IB2-R03 (Action group) |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | review (visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: ACCEPTED WITH FOLLOW-UP by the PO/SA (2026-09-29)** |
| Reason | Technical constraint |

## Description

`component-map.md` (sub-elements) says: "Overflow ("More") menu | Action group | Built on Popover (menu variant); role=menu." Component-specs (Action group, anatomy) says "overflow menu (Popover-based)", and component-specs (Popover, purpose) says "also the base of the action-group overflow menu".

The implementation renders its own top-layer element inside `paep-action-group`:
- `packages/components/src/lib/action-group/action-group.ts:80-105`: `<div popover="manual" role="menu">` with native `role="menuitem"` buttons.
- Its own key handling: `:152-190`.
- Light dismiss by a document `pointerdown` listener: `:59`, `:196-202`.
- Its own positioning below More, aligned to More's **inline-end**: `:241-258`.

It does not use `PaepPopover` (`packages/components/src/lib/popover/popover.ts`), even though `PaepPopover` has a `variant="menu"` (`popover.ts:12`, `:31`, `:138-152`).

A technical reason exists:
- `PaepPopover` always anchors to the trigger's inline-start edge (`popover.ts:219-237`), while the action-group spec requires the menu to open "aligned to the inline-end" of More (component-specs, Action group, RTL).
- The menu items are generated from the projected buttons at open time (`collectEntries`, `:230-239`) and run the original button on activation (`:204-209`).

## Visual and behavioural comparison

The visuals are the same as the render: `--paep-elevation-3`, `--paep-radius-md`, divider before the destructive item (`action-group.css:61-110`). The captures `overlay--action-group--more-actions--{desktop,tablet,narrow320}.png` match C01's "Overflow menu open" frame, apart from DDR-IB2-03.

The key map is as specified (interaction-notes §3) and is proven by `action-group.spec.ts`:
- `:126`: ArrowUp opens on the last item; Escape returns focus to More.
- `:137`: Enter opens on the first item; the item runs and focus returns to More.
- `:158`: Tab closes and continues.

One behavioural difference: `popover="manual"` plus a pointerdown handler replaces the platform's `popover="auto"` light dismiss (component-specs, Popover semantics). Escape is handled by the component.

## Impact

- **User impact:** none observed. Same appearance, keys, focus return and dismissal.
- **Architecture/security impact:** there are two popover implementations to maintain (positioning, light dismiss) instead of one. No security impact. The menu is internal to Action group and adds no public component.

## Proposed treatment

Accept the adaptation, or, if the PO/SA prefers the handoff's single-base intent, record a correction: add an inline-end alignment option to `PaepPopover` and rebuild the overflow menu on it. That is a larger change than this review can scope.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | **ACCEPTED WITH FOLLOW-UP** (PO/SA final acceptance decision, 2026-09-29T06:57Z). Follow-up: either give `PaepPopover` an inline-end alignment and rebuild the overflow menu on it in a later work package, or reword the component map in a later handoff version. |
| Resulting handoff version | v1.1 unchanged if accepted (update component-map wording in a later version) |
