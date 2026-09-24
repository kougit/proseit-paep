# IB0-WP03 Implementation Summary

## What changed

| Path | Change |
| --- | --- |
| `tsconfig.json` | `strict: true`, `noImplicitAny: true` and `strictTemplates: true` stated explicitly; `paths` with one alias per workspace package |
| `packages/*/src/index.ts` (18) | Placeholder public entry points (`export {};`) |
| `tooling/verification/verify-ib0-wp03.mjs` | Verifier, 18 checks (14 static, 2 builds, 2 regression) |
| `tooling/verification/negative-ib0-wp03.mjs` | Negative runner, 23 cases in a scratch copy |
| `package.json` | `qa:ib0-wp03` and `qa:ib0-wp03:negative` scripts |
| `docs/architecture/IB0-WP03-IMPLEMENTATION-PLAN.md`, `docs/adr/ADR-REGISTER.md` | Plan; "no ADR needed" note |
| `work-packages/IB0-WP03/**`, `evidence/IB0-WP03/**` | Definition, criteria, runbook, traceability, report; evidence |

Not changed: `package-lock.json` and every dependency, `angular.json`, `apps/**`, `.paep-control/**`, `CLAUDE.md`, the IB0-WP01/WP02 records and verifiers.

## Commits

| Commit | Content |
| --- | --- |
| `8d7a643` | Plan and draft definition (before any configuration change, AC01) |
| `15386a9` | Configuration, entry points, verifiers, scripts, ADR note |
| `f19a422` | Evidence, traceability and reports (docs only) |
| `0f2d381` | Verifier hardening after independent QA round 1 (F1, F3, F5, F6) |
| later | Re-recorded evidence and QA reports (docs only) |

## Defaults taken (all four confirmed by the PO/SA on 2026-09-24; see `closure-authorisation.md`)

| Topic | Default | Alternative |
| --- | --- | --- |
| Lint/format tooling | Deferred; no new dependencies; lockfile unchanged | Add ESLint/angular-eslint/typescript-eslint/Prettier in WP03 |
| WP02 verifier V17 | Left untouched; bounded exception checked by WP03 V17 | Amend WP02 V17 to check WP02's own merged range |
| `tsconfig.base.json` | Deferred to IB0-WP04 with `nx.json` | Create in WP03 |

## Notes for later work packages

(i) The WP01 verifier rewrites its tracked JSON; run WP02 regression before WP01, or restore in between (WP03 V17/V18 do this).

(ii) Both earlier verifiers need a committed tree. WP02 V13 compares `package.json` with `HEAD`, and V17 lists untracked files in protected paths.

(iii) IB0-WP04 can build deep-import enforcement on the aliases: every package has exactly one published path.
