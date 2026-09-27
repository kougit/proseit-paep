# PAEP Third-Party Notices and Attribution Record

**Status:** Approved record (IB0-WP02). Licence dispositions approved 2026-09-24 by the Product Owner / Solutions Architect; see `THIRD-PARTY-LICENCE-REVIEW.md` §3 and §4.

**Scope:** third-party material that PAEP uses under a licence with notice or attribution terms beyond the permissive set in `THIRD-PARTY-LICENCE-REVIEW.md` §1. Baseline: `package-lock.json` sha256 `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69`. Any version change updates this record.

Notices for code shipped in the application bundles are produced by the Angular build in `dist/<app>/3rdpartylicenses.txt` (currently `@angular/core`, `@angular/common`, `@angular/platform-browser`, `@angular/router`, `rxjs`, `tslib`). That file must be deployed with every build (`THIRD-PARTY-LICENCE-REVIEW.md` §5).

## N1. lightningcss (MPL-2.0)

| Field | Value |
| --- | --- |
| Package | `lightningcss` 1.33.0, with its platform binaries `lightningcss-<platform>` 1.33.0 (installed on linux-x64: `lightningcss-linux-x64-gnu`) |
| Licence | MPL-2.0 (Mozilla Public License, version 2.0), https://mozilla.org/MPL/2.0/ |
| Copyright | The package metadata and `LICENSE` carry no copyright line (MPL Exhibit A not filled in). Upstream project: Lightning CSS (Parcel), author Devon Govett and contributors. |
| Upstream source | https://github.com/parcel-bundler/lightningcss (tag `v1.33.0`) |
| Registry artefact | https://registry.npmjs.org/lightningcss/-/lightningcss-1.33.0.tgz, sha512 integrity in `package-lock.json` |
| Use in PAEP | Transitive devDependency (`@angular/build` → `vite` 8.1.5 → `lightningcss`). Unmodified; not vendored; not loaded by the Angular production build; nothing from it is in `dist/`. |
| Disposition | APPROVED BUILD-TIME DEPENDENCY |
| Notice text | "This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/." |
| Current obligation | None while PAEP does not distribute it. If any PAEP artefact ever contains these files (source or the `.node` binaries), it must include the MPL-2.0 text and state that the Source Code Form is available at the upstream source above. |

## N2. caniuse-lite (CC-BY-4.0)

| Field | Value |
| --- | --- |
| Package | `caniuse-lite` 1.0.30001810 |
| Licence | CC-BY-4.0 (Creative Commons Attribution 4.0 International), https://creativecommons.org/licenses/by/4.0/ |
| Attribution | Browser support data from **caniuse.com** by Alexis Deveria (upstream data: https://github.com/Fyrd/caniuse, "Copyright (C) 2020 Alexis Deveria"), packaged as `caniuse-lite` by Ben Briggs and the Browserslist project (https://github.com/browserslist/caniuse-lite). |
| Registry artefact | https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001810.tgz, sha512 integrity in `package-lock.json` |
| Use in PAEP | Transitive devDependency (`@angular/build` → `browserslist` 4.29.0 → `caniuse-lite`). Used at build time to derive compile targets. Unmodified; not vendored; no data in `dist/`. |
| Disposition | APPROVED BUILD-TIME DEPENDENCY, with attribution retained in this record |
| Attribution text to display if the data is ever shared | "Browser support data: caniuse.com (Alexis Deveria), licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). [Modified: <describe> \| Unmodified]." |

## N3. axe-core (MPL-2.0)

| Field | Value |
| --- | --- |
| Package | `axe-core` 4.13.0 |
| Licence | MPL-2.0 (Mozilla Public License, version 2.0), https://mozilla.org/MPL/2.0/ |
| Copyright | Deque Systems, Inc. and contributors (package metadata author: Deque Systems). The package also carries `LICENSE-3RD-PARTY.txt` for code it embeds. |
| Upstream source | https://github.com/dequelabs/axe-core (tag `v4.13.0`) |
| Registry artefact | https://registry.npmjs.org/axe-core/-/axe-core-4.13.0.tgz, sha512 integrity in `package-lock.json` |
| Use in PAEP | Direct devDependency (IB2-FOUNDATION-COMPONENTS). Injected unmodified into the locally served UI laboratory by `tooling/design-system/` to run accessibility checks. Not vendored; not imported by any app or package; nothing from it is in `dist/`. |
| Disposition | APPROVED DEV DEPENDENCY (L5, PO/SA 2026-09-27) |
| Notice text | "This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/." |
| Current obligation | None while PAEP does not distribute it. Any distributed artefact containing these files must include the MPL-2.0 text, `LICENSE-3RD-PARTY.txt` and a pointer to the upstream source above. |
