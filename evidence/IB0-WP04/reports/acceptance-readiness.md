# IB0-WP04 Acceptance Readiness

**PR:** kougit/proseit-paep#4 (ready for review, not draft), `claude/ib0-wp04-011ntv` → `main`. **Base:** `main` = `ac6b786` (no drift; the base is an ancestor of the head). **Code commit under test:** `9c74dbe` (fresh-clone gates); later commits change documentation and evidence only. **Status:** READY FOR AUTHORIZATION. Not ACCEPTED; not merged.

| Gate | Result | Evidence |
| --- | --- | --- |
| Pre-flight (WP03 closed, PR #3 merged, WP01–03 evidence, 13/13 fingerprints, toolchain, no WP05/IB1) | PASS | `reports/definition-audit.md` §1 |
| Definition audit | PASS; conflict C1 reported | `reports/definition-audit.md` |
| Acceptance criteria | 29/29 PASS | `reports/technical-verification.md` |
| `npm ci`, lockfile, both production builds | PASS | `logs/` |
| `npm run arch:check` | PASS, 20 projects, 0 edges, 0 cycles, 0 violations | `logs/arch-check-cli.log` |
| `npm run qa:ib0-wp04` | PASS 24/24 | `reports/ib0-wp04-verification.json` |
| `npm run qa:ib0-wp04:negative` | PASS 50/50 (5 controls, 45 rejections) | `reports/negative-tests.json` |
| WP03 / WP02 / WP01 regression | PASS with bounded exceptions / PASS with bounded V17 / 15/15 | `logs/verify-ib0-wp0{3,2,1}-regression.log` |
| Controlled sources | 13/13 | `logs/controlled-source-integrity.log` |
| No Nx | PASS; disposition NOT REQUIRED FOR IB0-WP04 | V15 |
| Independent QA | PASS (rounds 2, 3, 5 and 6; rounds 1 and 4 findings closed) | `reports/independent-qa.md` |
| Branch cleanup (WP01–WP03 merged branches) | DEFERRED: `git push --delete` returned HTTP 403 | — |

## PO/SA decisions needed before ACCEPTED

(i) Approve the draft WP04 definition (29 criteria; drafting changes §9(i)–(v), all strengthening).
(ii) C1: IB-01 §6.1 versus Appendix B for eight same-layer Optional edges (default: Appendix B governs).
(iii) Same-category edges (domain → domain, app → app) not allowed without an ADR (default D2).
(iv) WP03 regression bounded exception (V05/V08/V10/V12/V17) and WP02 V17 including `tsconfig.base.json`.
(v) `tsconfig.base.json` as alias registry only (D4).
