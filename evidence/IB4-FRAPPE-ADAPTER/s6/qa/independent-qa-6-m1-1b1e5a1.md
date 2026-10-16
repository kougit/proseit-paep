# Independent QA pass 6: final M1 closure check, IB4-FRAPPE-ADAPTER at 1b1e5a1

## Scope and head

- Repository `/home/claude/proseit-paep`, head **1b1e5a1** ("IB4 M1: QA pass 5 fixes (fail-safe test strength, key uniqueness)"). The chain is 9c74aaf → 25a7c53 → bed21bc → 1b1e5a1.
- **Scope:**
  - the 1b1e5a1 diff: 2 files, +8/-3, in `workflow.test.mjs` and design §4.1;
  - the whole M1 change, `git diff 9c74aaf 1b1e5a1`: 20 files, +704/-66;
  - the M1 requirements from the PO/SA decision, as summarised in pass 4;
  - every finding from pass 4 and pass 5.
- **Read-only.** I ran nothing in the repository and changed nothing in it. All runs used a `git archive` copy at `<reviewer scratch copy>/qa-m1c/tree`, with Node 24.21.0 and TypeScript 6.0.3.

## Method

1. **Reading.** I read `git show 1b1e5a1` and the full 9c74aaf..1b1e5a1 diff. I re-read the following files as they stand at 1b1e5a1:
   - `workflow.ts` (all of it; it is unchanged since bed21bc);
   - the `errors.ts` map;
   - the `transitionBackend` double in `backend.mjs`;
   - the M1 tests and the fail-safe test;
   - design §4.1;
   - the ADR-011 header, §2.8, §2.12, §4 and §8;
   - the Generation 6 `authorisedScope`;
   - the acceptance report and the findings disposition.
2. **Gates on the copy.** All four passed:

   | Gate | Result |
   | --- | --- |
   | unit | PASS 71/71 (workflow 16/16), strict compile with 0 diagnostics |
   | integration | PASS 39/39 |
   | `frappe-qa` | PASS 9/9 |
   | `frappe-qa-negative` | PASS 38/38 (37 seeded negatives plus 1 control) |

3. **Non-strict compile.** `tsc` (6.0.3) with `strict: false` and `noEmit`, extending `tsconfig.base.json`, on `packages/frappe-sdk/src/index.ts`: exit 0. The temporary tsconfig was outside the tree and has been removed.
4. **Mutation probes.** I ran `<reviewer scratch copy>/qa-m1c/mut6.mjs`, the pass-5 script, against the copy's `workflow.ts`. Each probe runs the unit and integration suites. Every mutation applied to the current text, including the success guard `if (id !== request.recordId || version === token)`. Afterwards I diffed the file against `git show 1b1e5a1:…`: it was identical.
5. **Scope checks.** In 9c74aaf..1b1e5a1 there is no change to:
   - `packages/contracts`, any `package.json`, `package-lock.json`, `nx.json`, `tsconfig*.json`, `*.schema.json`, `apps/` or `.github/` (so no CI timeout or UI change).

   All 20 changed paths are inside the Generation 6 `authorisedScope`, under `docs/adr/ADR-011…`, `ADR-REGISTER.md`, `IB4-FRAPPE-ADAPTER-DESIGN.md`, `packages/frappe-sdk/README.md`, `packages/frappe-sdk/src/` and `tooling/frappe-adapter/`. The method name appears only in `methods.ts:16`. `apply_workflow` appears nowhere in adapter source.

## Mutation-probe results

| Probe | Mutation | Result |
| --- | --- | --- |
| P1 | Fallback to stock `apply_workflow`, with the name built by concatenation | KILLED (9 tests) |
| P2 | Auto-reconcile and re-send with the fresh version | KILLED (7) |
| P3 | No advisory version pre-check | KILLED (3: stale, M1-B, M1-E) |
| P4 | No `expected_version` | KILLED (5: M1-A, M1-C, M1-D and others) |
| P5 | Send the re-read version instead of the caller's token | Survived. Equivalent while the pre-check exists, as in passes 4 and 5. |
| **P6** | Drop the `id === recordId` check | **KILLED** (fail-safe). It survived at bed21bc. |
| **P7** | Accept a bare document instead of `{ record }` | **KILLED** (fail-safe). It survived at bed21bc. |
| P8 | Ignore the caller's idempotency key | KILLED (4: M1-A, M1-E and others) |
| P9 | No advisory action check | KILLED |
| Q1 | No correlation id on the advisory RECORD_CONFLICT | KILLED (fixture `workflow.transition-stale`) |
| Q2 | No correlation id on the advisory WORKFLOW_ACTION_NOT_ALLOWED | KILLED (fixture `workflow.action-not-offered`) |
| Q3 | Remove the `version === token` guard | KILLED (fail-safe) |
| Q4 | Use the record read's correlation id instead of the transitions call's | Survived. Equivalent: both ids are real. |

P6, P7 and Q3 are now each killed on their own. Each fail-safe reply targets one check:

- the bare saved document, with a newer `modified`, catches P7;
- another record, with a newer `modified`, catches P6;
- the same record with an unchanged `modified` catches Q3.

## M1 requirements re-check (9c74aaf..1b1e5a1)

| Requirement | Status | Evidence |
| --- | --- | --- |
| Atomic server method | Met | `workflow.ts:81-88`: the only write is a POST to `METHOD.applyTransition` with `{doctype, name, action, expected_version: token}`. Design §4.1 steps 1–8 run in one transaction, with `FOR UPDATE` at step 3. |
| Advisory pre-check | Met | `workflow.ts:77-80`. The server's answer decides: M1-C (a change after the pre-check is caught by the server) passes, and P3 is killed. |
| Stale → conflict, with correlation id, no transition | Met | Advisory `:78` and server 409 or `TimestampMismatchError` (`errors.ts`). M1-B and M1-C assert no effect. Q1 is killed. |
| Idempotency | Met | The caller's key is kept on every retry. M1-E: the same key gives one effect; reusing a key for another command gives VALIDATION_FAILED. §4.1 now states the `(user, key)` unique index (Q5-L1). |
| ADR-011 amended only where authorised, still ACCEPTED | Met | Unchanged since pass 5: Status is **ACCEPTED — PO/SA**. The amendments are limited to the header, §2.8, §2.12, §4 and the §8 record. |
| Contracts unchanged and backend-neutral | Met | No diff under `packages/contracts`. |
| Proofs A–F | Met | `workflow.test.mjs` M1-A … M1-F pass, and the mutants that matter are killed. |
| Absent method fails safe, no fallback | Met | Fail-safe test: exactly one POST, nothing applied, every misroute reply refused (P1, P6, P7 and Q3 killed). F05 together with N36 and N37 guard the literal names. |
| Backend-adoption obligation recorded | Met | ADR-011 §4 (line 48) and design §4.1/§10: PAEP-IB4-BACKEND-ATOMIC-TRANSITION, OPEN. |
| No dependency, lockfile, config-schema, CI-timeout or UI change | Met | See Method step 5. |
| Only in-scope paths | Met | All 20 paths are in the Generation 6 `authorisedScope`. |

## Previous findings

| ID | Pass-raised severity | Status at 1b1e5a1 | Note |
| --- | --- | --- | --- |
| Q4-M1 | MEDIUM | FIXED | Correlation id on the advisory refusals (`workflow.ts:19,56,78,80`). Q1 and Q2 are killed. |
| Q4-L1 | LOW | FIXED | §4.1 now has the lock before the replay lookup, the command identity, the key scope and retention, same-transaction storage, `exc_type` as authoritative, and the key-reuse/absent-method disposition. The residual gap, Q5-L1, is now fixed too. |
| Q4-L2 | LOW | FIXED (documented disposition) | §4.1 names the fail-safe as the technical control and the obligation as the governance control. |
| Q4-L3 | LOW | FIXED | The code cites §2.8 and §2.12. |
| Q4-L4 | LOW | **PENDING-RECORDS** | At 1b1e5a1, `ACCEPTANCE_REPORT.md:3` still says "BLOCKED — one open MEDIUM (M1)", and `findings-disposition.md:15` still says M1 "OPEN — PO/SA …". You said these will be updated after this pass, so it is not a defect. |
| Q4-I1 | INFO | FIXED | The `version === token` guard; Q3 is killed. |
| Q4-I2 | INFO | FIXED | Transport comment. |
| Q4-I3 | INFO | Unchanged (no action needed) | F05's ban is a literal match. Concatenation is covered at runtime (P1 killed). |
| Q5-M1 | MEDIUM | **FIXED** | `workflow.test.mjs:205-209`: the misrouted replies are built from `saved` (`modified: '2026-10-15 09:05:00.000001'`), and an unchanged-version reply is a separate case. P6 and P7 are killed again, Q3 is still killed, and the real code passes 71/71. The pinned counts are unchanged (workflow 16). |
| Q5-L1 | LOW | **FIXED** | Design §4.1 step 5 now says that `(user, key)` is unique in the key store (a unique index). The second insert fails, its transaction rolls back, and the request is refused. Combined with step 8 (the key is stored in the same transaction) and "a failure at any step rolls the transaction back", a key cannot be applied to two records. |
| Q5-I1 | INFO | Unchanged (no action needed) | Refusals made before any request carry no correlation id, which is consistent with the rest of the adapter. |

## New findings

| ID | Severity | File:line | Description | Recommendation |
| --- | --- | --- | --- | --- |
| Q6-L1 | LOW | `docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md:126-128` (with the outcome table at `:140`) | **§4.1 does not say how the uniqueness refusal reaches the client.** A duplicate `(user, key)` insert is "refused", but no `exc_type` is given. If the backend raises `DuplicateEntryError` or `ValidationError`, the adapter maps it to VALIDATION_FAILED, which matches the table's key-reuse row. If an unhandled database `IntegrityError` reaches the client as an HTTP 500, it is read as SERVICE_FAILURE. That is still safe, because the transaction rolls back and the transport does not re-send a write after a 5xx, but it differs from the documented outcome. | When the records are updated, add a short clause: "the uniqueness violation is raised as `ValidationError` (or `DuplicateEntryError`)". This is not needed for M1 closure. |
| Q6-I1 | INFO | `tooling/frappe-adapter/test/unit/workflow.test.mjs:209` | The fail-safe loop's predicate checks only `typeof e.code === 'string' && !e.retryable`. It does not check `MALFORMED_RESPONSE` for the three 200 replies. The probes show each guard is still required, so this is not a proof gap. | Optional: assert `e.code === 'MALFORMED_RESPONSE'` for the 200 replies. |

## M1 verdict

**M1 is CLOSED at the adapter and contract level, with no open MEDIUM or HIGH.**

- Every M1 requirement is met.
- Proofs A–F and the fail-safe proof pass. They would fail on the old code and kill every non-equivalent mutant tried; P5 and Q4 survive only because they are semantically equivalent.
- Q5-M1 and Q5-L1 are fixed.
- ADR-011 stays ACCEPTED, and `@proseit/paep-contracts` is unchanged.

Two things remain before production use and acceptance:

- **Production use** still depends on the backend-adoption obligation PAEP-IB4-BACKEND-ATOMIC-TRANSITION, which is OPEN.
- **The records (Q4-L4)** are PENDING-RECORDS. They must be updated to match this state, together with the regression evidence, before AC-IB4-19 and AC-IB4-21 are claimed.

Technical closure is not ACCEPTED. Acceptance is the PO/SA's decision.

## Final counts (PENDING-RECORDS excluded)

HIGH 0, MEDIUM 0, LOW 1 (Q6-L1), INFO 1 (Q6-I1).
