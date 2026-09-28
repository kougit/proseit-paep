# IB2-FOUNDATION-COMPONENTS Evidence

Evidence for the PAEP design foundation (`@proseit/paep-foundation`), the 25 core components (`@proseit/paep-components`) and the UI laboratory (`apps/ui-lab`), built from the approved design handoff HOF-IB2-001 v1.1. Status: **technical PASS, NOT ACCEPTED**. Acceptance, the visual baselines and every proposed design deviation are the PO/SA's decisions. Baseline generation 4 is CANDIDATE. The enterprise shell is NOT STARTED.

Authorising instruction §24 evidence list, and where each item is:

| §24 item | File |
| --- | --- |
| WORK_PACKAGE | `work-packages/IB2-FOUNDATION-COMPONENTS/WORK_PACKAGE.md` |
| ACCEPTANCE_CRITERIA | `work-packages/IB2-FOUNDATION-COMPONENTS/ACCEPTANCE.md` |
| TRACEABILITY | `work-packages/IB2-FOUNDATION-COMPONENTS/TRACEABILITY.csv` |
| DESIGN_CLASSIFICATION | `reports/design-classification.md` |
| DESIGN_HANDOFF_REFERENCE | `reports/design-handoff-reference.md`; the retained, hash-pinned handoff is `evidence/design-handoff/HOF-IB2-001/` |
| TOKEN_CATALOGUE | `reports/token-catalogue.md` |
| TOKEN_GOVERNANCE_REPORT | `reports/token-governance.md` |
| COMPONENT_CATALOGUE | `reports/component-catalogue.md` |
| PUBLIC_API_REPORT | `reports/component-api.md` |
| UI_LAB_COVERAGE | `reports/ui-lab-coverage.md` |
| ACCESSIBILITY_REPORT | `reports/accessibility-report.md` |
| KEYBOARD_FOCUS_REPORT | `reports/keyboard-focus.md` |
| RESPONSIVE_320_REPORT | `reports/responsive-320-report.md` |
| VISUAL_CONFORMANCE_REPORT | `reports/visual-conformance.md`; captures in `visual/` (CANDIDATE); design deviations in `evidence/design-handoff/HOF-IB2-001/deviations/` |
| UNIT_COMPONENT_TEST_REPORT | `reports/unit-component-test-report.md` |
| NEGATIVE_TEST_REPORT | `reports/negative-test-report.md` (includes the §18 mapping) |
| CLEAN_ROOM_PROVENANCE | `reports/clean-room-provenance.md` |
| DEPENDENCY_REVIEW | `reports/dependency-review.md` |
| CI_REPORT | `reports/ci-report.md` |
| PERFORMANCE_TIMING | `reports/performance-timing.md` |
| INDEPENDENT_QA | `reports/independent-qa.md` |
| RESIDUAL_RISK | `reports/residual-risk.md` |
| ACCEPTANCE_READINESS | `reports/acceptance-readiness.md` |

Other records:

| File | Content |
| --- | --- |
| `reports/preflight.md` | Pre-flight checks on `origin/main` `d33ab91` before any IB2 change |
| `logs/preflight/` | Pre-flight command logs |
| `logs/verification-<commit>/` | Full verification on a fresh clone with a clean `npm ci`: every command and its exit code, lockfile hash before and after, tree status after install and after the run (`summary.txt`). The newest folder is for the final code commit; the earlier folder is kept as history |
| `visual/` | 120 full-page captures (40 pages at 1440, 834 and 320 CSS px) and 36 open-overlay captures (12 overlays × 3 viewports). CANDIDATE baselines; none is self-approved |
| `review/PO-SA-GOVERNANCE-DIFF.txt` | **Not committed.** The PO/SA governance diff for `.github/**`, `tooling/verification/**` and `tooling/governance/**` (base and head SHAs, inventory, modes, hashes, full unified diff, explanations and CI timing). It is kept out of git on purpose (`review/` is untracked) |

Design: `docs/architecture/IB2-FOUNDATION-COMPONENTS-DESIGN.md`. Work-package records: `work-packages/IB2-FOUNDATION-COMPONENTS/` (WORK_PACKAGE, ACCEPTANCE, TRACEABILITY, ACCEPTANCE_REPORT, work-package.json).
