# IB0-WP04 independent QA round 7: delta review of c745a74
Verdict: PASS for the delta. Nothing got past the checks. There are 0 high and 0 medium findings and 4 low findings, all defence-in-depth or wording.
Copy: scratchpad/qa7/repo (cp -a with .git, node_modules symlinked), Node 24.21.0. Probe scripts and logs are in scratchpad/qa7.

## Gates
- `npm run qa:architecture`: exit 0, PASS, 20 projects, 0 edges, 0 violations (qa-architecture.log). With an injected domain-quality -> domain-fiscal import: exit 1 with DIRECTION (qa-architecture-negative.log). It is a real gate, not an empty PASS, and it runs the same command as arch:check. EQP line 608 names it.
- `npm run qa:ib0-wp04:negative`: 68/68 PASS, exit 0 (qa-negative.log).
- `verify-ib0-wp04.mjs --static-only`, unmutated: 19/19 PASS.

## D2 same-category allowlist (probe-allowlist.mjs / .log, 24 cases, `--json`). Every case behaved as expected.
- Same pair listed twice: MODEL "duplicated". Self edge: MODEL. Unknown name, or a name with a trailing space: MODEL, and the edge still fails with DIRECTION. edges not an array, or the allowlist removed: MODEL. Whitespace-only approval: MODEL.
- A chain through another category (domain-quality -> enterprise -> domain-fiscal): DIRECTION on the upward edge, plus DIRECTION "reaches ... transitively". Reversed listed pair: DIRECTION. A->B->C with A->C unlisted: DIRECTION (N47). With A->C listed: PASS, as expected.
- app -> app, unlisted: ENTRY_BYPASS and DIRECTION. Allowlisted, by relative or rooted path: ENTRY_BYPASS, so it still fails.
- Allowlisted pair reached by a relative path, a `/// <reference path>` or a `#` import mapped to the other package's file: ENTRY_BYPASS. Allowlisted pair plus a downstream "No" edge: DIRECTION.
- Unlisted pair through a manifest peerDependency or a `#` import mapped to the bare name: DIRECTION. Two `sameCategoryAllowlist` keys in the raw JSON: the last one wins (the empty list), so DIRECTION.
- Allowlisted pair through a manifest dependency or a `#` import mapped to the bare public name: PASS. This is correct: both go through the target's public name. Cycles are still caught (N49).

## D3/D4 strictness (probe-strict.mjs / .log, static verifier)
The following were all caught:
- extends chain inserted into an app tsconfig: V05 and V17;
- tsconfig.json with an array extends: V04;
- tsconfig.base.json with extends, noCheck, a `C` escaped key or angularCompilerOptions: V04;
- an alias with two targets: V06;
- `@ts-expect-error`, template `$any(` or `@ts-nocheck` in apps: V05 and V17;
- `@ts-nocheck` in a gitignored apps/src/tmp file: V05.
B02c (a duplicate `compilerOptions` key whose first copy has strict:false) is not flagged, and it is not a bypass. TypeScript also keeps only the last key, and the effective check in V05 confirmed strict=true.

## Findings (all low; none bypasses WP04 today)
- L1: the V05 suppression regex misses template `$any(` in an inline template string, `@Component({ jit: true })` (Angular's JIT mode, which skips AOT template type checking) and templates in non-.html files (e.g. `.tpl`). Repro: B04b, B05b, B05e. Only V17 catches these, because WP04 freezes apps/packages. That becomes a real gap once a later WP unfreezes apps. Not a bypass now. I did not build-test these three.
- L2: V17 uses `git ls-files --others --exclude-standard`, so a gitignored file under apps/packages (e.g. `apps/reference-app/src/tmp/x.ts`, which the app tsconfig includes) goes undetected (B05d, exit 0). Such a file cannot enter a commit without being forced. Directives in it are still caught by V05 (B05c). Not a bypass.
- L3: the allowlist accepts app -> app entries and entries for pairs with no edge (A05d, exit 0), and the approval is free text that is not linked to docs/adr. Any app -> app edge still fails with ENTRY_BYPASS, because apps have no public entry point. Consider rejecting category `app` and stale entries. Not a bypass.
- L4: the name of V08 still says "no same-category edge", which is misleading now that allowlisted edges pass. The graph's depConstraints do not show allowlisted pairs. Wording and reporting only.
