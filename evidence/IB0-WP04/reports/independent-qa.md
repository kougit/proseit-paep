# IB0-WP04 Independent QA — Summary

**Reviewer:** independent clean-context Claude QA reviewer (did not write the work). Each round used a fresh `git clone` on Node 24.21.0 / npm 11.19.0, wrote its own parsers and mutation harnesses, ran mutations only in scratch copies and never touched the author's tree.

| Round | Commit | Verdict | Report / logs |
| --- | --- | --- | --- |
| 1 | `1c16f80` | **FAIL** — 4 Medium (M1 nested `dist/` skipped; M2 `.d.ts` not scanned; M3 `/// <reference lib="dom">` in contracts; M4 unreported §6.1/Appendix B conflict), 8 Low, 7 Observations. All 17 mandatory checks reproduced. | `reports/independent-qa-round1.md`; `logs/independent-qa-round1/` |
| 2 | `7a8f4e9` | **PASS** — M1–M4 closed; 0 High, 0 Medium; 6 Low (R2-L1 bare-name `imports` target bypass; R2-L2 `#prefix/*` false positive; R2-L3 `export const x = vendor`; R2-L4 evidence wording; R2-L5 non-tsconfig alias files; R2-L6 computed dynamic imports and JSDoc types), 5 Observations. Gates: verifier 24/24, negatives 42/42, builds, lockfile, integrity 13/13, matrix 144/144 by its own parser, 82-case harness with no regression. | `reports/independent-qa-round2.md`; `logs/independent-qa-round2/` |
| 3 (delta) | see below | See round 3 section | — |

## Disposition of open findings after round 2

| Finding | Disposition |
| --- | --- |
| R2-L1, R2-L2 | Fixed in `499ae29`: bare-name targets are checked like any import (N39); `#prefix/*` patterns resolve (control C4) |
| R2-L4 | Evidence README, audit row and closure wording corrected; this summary and `acceptance-readiness.md` added |
| R2-L3, R2-L5, R2-L6, R2-O1 | Recorded as residual risk in `work-packages/IB0-WP04/ACCEPTANCE_REPORT.md` |
| M4 / C1 | Reported; PO/SA decision card posted; default "Appendix B governs" |

## Round 3 (delta)
