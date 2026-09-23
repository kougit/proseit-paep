# Claude Code Defect Repair Prompt — IB0-WP01

```text
A mandatory IB0-WP01 quality criterion has failed.

Read CLAUDE.md, the work-package specification, the failed acceptance criterion, and its evidence before changing code.

Reproduce the failure and classify the root cause as implementation, configuration, dependency/toolchain, environment, test/fixture, or requirement ambiguity.

Fix the root cause without deleting, weakening, skipping or suppressing the criterion. Keep the change inside IB0-WP01 scope. Re-run the failed gate and all affected regression checks, then update the evidence, TRACEABILITY.csv and ACCEPTANCE_REPORT.md.

If PASS cannot be achieved without changing a controlled architecture decision or the work-package scope, stop and report BLOCKED with the exact decision required.
```
