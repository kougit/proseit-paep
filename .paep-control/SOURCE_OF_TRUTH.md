# PAEP IB0-WP01 Controlled Source-of-Truth Manifest

The documents below are the governing inputs for this pack. Convenience text exports are supplied for fast Claude Code reading; the original controlled files remain authoritative.

| Priority | Controlled source | ID / version | Role in IB0-WP01 |
| --- | --- | --- | --- |
| 1 | ProSEIT Angular Experience Platform Specification | PROSEIT-STD-PMRA-AF-006 / PAEP v1.1 | Parent architecture and quality controls |
| 2 | PAEP Implementation Architecture & Repository Baseline | PROSEIT-STD-PMRA-AF-006-IB01 / PAEP-IB-01 v1.0 | Concrete toolchain, repository and package baseline |
| 3 | PAEP Implementation Roadmap: IB0–IB2 | PROSEIT-STD-PMRA-AF-006-IR01 / PAEP-IR-01 v1.0 | Milestone sequencing and IB0 work packages |
| 4 | PAEP Claude Engineering Execution & QA Protocol | PROSEIT-STD-PMRA-AF-006-EQP01 / v1.1 | Claude execution, QA, evidence and fix-until-pass rules |
| 5 | PAEP Design-to-Code Handoff Standard | PROSEIT-STD-PMRA-AF-006-DCH01 / v1.0 | Design handoff governance; IB0-WP01 is D0 / not design-significant |

## Relevant controlled decisions

(i) ERPNext and Frappe remain the strategic backend; IB0-WP01 does not implement backend integration.

(ii) The frontend platform uses a governed Angular workspace with thin applications and reusable shared packages.

(iii) The implementation baseline uses Angular 22.x, TypeScript 6.0.x, npm workspaces and Nx-compatible orchestration; exact compatible patch versions are recorded during bootstrap and formally pinned/reviewed in the subsequent toolchain work package.

(iv) `apps/reference-app` and `apps/ui-lab` are required starter applications.

(v) The repository shall provide packages for contracts, foundation, components, platform, enterprise, analytics, offline, i18n, observability, Frappe adapter and governed domain-kit placeholders, without implementing later milestone behaviour in this work package.

(vi) Work package completion requires objective evidence; Claude's narrative statement that work is complete is not sufficient.

## Original files

See `.paep-control/originals/`.

## Searchable text exports

See `.paep-control/text/`.

## Reference repository baseline

See `.paep-control/reference-baseline/PAEP_BASE_v1.0.zip`. This is a reference skeleton, not permission to bypass the current work-package boundaries or copy stale configuration without review.
