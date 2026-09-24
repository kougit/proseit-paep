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
