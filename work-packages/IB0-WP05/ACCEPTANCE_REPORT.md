# IB0-WP05 Acceptance Report

**Work package:** IB0-WP05 — CI/CD, Automated Quality Gates, Security/Provenance and Pull-Request Enforcement Baseline (PAEP-IR-01 IB0-WP5)
**Commit / revision:**
- Implementation: `2dac72a` (plan), `45d7643`, `cb91ac4`, `e7c615a` (workflow YAML fix).
- Deliberate-failure proof and revert: `c36dbad` and its revert `b6004dc`.
- QA round 1 fixes: `e3a7510`.
- QA round 2 fixes: `089f864`. This is the code commit under test.
- The PR head is recorded in `evidence/IB0-WP05/reports/acceptance-readiness.md`.

**Baseline:** IB0-WP04 ACCEPTED and CLOSED, merge commit `c5c0eb0`
**Technical reviewer:** Claude Code (execution). Independent QA by separate clean-context Claude reviewers.
**Review date:** 2026-09-24

## Implemented scope

`.github/workflows/paep-ci.yml` ("PAEP CI"):
- Runs on `pull_request` to `main`, `push` to `main` and `workflow_dispatch`, with a `contents: read` token and no secrets.
- Runs nine parallel mandatory jobs. Each does a clean full checkout, then the local setup action: Node from `.nvmrc`, the toolchain gate, `npm ci`, and a tracked-tree check.
- The nine jobs are:
  - governance
  - security-provenance (with `npm audit signatures`)
  - architecture
  - strictness (`qa:types` and WP04 static)
  - negative-architecture
  - negative-ci
  - regression (WP04 → WP03 → WP02 → WP01 under bounded exceptions)
  - build-reference-app
  - build-ui-lab
- Every job uploads its evidence with 30-day retention.
- One aggregate check, **`PAEP / gate`**, runs `always()` with no permissions. It passes only when all nine jobs report `success`.

Supporting pieces:
- Three GitHub first-party actions, pinned by SHA and registered.
- `tooling/verification/verify-ib0-wp05.mjs` checks the workflow against `ib0-wp05-ci-policy.json`, which holds the exact reviewed gate script and setup steps.
- `negative-ib0-wp05.mjs` proves the CI controls reject what they exist to reject.
- `docs/architecture/IB0-WP05-PR-ENFORCEMENT.md` holds the proposed `main` ruleset. It is not applied.

No dependency, lockfile, app, package, `angular.json`, tsconfig or controlled source changed. Nx: NOT REQUIRED. IB1: not started.

## Requirement traceability

`work-packages/IB0-WP05/TRACEABILITY.csv` maps 25 requirement rows to implementation, AC01–AC27, verification and evidence. Definition audit: `evidence/IB0-WP05/reports/definition-audit.md`.

## Automated gates

| Command / check | Result | Evidence location |
| --- | --- | --- |
| `npm ci` (fresh clone, pinned toolchain) | Exit 0 | `evidence/IB0-WP05/logs/npm-ci.log` |
| Lockfile and tracked tree unchanged; lockfile identical to `c5c0eb0` | Exit 0 | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` / `build:ui-lab` | Exit 0 / exit 0 | `logs/build-*.log` |
| `npm run qa:architecture` | PASS, 0 violations | `logs/qa-architecture.log` |
| `npm run qa:types` | Exit 0 | `logs/qa-types.log` |
| `npm run qa:ib0-wp05` | PASS 24/24 | `logs/verify-ib0-wp05-full.log`; `reports/ib0-wp05-verification.json` |
| `npm run qa:ib0-wp05:negative` | PASS 87/87 (10 controls, 77 negatives) | `logs/negative-ci-tests.log`; `reports/negative-ci-tests.json` |
| GitHub Actions run 36052554946 (head `089f864`) | 10/10 checks success; `PAEP / gate` PASS | `reports/github-actions-run.md` |
| GitHub Actions run 36048105730 (deliberate violation) | 6 jobs failed; `PAEP / gate` FAIL | `reports/github-actions-run.md` |

## Manual checks

| Check | Reviewer | Date | Result |
| --- | --- | --- | --- |
| Definition audit (the controlled pack has no WP05 definition; drafted from the PO/SA brief) | Claude Code | 2026-09-24 | PASS; final definition traced to IR-01 §4.4 IB0-WP5 and the PO/SA brief, no IB1 scope (re-verified 2026-09-25) |
| Independent QA round 1, lanes 1–6 (3 parallel reviewers, `e7c615a`) | Independent Claude reviewers | 2026-09-24 | 5 Medium, 5 Low, Info. All Medium fixed in `e3a7510` |
| Independent QA round 2, fix re-check (`e3a7510`) | Independent Claude reviewer | 2026-09-24 | Fixes confirmed; 1 new High (NEL line break) and 1 Low, fixed in `089f864` |
| Independent QA round 3, final re-check (`089f864`) | Independent Claude reviewer | 2026-09-24 | PASS: NEL fix confirmed; no fail-open differential; 1 Low (fails closed), accepted as R10 |
| Definition approval; AC25 lint/unit-test disposition; enforcement disposition; acceptance and merge | Product Owner / Solutions Architect | 2026-09-25 | APPROVED (decisions 1–4 below) |

## Acceptance criteria

**27/27 PASS.** AC24 passes as READY (prepared and approved, not applied, as the criterion requires). AC25 passes as **PASS — APPROVED DEFERRED CAPABILITY** (PO/SA decision 2). AC27 passes as Complete. Per-criterion evidence: `evidence/IB0-WP05/reports/technical-verification.md`.

## Defects

**D1 (high, closed): invalid workflow YAML.**
- Two unquoted `: ` step names made GitHub reject the file (run 36047067712, 0 jobs).
- Fixed in `e7c615a`. The reader now rejects the pattern (P14).

**D2 (medium, closed): QA round 1 findings B-F1 to B-F4 and A-1.**
- The policy check accepted weakening edits that GitHub would run: gate-script substrings, top-level `defaults`/`env`, decoded escapes, and unconstrained setup steps.
- Fixed in `e3a7510` with exact reviewed text, a key allowlist and escape rejection (P15–P22).

**D3 (medium, closed): C-M1 rename bypass of accepted WP04 records.**
- Fixed in `e3a7510` with `--no-renames` and a WP04 record diff (F04).

**D4 (high, closed): QA round 2, a U+0085 (NEL) line break could hide YAML keys from the reader.**
- Fixed in `089f864`: printable ASCII and `\n` only (P23). The gate runner and timeout are now pinned (P24).

**D5 (low, closed):**
- Loose negative patterns, fixed with controls C07/C08.
- The `main` push concurrency could replace a pending run; now grouped per commit.
- A gate-case count error in the documentation.

## PO/SA decisions (2026-09-25)

Recorded under the PO/SA instruction "IB0-WP05 — FINAL PRODUCT OWNER / SOLUTIONS ARCHITECT DECISIONS, ACCEPTANCE, MERGE AND POST-MERGE CLOSURE" (project chat, 2026-09-25T05:15Z).

| # | Decision | Disposition |
| --- | --- | --- |
| 1 | Final WP05 definition (27 criteria, QA-driven refinements, CI architecture, aggregate check, security/provenance controls, enforcement design, negative CI-control tests) | APPROVED |
| 2a | Lint/format stage | DEFERRED — approved controlled deferral; activation trigger in WORK_PACKAGE §5.1 |
| 2b | Unit-test CI stage | DEFERRED until meaningful executable behaviour exists; activation trigger in WORK_PACKAGE §5.1 |
| 3 | `main` enforcement design | APPROVED; technically ADVISORY until GitHub repository/account capability permits; activation trigger in WORK_PACKAGE §5.1 |
| 4 | Acceptance and merge of PR #5 | AUTHORISED, subject to final automated revalidation (passed) |

**Required future check:** `PAEP / gate`. The current inability to apply the ruleset is an ACCEPTED RESIDUAL RISK, not a failed criterion.

## Exceptions (approved with the definition, WORK_PACKAGE §6)

The WP01–WP04 verifiers are unchanged. `verify-ib0-wp05.mjs` accepts only the findings WP05 itself causes:

| Verifier | Accepted findings |
| --- | --- |
| WP04 | V16 (three scripts), V17 (WP05 paths and `.github/**`), V22/V23 (re-evaluated with WP05 paths) |
| WP04 negative | C3 (exactly V16/V17) |
| WP03 negative runner | Its known crash at line 125 |
| WP03 and WP02 regression | Their accepted bounds plus WP05 paths |

## Provenance and licences

- No npm dependency was added, removed or re-versioned.
- Actions used: `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0 and `actions/upload-artifact` v7.0.1.
  - All three are GitHub first-party, MIT and node24.
  - Each is pinned to the full commit SHA of its release tag. Independent QA verified the SHAs against the upstream tags.
  - They are recorded in `docs/provenance/GITHUB-ACTIONS-REGISTER.md`.
- The YAML reader, verifier and negative suite are original PAEP code that uses Node built-ins only.
- No template, theme or third-party source was copied.

## Residual risk

The full record is `evidence/IB0-WP05/reports/residual-risk.md`, risks R1–R10:

| ID | Risk |
| --- | --- |
| R1 | CI is advisory until enforcement is active |
| R2 | A PR runs its own workflow, policy and verifier; review and CODEOWNERS are the control |
| R3 | No lint or unit-test stage |
| R4 | Linux-only |
| R5 | The WP03 negative runner is accepted on its crash signature |
| R6 | A loose WP03 V12 regression bound, backed by governance |
| R7 | The WP05 verifier's baseline must be updated by the next WP |
| R8 | No SBOM or vulnerability gate |
| R9 | GitHub service dependency |
| R10 | The YAML reader accepts a few inputs GitHub would reject (fails closed) |

## Residual-risk disposition

All residual risks R1–R10 are ACCEPTED as non-blocking. R1 is recorded as the PO/SA stated it: "PAEP / gate is operational and authoritative as the automated PAEP CI signal, but GitHub currently cannot technically require it before merge because branch-protection/ruleset activation is unavailable to this repository under the presently available GitHub capability. Enforcement shall be activated when repository/account capability permits." Until then, PAEP engineering governance requires a green `PAEP / gate` before acceptance and merge through the controlled PO/SA process.

## Technical result

**PASS** (27/27)

## Human acceptance decision

| Field | Value |
| --- | --- |
| Technical Verification | PASS |
| CI Verification | PASS |
| Independent QA | PASS (no open High or Medium; `evidence/IB0-WP05/reports/independent-qa.md`) |
| Architecture Conformance | PASS |
| Acceptance Criteria | 27/27 PASS |
| Acceptance Status | ACCEPTED |
| Acceptance Authority | Product Owner / Solutions Architect |
| Acceptance Date | 2026-09-25 |
| Recorded under | PO/SA instruction "IB0-WP05 — FINAL PRODUCT OWNER / SOLUTIONS ARCHITECT DECISIONS, ACCEPTANCE, MERGE AND POST-MERGE CLOSURE" (project chat, 2026-09-25T05:15Z), after final automated revalidation passed |
