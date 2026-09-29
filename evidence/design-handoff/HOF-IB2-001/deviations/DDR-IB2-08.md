# DDR-IB2-08: Dialog and drawer footer is `paep-dialog-footer`, not an action group

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-08 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C06A, C06B, C06C, C06D, R02D |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | review (visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: ACCEPTED WITH FOLLOW-UP by the PO/SA (2026-09-29)** |
| Reason | Technical constraint (API shape) |

## Description

The handoff describes the dialog footer as "(action group: secondary then primary; destructive confirm uses destructive primary)" (component-specs, Dialog, anatomy). It lists the Action group "Footer group (dialog/drawer: stacked full width at narrow)" variant (component-specs, Action group, variants). Neither `component-map.md` nor any other handoff file names a separate footer element.

The implementation instead adds two public elements that are not in the component map:
- `PaepDialogFooter` (`<paep-dialog-footer>`, `packages/components/src/lib/dialog/dialog.ts:27-50`): a flex row, end-aligned, wrapping, and a full-width column below 600 px.
- `PaepDialogClose` (`[paepDialogClose]`, `:190-202`).

The lab uses `paep-dialog-footer` in every dialog and drawer. `paep-action-group variant="footer"` exists (`action-group.ts:114-115`, `action-group.css:49-56`) and is shown on the action-group page, but it is not what the modal template projects (`dialog.ts:242-244`, `select="paep-dialog-footer"`).

Differences:
- There is no visual difference. The captures `overlay--dialog--*` and `overlay--drawer--*` show right-aligned secondary→primary at ≥ 600 px and stacked full width in DOM order at 320 px, as the renders do.
- The footer has no `role="group"` / `aria-label`, and no destructive separator.
- Under DCH §19.1(iii) a public element outside the approved map is recorded.

## Impact

- **User impact:** none visible. There is one less grouping announcement for screen-reader users in dialog footers.
- **Architecture/security impact:** two extra public exports (counted within S03's 44 exports; the component count stays 25). `PaepDialogClose` is needed for the destructive-dialog focus entry (`dialog.ts:113-116`, `:167-169`).

## Proposed treatment

Accept the elements as sub-elements of Dialog/Drawer (like "Row-detail disclosure" for Table shell), and record them in the component map's sub-element table in the next handoff version. Alternatively, project `paep-action-group variant="footer"` in the modal footer slot.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | **ACCEPTED WITH FOLLOW-UP** (PO/SA final acceptance decision, 2026-09-29T06:57Z). Follow-up: record `PaepDialogFooter` and `PaepDialogClose` as Dialog/Drawer sub-elements in the component map of a later handoff version; consider `role="group"` with a label on the footer. |
| Resulting handoff version | v1.1 unchanged if accepted |
