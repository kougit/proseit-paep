# PAEP Architecture Decision Record Register

ADR-001..ADR-010 are reserved, PROPOSED register entries in PAEP-IB-01 Appendix F and are not changed here. ADR-011 is the first ADR file in this repository.

| ADR ID | Title | Status | Decision date | Supersedes | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | Create an ADR only if IB0-WP01 exposes a material decision not already controlled by PAEP v1.1 or PAEP-IB-01. |
| ADR-011 | Frappe adapter boundary, cookie session + CSRF, polling freshness and the `pmra-api-v1` compatibility contract | ACCEPTED — PO/SA | 2026-10-15 | — | `docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md`. Records PO/SA decisions D1-D10 of the IB4 implementation authorisation. Amended 2026-10-16 (§2.8, §2.12, §4 only) by the PO/SA M1 decision: workflow writes use the atomic `pmra-api-v1` transition method; status unchanged. Related to (does not change) ADR-003 and ADR-008, which stay PROPOSED. |

## Work-package notes

| Work package | ADR needed? | Reason |
| --- | --- | --- |
| IB0-WP02 | No | Exact Node pinning, npm workspaces, a committed lockfile and `npm ci` are already controlled by PAEP-IB-01 §4.1. `.nvmrc`, `devEngines`, `.npmrc` and `allowScripts` are equivalent developer tooling and dependency-hygiene controls. No controlled decision changed. See `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md`. |
| IB0-WP03 | No | `strict`, `noImplicitAny` and `strictTemplates` are already controlled by PAEP-IB-01 §4.1; path aliases and public entry points by PAEP-IR-01 §4.4 and PAEP-IB-01 §6.2(ii). They are set in the Angular CLI root `tsconfig.json`. `tsconfig.base.json` and the project graph stay with IB0-WP04. No controlled decision changed. See `docs/architecture/IB0-WP03-IMPLEMENTATION-PLAN.md`. |
| IB0-WP04 | No (confirmed by the PO/SA, 2026-09-24) | Dependency direction, layers and the matrix are already controlled by PAEP-IB-01 §6.1, §6.2 and Appendix B; the model transcribes them and the checker compares them cell by cell with the controlled text. No new shared package, no dependency-direction change and no new deployable boundary (EQP §16(vi)). Nx is not introduced (IB-01 §2.3(ii): Nx is not an immutable dependency; ADR-002 in IB-01 App. F remains a proposed register entry). `tsconfig.base.json` follows the controlled topology (IB-01 §5.1; IR-01 §4.2). The same-category default (no `domain-*` to `domain-*`, no app to app without an ADR) is recorded for PO/SA confirmation. See `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md`. |
| IB0-WP05 | No | CI stages, lockfile-based install and the quality gates are already controlled by PAEP-IR-01 §4.4–§4.5, PAEP-IB-01 §4.1 and §18.1 and PAEP-EQP-01 §15. WP05 adds no dependency, package, dependency-direction change or deployable boundary. GitHub Actions is CI tooling recorded in `docs/provenance/GITHUB-ACTIONS-REGISTER.md`. Deferring the lint and unit-test stages is a PO/SA scope decision, not an architecture change. See `docs/architecture/IB0-WP05-IMPLEMENTATION-PLAN.md`. |
| IB4-FRAPPE-ADAPTER | Yes: ADR-011 (PO/SA D8, 2026-10-15) | IB4 fixes the adapter boundary, the session model, the Generation 6 freshness implementation and the backend compatibility contract. No dependency-direction change, no new package and no new dependency. See `docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md`. |
