# PAEP IB0-WP01 Provenance Register

Record dependencies, generators and external artefacts introduced by IB0-WP01. Do not list ordinary source files individually.

| Item | Version / source | Purpose | Licence / terms | Approved? | Evidence |
| --- | --- | --- | --- | --- | --- |
| Angular CLI / Angular packages | 22.1.8 (`@angular/cli`, `@angular/build`, `@angular/compiler-cli`, `@angular/core`, `common`, `compiler`, `forms`, `platform-browser`, `router`) from the npm registry | Workspace/application scaffold, build and runtime | MIT, verified from installed package metadata | Pending human review (IB0-WP02 formal pinning) | `evidence/IB0-WP01/reports/dependency-baseline.md` |
| TypeScript | 6.0.3 from the npm registry | Compilation/type system | Apache-2.0, verified from installed package | Pending human review | `evidence/IB0-WP01/reports/dependency-baseline.md` |
| RxJS / tslib | 7.8.2 / 2.8.1 from the npm registry | Framework peer/runtime helpers | Apache-2.0 / 0BSD, verified | Pending human review | `evidence/IB0-WP01/reports/dependency-baseline.md` |
| Workspace orchestration tooling | Not used. Plain Angular CLI + npm workspaces; no Nx. | n/a | n/a | n/a | `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md` |
| Angular CLI generators (`@schematics/angular` 22.1.8) | `ng generate application` for `reference-app` and `ui-lab`; `ng new` workspace defaults for `tsconfig.json` and `.editorconfig` | Generated starter files, including the Angular default `favicon.ico` | MIT (Angular generator output) | Pending human review | Implementation commit `b9904d0` |
| Starter page content | Generator welcome page replaced by an original one-line neutral placeholder | Avoid shipping Angular marketing content | ProSEIT-authored | Pending human review | `apps/*/src/app/app.html` |
| Node.js runtime (build environment) | 24.21.0 official nodejs.org linux-x64 binary; SHASUMS256 verified | Build/runtime toolchain, not committed | MIT (Node.js) | Pending human review | `evidence/IB0-WP01/reports/toolchain-baseline.md` |
| Proprietary/commercial template material | None used. No PrimeNG, Ultima or other template source, theme files or assets. | n/a | n/a | n/a | `evidence/IB0-WP01/logs/scope-and-secret-scan.log` |
