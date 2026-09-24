# IB0-WP05 Implementation Plan — CI, Automated Quality Gates, Security/Provenance and PR Enforcement Baseline

**Work package:** IB0-WP05 (PAEP-IR-01 §4.4 IB0-WP5)  
**Authorised by:** Product Owner / Solutions Architect, project thread instruction "IB0-WP05 — CI/CD, AUTOMATED QUALITY GATES, SECURITY/PROVENANCE AND PULL-REQUEST ENFORCEMENT BASELINE" (2026-09-24T18:39Z)  
**Baseline:** IB0-WP04 merge commit `c5c0eb028e31763090ffcdf2a3ab6e22a41fc24a` on `main`  
**Status of this plan:** written before any workflow, tooling or `package.json` change (CLAUDE.md execution discipline 2; EQP §11)

## 1. Sources read

CLAUDE.md; `.paep-control/SOURCE_OF_TRUTH.md`; PAEP v1.1 (CI mentions §3, §5.3); PAEP-IB-01 §4.1 (toolchain table: "CI uses npm ci; lockfile drift is release-blocking"), §18.1 (required CI gates), §21; PAEP-IR-01 §4.4 IB0-WP5, §4.5 (IB0 CI acceptance gates), §4.6 (exit criteria), §7.2(i), Appendix A and B; PAEP-EQP-01 §15 (quality gate matrix), §22, §23, §24, §29.1, Appendix B (QA command naming), Appendix C (status model). WP01–WP04 work packages, acceptance reports and verifiers. No WP05 material existed in the repository.

## 2. Preflight results (2026-09-24, Node 24.21.0 / npm 11.19.0)

| Item | Result |
| --- | --- |
| PR #4 merged; `origin/main` = `c5c0eb0` | PASS |
| WP01–WP04 work packages and evidence present; WP04 `work-package.json` status ACCEPTED | PASS |
| `npm ci` clean; `package-lock.json` sha256 `be1154cb…6b69` unchanged | PASS |
| Both production builds | PASS |
| `arch:check`; `qa:ib0-wp04` 24/24; `qa:ib0-wp04:negative` 86/86; `qa:ib0-wp01` 15/15 | PASS |
| `qa:ib0-wp03` 13/18 and `qa:ib0-wp02` 19/20 | Expected: bounded exceptions accepted at WP03/WP04 closure |
| `qa:ib0-wp03:negative` | Crashes at case M11 (WP04 moved `paths` to `tsconfig.base.json`); known, covered by WP04 S1–S9 |
| No Nx; no IB1 artefacts; no `.github/` directory | PASS |
| GitHub: repository private, default branch `main`, no branch protection; rulesets and branch protection API return 403 "Upgrade to GitHub Pro or make this repository public" | Recorded; affects enforcement activation only (§6) |

## 3. Scope derived from the controlled sources

IR-01 §4.4 IB0-WP5: "Create baseline CI stages for install, lint, type-check, unit test, build and architecture verification." Required evidence: "Successful CI run from clean source checkout." IR-01 §4.5 gates: clean install, build, type safety, architecture, circular dependencies, public API discipline, unit baseline, reproducibility.

| Stage | Disposition in WP05 |
| --- | --- |
| Install | `npm ci` from the committed lockfile in every job; toolchain enforced first; tracked tree must be unchanged afterwards |
| Type-check | New `qa:types` (EQP App. B name): `ngc --noEmit` strict type and template check of both applications, which compile every package entry point through the aliases. Uses the pinned `@angular/compiler-cli`; no new dependency |
| Build | Both production builds, as separate parallel jobs |
| Architecture, cycles, public API | Existing `qa:architecture` (WP04) plus the WP04 negative suite |
| Lint | No linter exists. Lint/format were deferred by the PO/SA at WP03 closure pending an owning work package with dependency and licence review. Default taken: **deferred**, recorded as an open IB0 exit item. Decision card posted to the PO/SA |
| Unit test | No unit-test runner or unit test exists (IB-01 names Vitest, a new dependency). "Current deterministic unit tests pass" is vacuous today. Same default and decision card as lint. No placeholder command is added |
| Reproducibility | Every job starts from a fresh GitHub-hosted checkout |

Also in scope from the PO/SA brief and the accepted deferrals: CI for pushes to `main` and manual dispatch (WP02 deferred "CI" and "`npm audit signatures`" to WP05); toolchain and install-script enforcement using the WP02 controls; WP01–WP04 regression with their accepted bounded exceptions; action provenance; least-privilege permissions; evidence artifacts; stable aggregate gate; an enforcement design for `main`.

Out of scope: lint/format and unit-test tooling (pending decision), SBOM generation and release licence approval (release gate, EG/IP owner), macOS/Windows CI matrix (not required by a controlled source; noted as residual), IB1 and later work, Nx.

## 4. Design

### 4.1 Workflow topology

One workflow, `.github/workflows/paep-ci.yml` (`name: PAEP CI`). Nine mandatory jobs with no `needs`, so they run in parallel from clean checkouts, and one aggregate job:

| Job id | Check name | Runs |
| --- | --- | --- |
| governance | PAEP / governance | `qa:ib0-wp05 --gate governance`: controlled-file fingerprints, CLAUDE.md, repository topology, toolchain manifest consistency, no Nx, no IB1, WP05 scope, secrets scan |
| provenance | PAEP / security-provenance | `qa:ib0-wp05 --gate provenance`: workflow triggers, permissions, injection and credential rules, action pinning against the register, install-script and lockfile provenance (WP02 V06/V12/V14/V15 reused); then `npm audit signatures` |
| architecture | PAEP / architecture | `npm run qa:architecture` |
| strictness | PAEP / strictness | `npm run qa:types`; `qa:ib0-wp05 --gate strictness` (WP04 static V04–V07 reused) |
| negative-architecture | PAEP / negative-architecture | `qa:ib0-wp05 --gate negative-architecture`: WP04 negative suite (bounded C3) and WP03 negative runner (bounded crash) |
| negative-ci | PAEP / negative-ci | `npm run qa:ib0-wp05:negative`: tests of the CI controls themselves |
| regression | PAEP / regression | `qa:ib0-wp05 --gate regression`: WP04 full verifier, which runs WP03, WP02 and WP01, with every bounded exception re-evaluated |
| build-reference-app | PAEP / build-reference-app | `npm run build:reference-app` |
| build-ui-lab | PAEP / build-ui-lab | `npm run build:ui-lab` |
| gate | PAEP / gate | `needs` all nine; `if: always()`; fails unless the set of needs equals the mandatory list and every result is `success` |

Shared setup is a local composite action, `.github/actions/paep-setup/action.yml`: `actions/setup-node` from `.nvmrc`, npm download cache, toolchain gate, `npm ci`, and a tracked-tree-unchanged check.

### 4.2 Security

`pull_request` (never `pull_request_target`); top-level `permissions: contents: read`; gate job `permissions: {}`; no `secrets.*`; `persist-credentials: false`; no `${{ }}` expression inside any `run:` script (values reach scripts only through `env:`); actions pinned to full commit SHAs with a version comment and listed in `docs/provenance/GITHUB-ACTIONS-REGISTER.md` and `tooling/verification/ib0-wp05-ci-policy.json`; `npm ci` keeps the WP02 install-script policy (`strict-allow-scripts`, all five denied). The npm cache holds registry tarballs whose sha512 is checked against the lockfile by `npm ci`; `node_modules` is never cached.

### 4.3 Historical verifiers

The WP01–WP04 verifiers and negative runners are not edited. The WP05 verifier runs them and accepts only these failures, each checked against the exact findings the WP05 change can cause:

| Verifier | Check | Why it fails after WP05 | Bounded condition |
| --- | --- | --- | --- |
| WP04 | V16 | `package.json` gains the WP05 scripts | only `scripts` differ, by exactly the WP05 scripts; lockfile identical |
| WP04 | V17 | `.github/**` exists; WP05 paths are outside WP04 §4 | every listed path is WP05-permitted |
| WP04 | V22 | WP03 V12 now also lists WP05 paths | WP03 JSON re-evaluated with WP04 ∪ WP05 permitted paths |
| WP04 | V23 | WP02 V17 now also reports `.github/workflows` | WP02 JSON re-evaluated with that one extra finding |
| WP04 negative | C3 | positive control fails V16/V17 | only C3 fails, with exactly V16 and V17 |
| WP03 negative | whole run | crashes at M11 since WP04 | exit 1 with the known TypeError at `negative-ib0-wp03.mjs:125` and `tsconfig.json` without `paths` |

### 4.4 Negative CI-control tests

`tooling/verification/negative-ib0-wp05.mjs` runs in a scratch copy and executes the gate script taken from the workflow file itself. It covers the twelve cases in the PO/SA brief §17 (architecture, strictness, build, negative-harness failures, lockfile, Node, npm, install-script, fingerprint, skipped/cancelled/missing job, unapproved action or permission, prohibited architecture change).

## 5. Intended file changes

New: `.github/workflows/paep-ci.yml`; `.github/actions/paep-setup/action.yml`; `tooling/verification/verify-ib0-wp05.mjs`; `tooling/verification/negative-ib0-wp05.mjs`; `tooling/verification/ib0-wp05-ci-policy.json`; `docs/architecture/IB0-WP05-IMPLEMENTATION-PLAN.md`; `docs/architecture/IB0-WP05-CI-DESIGN.md`; `docs/provenance/GITHUB-ACTIONS-REGISTER.md`; `work-packages/IB0-WP05/**`; `evidence/IB0-WP05/**`.  
Modified: `package.json` (scripts `qa:types`, `qa:ib0-wp05`, `qa:ib0-wp05:negative` only); `docs/adr/ADR-REGISTER.md` and `docs/provenance/PROVENANCE-REGISTER.md` (work-package notes).  
Unchanged: `.paep-control/**`, `.gitignore`, `PACK_MANIFEST.json`, `CLAUDE.md`, `package-lock.json`, dependencies, `angular.json`, `tsconfig*.json`, `apps/**`, `packages/**`, all WP01–WP04 verifiers, work packages and evidence.

## 6. PR enforcement

Branch protection and rulesets are unavailable for this private repository on its current GitHub plan (API 403). WP05 therefore prepares the configuration and records the exact check context from the real run, and changes no protection. Activation needs a PO/SA decision on plan or visibility, after the workflow is on `main`.

## 7. ADR

None needed: CI and quality gates are controlled by IB-01 §18.1 and IR-01 §4.4–§4.5; no dependency direction, package or deployable boundary changes.
