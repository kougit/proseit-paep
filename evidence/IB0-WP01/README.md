# IB0-WP01 Evidence Folder

Retain evidence generated while executing and independently reviewing IB0-WP01.

Source commit under test: `b9904d023a5a8a8df6c4d9b9900b48188ff5095f` (Node 24.21.0, npm 11.19.0). Status: technical PASS; human acceptance pending.

| Path | Expected evidence | Present |
| --- | --- | --- |
| `logs/npm-ci.log` | Clean dependency installation | Yes (exit 0) |
| `logs/build-reference-app.log` | Reference application production build | Yes (exit 0) |
| `logs/build-ui-lab.log` | UI laboratory production build | Yes (exit 0) |
| `reports/ib0-wp01-verification.json` | Machine-readable repository verification | Yes (result PASS, 15/15) |
| `reports/toolchain-baseline.md` | Exact toolchain versions selected/generated | Yes |
| `reports/dependency-baseline.md` | Material direct dependency inventory and provenance | Yes |
| `reports/independent-qa.md` | Independent QA assessment | Not yet: produced by the separate independent QA run (`prompts/02_INDEPENDENT_QA.md`) |
| `notes/implementation-summary.md` | Bounded implementation summary and known limitations | Yes |

Supplementary evidence:

| Path | Evidence |
| --- | --- |
| `logs/verify-ib0-wp01.log` | Console output of `node tooling/verification/verify-ib0-wp01.mjs` (exit 0) |
| `logs/clean-clone-reproduction.log` | `npm ci` and both production builds from a fresh `git clone` of the implementation commit (all exit 0) |
| `logs/scope-and-secret-scan.log` | Scope (AC12) and secret (AC13) scan of every new or modified file, with manual triage of matches |
| `logs/ng-version.log` | `ng version` output (installed vs requested versions) |

Do not store credentials, access tokens or private environment values in evidence.
