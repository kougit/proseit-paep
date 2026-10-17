# Independent QA pass 5: M1 re-check, IB4-FRAPPE-ADAPTER at bed21bc

## Scope and head

- Repository `/home/claude/proseit-paep`, head **bed21bc** ("IB4 M1: QA pass 4 fixes (correlation on pre-check refusals, contract detail)"). Its parent is 25a7c53, and the M1 base is 9c74aaf.
- **Scope:**
  - the bed21bc diff (10 files, +48/-31);
  - the whole M1 change, `git diff 9c74aaf bed21bc` (20 files, +699/-66), checked against the nine PO/SA M1 requirements summarised in QA pass 4 (`<reviewer scratch copy>/qa-m1/independent-qa-4-m1-25a7c53.md`);
  - each pass-4 finding.
- **Read-only.** I ran nothing in the repository. Every run used a `git archive` copy at `<reviewer scratch copy>/qa-m1b/tree`, with Node 24.21.0 and TypeScript 6.0.3.

## Method

1. **Reading.** I read `git show bed21bc` and re-read these files as they stand at bed21bc:
   - `workflow.ts` (all of it), `errors.ts` (the exc_type map), and the contract double `transitionBackend` in `backend.mjs`;
   - the M1 tests in `workflow.test.mjs`, and the `transition-stale` and `action-not-offered` fixtures;
   - design §4.1 (the steps, the table and the obligation), the ADR-011 header and amendment record, the acceptance report and the findings disposition.
2. **Gates on the copy.** All four passed:

   | Gate | Result |
   | --- | --- |
   | unit | PASS 71/71 (workflow 16/16), strict compile with 0 diagnostics |
   | integration | PASS 39/39 |
   | `frappe-qa` | PASS 9/9 (F06: 38 fixtures) |
   | `frappe-qa-negative` | PASS 38/38 (37 negatives plus 1 control) |

3. **Non-strict compile.** `tsc` with `strict: false`, extending `tsconfig.base.json`, on `packages/frappe-sdk/src/index.ts`: exit 0.
4. **Mutation probes.** The script `<reviewer scratch copy>/qa-m1b/mut5.mjs` is the pass-4 script, adapted to the bed21bc text. It runs the unit and integration suites for each mutant. The file was restored after each probe, and I checked it against `git show` afterwards.

| Probe | Mutation | Result |
| --- | --- | --- |
| P1 | Fallback to stock `apply_workflow`, with the name built by concatenation | KILLED |
| P2 | Auto-reconcile and re-send | KILLED |
| P3 | No advisory version pre-check | KILLED |
| P4 | No `expected_version` | KILLED |
| P5 | Send the re-read version instead of the caller's token | Survived. Equivalent while the pre-check exists, as in pass 4. |
| **P6** | Drop the `id === recordId` check on the result | **SURVIVED.** It was KILLED at 25a7c53 (see Q5-M1). |
| **P7** | Accept a bare document instead of `{ record }` | **SURVIVED.** It was KILLED at 25a7c53 (see Q5-M1). |
| P8 | Ignore the caller's idempotency key | KILLED |
| P9 | No advisory action check | KILLED |
| Q1 | No correlation id on the advisory RECORD_CONFLICT | KILLED (fixture `workflow.transition-stale`) |
| Q2 | No correlation id on the advisory WORKFLOW_ACTION_NOT_ALLOWED | KILLED (fixture `workflow.action-not-offered`) |
| Q3 | Remove the new `version === token` guard | KILLED (fail-safe test) |
| Q4 | Use the record read's correlation id instead of the transitions call's | Survived. Equivalent: both ids are real. |

5. **Confirming Q5-M1.** In the copy only, I added two replies to the fail-safe loop:
   - a bare document whose `modified` is newer;
   - another record whose `modified` is newer.

   With those replies, P6 and P7 are KILLED again, and the unmutated code still passes 71/71. I then restored the test file and checked it against `git show`.
6. **Scope checks.** `packages/contracts`, `package*.json` and `.github` have no change in 9c74aaf..bed21bc. Every path is inside the adapter, its tooling, or the ADR and design docs.

## Answers to the specific questions

- **Does the `version === token` guard break idempotent replay? No.**
  - A replay returns the stored post-apply record. Its `modified` comes from an applied transition, so it always differs from the `expected_version` that was checked.
  - M1-E (two concurrent requests with the same key: one is applied, the other is replayed) still passes, and `again` deep-equals `first`.
  - The guard only rejects a 200 that reports the caller's version unchanged. Design §4.1 step 8 now states that requirement for the backend.
- **Does the double still model the contract order of design §4.1? Yes.**
  - Design order: (2) resolve, (3) lock, (4) permission, (5) idempotency lookup and replay, (6) version, (7) revalidate, (8) apply and store, all in one transaction.
  - The double (`backend.mjs:110-127`) follows the same order. After `beforeMutation`, everything runs in one synchronous section, which stands in for the lock and the transaction.
  - The double also refuses a missing key, which the design does not require. That is harmless, because the adapter always sends a key.
- **Is the correlation id now on every PaepError of the transition path?** Yes, for every error after the first request.
  - Read and shape errors (`:38-40`, `:44`) carry one.
  - The advisory refusals (`:78`, `:80`) now carry `current.correlationId`, the id of the transitions call (`:56`).
  - Server errors come through the transport with an id, and result and shape errors (`:91`, `:94`, `:95`) carry one.
  - Refusals before any request (`:22`, `:72`, `:74`, `:76`) have no correlation id. That is consistent with the rest of the adapter: no request was made, so no id exists (Q5-I1).

## Previous findings

| ID | Severity (pass 4) | Status at bed21bc | Evidence |
| --- | --- | --- | --- |
| Q4-M1 | MEDIUM | **FIXED** | `workflow.ts:19,56,78,80` carry the correlation id. M1-B (early and late) and M1-E assert it through `conflict()`, which requires a well-formed id. The fixtures `transition-stale.json` and `action-not-offered.json` expect `$correlation`, and their manifest hashes were updated. Probes Q1 and Q2 are KILLED. |
| Q4-L1 | LOW | **FIXED**, with one residual gap (Q5-L1) | Design §4.1 now covers these points: (a) the lock is taken at step 3, before the replay lookup; (b) the command identity is (DocType, name, action, `expected_version`); (c) the key is scoped to the user, retained for at least 24 hours, stored in the same transaction, and a failure rolls back; (d) a 409 or a 417 `TimestampMismatchError` is classified by `exc_type`; (e) key reuse and an absent method are both VALIDATION_FAILED, which is now explicitly accepted with a reason. The remaining gap is that no uniqueness constraint on (user, key) is stated. |
| Q4-L2 | LOW | **FIXED (documented disposition)** | The §4.1 obligation paragraph now states that the compatibility check cannot detect a backend that lacks the method. It names the fail-safe as the technical control and the obligation as the governance control. That is acceptable under M1 requirement 8. A capability marker is still a reasonable item for a later generation. |
| Q4-L3 | LOW | **FIXED** | `workflow.ts:4`, `methods.ts:15`, `backend.mjs:84`, `frappe-qa.mjs:33` and `workflow.test.mjs:2,115` now cite §2.8 and §2.12. No stray "ADR-011 §8" remains in code. The ADR's own "amendment record, §8" is correct. |
| Q4-L4 | LOW | **PENDING-RECORDS** | At bed21bc the records still show the old state: the acceptance report says "BLOCKED — one open MEDIUM (M1)" (`ACCEPTANCE_REPORT.md:3,15-16,26`) with the old counts (37/37 integration, workflow 9), and `findings-disposition.md:15` says "OPEN — PO/SA decision requested". As instructed, this is expected until after this pass, and it is not a new defect. |
| Q4-I1 | INFO | **FIXED** | `workflow.ts:92-94`: a success that reports `version === token` is MALFORMED_RESPONSE. It is covered in the fail-safe loop, and probe Q3 is KILLED. It also introduced Q5-M1. |
| Q4-I2 | INFO | **FIXED** | The comment at `transport.ts:140-141` now distinguishes plain Frappe writes from the atomic method and says the adapter does not rely on de-duplication to re-send. The behaviour is unchanged. |
| Q4-I3 | INFO | Unchanged (no action required) | F05's ban is still a literal match. Runtime test P1 covers the concatenation case. |

## New findings

| ID | Severity | File:line | Description | Recommendation |
| --- | --- | --- | --- | --- |
| Q5-M1 | MEDIUM | `tooling/frappe-adapter/test/unit/workflow.test.mjs:206` (with `:7`, `:11`); `packages/frappe-sdk/src/lib/workflow.ts:90,94` | **The new unchanged-version guard makes two fail-safe proofs vacuous.** The fail-safe loop's "bare document" reply (`message: { ...DOC }`) and "another record" reply (`record: { ...DOC, name: 'INS-0002' }`) both inherit `DOC.modified`, which equals `TOKEN.serverVersion`. Since bed21bc, the `version === token` clause rejects both replies before the shape and id checks matter. As a result, mutants P6 (drop the `id === recordId` check) and P7 (accept a bare document, which is the shape stock `apply_workflow` returns) now pass all four gates; at 25a7c53 both were KILLED. The production code is still correct. The problem is that the evidence for the M1 fail-safe requirement ("a misrouted or absent method never yields a success"), cited as proof in pass 4, has been weakened by this commit. A realistic misroute returns a *saved* document with a **newer** `modified`, and that is exactly the case no test now covers. Confirmed by probe: adding those two replies with a newer `modified` kills P6 and P7 again, and the real code still passes 71/71. | In the fail-safe loop, give the bare-document and other-record replies a `modified` newer than the token (for example `'2026-10-15 09:05:00.000001'`). Keep the unchanged-version reply as its own case. Optionally add a matching integration fixture. The pinned counts do not change. |
| Q5-L1 | LOW | `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md:120-127` | **No uniqueness constraint on the idempotency key.** The row lock serialises requests for one record. Two concurrent requests with the same user and key for *different* records hold different locks, so both can miss the lookup at step 5 and both apply. The design intends the second to be refused as "same key, different command". The contract does not state a unique constraint on (user, key), or that the key store is checked or inserted under that constraint inside the transaction. | Add to §4.1: "(user, key) is unique in the key store; the key row is inserted in the same transaction, and a uniqueness violation is treated as reuse (`ValidationError`)." |
| Q5-I1 | INFO | `workflow.ts:22,72,74,76` | Refusals made before any request (WORKFLOW_UNSUPPORTED, INVALID_REFERENCE, WORKFLOW_UNSUPPORTED_INPUT, CONCURRENCY_TOKEN_MISSING) carry no correlation id. That is consistent with the adapter's other refusals made before a request, and pass 4 did not flag it. | None, unless AC-IB4-10 is read as requiring a client-generated id even when no request is made. |

## M1 verdict

**M1 remains CLOSED at the adapter and contract level.**

- The only workflow write is the POST to `pmra.api.v1.apply_transition` with `expected_version` and an idempotency key.
- The client's checks are advisory. There is no fallback, and an absent method fails safe. Probes P1–P4, P8 and P9 are KILLED.
- The double models the §4.1 order without interleaving. Proofs A–F pass, and the new guard does not affect idempotent replay.
- Q4-M1 (correlation on the advisory refusals) is fixed and protected by tests.
- ADR-011 stays ACCEPTED, and `@proseit/paep-contracts` is unchanged.

**One new MEDIUM must be fixed before AC-IB4-21 is claimed.** Q5-M1 is a test-evidence regression on the fail-safe proof introduced by bed21bc. It is not a code defect, and the fix is a two-value test change. The records (Q4-L4) still have to be updated after the regression and this pass.

The condition from pass 4 is unchanged: production closure depends on the backend-adoption obligation PAEP-IB4-BACKEND-ATOMIC-TRANSITION, which is still OPEN.

## Counts

HIGH 0, MEDIUM 1 (Q5-M1), LOW 2 (Q5-L1 new, plus Q4-L4 pending records), INFO 1 new (Q5-I1). Of the pass-4 findings, these are fixed: Q4-M1, Q4-L1 (one residual gap, Q5-L1), Q4-L2, Q4-L3, Q4-I1 and Q4-I2.
