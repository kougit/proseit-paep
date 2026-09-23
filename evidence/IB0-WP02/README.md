# IB0-WP02 Evidence Folder

Evidence for IB0-WP02 (toolchain pinning and lockfile control).

**Commit under test:** `916cb9dde3b1502441c346c06e9aaba9ab097ea7`, run from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-23. **Baseline:** IB0-WP01 merge commit `b6b023f`. **Status:** technical PASS, not yet independently QA'd, not ACCEPTED.

## Reports

| Path | Evidence |
| --- | --- |
| `reports/ib0-wp02-verification.json` | Verifier output: 20/20 PASS, with commit, Node and npm versions |
| `reports/version-manifest.md` | Human-readable version manifest (source: `docs/architecture/toolchain-version-manifest.json`) |
| `reports/lockfile-diff.md` | Lockfile unchanged versus baseline; drift rejection |
| `reports/install-script-policy.md` | Install-script policy, rationale, and the erratum to IB0-WP01 evidence |
| `reports/licence-inventory.json`, `reports/licence-inventory.md` | Licence inventory generated from the lockfile by the verifier |

## Logs (positive gates)

| Path | Gate | Result |
| --- | --- | --- |
| `logs/clean-clone-reproduction.log` | Fresh clone and summary of every gate | All exit 0 |
| `logs/toolchain-versions.log` | Node, npm, `.nvmrc`, `devEngines`, effective npm policy | Matches pins |
| `logs/npm-ci.log`, `logs/npm-ci-analysis.log` | `npm ci --loglevel=info` | Exit 0; 0 install scripts run; 0 warnings |
| `logs/lockfile-unchanged.log` | Lockfile and `package.json` unchanged after `npm ci`, and lockfile identical to baseline | Exit 0 |
| `logs/lockfile-regenerate-check.log` | `npm install --package-lock-only` leaves the lockfile unchanged | Exit 0 |
| `logs/install-scripts-ls.log` | `npm install-scripts ls` | No unreviewed install scripts |
| `logs/build-reference-app.log`, `logs/build-ui-lab.log` | Production builds | Exit 0 |
| `logs/ng-version.log` | `ng version` | Angular/CLI 22.1.8, TypeScript 6.0.3 |
| `logs/dist-hashes.log`, `logs/build-output-vs-baseline.log` | Build output hashes, compared with the IB0-WP01 baseline build | All 12 files byte-identical |
| `logs/verify-ib0-wp02.log` | `npm run qa:ib0-wp02` | PASS 20/20 |
| `logs/verify-ib0-wp01-regression.log`, `logs/ib0-wp01-verification.regression.json`, `logs/verify-ib0-wp01-restore.log` | IB0-WP01 verifier regression; IB0-WP01 evidence restored and shown byte-identical to baseline | PASS 15/15; 0 diffs |
| `logs/controlled-source-integrity.log` | `.paep-control/**` and `.gitignore` against `PACK_MANIFEST.json`; git diff since `8259317` | 13/13 match; empty diff |
| `logs/npm-audit.log` | `npm audit` and `npm audit --omit=dev` | 0 vulnerabilities |
| `logs/licence-dist-check.log` | No `lightningcss`/`caniuse-lite` content in `dist/`; runtime closure; notice file; output identical with `lightningcss` removed | Exit 0 |
| `logs/scope-and-secret-scan.log` | Changed files, out-of-scope files, protected paths, dependency names, secret signatures, `.npmrc` | 0 violations; 0 findings |
| `logs/registry-review.log` | npm dist-tags and Node release index on 2026-09-23 | No version change indicated |
| `logs/npm10-vs-npm11-installed-tree.log` | Same lockfile installs a different tree under npm 10 (review-lane record) | 5 extra packages under npm 10 |

## Logs (negative checks, run in a scratch copy)

| Path | Mutation | Required result | Result |
| --- | --- | --- | --- |
| `logs/negative-node-version.log` | Node 22.22.2 with npm 10 and with npm 11; Node 24.21.0 with npm 10 | `npm ci` and `npm run` fail | All exit 1 (`EBADDEVENGINES`) |
| `logs/negative-lockfile-drift.log` | `rxjs` 7.8.2 → 7.8.1 in `package.json` only | `npm ci` fails | Exit 1 |
| `logs/negative-install-script.log` | `esbuild` removed from `allowScripts` | `npm ci` fails | Exit 1 (`ESTRICTALLOWSCRIPTS`) |
| `logs/negative-verifier-manifest.log` | Manifest `vite` version edited | Verifier fails | V11 FAIL, exit 1 |

## Erratum evidence

| Path | Evidence |
| --- | --- |
| `logs/erratum-baseline-install-scripts.log` | At baseline `b6b023f`, npm 11.19.0 ran all four warned install scripts. Corrects IB0-WP01 evidence; see `reports/install-script-policy.md`. |

## Notes

| Path | Evidence |
| --- | --- |
| `notes/implementation-summary.md` | Bounded implementation summary, decisions and known limitations |

Log paths under `/tmp/...` are scratch working directories of the run. No credentials, tokens or private environment values are stored here.
