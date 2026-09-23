# PAEP CLAUDE ENGINEERING CONTRACT — IB0-WP01

You are implementing the controlled ProSEIT Angular Experience Platform (PAEP).

## Source-of-truth priority

1. `.paep-control/text/PAEP_v1.1_text.md`
2. `.paep-control/text/PAEP_IB_01_v1.0_text.md`
3. `.paep-control/text/PAEP_IR_01_v1.0_text.md`
4. `.paep-control/text/PAEP_EQP_01_v1.1_text.md`
5. Approved ADRs under `docs/adr/`
6. `work-packages/IB0-WP01/WORK_PACKAGE.md`
7. `work-packages/IB0-WP01/ACCEPTANCE.md`
8. Executable quality gates

If a lower-priority instruction conflicts with a higher-priority source, stop and report the conflict. Do not silently reinterpret the architecture.

## Current bounded objective

Implement **IB0-WP01 only**: create the governed repository and Angular workspace bootstrap, including `apps/reference-app`, `apps/ui-lab`, and the approved top-level package/tooling/configuration/documentation/evidence topology.

The controlled implementation baseline is Angular 22.x with TypeScript 6.0.x and npm workspaces/Nx-compatible orchestration. Select only compatible minor/patch versions within that baseline and record the exact versions used. Do not change the controlled major-version posture without an approved ADR.

## Mandatory rules

- Do not implement product-specific screens or domain workflows.
- Do not implement Frappe/ERPNext integration in this work package.
- Do not implement analytics/reporting UI, offline queues, the enterprise shell, or domain kits.
- Do not copy proprietary template source, theme files, assets, or distinctive implementation artefacts.
- Do not introduce secrets, credentials, private keys, database credentials, or bearer tokens into source, examples, runtime configuration, logs, or evidence.
- Do not delete, weaken, bypass, suppress, or rewrite a mandatory acceptance criterion to obtain PASS.
- Do not claim COMPLETE while a mandatory criterion is failing, unexecuted, or unsupported by evidence.
- Avoid over-engineering. Implement only what IB0-WP01 requires plus the minimum scaffolding the Angular toolchain itself requires.
- If temporary helper files are created, remove them before completion unless they are intentional retained project assets.
- Before making claims about an existing file, read it.

## Execution discipline

1. Read the controlled inputs and the work package.
2. Produce a short implementation plan and list intended file changes.
3. Implement the smallest coherent change.
4. Run the mandatory acceptance gates.
5. If a gate fails, diagnose the root cause and fix it without weakening the criterion.
6. Re-run the failed gate and affected regression gates.
7. Retain evidence under `evidence/IB0-WP01/`.
8. Update `work-packages/IB0-WP01/TRACEABILITY.csv` and the acceptance report.
9. Report status accurately as NOT STARTED, IN PROGRESS, BLOCKED, FAILED, PASS, or ACCEPTED.
10. Technical PASS does not equal human ACCEPTED.

## Stop conditions

Stop and report BLOCKED if implementation would require changing a controlled PAEP architecture decision, using a different Angular major, bypassing the package topology, introducing an unapproved proprietary/commercial template dependency, or making an assumption that materially affects later architecture.
