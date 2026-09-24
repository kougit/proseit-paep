# LANE B: Licence and provenance check for IB0-WP02 closure

- Repo: clone of `/home/claude/proseit-paep` at `39bf00e` (branch `claude/ib0-wp02-c625bb`). Clone location: `close/B/work`. The original repo was not modified.
- Toolchain: Node v24.21.0 and npm 11.19.0 (`/opt/node24/bin`). Dependencies installed only with `npm ci` (exit 0, "found 0 vulnerabilities").
- Lockfile sha256: `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69`. This equals the baseline in the review and in the inventory.
- This is an engineering review, not legal advice. I verified every point below myself. Raw logs are in `close/B/logs/`.

**Verdict: no provenance blocker.** Every count, version, path and hash in the three reviewed documents checks out. I found one defect in the evidence: the committed grep command could never match, although its conclusion is still true. I also found three places where the wording is imprecise or incomplete (D2 to D4). None of these changes a disposition.

---

## 1. Resolved versions, scope, integrity and licence

Sources: `logs/lockfile-entries.txt`, `logs/installed-metadata.txt`, `logs/licence-files.txt`, `logs/npm-ls*.txt`.

| Field | lightningcss | lightningcss-linux-x64-gnu (the installed native binary) | caniuse-lite |
| --- | --- | --- | --- |
| Version in the lockfile | 1.33.0 | 1.33.0 | 1.0.30001810 |
| Version installed (`node_modules/*/package.json`) | 1.33.0 | 1.33.0 | 1.0.30001810 |
| Flags in the lockfile | `dev: true` | `dev: true`, `optional: true` | `dev: true` |
| Direct or transitive | Transitive: `@angular/build@22.1.8` → `vite@8.1.5` (`dependencies: ^1.32.0`) → `lightningcss` | Optional dependency of lightningcss. It is one of 11 platform binaries; the lockfile has 12 MPL-2.0 entries in total | Transitive: `@angular/build@22.1.8` → `browserslist@4.29.0` (`dependencies: ^1.0.30001810`) → `caniuse-lite` |
| `npm ls --omit=dev` | empty | empty | empty |
| `resolved` | `https://registry.npmjs.org/lightningcss/-/lightningcss-1.33.0.tgz` | `https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.33.0.tgz` | `https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001810.tgz` |
| `integrity` | `sha512-WkUDrojuJs0xkgGf2udWxa3yGBRxPtxUkB79i6aCZLRgc7PM8fZe9TosfPDcvEpQZbuFASnHYmRLBLUbmLOIIA==` | `sha512-ar+Ju7LmcN0Jo4FpL4hpFybwNG9/3A/Br5KW2n2jyODg3MEZXaDYADdemoNS+BDNfMgKvylJLj4S5tyRActuAg==` | `sha512-TITQPUkaz+aVk5GL6NhOdwk1aEaNTSDPsGFWrTuhKGtjTF70jL/Oht2W4c6rXUe5fu7Ie19VIahAXHIIiWWNeg==` |
| Declared `license` | `MPL-2.0` | `MPL-2.0` | `CC-BY-4.0` |
| LICENSE file heading | "Mozilla Public License Version 2.0". 373 lines, sha256 `5eba353f…d040e`. No copyright line; Exhibit A is left as the template | Same file, byte-identical | "Attribution 4.0 International". 395 lines, sha256 `fd3a263f…5f16e`. No copyright line |
| `repository` | `git` `https://github.com/parcel-bundler/lightningcss.git` | same | `browserslist/caniuse-lite`, which resolves to https://github.com/browserslist/caniuse-lite |
| `author` / `homepage` | Neither field is present. The upstream `Cargo.toml` names `authors = ["Devon Govett"]` | Neither field is present | author "Ben Briggs" (the packager); no homepage field. The README says "A smaller version of caniuse-db" |

Upstream check (`logs/upstream-*-fetch.txt`):
- The LICENSE at tag `parcel-bundler/lightningcss` `v1.33.0` has sha256 `5eba353f…`, byte-identical to the installed file.
- Upstream `Fyrd/caniuse` LICENSE line 1 reads "Copyright (C) 2020 Alexis Deveria". Its README says: "For attribution just mention somewhere that the source is caniuse.com". The upstream caniuse-lite README says the same.
- These upstream files were fetched from the `main` branch, not from a pinned revision.

## 2. Role in the build

**Who imports each package** (`logs/require-sites.txt`, `logs/usage-context.txt`, `logs/vite-lightningcss-trigger.txt`):
- `vite/dist/node/chunks/node.js:23401` contains `createCachedImport(() => import("lightningcss"))`. Vite calls it only in two cases:
  - `css.transformer === "lightningcss"`, or
  - `build.cssMinify === "lightningcss"`. This is Vite's own build path, and that setting is the default only for the `server` consumer (line 32885).
- `@angular/build` itself has **no** reference to `lightningcss` (`grep -rln` exit 1).
- Angular's dev server passes Vite only `css: { devSourcemap: true }` (`dev-server/vite/server.js:152`).
- `browserslist/index.js:3` and `node.js:1-2` require `caniuse-lite/dist/unpacker/*`.
- `@angular/build/src/utils/supported-browsers.js:14` requires `browserslist`. It is called from `application/execute-build.js:71` and from the dev server (`vite/index.js:291`).

**Builds** (`logs/build-normal-*.log`): both apps built with exit 0. Their browser output hashes are identical to the committed `evidence/IB0-WP02/logs/dist-hashes.log` (`main-4FFRGG7I.js 8fb68a91…`, `main-RPR4FBCF.js a15259cb…`).

**Search of `dist/`** (`logs/dist-grep-normal.txt`), case-insensitive:
- None of these terms appears in any file under `dist/`: `lightningcss`, `caniuse`, `browserslist`, `Mozilla Public`, `creativecommons`, `CC-BY`, or `MPL` as a whole word.
- A case-insensitive substring search for `mpl` matches only ordinary words such as "implement" or "sample".
- Neither JS bundle contains `@license` or `/*!` (count 0).

**Build without lightningcss** (`logs/sha256-*.txt`, `logs/sha256-compare.txt`):
- I renamed `node_modules/lightningcss` and `node_modules/lightningcss-linux-x64-gnu`, confirmed `require.resolve` gives `MODULE_NOT_FOUND`, and cleared `dist` and `.angular`.
- Both builds still exited 0. The sha256 of every file under `dist/*/browser` was identical to the normal build, and `diff -r` over the whole of `dist/` was also identical. The build logs were identical apart from timings.
- I then restored both directories, rebuilt, and got identical output again.
- Limitation: both apps have effectively empty CSS. `styles.css` holds only a comment, `app.css` is 0 bytes, and the styles bundle is 0 bytes. The strongest evidence is therefore the static finding above: nothing in the Angular builder imports lightningcss.

**Build without caniuse-lite** (extra check, `logs/build-nocaniuse-reference-app.log`): the build fails with `Cannot find module 'caniuse-lite/dist/unpacker/agents'`. So caniuse-lite really is required at build time, but its data does not reach the output.

**`3rdpartylicenses.txt`** (identical for both apps, 16954 bytes): it lists `@angular/core` (MIT), `rxjs` (Apache-2.0), `tslib` (0BSD), `@angular/common` (MIT), `@angular/platform-browser` (MIT) and `@angular/router` (MIT). Source maps from a `--source-map` build contain exactly the same six packages (`logs/sourcemap-packages.txt`). The `k8-fastbuild…/packages/platform-browser` paths in those maps are Angular's embedded sources for `@angular/platform-browser`, not first-party code.

## 3. Obligations and proposed notice-record entries

**MPL-2.0 (lightningcss)**
- MPL-2.0 is file-level copyleft. Its obligations (§3.1 and §3.2) arise only when Covered Software is **distributed**.
- §3.2 also covers unmodified *Executable Form*: the recipient must be told how to get the Source Code Form, and the licence must go with it. The `lightningcss-*.node` binaries are Executable Form.
- Using it unmodified at build time, without redistributing it, creates no obligation.
- Recording a notice is still good practice. It becomes mandatory if `node_modules` is ever shipped, for example in a dev-container image or an offline installer.

**CC-BY-4.0 (caniuse-lite)**
- §3(a) applies when the Licensed Material is Shared. It then requires naming the creator, keeping any copyright notice, giving the licence URI or a link, and saying whether the material was modified.
- Internal build-time use, where only the chosen compile targets reach the output, is not Sharing.
- Proposed attribution: "caniuse.com, Alexis Deveria".

Proposed text for a notice record, for example `docs/licences/THIRD-PARTY-NOTICES.md` or a new section in the review:

```text
Package:     lightningcss 1.33.0 (with platform binaries lightningcss-<platform> 1.33.0; installed here: lightningcss-linux-x64-gnu 1.33.0)
Licence:     MPL-2.0 (Mozilla Public License, v. 2.0)
Copyright:   No copyright line in the package metadata or LICENSE (Exhibit A unfilled). Upstream Cargo.toml author: Devon Govett; project: Parcel / Lightning CSS contributors.
Source:      https://github.com/parcel-bundler/lightningcss (tag v1.33.0); npm https://registry.npmjs.org/lightningcss/-/lightningcss-1.33.0.tgz
Integrity:   sha512-WkUDrojuJs0xkgGf2udWxa3yGBRxPtxUkB79i6aCZLRgc7PM8fZe9TosfPDcvEpQZbuFASnHYmRLBLUbmLOIIA==
Licence URL: https://mozilla.org/MPL/2.0/
Use in PAEP: Transitive dev dependency (@angular/build -> vite -> lightningcss). Unmodified; not vendored; not loaded by the Angular production build; no code or notice in dist/.
Notice:      "This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/." If PAEP ever distributes these files (for example node_modules in an image), include the MPL-2.0 text and state that the Source Code Form is available at https://github.com/parcel-bundler/lightningcss/tree/v1.33.0.
```

```text
Package:     caniuse-lite 1.0.30001810
Licence:     CC-BY-4.0 (Creative Commons Attribution 4.0 International)
Attribution: Browser support data from caniuse.com by Alexis Deveria (upstream data licence: "Copyright (C) 2020 Alexis Deveria", github.com/Fyrd/caniuse), packaged as caniuse-lite by Ben Briggs and the Browserslist project (https://github.com/browserslist/caniuse-lite).
Source:      npm https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001810.tgz
Integrity:   sha512-TITQPUkaz+aVk5GL6NhOdwk1aEaNTSDPsGFWrTuhKGtjTF70jL/Oht2W4c6rXUe5fu7Ie19VIahAXHIIiWWNeg==
Licence URL: https://creativecommons.org/licenses/by/4.0/
Use in PAEP: Transitive dev dependency (@angular/build -> browserslist -> caniuse-lite). Used at build time to derive compile targets; no data in dist/.
Notice:      If PAEP shares the data or tables derived from it, it must display: "Browser support data: caniuse.com (Alexis Deveria), licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). [Modified: <describe> | Unmodified]."
```

## 4. Review of the three documents

I recounted independently from the lockfile (`logs/recount.cjs`, output in `logs/independent-recount.txt`). Every figure below matches, with 0 differences against `licence-inventory.json`:
- 434 third-party entries and 36 workspace or link entries.
- By licence: MIT 372, ISC 23, MPL-2.0 12, BSD-2-Clause 11, Apache-2.0 8, BSD-3-Clause 5, CC-BY-4.0 1, BlueOak 1 (`lru-cache` 11.5.3, dev), 0BSD 1.
- Runtime scope 10: MIT 8, Apache-2.0 1, 0BSD 1. Dev scope 424.
- 306 packages installed on this linux-x64 machine.
- 0 entries resolved from anywhere other than the npm registry, 0 without sha512 integrity, 0 deprecated, 0 without a licence.
- 0 differences between installed package metadata and the lockfile.
- 0 installed packages with a NOTICE file.

Other claims that checked out (`logs/crosscheck-register.txt`):
- Every version in the build-tools row and in `toolchain-version-manifest.json` matches the lockfile: esbuild 0.28.2, vite 8.1.5, rolldown 1.2.0 and 1.1.5, sass 1.101.0, postcss 8.5.28, @babel/core 8.0.1, browserslist 4.29.0, beasties 0.4.3 (Apache-2.0), devkit 22.1.8 and architect 0.2201.8.
- The five install-script packages and their versions match.
- `.npmrc` sets `strict-allow-scripts=true` and `.nvmrc` pins 24.21.0.
- Commit `b9904d0` exists.
- Every file the documents cite as evidence exists.
- No app imports `@angular/forms`, which supports L3.
- `extractLicenses: false` appears only in the development configurations.

Discrepancies:

- **D1 (evidence defect, medium, the conclusion is still correct).** `evidence/IB0-WP02/logs/licence-dist-check.log:5` records `grep -rIil 'lightningcss|caniuse|…|CC-BY' dist/` with no `-E` flag.
  - In basic regex a bare `|` is a literal character, so that command cannot match anything, and its "(no matches)" result proves nothing.
  - A positive control shows the problem: `grep -rIil 'rxjs|tslib' dist/` returns exit 1, but the same search with `-E` finds both `3rdpartylicenses.txt` files (`logs/grep-bre-vs-ere-control.txt`).
  - Re-running with `-E` still gives exit 1, so the claim that nothing is shipped holds.
  - AC15 cites this log as its dist-check evidence. Fix: regenerate it with `grep -E`, include a positive control, and let the verifier produce it.
- **D2 (wording, low).**
  - Review §3 says Vite "loads it lazily for dev-server CSS work". The register row says "Vite dev-server CSS tooling".
  - Reading the source, Vite loads it only for `css.transformer: 'lightningcss'` or for lightningcss CSS minification in its own build path. Angular's dev server configures neither, and `@angular/build` never references it.
  - More accurate wording: "hard dependency of vite; installed but not configured or loaded by the Angular builders (production build proven; dev server by source inspection)".
- **D3 (wording, low).**
  - Review §3 says obligations arise "when Covered Software is distributed … and they cover modifications to MPL-covered files". That reads as if modification were required.
  - §3.2 also applies to distributing unmodified Executable Form, which includes the `.node` binaries.
  - Condition (ii) already handles this correctly, so there is no practical gap. The sentence should be clarified.
- **D4 (incomplete, low).**
  - Review §4 condition (ii) says "credit caniuse.com, link the licence and indicate changes". It does not name the creator, Alexis Deveria, and does not note that the installed package has no copyright line; that line comes from the upstream `Fyrd/caniuse` LICENSE.
  - The register lists the package with no attribution line.
  - Proposed fix: add the notice-record text in §3 above.
- **D5 (gap, informational).** No notice record exists for L1 or L2, and there is no THIRD-PARTY-NOTICES file. AC15 does not require one. The text in §3 is ready to add if the reviewer wants it.
- **D6 (informational).** `licence-dist-check.log` was produced at `916cb9d`, while HEAD is `39bf00e`. The commits between them change only evidence and documents, not the lockfile or app sources, and my hashes reproduce the committed ones exactly. No action is needed.

The following claims are accurate:
- Every licence disposition is marked "Proposed … pending human approval", and nothing is marked Approved.
- L4 (the favicon is the Angular logo) is recorded.
- `npm audit signatures` is still listed as not yet evidenced (§7). That is an open item for the approver, not a factual error.

## 5. Blockers

**None.** No licence is unreviewed, no count or version is wrong, and no MPL or CC-BY material ships. D1 should be corrected before the evidence set is treated as final. D2 to D5 are optional clarifications to the documents.
