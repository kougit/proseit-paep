# IB4-FRAPPE-ADAPTER — S2–S4 adapter, fixtures and tests

**Status:** PASS (local; CI 20/20 with PAEP / gate on commit 84d9529, the S2–S4 head; the exact candidate head is
recorded in the acceptance report). Technical PASS is not PO/SA ACCEPTED.

## What was built

| Step | Content |
| --- | --- |
| S2 | `packages/frappe-sdk/src/` — one transport (HTTPS origin only, `credentials: 'include'`, `redirect: 'error'`, `cache: 'no-store'`, correlation id, bounded retry, timeout), in-memory CSRF store, session, records, workflow, files, capabilities, compatibility and freshness gateways, compiled resource map, approved login redirect. Public entry point: 4 values (`createFrappeAdapter`, `compileResourceMap`, `createFreshnessPoller`, `isPaepError`) plus types. |
| S3 | `tooling/frappe-adapter/fixtures/` — 36 synthetic fixtures (conformance 14, error 12, malformed 3, security 9 across compatibility, session, records, workflow, files, capabilities, freshness), versioned manifest 1.0.0 with 4 compatibility profiles and a sha256 per file. No captured data, cookie value, CSRF token or credential. |
| S4 | `tooling/frappe-adapter/test/` — 7 unit files (57 tests at S4; S5 adds the binding file, 8 files and 64 tests in the logs here) and the conformance suite (37 tests: manifest plus one per fixture). `frappe-qa.mjs` F01–F09, `frappe-qa-negative.mjs` 35 seeded negatives plus a control (N34/N35 added: markup in a template literal, `insertAdjacentHTML`). |

## Results (logs in `logs/`)

| Gate | Result |
| --- | --- |
| Unit (`run-frappe-tests.mjs --suite unit`, includes the S5 binding file) | PASS 64/64 in 8 files, strict compile, 0 diagnostics |
| Integration conformance | PASS 37/37 |
| Static QA F01–F09 | PASS 9/9 |
| Static QA negatives | PASS 36/36 (35 negatives + 1 control) |

## Criterion mapping

| Criterion | Tests |
| --- | --- |
| AC-IB4-01 | conformance.test.mjs (every manifest case; manifest/sha256 check), F06 |
| AC-IB4-02 | session.test.mjs (8), transport.test.mjs CSRF cases, F04/F05/F07, negatives |
| AC-IB4-03 | records.test.mjs (6), transport "resources must come from compileResourceMap", F05 |
| AC-IB4-04 | workflow.test.mjs (9) |
| AC-IB4-05 | files.test.mjs (7) |
| AC-IB4-06 | transport.test.mjs error-normalisation cases; conformance leak checks on every error fixture |
| AC-IB4-07 | workflow.test.mjs concurrency / idempotency / bounded retry; transport retry cases |
| AC-IB4-08 | freshness.test.mjs (7) |
| AC-IB4-09 | compatibility.test.mjs (5), compatibility fixtures over 4 profiles |
| AC-IB4-10 | transport correlation cases; PaepError controlled-field case |

## Diagnosis recorded during S2–S4

* A local regression run showed provenance-gate failures (IB3 CI negatives P00, WP05 parts a/b I02). Root cause: the
  full WP05 verification ran in the real repository in parallel and rewrote accepted evidence records while the other
  suites copied the tree, so their copies were dirty. Rerun one at a time on the clean tree: IB3 CI negatives 20/20,
  WP05 part a 26/26, part b 32/32. No gate or criterion was changed.
