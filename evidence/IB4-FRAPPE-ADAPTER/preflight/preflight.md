# IB4-FRAPPE-ADAPTER — Pre-write baseline revalidation (authorisation §2)

Executed by Claude Code on 2026-10-15 before any repository change, after the PO/SA implementation authorisation of 2026-10-15T09:59Z.

| Check | Result |
| --- | --- |
| Current branch / state | `claude/project-thread-sv4pzd` at `a50120017fc84f869043be0c2837286a6f598ef3`; `git status --porcelain` empty (no uncommitted or untracked work) |
| `main` HEAD | `origin/main` = `a50120017fc84f869043be0c2837286a6f598ef3` (exactly the authorised baseline; main has not moved) |
| Generation 5 | ACCEPTED, acceptedCommit `10462434ebb9d9dc1dfe0a3e89fb4f754b4b4473` (`tooling/governance/baseline-registry.json`) |
| Generation 6 | none (generations 1-5 only, all ACCEPTED) |
| Mandatory CI on the baseline | run 38705367133 (push, `a501200`): success; 19/19 check runs success, including `PAEP / gate` |
| package-lock / dependencies | `package-lock.json` sha256 `fc31123bea83fa64273b34af32248707430650998bce6ad1b0057de06adfa600` equals `docs/architecture/toolchain-version-manifest.json` `lockfile.sha256`; no diff in `package.json`, `package-lock.json` or `packages/*/package.json` against the G5 accepted commit |

Result: PASS. IB4 starts on the authorised Generation 5 baseline.

## Read-only analysis (authorisation §16, threads A-H)

Eight read-only analysis threads ran concurrently with no shared-file writes: A contracts and API snapshot; B adapter architecture and transport; C session/CSRF threats; D records/workflow/files semantics; E freshness/reconcile; F CI and gate rescoping; G negative/adversarial test design; H ADR, provenance, traceability and architecture risk. The consolidation established:

* the canonical contracts package is `@proseit/paep-contracts` (no `@proseit/contracts` alias is created);
* contract ports must be Promise-based `*Gateway` interfaces (contracts-qa S4), so freshness is a pull-based port;
* the next available ADR identifier is ADR-011 (ADR-001..010 are reserved in PAEP-IB-01 App. F);
* the adapter stays out of the initial bundle through one dynamic `import()` (bundle-composition C1 unchanged);
* one path outside the authorised areas is needed: `tooling/design-system/ci-governance-negative.mjs` case I24 pins the WP05 case count (104), which the new mandatory job raises to 105. It was raised to the PO/SA as a scope decision before the scope was frozen.
