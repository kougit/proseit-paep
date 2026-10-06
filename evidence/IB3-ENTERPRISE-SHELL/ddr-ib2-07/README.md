# DDR-IB2-07 closure evidence (IB3 stage S1a)

Stage S1a of IB3-ENTERPRISE-SHELL completes the UI-lab follow-up of DDR-IB2-07 (PO/SA, 2026-09-29): the F07 focus and state examples and the full R03 320 px board. It is D3 direct-code maintenance reproducing the approved HOF-IB2-001 v1.1 boards `screens/F07-focus-states.html` and `screens/R03-reflow-320.html`. F04, F05, F06 and F08 stay as accepted.

## What was added

| Board | Lab location | Content |
| --- | --- | --- |
| F07 | `apps/ui-lab/src/app/pages/foundation.html` (`/foundations/focus`) | Focus ring on white, page background, status tint, dark surface, inset in a tab list and compact density (`data-f07-surface`); interaction-state matrix for primary and secondary button, input and checkbox: default, hover, focus-visible, active, selected, disabled, read-only, invalid, loading (`data-f07-state`). The accepted keyboard demo is kept. |
| R03 | `apps/ui-lab/src/app/pages/proofs.ts` `LabProofReflow` (`/proofs/responsive`) | Table header action, standalone pagination, Card and panel, Overlays at 320 (`data-r03-section`), in addition to the accepted sections. |

Everything is composed of PAEP components (`paepButton`, `paep-field` + `paepInput`, `paepCheckbox`, `paep-tabs`, `paep-table`, `paep-pagination`, `paep-card`, `paep-action-group`, `paep-panel`). Hover, focus-visible and pressed rows are static specimens drawn with the same foundation tokens the components use (`.lab-f07-*` lab styles); no package under `packages/` changed. The foundation pages are now loaded on demand like the proof pages, which keeps the lab's initial bundle at 321.88 kB (it was 336.69 kB).

## Conformance against the approved boards

| Board | 1440 | 834 | 320 | Result |
| --- | --- | --- | --- | --- |
| F07-focus-states | `captures/foundations--focus--desktop.png` | `captures/foundations--focus--tablet.png` | `captures/foundations--focus--narrow320.png` | CONFORMS: six surfaces and nine states present with the board's non-colour cues; the dark frame uses the neutral-900 reference value of the board |
| R03-reflow-320 | `captures/proofs--responsive--desktop.png` | `captures/proofs--responsive--tablet.png` | `captures/proofs--responsive--narrow320.png` | CONFORMS: all sections stack at 320 px with no page-level horizontal scroll; the overlays index links the lab dialog, drawer and popover specimens |

These are new IB3 captures. The 156 accepted IB2 baselines under `evidence/IB2-FOUNDATION-COMPONENTS/visual/` are unchanged (registry rule B10); the six affected ones (`foundations--focus--*`, `proofs--responsive--*`) are superseded here, not rewritten. Technical conformance is Claude's assessment; the PO/SA reviews the captures at IB3 acceptance (AC-IB3-16, AC-IB3-24).

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| G-DDR07-1 sequence, G-DDR07-2 content, G-DDR07-3 release guard, closure record | `npm run qa:ddr07` | PASS 4/4 |
| Seeded negatives (15 negatives, 2 positive controls) | `npm run qa:ddr07:negative` | PASS 17/17 |
| UI-lab accessibility and reflow, both pages at 1440 / 834 / 320 in LTR and RTL | `node tooling/design-system/browser-qa.mjs --pages …` | PASS, 12 page audits (`browser-qa.json`) |
| Full UI-lab accessibility gate | `npm run qa:accessibility` | PASS |
| Design-system static gate | `npm run qa:design-system` | PASS 10/10 |

Chromium 141.0.7390.37, axe-core 4.13.0, Node 24.21.0.
