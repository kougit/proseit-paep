# IB0-WP01 Toolchain Baseline

Source commit under test: `b9904d023a5a8a8df6c4d9b9900b48188ff5095f`. Recorded 2026-09-23.

| Tool | Controlled family | Exact version used | Verification command / source |
| --- | --- | --- | --- |
| Node.js | Supported by selected Angular 22.x release | 24.21.0 (LTS "Krypton") | `node --version`; header of `logs/npm-ci.log` |
| npm | Compatible with selected Node.js | 11.19.0 | `npm --version`; `package.json` `packageManager: npm@11.19.0` |
| Angular | 22.x | 22.1.8 (`@angular/common`, `compiler`, `core`, `forms`, `platform-browser`, `router`, `compiler-cli`) | `logs/ng-version.log`; `package-lock.json` |
| Angular CLI | Angular 22.x compatible | 22.1.8 (`@angular/cli`, `@angular/build`, `@schematics/angular`, `@angular-devkit/*`) | `logs/ng-version.log` |
| TypeScript | 6.0.x | 6.0.3 | `logs/ng-version.log`; `package-lock.json` |
| RxJS | Compatible generated baseline | 7.8.2 | `logs/ng-version.log` |
| Workspace orchestration | Nx-compatible; exact tool if used | None. Plain Angular CLI workspace (`angular.json`) and npm workspaces (`packages/*`). | `angular.json`, `package.json` `workspaces` |

## Compatibility notes

(i) **Angular engine range.** `@angular/core@22.1.8` and `@angular/build@22.1.8` declare `node: ^22.22.3 || ^24.15.0 || >=26.0.0`. Node 24.21.0 satisfies this, and it is the Node 24 LTS line named in PAEP-IB-01 §4.1. The container's preinstalled Node 22.22.2 is outside the range: the Angular CLI refused to run ("requires a minimum Node.js version of v22.22.3 or v24.15.0 or v26.0.0"). Node 24.21.0 was therefore installed from the official nodejs.org tarball, verified against the published SHASUMS256 (`node-v24.21.0-linux-x64.tar.xz: OK`).

(ii) **TypeScript range.** `@angular/compiler-cli@22.1.8` and `@angular/build@22.1.8` declare peer `typescript: >=6.0 <6.1`. The npm `latest` tag for `typescript` was 7.0.2 on 2026-09-23. TypeScript is therefore pinned exactly to 6.0.3, the newest 6.0.x release, to preserve the controlled 6.0.x family.

(iii) **Why 22.1.8 rather than 22.2.0.** The npm dist-tags on 2026-09-23 showed `@angular/core` `latest` = 22.2.0, while `@angular/cli` and `@angular/build` `latest` = 22.1.8 and `next` = 22.2.0-rc.0. PAEP-IB-01 §4.1 requires `@angular/core` and the Angular CLI to stay aligned, so every Angular package uses 22.1.8.

(iv) **Pinning.** All direct dependencies are exact versions in `package.json`, and `package-lock.json` (lockfileVersion 3) records the full resolved graph. Formal version-manifest review, and pinning of Node through `.nvmrc`/`engines`, are IB0-WP02 scope.

(v) **Strictness.** The generated `tsconfig.json` does not set `strict`/`strictTemplates` explicitly. Both default to enabled with this toolchain:
- TypeScript 6.0 defaults `strict` to true. A probe file compiled with `tsc` 6.0.3 reported TS7006 (implicit any) and TS2322 (null to string).
- Angular 22 compiler-cli treats `strictTemplates` as `options.strictTemplates !== false`.
- Explicit strict settings are IB0-WP03 scope. No compiler setting was weakened.

(vi) **npm 11 install-script policy.** npm 11.19.0 does not run install scripts that are not covered by `allowScripts`. It reports this as a warning for `@parcel/watcher`, `esbuild`, `lmdb` and `msgpackr-extract`, as seen in `logs/npm-ci.log`. Builds succeed without these scripts, because each package ships prebuilt platform binaries through optional dependencies. Adding an `allowScripts` policy is a toolchain-control decision left to IB0-WP02, and was not made silently here.

(vii) **Change detection.** Applications are generated zoneless (Angular 22 default, no `zone.js` dependency), which matches PAEP v1.1 §5.4 and App. G.
