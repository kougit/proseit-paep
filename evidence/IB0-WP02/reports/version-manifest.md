# IB0-WP02 Version Manifest (human-readable)

Machine-readable source of truth: `docs/architecture/toolchain-version-manifest.json`. Verifier check V11 compares every value below with `.nvmrc`, `package.json`, `package-lock.json` and the installed tree (PASS at commit `916cb9d`). Registry and release state reviewed 2026-09-23 (`logs/registry-review.log`).

## Runtime

| Tool | Pinned | Where pinned / enforced | Compatibility envelope |
| --- | --- | --- | --- |
| Node.js | 24.21.0 (24 LTS "Krypton", newest v24 on 2026-09-23) | `.nvmrc`; `devEngines.runtime` (onFail=error) | Angular 22.1.8 engines: `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` |
| npm | 11.19.0 (bundled with Node 24.21.0) | `packageManager`; `devEngines.packageManager` (onFail=error) | npm 12.1.0 and 11.20.0 exist; the bundled version is kept |

## Framework, language and libraries (direct dependencies, exact)

| Package | Version | Controlled family | Note |
| --- | --- | --- | --- |
| @angular/core, common, compiler, forms, platform-browser, router | 22.1.8 | Angular 22.x | `@angular/core` latest is 22.2.0, but CLI/build 22.2.0 is only rc.0; 22.1.8 keeps core and CLI aligned |
| @angular/cli, @angular/build, @angular/compiler-cli | 22.1.8 | Angular 22.x | Aligned with core |
| typescript | 6.0.3 | 6.0.x | Newest 6.0.x; inside the compiler-cli peer range `>=6.0 <6.1`; npm `latest` is 7.x (outside the family) |
| rxjs | 7.8.2 | 7.x | Newest 7.x; inside the core peer range `^6.5.3 \|\| ^7.4.0` |
| tslib | 2.8.1 | n/a | |

## Material build tools (transitive, locked)

| Tool | Version | Pulled in by |
| --- | --- | --- |
| @angular-devkit/architect | 0.2201.8 | @angular/cli |
| @angular-devkit/core, @angular-devkit/schematics, @schematics/angular | 22.1.8 | @angular/cli |
| esbuild | 0.28.2 | @angular/build, vite |
| vite | 8.1.5 | @angular/build (dev server) |
| rolldown | 1.2.0 (plus 1.1.5 nested under vite) | @angular/build; vite |
| sass | 1.101.0 | @angular/build |
| postcss | 8.5.28 | @angular/build, vite |
| lightningcss | 1.33.0 | vite |
| @babel/core | 8.0.1 | @angular/build |
| browserslist / caniuse-lite | 4.29.0 / 1.0.30001810 | @angular/build |
| beasties | 0.4.3 | @angular/build |

## Orchestration and lockfile

| Item | Value |
| --- | --- |
| Workspace orchestration | Angular CLI workspace + npm workspaces. Nx: not used; orchestration and project graph deferred to IB0-WP04 |
| Lockfile | `package-lock.json`, lockfileVersion 3, sha256 `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` (byte-identical to IB0-WP01) |
| Install-script policy | Deny all five; `strict-allow-scripts=true` (see `install-script-policy.md`) |

## Why npm is pinned as well as Node

The same lockfile installs 324 packages with npm 11.19.0 and 329 with npm 10.9.7 (npm 10 adds five WASM helper packages). Pinning Node alone would not fix the installed tree, so `devEngines.packageManager` enforces the npm version too (`logs/npm10-vs-npm11-installed-tree.log`; enforcement shown in `logs/negative-node-version.log`, case node24+npm10).
