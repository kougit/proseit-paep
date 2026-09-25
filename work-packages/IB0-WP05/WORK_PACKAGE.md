# Work Package IB0-WP05 — CI/CD, Automated Quality Gates, Security/Provenance and Pull-Request Enforcement Baseline

**Controlled roadmap mapping:** PAEP-IR-01 §4.4, IB0-WP5 ("Create baseline CI stages for install, lint, type-check, unit test, build and architecture verification." Required evidence: "Successful CI run from clean source checkout.")  
**Milestone:** IB0 — Workspace and Architecture Governance Baseline (PAEP-EQP-01 WBS W1 / IB0)  
**Predecessor:** IB0-WP04 — ACCEPTED and CLOSED 2026-09-24 (merge commit `c5c0eb0`)  
**Design classification:** D0 — not a UI work package; no design handoff required  
**Execution agent:** Claude Code  
**Acceptance authority:** Product Owner / Solutions Architect  
**Definition status:** APPROVED by the Product Owner / Solutions Architect on 2026-09-25 under the PO/SA instruction "IB0-WP05 — FINAL PRODUCT OWNER / SOLUTIONS ARCHITECT DECISIONS, ACCEPTANCE, MERGE AND POST-MERGE CLOSURE" (project chat, 2026-09-25T05:15Z), including the QA-driven refinements from the three independent QA rounds. Drafted by Claude Code on 2026-09-24 under the PO/SA instruction "IB0-WP05 — CI/CD, AUTOMATED QUALITY GATES, SECURITY/PROVENANCE AND PULL-REQUEST ENFORCEMENT BASELINE" (project thread, 2026-09-24T18:39Z). The controlled pack supplied no IB0-WP05 definition. The definition audit is `evidence/IB0-WP05/reports/definition-audit.md`.

## 1. Objective

Turn the PAEP verification controls established by IB0-WP01 to IB0-WP04 into repeatable GitHub Actions automation: every pull request to `main`, every push to `main` and every manual dispatch runs the accepted gates in parallel from a clean checkout, and one stable aggregate check, `PAEP / gate`, passes only when every mandatory gate passes. Prepare, but do not activate, the enforcement that makes that check required on `main`.

## 2. Controlling requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R-CI | Baseline CI stages for install, type-check, build and architecture; successful CI run from a clean checkout | IR-01 §4.4 IB0-WP5; §4.5 "Clean install", "Build", "Reproducibility"; EQP §29.1(v); IB-01 §18.1 |
| R-LINT-UNIT | CI stages for lint and unit test | IR-01 §4.4 IB0-WP5; §4.5 "Unit baseline"; EQP §29.1(iii), (vi); IB-01 §4.1 Vitest row |
| R-TYPES | Strict TypeScript and strict template checks pass in CI | IR-01 §4.5 "Type safety"; IB-01 §4.1 TypeScript row; EQP §15 `qa:types` |
| R-ARCH | Forbidden dependencies, cycles and deep imports fail CI | IR-01 §4.3(v), §4.5; IB-01 §6.2(i), (viii); EQP §16(ii); PAEP v1.1 §5.3 |
| R-NEG | Negative tests demonstrate CI rejection | IR-01 §4.4 IB0-WP4 evidence, §4.6(iii), App. A(ii); PO/SA brief §17 |
| R-INSTALL | `npm ci` from the committed lockfile; lockfile drift is blocking; exact toolchain | IB-01 §4.1 package-manager and Node rows; IR-01 App. A(i); WP02 pins and install-script policy |
| R-REG | WP01–WP04 controls keep passing, with their accepted bounded exceptions | IR-01 §4.6; WP03/WP04 PO/SA decisions |
| R-PROV | Dependency and action provenance, install-script policy, licence records; no new dependency without review | EQP §22(iii), (vi); IB-01 §18.1 security/dependency gate; PAEP v1.1 §3 |
| R-SEC | Least-privilege, secrets-safe workflows; no untrusted code with privileged tokens | IB-01 §9 (no secrets in bundles or config), §19; EQP §17(ii); PO/SA brief §11 |
| R-EVID | CI retains build and test evidence; evidence identifies the commit | IR-01 §4.6(iv), §7.2(i); EQP §24 |
| R-GATE | One stable aggregate PR quality gate and a design for making it mandatory on `main` | PO/SA brief §15, §22 |
| R-SCOPE | No IB1+ work, no Nx, no application feature, no controlled-source change | CLAUDE.md; IR-01 §2.3; WP04 Nx disposition |
| R-DOC | Plan, definition, traceability and acceptance report | EQP §11, §25, §32, App. C |

## 3. Required outcome

(i) `.github/workflows/paep-ci.yml` ("PAEP CI") runs on `pull_request` to `main`, `push` to `main` and `workflow_dispatch`, with nine parallel mandatory jobs and the aggregate job `PAEP / gate`.

(ii) `.github/actions/paep-setup/action.yml` installs Node from `.nvmrc`, runs the toolchain gate, `npm ci`, and fails if installation changed a tracked file.

(iii) `tooling/verification/verify-ib0-wp05.mjs` (`npm run qa:ib0-wp05`) checks the workflow against `tooling/verification/ib0-wp05-ci-policy.json` and runs the accepted verifiers as regression with the bounded exceptions in §6; `tooling/verification/negative-ib0-wp05.mjs` (`npm run qa:ib0-wp05:negative`) proves the CI controls reject what they exist to reject.

(iv) `npm run qa:types` gives the EQP Appendix B type-check gate using the pinned Angular compiler.

(v) A real GitHub Actions run on the WP05 pull request passes, and its check names are recorded.

(vi) `docs/architecture/IB0-WP05-PR-ENFORCEMENT.md` holds the proposed enforcement configuration for `main`.

## 4. Permitted change boundary

Claude may create or modify:

(i) New `.github/workflows/paep-ci.yml` and `.github/actions/paep-setup/action.yml`, and nothing else under `.github/`.

(ii) Root `package.json`: add the `qa:types`, `qa:ib0-wp05` and `qa:ib0-wp05:negative` scripts only.

(iii) New `tooling/verification/verify-ib0-wp05.mjs`, `negative-ib0-wp05.mjs`, `ib0-wp05-ci-policy.json` and `yaml-subset.mjs`.

(iv) New `docs/architecture/IB0-WP05-IMPLEMENTATION-PLAN.md`, `IB0-WP05-CI-DESIGN.md`, `IB0-WP05-PR-ENFORCEMENT.md` and `docs/provenance/GITHUB-ACTIONS-REGISTER.md`; work-package notes in `docs/adr/ADR-REGISTER.md` and `docs/provenance/PROVENANCE-REGISTER.md`.

(v) New `work-packages/IB0-WP05/**` and `evidence/IB0-WP05/**`.

Claude shall **not** modify: `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md`, `package-lock.json`, dependency names or versions, `angular.json`, `tsconfig*.json`, `apps/**`, `packages/**`, `config/**`, the architecture model or checker, the earlier verifiers and negative runners, or any file under `work-packages/IB0-WP01..04/` or `evidence/IB0-WP01..04/`. GitHub branch protection and rulesets are not changed.

## 5. Out of scope

| Item | Owner / disposition |
| --- | --- |
| Lint/format tooling and a lint CI stage | **DEFERRED — approved controlled deferral** (PO/SA, 2026-09-25); activation trigger in §5.1 |
| Unit-test runner and a unit-test CI stage | **DEFERRED — approved controlled deferral** until meaningful executable behaviour exists (PO/SA, 2026-09-25); activation trigger in §5.1 |
| Activating required checks on `main` | Design APPROVED (PO/SA, 2026-09-25); technically ADVISORY until GitHub capability permits; activation trigger in §5.1 |
| SBOM generation, vulnerability-scan gate, release licence approval | Release gate (IB-01 §18.1, EQP §22(v)-(vi)); EG/IP owner |
| macOS/Windows CI runners | Not required by a controlled source; residual risk |
| IB1 and later; Nx | Not started / NOT REQUIRED |

### 5.1 Activation triggers (PO/SA, 2026-09-25)

**Lint/format activation trigger** (PO/SA, 2026-09-25). Before lint/format becomes a mandatory PAEP gate:
1. select the controlled tooling;
2. review dependency provenance;
3. review licences;
4. document configuration ownership;
5. define meaningful lint/format acceptance criteria;
6. integrate it into the appropriate later work package;
7. add it to `PAEP / gate` only after the capability genuinely exists.

**Unit-test activation trigger** (PO/SA, 2026-09-25). A unit-test CI stage becomes mandatory when PAEP introduces executable shared/package/component/domain/platform logic for which meaningful unit-level behaviour can be specified and tested. At that point:
1. select or use the approved Angular/TypeScript testing mechanism;
2. create real behavioural tests;
3. establish coverage/quality expectations where controlled requirements justify them;
4. integrate the unit-test result into `PAEP / gate`.

**Enforcement activation trigger** (PO/SA, 2026-09-25). When GitHub branch protection or rulesets become available:
1. verify `PAEP / gate` still exists on `main`;
2. verify its exact check context;
3. revalidate the prepared enforcement policy;
4. apply the approved protection/ruleset;
5. verify a failing `PAEP / gate` blocks merge;
6. capture evidence.

Until enforcement is active, CI is technically advisory, and PAEP engineering governance continues to require a green `PAEP / gate` before acceptance and merge through the controlled PO/SA process.

## 6. Accepted historical-verifier behaviour (bounded exceptions, approved with the definition)

The earlier verifiers are kept unchanged. `verify-ib0-wp05.mjs` runs them and accepts only these failures, each limited to the exact findings WP05 can cause:

| Verifier | Check | Accepted finding |
| --- | --- | --- |
| `qa:ib0-wp04` | V16 | `package.json` scripts differ; W06 proves only the three WP05 scripts were added and the lockfile is identical |
| `qa:ib0-wp04` | V17 | `.github/**` present and paths outside WP04 §4, every one WP05-permitted |
| `qa:ib0-wp04` | V22 | WP03 re-evaluated (W21) with WP04 ∪ WP05 permitted paths |
| `qa:ib0-wp04` | V23 | WP02 re-evaluated (W22); V17 may add only `.github/workflows` |
| `qa:ib0-wp04:negative` | C3 | positive control fails exactly V16 and V17 (the W17 bound) |
| `qa:ib0-wp03:negative` | whole run | exit 1 with the known TypeError at line 125 while `paths` lives in `tsconfig.base.json` (since WP04; strictness negatives carried by WP04 S1–S9 and WP05 S01–S04) |
| `qa:ib0-wp03`, `qa:ib0-wp02` | as accepted at WP03/WP04 | unchanged bounds, plus WP05 paths |

## 7. Required evidence

Under `evidence/IB0-WP05/`: definition audit; local verification logs (`npm ci`, builds, `qa:ib0-wp05` full, `qa:ib0-wp05:negative`, `qa:types`, earlier verifiers); real GitHub Actions run IDs, job/check inventory and job logs or summaries; negative CI evidence; workflow security review; independent QA report; residual-risk record; acceptance-readiness report. Design documents under `docs/`.

## 8. Completion rule

Technical PASS requires every mandatory criterion in `ACCEPTANCE.md` to pass with evidence. ACCEPTED, merge and enforcement activation are PO/SA decisions.
