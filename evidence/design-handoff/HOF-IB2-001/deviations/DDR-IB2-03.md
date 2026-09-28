# DDR-IB2-03: Overflow menu drops the destructive item's delete icon

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-03 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C01 (Action group, "Overflow menu open"), SCR-IB2-R03 |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | review (visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Defect: correction required.** Status: **RESOLVED (corrected in `0132ff6`, verified 2026-09-27); closure pending PO/SA confirmation** |
| Reason | Defect correction |

## Description

- **Render** `C01-actions--narrow320.png` (and desktop): the open overflow menu lists Edit, Duplicate, Export, a divider, then **trash icon + "Delete record"** in error colour.
- **Captures** `overlay--action-group--more-actions--{desktop,tablet,narrow320}.png`: the same order and divider, "Delete record" in error colour, but **no icon**.

accessibility-intent §2 lists the non-colour cue for a destructive action as "Explicit outcome text + delete icon; separated in groups".

The source buttons carry the icon (`apps/ui-lab/src/app/specimens/action-group.specimen.ts:59`, `:70`, `:98`, `:104`: `icon="delete"`). The menu loses it because:
- `packages/components/src/lib/action-group/action-group.ts:21-26` (`PaepOverflowEntry`) and `:230-236` (`collectEntries`) copy only `textContent`, `variant`, `disabled` and the source element;
- the menu item template `:94-103` renders only `{{ entry.label }}`.

## Impact

- **User impact:** the destructive item in the menu keeps its explicit text, red colour and the separating divider, but loses the icon shape cue that the approved design and accessibility intent specify. It is inconsistent with the same action outside the menu.
- **Architecture/security impact:** none.

## Proposed treatment (smallest fix)

In `action-group.ts`:
1. Add `readonly icon: PaepIconName | undefined` to `PaepOverflowEntry` and set it in `collectEntries` from `b.icon()`.
2. Import `PaepIcon` (from `@proseit/paep-foundation`, already used by `PaepButton`).
3. Render `@if (entry.icon; as i) { <svg class="paep-action-group__icon" [paepIcon]="i"></svg> }` before the label in the menu item.
4. Add a spec assertion that the destructive menu item contains the icon.
5. Recapture `overlay--action-group--more-actions--*`.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | Correction made and verified by the reviewer. The PO/SA confirms closure (APPROVED) with visual acceptance. |
| Resulting handoff version | unchanged (v1.1) |

## Resolution

- **Fix** (commit `0132ff6`, "IB2: visual conformance fixes"), in `packages/components/src/lib/action-group/action-group.ts`:
  - `:24`: `PaepOverflowEntry` carries `readonly icon: PaepIconName | undefined`.
  - `:240`: `collectEntries` sets `icon: b.icon()`.
  - `:106-107`: the menu item renders `@if (entry.icon; as icon) { <svg class="paep-action-group__item-icon" [paepIcon]="icon"></svg> }` before the label.
- **Test:** `action-group.spec.ts:100-101` asserts that the destructive item contains an `aria-hidden` svg and that an item without an icon has none.
- **Proving captures** (regenerated, same file names): `evidence/IB2-FOUNDATION-COMPONENTS/visual/overlay--action-group--more-actions--{desktop,tablet,narrow320}.png`. Each shows the trash icon + "Delete record" in error colour after the divider, matching `C01-actions--*` "Overflow menu open".
- **Verification:** re-review in `evidence/IB2-FOUNDATION-COMPONENTS/reports/visual-conformance.md` §4. The C01 action-group row is now CONFORMS.
- **Regression:** the gate logs are to be re-run on the final commit (`evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/`).
