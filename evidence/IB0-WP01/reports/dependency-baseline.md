# IB0-WP01 Dependency Baseline

Record direct dependencies introduced by the bootstrap. Transitive dependency detail may be generated later through SBOM tooling.

Source commit under test: `b9904d023a5a8a8df6c4d9b9900b48188ff5095f`. Licences were read from each installed package's `package.json` after `npm ci`.

| Package | Version | Runtime / development | Purpose | Licence verified? | Notes |
| --- | --- | --- | --- | --- | --- |
| @angular/core | 22.1.8 | Runtime | Angular framework core | Yes: MIT | Controlled Angular 22.x |
| @angular/common | 22.1.8 | Runtime | Common Angular services/directives | Yes: MIT | |
| @angular/compiler | 22.1.8 | Runtime | Template compiler (peer of core) | Yes: MIT | |
| @angular/platform-browser | 22.1.8 | Runtime | Browser bootstrap | Yes: MIT | |
| @angular/router | 22.1.8 | Runtime | Router provider for the generated starter apps (routes are empty) | Yes: MIT | Generator default; the IB-01 §17.2 app baseline includes `app.routes.ts` |
| @angular/forms | 22.1.8 | Runtime | Angular forms (CLI workspace default dependency) | Yes: MIT | Not yet imported by either app |
| rxjs | 7.8.2 | Runtime | Reactive streams (peer of @angular/core) | Yes: Apache-2.0 | Supported 7.x line per IB-01 §4.1 |
| tslib | 2.8.1 | Runtime | TypeScript helper runtime (`importHelpers`) | Yes: 0BSD | |
| @angular/cli | 22.1.8 | Development | Workspace CLI | Yes: MIT | |
| @angular/build | 22.1.8 | Development | Application builder (esbuild/Vite based) | Yes: MIT | IB-01 §4.1: no deprecated webpack builder |
| @angular/compiler-cli | 22.1.8 | Development | AOT compiler | Yes: MIT | |
| typescript | 6.0.3 | Development | Compiler | Yes: Apache-2.0 | Pinned exactly; npm `latest` is 7.x |

## Material generated/transitive build dependencies

| Package | Version | Licence | Why material |
| --- | --- | --- | --- |
| esbuild | 0.28.2 | MIT | Bundler used by `@angular/build` |
| vite | 8.1.5 | MIT | Dev server used by `@angular/build` |
| sass | 1.101.0 | MIT | Stylesheet compiler bundled by `@angular/build` |
| postcss | 8.5.28 | MIT | CSS processing |
| lightningcss (+ platform binaries) | per lockfile | MPL-2.0 | CSS tooling. MPL-2.0 is weak copyleft at file level and is build-time only. Flagged for licence review in WP02 or SBOM work. |
| caniuse-lite | per lockfile | CC-BY-4.0 | Browser-support data (build-time only). Attribution licence; flagged for licence review. |
| lru-cache | per lockfile | BlueOak-1.0.0 | Permissive; build-time only |
| lmdb, msgpackr-extract, @parcel/watcher | 3.5.6, 3.0.4, 2.6.0 | MIT | Native helpers with install scripts not run under npm 11 policy; see toolchain-baseline note (vi) |

Lockfile summary: 434 installed third-party entries plus 18 local workspace links (`@proseit/*`). Licence counts: MIT 372, ISC 23, MPL-2.0 12, BSD-2-Clause 11, Apache-2.0 8, BSD-3-Clause 5, CC-BY-4.0 1, BlueOak-1.0.0 1, 0BSD 1. The 18 entries without a licence are the private `@proseit/*` workspace placeholders. `npm ci` reported `found 0 vulnerabilities`. A machine-readable SPDX SBOM is a later deliverable under `tooling/build-release`.

## Scope review

(i) Frappe/backend client libraries introduced: **None.** `@proseit/frappe-sdk` is a private placeholder with no code and no dependencies.

(ii) Chart/reporting libraries introduced: **None.**

(iii) Commercial/proprietary UI template dependencies introduced: **None.** No PrimeNG, PrimeIcons, Ultima or commercial UI kit.

(iv) State-management frameworks introduced: **None.**

Evidence: `evidence/IB0-WP01/logs/scope-and-secret-scan.log`; verifier check V12 in `reports/ib0-wp01-verification.json`.
