# IB0-WP05 Proposed Pull-Request Enforcement for `main`

**Status:** PREPARED, NOT APPLIED. Activation timing is a PO/SA decision at WP05 acceptance (PO/SA brief §22, §25).  
**Required check context:** `PAEP / gate` (GitHub Actions check run from workflow "PAEP CI", job id `gate`). The exact name and GitHub App are confirmed from the real run in `evidence/IB0-WP05/reports/github-actions-run.md`.

## 1. Current repository state (read through the GitHub API, 2026-09-24)

| Setting | Value |
| --- | --- |
| Visibility | private (owner account `kougit`) |
| Default branch | `main` |
| Branch protection on `main` | none (`protected: false`); reading it returns 403 |
| Repository rulesets | `GET /repos/kougit/proseit-paep/rulesets` returns 403 "Upgrade to GitHub Pro or make this repository public to enable this feature." |
| Merge methods | merge commit, squash and rebase all allowed; auto-merge off; delete-branch-on-merge off |
| Actions settings | not readable through this environment's GitHub proxy |

**Consequence:** on the current GitHub plan, a private personal repository cannot have branch protection or rulesets. Required checks on `main` cannot be activated until the owner either upgrades the account (GitHub Pro or a paid organisation plan) or makes the repository public. Making PAEP public is not recommended (proprietary platform source). This is an account decision for the PO/SA; WP05 changes nothing.

## 2. Why nothing is applied now

A required check that names `PAEP / gate` before the workflow exists on `main` could block every merge, including this one (the check would never report for branches without the workflow, and the first run on `main` happens only after merge). The safe order is: merge WP05 → confirm a green `PAEP / gate` on the `main` push run → apply the rule below.

## 3. Proposed rule (ruleset form, preferred)

```json
{
  "name": "PAEP main protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["merge"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [ { "context": "PAEP / gate", "integration_id": 15368 } ]
      }
    }
  ]
}
```

| Choice | Reason |
| --- | --- |
| Pull request required | No direct pushes to `main`. |
| `PAEP / gate` only | The gate already requires all nine jobs; listing them individually would duplicate the policy and break when a job is renamed. |
| `integration_id` 15368 (GitHub Actions) | Only a check posted by GitHub Actions satisfies the rule; a status or check with the same name from another app does not. Confirm the app id from the real run before applying. |
| Branch must be up to date (`strict: true`) | Work packages merge one at a time, so this costs one re-run when `main` moves and guarantees the gate ran against the current `main`. No deadlock: "Update branch" re-triggers the `pull_request` run. |
| Required approvals: 0 | The repository has one maintainer, who also authors the PRs; GitHub does not let an author approve their own PR, so 1 would block every merge. PO/SA acceptance stays the human control. Revisit when a second reviewer exists. |
| Conversation resolution required | Review comments must be resolved before merge; cheap and consistent with the WP QA loops. |
| No force-push, no deletion | Protects accepted history and merge commits cited in evidence. |
| Merge commits only | Every WP so far has merged with a merge commit, which the verifiers' baseline SHAs depend on. |
| No bypass actors | The gate cannot be skipped casually; changing the ruleset itself remains an explicit, audited owner action. |

Classic branch protection equivalent (if rulesets are unavailable but protection is): `required_status_checks: { strict: true, checks: [{ context: "PAEP / gate", app_id: 15368 }] }`, `enforce_admins: true`, `required_pull_request_reviews: { required_approving_review_count: 0 }`, `required_conversation_resolution: true`, `allow_force_pushes: false`, `allow_deletions: false`.

## 4. Activation steps (after merge and plan decision)

1. Confirm the `push` run of "PAEP CI" on the merge commit shows `PAEP / gate` = success, and read its check run's `app.id`.
2. `POST /repos/kougit/proseit-paep/rulesets` with the JSON above (owner token with administration: write).
3. Verify: `GET /repos/kougit/proseit-paep/rules/branches/main` lists the four rules; `GET /repos/kougit/proseit-paep/branches/main` shows `protected: true`.
4. Negative check: a direct push to `main` is rejected, and a test PR whose gate fails shows "Required status check PAEP / gate has not succeeded" and cannot be merged. Record both under the evidence of the work package that activates enforcement.

## 5. Residual risks until activation

Until the rule is active, CI is advisory: a failing `PAEP / gate` shows on the PR but does not block the merge button. The controlled process (PO/SA merge authorisation after reading the gate) is the control in the meantime.
