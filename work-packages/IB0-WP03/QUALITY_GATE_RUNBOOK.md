# IB0-WP03 Quality Gate Runbook

Run from the root of a **fresh `git clone`** of the commit under test, on the pinned toolchain (Node 24.21.0, npm 11.19.0). Capture stdout and stderr into the named files under `evidence/IB0-WP03/logs/`, end each log with `EXIT_CODE=<n>`, and start it with the date, `node --version`, `npm --version` and `git rev-parse HEAD`. The regression checks need a committed tree: run them on a clone, not on uncommitted edits.

## Positive gates

| # | Command | Evidence | Pass |
| --- | --- | --- | --- |
| (i) | `node --version; npm --version` | `toolchain-versions.log` | Equal the pins |
| (ii) | `npm ci` | `npm-ci.log` | Exit 0 |
| (iii) | `git diff --exit-code -- package.json package-lock.json` and `git diff --exit-code de13629 -- package-lock.json` | `lockfile-unchanged.log` | Exit 0 |
| (iv) | `npm run build:reference-app`, `npm run build:ui-lab` | `build-reference-app.log`, `build-ui-lab.log` | Exit 0 |
| (v) | SHA-256 of every `dist/` file compared with a build of `de13629` | `build-output-vs-baseline.log` | Identical (the explicit flags equal the former defaults) |
| (vi) | `npx ng version` | `ng-version.log` | Angular/CLI 22.1.8, TypeScript 6.0.3 |
| (vii) | `npm run qa:ib0-wp03` | `verify-ib0-wp03.log`, `reports/ib0-wp03-verification.json` | PASS 18/18 |
| (viii) | WP02 and WP01 regression (run by the verifier, WP02 first) | `verify-ib0-wp02-regression.log`, `verify-ib0-wp01-regression.log`, `ib0-wp0N-verification.regression.json` | WP02 19/20 with V17 flagging only WP03-permitted paths; WP01 15/15 |
| (ix) | `git status --porcelain --untracked-files=no`; `git diff --exit-code de13629 -- evidence/IB0-WP01 evidence/IB0-WP02 work-packages/IB0-WP01 work-packages/IB0-WP02` | `post-run-git-status.log` | Empty |
| (x) | PACK_MANIFEST SHA-256 check; `git diff --stat de13629 HEAD -- .paep-control .gitignore PACK_MANIFEST.json CLAUDE.md` | `controlled-source-integrity.log` | 13/13; empty diff |
| (xi) | Changed-file list, out-of-scope files, Nx, dependency diff, entry-point content, secret signatures | `scope-and-secret-scan.log` | 0 violations |

## Negative gates (scratch copy; the runner never touches the working tree)

```text
npm run qa:ib0-wp03:negative
```

Evidence: `negative-strictness.log`, `negative-verifier-mutations.log`, `reports/negative-tests.json`. Pass: 23/23 cases as expected — B1 and B2 fail the build with TS7006/TS2322 and TS2345; their controls B1c and B2c build only with the flag switched off; M0 passes; M1–M17 each fail the verifier on the named check.

## Failure rule

Any non-zero exit on a positive gate, or an unexpected result in a negative case, is a technical FAIL. Diagnose and repair the cause, rerun the failed gate and the affected regression gates. Never weaken a criterion, a compiler option or a test to obtain PASS, and never bypass the pins (`--force`, `--engine-strict=false`, `--ignore-scripts`).
