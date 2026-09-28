# IB2-FOUNDATION-COMPONENTS — Performance and Timing

Status: RECORDED. GitHub Actions durations are from the job and step timestamps of each run. The exact-head run of the final commit is in `ci-report.md`.

## 1. RR14: `PAEP / negative-ci` before and after the split

The PO/SA authorised splitting the IB0-WP05 negative suite into two parallel mandatory jobs (2026-09-28T05:02Z) after the first IB2 run timed out. The timeout stays 20 minutes on both jobs.

| Run | Commit | `qa:ib0-wp05:negative` step | `PAEP / negative-ci` job | `PAEP / negative-ci-b` job | Result |
| --- | --- | --- | --- | --- | --- |
| Main before IB2, run 36265678233 | `d33ab91` | 14:34 (100 cases, one job) | 15:20 | (did not exist) | success |
| IB2 before the split, run 36364175864 | `f2d4fba` | over 19:54, cancelled (100 cases, one job) | 20:16, cancelled at the timeout | (did not exist) | `PAEP / gate` failure |
| IB2 after the split, run 36384635620 | `b302418` | part a 14:20 (51 cases, even indexes); part b 12:46 (50 cases), in parallel | 15:10 (part a 14:20 + `qa:baseline:negative` 0:28) | 13:08 | 16/16 jobs success; `PAEP / gate` success |
| IB2 after the split review fixes, run 36392688454 | `1b8882a` | part a 12:38 (50 cases, odd indexes); part b 13:45 (51 cases), in parallel | 13:27 (part a 12:38 + `qa:baseline:negative` 0:30) | 14:07 | 16/16 jobs success; `PAEP / gate` success |

Run wall clock: 15:20 on `b302418` and 14:17 on `1b8882a` (07:37:48Z to 07:52:05Z), against a timeout at 20:16 before the split. The independent split review (S-4) moved the measured-heavier half away from `PAEP / negative-ci`, which also runs `qa:baseline:negative`; the longest job is now `PAEP / negative-ci-b` at 14:07, about 6 minutes inside its timeout. The next longest is `PAEP / components` at 8:47. The RR14 flag level is 17 minutes; no half reached it in either run.

Why the suite grew: about 39 provenance cases run the WP02 verifier, which production-builds ui-lab, and IB2 turned ui-lab from a placeholder into the full UI laboratory. The split halves that cost without removing any case.

## 2. Local runs of the split (this container, other work running at the same time; indicative only)

| Command | Cases | Duration |
| --- | --- | --- |
| `qa:ib0-wp05:negative -- --part a` | 50 of 101 declared (4 controls, 46 negatives) | 10:06 |
| `qa:ib0-wp05:negative -- --part b` | 51 of 101 declared (6 controls, 45 negatives) | 11:38 |
| `qa:ib2:ci-negative` | 27 (P00, I01–I26) | 5:14 |

The two parts ran disjoint case ids whose union is all 101 declared cases (checked by comparing both PASS lists). The harness now enforces this itself: every run must declare exactly the 101 pinned case ids and run exactly its half of them.

## 3. Local full verification

`logs/verification-1b8882a/summary.txt`: fresh clone of `1b8882a`, clean `npm ci`, Node 24.21.0, npm 11.19.0. Each line gives the command, its exit code and its duration in seconds. The earlier `logs/verification-6dc71cc/` and `logs/verification-b302418/` are kept as history.
