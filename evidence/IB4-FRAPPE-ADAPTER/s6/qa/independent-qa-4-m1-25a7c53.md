# Independent QA pass 4: M1 closure, IB4-FRAPPE-ADAPTER at 25a7c53

## Scope and head

- Repository `/home/claude/proseit-paep`, branch `claude/project-thread-sv4pzd`, head **25a7c53** ("IB4 M1: workflow writes through the atomic pmra-api-v1 transition method"). Parent 9c74aaf.
- Scope: finding M1 (QA pass 3, `evidence/IB4-FRAPPE-ADAPTER/s6/qa/independent-qa-3-53a59b5.md`), the nine requirements of the PO/SA M1 decision (2026-10-16, "APPROVED — ADD METHOD"), and anything the M1 change introduced.
- I reviewed the repository read-only. Every command ran on a `git archive` copy at `<reviewer scratch copy>/qa-m1/tree`.

## Method

1. I read the whole diff (17 files, +673/-57) and these files as they stand at 25a7c53: `workflow.ts`, `methods.ts`, `errors.ts`, `transport.ts`, `records.ts` (`identityOf`), `index.ts`, `resources.ts`, `test/support/backend.mjs` (`transitionBackend`), `workflow.test.mjs`, the `fixtures/workflow/transition-*.json` files, `manifest.json`, the F05 change in `frappe-qa.mjs`, N36 and N37 in `frappe-qa-negative.mjs`, `run-frappe-tests.mjs`, ADR-011, ADR-REGISTER, design §4, §4.1, §6 and §10, the README, ACCEPTANCE.md and ACCEPTANCE_REPORT.md.
2. I ran the gates on the copy (Node 24.21.0, TypeScript 6.0.3):
   - unit: PASS 71/71, workflow 16/16, strict compile with 0 diagnostics;
   - integration: PASS 39/39;
   - `frappe-qa`: PASS 9/9 (F05 includes the new rules; F06 lists 38 fixtures);
   - `frappe-qa-negative`: PASS 38/38 (37 seeded negatives plus 1 control).
3. Mutation probes on the copy's `workflow.ts`, using `<reviewer scratch copy>/qa-m1/mut.mjs`. I restored the file after each probe.

| Probe | Mutation | Result |
| --- | --- | --- |
| P1 | On any error, fall back to stock `apply_workflow`, with the name built by string concatenation so F05 cannot see it | KILLED (9 tests, including M1-B, M1-C and fail-safe) |
| P2 | Auto-reconcile: on a conflict, re-read and re-send with the fresh version | KILLED (M1-B, M1-C and others) |
| P3 | Remove the advisory version pre-check | KILLED (M1-B, M1-E, stale test) |
| P4 | Omit `expected_version` | KILLED (M1-A, M1-C, M1-D) |
| P5 | Send the re-read version instead of the caller's token | Survived. This is semantically equivalent while the pre-check exists. P3 and P5 together are killed by M1-B. |
| P6 | Drop the `id === recordId` check on the result | KILLED (fail-safe) |
| P7 | Accept a bare document (the shape stock `apply_workflow` returns) | KILLED (fail-safe) |
| P8 | Ignore the caller's idempotency key | KILLED (M1-A, M1-E and others) |
| P9 | Remove the advisory action check | KILLED |

   Against the old code (a POST to `apply_workflow`), the double throws "does not serve". The transport turns that into a retryable NETWORK_UNAVAILABLE, so M1-A, B (late), C, D, F and the fail-safe test all fail. **The tests would fail on the old code.**
4. Other probes:
   - A non-strict compile (`strict: false`, `tsconfig.base.json`) of `packages/frappe-sdk/src/index.ts`: exit 0.
   - A copy-local assertion that the advisory conflict carries a correlation id: it fails (finding Q4-M1 below).
   - Frozen-surface diff, `packages/contracts`, `package*.json`, `.github`: no change.
   - Every changed path is inside the Generation 6 `authorisedScope` (`tooling/governance/baseline-registry.json`).

## Answers to the review questions

- **Is M1 closed at the adapter/contract level? Yes.**
  - The only workflow write is `workflow.ts:81-88`: a POST to `METHOD.applyTransition` with body `{ doctype, name, action, expected_version: token }` and an `X-Idempotency-Key` (the caller's key or `newKey()`).
  - The pre-check at `workflow.ts:77-80` is advisory. The server's answer is mapped through `transport.ts:111` and `errors.ts:78-82`.
  - A success must be `{ message: { record } }` for the same record (`workflow.ts:89-92`). Anything else is MALFORMED_RESPONSE.
- **Is there any other write path or fallback? No.**
  - The adapter has only two state-changing requests, `session.ts:93` (logout) and `workflow.ts:82`.
  - `records.ts` has no writes.
  - The public entry point (`index.ts`) exports no transport and no generic method caller.
  - F05 bans the literal `apply_workflow` anywhere in the adapter (`frappe-qa.mjs:34,131`) and keeps the method name in `methods.ts` (N36, N37).
  - A concatenated-name fallback gets past F05, but the runtime tests kill it (P1: `noStockApply`, and the POST count in the fail-safe test).
  - The transport does not re-send a write except after a 429 (`transport.ts:141-142`).
- **Does the double model atomicity, and do the tests prove A–F?** Yes, as far as an in-process double can.
  - After `beforeMutation`, `backend.mjs:110-127` runs synchronously: resolve, permission, idempotency replay, version compare, action revalidation, apply, store. Nothing can interleave there. The hook stands in for a concurrent writer between the client's pre-check and the server's check (case C).
  - A: `workflow.test.mjs:123`. B (both the advisory refusal and the server refusal): `:133`. C, with reconcile and then success: `:145`. D: `:159`. E, a real concurrent double submission with the same key giving one effect, plus a key reused for another command being refused: `:165`. F: `:189`. Fail-safe: `:195`.
  - The double cannot prove the real backend's lock. That is correctly left to the backend-adoption obligation.
- **Is the method contract (design §4.1) sufficient?** Mostly. The ordering (permission, then replay, then version, then revalidate, then apply and store) is stated and correct. The transaction and `FOR UPDATE` are stated. Key scoping per user and per command is stated. Some precision gaps remain for an implementer (Q4-L1).
- **Are the error mappings correct and leak-free? Yes.**
  - Classification uses `exc_type` first, then status.
  - No prose, `exc` or `_server_messages` is read.
  - The tests assert that no "synthetic" server text appears in the errors (M1-C, M1-F).
  - The fixtures carry `exception`, `exc` and `_server_messages` as bait.
  - Server-side errors keep the correlation id. Advisory errors do not (Q4-M1).
- **Does the absent-method case fail safe? Yes.**
  - With the method absent, the backend answers 417 `ValidationError`. The adapter maps that to VALIDATION_FAILED, sends exactly one POST and applies nothing.
  - A 404, an HTML proxy page, a bare document or another record also end with one POST and a non-retryable error (`workflow.test.mjs:195-207`; fixture `transition-method-absent.json`).
  - The category is "validation", not "backend unsupported" (Q4-L2).
- **Is ADR-011 amended only where authorised, with status ACCEPTED? Yes.**
  - The status is still **ACCEPTED — PO/SA**.
  - The changes are confined to:
    - the "Amended" header row;
    - the transcription sentence;
    - §2.8, §2.12 and §4;
    - a new §8 amendment record.
  - The register note was updated.
- **Is the backend-adoption obligation recorded? Yes**, in three places: ADR-011 §4 (line 48), design §4.1 ("PAEP-IB4-BACKEND-ATOMIC-TRANSITION, OPEN", line 142) and design §10 (line 247). It is procedural only; there is no technical gate (Q4-L2).
- **Is there a regression risk?** None found.
  - The non-strict compile is clean.
  - Fixture counts and the pinned counts agree (38 fixtures, 39 conformance tests, workflow 16).
  - The negatives pass for their intended reasons.
  - `packages/contracts/src` is unchanged, and no Frappe name reaches the contracts.

## Findings

| ID | Severity | File:line | Description | Recommendation |
| --- | --- | --- | --- | --- |
| Q4-M1 | MEDIUM | `packages/frappe-sdk/src/lib/workflow.ts:19,78,80` (also `:39`) | **The advisory conflict carries no correlation id.** When the adapter's re-read already shows a newer version (the common stale case, M1-B "early"), `adapterError('RECORD_CONFLICT')` has no `correlationId`, although two correlated requests were just made. The `Latest` record drops `read.correlationId`. The same applies to the advisory `WORKFLOW_ACTION_NOT_ALLOWED` and to the `MALFORMED_RESPONSE` at `:39`, which does carry one there; only `:78` and `:80` lack it. This conflicts with M1 decision requirement 3 ("stale → controlled conflict through the existing PaepError contract; keep correlation id") and with AC-IB4-10 ("into every PaepError"). Confirmed by probe: an assertion requiring `e.correlationId` in M1-B early fails. The gap predates M1 but sits on the stale path that M1 requirement 3 governs. The fixture `transition-stale.json` and M1-B do not assert it. | Carry the re-read's correlation id in `Latest` and pass it at `:78` and `:80`. Add `correlationId` checks to M1-B early and to the `transition-stale` and `transition-denied` (advisory) expectations. |
| Q4-L1 | LOW | `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md:115-137` | **The method contract leaves implementer-visible ambiguities.** (a) "Locked … from the version read to the commit": the version read is step 5, after the replay lookup at step 4. The lock should be taken at resolution (step 2), so that two concurrent same-key requests serialise and the second sees the stored replay. Taking it later returns a conflict instead; that is still no duplicate effect. (b) The "same command" fingerprint is not defined. The double uses `[doctype, name, action, expected_version]` (`backend.mjs:116`). (c) Key scope `(user, key)`, uniqueness (needed when the same key arrives for different records under different row locks), retention period, and storing the result in the same transaction are only implied. (d) The table gives 409 for `TimestampMismatchError`, but Frappe's own class is a `ValidationError` subclass (HTTP 417). The adapter maps by `exc_type` first, so either works; the table should say that `exc_type` is authoritative. (e) Key reuse and method absent both map to `ValidationError` / VALIDATION_FAILED, so they cannot be told apart. | Tighten §4.1. Take `get_doc(…, for_update=True)` at step 2 and do the replay lookup under the lock. Define the fingerprint, the key scope and a unique constraint, retention, and same-transaction storage. State that `exc_type` decides and the status is advisory. Consider a distinct `exc_type` for key reuse. |
| Q4-L2 | LOW | `docs/adr/ADR-011-FRAPPE-ADAPTER-BOUNDARY.md:32,48`; `workflow.ts:77-88` | **`pmra-api-v1` changed meaning under the same identifier, and adoption is procedural only.** A backend built to the pre-M1 `pmra-api-v1` (two methods) still passes the compatibility check. `getState` then offers actions that fail only at write time, with a "validation"-category error. The design accepts this fail-safe outcome. Nothing technical (a capability or a compatibility field) keeps workflow writes off before adoption. That is acceptable under requirement 8 ("record an obligation"), but a later reviewer should know. | Consider a backend capability or compatibility marker for the transition method in a later generation. Until then keep the obligation OPEN in the readiness pack and cite it in the acceptance report. |
| Q4-L3 | LOW | `workflow.ts:4`, `methods.ts:15`, `backend.mjs:84`, `frappe-qa.mjs:33`, `workflow.test.mjs:2,115` | **Mis-citations.** Code comments cite "ADR-011 §8" (and "§8, §12"). In ADR-011, §8 is the *Amendment record*; the decision is §2.8 (and §2.12). Design and README cite §2.8 correctly. | Change the references to §2.8 and §2.12. |
| Q4-L4 | LOW | `work-packages/IB4-FRAPPE-ADAPTER/ACCEPTANCE_REPORT.md:3,15-16,26,29,43`; `evidence/IB4-FRAPPE-ADAPTER/s6/qa/findings-disposition.md:15`; `evidence/IB4-FRAPPE-ADAPTER/s6/logs/SUMMARY.md` | **The records lag the code.** At 25a7c53 the acceptance report still says BLOCKED with M1 open, the disposition says "OPEN — PO/SA decision requested", and the evidence logs show the old counts (64/64, 37/37, 36/36). The design record, by contrast, already says M1 is closed. The status is conservative, not overclaiming, but AC-IB4-19 requires consistent records. | Update the disposition, the report, TRACEABILITY and the evidence from the regression now running, without claiming PASS before it finishes. |
| Q4-I1 | INFO | `workflow.ts:91-96` | A 200 whose record still has `modified == expected_version` (a backend that answers success without applying) is reported as success. A replay always returns the new version, so a check would be safe. | Optional hardening: treat `version === token` on success as MALFORMED_RESPONSE. |
| Q4-I2 | INFO | `transport.ts:138-140` | The comment "stock Frappe does not de-duplicate by key" is now stale for workflow writes. The behaviour (no re-send after a timeout or 5xx) is still correct and conservative. Because of the advisory pre-check, a sequential retry with the same key gets RECORD_CONFLICT rather than the replayed success (as documented in design §6). | Update the comment. |
| Q4-I3 | INFO | `frappe-qa.mjs:34,131` | F05's `apply_workflow` ban is a literal match and can be evaded by concatenation. The runtime tests cover that case (probe P1 killed). | None required. |

## M1 verdict

**CLOSED at the adapter and contract level.**

- **Write path.** The only workflow write goes to a bounded server method that checks the caller's `expected_version` and applies the action in one backend operation. The client's check is advisory. There is no fallback to stock `apply_workflow` or to any two-call sequence, and an absent method fails safe.
- **Evidence.** The contract double models check-and-apply with no interleaving. Proofs A–F and the fail-safe case pass, would fail on the old code, and kill every realistic regression mutant I tried.
- **ADR-011** is amended only in the authorised sections and stays ACCEPTED. `@proseit/paep-contracts` is unchanged.
- **Condition.** Production closure depends on the recorded backend-adoption obligation (PAEP-IB4-BACKEND-ATOMIC-TRANSITION, OPEN): workflow writes must not be enabled in a pilot or production until the target backend implements and validates the method.

Q4-M1 is separate from M1 itself, though it sits on the stale path that M1 requirement 3 covers. It should be fixed before AC-IB4-21 is claimed.

## Counts

HIGH 0, MEDIUM 1 (Q4-M1), LOW 4 (Q4-L1..L4), INFO 3.
