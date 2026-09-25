# IB0-WP05 Real GitHub Actions Runs

**Repository:** `kougit/proseit-paep`. **Pull request:** #5 (`claude/project-thread-0o3cg2` into `main`).
**Workflow:** "PAEP CI" (`.github/workflows/paep-ci.yml`, workflow id 366370657).
**How this was read:** the GitHub API only, using check runs for each commit and the Actions run, job, log and artifact endpoints. Every check run below was posted by the **GitHub Actions** app (`app.id` **15368**). The required-check context is exactly **`PAEP / gate`**.

## Run inventory

| Run | Run id | Event | Head | Result | Purpose |
| --- | --- | --- | --- | --- | --- |
| 1 | 36047067712 | push | `cb91ac4` | failure, 0 jobs | First push. GitHub rejected the workflow file: an unquoted `: ` in two step names made it invalid YAML. An invalid file is reported as a failed run on the push event, whatever triggers it declares. Fixed in `e7c615a`. The PAEP YAML reader now rejects this pattern (negative P14). |
| 2 | 36047194635 | pull_request | `e7c615a` (merge `46eae1e`) | **success** | First green run. All 10 checks passed. |
| 3 | 36048105730 | pull_request | `c36dbad` | **failure (intended)** | Deliberate violation that proves failure propagation (AC23). See below. |
| 4 | 36050524880 | pull_request | `e3a7510` | **success** | Revert of run 3 plus the fixes for independent QA round 1. |
| 5 | **36052554946** | pull_request | **`089f864`** (merge `6ec585d` into `c5c0eb0`) | **success** | Final code head: QA round 2 fixes. |

Later commits on the branch change only `evidence/**` and `work-packages/IB0-WP05/**`. Their runs are listed in `acceptance-readiness.md`.

## Run 5 (final code head `089f864`): check inventory

| Check (context) | Check-run id | Started (UTC) | Completed (UTC) | Conclusion |
| --- | --- | --- | --- | --- |
| PAEP / governance | 107811434153 | 20:05:52 | 20:06:11 | success |
| PAEP / security-provenance | 107811434516 | 20:05:52 | 20:06:28 | success |
| PAEP / architecture | 107811434429 | 20:05:51 | 20:06:07 | success |
| PAEP / strictness | 107811434314 | 20:05:51 | 20:06:08 | success |
| PAEP / negative-architecture | 107811434390 | 20:05:51 | 20:08:30 | success |
| PAEP / negative-ci | 107811434449 | 20:05:52 | 20:17:17 | success |
| PAEP / regression | 107811434243 | 20:06:27 | 20:07:28 | success |
| PAEP / build-reference-app | 107811434627 | 20:05:52 | 20:06:20 | success |
| PAEP / build-ui-lab | 107811434559 | 20:05:52 | 20:06:17 | success |
| **PAEP / gate** | **107815788359** | 20:17:20 | 20:17:24 | **success** |

**Parallelism:**
- Eight mandatory jobs started within one second of each other (20:05:51–52). The regression job started at 20:06:27, as soon as a runner was free.
- No job waited on another's output.
- The gate started 3 s after the last mandatory job completed.
- Wall time was 11m35s, bounded by negative-ci (87 cases).

**Gate log (job 107815788359):** `governance: success`, `provenance: success`, `architecture: success`, `strictness: success`, `negative-architecture: success`, `negative-ci: success`, `regression: success`, `build-reference-app: success`, `build-ui-lab: success`, then `PAEP gate: PASS`.

**Security-provenance job log (107811434516):**
- **Token:** `GITHUB_TOKEN Permissions: Contents: read, Metadata: read`.
- **Pinned actions:** checkout fetched as `3d3c42e5…` and setup-node as `82076278…`, both by full SHA. Checkout ran with `persist-credentials: false`.
- **Toolchain:** setup-node reported `Resolved .nvmrc as 24.21.0`, with `node: v24.21.0` and `npm: 11.19.0`. The toolchain gate reported `PASS W01 … node 24.21.0; npm 11.19.0`.
- **Install:** `npm ci` reported `added 324 packages … found 0 vulnerabilities`, and the tracked tree was unchanged. The lockfile sha256 is `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69`.
- **Provenance checks:** `IB0-WP05 verification (provenance): PASS (8/8)`.
- **Signatures:** `npm audit signatures` reported `306 packages have verified registry signatures` and `102 packages have verified attestations`.
- **Evidence artifact:** `paep-provenance-attempt-1` (id 10831345796) was uploaded with `retention-days: 30` and `include-hidden-files: false`.
- **Cache:** hit on key `node-cache-Linux-x64-npm-30b03f32…` (the `package-lock.json` hash).

**Shell:** every workflow `run` step runs as `bash -e {0}` and sets `set -euo pipefail` itself. The composite setup steps run as `bash --noprofile --norc -e -o pipefail {0}`.

## Run 3: deliberate failure (AC23)

Commit `c36dbad` appended `import '@proseit/paep-foundation';` to `packages/contracts/src/index.ts`. That is an upward contracts → foundation edge, which IB-01 Appendix B forbids. The commit was reverted in `b6004dc`.

| Check | Check-run id | Conclusion |
| --- | --- | --- |
| PAEP / governance | 107796571516 | failure (a `packages/` change is outside WP05 scope; reason inferred, the log tail shows only the exit code) |
| PAEP / architecture | 107796571609 | failure |
| PAEP / strictness | 107796571549 | failure |
| PAEP / regression | 107796571532 | failure |
| PAEP / negative-architecture | 107796571651 | failure |
| PAEP / negative-ci | 107796571522 | failure (its controls fail on a violating tree) |
| PAEP / security-provenance | 107796571447 | success |
| PAEP / build-reference-app | 107796571436 | success |
| PAEP / build-ui-lab | 107796571458 | success |
| **PAEP / gate** | **107798838028** | **failure** |

All nine jobs started at 19:26:03. The gate ran 19:32:03–19:32:05 under `if: always()`, although six of the jobs it needs had failed.

**Architecture log:**
- `VIOLATION DIRECTION @proseit/paep-contracts (contracts) -> @proseit/paep-foundation (foundation) is not allowed (Appendix B: -)`
- `VIOLATION CONTRACTS_NEUTRAL … TS2882`
- `PAEP architecture check: FAIL … 2 violations`
- The command exited 1 through `tee` (pipefail).

**Gate log:**
- `governance: failure`, then `::error … mandatory job governance finished with result 'failure'`.
- The same pattern for architecture, strictness, negative-architecture, negative-ci and regression.
- `provenance: success`, `build-reference-app: success`, `build-ui-lab: success`.
- `PAEP gate: FAIL`, then `Process completed with exit code 1`.

**Artifacts** were uploaded although the jobs failed (`if: always()`), for example `paep-architecture-attempt-1` (10829222520) and `paep-negative-ci-attempt-1` (10828924427).

## Artifacts (run 2 listing; the same set per run)

| Artifact | Size (bytes) | Expires |
| --- | --- | --- |
| paep-governance-attempt-1 | 3655 | 2026-10-24 (30 days) |
| paep-provenance-attempt-1 | 15329 | 2026-10-24 |
| paep-architecture-attempt-1 | 1691 | 2026-10-24 |
| paep-strictness-attempt-1 | 6929 | 2026-10-24 |
| paep-negative-architecture-attempt-1 | 20919 | 2026-10-24 |
| paep-negative-ci-attempt-1 | 14618 | 2026-10-24 |
| paep-regression-attempt-1 | 21528 | 2026-10-24 |
| paep-build-reference-app-attempt-1 | 8447 | 2026-10-24 |
| paep-build-ui-lab-attempt-1 | 8362 | 2026-10-24 |

Each artifact holds only `$RUNNER_TEMP/paep-evidence/`: logs, JSON reports, the lockfile sha256, and build file manifests with licence notices. The largest is 21.5 kB. No `node_modules`, `.git`, environment dump or credential is included. The gate uploads nothing.

## Observations

- A harmless setup-node warning appears on the first run with a new lockfile hash: "another job may be creating this cache". The nine parallel jobs race to save the same key. Later runs hit the cache.
- `negative-ci` is the critical path, at about 11.5 minutes against a 20-minute timeout.
