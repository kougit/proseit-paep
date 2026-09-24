# LANE D: controlled source and GitHub audit for IB0-WP02 (PR #2)

Audit date: 2026-09-24. Mode: read-only. The only write to the repo was `git fetch origin`, plus a read-only fetch of `refs/pull/2/merge` into FETCH_HEAD. Nothing was changed on GitHub.
Repo: kougit/proseit-paep. PR #2: head `claude/ib0-wp02-c625bb`, base `main`.

## 1. Immutable controls: PASS

Method: sha256 and byte size of every PACK_MANIFEST.json entry, checked in the working tree and at `origin/claude/ib0-wp02-c625bb` (from `git show`).

| Path | Bytes | sha256 (prefix) | Worktree | PR head |
| --- | --- | --- | --- | --- |
| .gitignore | 430 | 3646b9d51803eca2 | OK | OK |
| .paep-control/SOURCE_OF_TRUTH.md | 2397 | cbae92bae66d58d8 | OK | OK |
| .paep-control/originals/PAEP_DCH_v1.0.pdf | 542033 | 9a6a5efd82e71e75 | OK | OK |
| .paep-control/originals/PAEP_EQP_v1.1.pdf | 742463 | c61d5ace05815a7f | OK | OK |
| .paep-control/originals/PAEP_IB_v1.0.pdf | 937641 | cae5f62fbba6dd27 | OK | OK |
| .paep-control/originals/PAEP_IR_v1.0.docx | 705705 | 1e2d9c3ff2b34ea0 | OK | OK |
| .paep-control/originals/PAEP_v1.1.pdf | 1576649 | a9ae79b4c122e114 | OK | OK |
| .paep-control/reference-baseline/PAEP_BASE_v1.0.zip | 33055 | 170945d6422fa467 | OK | OK |
| .paep-control/text/PAEP_DCH_01_v1.0_text.md | 46181 | 8bc9aee796b07644 | OK | OK |
| .paep-control/text/PAEP_EQP_01_v1.1_text.md | 58649 | 920d12e28e7cb4e9 | OK | OK |
| .paep-control/text/PAEP_IB_01_v1.0_text.md | 68553 | bfdc1dbd1b73bc26 | OK | OK |
| .paep-control/text/PAEP_IR_01_v1.0_text.md | 38704 | 5cd5f01ab5a03629 | OK | OK |
| .paep-control/text/PAEP_v1.1_text.md | 85725 | 7abebe5fa09c6f90 | OK | OK |

- 13 of 13 controlled files match (12 under `.paep-control/` plus `.gitignore`).
- Files under `.paep-control/` that are not in the manifest: none in the working tree and none tracked at the PR head (12 tracked, 12 in the manifest). No ignored or untracked files are under `.paep-control/`.
- `git log --oneline -- .paep-control` returns one commit only: `8259317 Restore .paep-control/ and .gitignore from PAEP_CTRL.zip`.
- `git diff --stat 8259317 origin/claude/ib0-wp02-c625bb -- .paep-control .gitignore PACK_MANIFEST.json` is **empty** (exit 0). The same diff against the working tree is also empty, and `git status --porcelain` is clean.
- The other pack-instruction files in the manifest also match at the PR head: CLAUDE.md, CLAUDE_ENVIRONMENT_GUIDE.md, NEXT_AFTER_PASS.md, PACK_CONTENTS.md, RUN/WINDOWS readmes, work-packages/IB0-WP01/{ACCEPTANCE.md, WORK_PACKAGE.md, QUALITY_GATE_RUNBOOK.md, ACCEPTANCE_REPORT_TEMPLATE.md, work-package.json, prompts/*}, and tooling/verification/{validate-pack.mjs, verify-ib0-wp01.mjs}.
- For information, some manifest entries differ from their template hashes. These are living documents, not controls:
  - Already different on main (`b6b023f`), from the WP01 population: README.md, docs/architecture/IB0-WP01-IMPLEMENTATION-PLAN.md, docs/provenance/PROVENANCE-REGISTER.md, evidence/IB0-WP01/{README.md, notes/implementation-summary.md, reports/dependency-baseline.md, reports/toolchain-baseline.md}, and work-packages/IB0-WP01/{ACCEPTANCE_REPORT.md, TRACEABILITY.csv}.
  - Changed by WP02: README.md, docs/provenance/PROVENANCE-REGISTER.md, and docs/adr/ADR-REGISTER.md. ADR-REGISTER.md matched its template on main. WP02 appends a "Work-package notes" row that says no ADR is needed. It approves no ADR.
  - WP02 does not touch any evidence/IB0-WP01, work-packages/IB0-WP01, CLAUDE.md or package-lock.json file. The diff over those paths lists 0 files.

**Verdict: PASS.** The controlled sources are byte-identical to the manifest and have not changed since `8259317`.

## 2. Branch and PR identity: PASS

| Item | SHA |
| --- | --- |
| Local HEAD (branch claude/ib0-wp02-c625bb, in sync with its upstream) | 39bf00e4b87a0a7d949c9189d3db50df732d7fc2 |
| origin/claude/ib0-wp02-c625bb (after fetch) | 39bf00e4b87a0a7d949c9189d3db50df732d7fc2 |
| GitHub PR #2 head.sha / refs/pull/2/head / list_branches | 39bf00e4b87a0a7d949c9189d3db50df732d7fc2 |
| Expected head | 39bf00e4b87a0a7d949c9189d3db50df732d7fc2 (match) |
| PR #2 base.ref / base.sha | main / b6b023fea11625360f0bf43cd0bdcba968cda90d |
| origin/main (after fetch), remote HEAD, list_branches main | b6b023fea11625360f0bf43cd0bdcba968cda90d |
| git merge-base origin/main PR head | b6b023fea11625360f0bf43cd0bdcba968cda90d |

- **Base drift: none.** main has not moved past the merge base and is 0 commits ahead. The PR is 4 commits ahead: 8525598, 591b266, 916cb9d and 39bf00e, all authored by Claude on 2026-09-23 between 20:35 and 20:47 UTC.
- `refs/pull/2/merge` is 66843790, with parents b6b023f and 39bf00e. Its tree is identical to the PR head tree, so the merge is trivial and conflict-free.
- Note: the PR body's verification table cites a fresh clone of `916cb9d`. The head is `39bf00e`, the evidence commit that follows it. The body says the verifier also passed on `39bf00e`.

**Verdict: PASS.**

## 3. PR state: technically mergeable, but with governance blockers

- State: **open, draft = true**. `mergeable_state = clean`, with no conflicts. GitHub computes `clean` even for a draft, but a draft PR cannot be merged until it is marked ready for review.
- Reviews (`get_reviews`): **none**. The requested reviewer is kougit and the assignee is kougit.
- Review threads (`get_review_comments`): 0. Unresolved threads: 0.
- Issue comments (`get_comments`): 0.
- Check runs on 39bf00e: 0. Combined status: `pending`, with 0 statuses. This is GitHub's default empty state, not a failing check.
- GitHub Actions workflows in the repo: 0 (`list_workflows` total_count 0). No CI exists, so nothing can currently report a required check. The PR body says CI is IB0-WP05 work.
- Branch protection and rulesets on main:
  - `list_branches` reports `main` with `protected: false`, so no classic branch-protection rule is in place.
  - Repository rulesets could not be determined: no read-only mcp__github__ tool exposes them.
  - Circumstantial evidence from PR #1: it was merged at 2026-09-23T20:09:25Z by `claude[bot]`, after two APPROVED reviews from the owner kougit (19:55 and 19:59, both on 55a3890). It had no checks and no workflows. The merge commit b6b023f was committed by GitHub. This is consistent with no required status checks. It cannot show whether an approval was required, because approvals were present.
- The PR body itself says the work is "technical PASS from a self-assessment … not independently QA'd … **not ACCEPTED**. Do not merge until you authorise it." It lists three pending human decisions:
  1. Approve the drafted WP02 definition.
  2. Update or confirm CLAUDE.md, whose bounded objective still names IB0-WP01.
  3. Approve the lightningcss (MPL-2.0) and caniuse-lite (CC-BY-4.0) licence dispositions.

**Verdict: no technical blocker (clean, no conflicts, no failing or required checks). GitHub-side blockers to closing:**
1. The PR is still a draft.
2. PR #2 has no approving review.
3. The PR's own text withholds merge authority pending human acceptance and the three decisions above.

## 4. Scope: no WP03 or WP04 implementation on the PR head: PASS

`git diff --name-status b6b023f origin/claude/ib0-wp02-c625bb` lists 58 paths, which matches the GitHub `changed_files` count of 58.

- Modified (M, 5 files):
  - README.md
  - docs/adr/ADR-REGISTER.md
  - docs/licences/README.md
  - docs/provenance/PROVENANCE-REGISTER.md
  - package.json
- Added (A, 53 files):
  - Tooling:
    - .npmrc
    - .nvmrc
    - tooling/verification/verify-ib0-wp02.mjs
  - Docs:
    - docs/architecture/IB0-WP02-IMPLEMENTATION-PLAN.md
    - docs/architecture/toolchain-version-manifest.json
    - docs/licences/THIRD-PARTY-LICENCE-REVIEW.md
  - Evidence (39 files):
    - evidence/IB0-WP02/README.md
    - evidence/IB0-WP02/logs/*.log|json (32 files): build-output-vs-baseline, build-reference-app, build-ui-lab, clean-clone-reproduction, controlled-source-integrity, dist-hashes, erratum-baseline-install-scripts, ib0-wp01-verification.regression.json, install-scripts-ls, licence-dist-check, lockfile-regenerate-check, lockfile-unchanged, negative-install-script, negative-lockfile-drift, negative-node-version, negative-verifier-manifest, ng-version, npm-audit, npm-ci-analysis, npm-ci, npm10-vs-npm11-installed-tree, registry-review, scope-and-secret-scan, toolchain-versions, verify-ib0-wp01-regression, verify-ib0-wp01-restore, verify-ib0-wp02
    - evidence/IB0-WP02/notes/implementation-summary.md
    - evidence/IB0-WP02/reports/: ib0-wp02-verification.json, install-script-policy.md, licence-inventory.json, licence-inventory.md, lockfile-diff.md, version-manifest.md
  - Work package (12 files):
    - work-packages/IB0-WP02/: ACCEPTANCE.md, ACCEPTANCE_REPORT.md, ACCEPTANCE_REPORT_TEMPLATE.md, QUALITY_GATE_RUNBOOK.md, TRACEABILITY.csv, WORK_PACKAGE.md, work-package.json
    - work-packages/IB0-WP02/prompts/: 00_QUICK_START.txt, 01_EXECUTE.md, 02_INDEPENDENT_QA.md, 03_DEFECT_REPAIR.md, 04_ACCEPTANCE_SUMMARY.md
- Flag filter for `tsconfig*|angular.json|^apps/|^packages/|nx.json|project.json|eslint|^.github/`: **no matches**.
- `package.json` diff:
  - Adds `devEngines` (node 24.21.0 and npm 11.19.0, onFail=error), the `qa:ib0-wp02` script, and `allowScripts`, which sets false for @parcel/watcher, esbuild, fsevents, lmdb and msgpackr-extract.
  - Makes no dependency or devDependency change.
  - `package-lock.json` is not in the diff.
- No WP03 (strict TS settings), WP04 (Nx graph) or WP05 (CI and .github) artefacts are present.

**Verdict: PASS.** The diff is confined to toolchain pinning, install-script policy, licence review, and WP02 docs and evidence.

## Summary

| Item | Verdict |
| --- | --- |
| 1. Immutable controls | PASS (13/13; no change since 8259317) |
| 2. Branch and PR identity; base drift | PASS (all SHAs equal 39bf00e; base equals main equals merge-base b6b023f; no drift) |
| 3. PR state and GitHub gating | Clean with no conflicts. **Blockers:** draft, 0 approvals, and human acceptance still pending per the PR text. No checks or workflows exist. main is not protected (classic). Rulesets are unknown. |
| 4. WP03/WP04 scope leakage | PASS (58 paths, none flagged) |
