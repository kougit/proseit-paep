# IB0-WP04 Independent QA — Summary

**Reviewer:** independent clean-context Claude QA reviewer (did not write the work). Rounds 1–3 and 8 used a fresh `git clone` and the other rounds full copies of the branch, on Node 24.21.0 / npm 11.19.0; each round wrote its own parsers and mutation harnesses, ran mutations only in scratch copies and never touched the author's tree.

| Round | Commit | Verdict | Report / logs |
| --- | --- | --- | --- |
| 1 | `1c16f80` | **FAIL** — 4 Medium (M1 nested `dist/` skipped; M2 `.d.ts` not scanned; M3 `/// <reference lib="dom">` in contracts; M4 unreported §6.1/Appendix B conflict), 8 Low, 7 Observations. All 17 mandatory checks reproduced. | `reports/independent-qa-round1.md`; `logs/independent-qa-round1/` |
| 2 | `7a8f4e9` | **PASS** — M1–M4 closed; 0 High, 0 Medium; 6 Low (R2-L1 bare-name `imports` target bypass; R2-L2 `#prefix/*` false positive; R2-L3 `export const x = vendor`; R2-L4 evidence wording; R2-L5 non-tsconfig alias files; R2-L6 computed dynamic imports and JSDoc types), 5 Observations. Gates: verifier 24/24, negatives 42/42, builds, lockfile, integrity 13/13, matrix 144/144 by its own parser, 82-case harness with no regression. | `reports/independent-qa-round2.md`; `logs/independent-qa-round2/` |
| 3 (delta) | `7fa2462` | **PASS** — R2-L1 and R2-L2 closed; 0 High, 0 Medium; 1 Low (R3-L1: conditional `imports` branches other than the checked one, and pattern order, could still hide a forbidden target); no regressions (82-case harness 73/82 as expected, the rest known residuals or test artefacts); 17 false-positive probes pass; verifier 24/24, negatives 44/44, builds, lockfile, integrity 13/13. | `reports/independent-qa-round3.md`; `logs/independent-qa-round3/` |
| 4 (re-review of R3-L1) | `5d92109` | **FAIL** — the R3-L1 fix matches Node's `imports` semantics, but F-1 (High): a nested `package.json` below a package root could remap `#` keys unseen; F-2 (Medium): an `imports` target naming another `#` subpath went unchecked (TypeScript follows it); 2 Low (absolute paths in messages, double counting). arch:check PASS; negatives 47/47. | `reports/independent-qa-round4.md`; `logs/independent-qa-round4/` |
| 5 (delta) | `dcda855` | **PASS for the delta** — F-1, F-2 and the Lows closed without false positives; negatives 49/49. Found R5-M1 (Medium, older): a symlinked directory inside a package was neither scanned nor flagged; R5-L1, R5-L2 Low. | `reports/independent-qa-round5.md`; `logs/independent-qa-round5/` |
| 6 (delta) | `9c74dbe` | **PASS** — R5-M1 and R5-L1 closed; symlink to file, dangling, in `src/node_modules`, in apps, hard links all handled; negatives 50/50 with clean restore. Low only: R6-L1 (library `package.json` as a directory exits 2 unnamed), R6-L2/R6-I1 (unimported symlinked or unclassified directory directly under `packages/`/`apps/` not flagged). | `reports/independent-qa-round6.md`; `logs/independent-qa-round6/` |
| 7 (delta) | `c745a74` | **PASS** — PO/SA Decisions 1–4 (qa:architecture, same-category allowlist, strictness proofs); 24 allowlist probes fail closed; strictness could not be disabled; negatives 68/68. 4 Low (L1 suppression scan misses `.tpl`/`jit`, L2 ignored files, L3 app allowlist entries, L4 wording). | `reports/independent-qa-round7.md`; `logs/independent-qa-round7/` |
| 8 (final, lanes A–D) | `b084402` | **PASS** — definition and traceability (docs then stale, since updated), graph (0 forbidden edges, deep imports, cycles, unknown owners, nested manifests, symlinks; own matrix closure = T1–T5), adversarial (82/82 plus 16 own probes), tsconfig/strictness. M1 Medium: a workspace package reachable under another name; L1–L3 Low. | `reports/independent-qa-round8.md`; `logs/independent-qa-round8/` |
| 9 (delta) | `05e593d` | **PASS for M1** — every alias probe rejected; negatives 84/84. F1 Medium: a `node_modules` link to a folder outside every project was treated as external; F2 Low: plain-path manifest references not flagged. | `reports/independent-qa-round9.md`; `logs/independent-qa-round9/` |
| 10 (delta) | `d2f142c` | **PASS** — F1, F2 closed without false positives on registry specs; links to docs/, config/, the repo root and chained links rejected; negatives 86/86. Low only: L1 real folders under `node_modules` or outside the repo (uncommittable; lockfile-bound), L2 leading-space or drive-letter manifest paths (would change the lockfile, V16), L3 empty path in one message. | `reports/independent-qa-round10.md`; `logs/independent-qa-round10/` |

## Disposition of open findings after round 2

| Finding | Disposition |
| --- | --- |
| R2-L1, R2-L2 | Fixed in `499ae29`: bare-name targets are checked like any import (N39); `#prefix/*` patterns resolve (control C4) |
| R2-L4 | Evidence README, audit row and closure wording corrected; this summary and `acceptance-readiness.md` added |
| R2-L3, R2-L5, R2-L6, R2-O1 | Recorded as residual risk in `work-packages/IB0-WP04/ACCEPTANCE_REPORT.md` |
| M4 / C1 | Reported; PO/SA decision card posted; default "Appendix B governs" |

| R3-L1 | Fixed in `be181cf`: every string target of a conditional or array `imports` entry is checked, and pattern keys follow Node's longest-prefix rule; negative cases N40–N42 reproduce the reviewer's M03, M04 and M10 and are rejected. Fresh-clone gates at `be181cf`: verifier 24/24, negatives 47/47 |
| F-1, F-2, round 4 Lows | Fixed in `dcda855`: nested `package.json` rejected (CLASSIFICATION, N43); `#` → `#` target rejected (OUTSIDE_PROJECT, N44); relative paths in messages; each `#` import counted once |
| R5-M1, R5-L1 | Fixed in `9c74dbe`: any symlink below a project root rejected (CLASSIFICATION, N45); a `package.json` directory no longer crashes `#` resolution. Fresh-clone gates at `9c74dbe`: verifier 24/24, negatives 50/50 |
| R5-L2, R6-L1, R6-L2, R6-I1 | Fail closed or informational; recorded as residual risk in `work-packages/IB0-WP04/ACCEPTANCE_REPORT.md` |
| R7-L3, R7-L4 | Fixed in `9c50108` (N52; V08 wording) |
| Final M1, L2, L3 | Fixed in `05e593d` (N53, N54; counters; effective `noCheck` in V05) |
| R9-F1, R9-F2 | Fixed in `d2f142c` (N55, N56). Fresh-clone gates at `d2f142c`: verifier 24/24, negatives 86/86 |
| R7-L1, R7-L2, R8-L1, R10-L1, R10-L2, R10-L3 | Not bypasses today (blocked by V16/V17 or uncommittable); recorded as residual risk with owners in `work-packages/IB0-WP04/ACCEPTANCE_REPORT.md` |
| R3-O1 | README index, technical-verification D1 wording and this summary corrected |

## Overall

**INDEPENDENT QA: PASS** (final review round 8 and delta rounds 9 and 10 on the final code). Every High and Medium finding across the ten rounds was closed with strengthened criteria and negative cases; no criterion was relaxed. Open findings are Low, non-blocking and recorded as residual risk.
