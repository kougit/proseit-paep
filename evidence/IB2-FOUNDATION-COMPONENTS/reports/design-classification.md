# IB2-FOUNDATION-COMPONENTS — Design Classification (PAEP-DCH-01 §5)

Measured on the final code commit (`logs/verification-6dc71cc/`) on 2026-09-27. Sources: `.paep-control/text/PAEP_DCH_01_v1.0_text.md` §5, §5.1, §24, §25, §26; `work-packages/IB2-FOUNDATION-COMPONENTS/WORK_PACKAGE.md` line 8; `work-package.json` `design_classification`; `evidence/design-handoff/HOF-IB2-001/`. Status: CANDIDATE record. The classification is the PO/SA's decision.

## 1. The DCH classes

PAEP-DCH-01 §5 defines three classes. It defines no D0.

| DCH class | Typical work (DCH §5) | Required route (DCH §5) |
| --- | --- | --- |
| D1 — Design Significant | New shell pattern, reporting workspace, complex data-heavy workflow, new navigation/IA, **new cross-product interaction pattern** | Full Design Work Package → Claude Design → design review → approved handoff → Claude Code |
| D2 — Design Extension | New screen composed **primarily from approved PAEP patterns** with a new arrangement or presentation | Light DWP → annotated design/variants → review → Claude Code |
| D3 — Direct-Code Maintenance | Defect fix, token correction, accessibility correction, unchanged-UX refactor, already-approved variant | Claude Code directly under PAEP-EQP-01; visual regression and affected tests mandatory |

DCH §5.1(ii): "A D2 task becomes D1 if it introduces a new reusable pattern". DCH §26 (IB2 row): "use Claude Code directly for bounded primitives; use design review for new foundational visual/interaction patterns". §5 applies to "every UI work package"; it does not classify non-UI work.

## 2. Classification of each deliverable

| Deliverable | Class (DCH §5) | Route followed (evidence) | Reason |
| --- | --- | --- | --- |
| `@proseit/paep-foundation` (tokens, brand validator, icons, announcer, breakpoints) | D1 — Design Significant | DWP-IB2-001 v1.0 → Claude Design → PO/SA review (CHANGES REQUESTED, brand revision) → HOF-IB2-001 v1.1 APPROVED_FOR_IMPLEMENTATION 2026-09-27 → Claude Code | New reusable foundation; §5.1(ii) makes any new reusable pattern D1 |
| `@proseit/paep-components` (25 components, IR-01 §6.4) | D1 — Design Significant | Same handoff (component-map 25/25 approved; open decisions none) | New reusable interaction patterns (overlay focus model, table narrow strategy, action-group overflow); the handoff itself calls OD-14 "Table narrow strategy (D1)" |
| `apps/ui-lab` (home, token catalogue, foundation pages, 25 specimens, 5 proofs) | D2 — Design Extension | Same handoff (screens SCR-IB2-L01..L02; OD-21 "UI-lab IA" approved) | Composed only of approved components; its new arrangement was reviewed and approved in the handoff |
| `tooling/design-system/`, CI jobs, governance, verifiers | Not classified | No design route | Not UI work; DCH §5 applies to UI work packages only |

Every deliverable went through at least the route its class requires. The UI laboratory went through the full D1 route, which is more than D2 requires.

## 3. Correction made during evidence review

The first draft of `WORK_PACKAGE.md` line 8 and `work-package.json` had the labels inverted (D2 for the foundation and components, D1 for the UI laboratory) and used "D0", which DCH §5 does not define. This was a labelling error in the IB2 work-package draft, which Claude Code wrote and which is not yet accepted. It was not a conflict between controlled sources. Both records now use the DCH §5 classes as in §2 above, and the correction is noted on line 8. The route followed did not change. The PO/SA confirms the classification at acceptance.

## 4. Handoff status (DCH §24)

| DCH §24 status | IB2 position | Evidence |
| --- | --- | --- |
| APPROVED FOR IMPLEMENTATION | HOF-IB2-001 v1.1, PO/SA, 2026-09-27 | `handoff.manifest.yaml` `status`, `dchStatus`, `designApproval` |
| IMPLEMENTED / PASS | Technical gates are run by Claude Code; `qa:design-system` 10/10 and `qa:design-system:negative` 47/47 PASS (technical) on the final code commit | `npm run qa:design-system` |
| ACCEPTED | Not claimed. PO/SA decision | ACCEPTANCE.md header |
