# Acceptance record: HOF-IB2-001 v1.1 implementation (IB2-FOUNDATION-COMPONENTS)

| Field | Value |
| --- | --- |
| Handoff | HOF-IB2-001 v1.1 (APPROVED_FOR_IMPLEMENTATION) |
| Implementing work package | IB2-FOUNDATION-COMPONENTS |
| **Acceptance status** | **ACCEPTED** (PO/SA, 2026-09-29; accepted implementation head `e8bbf60630aa2a5400fe78fc479a062d01089e9c`) |
| Technical status | Visual re-review: 0 DOES NOT CONFORM (37 CONFORMS, 12 CONFORMS WITH DEVIATION). Defects DDR-IB2-03 and DDR-IB2-06 corrected in `0132ff6` and verified. Technical PASS awaits the gate re-run on the final commit (`evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-6dc71cc/`); see `conformance-report.md`. |
| Decision authority | Product Owner / Solutions Architect |
| Recorded by | Claude Code, recording the PO/SA final acceptance decision, 2026-09-29T06:57Z (acceptance closeout, PR #10) |
| Date | 2026-09-29 |

Nothing in this folder is self-approved. The implementation agent and reviewers may report PASS/FAIL for technical gates. ACCEPTED (DCH §24) is recorded here only by the PO/SA.

## PO/SA decisions (2026-09-29)

- **Visual baselines:** 156/156 ACCEPTED as the initial controlled IB2 visual baseline set.
- **Design-handoff conformance, responsive, accessibility, RTL, reduced motion, clean-room/provenance:** ACCEPTED.
- **Deviations:** DDR-IB2-03 and DDR-IB2-06 CLOSED (defects fixed); DDR-IB2-01, -02, -04, -05, -07 and -08 ACCEPTED WITH FOLLOW-UP (table below; follow-ups in each record).
- **DDR-IB2-07 deadline:** The F07 focus/state examples and the full R03 320 px board must be added before whichever occurs first: (a) acceptance of the enterprise-shell milestone; or (b) the next controlled PAEP design-system release.
- **Handoff version:** v1.1 stays APPROVED_FOR_IMPLEMENTATION and unchanged; the accepted adaptations are recorded in a later handoff version under DCH §19.2(v).

## Decisions that were requested

1. **Visual baselines.** Accept or reject the CANDIDATE visual baselines in `evidence/IB2-FOUNDATION-COMPONENTS/visual/`: 156 PNG (40 lab pages × 1440/834/320, plus 12 open-overlay captures × 3 viewports). The captures were regenerated after the DDR-IB2-03 / DDR-IB2-06 corrections (same file names) and recaptured on the final code. The re-review found no DOES NOT CONFORM row (`evidence/IB2-FOUNDATION-COMPONENTS/reports/visual-conformance.md` §3–§4).
2. **Deviation records** (`deviations/`), each APPROVED / REJECTED / BLOCKED per DCH §19.2(iv):

| DDR | Subject | Proposed classification | Decision |
| --- | --- | --- | --- |
| DDR-IB2-01 | Table < 40 rem breaks long words mid-word at 320 px (`overflow-wrap: anywhere`) | acceptable adaptation | **ACCEPTED WITH FOLLOW-UP** |
| DDR-IB2-02 | Overflow menu is its own manual popover, not `PaepPopover variant="menu"` | acceptable adaptation | **ACCEPTED WITH FOLLOW-UP** |
| DDR-IB2-03 | Overflow menu drops the destructive item's delete icon | defect: correction required, **RESOLVED** in `0132ff6` (verified) | **CLOSED** |
| DDR-IB2-04 | Overflowing modal body is a focusable named region; page scroll locked while modal | acceptable adaptation | **ACCEPTED WITH FOLLOW-UP** |
| DDR-IB2-05 | Informational popover with long plain content takes focus as a named region | acceptable adaptation | **ACCEPTED WITH FOLLOW-UP** |
| DDR-IB2-06 | UI-lab specimens use native / hand-rolled controls instead of PAEP components | defect: correction required, **RESOLVED** in `0132ff6` (verified); Low residual note on lab-only switchers | **CLOSED** |
| DDR-IB2-07 | Foundation and R03 lab pages omit some board demonstrations | acceptable adaptation (or correction, at PO/SA discretion) | **ACCEPTED WITH FOLLOW-UP** |
| DDR-IB2-08 | Modal footer is `paep-dialog-footer` / `paepDialogClose`, not an action group | acceptable adaptation | **ACCEPTED WITH FOLLOW-UP** |

3. **Handoff version.** Decide whether accepted adaptations (DDR-IB2-01, -02, -04, -05, -08) are recorded in a later handoff version (DCH §19.2(v)) or left as accepted DDRs against v1.1.

## Evidence for the decision

- Conformance summary: `conformance-report.md`
- Visual comparison: `evidence/IB2-FOUNDATION-COMPONENTS/reports/visual-conformance.md`
- QA index: `qa/README.md`
- Implementation mapping: `implementation/README.md`

## Acceptance checklist (DCH Appendix E), at review (before the decision)

| Check | State |
| --- | --- |
| Traceability | Handoff v1.1 pinned (S01); work package references it |
| Design-system conformity | 25 components mapped; two sub-element exports recorded (DDR-IB2-08) |
| States | Implemented and tested; non-default collection states not visually captured (see the visual report, §1 limits) |
| Responsive | 320/834/1440 audited (A2); DDR-IB2-01 pending decision |
| Accessibility | `qa:accessibility` incl. O1 (to be confirmed in the final logs); DDR-IB2-04, -05 pending decision |
| Security/trust | S05/S06, architecture and runtime-config gates PASS |
| Content/i18n | 48 approved content keys (S08); RTL proof |
| Provenance | clean-room report |
| Implementation conformance | No open defects after re-review; 6 adaptations pending decision |
| Deviations | 8 recorded: 2 defects resolved (closure to confirm), 6 adaptations pending |
| Evidence | retained; gates re-run on the final commit under `logs/verification-6dc71cc/` |
