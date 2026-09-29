# QA evidence index: HOF-IB2-001 v1.1 (IB2-FOUNDATION-COMPONENTS)

PAEP-DCH-01 §22 places `qa/a11y`, `qa/visual`, `qa/responsive`, `qa/security` and `qa/performance` under the handoff. For IB2 the evidence is retained once, under the implementing work package's evidence folder. This index points to it; nothing is copied here, so there is one source of truth and no duplicated images.

Base paths:
- `EV` = `evidence/IB2-FOUNDATION-COMPONENTS`
- `LOG` = `EV/logs/verification-6dc71cc` (gate logs of the final commit; `summary.txt` lists the exit codes; the coordinator fills in the SHA)

All captures are **CANDIDATE** baselines awaiting PO/SA acceptance. PASS is technical; ACCEPTED is the PO/SA's decision.

## a11y (DCH §12, accessibility-intent.md)

| Evidence | Location |
| --- | --- |
| Browser gate (axe-core, A1/A2, M1, D1, C1, B1, F1, O1 overlays, U1, K1) | `LOG/qa-accessibility.log`; negative controls `LOG/qa-accessibility-negative.log` |
| Report | `EV/reports/accessibility-report.md` |
| Keyboard and focus map (entry, trap, restore, roving) | `EV/reports/keyboard-focus.md` |
| Component behaviour tests (254) | `LOG/test-components.log`; `EV/reports/unit-component-test-report.md`; specs in `packages/components/src/lib/*/*.spec.ts` |

## visual (DCH §21)

| Evidence | Location |
| --- | --- |
| Implementation captures: 40 lab pages × desktop 1440 / tablet 834 / narrow320 (full page), plus 12 open-overlay viewport captures × 3 viewports (156 PNG) | `EV/visual/` (produced by `node tooling/design-system/browser-qa.mjs --capture`) |
| Approved renders | `design-export/screens/renders/` |
| Render-vs-capture comparison, verdicts and totals | `EV/reports/visual-conformance.md` |
| Deviation records | `../deviations/DDR-IB2-01.md` … `DDR-IB2-08.md` |
| Token conformance (S02, C1) and brand isolation (B1) | `LOG/qa-design-system.log`, `LOG/qa-accessibility.log`; `EV/reports/token-catalogue.md`, `EV/reports/token-governance.md` |

## responsive (DCH §11, responsive-rules.md)

| Evidence | Location |
| --- | --- |
| 320 CSS px / 834 / 1440 audits, no page overflow (A2), RTL | `LOG/qa-accessibility.log` |
| Report | `EV/reports/responsive-320-report.md` |
| Narrow captures | `EV/visual/*--narrow320.png` |
| Table narrow-width trade-off | `../deviations/DDR-IB2-01.md` |

## security (DCH §13)

| Evidence | Location |
| --- | --- |
| Import boundaries, no Frappe/domain/later-milestone imports (S05); architecture boundaries | `LOG/qa-design-system.log`; `LOG/qa-architecture.log` |
| Clean-room and provenance (S06) | `EV/reports/clean-room-provenance.md` |
| Dependencies | `EV/reports/dependency-review.md` |
| Runtime configuration and contracts regression | `LOG/qa-runtime-config.log`, `LOG/qa-runtime-config-negative.log`, `LOG/qa-runtime-config-portability.log`, `LOG/qa-contracts.log` |
| CI governance negatives | `LOG/qa-ib2-ci-negative.log` |
| Independent QA and residual risks | `EV/reports/independent-qa.md`, `EV/reports/residual-risk.md` |

## performance

| Evidence | Location |
| --- | --- |
| Production build of the UI laboratory (bundle sizes; the earlier run recorded an initial total of 336.69 kB raw / 84.64 kB transfer) | `LOG/build-ui-lab.log` |
| Reference app build (regression) | `LOG/build-reference-app.log` |
| Motion budget and reduced motion (M1) | `LOG/qa-accessibility.log` |

Note: the gates are re-run on the final commit (after the visual-conformance fixes in `0132ff6`) and retained in `LOG`. The bundle figures above are from the earlier verification run; confirm them in the final `build-ui-lab.log`.
