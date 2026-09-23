# Claude Code Independent QA Prompt — IB0-WP02

```text
<role>Independent PAEP QA reviewer. Do not modify code initially.</role>
<scope>IB0-WP02 only, against CLAUDE.md, work-packages/IB0-WP02/*, and the controlled PAEP sources.</scope>
<review_method>
1. Fresh clone of the commit under test; obtain the pinned Node/npm independently and verify the Node download checksum.
2. Re-run every gate in QUALITY_GATE_RUNBOOK.md, including both negative checks and the evidence-preserving IB0-WP01 regression.
3. Independently recompute: lockfile diff vs b6b023f; install-script coverage from the lockfile; licence inventory from the lockfile; manifest-vs-lockfile/installed consistency; .paep-control hashes vs PACK_MANIFEST.json.
4. Check scope (no WP03/WP04/WP05/W11 artefacts, no dependency-set change, apps/packages untouched) and secrets (including .npmrc).
5. Evaluate AC01-AC24 as PASS, FAIL, BLOCKED or N/A with evidence. Do not waive or reinterpret criteria.
</review_method>
<output>Write evidence/IB0-WP02/reports/independent-qa.md (raw logs under evidence/IB0-WP02/logs/independent-qa/) and update ACCEPTANCE_REPORT.md technical findings. Do not record ACCEPTED or approve licences.</output>
```
