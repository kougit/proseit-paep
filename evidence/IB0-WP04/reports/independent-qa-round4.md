# IB0-WP04 independent QA round 4: R3-L1 fix (be181cf), package.json "imports"

Repo: <repo>, branch claude/ib0-wp04-011ntv, HEAD 5d92109. Read-only; experiments in scratch copies (qa4/repo, qa4/repo2). TypeScript 6.0.3, Node 24.21.0, esbuild from the workspace.

## Verdict: FAIL (2 bypasses left: 1 high, 1 medium). The R3-L1 fix itself is correct for what it covers.

## What the fix gets right, compared with Node's semantics
- Exact key first (`Object.hasOwn`); an exact `null` is flagged as unresolved, and Node also throws there.
- Pattern keys with one `*` are sorted by longest prefix, then by longest key. This matches Node's PATTERN_KEY_COMPARE. Keys with several `*` are ignored, as in Node.
- Every string in nested condition objects and arrays is collected, and `null` leaves are skipped. This checks more targets than Node would pick, which is the safe direction.
- The `*` hole is substituted into every `*` of a target. `./`, `../` and absolute targets become paths and are checked with ownerOf. Anything else is checked as a bare specifier (DIRECTION, DEEP_IMPORT, UNKNOWN_PACKAGE).
- Accepted looseness (not a bypass): the checker allows an empty `*` hole, and it resolves `../`, `/`, `..` and `node_modules` targets that Node rejects. Both make it stricter than Node.

## Bypass probes: all caught (checker run with --json in scratch, imports placed in packages/components/package.json)
A1 `"#x":"./../platform/src/index.ts"` -> ENTRY_BYPASS | A2 `"#x":"@proseit/paep-enterprise"` -> DIRECTION
A3 `"#x":"@proseit/paep-foundation/src/index.ts"` -> DEEP_IMPORT | A4 nested `{node:{import:{browser:bad}},default:ok}` -> DIRECTION
A5 array `["./src/index.ts",{default:bad}]` -> DIRECTION | A6 `"#p/*":"@proseit/*"` -> DIRECTION
A7 mid-string `"#m/*.js":"@proseit/paep-*"` -> DIRECTION | A8 exact `null` plus `"#*"` -> OUTSIDE_PROJECT (unresolved)
A9 `{types:null,default:bad}` -> DIRECTION | A10 `../../tooling/...` -> OUTSIDE_PROJECT | A11 hole `../platform/...` -> ENTRY_BYPASS
A12 `"#*":"*"` deep specifier -> DEEP_IMPORT | A13 absolute target -> ENTRY_BYPASS | A15 dynamic import() and import('#x') type -> DIRECTION
A16 `export * from '#x'` -> DIRECTION | A18 missing key -> OUTSIDE_PROJECT

## False-positive controls: all pass (ok=true)
F1 exact `#lib` -> ./src/lib/ok.ts; F2 `#lib/*` with types/import/default-array conditions; F3 `#lib/*.js` -> ./src/lib/*.ts;
F4 `#f` -> @proseit/paep-foundation (components -> foundation is allowed); F5 a longer same-package pattern wins over a shorter bad one.

## Findings
### F-1 HIGH, real bypass: a nested package.json scope is ignored
The checker always reads `${project.root}/package.json`. Node, TypeScript and esbuild use the nearest package.json above the importing file.
```
packages/components/package.json        "imports": { "#z": "./src/lib/ok.ts" }
packages/components/src/sub/package.json {"imports":{"#z":"@proseit/paep-enterprise"}}
packages/components/src/sub/use.ts       import '#z';        (index.ts: import './sub/use';)
```
- Checker: `ok=true`, 0 violations.
- TypeScript 6.0.3 resolves `#z` from sub/use.ts to packages/enterprise/src/index.ts.
- esbuild resolves it to packages/enterprise/src/index.ts.
- This is an upward edge from components to enterprise that the checker does not see. The same trick works without any imports in the root package.json.
- Fix: for each `#` specifier, find the nearest package.json from the importing file's directory up to the project root, and use its `imports`. Or flag any package.json below a project root.
- Add a negative case for it.

### F-2 MEDIUM, real bypass at type level: a `#` target that names another `#` subpath
```
"imports": { "#x": "#y", "#y": "@proseit/paep-enterprise" }     import '#x';
```
- Checker: `ok=true`. The expanded spec `#y` falls into the external-module bucket, which is only checked for contracts and analytics.
- TypeScript 6.0.3 (bundler resolution) follows the chain and resolves `#x` to packages/enterprise/src/index.ts.
- esbuild and Node do not follow it: "Could not resolve" and MODULE_NOT_FOUND.
- So a runtime import breaks the build, but `import type ... from '#x'` is erased and gives a hidden type-level dependency on enterprise.
- Fix: resolve an expanded target that starts with `#` again (with a depth or cycle guard), or flag it as unresolved.

### Low / informational (not bypasses)
- Messages for path targets print absolute paths, such as "/home/.../packages/platform/src/index.ts". Only a cosmetic issue for evidence portability.
- importsScanned counts expanded targets, so one `#` import with N targets counts N times.

## Gate runs in the scratch copy at 5d92109
- `npm run arch:check`: PASS. 20 projects, 0 edges, 18 imports in 26 files, 0 violations.
- `npm run qa:ib0-wp04:negative`: PASS (47/47), including N37 to N42 and C4. It needs `.git`, so it was run in a full copy (qa4/repo2).
- The real repo is unchanged: `git status` is clean at 5d92109.
