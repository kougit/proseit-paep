# IB0-WP01 Implementation Plan

Recorded before any workspace change was made (AC01). Status at time of writing: IN PROGRESS.

## Objective

Create the PAEP repository and Angular workspace bootstrap without implementing later milestone capabilities.

## Controlled inputs read

| Source | Sections relied on |
| --- | --- |
| `CLAUDE.md` | Whole contract |
| `.paep-control/SOURCE_OF_TRUTH.md` | Priority table; controlled decisions (i)–(vi) |
| `.paep-control/text/PAEP_v1.1_text.md` | §5 (package boundaries, workspace rule, Angular engineering profile), §19 (clean-room), §21 (UI lab), App. A (repository reference structure), App. G |
| `.paep-control/text/PAEP_IB_01_v1.0_text.md` | Whole document; in particular §3, §4 (toolchain), §5 (repository/ownership rules), §6 (layers), §17, §22–23, App. A, App. F |
| `.paep-control/text/PAEP_IR_01_v1.0_text.md` | §4 (IB0 topology, rules, IB0-WP1..WP5, gates, exit criteria), App. A–B |
| `.paep-control/text/PAEP_EQP_01_v1.1_text.md` | §2, §8, §13, §14, §22–25, §29.1, §32, App. B–C |
| `.paep-control/reference-baseline/PAEP_BASE_v1.0.zip` | Listed only, as a reference; no configuration copied |
| `work-packages/IB0-WP01/*` | WORK_PACKAGE, ACCEPTANCE, QUALITY_GATE_RUNBOOK, TRACEABILITY, ACCEPTANCE_REPORT(_TEMPLATE), prompts/01_EXECUTE |
| `docs/adr/ADR-REGISTER.md` | No approved ADRs |

## Planned changes

(i) Bootstrap a plain Angular CLI workspace at the repository root (`angular.json`, `tsconfig.json`, `package.json`, `package-lock.json`, `.editorconfig`), using npm as package manager and npm workspaces for `packages/*`. Nx is **not** introduced. The user directed this, and no controlled source requires Nx: PAEP-IB-01 §2.3(ii) states that Nx is not an immutable architecture dependency, and PAEP v1.1 App. A treats folder names as tool-independent.

(ii) Generate `apps/reference-app` and `apps/ui-lab` with `ng generate application`: standalone, zoneless (Angular 22 default), no SSR, CSS, no spec files. Replace the generator's Angular welcome page with a one-line neutral placeholder. Add no routes, features, shell or design-system code.

(iii) Create placeholder package folders under `packages/` for the 18 PAEP packages. Each gets a `README.md` plus a private `package.json` that reserves its `@proseit/*` namespace (IR-01 IB0-WP1 "package namespaces"), with no source code.

(iv) Create `tooling/` areas: architecture-boundaries, config-validation, test-utils, visual-regression, a11y, analytics-test, build-release. Also `config/`, the `docs/` areas (architecture, adr, reporting-metrics, provenance, licences, migration) and the `evidence/` areas (tests, accessibility, performance, security, sbom, releases, portability, usability, analytics, IB0-WP01), each with a README placeholder.
    - `tooling/analytics-test` and `docs/reporting-metrics` are not in WORK_PACKAGE §3. They are required by the higher-priority PAEP v1.1 App. A and PAEP-IB-01 §5.1/App. A, and AC05 requires the topology "defined by PAEP-IB-01". They are added as placeholders; this is additive and involves no conflict.

(v) Add npm scripts `build:reference-app`, `build:ui-lab` (both production configuration) and `qa:ib0-wp01` (runs the supplied verifier).

(vi) Restore the three empty `evidence/IB0-WP01/{logs,notes,reports}/.gitkeep` files listed in `PACK_MANIFEST.json`. They are byte-identical (empty) to the manifest entries, so pack integrity passes.

(vii) Run the gates, retain evidence and update the provenance register, toolchain/dependency reports, implementation summary, traceability and acceptance report.

## Toolchain versions selected

| Tool | Controlled family | Exact selected version | Rationale / compatibility source |
| --- | --- | --- | --- |
| Angular (`@angular/*` framework packages) | 22.x | 22.1.8 | Newest release with a matching stable CLI/build. Framework 22.2.0 exists, but `@angular/cli`/`@angular/build` 22.2 are still RC (npm dist-tags, 2026-09-23). IB-01 §4.1 requires core and CLI to stay aligned. |
| Angular CLI / `@angular/build` | compatible with Angular 22.x | 22.1.8 | npm `latest` dist-tag for `@angular/cli`. Application builder per IB-01 §4.1. |
| TypeScript | 6.0.x | 6.0.3 | Newest 6.0.x. `@angular/compiler-cli@22.1.8` peer range is `>=6.0 <6.1`. npm `latest` is 7.0.2, so the version is pinned exactly. |
| RxJS | supported 7.x | 7.8.2 | Generator range `~7.8.0`. Satisfies the `@angular/core` peer `^6.5.3 \|\| ^7.4.0`. |
| tslib | generator default | 2.8.1 | Generator range `^2.3.0`. |
| Node.js | supported by selected Angular release | 24.21.0 (LTS "Krypton") | User direction: Node 24 LTS. IB-01 §4.1 also names Node 24 LTS. Angular 22 engines: `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`. The container's preinstalled Node 22.22.2 is rejected by the CLI, so the official nodejs.org binary was installed and verified against SHASUMS256. |
| npm | compatible with selected Node.js | 11.19.0 | Bundled with Node 24.21.0; declared in `packageManager`. |
| Nx / orchestration | Nx-compatible; use only if selected | Not used | See Planned changes (i). The Nx project graph and module boundaries are an IB0-WP04 concern. |

Direct dependency versions are pinned exactly in `package.json`, so the CLI and framework stay aligned and TypeScript cannot drift to 7.x. IB0-WP02 formally reviews and approves the version manifest.

## Files/directories expected to change

(i) New at root: `package.json`, `package-lock.json`, `angular.json`, `tsconfig.json`, `.editorconfig`.

(ii) New: `apps/reference-app/**` and `apps/ui-lab/**` (generator output: `src/main.ts`, `src/index.html`, `src/styles.css`, `src/app/app.ts|html|css|config.ts|routes.ts`, `public/favicon.ico`, `tsconfig.app.json`).

(iii) New: `packages/<18>/README.md` and `packages/<18>/package.json`.

(iv) New: `tooling/<7 areas>/README.md`, `config/README.md`, `docs/{reporting-metrics,licences,migration}/README.md`, and `evidence/<9 areas>/README.md`.

(v) New: `evidence/IB0-WP01/{logs,notes,reports}/.gitkeep` (restored) and evidence logs/reports.

(vi) Updated: this plan, `README.md` (workspace section appended), `docs/provenance/PROVENANCE-REGISTER.md`, `evidence/IB0-WP01/reports/toolchain-baseline.md`, `evidence/IB0-WP01/reports/dependency-baseline.md`, `evidence/IB0-WP01/notes/implementation-summary.md`, `work-packages/IB0-WP01/TRACEABILITY.csv`, and `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md`.

(vii) Not changed: `.paep-control/**`, `.gitignore`, `CLAUDE.md`, `ACCEPTANCE.md`, `WORK_PACKAGE.md`, the verifier scripts and other pack files.

## Risks / open questions

(i) **Orchestration.** IB-01 §4.1 and §22 expect an Nx-compatible project graph, caching and module boundaries, and IR-01 §4.2 shows `nx.json`/`tsconfig.base.json` in the target tree. WP01 uses plain Angular CLI + npm workspaces by user direction. IB0-WP03/WP04 must decide how to deliver the project graph and boundary enforcement: add Nx, or use another tool, possibly recorded against ADR-002 in IB-01 App. F. This is not a WP01 blocker, because WORK_PACKAGE §3 allows the metadata files to differ and §5(vi) defers boundary enforcement.

(ii) **Node pinning.** The exact Node version is recorded but not yet pinned in `.nvmrc`/`engines`; IB-01 §4.1 assigns that to the pinning step (IB0-WP02).

(iii) **Unit test runner.** Starter apps are generated without spec files or Vitest, to keep WP01 dependencies minimal. The Vitest baseline arrives with the unit/CI work packages (IB0-WP05).

(iv) **Strictness.** The generated `tsconfig.json` relies on TypeScript 6.0 / Angular 22 defaults for `strict`/`strictTemplates`. Explicit strict settings are IB0-WP03 scope. WP01 does not weaken any compiler setting.

(v) **Formatting/lint.** The generator's Prettier dev dependency and `.prettierrc` are not adopted. Formatting and linting are IB0-WP03/WP05 scope (EQP §29.1(iii)).
