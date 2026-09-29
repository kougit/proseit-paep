# IB2-FOUNDATION-COMPONENTS — Negative Test Report

Status: PASS (technical). Every suite below runs in CI and was re-run on the final commit; the logs are in `evidence/IB2-FOUNDATION-COMPONENTS/logs/verification-1b8882a/` (see `ci-report.md` for the commit). A negative case passes only when the gate it targets fails with the expected message; each suite also has a positive control that must pass unmutated.

## 1. Suites

| Suite (command) | CI job | Cases | What a case does |
| --- | --- | --- | --- |
| Design-system static gate (`qa:design-system:negative`) | `PAEP / components` | 48 negatives + 1 positive control (N01–N48, C00) | Mutates one file in a scratch copy and requires the named S check (S01–S10) to fail |
| Browser accessibility gate (`qa:accessibility:negative`) | `PAEP / accessibility` | 15 negatives + 1 positive control (B01–B15, B00) | Injects one defect into a served ui-lab page and requires A1–A4, O1, U1, K1, M1 or the protected-token check to report it |
| IB2 CI governance (`qa:ib2:ci-negative`) | `PAEP / components` | 26 negatives + 1 positive control (I01–I26, P00; I16–I26 cover the negative-ci split) | Mutates the workflow, CI policy, lockfile, licence review, angular.json or a governed file in a scratch git copy and requires the named `verify-ib0-wp05` W checks, and only those, to fail |
| Baseline governance (`qa:baseline:negative`) | `PAEP / negative-ci` | 92 negatives + 13 positives | Inherited from IB1; unchanged by IB2 |
| IB0-WP05 CI controls (`negative-ib0-wp05.mjs`) | `PAEP / negative-ci` (part a: 50 cases) and `PAEP / negative-ci-b` (part b: 51 cases), in parallel | 91 negatives + 10 controls (101; one more gate case than before, GJ15, because the gate has one more mandatory job) | Inherited cases and expectations unchanged; split by the PO/SA CI-performance remediation (2026-09-28). Every run must declare exactly the 101 pinned case ids and run exactly its half; each part lists the ids it leaves to the other |
| IB1 runtime configuration (`qa:runtime-config:negative`, `:portability`) | `PAEP / runtime-config-negative` | 40 mutations + control; 17 portability checks | Inherited; unchanged by IB2 |

Behaviour tests are also mutation-checked: the independent reviewers ran 58 mutations against the component specs in round 1 and re-ran the T1–T3 and R2-3/R2-4 mutations in round 2. Each was killed (`independent-qa.md`).

## 2. Authorising instruction §18 mapping

| §18 required negative | Case(s) | Gate that fails |
| --- | --- | --- |
| Contrast below target (IB2-AC05) | N48 (approved colour changed in the token catalogue) | S02 |
| Raw design literals | N07 hex colour, N08 named colour, N11 raw px, N12 raw shadow, N13 duration literal, N27/N37 styles array and quote styles, N28/N38 host bindings, N43 template binding, N44 `.style` in code, N39–N42 unchecked style channels | S04 |
| Deep import | N14 (package deep import), N31 (CSS `@import` of a package path) | S05 |
| Product/domain dependency | N15 (`@proseit/frappe-sdk`), N47 (`@proseit/paep-domain-sales`), N26 (double-quoted), N45 (template-literal dynamic import), N46 (computed dynamic import) | S05 |
| Frappe dependency | N15 and N45 (`@proseit/frappe-sdk`; any specifier containing `frappe` or `erpnext` is rejected) | S05 |
| Inaccessible clickable non-interactive element | N35 (`(click)` on a `<div>` in a component template) | S10 |
| Missing accessible name | B02 (button), B04 (form control), B09 (button inside an open dialog) | A1 / O1 (axe) |
| Keyboard trap | B11 (control that swallows Tab) | K1 |
| Focus lost after dismissible interaction | B13 (focus dropped after a dialog closes) | O1 dismissal |
| Status communicated only by colour | B14 (status-badge icon hidden) | U1 |
| Reduced-motion rule removed | B15 (every `prefers-reduced-motion` rule deleted), B12 (one motion duration left non-zero) | M1 |
| Fixed width breaking narrow reflow | B05 (fixed-width element at 320 px) | A2 |
| Required UI-lab state removed | N36 (checkbox "indeterminate" state removed), N20–N22 (specimen removed, unregistered, missing notes) | S07 |
| Component test command removed from CI | I03 (replaced by a no-op), I14 (removed from the policy and the workflow together) | W11 |
| Accessibility job removed from the gate | I01 (components), I02 (accessibility) dropped from the gate `needs` and `MANDATORY_JOBS` | W12 |
| Visual/responsive job silently skipped | I12 (`if: false` on the accessibility job), I04 (browser gate replaced by a no-op), I13 (browser gate removed from the policy and the workflow together) | W11 (and W13 for I12) |
| Candidate scope bypass | I15 (governed file outside the generation 4 scope), baseline B01–B04, B10 | W07 + W26 (B11) |
| Accepted policy weakened together with workflow | WP05 K05–K07 (accepted command, gate script, gate name), I13/I14 (IB2 command floor) | W11 / W12 |
| Split negative-ci half removed, skipped, weakened or left out of the gate (PO/SA remediation 2026-09-28, condition 8) | I16 (negative-ci-b out of the gate `needs` and `MANDATORY_JOBS`), I17 (negative-ci-b removed from policy, workflow and gate together), I18 (`if: false` on negative-ci-b), I19 (both halves run part a), I20 (negative-ci-b timeout 30), I21 (part a dropped from negative-ci), I22 (part b replaced by a no-op), I23 (harness run with `--part x`), I26 (`--part` twice), I24 (harness part b delegates its own cases), I25 (a case declaration renamed) | W12 (I16); W11 (I17, I19–I22; and W13 for I18); harness exit 1 before any case (I23, I26); harness pinned-coverage check (I24, I25) |
| Selected verifier check silently not run | WP05 K08 (empty workflow parses to null: "Check did not run"), inherited WP05 G10–G18 (skipped, cancelled or missing mandatory jobs fail the gate) | W09 / gate |

## 3. Negative cases added by IB2

- Design system: N01–N48. N26–N34 were added for round-1 findings, N35–N36 and N47 for §18, N48 for the Q10 contrast finding, and N37–N46 for round-2 findings R2-1/R2-2.
- Browser: B01–B15. B09–B10 were added for Q3 (O1), and B11–B15 for §18.
- CI governance: I01–I23. I10–I11 were added for C1, I05 for C2, I12–I15 for §18, and I16–I26 for the negative-ci split (I24–I26 after the split review).

No inherited case was removed, skipped or weakened (`git diff d33ab91 -- tooling/governance/negative-baseline-governance.mjs tooling/verification/negative-ib0-wp05.mjs` shows, in the WP05 suite, only the `--part a|b` option added for the PO/SA-authorised split: the case selector at the top of `caseRun`, `gateCase` and `npmCase`, the pinned case list with its coverage check, and the report fields; no case, mutation or expectation changed. In the baseline suite it shows only the 9-line fixture reset in the baseline suite, reviewed by lane P/C/G/Q in round 1 (it resets the fixture's non-script package.json fields and changes no case or expectation)).

## 4. Known gaps

D1 (density), C1 (computed tokens) and F1 (focus ring) have no negative case of their own, and neither has the ≥ 40 page threshold. The same properties are covered by component tests and static S02/S04 (RR17).
