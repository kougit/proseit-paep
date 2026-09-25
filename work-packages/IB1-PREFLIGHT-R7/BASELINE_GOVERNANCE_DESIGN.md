# IB1-PREFLIGHT-R7 — Baseline Governance Design

**Status:** implemented as a CANDIDATE (generation 2); not accepted.  
**Consolidates:** analysis lanes B (governance), C (inventory), D (options), E (threat model), F (CI), G (historical evidence) and H (performance). Lane A is `R7_ROOT_CAUSE.md`.

## 1. Governance facts from the controlled sources (Lane B)

| Question | Answer | Source |
| --- | --- | --- |
| Who approves a work package and sets ACCEPTED? | Product Owner / Solutions Architect (or a delegated reviewer; no delegation is recorded, so only the PO/SA is listed) | PAEP-EQP-01 App. C; CLAUDE.md "Work-package authorisation" |
| Who approves a technical baseline? | No separate role is named. A baseline is the accepted state of the repository, so promotion follows WP acceptance by the PO/SA | EQP App. C; EQP §24(iv) "baselines shall be controlled and intentional changes approved rather than bulk-updated automatically" |
| When does acceptance occur? | After technical PASS and independent QA; PASS is not ACCEPTED | EQP App. C; CLAUDE.md step 10 |
| Evidence retention | `evidence/<milestone-or-work-package>/`, identifying the commit under test | EQP §24(i) |
| Historical acceptance files | Not declared immutable by a controlled source; IB0-WP03..WP05 treated earlier records as protected and restored them after regression runs | WP03–WP05 verifiers |
| Prescribed baseline manifest or location | None | all controlled sources |
| Exceptions visible to gates | Approved exceptions shall be visible to quality gates | EQP §26(iv) |

No controlled source conflicts with the design below. `.paep-control/` is immutable (PACK_MANIFEST fingerprints), so the registry is not placed there.

## 2. Options (Lane D)

| | A. Move the constants to a JSON config | B. Per-file sha256 manifest regenerated at each WP | **C. Git-anchored append-only registry (selected)** |
| --- | --- | --- | --- |
| Fail-closed | Only as strict as the code reading it | Yes for drift | Yes: invalid registry, unknown state, missing ref or history all fail |
| Auditability | Weak: no record of who accepted what | Hash list, no acceptance link | Each generation names the merge commit, tree, authority and blob-pinned acceptance records |
| Rollover | Edit the value | Regenerate hashes (the "bulk update" EQP §24(iv) warns against) | `promote` command, only for a mainline merge that already carries an ACCEPTED record |
| Self-approval risk | High: edit the value | High: regenerate | Low: the accepted commit must be a first-parent mainline merge containing the PO/SA record; a branch cannot produce one on `origin/main` |
| Self-referential hashing | n/a | The manifest hashes change with every edit | None: a generation points at an earlier commit; the registry never hashes itself |
| Historical traceability | None | Overwritten | Append-only across git history (B09) |
| CI suitability | Good | Slow (hash every file) | Good: local git plumbing, no network |
| Complexity | Lowest | Medium | Medium (one Node module, no dependency) |
| IB1+ compatibility | Needs code edits per WP | Needs regeneration per WP | A WP adds one CANDIDATE entry; the verifier code does not change |

Option C is the minimum that keeps the rigour: A and B both reduce R7 to "edit a value", which is the weakness R7 describes.

## 3. The registry

**Location:** `tooling/governance/baseline-registry.json`, with the verifier `tooling/governance/baseline-governance.mjs`. `tooling/` is where PAEP verification tooling lives (IR-01 §4.2); a separate `governance/` folder keeps the cross-work-package registry apart from per-WP verifiers in `tooling/verification/`. `config/` is reserved for runtime configuration (IB1) and `.paep-control/` is immutable. Only one location exists.

**Schema** (`paep-baseline-registry`, `schemaVersion` 1; exact keys in this order, canonical JSON, printable ASCII + LF):

| Field | Meaning |
| --- | --- |
| `policy.acceptanceAuthorities` | Who may accept and authorise. Must be a subset of the controlled floor ("Product Owner / Solutions Architect") |
| `policy.mainlineRef` | `refs/remotes/origin/main` (fixed); accepted commits must be on its first-parent history |
| `policy.immutablePaths` | Never changeable. Must include the floor `.gitignore`, `.paep-control/`, `PACK_MANIFEST.json` |
| `policy.governedPaths` | Governed baseline artifacts, fingerprinted for audit (toolchain, workflow, verifiers, registry, ADRs, licences, provenance, CLAUDE.md) |
| `generations[].generation` / `predecessorGeneration` | 1, 2, 3… with predecessor n-1 (version) |
| `name`, `milestone`, `workPackages` | Originating milestone and work packages |
| `status` | `ACCEPTED` or `CANDIDATE`; anything else fails closed |
| `authorisation` | PO/SA authorisation of the change (authority, date, reference file in the WP's own records) |
| `policyChange` | true only for a CANDIDATE authorised to change governance: the registry `policy` or any governance-critical path (CI workflow, verifiers, this module, CLAUDE.md). Generation 2 bootstraps the registry |
| `authorisedScope` | Exact files or `dir/` subtrees the CANDIDATE may change (never a top-level directory, immutable path or accepted record) |
| `protectedRecords` | `work-packages/<WP>/` and `evidence/<WP>/`; immutable once the generation is ACCEPTED |
| `acceptedCommit`, `acceptedTree` | The PO/SA-authorised merge commit on the mainline and its tree (null for a CANDIDATE) |
| `acceptance` | authority, date and blob-pinned acceptance records inside `acceptedCommit` (null for a CANDIDATE) |
| `fingerprints` | git object id of every immutable, governed and protected path at `acceptedCommit` (`absent` if the path did not exist) |
| `notes` | Free text |

**Non-self-reference:** an ACCEPTED generation names the merge commit that the PO/SA already authorised. The registry is updated in a later commit (the promotion), so no file contains its own commit or its own hash. Fingerprints are git object ids of that earlier commit, recomputed from history by the verifier, never taken from the working tree.

## 4. Verification rules (B01–B13)

| Rule | Check |
| --- | --- |
| B01 | One regular file (not a symlink); printable ASCII + LF only (rejects BOM, CR, TAB, NEL, LS/PS, zero-width); canonical `JSON.stringify(v, null, 2)` form, which rejects duplicate keys, escapes and trailing data |
| B02 | Exact schema, key order and types; known schema and state; ACCEPTED carries commit, tree, authority, evidence and fingerprints; CANDIDATE carries authorisation and scope and nothing of acceptance |
| B03 | Generations 1..n, predecessor n-1, at least one ACCEPTED, at most one CANDIDATE and it is last, a work package in one generation only |
| B04 | Canonical paths (no `..`, `.`, `\`, leading `/`, empty or non-ASCII segment), sorted, unique ignoring case; authorities and immutable paths not below the controlled floor; protected records are exactly the generation's own WP and evidence folders |
| B05 | Accepted commit exists, is a merge, is on the first-parent history of `origin/main`, is an ancestor of HEAD, has the recorded tree; accepted commits descend from one another |
| B06 | Controlled authority; valid dates in order; for every WP an acceptance record inside the accepted commit that says ACCEPTED with the same authority (`work-package.json`; IB0-WP01 alone uses its `ACCEPTANCE_REPORT.md` status row); blob ids match |
| B07 | Fingerprints equal the git objects at the accepted commit; the active generation covers exactly the current policy paths (except while a `policyChange` CANDIDATE changes an existing policy) |
| B08 | CANDIDATE authorisation by a controlled authority, reference inside its own records, own records and the registry in scope, no scope entry overlapping an immutable path or accepted record (case-insensitive) or covering a whole top-level directory |
| B09 | Append-only: every ACCEPTED generation recorded at the active accepted commit, or in any committed version of the registry in HEAD's history, is unchanged; a promotion only fills the acceptance fields; policy changes only under `policyChange`; bootstrap only when the registry did not exist at the active accepted commit |
| B10 | Immutable paths and every accepted generation's records unchanged since its accepted commit (tracked and untracked) |
| B11 | Every path changed since the active accepted commit (tracked, untracked, deleted, no rename detection) is canonical ASCII, not a symlink, not a case variant of a protected path, and inside the CANDIDATE scope; with no CANDIDATE only the registry may change (a promotion). No tracked symlink anywhere |
| B12 | Every `work-package.json` that says ACCEPTED belongs to a generation |
| B13 | Promotion pending: once a mainline merge carries the next generation as CANDIDATE with ANY of its work packages recorded ACCEPTED, that generation is frozen to the earliest such merge, as read from the mainline registry (not from HEAD): HEAD's CANDIDATE must equal it and nothing but its promotion may change; `promote` accepts only that merge, and only with every work package ACCEPTED |

Also from independent QA round 1: B09 reads registry history with `--full-history` and also requires every ACCEPTED generation in the mainline registry to be present unchanged (a merge that keeps an older registry cannot hide a promotion); B08 requires `policyChange: true` for any scope entry touching governance rules (`.github/`, `CLAUDE.md`, `tooling/governance/` other than the registry file, `tooling/verification/`).

`verify` is read-only. When B01–B09 fail there is no valid baseline, and B10, B11 and every dependent WP05 check fail closed.

## 5. Change authorisation and the WP05 gate (Lanes C, F)

`verify-ib0-wp05.mjs` keeps its checks and IDs but no longer holds a baseline:

* W02 compares controlled sources with the active accepted commit; CLAUDE.md may change only if in scope.
* W05 allows implementation paths only in scope; while no generation authorises `apps/`, `packages/`, `config/`, `angular.json` or `tsconfig*`, the IB0 placeholder rule still holds, so IB1 cannot start without an explicit scope.
* W06: lockfile and non-script `package.json` fields equal the accepted baseline unless `package-lock.json` is in scope; accepted scripts are unchanged; new scripts need `package.json` in scope.
* W07 is B11 plus the existing lint/test-configuration ban (unless such a file is in scope).
* W08 scans files changed since the accepted baseline.
* W26 (new, governance job and full run) requires B01–B13.
* The bounds for the older verifiers accept a reported path only if it changed in accepted history between that verifier's own commit and the active accepted commit, or is an in-scope change now with B11 passing; "file present" findings also accept files present in the accepted tree. The content-level bounds for WP03 V05/V08 (the WP04 tsconfig change) stay exact.
* Local runs of the WP05 verifier and negative suite write to the git-ignored `tmp/paep-evidence/`, because `evidence/IB0-WP05/` is now an immutable accepted record.

CI: W26 runs in `PAEP / governance`; the baseline test suite (`npm run qa:baseline:negative`) runs as a second step of `PAEP / negative-ci`. Both jobs are mandatory `needs` of `PAEP / gate`, which passes only when every mandatory job result is `success`, so a skipped, cancelled or failed baseline check cannot pass the gate (proven by WP05 G00–G18). The workflow change is recorded in the CI policy (`requiredCommands`), so W11 still requires it.

## 6. Inventory (Lane C)

`evidence/IB1-PREFLIGHT-R7/reports/baseline-inventory.json` classifies every tracked path at `5fbbedd` (machine-generated from git): IMMUTABLE CONTROLLED SOURCE (policy.immutablePaths), GOVERNED BASELINE ARTIFACT (policy.governedPaths), EVIDENCE / HISTORICAL RECORD (IB0 WP and evidence folders), MUTABLE IMPLEMENTATION ARTIFACT (everything else, scope-controlled by B11) and GENERATED / DERIVED (git-ignored build output; not tracked). Protection scope is not broadened: the old W07 already required every changed path to be in scope, and the old W21 already protected WP01–WP04 records. New protections: WP05's own records, and fingerprints for audit.

## 7. Historical evidence (Lane G)

No IB0 record is edited. Generation 1 is written from git facts (merge `5fbbedd`, tree `fb10ab5`, the five acceptance records blob-pinned) and says so in its notes. IB0-WP01's `work-package.json` says `READY`; its acceptance is read from its `ACCEPTANCE_REPORT.md` row, and that exception is limited to records already accepted (from generation 2 the `work-package.json` record is mandatory). Older verifiers stay unmodified and keep their own fixed commits, which are now read as accepted history.

## 8. Threat model (Lane E) and tests

Each threat is a test in `tooling/governance/negative-baseline-governance.mjs` (see `evidence/IB1-PREFLIGHT-R7/reports/baseline-governance-tests.json`):

| # | Threat | Test |
| --- | --- | --- |
| 1 | governed artifact changed without rollover | B01, B03, B09 |
| 2 | registry silently edited | C07, C08, C09, C10, C11, G08 |
| 3 | fingerprint changed to go green | C01, C02 |
| 4 | protected artifact removed from the registry | C03, C04, C05, C12 |
| 5 | new governed artifact omitted | B03 |
| 6 | malformed registry | D01, D04, D20, D21 |
| 7 | duplicate entry | D02, F06, D10 |
| 8–11 | path normalisation, `..`, slash/backslash, case variant | F01, F02, F03, F04, F05 |
| 12 | symlink escape | F09, F10, F11 |
| 13 | nonexistent predecessor | D13 |
| 14 | unaccepted milestone | D14, D15, D07 |
| 15 | authority missing / wrong | D05, D08, C06, D17, D18 |
| 16 | evidence missing | D06, D07 |
| 17 | generation rollback | D09, G09 |
| 18 | duplicate generation | D10, D11 |
| 19 | automatic regeneration without authorisation | E03, A05 (verify is read-only), G01, G03, G05, H04 |
| + | merge hiding a promotion; edits between merge and promotion; governance change without declaration (QA round 1) | H01, H02, H03, H04, H05, H06 |
| 20 | state differs from the baseline but PASS | B01–B10, D21 |
| + | Unicode and control characters (WP05 lesson) | F12–F19 |
| + | candidate treated as accepted; self-promotion | E01, E02 |
| + | policy loosened after promotion | G10, G16 |

## 9. Performance (Lane H)

The verifier uses only local git plumbing and file reads: about 60 git calls, under 2 s on the repository. The full test suite runs 95 cases in about 30 s. No network access.
