# IB0-WP02 Implementation Plan

Recorded before any toolchain file (`package.json`, `package-lock.json`, `.nvmrc`, `.npmrc`) was changed (AC01). Status at time of writing: IN PROGRESS. Baseline: IB0-WP01 ACCEPTED, merge commit `b6b023f`.

## Objective

Pin and enforce the approved PAEP toolchain, keep the committed lockfile in sync and unchanged by a clean install, record a version manifest, set an explicit npm install-script policy, and record the licence review deferred from IB0-WP01. Scope source: PAEP-IR-01 §4.4 row IB0-WP2 ("Pin the approved Angular/toolchain baseline and commit the lockfile"; evidence "Version manifest; package-lock; build log") and PAEP-IB-01 §4.1–§4.2.

## Controlled inputs read

| Source | Sections relied on |
| --- | --- |
| `CLAUDE.md` | Whole contract. Its bounded objective still names IB0-WP01 (see R2). |
| `.paep-control/SOURCE_OF_TRUTH.md` | Priority table; controlled decision (iii): exact versions "formally pinned/reviewed in the subsequent toolchain work package" |
| `.paep-control/text/PAEP_v1.1_text.md` | Dependencies row (approved dependency set, lockfiles, vulnerability review, SBOM); §19 open-source/provenance; Angular version row (pinned in release manifest) |
| `.paep-control/text/PAEP_IB_01_v1.0_text.md` | §4.1 framework release profile (Angular core/CLI aligned; Node 24 LTS exact pin in `.nvmrc` or equivalent; TypeScript 6.0.x; RxJS 7.x; npm workspaces + committed lockfile; `npm ci`; lockfile drift release-blocking); §4.2 version management rule; §18.1 deterministic dependency gate |
| `.paep-control/text/PAEP_IR_01_v1.0_text.md` | §4.4 IB0 work packages; §4.5 IB0 CI gates (clean install, reproducibility); §4.6 exit criteria |
| `.paep-control/text/PAEP_EQP_01_v1.1_text.md` | Execution, evidence, status vocabulary, fix-until-pass and "no test laundering" rules |
| `work-packages/IB0-WP01/ACCEPTANCE_REPORT.md` | Deferred actions to IB0-WP02: Node/npm pinning, install-script policy, `lightningcss`/`caniuse-lite` licence review |
| `evidence/IB0-WP01/reports/*.md` | Toolchain and dependency baselines; independent QA observations |
| `docs/provenance/PROVENANCE-REGISTER.md`, `docs/adr/ADR-REGISTER.md` | Pending-review rows; no approved ADRs |

The work was split into four read-only review lanes (toolchain, licences, reproducibility, controls) whose notes were kept outside the repository and consolidated here.

## Readiness conditions

(i) **R1.** Execution was instructed by the Product Owner / Solutions Architect on 2026-09-23. No IB0-WP02 definition existed in the controlled pack, so Claude drafted `work-packages/IB0-WP02/` from the controlled sources. That definition is pending human approval.

(ii) **R2. Open.** `CLAUDE.md` still names IB0-WP01 as the bounded objective. Claude does not edit its own execution contract; a human updates it. All `CLAUDE.md` rules and stop conditions are applied to this run.

*Closure note, 2026-09-24:* R1 and R2 were closed by the Product Owner / Solutions Architect. The definition was approved unchanged, and Claude was expressly authorised to amend `CLAUDE.md` once to a work-package-neutral rule (`work-packages/IB0-WP02/WORK_PACKAGE.md` §12).

(iii) **R3.** Exact Node pin `24.21.0`, enforced with `onFail: "error"`.

## Registry and release review (2026-09-23)

| Item | Current pin | Registry / release state | Decision |
| --- | --- | --- | --- |
| Angular core / CLI / build | 22.1.8 | `@angular/core` latest 22.2.0; `@angular/cli` and `@angular/build` latest 22.1.8 (22.2.0 only as rc.0) | Keep 22.1.8: newest version where core and CLI align |
| TypeScript | 6.0.3 | newest 6.0.x is 6.0.3; npm `latest` is 7.0.2 (outside the controlled family) | Keep 6.0.3 |
| RxJS | 7.8.2 | newest 7.x | Keep |
| Node.js | 24.21.0 | newest Node 24 LTS (released 2026-09-07); bundles npm 11.19.0 | Keep; pin exactly |
| npm | 11.19.0 | bundled with Node 24.21.0; npm 12.1.0 exists | Keep the bundled version; pin exactly |
| Nx | none | n/a | Not used (user decision in IB0-WP01); orchestration belongs to IB0-WP04 |

No version changes, so the lockfile's third-party resolution is expected to stay byte-identical to `b6b023f`.

## Decisions

(i) **Node pin.** `.nvmrc` = `24.21.0` (the developer tooling IB-01 names), and `package.json` `devEngines.runtime` = node `24.21.0`, `onFail: "error"`. `devEngines` is checked by npm before `install`, `ci` and `run`, so a wrong Node fails immediately. A root `engines` field is not added: npm writes it into the root lockfile entry, which would change `package-lock.json` without adding enforcement.

(ii) **npm pin.** Keep `packageManager: npm@11.19.0` and add `devEngines.packageManager` = npm `11.19.0`, `onFail: "error"`. npm itself ignores `packageManager`, and npm 10 installs a different tree from the same lockfile, so the npm version must be enforced too.

(iii) **Dependency engines.** `.npmrc` `engine-strict=true`, so a dependency whose declared `engines` do not match the pinned Node fails install rather than warning. `.npmrc` is used because `engine-strict` and `strict-allow-scripts` are npm configuration keys, which `package.json` cannot hold (WORK_PACKAGE §4(iii)).

(iv) **Install-script policy.** In npm 11.19.0 the root `allowScripts` field is advisory: unreviewed install scripts still run, with a warning. Only explicit `false` entries are skipped. Policy: deny all five lockfile packages that declare install scripts (`@parcel/watcher`, `esbuild`, `fsevents`, `lmdb`, `msgpackr-extract`), and set `.npmrc` `strict-allow-scripts=true` so any new unreviewed install script fails `npm ci`. Every denied script is redundant with the prebuilt platform packages already in the lockfile; the build output is byte-identical with the scripts run or denied. `fsevents` is macOS-only and is listed so macOS installs do not fail under strict mode.

(v) **Version manifest.** `docs/architecture/toolchain-version-manifest.json`, checked value by value against `.nvmrc`, `package.json`, `package-lock.json` and the installed tree by the IB0-WP02 verifier. A human-readable copy goes in `evidence/IB0-WP02/reports/version-manifest.md`.

(vi) **Licence review.** `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` records the full inventory, the `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) reviews and proposed dispositions. Dispositions stay "Proposed, pending human approval". The verifier regenerates the inventory from the lockfile and fails on any licence outside the reviewed set.

(vii) **Verifier.** `tooling/verification/verify-ib0-wp02.mjs` (Node built-ins only) plus npm script `qa:ib0-wp02`. It writes only under `evidence/IB0-WP02/reports/`.

(viii) **IB0-WP01 erratum.** Accepted IB0-WP01 evidence says the warned install scripts were not run under npm 11.19.0; they were. The correction is recorded in IB0-WP02 evidence. IB0-WP01 files are not edited.

(ix) **No ADR.** Exact Node pinning, npm workspaces, a committed lockfile and `npm ci` are already controlled by PAEP-IB-01 §4.1. `devEngines`, `.npmrc` and `allowScripts` are equivalent developer tooling and dependency-hygiene controls, not changes to a controlled decision.

## Intended file changes

| Path | Change |
| --- | --- |
| `work-packages/IB0-WP02/**` | New: work package, acceptance criteria, runbook, templates, prompts, traceability, acceptance report |
| `docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md` | New: this plan |
| `.nvmrc` | New: `24.21.0` |
| `.npmrc` | New: `engine-strict=true`, `strict-allow-scripts=true`; no registry credentials |
| `package.json` | Add `devEngines`, `allowScripts` and the `qa:ib0-wp02` script; no dependency added, removed or re-versioned |
| `package-lock.json` | Expected unchanged (verified, not assumed) |
| `docs/architecture/toolchain-version-manifest.json` | New: version manifest |
| `tooling/verification/verify-ib0-wp02.mjs` | New: IB0-WP02 verifier |
| `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md`, `docs/licences/README.md` | New licence review; README index updated |
| `docs/provenance/PROVENANCE-REGISTER.md` | Rows updated for the pinned toolchain and licence review |
| `docs/adr/ADR-REGISTER.md` | Note that IB0-WP02 needed no ADR |
| `README.md` | Toolchain and pinning section |
| `evidence/IB0-WP02/**` | New evidence |

Not changed: `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md`, `tooling/verification/validate-pack.mjs`, `tooling/verification/verify-ib0-wp01.mjs`, `apps/**`, `packages/**`, `angular.json`, `tsconfig*.json`, `work-packages/IB0-WP01/**`, `evidence/IB0-WP01/**`.

## Out of scope

Strict compiler flags, `tsconfig.base.json` and lint tooling (IB0-WP03); Nx, `nx.json` and boundary rules (IB0-WP04); CI workflows and test runner (IB0-WP05); release SBOM and release packaging (later build-release work). The favicon brand question and the rule that `3rdpartylicenses.txt` ships with each deployment are recorded as follow-ups, not implemented.
