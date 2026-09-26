# PAEP Baseline Rollover Procedure

**Applies to:** every work package after IB0 (introduced by IB1-PREFLIGHT-R7).  
**Registry:** `tooling/governance/baseline-registry.json`  
**Verifier:** `npm run qa:baseline` (`node tooling/governance/baseline-governance.mjs verify`), also run by `PAEP / governance` (W26)  
**Tests:** `npm run qa:baseline:negative`, also run by `PAEP / negative-ci`  
**Design:** `work-packages/IB1-PREFLIGHT-R7/BASELINE_GOVERNANCE_DESIGN.md`

The repository state is not the accepted baseline. The accepted baseline is the newest `ACCEPTED` generation in the registry: a mainline merge that the Product Owner / Solutions Architect (PO/SA) accepted. Claude Code may prepare a `CANDIDATE`; only a PO/SA acceptance recorded inside a merged commit can make it `ACCEPTED`.

## Rules

1. Never edit expected fingerprints, commits, trees or acceptance fields by hand to clear CI. They are recomputed from git and any hand edit fails B05–B07 or B09.
2. Never promote the current working state. `verify` never writes; `promote` only accepts a first-parent merge on `origin/main` that already carries the ACCEPTED record.
3. Never widen `authorisedScope` beyond what the PO/SA authorised, and never to a whole top-level directory, an immutable path or an accepted record (B08 rejects these).
4. Never edit or delete an `ACCEPTED` generation or an accepted work-package or evidence record (B09, B10).

5. `CLAUDE.md` is a PROTECTED GOVERNED ARTIFACT (PO/SA, 2026-09-26): locked by default, and changed only under explicit PO/SA authorisation, declared in a CANDIDATE with `policyChange`, verified, independently reviewed, recorded in the acceptance record and promoted. Never change it to widen the implementer's own authority.
6. The CANDIDATE's authorisation and scope are written by the implementer. Reviewers must check `authorisedScope` and `policyChange` against the PO/SA's written authorisation before approving the pull request; the verifier enforces the declared scope, not who declared it.

## Procedure

1. **Start from an accepted baseline.** `git fetch origin` and branch from `origin/main`. `npm run qa:baseline` must pass with no CANDIDATE, or with only the promotion of the previous generation pending (step 8).
2. **Declare the authorised scope.** With the PO/SA authorisation in hand, append one generation to `generations`:
   `generation` = last + 1, `predecessorGeneration` = last, `status` `"CANDIDATE"`, `workPackages` `["<WP-ID>"]`, `authorisation` `{ "authority": "Product Owner / Solutions Architect", "date": "<YYYY-MM-DD>", "reference": "work-packages/<WP-ID>/WORK_PACKAGE.md" }`, `policyChange` `false` (true only if the PO/SA authorised a governance change: the registry policy, `.github/`, `CLAUDE.md`, `tooling/governance/` or `tooling/verification/`; B08 enforces this), `authorisedScope` = the exact files and `dir/` subtrees the WP may change (sorted; always include `tooling/governance/baseline-registry.json`, `work-packages/<WP-ID>/` and `evidence/<WP-ID>/`), `protectedRecords` `["evidence/<WP-ID>/", "work-packages/<WP-ID>/"]`, and `null` for `acceptedCommit`, `acceptedTree`, `acceptance` and `fingerprints`. Keep the canonical format (`JSON.stringify(value, null, 2)` plus a final newline, ASCII only).
3. **Implement** only inside that scope. `npm run qa:baseline` names any path outside it (`FAIL B11 ... unauthorised change: <path>`).
4. **Verify the candidate:** `npm run qa:baseline`, the WP's own gates, and `PAEP / gate` on the pull request. The report says `candidate G<n> <WP-ID> (NOT ACCEPTED)`.
5. **Independent QA** as the EQP requires.
6. **Obtain acceptance.** Only after the PO/SA's explicit decision, record it in `work-packages/<WP-ID>/work-package.json`: `"status": "ACCEPTED"` and `"acceptance": { "status": "ACCEPTED", "authority": "Product Owner / Solutions Architect", "date": "<YYYY-MM-DD>" }`. The registry still says CANDIDATE; that is correct. The record must be exact, and `work-package.json` is the acceptance record (B12 fails a malformed one, or an `Acceptance Status | ACCEPTED` report row without it; any such claim, in any case, counts once merged). If the generation lists several work packages, record every acceptance in the same merge: the first merged ACCEPTED claim freezes the generation (B13), and `promote` needs all of them.
7. **Merge** with a merge commit (no squash, no rebase), under the PO/SA merge authorisation.
8. **Promote** straight after the merge (B13 blocks every other change until then), on a new branch from the updated `origin/main` (or as the first commit of the next authorised WP):
   `node tooling/governance/baseline-governance.mjs promote --generation <n> --commit <merge-sha>`
   It refuses unless the commit is a merge on the first-parent history of `origin/main`, the CANDIDATE is unchanged from the merged one, and the merged `work-package.json` says ACCEPTED with the controlled authority. It then fills `acceptedCommit`, `acceptedTree`, `acceptance` (records blob-pinned) and `fingerprints` from git. Commit only the registry.
9. **Re-run `PAEP / gate`** on the promotion. `npm run qa:baseline` must report `active G<n> <merge-sha>; candidate none`.
10. **Retain history.** Earlier generations and records stay as they are; B09 and B10 fail if they change. The registry's git history is the rollover log.

## When something fails

| Output | Meaning | Action |
| --- | --- | --- |
| `FAIL B11 ... unauthorised change: <path>` | A path outside the CANDIDATE scope changed | Revert it, or obtain PO/SA authorisation and add it to the scope in a reviewed change |
| `FAIL B10 ... differs from generation <n>` | An accepted record or controlled source changed | Revert; accepted records are immutable |
| `FAIL B05 ... not found` | `origin/main` missing locally | `git fetch origin` |
| `FAIL B09` | An accepted generation or the policy changed | Revert the registry edit |
| `FAIL B13 ...` | The CANDIDATE was accepted and merged but not promoted (the freeze starts when any of its work packages is ACCEPTED on the mainline; adding or removing work packages does not lift it) | Run `promote` for that merge first |
| `PROMOTION REFUSED` | No PO/SA ACCEPTED record in the merged commit, or not a mainline merge | Do not promote; obtain acceptance and merge first |
