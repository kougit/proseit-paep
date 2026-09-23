# IB0-WP01 Evidence Folder

Retain evidence generated while executing and independently reviewing IB0-WP01.

Source commit under test: `b9904d023a5a8a8df6c4d9b9900b48188ff5095f` (Node 24.21.0, npm 11.19.0). Status: technical PASS; independent QA PASS (head `1d722c33c3cf5a0571dd2504df9766f9557387f3`); ACCEPTED by the Product Owner / Solutions Architect on 2026-09-23.

| Path | Expected evidence | Present |
| --- | --- | --- |
| `logs/npm-ci.log` | Clean dependency installation | Yes (exit 0) |
| `logs/build-reference-app.log` | Reference application production build | Yes (exit 0) |
| `logs/build-ui-lab.log` | UI laboratory production build | Yes (exit 0) |
| `reports/ib0-wp01-verification.json` | Machine-readable repository verification | Yes (result PASS, 15/15) |
| `reports/toolchain-baseline.md` | Exact toolchain versions selected/generated | Yes |
| `reports/dependency-baseline.md` | Material direct dependency inventory and provenance | Yes |
| `reports/independent-qa.md` | Independent QA assessment | Yes (QA PASS; AC01–AC15 and checks (i)–(x) PASS) |
| `notes/implementation-summary.md` | Bounded implementation summary and known limitations | Yes |

Supplementary evidence:

| Path | Evidence |
| --- | --- |
| `logs/verify-ib0-wp01.log` | Console output of `node tooling/verification/verify-ib0-wp01.mjs` (exit 0) |
| `logs/clean-clone-reproduction.log` | `npm ci` and both production builds from a fresh `git clone` of the implementation commit (all exit 0) |
| `logs/scope-and-secret-scan.log` | Scope (AC12) and secret (AC13) scan of every new or modified file, with manual triage of matches |
| `logs/ng-version.log` | `ng version` output (installed vs requested versions) |
| `logs/independent-qa/` | Raw output of the independent QA re-run from a fresh clone on Node 24.21.0: `npm ci`, both builds, verifier, `ng version`, `npm ls`, `npm audit`, `validate-pack.mjs`, environment and build-output listing, fresh vs committed verification JSON |

Do not store credentials, access tokens or private environment values in evidence.
