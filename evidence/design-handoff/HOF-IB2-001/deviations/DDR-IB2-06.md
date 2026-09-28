# DDR-IB2-06: UI-lab specimens compose native or hand-rolled controls instead of PAEP components

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-06 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C03, SCR-IB2-C05, SCR-IB2-C06C, SCR-IB2-C06D, SCR-IB2-C02 (checkbox) |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | review (visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Defect: correction required** (UI-lab composition; the 25 components themselves are not affected). Status: **RESOLVED (corrected in `0132ff6`, verified 2026-09-27); closure pending PO/SA confirmation.** Low residual note below. |
| Reason | Defect correction |

## Description

`work-packages/IB2-FOUNDATION-COMPONENTS/WORK_PACKAGE.md` classifies the UI laboratory as D2, "composed only of approved components". The approved renders compose these examples from PAEP components. The lab specimens use browser-default buttons or hand-rolled form markup instead, and the difference is visible in the captures at every viewport.

| # | Where (file:line) | Render (approved) | Capture (implementation) |
| --- | --- | --- | --- |
| 1 | `apps/ui-lab/src/app/specimens/table.specimen.ts:121`: `<button paepTableActions type="button" class="lab-action">Create record</button>` (no `paepButton`; `.lab-action` has no style in this file) | `C03-table-shell--*`: primary navy button with plus icon in the table header | `components--table--*`: grey browser-default button |
| 2 | `apps/ui-lab/src/app/specimens/alert.specimen.ts:52`: `<button paepAlertActions … class="lab-action">Retry</button>` | `C05-feedback--*`: alert actions are `paep-button--secondary` | `components--alert--*`: grey browser-default "Retry" |
| 3 | `apps/ui-lab/src/app/specimens/dialog.specimen.ts:82-93`: plain `<label>` + `<input class="input">` + `<p class="error">Error: enter a depot name.</p>` | `C06C-dialog-form-large--*`: `paep-field` anatomy (label weight 600, required asterisk, error icon + text) | `overlay--dialog--rename-depot--*`: regular-weight label, local input style, icon-less error |
| 4 | `apps/ui-lab/src/app/specimens/drawer.specimen.ts:66-78`: the same hand-rolled form | `C06D-drawer` / C06C field anatomy | `overlay--drawer--edit-record-1--*`: same as #3 |
| 5 | `apps/ui-lab/src/app/specimens/checkbox.specimen.ts:72-76`: `<p class="error" id="terms-error">Accept the delivery terms to continue.</p>` | Handoff: invalid = 2 px error border + icon + message (accessibility-intent §2; component-specs Checkbox "field error message") | `components--checkbox--*`: red text with no error icon |

In the same pattern, but not in any render (lab-only controls), these are browser-default buttons: `table.specimen.ts:104` and `list.specimen.ts:60` (state switchers), `alert.specimen.ts:59` and `:70` ("Show the alert again", "Insert …"), `progress.specimen.ts:44-45` (Decrease/Increase). They are recommended for the same correction, so that the lab is composed only of approved components. `foundations/focus`'s "A native button" (`pages/foundation.html:153`) is a deliberate native-element focus demonstration and is excluded.

## Impact

- **User impact** (lab readers/reviewers):
  - The specimens show compositions that do not match the approved design. A product team copying the lab example gets an unstyled action.
  - The hand-rolled field errors lose the icon cue required by REQ-IB2-A11Y-03.
- **Architecture/security impact:** none. `qa:design-system` S04 checks component styles only, not lab composition, so the gates did not catch this.

## Proposed treatment (smallest fix)

1. `table.specimen.ts:121` → `<button paepButton paepTableActions variant="primary" icon="plus">Create record</button>`. Add `PaepButton` to the specimen's `imports` (`:98`).
2. `alert.specimen.ts:52` → `<button paepButton paepAlertActions>Retry</button>` (secondary, as in the render). Use `paepButton` for `:59` and `:70` as well. Add `PaepButton` to `imports`.
3. `dialog.specimen.ts:82-93` and `drawer.specimen.ts:66-78` → `<paep-field label="Depot name" required [error]="nameError() ? 'Enter a depot name.' : undefined"><input paepInput #nameInput value="North depot" /></paep-field>`. Import `PaepField` and `PaepInput`, and remove the local `.input`/`.error` styles. The first-field focus entry is unchanged: the input stays the first field.
4. `checkbox.specimen.ts:76` → prefix the message with `<svg paepIcon="error"></svg>` and use the error foreground token, as `paep-field__error` / `paep-radio-group__error` do.

   PO/SA note: `PaepCheckbox` has no error-message API and `paep-field` does not accept a checkbox. A standalone checkbox error therefore always needs consumer composition. Consider a later component decision.
5. Optional: `paepButton` for the lab-only switchers in `table.specimen.ts:104`, `list.specimen.ts:60` and `progress.specimen.ts:44-45`.
6. Re-run `qa:accessibility` and `browser-qa.mjs --capture`, then recompare C02, C03, C05, C06C and C06D.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | Correction made and verified by the reviewer. The PO/SA confirms closure (APPROVED) with visual acceptance. |
| Resulting handoff version | unchanged (v1.1) |

## Resolution

Fix: commit `0132ff6` ("IB2: visual conformance fixes"). The line numbers in the table above refer to the pre-fix source. The captures were regenerated with the same file names, and the re-review is in `evidence/IB2-FOUNDATION-COMPONENTS/reports/visual-conformance.md` §4.

| # | Fix (current source) | Proving capture(s) | Result |
| --- | --- | --- | --- |
| 1 | `table.specimen.ts:122`: `<button paepButton paepTableActions variant="primary" icon="plus">Create record</button>` | `components--table--{desktop,tablet,narrow320}.png` | Primary navy button with plus icon, as in `C03-table-shell--*`. Row now CONFORMS WITH DEVIATION (DDR-IB2-01 only). |
| 2 | `alert.specimen.ts:52` `paepButton paepAlertActions` Retry; `:59`, `:70` `paepButton` | `components--alert--*.png` | Secondary buttons, as in `C05-feedback--*`. Row CONFORMS. |
| 3 | `dialog.specimen.ts:81-84`: `novalidate` form, `<paep-field label="Depot name" required [error]=…><input paepInput …></paep-field>` | `overlay--dialog--rename-depot--{desktop,tablet,narrow320}.png` | Label 600 + asterisk, first-field focus, as in the `C06C-dialog-form-large--*` field anatomy. Row CONFORMS. |
| 4 | `drawer.specimen.ts:66-69`: the same `paep-field` + `paepInput` composition | `overlay--drawer--edit-record-1--*.png` | As #3. Row CONFORMS. |
| 5 | `checkbox.specimen.ts:77`: `<svg paepIcon="error">` + message, styled with `--paep-color-status-error-fg` | `components--checkbox--*.png` | 2 px error box + icon + text. Row CONFORMS. |

**Low residual note (not a deviation).** The lab-only controls that appear in no render are still browser-default buttons:
- the table state switcher, `table.specimen.ts:104`;
- the list state switcher, `list.specimen.ts:60`;
- the progress Decrease/Increase controls, `progress.specimen.ts:44-45`.

Converting them to `paepButton` is optional.

The PO/SA note about the missing standalone-checkbox error API stands for a later component decision.
