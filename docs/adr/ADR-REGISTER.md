# PAEP Architecture Decision Record Register

No new ADR is approved by this pack.

| ADR ID | Title | Status | Decision date | Supersedes | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | Create an ADR only if IB0-WP01 exposes a material decision not already controlled by PAEP v1.1 or PAEP-IB-01. |

## Work-package notes

| Work package | ADR needed? | Reason |
| --- | --- | --- |
| IB0-WP02 | No | Exact Node pinning, npm workspaces, a committed lockfile and `npm ci` are already controlled by PAEP-IB-01 §4.1. `.nvmrc`, `devEngines`, `.npmrc` and `allowScripts` are equivalent developer tooling and dependency-hygiene controls. No controlled decision changed. See `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md`. |
| IB0-WP03 | No | `strict`, `noImplicitAny` and `strictTemplates` are already controlled by PAEP-IB-01 §4.1; path aliases and public entry points by PAEP-IR-01 §4.4 and PAEP-IB-01 §6.2(ii). They are set in the Angular CLI root `tsconfig.json`. `tsconfig.base.json` and the project graph stay with IB0-WP04. No controlled decision changed. See `docs/architecture/IB0-WP03-IMPLEMENTATION-PLAN.md`. |
| IB0-WP04 | No (pending PO/SA confirmation) | Dependency direction, layers and the matrix are already controlled by PAEP-IB-01 §6.1, §6.2 and Appendix B; the model transcribes them and the checker compares them cell by cell with the controlled text. No new shared package, no dependency-direction change and no new deployable boundary (EQP §16(vi)). Nx is not introduced (IB-01 §2.3(ii): Nx is not an immutable dependency; ADR-002 in IB-01 App. F remains a proposed register entry). `tsconfig.base.json` follows the controlled topology (IB-01 §5.1; IR-01 §4.2). The same-category default (no `domain-*` to `domain-*`, no app to app without an ADR) is recorded for PO/SA confirmation. See `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md`. |
