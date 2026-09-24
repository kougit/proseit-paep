# IB0-WP04 independent QA round 5: delta review of dcda855

**Verdict: PASS for the delta.** F-1, F-2 and the low finding are closed, and none of the new code causes a false positive. One bypass was found that predates this commit and lies outside the delta (R5-M1). It should be fixed or accepted before merge.

**Setup:** copies of the repo with `.git`, taken at dcda855, with node_modules symlinked in. Node 24.21.0. The repo was not modified. Probe script: `qa5/probe.mjs`. Output: `qa5/probe.log` and `qa5/neg-run.log`.

**Gates:** `npm run arch:check` passes in the copy: 20 projects, 18 imports in 26 files, 0 violations. `npm run qa:ib0-wp04:negative` passes 49/49, including N43 (CLASSIFICATION), N44 (OUTSIDE_PROJECT) and C4 (exit 0).

## How each fix holds up (checker run with `--json`)
| # | Probe | Result |
|---|---|---|
| P1 | A *directory* named `package.json` under `packages/components/src/sub/` | Passes, which is correct. TypeScript and Node both skip the directory: `#z` still resolves through the root manifest to `src/lib/x.ts`. No bypass. |
| P2/P3 | `apps/reference-app/package.json` (the app's own manifest) maps `#` to a deep import or to another app | Caught: DEEP_IMPORT; ENTRY_BYPASS plus DIRECTION. |
| P5 | Nested `package.json` under `apps/reference-app/src/app/` | Caught: CLASSIFICATION (plus OUTSIDE_PROJECT "does not resolve"). |
| P6 | Nested `package.json` whose name is `@proseit/paep-components`, placed inside enterprise | Caught: CLASSIFICATION. |
| P19 | Nested `package.json` that is a *symlink to a file* outside the project | Caught: CLASSIFICATION. |
| P7/P8 | A `#y` target inside a nested condition (`{node:{import:"#y"}}`) or an array (`["./x.ts","#y"]`) | Caught: OUTSIDE_PROJECT. |
| P9 | A pattern hole that produces a `#` target (`"#p/*":"*"`, importing `#p/#y`) | Caught: OUTSIDE_PROJECT. |
| P10 | The same hole producing a bare package name (`#p/@proseit/paep-enterprise`) | Caught: DIRECTION. |
| P11 | `imports` in the root package.json used by an app file (apps have no manifest, so Node and TypeScript would use the root one) | Caught: OUTSIDE_PROJECT "does not resolve". The checker never reads the root map for a project. |
| P12 | Root `imports` sets `#z` to a forbidden package, but the package's own manifest maps `#z` to a local file | Passes, which is correct: the nearest manifest wins. |
| P14 / P15 / P16 | A `package.json` under `packages/components/node_modules/`; the `#lib/*` control; a three-condition `#c` | All pass, with no false positive. `importsScanned` goes from 18 to 19, so `#c` is counted once. |

## Findings
- **R5-M1 (medium, real bypass, predates this commit, outside the delta).** `walk()` treats a symlinked directory as a file. It does not descend into it, and it does not flag it. Git commits the symlink (mode 120000), and TypeScript follows it.
  - **Reproduction:**
    1. Create `tooling/qa5-evil/use.ts` containing `import '@proseit/paep-enterprise'; export {};`.
    2. Run `ln -s ../../../tooling/qa5-evil packages/components/src/evil`.
    3. Append `import './evil/use';` to `packages/components/src/index.ts`.
  - **Result:** `arch:check` reports PASS with 0 violations, although TypeScript resolves the chain components -> evil/use.ts -> enterprise.
  - **Also:** a symlinked directory can hold a nested package.json and the `#` users that depend on it, so it is also a way around F-1.
  - **Suggested fix:** flag any symlink found under a project root, or resolve it with realpath and check the owner.
- **R5-L1 (low, robustness; fails closed).** If `apps/<app>/package.json` is a directory and an app file uses a `#` import, the checker crashes with EISDIR and exits 2 (P17). The build is still blocked, but no rule is named.
- **R5-L2 (low, informational).** The checker does not validate `apps/<app>/package.json` beyond its `imports`. P4, which sets its name to `@proseit/paep-enterprise` and adds an unknown `@proseit/*` dependency, passes. Apps are not workspaces and may depend on every package, so no edge is lost.
- **R5-I1 (informational, not a false positive).** A `package.json` under `src/node_modules/` is flagged (P13). This matches round 2's decision to scan nested `node_modules`.
- **Already known:** source reached by a relative import into a project-root `node_modules/` is still skipped (P20; round 2 recorded this as R2-O1). A `.git` directory under a package is skipped too (P21), but git refuses to commit that path.
