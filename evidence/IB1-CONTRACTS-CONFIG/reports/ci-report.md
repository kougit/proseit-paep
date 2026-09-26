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

`PAEP / negative-ci` took 14:16 against its accepted 20-minute timeout (7:22 on `main` at `035593b`); see residual risk RR14.
