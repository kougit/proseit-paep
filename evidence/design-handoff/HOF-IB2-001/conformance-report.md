# Design Conformance Report: HOF-IB2-001 v1.1

PAEP-DCH-01 §18(vi), §20, §21, §22.

| Field | Value |
| --- | --- |
| Handoff | HOF-IB2-001 **v1.1**, status APPROVED_FOR_IMPLEMENTATION (manifest sha256 `24e7049d…40ac53`, pinned by `qa:design-system` S01) |
| Design Work Package | DWP-IB2-001 v1.0 |
| Implementing work package | IB2-FOUNDATION-COMPONENTS |
| Implementation state reviewed | First review: HEAD `80bbb8d` plus working tree. Re-review of the defect rows: commit `0132ff6` with regenerated captures. Gate logs: `evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/` (to be re-run on the final commit) |
| Handoff status (DCH §24) | **IMPLEMENTED**. Visual review: no defect remains open (DDR-IB2-03 and -06 resolved). PASS depends on the gate re-run on the final commit. Not ACCEPTED: ACCEPTED is the PO/SA's decision only. |
| Report date | 2026-09-27 |

## 1. Matched intent

The implementation delivers all 25 tranche components mapped in `design-export/component-map.md` (mapping: `implementation/README.md`).
- **Tokens:** they equal the approved values (S02, C1).
- **Brand:** the brand layer is overridable and protected tokens are fixed (B1).
- **Responsive:** components are container-query driven and overlays viewport-driven, per `responsive-rules.md`.
- **Focus and keyboard:** focus entry/return and key maps follow `interaction-notes.md`, proven by component tests.
- **Motion:** reduced motion zeroes durations and stops loops (M1).
- **Reflow:** no page-wide horizontal scroll at 320 px on any page (A2).

The visual review compared all 28 handoff screens with the implementation captures:

| Verdict | First review | After correction (re-review) |
| --- | --- | --- |
| CONFORMS | 32 | **37** |
| CONFORMS WITH DEVIATION | 11 | **12** |
| DOES NOT CONFORM | 6 | **0** |

Full per-screen tables, method and limits: **`evidence/IB2-FOUNDATION-COMPONENTS/reports/visual-conformance.md`**.

## 2. Automated evidence

Logs are cited as `evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/`: the gates will be re-run on the final commit, and the coordinator fills in the SHA. Each gate must exit 0 there (`summary.txt`). The results below are from the suites run on the final code; confirm them against the final logs.

| Gate | Result | What it proves for conformance |
| --- | --- | --- |
| `npm run qa:design-system` | PASS 10/10 (`qa-design-system.log`) | S01 approved handoff v1.1 retained and every handoff file hash-pinned. S02 tokens equal the generator output from the approved values. S03 exactly the 25 IR-01 §6.4 components through the public entry point. S04 component styles use only `--paep-*` tokens and logical properties. S05 import boundaries. S06 clean-room terms. S07 every component has a specimen page with the required metadata and every applicable handoff state (185) documented. S08 message catalogue equals the approved 48 content keys. S09 test hygiene (254 tests in 27 spec files). S10 every `(click)` in component templates is on a native interactive element or carries an interactive role (15 handlers). |
| `npm run qa:design-system:negative` | PASS 49/49 (`qa-design-system-negative.log`) | The S-gates fail on seeded violations: 48 negatives N01–N48 plus positive control C00. |
| `npm run qa:accessibility` | PASS (`qa-accessibility.log`; Chromium 141, axe-core 4.13.0) | A1 axe-core zero violations on 40 pages × 1440/834/320 × LTR/RTL; A2 no page overflow; M1 reduced motion; D1 density; C1 computed tokens; B1 brand isolation; F1 2 px focus ring; **O1 every open overlay (12: dialogs, drawers, popovers, More menu) passes axe-core at 1440 and 320 px, closes on Escape and returns focus to its trigger**; U1 status has a visible icon and text; K1 no keyboard trap (60 Tab presses per `/components/*` page). |
| `npm run qa:accessibility:negative` | PASS 16/16 (`qa-accessibility-negative.log`) | The browser gate fails on seeded violations: B01–B15 plus positive control B00. |
| `npm run test:components` | PASS, **254 tests** in 27 files (`test-components.log`) | Behaviour, keyboard, focus entry/return, states and responsive rules per component, including the focus entries cited in the visual report and the new menu-icon assertion (`action-group.spec.ts:100-101`). The S09 static count is also 254. |

The gates are to be re-run on the final commit (including `0132ff6`'s fixes) and retained under `logs/verification-6dc71cc/` before PASS is claimed.

## 3. Justified technical adaptations and design deviations

All DDRs are in `deviations/`. The two defects are corrected and verified; the PO/SA confirms their closure. The six adaptations await a PO/SA decision (DCH §19.2(iv)).

| DDR | Screens | Subject | Classification |
| --- | --- | --- | --- |
| DDR-IB2-01 | C03, C03N, R01, R03 | Table < 40 rem `overflow-wrap: anywhere`; "descriptive"/"exceptionally" break mid-word at 320 px | proposed acceptable adaptation |
| DDR-IB2-02 | C01, R03 | Overflow menu is its own `popover="manual"` menu, not `PaepPopover variant="menu"` | proposed acceptable adaptation |
| DDR-IB2-03 | C01, R03 | Overflow menu drops the destructive item's delete icon | defect: **RESOLVED** (`0132ff6`, verified) |
| DDR-IB2-04 | C06B, C06D, R02D | Overflowing modal body becomes a focusable named region; page scroll locked while modal | proposed acceptable adaptation |
| DDR-IB2-05 | C06E | Informational popover with overflowing plain content takes focus as a named region | proposed acceptable adaptation |
| DDR-IB2-06 | C02, C03, C05, C06C, C06D | UI-lab specimens use native / hand-rolled controls instead of PAEP components | defect: **RESOLVED** (`0132ff6`, verified); Low residual note |
| DDR-IB2-07 | F04–F08, R03 | Foundation and R03 lab pages omit some board demonstrations | proposed acceptable adaptation |
| DDR-IB2-08 | C06A–D, R02D | Modal footer is `paep-dialog-footer` / `paepDialogClose`, not an action group | proposed acceptable adaptation |

Candidate points that were checked and found conforming (no DDR):
- **Progress and skeleton reference tokens:** the handoff names `--paep-ref-color-neutral-200` and `--paep-ref-color-neutral-100` (component-specs, component-map rows 16–17).
- **Informational popovers close when focus leaves the trigger:** this matches interaction-notes §3 "Tab past last element closes (non-modal)".

## 4. Result

**Design conformance: no open defects.** The fix-until-pass cycle (DCH §20(ii)–(iii)) was applied:
1. The two defects were corrected in `0132ff6`.
2. The captures were regenerated.
3. C01, C02, C03, C05, C06C and C06D were recompared: 0 DOES NOT CONFORM (`visual-conformance.md` §4).

Remaining before PASS / ACCEPTED:
- **Gate re-run:** re-run `test:components`, `qa:design-system`, `qa:accessibility` (and the negatives) on the final commit, retained under `logs/verification-6dc71cc/`.
- **PO/SA decisions:** the six proposed adaptations.
- **Baselines:** PO/SA acceptance of the CANDIDATE baselines.
- **Low note:** lab-only native controls remain (DDR-IB2-06 residual note). Optional.

Human acceptance is recorded in `acceptance.md`. Every visual capture is a CANDIDATE baseline, and nothing here is self-approved.
