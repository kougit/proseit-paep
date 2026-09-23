# IB0-WP01 Acceptance Criteria

A criterion is mandatory unless explicitly marked N/A by an authorised reviewer. Claude may not convert a mandatory criterion to N/A.

| ID | Acceptance criterion | Verification | Required result |
| --- | --- | --- | --- |
| IB0-WP01-AC01 | Controlled sources and current work package were read before implementation; intended file changes were recorded. | Implementation plan | PASS |
| IB0-WP01-AC02 | Repository root is a valid Angular workspace using the controlled Angular 22.x family and npm. | Workspace metadata + toolchain report | PASS |
| IB0-WP01-AC03 | `apps/reference-app` exists as a minimal Angular application and has no product-specific business workflow. | File review + build | PASS |
| IB0-WP01-AC04 | `apps/ui-lab` exists as a minimal Angular application and has no production design-system implementation beyond bootstrap needs. | File review + build | PASS |
| IB0-WP01-AC05 | Required PAEP package/tooling/config/docs/evidence directories exist with the ownership topology defined by PAEP-IB-01. | Verifier | PASS |
| IB0-WP01-AC06 | `package-lock.json` exists and npm is the declared repository package manager. | File review | PASS |
| IB0-WP01-AC07 | Fresh `npm ci` succeeds using the committed lockfile. | `npm-ci.log` | Exit 0 |
| IB0-WP01-AC08 | `reference-app` production build succeeds. | build log | Exit 0 |
| IB0-WP01-AC09 | `ui-lab` production build succeeds. | build log | Exit 0 |
| IB0-WP01-AC10 | `node tooling/verification/verify-ib0-wp01.mjs` reports PASS and emits JSON evidence. | verifier report | PASS |
| IB0-WP01-AC11 | Exact bootstrap versions and material direct dependencies are recorded for WP02 pinning/review. | toolchain/dependency reports | PASS |
| IB0-WP01-AC12 | No Frappe integration, analytics UI, offline queue, enterprise-shell feature, domain workflow or proprietary commercial template dependency was added. | Scope review | Zero violations |
| IB0-WP01-AC13 | No credential, secret, private key, database credential or access token is committed in new/modified text configuration files. | Review / secret scan if available | Zero findings |
| IB0-WP01-AC14 | Required evidence is retained under `evidence/IB0-WP01/`. | Evidence index | Complete |
| IB0-WP01-AC15 | Traceability maps requirements → implementation → verification → evidence. | `TRACEABILITY.csv` | Complete |

## Technical result rule

(i) **PASS** requires AC01–AC15 to pass.

(ii) Any failed mandatory criterion means status remains IN PROGRESS or FAILED.

(iii) BLOCKED is permitted only where an external decision, environment limitation or architecture conflict prevents a legitimate fix.

(iv) Human **ACCEPTED** status may be recorded only after technical PASS.
