# IB1-PREFLIGHT-R7 Independent QA

Reviewers: separate Claude Code reviewers with clean context, each working in its own fresh clone with `refs/remotes/origin/main` = `5fbbedd`. They did not modify the source repository.

| Lane | Scope | Reviewer |
| --- | --- | --- |
| 1 | Governance and authority: registry, acceptance binding, promotion, self-approval | Reviewer A (adversarial) |
| 2 | Bypass and tampering: history rewrites, merge tricks, scope widening, malformed records | Reviewer A (adversarial) |
| 3 | CI integration: W26, `PAEP / negative-ci`, `PAEP / gate` | Reviewer B |
| 4 | Regression and strength of the older-verifier bounds | Reviewer B |
| 5 | Scope: no substantive IB1, no dependency, controlled sources and earlier records untouched | Reviewer B |
| 6 | Evidence completeness and consistency | Claude Code check plus Reviewer A (see below) |

## Findings and dispositions

| Round | Commit | ID | Severity | Finding | Fix / disposition | Re-test |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `b165a5d` | F1 | High | A `git merge -s ours` could drop a promoted generation from the registry while keeping its history | `360e671`: full-history append-only check, and every ACCEPTED generation on the mainline registry must be present unchanged (B09); test H01 | Closed (rounds 2–4) |
| 1 | `b165a5d` | F2 | Medium | Between the accepted merge and its promotion the records were unprotected | `360e671`: B13 freeze to the earliest accepted merge; `promote` accepts only that merge; tests H02–H04 | Closed (round 2) |
| 1 | `b165a5d` | F3 | Medium | A CANDIDATE without `policyChange` could change the verifier, CI or `CLAUDE.md` | `360e671`: governance-critical scope requires `policyChange: true` (B08); tests H05, H06 | Closed (rounds 2–4) |
| 1 | `b165a5d` | F4 | Low | The branch author can write the ACCEPTED record | Residual R7-RR1 (acceptance is real only through the PO/SA merge) | Accepted residual (proposed) |
| 1 | `b165a5d` | F5 | Info | Local-only gaps (ignored files, index flags) | Residual R7-RR8 (CI clean checkout) | — |
| 1 | `b165a5d` | L3-5-1 | Low | `CLAUDE.md` governed rather than immutable | Residual R7-RR3; PO/SA decision | — |
| 1 | `b165a5d` | L3-5-2 | Low | CANDIDATE authorisation and scope are self-declared | `BASELINE-ROLLOVER.md` rule 5; residual R7-RR2 | — |
| 1 | `b165a5d` | L3-5-3 | Info | `origin/main` presence in CI to confirm on the real run | Confirmed in `github-actions-run.md` | — |
| 2 | `360e671` + `76c18a3` | N1 | Medium | Adding a work package to the CANDIDATE lifted the B13 freeze (freeze required every listed WP to be accepted, and read HEAD's candidate) | `7f2d01c`: freeze on any accepted WP; the frozen CANDIDATE is read from the mainline merge; `promote` uses the same rule; tests H07–H09 | Closed (round 3) |
| 2 | `76c18a3` | N2 | High | That commit deleted two accepted IB0-WP04 records (committed while a full verifier run had them temporarily moved); the gate correctly failed | Commit dropped (never pushed); branch rebuilt from `360e671` | Closed (round 3) |
| 3 | `7f2d01c` | N3 | Medium | A malformed ACCEPTED record (bad date, near-miss authority) was not a claim, so it avoided the freeze | `80e2b03`: any ACCEPTED claim freezes; B12 fails a claim that is not a valid acceptance; tests H10–H12 | Closed (round 4) |
| 3 | `7f2d01c` | N3-L1 | Low | A mainline merge with an unreadable registry is skipped by the freeze search (that merge fails B01 in CI) | Residual R7-RR7 | — |
| 3 | `7f2d01c` | N3-L2 | Low | A multi-WP CANDIDATE accepted in separate merges can never be promoted (availability) | `BASELINE-ROLLOVER.md` step 6; residual R7-RR6 | — |
| 4 | `80e2b03` | N4 | Medium | An acceptance written only as an `ACCEPTANCE_REPORT.md` "Acceptance Status" row (the IB0 form) avoided the freeze | `367bf02`: report rows count as claims; B12 requires a valid `work-package.json` for any claim; tests H13, H15 | Closed (round 5) |
| 4 | `80e2b03` | N5 | Low | Case or padding variants of ACCEPTED were not claims | `367bf02`: trimmed, case-folded comparison; test H14 | Closed (round 5) |
| 5 | `367bf02` | N6 | Low | Acceptance written in a non-recognised free form (HTML table, prose, `Status` row, `.txt`, or under `evidence/`) is not a claim, so it avoids the freeze | Residual R7-RR10; structural hardening option recorded | — |

## Lane results

* **Lanes 1–2:** round 1 FAIL (F1–F3); round 2 FAIL (N1, N2); round 3 FAIL (N3); round 4 FAIL (N4). **Round 5 (`367bf02`): PASS**, no High or Medium open. Every markdown-row variant (other `.md` file, subfolder, `.MD`, emphasis) is caught; N1, N3, F1–F3 and the normal lifecycle (accept, merge, promote, merge) re-checked; `qa:baseline:negative` 104/104 in a clean clone.
* **Lanes 3–5 (round 1): PASS.** No High or Medium. The reviewer reproduced that a missing `origin/main` fails the governance gate (3/9), a simulated PR merge commit passes (9/9), and a one-line edit under `apps/` fails (6/9). The gate treats skipped or cancelled as failure. No IB1, dependency, lockfile, Nx, controlled-source or earlier-record change. Later rounds changed only the governance verifier, its tests and documentation; lanes 1–2 re-ran the full lifecycle each round.
* **Lane 6 (evidence):** Claude Code checked that every path named in `ACCEPTANCE_REPORT.md`, `technical-verification.md`, `TRACEABILITY.csv` and `../README.md` exists, that logs come from the recorded head, and that no evidence file contains credentials or unnecessary personal data. PASS.

* **Round 6 (2026-09-26, pre-acceptance): PASS.** Before the acceptance commit, a rehearsal (acceptance, merge, promotion in a scratch clone) showed that `negative-baseline-governance.mjs` snapshotted the live state and would fail 27 cases once the record said ACCEPTED, and after promotion (defect D-R7-01; CI would have gone red). The suite now builds a fixture (generation 1 plus the current generation 2 scope, generation 2 in CANDIDATE form, records pre-acceptance). The reviewer confirmed: no case, pattern or pass/fail logic changed (104 cases); the fixture equals the old snapshot before acceptance; 104/104 before acceptance, with the ACCEPTED record, after a local merge and after promotion (77/104 without the fix); the real current state stays covered by `qa:baseline` (W26 in `PAEP / governance`, required by `PAEP / gate`). Info I1 recorded as R7-RR11.

* **D-R7-02 (2026-09-26, pre-acceptance rehearsal):** on the promoted state the WP05 regression bounds refused the promoted registry (W17/W18/W20/W21, C07/C08). Fixed in `authorisedSince`; test G17 added (fails without the fix). Independent re-check: round 7 below.
* **Round 7 (2026-09-26, `ce6a0b1`): PASS, no findings.** The fix accepts the registry only when it is the sole change since the active baseline, there is no CANDIDATE and B11 passes (and a valid base needs B05-B09); 13 post-promotion mutations (registry edits, fingerprint change, reversion, deletion, other files) are all refused. The acceptance record is well formed (B12). Suite 105/105 at `ce6a0b1` and on a promoted main; 104/105 with the old line (G17 detects D-R7-02).

**Verdict: independent QA PASS.** No High or Medium finding is open; Low and Info items are recorded in `residual-risk.md`.
