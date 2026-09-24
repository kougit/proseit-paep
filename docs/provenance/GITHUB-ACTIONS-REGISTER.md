# PAEP GitHub Actions Provenance Register

**Status:** IB0-WP05 record, reviewed 2026-09-24 by Claude Code; disposition subject to PO/SA acceptance of IB0-WP05.  
**Machine-readable twin:** `tooling/verification/ib0-wp05-ci-policy.json` (`approvedActions`). `npm run qa:ib0-wp05` (check W14) fails if the workflow uses an action that is not listed in both, uses a different commit SHA, or carries a different version comment.

**Rule:** only GitHub first-party actions (`actions/*`) are used, each pinned to the full 40-character commit SHA of a published release tag, with the tag as a trailing comment. Floating references (`@main`, `@v7`) and third-party actions are not permitted. Changing a version is a reviewed change to this register, the policy file and the workflow in one commit.

## Register

| Field | actions/checkout | actions/setup-node | actions/upload-artifact |
| --- | --- | --- | --- |
| Owner / repository | `actions` / `checkout` | `actions` / `setup-node` | `actions` / `upload-artifact` |
| Publisher | GitHub (first-party) | GitHub (first-party) | GitHub (first-party) |
| Purpose in PAEP CI | Check out the commit under test (full history, credentials not persisted) | Install Node.js from `.nvmrc` (24.21.0, bundled npm 11.19.0); cache npm downloads keyed on `package-lock.json` | Upload per-job evidence (logs, reports, build manifests) with 30-day retention |
| Version | v7.0.1 | v7.0.0 | v7.0.1 |
| Pinned commit SHA | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `820762786026740c76f36085b0efc47a31fe5020` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| SHA verification | `git ls-remote https://github.com/actions/checkout refs/tags/v7.0.1` = the SHA; clone of the tag, HEAD = the SHA (2026-09-24) | same method, tag `v7.0.0` | same method, tag `v7.0.1` |
| Licence | MIT (LICENSE in the tagged tree) | MIT | MIT |
| Runtime | `node24` | `node24` | `node24` |
| Security notes | `persist-credentials: false` set on every use; v7 blocks fork checkout for `pull_request_target`/`workflow_run` (not used here) | `package-manager-cache` would auto-enable caching from `packageManager`; PAEP sets `cache: npm` explicitly; no `registry-url` or token inputs; `check-latest: false` | Uploads only `$RUNNER_TEMP/paep-evidence/`; never `node_modules` or credentials; hidden files excluded by default |
| Disposition | APPROVED for CI use (development tooling; not distributed) | APPROVED for CI use | APPROVED for CI use |

## Not used, by decision

| Candidate | Reason |
| --- | --- |
| `actions/cache` | Not needed: `setup-node` caches the npm download cache only. `node_modules` is never cached, so every job proves a clean `npm ci`. |
| `actions/download-artifact` | The aggregate gate reads job results from the `needs` context; it does not need artifacts. |
| Third-party lint, SBOM or security actions | Not required by WP05; any future addition needs its own provenance and licence review. |

## Local action

`.github/actions/paep-setup` is PAEP-authored (composite; no third-party code). It uses `actions/setup-node` at the SHA above.
