# IB0-WP04 Quality Gate Runbook

Run from the root of a **fresh `git clone`** of the commit under test, on the pinned toolchain (Node 24.21.0, npm 11.19.0). Capture stdout and stderr into the named files under `evidence/IB0-WP04/logs/`, end each log with `EXIT_CODE=<n>`, and start it with the date, `node --version`, `npm --version` and `git rev-parse HEAD`. The regression checks need a committed tree.

## Positive gates

| # | Command | Evidence | Pass |
| --- | --- | --- | --- |
| (i) | `node --version; npm --version` | `toolchain-versions.log` | Equal the pins |
| (ii) | `npm ci` | `npm-ci.log` | Exit 0 |
| (iii) | `git diff --exit-code -- package.json package-lock.json` and `git diff --exit-code ac6b786 -- package-lock.json` | `lockfile-unchanged.log` | Exit 0 |
| (iv) | `npm run build:reference-app`, `npm run build:ui-lab` | `build-reference-app.log`, `build-ui-lab.log` | Exit 0 |
| (v) | `npx ng version` | `ng-version.log` | Angular/CLI 22.1.8, TypeScript 6.0.3 |
| (vi) | `npm run arch:check` | `arch-check-cli.log` | Exit 0, 0 violations |
| (vii) | `npm run qa:ib0-wp04` | `verify-ib0-wp04.log`, `reports/ib0-wp04-verification.json`, `reports/project-graph.json` | PASS 24/24 |
| (viii) | WP03 regression (run by the verifier; runs WP02 then WP01) | `verify-ib0-wp0{3,2,1}-regression.log`, `ib0-wp0{3,2,1}-verification.regression.json` | WP03 13/18 + bounded V05/V08/V10/V12/V17; WP02 19/20 + bounded V17; WP01 15/15 |
| (ix) | `git status --porcelain --untracked-files=no`; `git diff --exit-code ac6b786 -- evidence/IB0-WP0{1,2,3} work-packages/IB0-WP0{1,2,3}` | `post-run-git-status.log` | Only `evidence/IB0-WP04/`; empty diff |
| (x) | PACK_MANIFEST SHA-256 check; `git diff --stat ac6b786 HEAD -- .paep-control .gitignore PACK_MANIFEST.json CLAUDE.md` | `controlled-source-integrity.log` | 13/13; empty diff |
| (xi) | Changed files, out-of-scope files, Nx, apps/packages diff, entry points, secret signatures | `scope-and-secret-scan.log` | 0 violations |

## Negative gates (scratch copy; the runner never touches the working tree)

```text
npm run qa:ib0-wp04:negative
```

Evidence: `negative-tests.log`, `negative-architecture-tests.log`, `reports/negative-tests.json`. Pass: 42/42 — C0–C3 pass; N01–N27 and N30–N38 each make the checker exit 1 with the expected rule; N28–N29 each fail verifier check V15.

## Failure rule

Any non-zero exit on a positive gate, or an unexpected result in a negative case, is a technical FAIL. Diagnose and repair the cause, rerun the failed gate and the affected regression gates. Never weaken a criterion, a model rule or a test to obtain PASS, never edit the architecture model to accept a violation without an approved ADR, and never bypass the pins (`--force`, `--engine-strict=false`, `--ignore-scripts`).
