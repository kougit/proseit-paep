# DDR-IB2-04: Overflowing dialog/drawer body becomes a focusable named region; page scroll locked while a modal is open

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-04 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C06B, SCR-IB2-C06D, SCR-IB2-R02D (applies to every dialog and drawer) |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | QA (accessibility QA), confirmed in visual conformance review 2026-09-27 |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: ACCEPTED WITH FOLLOW-UP by the PO/SA (2026-09-29)** |
| Reason | Accessibility |

## Description

Two behaviours in `PaepModalBase` (`packages/components/src/lib/dialog/dialog.ts`), shared by `paep-dialog` and `paep-drawer`:

1. **Scrollable body region.** While the body overflows (`scrollHeight > clientHeight + 1`, measured on open and by a `ResizeObserver`), the body gets `tabindex="0"`, `role="region"` and `aria-labelledby` = the title id (`dialog.ts:81-82`, `:159-166`, `:229-236`). Its focus ring is inset (`dialog.css:80-82`, `drawer.css:121-123`).
2. **Scroll lock.** On `showModal()` the document element gets `overflow: hidden`, and the previous value is restored on close (`dialog.ts:155-158`, `:172-178`). The code comment gives the reason: the invoker must still be in view when focus returns to it.

What the handoff says:
- It does not mention either behaviour.
- Dialog "long-content" (component-specs): "header and footer fixed; body scrolls".
- Focus entry for informational/long dialogs is the title (interaction-notes §4).
- accessibility-intent §5: dialog/drawer "bodies scroll the focused element into view".
- Key maps (interaction-notes §3) do not list a Tab stop on the body.

The region adds a Tab stop, which is a change to keyboard behaviour (DCH §19.1(v)). So it is recorded even though it serves the approved WCAG 2.1.1 intent. A long body with no focusable content could otherwise not be scrolled with the keyboard in every browser.

## Evidence

- `dialog.spec.ts:241` "makes an overflowing body a focusable region named by the title, and locks page scroll while open". It asserts: no tabindex/role on a short body; `overflow: hidden` while open and restored after Escape; region + tabindex 0 + aria-labelledby on a long body; PageDown scrolls it.
- `qa:accessibility` O1: axe-core on every open overlay at 1440 and 320 px, PASS (`evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/qa-accessibility.log`).
- Captures `overlay--dialog--read-the-retention-rules--*.png` and `overlay--drawer--show-record-1-details--*.png`. There is no visible difference at rest; the inset ring shows only on keyboard focus.

## Impact

- **User impact:**
  - Keyboard users can scroll long content without a mouse.
  - Screen-reader users meet one extra named region.
  - The page behind the modal cannot scroll. Native `<dialog>` modality already makes it inert, so no task is lost.
- **Architecture/security impact:** none. The component sets an inline style on `<html>` for the duration of the modal. A consumer that also manages `html` overflow could conflict (restored value is the one captured on open).

## Proposed treatment

Accept the adaptation, and add both behaviours to the Dialog/Drawer entries of the next handoff version (keyboard map + semantics).

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | **ACCEPTED WITH FOLLOW-UP** (PO/SA final acceptance decision, 2026-09-29T06:57Z). Follow-up: record the scrollable body region and the page scroll lock in the keyboard map and focus model of a later handoff version. No code change. |
| Resulting handoff version | v1.1 unchanged if accepted; record in the next handoff revision |
