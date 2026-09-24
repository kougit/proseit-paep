# IB0-WP02 Evidence Folder

Evidence for IB0-WP02 (toolchain pinning and lockfile control).

**Commit under test:** `0078bb2b2aaf0c603b932c124ad437a3409d418d` (closure commit carrying the PO/SA approvals and the authorised `CLAUDE.md` amendment), run from a fresh `git clone` of GitHub on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24. The implementation was first verified at `916cb9d` on 2026-09-23; no toolchain, dependency, verifier or application file changed after it. **Baseline:** IB0-WP01 merge commit `b6b023f`. **Status:** technical PASS; see `work-packages/IB0-WP02/ACCEPTANCE_REPORT.md` for QA and acceptance.

## Reports

| Path | Evidence |
| --- | --- |
| `reports/ib0-wp02-verification.json` | Verifier output: 20/20 PASS, with commit, Node and npm versions |
| `reports/version-manifest.md` | Human-readable version manifest (source: `docs/architecture/toolchain-version-manifest.json`) |
| `reports/lockfile-diff.md` | Lockfile unchanged versus baseline; drift rejection |
| `reports/install-script-policy.md` | Install-script policy, rationale, and the erratum to IB0-WP01 evidence |
| `reports/licence-inventory.json`, `reports/licence-inventory.md` | Licence inventory generated from the lockfile by the verifier |
| `reports/definition-audit.md` | Definition audit (closure lane A): all 24 criteria traced to controlled sources, no WP03/WP04 or later scope. PASS |

## Logs (positive gates)

| Path | Gate | Result |
| --- | --- | --- |
| `logs/clean-clone-reproduction.log` | Fresh clone and summary of every gate | All exit 0 |
| `logs/toolchain-versions.log` | Node, npm, `.nvmrc`, `devEngines`, effective npm policy | Matches pins |
| `logs/npm-ci.log`, `logs/npm-ci-analysis.log` | `npm ci --loglevel=info` | Exit 0; 0 install scripts run; 0 warnings |
| `logs/lockfile-unchanged.log` | Lockfile and `package.json` unchanged after `npm ci`, and lockfile identical to baseline | Exit 0 |
| `logs/lockfile-regenerate-check.log` | `npm install --package-lock-only` leaves the lockfile unchanged (recorded at `916cb9d`; `package.json` and the lockfile are unchanged since) | Exit 0 |
| `logs/install-scripts-ls.log` | `npm install-scripts ls` | No unreviewed install scripts |
| `logs/build-reference-app.log`, `logs/build-ui-lab.log` | Production builds | Exit 0 |
| `logs/ng-version.log` | `ng version` | Angular/CLI 22.1.8, TypeScript 6.0.3 |
| `logs/dist-hashes.log`, `logs/build-output-vs-baseline.log` | Build output hashes, compared with the IB0-WP01 baseline build (re-checked at `0078bb2`) | All 12 files byte-identical |
| `logs/verify-ib0-wp02.log` | `npm run qa:ib0-wp02` | PASS 20/20 |
| `logs/verify-ib0-wp01-regression.log`, `logs/ib0-wp01-verification.regression.json`, `logs/verify-ib0-wp01-restore.log` | IB0-WP01 verifier regression; IB0-WP01 evidence restored and shown byte-identical to baseline | PASS 15/15; 0 diffs |
| `logs/controlled-source-integrity.log` | `.paep-control/**` and `.gitignore` against `PACK_MANIFEST.json`; git diff since `8259317` | 13/13 match; empty diff |
| `logs/npm-audit.log` | `npm audit` and `npm audit --omit=dev` | 0 vulnerabilities |
| `logs/licence-dist-check.log` | No `lightningcss`/`caniuse-lite` content in `dist/` (with a positive control proving the search pattern matches); runtime closure; notice file; output identical with `lightningcss` removed | Exit 0 |
| `logs/scope-and-secret-scan.log` | Changed files, out-of-scope files, protected paths, dependency names, secret signatures, `.npmrc` | 0 violations; 0 findings |
| `logs/registry-review.log` | npm dist-tags and Node release index on 2026-09-23 (run once, at `916cb9d`) | No version change indicated |
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

## Closure audit (2026-09-24, read-only lanes on `39bf00e`)

| Path | Lane | Result |
| --- | --- | --- |
| `reports/definition-audit.md` | A: requirements and definition | PASS |
| `logs/closure-audit/lane-b-licence-provenance.md` | B: licence and provenance | No blocker; one evidence defect (dist-check command label) fixed, four wording items applied |
| `logs/closure-audit/lane-c-reproducibility.md` | C: toolchain and reproducibility | PASS |
| `logs/closure-audit/lane-d-control-github.md` | D: controlled source and GitHub | Controls intact; PR identity and scope PASS |

## Notes

| Path | Evidence |
| --- | --- |
| `notes/implementation-summary.md` | Bounded implementation summary, decisions and known limitations |
| `notes/closure-authorisation.md` | PO/SA decisions of 2026-09-24: definition approval, `CLAUDE.md` amendment, licence dispositions |

Log paths under `/tmp/...` are scratch working directories of the run. No credentials, tokens or private environment values are stored here.
