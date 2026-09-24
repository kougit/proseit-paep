# IB0-WP02 npm Install-Script Policy

Commit under test: `0078bb2b2aaf0c603b932c124ad437a3409d418d` (Node 24.21.0, npm 11.19.0); first verified at `916cb9d`, and `package.json`, `.npmrc` and the lockfile are unchanged since. Status: implemented under IB0-WP02-AC14; submitted with IB0-WP02 for acceptance.

## How npm 11.19.0 decides

(i) The policy lives in the root `package.json` field `allowScripts`, as `"<package>": true | false`. Workspace-level entries are ignored.

(ii) An explicit `false` skips the package's install scripts; `true` runs them.

(iii) A package with no entry is "unreviewed". In npm 11.19.0 its scripts **still run**, with a warning. The field is advisory unless `strict-allow-scripts` is on.

(iv) With `strict-allow-scripts=true` (set in `.npmrc`), any unreviewed install script makes `npm ci` / `npm install` fail with `ESTRICTALLOWSCRIPTS` before any script runs.

## Policy

Deny all five lockfile packages that declare install scripts, and turn on strict mode.

| Package | Version | Script | What it does | Why denying is safe |
| --- | --- | --- | --- | --- |
| esbuild | 0.28.2 | `postinstall: node install.js` | Checks the platform binary package is present; if not, installs or downloads it from the registry; then swaps its JS launcher for the native binary | `@esbuild/<platform>` is installed from the lockfile; Angular uses the esbuild JS API, not the launcher |
| @parcel/watcher | 2.6.0 | `install: node scripts/build-from-source.js` | Compiles from source only when `npm_config_build_from_source=true`; otherwise does nothing | The prebuilt `@parcel/watcher-<platform>` package loads |
| lmdb | 3.5.6 | `install: node-gyp-build-optional-packages` | Tests the prebuilt binary and compiles with node-gyp if it fails | The prebuilt `@lmdb/lmdb-<platform>` package loads |
| msgpackr-extract | 3.0.4 | `install: node-gyp-build-optional-packages` | Same pattern as lmdb | The prebuilt package loads; msgpackr also has a pure-JS fallback |
| fsevents | 2.3.3 | `install: node-gyp rebuild` | macOS only; compiles the native module | The tarball ships a prebuilt binary. Listed so macOS installs do not fail under strict mode |

Entries are name-only, not version-pinned (the form `npm install-scripts deny` writes). A denial therefore survives a version bump: an upgraded package cannot silently start running its install script.

What denial gives up: automatic compilation or download on a platform with no prebuilt binary. For a governed, reproducible toolchain that is intended: such a platform now fails loudly instead of running code that is not in the lockfile.

## Evidence

| Check | Result | Log |
| --- | --- | --- |
| Fresh-clone `npm ci --loglevel=info` | Exit 0; 0 install scripts executed; 0 allowScripts warnings | `logs/npm-ci.log`, `logs/npm-ci-analysis.log` |
| `npm install-scripts ls` | "No packages with unreviewed install scripts." | `logs/install-scripts-ls.log` |
| Both production builds under the policy | Exit 0; output byte-identical to the IB0-WP01 baseline build | `logs/build-*.log`, `logs/dist-hashes.log` |
| Negative: `esbuild` entry removed | `npm ci` exit 1, `ESTRICTALLOWSCRIPTS` naming `esbuild@0.28.2` | `logs/negative-install-script.log` |
| Verifier V14 | PASS: every lockfile package with `hasInstallScript` is explicitly denied | `reports/ib0-wp02-verification.json` |

## Erratum to accepted IB0-WP01 evidence

IB0-WP01 evidence states that npm 11.19.0 did **not** run the four install scripts it warned about:

- `evidence/IB0-WP01/reports/toolchain-baseline.md`, compatibility note (vi);
- `evidence/IB0-WP01/reports/dependency-baseline.md`, row "lmdb, msgpackr-extract, @parcel/watcher";
- `evidence/IB0-WP01/reports/independent-qa.md`, install-script observation.

That is incorrect. At the IB0-WP01 baseline (`b6b023f`), with no `allowScripts` policy, `npm ci --loglevel=info` shows all four scripts running and exiting 0 (`logs/erratum-baseline-install-scripts.log`). The warning means "not yet reviewed", not "blocked".

Impact: none on the IB0-WP01 result. The IB0-WP01 builds ran with the scripts executed, and the IB0-WP02 builds with the scripts denied produce byte-identical output (`logs/dist-hashes.log`, compared with the baseline build hashes). Only the stated rationale was wrong. The IB0-WP01 files are accepted records and are left unedited; this erratum is the correction of record.

## Maintenance rules

(i) A new dependency with an install script fails `npm ci` until someone reviews it and adds an explicit `true` or `false` entry.

(ii) Do not run `npm install-scripts prune` on Linux or Windows: it removes the macOS-only `fsevents` entry and breaks macOS installs under strict mode.

(iii) Do not bypass the policy with `--dangerously-allow-all-scripts` or `--ignore-scripts` to get a passing gate.
