# IB1-CONTRACTS-CONFIG — Contracts Public API Report

Entry point: `packages/contracts/src/index.ts` (`export type *` from every file under `src/lib/`). The reviewed snapshot of every exported declaration (name, kind, comment-free declaration text) is `tooling/test-utils/contract-api-report.json`; `npm run qa:contracts` S2 fails on any addition, removal or change until the snapshot is deliberately updated (`--update`) and reviewed.

| Property | Result | Check |
| --- | --- | --- |
| Public exports | 101 types (interfaces and type aliases), no runtime value | S2, S3 |
| Emitted JavaScript | every file transpiles to empty or `export {}` | S3 |
| Readonly | every property signature `readonly`; record maps only at an allowlist of six sites | S4 |
| `any` | none | S4 |
| Neutrality | compiles alone with `lib: ["ES2022"]`, `types: []`; no DOM, Angular, Frappe, chart, domain or app import; DOM globals fail to compile | S1, S5, S7; `qa:architecture` CONTRACTS_NEUTRAL |
| Consumers | only through the entry point (deep imports rejected by `arch:check` DEEP_IMPORT) | S7 |
| Change during QA | `ReportCellValue` added; `ReportRow` cells and `ReportResult.totals` may carry `MoneyValue` (independent QA Q1-1) | S2 snapshot updated and reviewed |

Catalogue by file: `contract-catalogue.md` (generated from the sources).
