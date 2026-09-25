# IB1-PREFLIGHT-R7 — Pre-flight Record

Recorded 2026-09-25 before any file was modified.

| Check | Result | How verified |
| --- | --- | --- |
| (i) fetch origin | PASS | `git fetch origin` |
| (ii) local start = latest `origin/main` | PASS | `git rev-parse HEAD origin/main` both `5fbbedde4ed97899e88cfd4bd4cad02e34101914`; clean tree |
| (iii) PR #5 MERGED | PASS | GitHub API: `merged: true`, merged 2026-09-25T05:45:33Z by kougit; head `4091464`, base `c5c0eb0` |
| (iv) IB0-WP05 CLOSED | PASS | `work-packages/IB0-WP05/work-package.json` status ACCEPTED (PO/SA, 2026-09-25); project record: CLOSED |
| (v) accepted IB0 commit and tree | PASS | commit `5fbbedde4ed97899e88cfd4bd4cad02e34101914`, tree `fb10ab5db706e41f70c37384787740966a8d0d2f`; merge of `c5c0eb0` and `4091464` |
| (vi) post-WP05 `PAEP / gate` green | PASS | GitHub Actions run 36099908357 (push to main, head `5fbbedd`): completed / success |
| (vii) WP01–WP05 acceptance evidence | PASS | WP01 `ACCEPTANCE_REPORT.md` "Acceptance Status: ACCEPTED"; WP02–WP05 `work-package.json` acceptance ACCEPTED by the PO/SA |
| (viii) controlled inputs read | PASS | CLAUDE.md, `.paep-control/SOURCE_OF_TRUTH.md`, EQP §23–§26 and App. C, IB-01/IR-01 baseline sections, WP05 package, residual-risk register, verifiers, policy, workflow |
| (ix) controlled-source fingerprints | PASS | W02 13/13 on `5fbbedd` |
| (x) lockfile integrity | PASS | W06; `npm ci` left the tree unchanged; sha256 `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` |
| (xi) no Nx | PASS | W04 |
| (xii) no substantive IB1 | PASS | W05: 18 placeholder entry points, `config/` holds only README.md |
| (xiii)–(xv) R7 control located | PASS | `work-packages/IB1-PREFLIGHT-R7/R7_ROOT_CAUSE.md`: all fixed values are in `verify-ib0-wp05.mjs` (plus local evidence paths in `negative-ib0-wp05.mjs`); none in tests, manifests, evidence or configuration |
| (xvi) controlled constraints on rollover | PASS | EQP App. C (ACCEPTED by PO/SA), §24(iv) (no bulk baseline updates), §26(iv); no prescribed location; no conflict |
| Reference run on `5fbbedd` | PASS | `qa:ib0-wp05` full 24/24 (log `../logs/main-5fbbedd-qa-ib0-wp05-full.log`) |

Toolchain: Node 24.21.0, npm 11.19.0, Angular 22.1.8, TypeScript 6.0.3.

**Preflight: PASS.** No governance conflict; not BLOCKED.
