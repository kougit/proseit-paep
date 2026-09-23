# IB0-WP01 Implementation Summary

Implementation commit: `b9904d023a5a8a8df6c4d9b9900b48188ff5095f`. Evidence recorded in the following commit on branch `claude/project-thread-1vn0d9`.

## Implemented

(i) **Workspace.** A plain Angular CLI workspace at the repository root: `angular.json` with `newProjectRoot: apps` and analytics disabled, a root `tsconfig.json` and `.editorconfig`. npm is the package manager (`packageManager: npm@11.19.0`), with npm workspaces over `packages/*` and a committed `package-lock.json`. Nx is not used, per user direction; no controlled source requires it (PAEP-IB-01 §2.3(ii)).

(ii) **Toolchain.** Angular and the Angular CLI are both 22.1.8, with TypeScript 6.0.3 and RxJS 7.8.2. The workspace was built and verified on Node 24.21.0 LTS with npm 11.19.0. All direct dependencies are pinned exactly. See `reports/toolchain-baseline.md` and `reports/dependency-baseline.md`.

(iii) **Applications.** `apps/reference-app` and `apps/ui-lab` were generated with `ng generate application`: standalone, zoneless, no SSR, CSS, no spec files. The generator's Angular welcome page was replaced by a one-line neutral placeholder. Each app has an empty route table and no features, services, shell, tokens or components. Both have production build targets.

(iv) **Packages.** 18 placeholder packages under `packages/` (contracts, foundation, platform, i18n, observability, components, offline, frappe-sdk, enterprise, analytics, and the 8 domain kits). Each has a README stating its layer, responsibility and milestone, and a private `package.json` that reserves its `@proseit/*` name. None contains source code.

(v) **Areas.**
- `tooling/`: architecture-boundaries, config-validation, test-utils, visual-regression, a11y, analytics-test, build-release. The existing `tooling/verification` is retained.
- `config/`.
- `docs/`: architecture, adr, reporting-metrics, provenance, licences, migration.
- `evidence/`: tests, accessibility, performance, security, sbom, releases, portability, usability, analytics, IB0-WP01.
- Each new area has a README placeholder. `tooling/analytics-test` and `docs/reporting-metrics` come from PAEP v1.1 App. A and PAEP-IB-01 §5.1/App. A, which rank above WORK_PACKAGE §3.

(vi) **Scripts.** `build:reference-app`, `build:ui-lab` (production configuration) and `qa:ib0-wp01` (runs the verifier).

(vii) **Pack placeholders.** The three empty `evidence/IB0-WP01/{logs,notes,reports}/.gitkeep` files listed in `PACK_MANIFEST.json` were restored. They are missing from the original web upload.

(viii) **Evidence.** Gates were run from a clean dependency state on the committed tree, and again in a fresh clone. See `evidence/IB0-WP01/README.md` for the index.

## Deliberately not implemented

(i) Frappe/ERPNext integration.

(ii) Enterprise shell.

(iii) Reporting/analytics UI.

(iv) Offline synchronization.

(v) Product/domain screens.

(vi) IB2 design-system components.

(vii) Runtime configuration schema/validator (IB1), unit-test runner (IB0-WP05), lint/format tooling (IB0-WP03/WP05), and boundary/cycle enforcement or project graph (IB0-WP04).

## Known limitations / follow-up

(i) **Orchestration (IB0-WP03/WP04).** PAEP-IB-01 §4.1/§22 expect an Nx-compatible project graph and module-boundary enforcement, and IR-01 §4.2 shows `nx.json` and `tsconfig.base.json`. This bootstrap uses plain Angular CLI + npm workspaces and a CLI-generated `tsconfig.json`. A later IB0 work package must decide the graph/boundary tool, and whether to rename to `tsconfig.base.json` when path aliases are added (ADR-002 in IB-01 App. F).

(ii) **Pinning (IB0-WP02).** Node is recorded but not pinned in `.nvmrc`/`engines`. The npm 11 `allowScripts` policy for `esbuild`, `lmdb`, `msgpackr-extract` and `@parcel/watcher` is undecided. Builds pass without those scripts.

(iii) **Licence review (WP02/SBOM).** `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) are build-time transitive dependencies of `@angular/build`, flagged for licence review.

(iv) **Pack integrity script.** `tooling/verification/validate-pack.mjs` now reports `HASH MISMATCH` for the pack templates that IB0-WP01 is required to populate: the implementation plan, evidence reports/notes, traceability, acceptance report and README. This is expected: the script checks the pack as delivered, and it is not an IB0-WP01 acceptance gate. All `.paep-control/**` files and `.gitignore` still match their manifest hashes.

(v) **Node in this environment.** The cloud container's preinstalled Node (22.22.2) is below Angular 22's minimum. Anyone reproducing the gates must use Node 24 LTS (≥ 24.15.0).
