# IB4-FRAPPE-ADAPTER — S5 reference binding, design and README

**Status:** PASS (local). Technical PASS is not PO/SA ACCEPTED.

## Change

| Path | Change |
| --- | --- |
| `apps/reference-app/src/app/frappe-binding.ts` | New. Backs the shell's existing session and access ports with the adapter, loaded by one dynamic `import()`. Compatibility first: a blocked or unverifiable backend locks navigation with the existing `environment` state and reports kind `version`; then the session: authenticated fills the identity, no session goes to the server-hosted login (current path, `/` if unsafe), invalid reports `unknown`. Sign-out is server-authoritative. No screen, route, dialog or copy. |
| `apps/reference-app/src/app/app.config.ts` | Creates the binding only outside the `development` environment with `frappe-session` identity, and starts it from an environment initializer with the shell error reporter. The shipped runtime configuration is `development`, so the reference app keeps its sample data. |
| `apps/reference-app/src/app/shell-sample.ts` | `referenceShellOptions(store, backend?)` takes the binding's session and access ports when given; exports the sample access rules as the binding's fallback. |
| `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md` | New design record (shape, transport, errors, pmra-api-v1, resource map, workflow, files, freshness, reference binding, same-site deployment and CSP `connect-src`, verification). |
| `packages/frappe-sdk/README.md` | Placeholder replaced with the entry point, rules and verification. |
| `tooling/frappe-adapter/run-frappe-tests.mjs` | Compiles the binding with the adapter under the same strict options; maps `@angular/core` to the installed ESM entry; pins `reference-binding.test.mjs` at 7. |
| `tooling/frappe-adapter/test/unit/reference-binding.test.mjs` | New, 7 tests with the real compiled adapter against the scripted backend. |

## Results (logs in `logs/` and `../s2-s4/logs/`)

| Gate | Result |
| --- | --- |
| Binding tests | PASS 7/7 (in unit 64/64). Mutation check: removing the environment lock, the repeat sign-out guard or the current return path each fails the suite. |
| `npm run qa:types` (both applications, strict templates) | PASS |
| `qa:enterprise` E01–E12 (E01 lazy-only adapter import, E05 no redirect primitive, E08 no login literal) | PASS 12/12 |
| Architecture | PASS — 20 projects, 20 edges (1 optional), 0 cycles, 0 violations |
| Bundle composition C1–C7 | PASS 7/7 — no Frappe SDK source in the initial bundle; the adapter is a 24.57 kB lazy chunk |
| Initial bundle (DDR-IB3-07 B1) | 519,868 raw bytes (hard maximum 525,000; transfer within 150,000). +2,304 bytes against the prior build (517,564) for the binding. The Angular 500 kB warning is the reported engineering target, already exceeded before IB4. |

## Decisions taken within scope

* The return path is the browser's same-origin path and query (it includes the deployment base path, which a router
  URL would not), read without a redirect primitive; the adapter validates it (`safeReturnPath`) before use. This
  matches ADR-011 §2.6 (same-site deployment, same-origin relative return path).
* `@angular/common` is not imported by the reference app (E01 allowlist unchanged).

## Diagnosis recorded during S5

* The first full sequential regression on the S5 commit failed WP05 W18 and WP05 part b C08: the WP04 control S1c
  (the reference app must still build once `strict` and `noImplicitAny` are false) did not build. Root cause: the
  lazy `import()` makes the adapter source part of the application build, and the compatibility range check in
  `packages/frappe-sdk/src/lib/compatibility.ts` relied on `strictNullChecks` narrowing (TS2345/TS2322 with strictness
  off). Fix: the maximum PAEP version is typed explicitly (`string | null`). No gate, control or criterion changed.
* Rerun on the fixed tree, one suite at a time: adapter unit 64/64, integration 37/37, static QA 9/9, negatives 36/36,
  `qa:types` PASS, production build PASS, bundle composition 7/7, enterprise QA 12/12, WP05 part b 32/32, WP05 full
  25/25. Earlier in the same run on this commit: baseline 13/13, baseline negatives 105/105, contracts 200/200,
  architecture PASS, enterprise negatives 63/63, design-system extension negatives 34/34, shell browser QA 22/22,
  shell browser negatives 57/57, IB2 CI negatives 27/27, IB3 CI negatives 20/20, IB4 CI negatives 9/9, WP05 part a
  26/26, part c 47/47.
