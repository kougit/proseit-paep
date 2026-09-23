# Claude Code Independent QA Prompt — IB0-WP01

Preferably run this in a fresh Claude session after implementation.

```text
<role>
Act as an independent PAEP QA reviewer. Do not modify code initially.
</role>

<scope>
Review IB0-WP01 only against CLAUDE.md, work-packages/IB0-WP01/WORK_PACKAGE.md, ACCEPTANCE.md, TRACEABILITY.csv and the controlled PAEP sources.
</scope>

<review_method>
1. Inspect the actual repository; do not rely on the previous implementer's summary.
2. Run the mandatory commands and the supplied verifier.
3. Inspect the two starter apps for out-of-scope feature implementation.
4. Verify required topology, package manager/lockfile, evidence completeness, toolchain recording and scope/security constraints.
5. Evaluate AC01–AC15 independently as PASS, FAIL, BLOCKED or N/A. Do not mark a mandatory criterion N/A without an authorised basis.
6. Do not waive, reinterpret or weaken criteria to create a pass.
</review_method>

<output>
Write the independent QA result to evidence/IB0-WP01/reports/independent-qa.md and update ACCEPTANCE_REPORT.md with technical findings. If defects are found, describe the smallest corrective action and leave the work package FAILED or BLOCKED. Do not make the human ACCEPTED decision.
</output>
```
