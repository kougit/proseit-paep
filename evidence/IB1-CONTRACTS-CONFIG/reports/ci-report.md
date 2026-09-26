# IB1-CONTRACTS-CONFIG — CI Report

Pull request: [#8](https://github.com/kougit/proseit-paep/pull/8) `claude/ib1-contracts-runtime-config-bwp40s` → `main`, ready (not draft), opened 2026-09-26T15:32Z. Not merged.

| Item | Value |
| --- | --- |
| Head SHA | `4c4c351b96984caa87434576fe9eb488ddd68968` (code verified at `7ae5bca`; `4c4c351` adds only evidence) |
| Base | `main` at `035593b64ae15860d953a84325dceacb0d642014`; merge base is the same commit (no base drift) |
| Workflow run | [36252266440](https://github.com/kougit/proseit-paep/actions/runs/36252266440), event `pull_request`, attempt 1 |
| `PAEP / gate` | **success** (check run 108434697204, 15:46:24Z–15:46:27Z) |
| Mergeability | open, no conflicts; merge state `unstable` only while checks were running |
| Review conversations | none (0 review threads, 0 comments) |
| Changed areas | `.github/workflows`, `apps/reference-app`, `config`, `docs/architecture`, `evidence/IB1-CONTRACTS-CONFIG`, `package.json`, `packages/contracts`, `packages/platform`, `tooling/{config-validation,governance,test-utils,verification}`, `work-packages/IB1-CONTRACTS-CONFIG`; no unexpected files, `package-lock.json` and `CLAUDE.md` unchanged |

## Jobs (13 check runs, all success)

| Check | Result | Duration |
| --- | --- | --- |
| PAEP / governance | success | 0:21 |
| PAEP / strictness | success | 0:20 |
| PAEP / architecture | success | 0:21 |
| PAEP / contracts (new) | success | 0:37 |
| PAEP / runtime-config (new) | success | 0:19 |
| PAEP / runtime-config-negative (new) | success | 1:01 |
| PAEP / build-reference-app | success | 0:24 |
| PAEP / build-ui-lab | success | 0:18 |
| PAEP / regression | success | 1:06 |
| PAEP / negative-architecture | success | 3:03 |
| PAEP / security-provenance | success | 0:37 |
| PAEP / negative-ci | success | 14:16 (timeout 20) |
| PAEP / gate | success | 0:03 |

The three new jobs ran in parallel with the existing ones and are listed in the gate's `needs` and `MANDATORY_JOBS`; the `PAEP / gate` check context and gate logic are unchanged. A later commit that only adds this report and status records re-runs the same workflow on the new head.

## `PAEP / negative-ci` timing (corrected 2026-09-26)

An earlier version of this report compared the IB1 duration with the single run on `main` at `035593b` ("7:22"). That run was a fast outlier, not the typical pre-IB1 duration. Job durations (started to completed, from the GitHub job records), timeout 20 minutes at every commit:

| Run | Commit | Duration | Timeout used |
| --- | --- | --- | --- |
| 36253169477 (IB1, PR #8) | `19eac59` | 15:10 | 75.8% |
| 36252266440 (IB1, PR #8) | `4c4c351` | 14:16 | 71.3% |
| 36245405570 (main, fast outlier) | `035593b` | 7:27 | 37.3% |
| 36244697256 | `0a02631` | 12:08 | 60.7% |
| 36244249784 (main) | `e795868` | 12:13 | 61.1% |
| 36243532183 | `5a63e76` | 12:27 | 62.3% |
| 36111039774 | `c36e043` | 12:12 | 61.0% |
| 36109852885 | `2d7d762` | 12:21 | 61.8% |

Typical pre-IB1 duration: about 12:08–12:27. IB1 adds about two to three minutes (14:16 and 15:10, about 71–76% of the 20-minute timeout). The timeout is unchanged. See residual risk RR14.
