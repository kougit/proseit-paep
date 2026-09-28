# DDR-IB2-07: Foundation and R03 lab pages reproduce the tokens but not every demonstration on the approved boards

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-07 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-F04, F05, F06, F07, F08, SCR-IB2-R03 |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | review (visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: proposed, pending PO/SA decision.** The PO/SA may instead classify it as correction-required. |
| Reason | Design change (lab documentation scope) |

## Description

The lab foundation pages (`apps/ui-lab/src/app/pages/foundation.html`) render the approved token values. Their values are equal to the approved token file, as checked by `qa:design-system` S02 and C1. Five boards contain demonstrations that the lab pages do not reproduce, and the R03 proof page omits parts of its board:

| Board (render) | Lab page (capture) | Not reproduced |
| --- | --- | --- |
| F04 `F04-surfaces-elevation--*` | `foundations--surfaces--*` | The role of each level (page, card, reserved raised card, popover/menu, drawer, dialog) and the "Rules" section. |
| F05 `F05-motion--*` | `foundations--motion--*` | The side-by-side reduced-motion frame (static hatched progress, static skeleton). Evidence exists instead in M1 of `qa:accessibility` and in the Simulate-reduced-motion lab setting. |
| F06 `F06-density--*` | `foundations--density--*` | The composed comfortable vs compact comparison (field, buttons, table). The lab shows the token table and one control per density. D1 of `qa:accessibility` measures 40/32/40 px. |
| F07 `F07-focus-states--*` | `foundations--focus--*` | Static focus rings on white, page background, status tint and dark surface, inset in a tab list, compact; and the interaction-state matrix (default/hover/focus/active/selected/disabled/read-only/invalid/loading). The lab gives a keyboard demo; F1 of `qa:accessibility` proves the 2 px ring. |
| F08 `F08-icons--*` | `foundations--icons--*` | The 20 px and 16 px size columns and the "mirrors in RTL" column. The glyph set is the same (25 PAEP-owned icons). |
| R03 `R03-reflow-320--*` | `proofs--responsive--*` | The table header action, a standalone pagination, the "Card and panel" section and the "Overlays at 320" index (`apps/ui-lab/src/app/pages/proofs.ts`, LabProofReflow). These patterns are proven at 320 px on their own pages (`components--card/panel/pagination--narrow320.png`) and in the overlay captures. |

F01, F02, F03 and F09 were judged to conform. Their content is complete, and only the layout differs.

## Impact

- **User impact** (lab readers): less visual documentation of focus on dark/status surfaces, reduced motion and density in context. No component behaviour is missing, and the automated gates cover each item.
- **Architecture/security impact:** none.

## Proposed treatment

Either:
- (a) accept the lab pages as the token-catalogue form of the boards, with the automated gates as the evidence; or
- (b) add the missing demonstrations to `foundation.html` / `proofs.ts`: F07 ring surfaces + state matrix, F05 reduced-motion frame, F06 composed comparison, F08 size/mirror columns, F04 level roles, R03 card/panel + overlays sections.

The reviewer recommends (b) for F07 and R03, the two boards whose missing parts are accessibility demonstrations, and (a) for the rest.

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | PENDING |
| Resulting handoff version | v1.1 unchanged |
