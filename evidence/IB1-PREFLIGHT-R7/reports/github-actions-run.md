# IB1-PREFLIGHT-R7 GitHub Actions Run

| Item | Value |
| --- | --- |
| Pull request | kougit/proseit-paep#6, base `main`, ready for review (not draft), open, not merged |
| Head SHA under test | `2d7d7620651f55a84766fedfcda15070ff2070f5` (all code and local evidence) |
| Base SHA | `5fbbedde4ed97899e88cfd4bd4cad02e34101914` (= `origin/main`; no base drift) |
| Workflow run | PAEP CI run 36109852885 (run 9, attempt 1, event `pull_request`), 2026-09-25T07:52:04Z to 08:04:34Z |
| Result | 10/10 jobs success |
| Mergeability | `mergeable_state: clean`; no conflicts; 0 review threads, 0 comments |
| Changed files | 36, all inside the generation 2 `authorisedScope` (B11/W07 PASS in CI) |

| Job | Conclusion |
| --- | --- |
| PAEP / governance (W26 baseline governance included) | success |
| PAEP / security-provenance | success |
| PAEP / architecture | success |
| PAEP / strictness | success |
| PAEP / negative-architecture | success |
| PAEP / negative-ci (`qa:ib0-wp05:negative`, then `qa:baseline:negative`) | success |
| PAEP / regression | success |
| PAEP / build-reference-app | success |
| PAEP / build-ui-lab | success |
| **PAEP / gate** | **success** |

`origin/main` is available in CI: `PAEP / governance` passed W26, which fails (B05) when `refs/remotes/origin/main` is missing (QA lanes 3–5 reproduced that failure locally). This closes the Info item L3-5-3.

This file is committed after the run, so the PR head moves by this evidence-only commit; the run on the final head is reported in the thread's final report. Generation 2 remains CANDIDATE. Enforcement of `PAEP / gate` on `main` remains ADVISORY (IB0 accepted risk R1).
