# ProSEIT PAEP IB0-WP01 Claude Execution Pack v1.0

**Work package:** IB0-WP01 — Repository and Angular Workspace Bootstrap  
**Controlled roadmap alias:** PAEP-IR-01 IB0-WP1  
**Status:** Ready for Claude execution  
**Primary execution environment:** Claude Code  
**Design classification:** D0 — no Claude Design handoff required  
**Owner:** Solutions Architect & Main Product Owner  
**Developing organisation:** ProSEIT Organisation of Software Professionals Ltd

This pack is the controlled execution overlay for the first PAEP implementation work package. It is designed to be extracted into the intended PAEP repository root before Claude Code begins implementation. The pack contains the repository `CLAUDE.md`, controlled source material, the bounded work-package specification, execution and QA prompts, acceptance criteria, evidence structure, and a machine-executable verifier.

## Use

(i) Extract this pack into an empty directory that will become the PAEP repository root.

(ii) Open Claude Code in that directory.

(iii) Ask Claude to read `CLAUDE.md`, `work-packages/IB0-WP01/WORK_PACKAGE.md`, and `.paep-control/SOURCE_OF_TRUTH.md` before modifying files.

(iv) Start execution with `work-packages/IB0-WP01/prompts/01_EXECUTE.md`.

(v) Require Claude to retain evidence under `evidence/IB0-WP01/` and to run the verification described in `work-packages/IB0-WP01/ACCEPTANCE.md`.

(vi) After implementation reports PASS, start a fresh Claude session where practical and run `work-packages/IB0-WP01/prompts/02_INDEPENDENT_QA.md`.

(vii) If a mandatory criterion fails, use `work-packages/IB0-WP01/prompts/03_DEFECT_REPAIR.md`. Do not waive or weaken a gate merely to obtain PASS.

(viii) Human acceptance is recorded only after the technical gates pass, using `work-packages/IB0-WP01/ACCEPTANCE_REPORT_TEMPLATE.md`.

## Important scope boundary

IB0-WP01 creates the repository and Angular workspace skeleton only. It does **not** implement Frappe integration, product screens, analytics dashboards, offline queues, the enterprise shell, domain components, or the full architecture-boundary enforcement that belongs to later IB0 work packages.

## Expected end-state

At the end of IB0-WP01, the repository shall have a reproducible Angular workspace, `apps/reference-app`, `apps/ui-lab`, the approved package/tooling/configuration/documentation/evidence topology, a committed npm lockfile, and clean build/start evidence for the two starter applications. Exact toolchain pinning and stronger package-boundary enforcement continue in subsequent IB0 work packages.

## Workspace (IB0-WP01 bootstrap)

The repository root is a plain Angular CLI workspace that uses npm workspaces. It does not use Nx; see `docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md`.

| Item | Value |
| --- | --- |
| Node.js | 24.21.0, pinned in `.nvmrc` and enforced by `devEngines` |
| npm | 11.19.0 (bundled with Node 24.21.0), pinned in `packageManager` and enforced by `devEngines` |
| Angular / Angular CLI | 22.1.8 |
| TypeScript | 6.0.3 |

```bash
npm ci
npm run build:reference-app   # production build of apps/reference-app
npm run build:ui-lab          # production build of apps/ui-lab
npm run qa:ib0-wp01           # IB0-WP01 verifier; writes evidence/IB0-WP01/reports/ib0-wp01-verification.json
```

## Toolchain pinning (IB0-WP02)

Use Node 24.21.0 (`nvm use` or `fnm use` reads `.nvmrc`). npm checks `devEngines` before `install`, `ci` and `run`, so any other Node or npm version fails with `EBADDEVENGINES`. To change a version, update `.nvmrc`, `package.json` and `docs/architecture/toolchain-version-manifest.json` together in one reviewed change.

| Control | Where |
| --- | --- |
| Exact versions of Node, npm, Angular, TypeScript, RxJS and material build tools | `docs/architecture/toolchain-version-manifest.json` |
| Dependency `engines` must match the pinned Node | `.npmrc` `engine-strict=true` |
| Install scripts: all five current ones denied; any new unreviewed one fails install | `package.json` `allowScripts`; `.npmrc` `strict-allow-scripts=true` |
| Licence review | `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` |

```bash
npm run qa:ib0-wp02           # IB0-WP02 verifier; writes evidence/IB0-WP02/reports/
```

Do not run `npm install-scripts prune` on Linux or Windows: it removes the macOS-only `fsevents` entry, which then breaks macOS installs under strict mode.

| Area | Contents |
| --- | --- |
| `apps/` | Thin applications: `reference-app` and `ui-lab`. Each is a minimal starter only. |
| `packages/` | `@proseit/*` package placeholders (README and private `package.json`). No implementation yet. |
| `tooling/` | Development and CI tooling areas, including the IB0-WP01 verifier. |
| `config/` | Runtime configuration schema and non-secret examples (IB1). |
| `docs/` | Architecture, ADRs, reporting metrics, provenance, licences and migration. |
| `evidence/` | Retained test, accessibility, performance, security, SBOM, release, portability, usability and analytics evidence. |
