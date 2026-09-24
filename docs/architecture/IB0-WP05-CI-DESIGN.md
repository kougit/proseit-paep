# IB0-WP05 CI Design and Workflow Security Review

**Scope:** `.github/workflows/paep-ci.yml`, `.github/actions/paep-setup/action.yml`, `tooling/verification/verify-ib0-wp05.mjs`, `negative-ib0-wp05.mjs`, `ib0-wp05-ci-policy.json`, `yaml-subset.mjs`.  
**Controlled basis:** IR-01 §4.4 IB0-WP5, §4.5, §4.6; IB-01 §4.1, §18.1; EQP §15, §16, §22, §24, App. B.

## 1. Topology

```
                pull_request → main | push → main | workflow_dispatch
                                   │
   ┌──────────┬──────────┬─────────┼──────────┬──────────┬──────────┬──────────┬──────────┐
   ▼          ▼          ▼         ▼          ▼          ▼          ▼          ▼          ▼
governance  security-  architec-  strict-   negative-  negative-  regression build-     build-
            provenance ture       ness      architec-  ci                    reference- ui-lab
                                            ture                             app
   └──────────┴──────────┴─────────┴──────────┴────┬─────┴──────────┴──────────┴──────────┘
                                                   ▼
                                  PAEP / gate  (needs all nine, if: always())
```

All nine mandatory jobs start together (no `needs`). None depends on another's output, so nothing is serialised. Each job does its own checkout and clean `npm ci`, which is what makes each result an independent clean-checkout proof (IR-01 §4.5 "Reproducibility").

| Job (check name) | Commands | Controls covered |
| --- | --- | --- |
| PAEP / governance | `verify-ib0-wp05 --gate governance` | W01 toolchain, W02 controlled-file fingerprints and CLAUDE.md, W03 topology and nested manifests, W04 no Nx, W05 no IB1, W06 no dependency change, W07 scope, W08 secrets |
| PAEP / security-provenance | `verify-ib0-wp05 --gate provenance`; `npm audit signatures` | W09 triggers/concurrency, W10 permissions, W11 job topology, W12 gate structure, W13 expressions/secrets/credentials, W14 action pinning and register, W15 install/cache policy, W16 WP02 supply-chain controls (V04/V05/V06/V12/V14/V15); registry signatures and attestations |
| PAEP / architecture | `npm run qa:architecture` | WP04 boundary checker |
| PAEP / strictness | `npm run qa:types`; `verify-ib0-wp05 --gate strictness` | ngc strict type and template check of both apps; W17 WP04 static V04–V07 and all static checks |
| PAEP / negative-architecture | `verify-ib0-wp05 --gate negative-architecture` | W18 WP04 negative suite (86 cases); W19 WP03 negative runner (bounded) |
| PAEP / negative-ci | `npm run qa:ib0-wp05:negative` | CI-control negative suite |
| PAEP / regression | `verify-ib0-wp05 --gate regression` | W20–W23 WP04 full → WP03 → WP02 → WP01 with bounds |
| PAEP / build-reference-app | `npm run build:reference-app`; build metadata | production build; W25 file manifest and licence notices |
| PAEP / build-ui-lab | `npm run build:ui-lab`; build metadata | same for ui-lab |
| PAEP / gate | inline bash + `jq` over `toJSON(needs)` | aggregate |

Every job: `runs-on: ubuntu-24.04` (a fixed image line, not `ubuntu-latest`), `timeout-minutes` ≤ 30, and an evidence upload with `if: always()`.

## 2. Aggregate gate semantics

The gate receives `needs` as JSON through `env` (never interpolated into the script). It fails when:

- the set of `needs` keys differs from `MANDATORY_JOBS` (a job was dropped or added without updating both lists);
- any mandatory job's result is not exactly `success` (`failure`, `cancelled`, `skipped`, timeout — GitHub reports a timeout as `failure` — or any unknown value);
- the JSON cannot be parsed (`set -e` with `jq`).

`if: always()` makes the gate run, and so report a result, even when an upstream job failed or the run was cancelled; a cancelled run therefore ends with a failing gate rather than a missing one. The verifier (W12) also checks that `needs`, `MANDATORY_JOBS` and the policy list agree. The negative suite runs the script text read from the workflow with 20 synthetic `needs` contexts (G00–G18, C06 aside).

## 3. Toolchain, installation and cache

1. `actions/setup-node` reads `.nvmrc` (`24.21.0`, exact). `check-latest: false`. No `node-version` input.
2. Toolchain gate (W01), before any install: running Node and npm must equal `.nvmrc`, `packageManager`, `devEngines` and `docs/architecture/toolchain-version-manifest.json`; `.npmrc` must keep `engine-strict=true` and `strict-allow-scripts=true`. This reuses the WP02 pins rather than defining a second policy.
3. `npm ci`. npm itself rejects devEngines drift (`EBADDEVENGINES`) and a lockfile out of sync with `package.json`. Install scripts follow the WP02 policy (all five denied).
4. `git diff --exit-code -- package.json package-lock.json` and an empty `git status --porcelain`: installation must not change any tracked file.

Cache: `setup-node` `cache: npm` stores `~/.npm` (downloaded tarballs) keyed on the runner OS/arch and the hash of `package-lock.json`. `node_modules` is never cached, so each job proves a clean install. Cache poisoning: a pull-request run can only write caches scoped to its own ref, and `npm ci` checks every tarball against the lockfile's sha512, so a poisoned tarball fails the install rather than entering the build. Node version does not affect tarball content, so it is not part of the key.

## 4. Security review

| Topic | Design | Check |
| --- | --- | --- |
| Trigger for untrusted code | `pull_request` only. `pull_request_target`, `workflow_run`, comment and review triggers are forbidden by policy. Fork PRs therefore run with a read-only token and no secrets. | W09; P06 |
| Token permissions | Top-level `contents: read`; no job overrides; gate `permissions: {}`. No job writes to the repository, PRs, checks or packages. | W10; P04, P05 |
| Secrets | None used. No `secrets.*`, no credential-like inputs, no `registry-url`/token on setup-node. | W13; P08 |
| Credential persistence | `persist-credentials: false` on every checkout, so later steps (including `npm ci` lifecycle code, were any enabled) cannot read the token from `.git/config`. | W11, W13; P09 |
| Script injection | No `${{ }}` inside any `run:`. The only expressions are six allowlisted forms (concurrency group/cancel, `always()`, artifact name with `run_attempt`, artifact path from `runner.temp`, `toJSON(needs)`); none carries PR title, body, branch name or other attacker-controlled text into a shell. The concurrency group uses the PR number (an integer) or `github.ref`. | W13; P07 |
| Action supply chain | Three GitHub first-party actions, each pinned to a verified full commit SHA with the release tag as a comment; no third-party action; one local composite action. | W14; P01–P03 |
| Dependency installation | `npm ci` only; no `npm install`, `--ignore-scripts=false`, `--force` or `--legacy-peer-deps` in any step. | W15; I04 |
| Artifacts | Only `$RUNNER_TEMP/paep-evidence/` (logs, JSON reports, build file manifests, licence notices). No `node_modules`, `.git`, environment dumps or tokens. 30-day retention. The gate uploads nothing and downloads nothing. | W11 |
| Shell safety | Every `run:` starts `set -euo pipefail`; output goes through `tee` with `pipefail`, so a failing command fails its step. | W11 |
| Workflow edits in a PR | A pull request runs its own version of the workflow, so a PR could weaken CI in the same change. Mitigations: W09–W15 fail on any policy drift unless the policy file changes too; changes to `.github/**` or the policy are visible in review; the required-check design (enforcement document) plus review is the residual control. | residual risk R2 |

## 5. Historical verifiers

The WP01–WP04 verifiers compare the tree with their own baselines and intentionally flag later work. They are not edited. `verify-ib0-wp05.mjs` runs them, restores the tracked evidence they rewrite (refusing to run if those records already have local changes), deletes their report files before each run so a stale committed report can never be read as a result, and accepts only the bounded findings in WORK_PACKAGE §6. The checkout uses `fetch-depth: 0` because the verifiers diff against `b6b023f`, `de13629`, `ac6b786` and `c5c0eb0`.

## 6. Performance

Nine parallel jobs; the slowest are negative-architecture (WP04 suite, ~90 s locally), negative-ci (~5 min locally) and regression (~40 s). npm downloads come from the cache after the first run. Superseded PR runs are cancelled. Builds run once per build job; the regression job's builds are part of the accepted WP04 verifier and are not removed.

## 7. What CI does not do

Lint, unit tests (no tooling yet; PO/SA decision), SBOM, vulnerability-scan gating and release licence approval (release gate), macOS/Windows runners. `npm audit signatures` verifies registry signatures and provenance attestations; it does not replace the release security gate.
