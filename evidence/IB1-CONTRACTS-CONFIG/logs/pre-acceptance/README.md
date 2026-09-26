# IB1 pre-acceptance revalidation and rehearsal logs (2026-09-26)

Clean clones (`npm ci`, Node 24.21.0, npm 11.19.0); scratch paths are shown as `<scratch-clone>`. Nothing here was pushed from a scratch clone.

## Lanes A–H (PR head `19eac59` plus the timing-evidence correction)

| Directory | Lanes | Result |
| --- | --- | --- |
| `lanes/A-G-contracts-runtime-builds/` | B, C, D, G, F (types, architecture) | `qa:types`, `qa:architecture`, both builds, `qa:contracts` 148/148, `qa:runtime-config` 24/24 (187/187 tests), generator `--check`, mutations 40/40, portability 17/17, `qa:baseline` 13/13, no Nx, lockfile unchanged |
| `lanes/E-F-wp05-full/` | E, F (WP01–WP05 regression) | `qa:ib0-wp05` 25/25 |
| `lanes/E-wp05-negative/` | E | `qa:ib0-wp05:negative` 98/98 |
| `lanes/E-baseline-negative/` | E | `qa:baseline:negative` 105/105 |

Lane A (acceptance and traceability) and lane H (PR #8 open, ready, clean, base `035593b`, no conversations) were checked directly.

## Rehearsal of acceptance, merge and promotion (scratch merge commits only)

| Directory | State | Result |
| --- | --- | --- |
| `rehearsal/0-promoted-before-fix/` | Generation 3 promoted, verifier before D-IB1-01 | `qa:ib0-wp05` FAIL 21/25 (W17, W18, W20, W21): the finding D-IB1-01 |
| `rehearsal/1-acceptance-head*/` | Acceptance commit (with the D-IB1-01 fix), before merge | `qa:baseline` 13/13, `qa:baseline:negative` 105/105, `qa:ib0-wp05` 25/25, `qa:ib0-wp05:negative` 98/98 |
| `rehearsal/2-merged-before-promotion/` | Simulated merge on `main`, promotion pending | `qa:baseline` 13/13 (B13 promotion pending, no other change), `qa:ib0-wp05` 25/25 |
| `rehearsal/3-promoted*/` | Promotion branch (generation 3 ACCEPTED at the simulated merge) | `qa:baseline` 13/13 (active G3, candidate none), `qa:baseline:negative` 105/105, `qa:ib0-wp05` 25/25, `qa:ib0-wp05:negative` 98/98, `qa:contracts` 148/148, `qa:runtime-config` 187/187 |
| `rehearsal/4-final-main/` | Simulated `main` after the promotion merge | `qa:baseline` 13/13, `qa:ib0-wp05` 25/25 |
