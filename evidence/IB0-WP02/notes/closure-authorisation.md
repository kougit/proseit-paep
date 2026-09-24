# IB0-WP02 Closure Authorisation Record

**Authority:** Product Owner / Solutions Architect (Kouga).
**Instruction:** "IB0-WP02 — Product Owner / Solutions Architect authorization, controlled amendment, final QA and merge", given in the PAEP project thread on 2026-09-24.
**Recorded by:** Claude Code, 2026-09-24. This file records the decisions as given; Claude did not make them.

## Decisions

| # | Decision | Condition set by the authority | Where recorded |
| --- | --- | --- | --- |
| 1 | The 24-criterion IB0-WP02 definition is APPROVED | Every criterion traces to controlled IB-01/IR-01 requirements and adds no IB0-WP03, WP04 or later scope | `work-packages/IB0-WP02/WORK_PACKAGE.md` §12; `reports/definition-audit.md` (PASS) |
| 2 | Claude may amend `CLAUDE.md` once, replacing the work-package-specific scope with a durable, work-package-neutral rule. Not "IB0-WP02 only" | Preserve the source-of-truth hierarchy, architecture, clean-room, quality-gate, fix-until-pass, evidence and security controls, the no-weakening rule and human acceptance authority; relax no engineering control | `CLAUDE.md`; `WORK_PACKAGE.md` §12(ii) |
| 3A | `lightningcss` (MPL-2.0) APPROVED for current build-time use | Record version, dependency status, purpose, licence, upstream provenance, distribution assessment and notice obligations; disposition APPROVED BUILD-TIME DEPENDENCY; re-review if PAEP later modifies and distributes MPL-covered lightningcss source/files or changes its distribution role | `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` §3; `docs/licences/THIRD-PARTY-NOTICES.md` N1; `docs/provenance/PROVENANCE-REGISTER.md` |
| 3B | `caniuse-lite` (CC-BY-4.0) APPROVED for current build-time use | Same fields; attribution to caniuse.com retained; re-review if the data becomes part of a separately distributed PAEP dataset or artefact or its use materially changes; no broader approval inferred | `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` §4; `docs/licences/THIRD-PARTY-NOTICES.md` N2; `docs/provenance/PROVENANCE-REGISTER.md` |

## Decision-rights note

PAEP v1.1 (Approval and Decision Rights) names the Engineering Governance / IP owner as primary authority for open-source dependencies and licences. Decisions 3A and 3B were issued by the Product Owner / Solutions Architect. No separate decision by an Engineering Governance / IP owner is recorded; the PO/SA decision is the recorded disposition.

## CLAUDE.md amendment

Changed:

(i) Title: "PAEP CLAUDE ENGINEERING CONTRACT — IB0-WP01" became "PAEP CLAUDE ENGINEERING CONTRACT".

(ii) Source-of-truth items 6–7: `work-packages/IB0-WP01/…` became `work-packages/<authorised work package>/…`.

(iii) "Current bounded objective" ("Implement **IB0-WP01 only**: …") became "Work-package authorisation": "Claude shall execute only the work package explicitly authorised by the Product Owner / Solutions Architect in the current instruction. Claude shall not begin, implement, merge, or otherwise advance a subsequent work package without new explicit authorisation." It adds that human acceptance and merge authorisation remain PO/SA decisions.

(iv) "Implement only what IB0-WP01 requires" became "Implement only what the authorised work package requires".

(v) Execution discipline 7–8: `evidence/IB0-WP01/` and `work-packages/IB0-WP01/TRACEABILITY.csv` became the authorised work package's paths.

Unchanged, word for word: source-of-truth items 1–5 and 8 and the conflict rule; the Angular 22.x / TypeScript 6.0.x / npm-workspaces baseline paragraph; every other mandatory rule, including the clean-room, secret and anti-weakening rules; execution discipline 1–6 and 9–10; the stop conditions.

## Erratum

The IB0-WP01 install-script misstatement is corrected only in IB0-WP02 evidence (`reports/install-script-policy.md`, `logs/erratum-baseline-install-scripts.log`). Accepted IB0-WP01 files are not edited.
