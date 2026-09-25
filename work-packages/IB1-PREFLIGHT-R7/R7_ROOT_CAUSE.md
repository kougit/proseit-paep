# IB1-PREFLIGHT-R7 — R7 Root-Cause Analysis (Lane A)

**Status:** CONFIRMED  
**Analysed state:** `origin/main` = `5fbbedde4ed97899e88cfd4bd4cad02e34101914` (tree `fb10ab5db706e41f70c37384787740966a8d0d2f`), the IB0-WP05 merge (PR #5).

## 1. The residual risk as accepted

`evidence/IB0-WP05/reports/residual-risk.md`, R7: "`BASELINE_COMMIT` and `WP05_PERMITTED` are fixed to the WP05 window. The next WP that changes files will fail governance W07 and the WP04 bounds until it updates or supersedes the WP05 verifier, as each earlier WP did."

## 2. Controls that create R7

All of them are in `tooling/verification/verify-ib0-wp05.mjs` at `5fbbedd`. No test, manifest, evidence or configuration file holds a separate copy; the policy file `ib0-wp05-ci-policy.json` holds no baseline.

| Location (5fbbedd) | Fixed value | Used by | Effect on the next authorised change |
| --- | --- | --- | --- |
| line 54 `BASELINE_COMMIT` | `c5c0eb0` (IB0-WP04 merge) | W02, W05, W06, W07, W08 changed-path set; W06 package comparison; `wp05PackageDeltaOnly()`; W21 residual check | Every path changed after WP05 is compared with the WP04 state, so it is judged against WP05's scope |
| line 56 `WP03_BASELINE` | `ac6b786` (IB0-WP03 merge) | W21 residual check of WP01–WP03 records | Records are pinned to one historical commit rather than to their own acceptance |
| lines 58–63 `WP05_SCRIPTS` | exactly three scripts | W06, WP04 V16 bound | Any new npm script fails W06 and the WP04 V16 bound |
| lines 65–71 `WP05_PERMITTED` | 12 path regexes (WP05 §4) | W07, `isWp05Path()` in the WP04 V16/V17, WP03 V12 and WP02 V17 bounds | Any path outside WP05 §4 fails W07 and every regression bound (W17, W18, W20, W21, W22) |
| lines 73–78 `WP04_PERMITTED` | WP04 §4 regexes | WP03 V12 bound | Same pattern one window earlier |
| line 79 `PROTECTED_RECORDS` | WP01–WP04 record folders | restore after running older verifiers | WP05 records are not in the list |
| lines 207–221 W05 | `apps/`, `packages/`, `config/`, `angular.json`, `tsconfig*` must not change; entry points must be `export {};` | governance | Correct for IB0; permanently blocks IB1 even when authorised |
| lines 519–527 `wp02V17Bounded` | exact strings `tsconfig.base.json`, `.github/workflows`, `tsconfig.json`/`packages/*/src/index.ts` | W16, W22, W21 | Any other later change reported by WP02 V17 fails |
| lines 93–94, 743–744 evidence paths | local runs write `evidence/IB0-WP05/reports`, `logs/ci-gates` | every local run | A local run rewrites the accepted WP05 record |
| `negative-ib0-wp05.mjs` lines 32–34 | local runs write `evidence/IB0-WP05/logs`, `reports` | local negative run | Same |

The older verifiers (`verify-ib0-wp02.mjs` `b6b023f`, `verify-ib0-wp03.mjs` `de13629`, `verify-ib0-wp04.mjs` `ac6b786`) also hold fixed baselines. That is accepted history: they are not modified, and the newest verifier bounds their findings (IB0-WP03/WP04/WP05 practice).

## 3. Historical reason

Each IB0 work package verified "only my paths changed since the previous accepted merge" by hard-coding that merge and its own path list. That gave a strong, simple scope control for one window. The cost was that each successor had to edit or supersede the newest verifier and add string-level bounded exceptions for every older verifier, and nothing recorded which commit was the accepted baseline other than a constant in code.

## 4. What remains valid, what becomes a problem

Valid and kept: comparing the current state with the last accepted state; failing on any path outside the authorised scope; immutable controlled sources; unchanged accepted records; no dependency drift; secrets scan of changed files; exact bounded exceptions for older verifiers; the WP05 CI policy (W09–W15) and all regression gates.

Problematic after WP05: the comparison commit is the wrong one (WP04, not the accepted IB0 state); the permitted scope is WP05's; the bounds accept only WP05 paths; W05 forbids all implementation paths forever; the accepted-baseline identity lives only in code, so moving it is an ad-hoc code edit with no record of acceptance authority, no history and no protection against a change that simply moves the constant to "whatever is on disk".

## 5. Root-cause statement

The WP05 governance gate identifies the accepted baseline and the authorised change scope by constants compiled into the verifier (`BASELINE_COMMIT`, `WP05_PERMITTED`, `WP05_SCRIPTS`, the string bounds and the W05 freeze). There is no controlled, versioned record of which state was accepted, by whom, on what evidence, and what the current work package may change. Every legitimate milestone therefore needs an unreviewed code edit to the verifier, and such an edit cannot be distinguished mechanically from weakening the control.
