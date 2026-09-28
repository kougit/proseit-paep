# DDR-IB2-05: Informational popover with overflowing plain content takes focus as a named region

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-05 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C06E (long content; "max-height 60vh then inner scroll") |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | QA (accessibility QA), confirmed in visual conformance review 2026-09-27 |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: proposed, pending PO/SA decision** |
| Reason | Accessibility |

## Description

The handoff focus rule for an informational popover (component-specs, Popover; interaction-notes §4) says: "focus stays on trigger (content referenced via aria-describedby when short) or moves to the panel if it contains interactive content". It does not say what happens when the content is long but not interactive.

`packages/components/src/lib/popover/popover.ts:200-217` handles that case. When an informational panel has no focusable content but overflows its max-height:
- the panel itself gets `tabindex="0"`, `role="region"` and `aria-labelledby` = the trigger (`:31-33`);
- the panel receives focus;
- `aria-describedby` is not set on the trigger (`:210`).

So the focus rule for this case is an implementation choice (DCH §19.1(v)).

Checked in the same review and **not** a deviation: an informational panel that describes the trigger closes when focus leaves the trigger (`popover.ts:154-160`, `:272-274`; `popover.spec.ts:195`). This matches "Tab from the last element closes and continues in page order (non-modal)" (component-specs, Popover keyboard) and interaction-notes §3.

## Evidence

- `popover.spec.ts:209` "makes long content without controls a focusable region named by the trigger, scrollable with the keyboard": focus on the panel, region + tabindex 0 + aria-labelledby, no aria-describedby, PageDown scrolls, Escape returns focus.
- Captures `overlay--popover--retention-details--{desktop,tablet,narrow320}.png`: a focus ring on the panel, 60 % max-height, inner scroll, shifted/flipped inside the viewport.
- `qa:accessibility` O1 PASS.

## Impact

- **User impact:** keyboard users can read and scroll long popover text. Focus moves off the trigger in this case only, and Escape returns it.
- **Architecture/security impact:** none.

## Proposed treatment

Accept the adaptation. Record the long-content case in the Popover focus intent of the next handoff version. Separately, the handoff already prohibits "essential information only reachable in a popover", which argues for keeping such content short.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | PENDING |
| Resulting handoff version | v1.1 unchanged if accepted |
