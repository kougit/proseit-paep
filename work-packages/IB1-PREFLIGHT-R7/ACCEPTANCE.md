# IB1-PREFLIGHT-R7 — Acceptance Criteria

All criteria are mandatory. PASS is technical; ACCEPTED is the PO/SA's decision.

| ID | Criterion | Verification |
| --- | --- | --- |
| R7-AC01 | Pre-flight: local start equals latest `origin/main`; PR #5 MERGED; IB0-WP05 CLOSED; full SHA and tree resolved; post-WP05 `PAEP / gate` green; WP01–WP05 acceptance evidence present | git, GitHub API, `evidence/IB1-PREFLIGHT-R7/reports/preflight.md` |
| R7-AC02 | R7 root cause identified: every fixed baseline value and where it lives | `R7_ROOT_CAUSE.md` |
| R7-AC03 | At least three design options assessed; minimum-complexity rigorous option selected; no new dependency | `BASELINE_GOVERNANCE_DESIGN.md` §2; W06 |
| R7-AC04 | One authoritative machine-readable registry with schema/structural validation | B01, B02; D01–D06, C09, C10 |
| R7-AC05 | Baseline version/generation sequence; rollback and duplicate generations rejected | B03; D09–D12, G09 |
| R7-AC06 | Generation 1 bootstrapped from the accepted IB0 state (commit, tree, acceptance records) without editing IB0 records | B05–B07; A02, A07 |
| R7-AC07 | Candidate and accepted are distinct; the candidate is never the comparison baseline | A01, E01, G02, G04 |
| R7-AC08 | Claude cannot self-approve: promotion needs a mainline merge carrying the PO/SA ACCEPTED record; non-controlled authorities rejected | E02, E03, E04, G01, G03, G05, C06, D08, D18 |
| R7-AC09 | Authorised changes pass; any unauthorised changed path fails; authorised changes do not become the baseline | B11; A03, B01–B10, B04 |
| R7-AC10 | Fail-closed on malformed, missing or unknown input | D01–D21 |
| R7-AC11 | Path, traversal, separator, case and symlink protection | F01–F11 |
| R7-AC12 | Unicode and control-character protection | F12–F19 |
| R7-AC13 | Historical baseline and accepted records preserved; rewrites and removals fail | B09, B10; B05–B08, C04, C12, G08, G09, G14 |
| R7-AC14 | Deterministic promotion path after explicit acceptance; rollover continues with a new candidate; policy evolution only under `policyChange` | G06, G07, G12, G13, G15, G16; H01–H04, H07–H09 |
| R7-AC15 | Deterministic in a clean clone; verify is read-only | A05, A06 |
| R7-AC16 | CI integration: W26 in `PAEP / governance`; tests in `PAEP / negative-ci`; failures reach `PAEP / gate`; no skipped-to-pass path | W11, W12, W26; A04, B09 (case), D21; WP05 G00–G18 |
| R7-AC17 | WP01–WP05 regressions pass (WP05 negative suite included); only registry-bounded findings | `qa:ib0-wp05` W16–W24; `qa:ib0-wp05:negative` |
| R7-AC18 | Reference-app and ui-lab production builds pass | `npm run build:*`; W20 |
| R7-AC19 | Clean `npm ci`; lockfile byte-identical; no dependency change | setup action; W06 |
| R7-AC20 | Controlled sources unchanged (PACK_MANIFEST fingerprints) | W02, B10 |
| R7-AC21 | No Nx | W04 |
| R7-AC22 | Substantive IB1 not started (no implementation path changed; placeholders intact) | W05, B11 |
| R7-AC23 | Rollover procedure documented | `docs/architecture/BASELINE-ROLLOVER.md` |
| R7-AC24 | Evidence, traceability, residual risks and readiness report complete | `evidence/IB1-PREFLIGHT-R7/`, `TRACEABILITY.csv` |
| R7-AC25 | Independent QA PASS with no open High or Medium finding | `evidence/IB1-PREFLIGHT-R7/reports/independent-qa.md` |
| R7-AC26 | One ready (non-draft) PR to `main`; real GitHub Actions run with `PAEP / gate` success on the exact head; mergeable, no conflicts; not merged; generation 2 still CANDIDATE | GitHub; `evidence/IB1-PREFLIGHT-R7/reports/github-actions-run.md` |
