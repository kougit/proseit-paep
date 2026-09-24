# PAEP Third-Party Licence Review (IB0-WP02)

**Status:** L1 (`lightningcss`) and L2 (`caniuse-lite`) are **APPROVED BUILD-TIME DEPENDENCIES**, approved on 2026-09-24 by the Product Owner / Solutions Architect in the IB0-WP02 authorisation instruction (see §3, §4 and `evidence/IB0-WP02/notes/closure-authorisation.md`). PAEP v1.1 assigns this decision domain to the Engineering Governance / IP owner; no separate decision by that role is recorded, and the PO/SA decision is the recorded disposition. The remaining dispositions (§1 permissive set, L3, L4) stay as proposed. This is an engineering licence-compliance review, not legal advice.

**Baseline:** `package-lock.json` sha256 `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` (lockfileVersion 3), Node 24.21.0, npm 11.19.0, reviewed 2026-09-23. Every count here is specific to that lockfile. Any lockfile change requires the inventory to be regenerated and this review re-checked.

**Generated inventory:** `node tooling/verification/verify-ib0-wp02.mjs` writes `evidence/IB0-WP02/reports/licence-inventory.json` and `licence-inventory.md` from the lockfile, and fails (check V15) on any licence outside §1 or any reviewed licence outside its approved package and scope.

## 1. Inventory

434 third-party lockfile entries, all from `https://registry.npmjs.org/` with sha512 integrity. The count includes optional platform binaries for every OS; about 306 are installed on a given linux-x64 machine. The private `@proseit/*` workspace entries are excluded.

| Licence | Entries | Runtime scope | Proposed disposition |
| --- | --- | --- | --- |
| MIT | 372 | 8 | Permissive: accept |
| ISC | 23 | 0 | Permissive: accept |
| MPL-2.0 | 12 | 0 | Review item L1 |
| BSD-2-Clause | 11 | 0 | Permissive: accept |
| Apache-2.0 | 8 | 1 (`rxjs`) | Permissive: accept. No installed package ships a NOTICE file. |
| BSD-3-Clause | 5 | 0 | Permissive: accept |
| CC-BY-4.0 | 1 | 0 | Review item L2 |
| BlueOak-1.0.0 | 1 (`lru-cache`, dev) | 0 | Permissive (OSI-approved): accept |
| 0BSD | 1 (`tslib`) | 1 | Permissive, no attribution requirement: accept |

Checks: no missing, non-SPDX, "SEE LICENSE IN" or dual-licence expressions; the lockfile and installed package metadata agree; no deprecated packages; `npm audit` reports 0 vulnerabilities (runtime and all); no prohibited dependency (PrimeNG, PrimeIcons, Ultima, commercial UI kits, chart or grid libraries, state frameworks, Nx, Frappe clients).

## 2. Review items

| ID | Package | Licence | Dependency path | Scope | Shipped in `dist/`? | Proposed disposition |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | `lightningcss` 1.33.0 and its 11 platform binaries | MPL-2.0 | `@angular/build` → `vite` 8.1.5 → `lightningcss` | dev | No | **APPROVED BUILD-TIME DEPENDENCY** (2026-09-24), with the conditions in §3 |
| L2 | `caniuse-lite` 1.0.30001810 | CC-BY-4.0 | `@angular/build` → `browserslist` 4.29.0 → `caniuse-lite` | dev | No | **APPROVED BUILD-TIME DEPENDENCY** (2026-09-24), with attribution and the conditions in §4 |
| L3 | `zod` 4.4.3, `@standard-schema/spec` 1.1.0 | MIT | `@angular/forms` (hard dependencies) | runtime | Not currently (neither app imports forms) | Accept; recorded because they were missing from the IB0-WP01 register |
| L4 | Angular default `favicon.ico` in both apps | Angular logo (brand/trademark question, not a licence one) | `@schematics/angular` generator template | shipped asset | Yes | Internal use only; replace with a ProSEIT-owned icon before any external release |

## 3. L1: lightningcss (MPL-2.0)

| Field | Record |
| --- | --- |
| Resolved version | 1.33.0 (lockfile and installed tree agree); platform binaries `lightningcss-<platform>` 1.33.0 |
| Direct or transitive | Transitive devDependency only: `@angular/build` 22.1.8 → `vite` 8.1.5 → `lightningcss`. `npm ls --omit=dev` shows no runtime path. |
| Build-time purpose | Installed because `vite` declares it; `vite` can use it for CSS transformation. The Angular builders do not configure `vite` to load it, and the production build does not use it (see Use below). |
| Licence | MPL-2.0 (package metadata and `LICENSE`; the installed `LICENSE` is byte-identical to upstream tag `v1.33.0`) |
| Upstream provenance | https://github.com/parcel-bundler/lightningcss; fetched from registry.npmjs.org with sha512 integrity pinned in `package-lock.json` |
| Distribution assessment | Not distributed. Not committed, vendored, modified or shipped; nothing from it is in `dist/`. |
| Notice obligations | None while it is not distributed. Notice and upstream source recorded in `THIRD-PARTY-NOTICES.md` N1. |
| Disposition | **APPROVED BUILD-TIME DEPENDENCY**, Product Owner / Solutions Architect, 2026-09-24 |
| Re-review trigger | If PAEP later modifies and distributes MPL-covered lightningcss source/files, or changes the dependency's distribution role, perform a new licence review before release. |

**Use.** `vite` declares `lightningcss` as a regular dependency. `@angular/build` never references it and does not configure `vite` to load it. The Angular production build does not load it: with `lightningcss` removed in a scratch copy, both production builds succeeded and produced byte-identical output. No `lightningcss` code, text or notice appears in `dist/`.

**Obligations (engineering reading).** MPL-2.0 is a file-level weak copyleft. Its obligations arise when Covered Software is distributed, in source or executable form. Distributing unmodified files, including the `.node` executables, also carries obligations (MPL-2.0 §3.1, §3.2: licence text and access to the Source Code Form), and modifications to MPL-covered files must stay under MPL-2.0. PAEP does not distribute `lightningcss`: every developer or CI machine fetches it from the npm registry during `npm ci`, and it is not committed, vendored, modified or shipped. The PAEP sources and bundles are a "Larger Work" and are not Covered Software.

**Conditions of approval:**

(i) Do not vendor, commit, patch or copy `lightningcss` files into PAEP.

(ii) If a toolchain artefact containing `node_modules` is ever distributed outside ProSEIT (for example a dev-container image or offline installer), re-review; such an artefact must carry the MPL-2.0 licence and a pointer to the upstream source.

(iii) Re-review when the version changes, when the production build starts to use it, or when `npm ls --omit=dev` shows a runtime path to it.

(iv) **Re-review trigger (approval condition):** if PAEP later modifies and distributes MPL-covered lightningcss source/files, or changes the dependency's distribution role, perform a new licence review before release.

## 4. L2: caniuse-lite (CC-BY-4.0)

| Field | Record |
| --- | --- |
| Resolved version | 1.0.30001810 (lockfile and installed tree agree) |
| Direct or transitive | Transitive devDependency only: `@angular/build` 22.1.8 → `browserslist` 4.29.0 → `caniuse-lite`. `npm ls --omit=dev` shows no runtime path. |
| Build-time purpose | Browser-support data read by `browserslist` to choose the esbuild transpile targets. It is required: the build fails without it. |
| Licence | CC-BY-4.0 (package metadata and `LICENSE`) |
| Upstream provenance | Package: https://github.com/browserslist/caniuse-lite (Ben Briggs, Browserslist project). Data: caniuse.com by Alexis Deveria (https://github.com/Fyrd/caniuse). Fetched from registry.npmjs.org with sha512 integrity pinned in `package-lock.json`. |
| Distribution assessment | Not distributed. No caniuse data is in `dist/`; only the derived syntax level affects the output. |
| Notice obligations | Attribution applies only if the data is shared. Attribution to caniuse.com (Alexis Deveria) is retained in `THIRD-PARTY-NOTICES.md` N2. |
| Disposition | **APPROVED BUILD-TIME DEPENDENCY**, with attribution retained, Product Owner / Solutions Architect, 2026-09-24. The approval covers this build-time use only and does not extend to any other use of the data. |
| Re-review trigger | If the data becomes part of a separately distributed PAEP dataset or artefact, or its use materially changes, perform a new licence review before that release. |

**Use.** `@angular/build` runs `browserslist` queries at build time to choose the esbuild transpile targets. Only the resulting syntax level affects the output. No caniuse data is copied into `dist/`.

**Obligations (engineering reading).** CC-BY-4.0 attribution applies when the licensed material is shared (reproduced or made available). Internal build-time use, where only derived compile targets reach the output, does not share the data.

**Conditions of approval:**

(i) Do not vendor or redistribute `caniuse-lite` or its data in PAEP artefacts.

(ii) If PAEP documentation or `ui-lab` ever publishes browser-support tables taken from caniuse data, credit caniuse.com and its creator Alexis Deveria, link the licence and indicate changes (text in `THIRD-PARTY-NOTICES.md` N2).

(iii) Refreshing browser data (`npx update-browserslist-db`) rewrites `package-lock.json`, so it goes through the controlled lockfile-change process.

(iv) **Re-review trigger (approval condition):** if the caniuse-lite data becomes part of a separately distributed PAEP dataset or artefact, or its use materially changes, perform a new licence review. Approval for this build-time use does not imply approval for unrelated future uses.

## 5. Shipped application bundles

Third-party code shipped in both apps, confirmed from source maps: `@angular/core`, `@angular/common`, `@angular/platform-browser`, `@angular/router` (MIT), `rxjs` (Apache-2.0) and `tslib` (0BSD).

The production build emits `dist/<app>/3rdpartylicenses.txt` with exactly these licences (`extractLicenses` is on by default and off only in the development configuration). The file is written next to `browser/`, not inside it, and the JS bundles carry no licence comments. **Follow-up for release packaging:** every deployed build must include `3rdpartylicenses.txt`. IB0-WP02 records this rule; the executable release check belongs to the later build-release work.

## 6. Re-review triggers

The L1 and L2 triggers in §3(iv) and §4(iv); any `package-lock.json` change; a licence outside §1; a new runtime-scope dependency; a change to what `3rdpartylicenses.txt` lists; any change to release packaging or to what PAEP distributes.

## 7. Not yet evidenced

`npm audit signatures` (registry signature verification) could not run in the review environment because the network proxy blocked the Sigstore endpoint. It should run in CI (IB0-WP05) or on an unrestricted host before the dependency set is approved.
