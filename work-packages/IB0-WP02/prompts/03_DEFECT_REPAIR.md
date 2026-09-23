# Claude Code Defect Repair Prompt — IB0-WP02

```text
A mandatory IB0-WP02 criterion has failed.
Read CLAUDE.md, WORK_PACKAGE.md, the failed criterion and its evidence before changing anything.
Reproduce the failure; classify the root cause as implementation, configuration, dependency/toolchain, environment, test/fixture or requirement ambiguity.
Fix the cause without weakening the criterion, loosening a pin, bypassing devEngines/allowScripts, hand-editing the lockfile, or changing IB0-WP01 evidence.
Re-run the failed gate and all affected regression gates (fresh clone), then update evidence, TRACEABILITY.csv and ACCEPTANCE_REPORT.md.
If PASS requires changing a controlled decision (Node/Angular/TypeScript family, package topology, orchestration), stop and report BLOCKED with the exact decision required.
```
