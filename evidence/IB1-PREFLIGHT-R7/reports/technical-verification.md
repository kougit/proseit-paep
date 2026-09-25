# IB1-PREFLIGHT-R7 Technical Verification

All runs are from a clean `npm ci` on the committed head, with Node 24.21.0 and npm 11.19.0. No file was written into the repository during a run. Logs: `../logs/`. The GitHub run is recorded in `github-actions-run.md`.

## Verification lanes (VERIFY A–H)

| Lane | Question | Result | How |
| --- | --- | --- | --- |
| A | Is the R7 root cause fully located? | PASS | `R7_ROOT_CAUSE.md`: every fixed value was in `verify-ib0-wp05.mjs` (plus local evidence paths in `negative-ib0-wp05.mjs`); all are now removed or read from the registry |
| B | Is there one authoritative, validated, versioned registry? | PASS | B01–B04; tests D01–D21, C09, C10, F12–F19 |
| C | Is the accepted IB0 baseline bootstrapped from git without editing IB0 records? | PASS | B05–B07 (G1 = `5fbbedd`, tree `fb10ab5`, 5 PO/SA records, 29 fingerprints); A02, A07; IB0 records unchanged (B10) |
| D | Are CANDIDATE and ACCEPTED separate, with no self-approval? | PASS | A01, E01–E04, G01–G05, H10–H15; `promote` needs a PO/SA-accepted first-parent mainline merge |
| E | Do authorised changes pass while unauthorised ones fail? | PASS | B11/W07; A03, B01–B10, F01–F11 |
| F | Is CI integrated and fail-closed? | PASS | W26 in `PAEP / governance`; `qa:baseline:negative` in `PAEP / negative-ci`; W11, W12; WP05 negatives G00–G18 |
| G | Do the WP01–WP05 regressions hold? | PASS | W16–W24; `qa:ib0-wp05:negative` 87/87 |
| H | Are promotion and rollover deterministic, and history protected? | PASS | G06–G16, H01–H09; B09, B10, B13 |

## Commands

| Command | Result |
| --- | --- |
| `npm ci` | Exit 0; `git status` clean before and after all runs |
| lockfile sha256 | `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` (equal to IB0) |
| `npm run qa:baseline` | PASS 13/13 (B01–B13), under 0.5 s |
| `npm run qa:baseline:negative` | PASS 104/104 (13 positive, 91 negative) |
| `npm run qa:ib0-wp05` | PASS 25/25 (W01–W24, W26) |
| `npm run qa:ib0-wp05:negative` | PASS 87/87 (10 controls, 77 negatives) |
| `npm run qa:architecture` | PASS, 0 violations |

## Acceptance criteria

| ID | Result | Evidence |
| --- | --- | --- |
| R7-AC01 | PASS | `preflight.md` |
| R7-AC02 | PASS | `R7_ROOT_CAUSE.md` |
| R7-AC03 | PASS | `BASELINE_GOVERNANCE_DESIGN.md` §2; W06 (no dependency) |
| R7-AC04 | PASS | B01, B02; D01–D06, C09, C10 |
| R7-AC05 | PASS | B03; D09–D12, G09 |
| R7-AC06 | PASS | B05–B07; A02, A07 |
| R7-AC07 | PASS | A01, E01, G02, G04 |
| R7-AC08 | PASS | E02–E04, G01, G03, G05, C06, D08, D18, H10–H15 |
| R7-AC09 | PASS | B11; A03, B01–B10 |
| R7-AC10 | PASS | D01–D21 |
| R7-AC11 | PASS | F01–F11 |
| R7-AC12 | PASS | F12–F19 |
| R7-AC13 | PASS | B09, B10; C04, C12, G08, G09, G14, H01 |
| R7-AC14 | PASS | G06, G07, G12, G13, G15, G16; H01–H04, H07–H15 |
| R7-AC15 | PASS | A05, A06 |
| R7-AC16 | PASS | W11, W12, W26; `github-actions-run.md` |
| R7-AC17 | PASS | W16–W24; WP05 negatives 87/87 |
| R7-AC18 | PASS | W20 (both production builds) |
| R7-AC19 | PASS | `npm ci`; lockfile hash; W06 |
| R7-AC20 | PASS | W02, B10 |
| R7-AC21 | PASS | W04 |
| R7-AC22 | PASS | W05 (18 placeholder entry points; no implementation path changed), B11 |
| R7-AC23 | PASS | `docs/architecture/BASELINE-ROLLOVER.md` |
| R7-AC24 | PASS | `../README.md`, `TRACEABILITY.csv`, `residual-risk.md`, `ACCEPTANCE_REPORT.md` |
| R7-AC25 | PASS | `independent-qa.md` |
| R7-AC26 | See `github-actions-run.md` | PR, run ID and head SHA |
