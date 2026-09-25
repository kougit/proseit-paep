# IB0-WP05 Technical Verification

**Code commit under test:** `089f8640b07cfdbf880601903543513b27776784`. It is the last commit that changes `.github/`, `tooling/` or `package.json`; later commits change evidence and work-package records only.
**Local reproduction:** a fresh `git clone` of GitHub at that commit, on Node 24.21.0 / npm 11.19.0 (linux-x64), 2026-09-24T20:06Z. The clone started with no `node_modules`, `dist` or `.angular`. Logs are in `evidence/IB0-WP05/logs/`, summarised in `clean-clone-reproduction.log`.
**GitHub:** run 36052554946 on the same commit, all 10 checks successful (`github-actions-run.md`).
**Baseline:** IB0-WP04 merge commit `c5c0eb0`.

## Gates

| Command / check | Local (fresh clone) | GitHub run 36052554946 | Evidence |
| --- | --- | --- | --- |
| Toolchain (`--gate toolchain`, W01) | node 24.21.0, npm 11.19.0 | PASS 1/1, in every job's setup | `logs/toolchain-versions.log`; job logs |
| `npm ci` | exit 0, 324 packages | exit 0 in every job | `logs/npm-ci.log` |
| Lockfile/tracked tree unchanged; lockfile identical to `c5c0eb0` | exit 0; sha256 `be1154cb…6b69` | same sha256 | `logs/lockfile-unchanged.log` |
| `npm run build:reference-app` / `build:ui-lab` | exit 0 / exit 0 | success / success, plus W25 build manifest | `logs/build-*.log` |
| `npm run qa:architecture` | PASS, 0 violations | success | `logs/qa-architecture.log` |
| `npm run qa:types` (ngc strict TS and templates, both apps) | exit 0 | success (strictness) | `logs/qa-types.log` |
| `npm run qa:ib0-wp05` (full, W01–W24) | **PASS 24/24** | governance 8/8, provenance 8/8, strictness, negative-architecture, regression all PASS | `logs/verify-ib0-wp05-full.log`; `reports/ib0-wp05-verification.json` |
| `npm run qa:ib0-wp05:negative` | **PASS 87/87** (10 controls, 77 negatives) | success (negative-ci) | `logs/negative-ci-tests.log`, `.detail.log`; `reports/negative-ci-tests.json` |
| `npm audit signatures` | not runnable here (the proxy blocks the registry signature endpoint) | 306 verified signatures, 102 verified attestations | run 36052554946 security-provenance log |
| Earlier WP records unchanged after the run | exit 0, no diff | n/a | `logs/post-run-git-status.log` |

## Verifier checks (W01–W24, fresh clone)

| ID | Check | Result |
| --- | --- | --- |
| W01 | Toolchain pins | PASS: node 24.21.0; npm 11.19.0 |
| W02 | Controlled sources and CLAUDE.md | PASS: 13/13 |
| W03 | IR-01 §4.2 topology, no nested manifest | PASS: 26 entries; 19 manifests |
| W04 | No Nx | PASS |
| W05 | No IB1 artefact | PASS: 18 placeholder entry points |
| W06 | Lockfile identical; only the three WP05 scripts added | PASS |
| W07 | Scope within WORK_PACKAGE §4 (diff with `--no-renames`) | PASS |
| W08 | Secrets | PASS: none |
| W09 | One workflow; exact triggers; top-level keys; per-PR / per-commit concurrency | PASS |
| W10 | Permissions `contents: read`; gate `{}` | PASS |
| W11 | Nine parallel jobs; exact commands; pinned checkout and upload inputs | PASS |
| W12 | Gate: needs, `always()`, no permissions, exact reviewed script, runner, timeout | PASS |
| W13 | Expressions, secrets, credentials | PASS |
| W14 | SHA pinning and register | PASS |
| W15 | Setup steps equal the reviewed steps; npm ci only; cache | PASS |
| W16 | WP02 supply-chain controls | PASS: 19/20, V17 bounded |
| W17 | WP04 static | PASS: 17/19, V16/V17 bounded |
| W18 | WP04 negative suite | PASS: 85/86, C3 bounded |
| W19 | WP03 negative runner | PASS: bounded crash at `negative-ib0-wp03.mjs:125` |
| W20 | WP04 full | PASS: 20/24, V16/V17/V22/V23 bounded |
| W21 | WP03 re-evaluated; earlier records unchanged | PASS: 13/18, V05/V08/V10/V12/V17 bounded |
| W22 | WP02 re-evaluated | PASS: 19/20, V17 bounded |
| W23 | WP01 | PASS: 15/15 |
| W24 | `qa:types` | PASS |

W25 (build manifest) runs only in the two build jobs; it passed in run 36052554946.

## Negative CI-control cases (brief §17)

| Brief item | Cases | Result |
| --- | --- | --- |
| (i)–(iv) gate fails for a failed, cancelled, skipped or timed-out job; (x) gate/job structure | G00–G18, X01–X04, P15, P24 | PASS |
| (ii) strict TypeScript and templates | S01–S04 (controls C03, C07) | PASS |
| (iii) architecture | A01–A04 (control C04) | PASS |
| (iv) harness failure | H01, H02 (control C08) | PASS |
| build | B01 | PASS |
| (v)–(vi) lockfile drift and install changes to the tree | C06, L00–L03 | PASS |
| (vii) toolchain | T01–T06 (control C05) | PASS |
| (viii) install scripts and setup weakening | I01–I04, P18, P19, P21, P22 | PASS |
| (ix) controlled files and records | F01–F04 | PASS |
| (xi) actions, permissions, triggers, secrets, dependencies, YAML parsing | P01–P14, P16, P17, P20, P23 | PASS |
| (xii) Nx, IB1, lint configuration | N01–N03 | PASS |

Every case runs in a scratch copy with `node_modules` hard-linked. The working repository is never mutated.

## Acceptance criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC01 | PASS | `2dac72a` (plan only) precedes every `.github`/`tooling`/`package.json` commit (`git log --reverse`; confirmed by QA lane 3) |
| AC02 | PASS | W09; P06, P13; runs 2, 4, 5 |
| AC03 | PASS | W09; `paep-ci-${{ github.event.pull_request.number \|\| github.sha }}`, cancel only for `pull_request` |
| AC04 | PASS | W11; X03, X04; run 5 start times |
| AC05 | PASS | W12; G00–G18 (19/19), X01, X02, P15, P24; run 3 gate FAIL, run 5 gate PASS |
| AC06 | PASS | W01, W15; T01–T06, I03, P12; run 5 setup log |
| AC07 | PASS | W15; C06, L00–L03; run 5 |
| AC08 | PASS | W15; P10; cache key on the lockfile hash (run 5 log) |
| AC09 | PASS | W11, W25; B01; build jobs in run 5 |
| AC10 | PASS | W11; A01–A03; run 3 architecture failure, run 5 success |
| AC11 | PASS | W17, W24; S01–S04; run 5 |
| AC12 | PASS | W18, W19; H01, H02; run 5 |
| AC13 | PASS | W20–W23; run 5 |
| AC14 | PASS | W02–W05, W07, W08; F01–F04, A04, N01–N03 |
| AC15 | PASS | W06; L03, P11 |
| AC16 | PASS | W16; I01, I02; `npm audit signatures` on GitHub |
| AC17 | PASS | W10; P04, P05; run 5 token permissions |
| AC18 | PASS | W13; P07–P09, P17, P23 |
| AC19 | PASS | W14; P01–P03; the register; QA lane 2 verified SHAs against the upstream tags |
| AC20 | PASS | W11; P20; artifact listing (`github-actions-run.md`) |
| AC21 | PASS | 87/87 locally; negative-ci success on GitHub |
| AC22 | PASS | run 36052554946 (and 36047194635, 36050524880) |
| AC23 | PASS | run 36048105730: six jobs failed and `PAEP / gate` = failure; reverted in `b6004dc` |
| AC24 | PASS (READY) | `docs/architecture/IB0-WP05-PR-ENFORCEMENT.md` (context `PAEP / gate`, app 15368 confirmed); nothing applied |
| AC25 | PASS — APPROVED DEFERRED CAPABILITY | PO/SA decision 2026-09-25: lint/format and unit-test stages DEFERRED with activation triggers (WORK_PACKAGE §5, §5.1); no placeholder commands |
| AC26 | PASS | `independent-qa.md`: no open High or Medium finding |
| AC27 | PASS (Complete) | `evidence/IB0-WP05/README.md`; `TRACEABILITY.csv`; `ACCEPTANCE_REPORT.md` |
