# IB0-WP05 Independent QA

**Method:** separate clean-context Claude reviewers. Each worked in its own fresh clone of `kougit/proseit-paep` with no write access to the working repository and no project-chat tools. Round 1 ran three reviewers in parallel against `e7c615a`, covering the six brief §21 lanes. A fresh re-check reviewer then verified the fixes against `e3a7510`.
**Date:** 2026-09-24

## Round 1 (commit `e7c615a`)

| Lane | Scope | Reviewer |
| --- | --- | --- |
| 1 | Workflow correctness | A |
| 4 | Failure behaviour | A |
| 2 | Workflow security, including action SHA, tag and licence checks against the upstream repositories | B |
| 3 | Coverage of WP01–WP04 controls, bounded exceptions and traceability | C |
| 5 | Real GitHub run | Claude Code execution, recorded in `github-actions-run.md`; re-read by the round 2 reviewer |
| 6 | Evidence and traceability | C |

### Findings and disposition

| ID | Sev. | Finding | Disposition |
| --- | --- | --- | --- |
| B-F1 / A-2 | Medium | W12 checked the gate script only for substrings, so an early `exit 0` (or `fail=0` placed before the final test) passed the provenance gate | **Fixed** `e3a7510`: the gate `run` text must equal `policy.gate.run` exactly, and the step `env` keys are pinned. Negative P15. |
| B-F2 | Medium | Top-level workflow keys were not allowlisted, so `defaults: run: shell: true {0}` (every step a no-op) or a top-level `env` passed | **Fixed** `e3a7510`: W09 requires the keys to be exactly `name`, `on`, `permissions`, `concurrency`, `jobs`. Negative P16. |
| B-F3 | Medium | The YAML reader decoded double-quoted escapes differently from GitHub (`\x24{{` read as `x24{{`), which could hide an expression from W13 | **Fixed** `e3a7510`: backslash escapes in double-quoted scalars are rejected, so the check fails closed. Negative P17. |
| B-F4 / A-1 | Medium | Setup-action steps were barely constrained. All of these passed: `env` on `npm ci`, `npm  install`, `curl \| bash`, `\|\| true` on the toolchain gate or `git diff`, `continue-on-error`, `if: false`, and an extra upload step | **Fixed** `e3a7510`: every setup step (keys, inputs, `env`, `shell`, `run`) must equal `policy.setupSteps`; step count and action keys are fixed; the install regex allows any whitespace. Negatives P18, P19, P21, P22. |
| C-M1 | Medium | Rename bypass: a committed move of an accepted WP04 record into `work-packages/IB0-WP05/` hid from every gate, because git rename detection showed only the new path | **Fixed** `e3a7510`: the scope diff uses `--no-renames`, and regression also diffs `evidence/IB0-WP04` and `work-packages/IB0-WP04` against `c5c0eb0`. Negative F04. |
| B-F5 | Low | Upload step accepted extra inputs (`include-hidden-files`, `continue-on-error`) | **Fixed** `e3a7510`: upload and checkout keys and inputs are pinned. Negative P20. |
| A-3 | Low | Some negative cases could pass for the wrong reason: no unmutated control for strictness or negative-architecture, and loose patterns in S04, I04, P09, P10 | **Fixed** `e3a7510`: controls C07 and C08 added; patterns tightened. |
| A-4 | Low | `concurrency` on `main` could replace a pending `push` run, so a commit might get no run | **Fixed** `e3a7510`: `push` and `workflow_dispatch` runs are grouped per commit SHA. AC03 strengthened. |
| A-6 | Info | Design document said "20" gate contexts; G00–G18 is 19 | **Fixed**; AC05 now reads "G00–G18 (19/19) and X01, X02". |
| C-L1 | Low | W19 accepts the WP03 negative runner on its known crash signature, so its cases M7–M10 and M15–M17 are not individually asserted | **Accepted as residual** (R5). This is the WP03-window runner already bounded at WP04 (WP04 residual risk (vi)). Positive checks of the same settings run in W17 and W21. |
| C-L2 | Low | The regression bound for WP03 V12 accepts any WP04-permitted path, so it relies on governance W07 to catch edits to WP04 tooling | **Accepted as residual** (R6). The aggregate gate still fails such a change through governance, which requires every mandatory job. |
| B-F6 / C-L3 / A-7 | Low / Info | A pull request runs its own workflow, policy and verifier, so one PR can weaken all three together | **Accepted as residual** (R2). The design document now states that W09–W15 help reviewers but are not a security boundary against the PR author. CODEOWNERS is recommended once a second reviewer exists. |
| A-5 | Info | Gate edge inputs (`"success\n"`, duplicate JSON keys, empty `MANDATORY_JOBS`) pass the script | No action: GitHub's `toJSON(needs)` cannot produce them, and W12 pins `MANDATORY_JOBS` and the script. |
| C-Info | Info | AC25 requires a PO/SA decision record for lint and unit tests; none exists yet | Open **PO/SA decision** (see acceptance readiness). No placeholder commands exist. |
| C-Info | Info | `BASELINE_COMMIT` and `WP05_PERMITTED` are hard-coded, so later work packages must update the verifier | Recorded as residual R7 (expected maintenance). |

**Confirmed correct in round 1:**
- Triggers, permissions and gate semantics. Reviewer A executed the gate script against 30+ inputs; only "all nine success" passes.
- `set -euo pipefail` with `tee` propagates failures.
- Setup environment propagation works as designed.
- Unknown gates exit 2, and an empty result set fails.
- All three action SHAs equal their upstream release tags. Each is an MIT, node24 commit object.
- Artifacts contain only the evidence directory.
- Cache scope and `npm ci` integrity checks are sound.
- `qa:types` catches template errors in both apps.
- Every WP01–WP04 control is still run by a CI job (control-to-job map in the lane 3 report, summarised in `technical-verification.md`).
- Negative suite 74/74 in a fresh clone.

## Round 2: fix re-check (commit `e3a7510`)

A fresh reviewer re-attempted every round 1 attack and close variants.

**Items 1–7: FIXED.** Each attack now fails its check:

| Item | Attack | Fails |
| --- | --- | --- |
| 1 | Gate script edits | W12 |
| 2 | Top-level `defaults`/`env` | W09 |
| 3 | Escapes | W09 parse error |
| 4 | Setup steps: `\|\| true`, `continue-on-error`, `if: false`, `env`, `npm  install`, `curl \| bash`, extra upload, `working-directory`, `node-version: latest` | W15 |
| 5 | Upload inputs | W11 |
| 6 | Committed renames of WP04 records | W07 and W20/W21 |
| 7 | Concurrency: `github.ref` or `head_ref` group, `cancel-in-progress: true` | W09/W13 |

Unmutated gates PASS.

**New findings:**

| ID | Sev. | Finding | Disposition |
| --- | --- | --- | --- |
| R2-H1 | **High** | U+0085 (NEL) is a line break to YAML parsers (PyYAML confirmed) but not to the PAEP reader's `\n` split. A line such as `contents: read #<NEL>defaults:<NEL>  run:<NEL>    shell: true {0}` read as a comment, and the provenance gate passed. The same trick added `env` to the setup `npm ci` step, `shell: true {0}` to the gate step, and `continue-on-error` to a job. | **Fixed** `089f864`: the reader accepts printable ASCII and `\n` only. The workflow's one em-dash comment became `-`. Negative P23. |
| R2-L1 | Low | The gate job's `runs-on` and `timeout-minutes` were not checked | **Fixed** `089f864`: the runner must be `ubuntu-24.04` and the timeout 1–10 minutes. Negative P24. |
| R2-I1 | Info | The gate step's `name` is unchecked | No action (display only) |

## Round 3: final re-check (commit `089f864`)

A fresh reviewer compared the PAEP reader against `yaml` 2.x (YAML 1.2) and PyYAML 6.0.1 (YAML 1.1) mutation by mutation.

**Item 1 (NEL and related): FIXED.** Provenance fails with a W09 parse error for:
- NEL, CR, U+2028 and U+2029;
- CRLF line endings;
- a BOM;
- NEL inside a quoted scalar;
- NEL in the setup action;
- NBSP, VT and FF.

W12 fails a gate job with `runs-on: self-hosted`, or with `timeout-minutes` set to 0, -0, 0x5, 1e1 or +5.

**Item 2 (parser differential hunt): no fail-open weakening found.** Wherever the PAEP reader and a real parser disagree, the value no longer equals the policy's exact value or key allowlist, and the gate fails. That held for:
- nested sequences and empty items;
- `[main,]`, `False`, `Null`;
- key and dash spacing, `...`, and multi-line plain scalars;
- `#` lines in run blocks.

| ID | Sev. | Finding | Disposition |
| --- | --- | --- | --- |
| R3-L1 | Low | Three inputs that real YAML parsers reject are accepted by the PAEP reader: `"x"#c` (no space before `#`), `run: \|#c`, and a block scalar whose first line is indented more than later lines. GitHub would reject such a file, so the workflow would not run and `PAEP / gate` would never report. This **fails closed**: a required check that does not report blocks the merge. It is not a weakening; a locally green provenance gate simply does not prove that GitHub accepts the file. | **Accepted as residual** (R10). The real GitHub run on every PR head is the proof that the workflow parses (runs 2, 4, 5). |
| R3-I1 | Info | Number spellings such as `05`, `030` and `-0` pass. They have the same value in YAML 1.2, which GitHub uses. | No action |

Unmutated governance, provenance and strictness PASS.

## Result

**Independent QA: PASS.**
- No open High or Medium finding.
- 1 High, 5 Medium and 4 Low findings were closed with fixes and negative cases.
- The remaining Low items are recorded as residual risks R2, R5, R6 and R10.
