# Work Package IB1-PREFLIGHT-R7 — Controlled Baseline-Governance Remediation of Residual Risk R7

**Authorisation:** Product Owner / Solutions Architect instruction "IB1 PRE-FLIGHT — R7 CONTROLLED BASELINE REMEDIATION" (project thread, 2026-09-25T06:09Z). This file is the authorisation reference of registry generation 2.  
**Milestone:** IB1 pre-flight (bounded governance/tooling work; not substantive IB1)  
**Predecessor:** IB0 implementation baseline COMPLETE; IB0-WP01..WP05 ACCEPTED and CLOSED; IB0-WP05 merge `5fbbedde4ed97899e88cfd4bd4cad02e34101914` (tree `fb10ab5db706e41f70c37384787740966a8d0d2f`)  
**Design classification:** D0 (no UI)  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Naming:** no controlled naming rule exists for pre-flight work; the identifier from the authorising instruction is used.

## 1. Objective

Replace the fixed IB0 baseline inside `tooling/verification/verify-ib0-wp05.mjs` (residual risk R7, `evidence/IB0-WP05/reports/residual-risk.md`) with a controlled, versioned, traceable, fail-closed baseline-governance mechanism that supports authorised future changes without weakening PAEP controls and keeps acceptance with the PO/SA.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-AUTH | ACCEPTED is set only by the PO/SA (or a recorded delegate) | PAEP-EQP-01 App. C; CLAUDE.md |
| R-BASE | Baselines controlled; intentional changes approved, not bulk-updated | EQP §24(iv) |
| R-EVID | Evidence identifies the commit; retained under `evidence/<WP>/` | EQP §24(i), §25 |
| R-EXC | Approved exceptions visible to gates | EQP §26(iv) |
| R-NOLAUNDER | No weakening of a gate to obtain PASS | EQP §23; CLAUDE.md |
| R-SRC | Controlled sources immutable | PACK_MANIFEST.json; CLAUDE.md |
| R-SCOPE | No substantive IB1, no Nx, no dependency change | Authorising instruction §14; CLAUDE.md |
| R-CI | `PAEP / gate` operational and green | IB0-WP05; instruction §23, §26 |

## 3. Authorised change scope (registry generation 2 `authorisedScope`)

* `tooling/governance/` (new: registry, verifier, tests)
* `tooling/verification/verify-ib0-wp05.mjs` (read the registry instead of fixed constants; local evidence to `tmp/`)
* `tooling/verification/negative-ib0-wp05.mjs` (local evidence to `tmp/` only)
* `tooling/verification/ib0-wp05-ci-policy.json` (the new CI command)
* `.github/workflows/paep-ci.yml` (one step in `PAEP / negative-ci`)
* `package.json` (scripts `qa:baseline`, `qa:baseline:negative` only)
* `docs/architecture/BASELINE-ROLLOVER.md`
* `work-packages/IB1-PREFLIGHT-R7/`, `evidence/IB1-PREFLIGHT-R7/`

The verifier enforces this scope (B11/W07).

## 4. Out of scope

Product-neutral contracts, runtime-configuration schemas or validators, reporting contracts, Frappe integration, enterprise shell, domain functionality, UI components or any other substantive IB1 feature; application or package runtime behaviour; dependencies and the lockfile; controlled sources; earlier work-package records; the historical WP01–WP04 verifiers; branch protection (accepted risk R1).

## 5. Deliverables

Root cause (`R7_ROOT_CAUSE.md`), design (`BASELINE_GOVERNANCE_DESIGN.md`), registry and schema (`tooling/governance/`), rollover procedure (`docs/architecture/BASELINE-ROLLOVER.md`), positive/negative/promotion tests, regression and CI evidence, independent QA, residual risks, traceability and the acceptance-readiness report (`ACCEPTANCE_REPORT.md`).

## 6. Acceptance boundary

Claude Code may implement, verify, document, push, open the PR, run CI and prepare the CANDIDATE (generation 2). Claude Code may not mark generation 2 ACCEPTED, mark R7 CLOSED, merge, or begin substantive IB1. Those require explicit PO/SA authorisation.

## 7. Bounded successor-work exceptions

None of the older verifiers is modified. Their findings about paths changed after their own fixed commits are accepted only through the registry bounds (accepted history up to the active accepted commit, or an in-scope change with B11 passing). This replaces the WP05 string bounds; it is recorded in `BASELINE_GOVERNANCE_DESIGN.md` §5 and proven by W16–W23 passing on this change set.
