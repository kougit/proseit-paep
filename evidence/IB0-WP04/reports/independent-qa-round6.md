# IB0-WP04 independent QA round 6: delta review of 9c74dbe (R5-M1, R5-L1)

**Verdict: PASS for the delta.** R5-M1 and R5-L1 are closed, with no false positives. No new real bypass was found. Three low or informational residuals are listed below.
Setup: copies of the repo at 9c74dbe, with node_modules symlinked in. Node from /opt/node24. The repo was not modified. Probes: qa6/probe.sh, probe2.sh and probe3.sh; logs are probe*.log and neg-run.log. Each probe ran `check-boundaries.mjs --json` and was reset afterwards.

## Gates
- `npm run arch:check` in the copy: PASS. 20 projects, 18 imports in 26 files, 0 violations.
- `npm run qa:ib0-wp04:negative` in a full copy: **PASS (50/50)**. N43 and N45 report CLASSIFICATION, N44 reports OUTSIDE_PROJECT, and C4 exits 0.
- Cleanup: C4 runs right after N45 and exits 0 with no rules, so N45's symlink and tooling/wp04-outside were removed. The runner's temp copy is deleted in `finally`. Afterwards, `git status` in the copy shows only evidence/IB0-WP04/logs/negative-architecture-tests.log and reports/negative-tests.json, plus the untracked node_modules link.

## Probe results
| Probe | Result |
|---|---|
| R5-M1 repro: directory symlink in components/src pointing to tooling/ | Caught: CLASSIFICATION |
| Symlink to a *file* (src/evil.ts pointing to tooling/.../use.ts) | Caught: CLASSIFICATION |
| Dangling symlink in src/ | Caught: CLASSIFICATION |
| Symlink in src/node_modules/, reached by a relative or a bare import | Caught: CLASSIFICATION |
| Directory symlink in apps/reference-app/src | Caught: CLASSIFICATION |
| Symlink under a symlinked app root | Caught: CLASSIFICATION |
| Library root packages/components is itself a symlink | Caught indirectly: "library not an npm workspace", plus DIRECTION when the target imports enterprise |
| Hard link in src/ to a file outside the project | Not a bypass: the linked file is scanned as components source, so DIRECTION is reported |
| False-positive control: symlink under packages/components/node_modules, not imported | Passes (correct) |
| R5-L1: apps/reference-app/package.json is a directory, with a `#x` import | No crash: OUTSIDE_PROJECT "does not resolve"; passes when there is no `#` import |

## Findings
- **R6-L1 (low, robustness, fails closed; not in the delta).** If a *library's* root package.json (for example packages/components/package.json) is a directory, the checker still crashes with EISDIR and exits 2 with no rule named. The crash comes from `readJson` in the workspace classification loop, not from `subpathTargets`. The build is still blocked. Repro: `rm packages/components/package.json && mkdir packages/components/package.json`, then run the checker.
- **R6-L2 (low, informational; not a bypass).** A symlinked directory directly under packages/ or apps/ that is not in the model is not flagged as unclassified. Discovery uses `Dirent.isDirectory()`, which is false for a symlink, so `packages/rogue` pointing outside and `apps/rogue-app` pointing to ../tooling both give ok=true. It is inert: importing it gives UNKNOWN_PACKAGE (`@proseit/rogue`) or OUTSIDE_PROJECT (relative path).
- **R6-I1 (informational; not a bypass).** An application root that is itself a symlink (apps/reference-app pointing to ../tooling/ra) is not flagged, because the symlink check sees only entries *below* a root. Its content is scanned under the logical path, and nested symlinks are still caught. I tried to exploit a mismatch between the logical and real paths (`./../../reference-app/src/x`). The checker passes, but `tsc -p apps/reference-app/tsconfig.app.json` fails with TS2882 because TypeScript also resolves logically, so nothing is hidden. To be thorough, the root could also be checked with `lstat`.
- **Known, unchanged (R2-O1).** Code reached through a symlink or a directory under a *project-root* node_modules is still skipped: a relative import into ../node_modules/evil, or a bare `evil/use`, passes. This is the round-2 posture: node_modules is gitignored, and a bare module is treated as external. The delta did not change it.
