# IB0-WP02 Implementation Summary

**Commits:** `8525598` (work package and plan), `591b266` (pins, policy, manifest, verifier, licence review, registers), `916cb9d` (verifier lists workspace entries). Evidence commit follows. Baseline `b6b023f`.

## What changed

(i) **Node pinned and enforced.** `.nvmrc` = `24.21.0`. `package.json` `devEngines.runtime` = node `24.21.0`, `onFail: "error"`. npm now refuses `npm ci`, `npm install` and `npm run` on any other Node.

(ii) **npm pinned and enforced.** `packageManager: npm@11.19.0` (unchanged) plus `devEngines.packageManager` = npm `11.19.0`, `onFail: "error"`. This matters because npm 10 installs a different tree from the same lockfile.

(iii) **`.npmrc`.** `engine-strict=true` (a dependency whose `engines` exclude the pinned Node fails install) and `strict-allow-scripts=true` (any unreviewed install script fails install). No registry credentials.

(iv) **Install-script policy.** `allowScripts` denies all five packages with install scripts. None of them is needed, because the lockfile already carries their prebuilt platform binaries.

(v) **Version manifest.** `docs/architecture/toolchain-version-manifest.json`: exact Node, npm, all direct dependencies, 15 material build tools, orchestration ("Nx: not used"), lockfile hash and the script policy.

(vi) **Verifier.** `tooling/verification/verify-ib0-wp02.mjs` (`npm run qa:ib0-wp02`), Node built-ins only, 20 checks. It writes only under `evidence/IB0-WP02/reports/`.

(vii) **Licences and provenance.** `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` (inventory, `lightningcss` and `caniuse-lite` reviews); `docs/provenance/PROVENANCE-REGISTER.md` updated; `zod` and `@standard-schema/spec` newly recorded. All dispositions are proposed, pending human approval.

(viii) **Docs.** Root `README.md` pinning section; `docs/adr/ADR-REGISTER.md` notes that no ADR was needed.

## What did not change

`package-lock.json` (byte-identical), every dependency name and version, `apps/**`, `packages/**`, `angular.json`, `tsconfig.json`, `CLAUDE.md`, `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, the IB0-WP01 verifiers, and every IB0-WP01 work-package and evidence file. The production build output is byte-identical to the IB0-WP01 baseline build.

## Decisions taken as defaults (reviewable)

| Decision | Default taken | Alternative |
| --- | --- | --- |
| Node pin strictness | Exact 24.21.0 (IB-01 requires an exact pin) | A 24.x range |
| Root `engines` field | Not added (it would change the lockfile) | Add it and commit a 4-line lockfile change |
| Install scripts | Deny all five, strict mode on | Allow `esbuild` (gives only a faster CLI launcher) |
| IB0-WP01 install-script misstatement | Erratum in IB0-WP02 evidence; WP01 files untouched | Correct the three WP01 reports in place |
| Manifest location | `docs/architecture/toolchain-version-manifest.json` | A release-manifest area under `tooling/build-release/` |

## Known limitations and follow-ups

(i) **`CLAUDE.md` still names IB0-WP01.** Claude may not edit its own execution contract. A human should update the bounded objective and source-of-truth items 6–7 to IB0-WP02 (readiness condition R2).

(ii) **The IB0-WP02 definition was drafted by Claude.** `work-packages/IB0-WP02/WORK_PACKAGE.md` and `ACCEPTANCE.md` need human approval (readiness condition R1).

(iii) **Licence dispositions** for `lightningcss` (MPL-2.0) and `caniuse-lite` (CC-BY-4.0) need Engineering Governance / IP owner approval.

(iv) **`npm audit signatures` not run.** The review environment's proxy blocked the Sigstore endpoint. Run it in CI (IB0-WP05) or on an unrestricted host.

(v) **Not tested on macOS or Windows.** The prebuilt binaries exist for both, and `fsevents` is listed for macOS, but no run was made there.

(vi) **Release follow-ups (outside IB0-WP02):** every deployed build must ship `dist/<app>/3rdpartylicenses.txt`, which sits outside `browser/`; the Angular-logo `favicon.ico` should be replaced before any external release.

(vii) **Exact pin friction.** A Node or npm patch upgrade is now one reviewed change to `.nvmrc`, `package.json` and the manifest together. A developer with a globally upgraded npm (12.x is `latest`) is blocked until they use the npm bundled with Node 24.21.0.
