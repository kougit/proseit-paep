# Lane C: toolchain and reproducibility for IB0-WP02

- Repo: https://github.com/kougit/proseit-paep, branch `claude/ib0-wp02-c625bb`
- HEAD verified: `39bf00e4b87a0a7d949c9189d3db50df732d7fc2` (fresh clone, detached at origin branch, clean tree). Base `b6b023f` is an ancestor. There are 4 commits since the base: 8525598, 591b266, 916cb9d, 39bf00e.
- Toolchain: Node v24.21.0, npm 11.19.0 (`/opt/node24`). Negative tests also used Node v22.22.2 and npm 10.9.7 (`/opt/node22`).
- Every log is under `close/C/logs/`. The helper `close/C/check-exact.cjs` is my own direct-dependency exactness check.
- `/home/claude/proseit-paep` was not modified, and nothing was pushed.

## Results

| # | Check | Command | Exit | Result |
|---|---|---|---|---|
| 1 | Clone and checkout; HEAD = 39bf00e; clean tree | `git clone …; git checkout --detach origin/claude/ib0-wp02-c625bb; git rev-parse HEAD; git status --porcelain` | 0 | PASS (0 dirty entries) |
| 2a | Toolchain config recorded | `node -v`, `npm -v`, `cat .nvmrc .npmrc`, read package.json fields | 0 | PASS. `.nvmrc` = 24.21.0. devEngines.runtime = node 24.21.0, onFail=error. devEngines.packageManager = npm 11.19.0, onFail=error. packageManager = npm@11.19.0. `.npmrc` has `engine-strict=true` and `strict-allow-scripts=true`. allowScripts = {@parcel/watcher, esbuild, fsevents, lmdb, msgpackr-extract}, all `false`. |
| 2b | Clean install | `node npm-cli.js ci --loglevel=info` | 0 | PASS. 0 `npm info run` lines (no install scripts ran), 0 allowScripts warnings, 0 vulnerabilities. |
| 2c | Lockfile unchanged by install | `sha256sum package-lock.json` before and after | - | PASS. Hash is `be1154cb…8d46b69` before and after. |
| 2d | Lockfile identical to baseline | `git diff --exit-code b6b023f -- package-lock.json` | 0 | PASS |
| 3a | Angular and TS versions | `npx ng version` | 0 | PASS. CLI 22.1.8 and Angular 22.1.8; all 9 @angular/* at 22.1.8; rxjs 7.8.2; typescript 6.0.3. |
| 3b | Direct dependencies exact and equal to installed | `node check-exact.cjs clone` | 0 | PASS. 12/12 root direct dependencies are exact and equal the installed version. The 18 workspace packages declare no dependencies. core==cli==22.1.8; TS==6.0.3. |
| 4a | Build reference-app | `npm run build:reference-app` | 0 | PASS (main-4FFRGG7I.js, 190.65 kB) |
| 4b | Build ui-lab | `npm run build:ui-lab` | 0 | PASS (main-RPR4FBCF.js, 190.65 kB) |
| 4c | dist sha256 | `find dist -type f \| xargs sha256sum` | 0 | PASS. All 12 file hashes are byte-identical to the committed `evidence/IB0-WP02/logs/dist-hashes.log`, so the build reproduces. |
| 5a | WP02 gate | `npm run qa:ib0-wp02` | 0 | PASS (20/20) |
| 5b | WP01 regression | `node tooling/verification/verify-ib0-wp01.mjs` | 0 | PASS (15/15) |
| 5c | WP01 records unchanged | `git checkout -- evidence/; git diff --exit-code b6b023f -- work-packages/IB0-WP01 evidence/IB0-WP01` | 0 | PASS |
| 6a | NEG: wrong Node (22.22.2 with npm 10.9.7) | `PATH=/opt/node22/bin:… node22 npm10-cli ci` | 1 | PASS. Fails with EBADDEVENGINES: devEngines.runtime "24.21.0" does not match "v22.22.2". |
| 6b | NEG: wrong npm (Node 24.21.0 running npm 10.9.7) | `PATH=/opt/node24/bin:… node24 npm10-cli ci` | 1 | PASS. Fails with EBADDEVENGINES: devEngines.packageManager "11.19.0" does not match "10.9.7". |
| 6c | NEG: lockfile drift (rxjs 7.8.1 in package.json only) | `node24 npm11-cli ci` | 1 | PASS. Fails with EUSAGE: lock file's rxjs@7.8.2 does not satisfy rxjs@7.8.1. |
| 6d | NEG: unreviewed install script (allowScripts.esbuild deleted) | `node24 npm11-cli ci` | 1 | PASS. Fails with ESTRICTALLOWSCRIPTS: esbuild@0.28.2 (postinstall: node install.js) is not covered. |
| 6e | NEG: manifest drift (vite 8.1.5 changed to 8.1.4 in toolchain-version-manifest.json, after `npm ci`) | `node tooling/verification/verify-ib0-wp02.mjs` | 1 | PASS. Only V11 fails ("manifest 8.1.4 != lockfile 8.1.5 / != installed 8.1.5"), giving 19/20. The unmutated copy passed 20/20 first. |
| 7a | No Nx | grep lockfile keys and package.json for nx, @nx, @nrwl; check for nx.json and node_modules/nx | 1 (no match) | PASS. 0 matches; no nx.json; no node_modules/nx or @nx. |
| 7b | Runtime closure | `npm ls --omit=dev --all` | 0 | PASS. The third-party runtime closure is exactly @angular/{common,compiler,core,forms,platform-browser,router}@22.1.8, rxjs@7.8.2, tslib@2.8.1, zod@4.4.3 and @standard-schema/spec@1.1.0. zod and @standard-schema/spec come in through @angular/forms. The only other entries are the 18 private `@proseit/*@0.0.0` workspace symlinks, which have no dependencies. The optional peers zone.js and @angular/animations are reported as UNMET OPTIONAL and are not installed. |

## Observations (none of these block)

1. `npm run qa:ib0-wp02` rewrites the tracked evidence files `evidence/IB0-WP02/reports/ib0-wp02-verification.json` and `licence-inventory.json`, changing timestamps, the commit and scan counts. Running the gate therefore dirties the tree. The file is written before its own tree check, so its `trackedChangesAtRun` field lists `licence-inventory.json`. I restored the files with `git checkout -- evidence/`. The diff is saved in `logs/09b-evidence-diff-after-qa-wp02.log`.
2. The committed `ib0-wp02-verification.json` records commit `916cb9d`, not HEAD `39bf00e`, and V18 reports "24 files scanned". At HEAD the run records 39bf00e with "58 files scanned; findings: none". The evidence commit 39bf00e came after that verification run, so the difference is expected, but the committed report does not describe the final HEAD.
3. `verify-ib0-wp01.mjs` likewise rewrites `evidence/IB0-WP01/reports/ib0-wp01-verification.json`. After a restore, the IB0-WP01 records match b6b023f.
4. The negative-test copies are kept at `close/C/neg-{a..e}` for audit.

## Overall: REPRODUCIBILITY PASS
