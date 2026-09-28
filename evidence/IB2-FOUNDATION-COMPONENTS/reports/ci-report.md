# IB2-FOUNDATION-COMPONENTS — CI Report

Pull request: #10 (`claude/project-thread-1n3qf4` → `main`). Workflow: PAEP CI (`.github/workflows/paep-ci.yml`). Required status context: `PAEP / gate`, unchanged.

## 1. Runs

| Run | Head | Jobs | `PAEP / gate` | Note |
| --- | --- | --- | --- | --- |
| 36364175864 | `f2d4fba` | 13 of 14 mandatory jobs success; `PAEP / negative-ci` cancelled at its 20-minute timeout | failure | RR14 triggered; PO/SA decision requested (PR comment 5861650601) |
| 36384635620 | `b302418` (the negative-ci split) | 15 of 15 mandatory jobs success | success | First run with `PAEP / negative-ci-b`; durations in `performance-timing.md` |
| 36392688454 | `1b8882a` (split review fixes) | 15 of 15 mandatory jobs success | success | Wall clock 14:17; longest job `PAEP / negative-ci-b` 14:07 |

The exact-head run of the final commit (this evidence commit) is recorded in the PR readiness report, because a commit cannot contain its own CI result.

## 2. Mandatory jobs (15, all feeding `PAEP / gate`)

governance, provenance (`PAEP / security-provenance`), architecture, strictness, negative-architecture, negative-ci, regression, contracts, runtime-config, runtime-config-negative, components, accessibility, negative-ci-b, build-reference-app, build-ui-lab. IB2 added components, accessibility and (by the PO/SA CI-performance remediation of 2026-09-28) negative-ci-b. Every job has a 20-minute or shorter timeout, no `needs`, `if` or `continue-on-error`, and the gate fails unless each result is success (W11, W12).

## 3. Local verification

Code commit `1b8882a` on a fresh clone with a clean `npm ci`: `logs/verification-1b8882a/summary.txt`. All 23 commands exit 0, including the full WP05 negative suite (101/101) and each half on its own (part a 50/50, part b 51/51); the lockfile is unchanged and the tree is clean after install and after the run.
