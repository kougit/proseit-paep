# IB0-WP04 independent QA, round 9: delta review of 05e593d (M1, L2, L3)
Copy: qa9/repo (cp -a incl. .git, node_modules symlinked). Probes: qa9/probe.sh, cases: qa9/cases/*, logs: qa9/logs/*.
Each probe case uses its own copy, with a real root node_modules made of symlinks, so no probe writes into the original repo's node_modules.

VERDICT: PASS for M1 as scoped: every alias-to-workspace route is rejected. There is one medium residual in the same family (F1), a manifest gap that is not a bypass on its own (F2), and no high findings.

Task 1, no false positives: `npm run qa:architecture` PASSES (20 projects, 0 edges, 0 violations). P00/P01 are OK: the apps' @angular/* imports through the root node_modules are still treated as external.
Task 2, bypass probes (checker --json, summary in logs/probes-summary.txt):
- Rejected with UNKNOWN_PACKAGE plus DIRECTION (frappe-sdk -> i18n):
  - P02: npm: alias to a non-@proseit name, root node_modules link;
  - P11: deep bare import i18n-x/src/index;
  - P12: scoped alias @x/i18n;
  - P14: require();
  - P15: import();
  - P16: /// <reference types>;
  - P20: #subpath -> alias;
  - P21: import('x') type;
  - P22: declare module.
- Rejected with UNKNOWN_PACKAGE only:
  - P04: peerDependencies file:;
  - P05: optionalDependencies link:;
  - P06: devDependencies workspace:*;
  - P13: app node_modules symlink (ui-lab -> enterprise).
- Rejected with CLASSIFICATION: P17 (packages/node_modules link) and P18 (src/node_modules symlink).
- P24: running from a symlinked root still rejects.

F1 (MEDIUM, real bypass after install, same family as M1): a bare name linked by node_modules to a directory inside the workspace but outside every project (for example tooling/) is treated as external. That directory's re-export of a forbidden package is never scanned.
  Repro (P23): packages/frappe-sdk/package.json dependencies {"i18n-x":"../../tooling/qa9x"}. The file tooling/qa9x/index.ts contains `export * from '../../packages/i18n/src/index'` and has a package.json. npm install creates node_modules/i18n-x -> ../tooling/qa9x, and frappe-sdk contains `import 'i18n-x'`.
  Result: checker ok=true, 0 edges. logs/P19-tsc-trace.txt shows TypeScript resolving i18n-x to tooling/qa9x/index.ts and compiling, with I18N used from i18n (P19b is also ok=true).
  The relative-path and in-project symlink versions are already rejected (OUTSIDE_PROJECT, N45). Suggested fix: when a linked realpath is under the root but ownerOf() is null, flag OUTSIDE_PROJECT (or reject every non-registry link).
F2 (LOW, manifest-only, not a bypass on its own): the protocol regex misses npm's plain-path specs "../i18n", "./x" and "/abs", and "../x.tgz". Verified in qa9/npmspec: npm install turns "../lib" into a symlink.
  P07 and P10 pass the checker. With a workspace target, the import is still caught by the realpath check (as in P02), so only the manifest edge goes unreported. F2 is what makes F1 reachable without a file: spec.
  Also not flagged: git+file: (P09), and an npm: alias to a non-@proseit name (P03), which is harmless unless it is installed as a link, when P02 catches it.
F3 (LOW, informational): "FILE:" in capitals (P08) is not matched, but npm treats it as a literal registry/path name (the link it creates dangles), so it is not exploitable.
L2: negative-tests.json reports controls=16, negatives=68, 84 cases; OK. L3: the V05 `if (o.noCheck)` on the effective options is reviewed by diff only, not probed; OK.
Task 3: `npm run qa:ib0-wp04:negative` gives PASS (84/84), including N53 (UNKNOWN_PACKAGE) and N54 (DIRECTION, UNKNOWN_PACKAGE); log in logs/negative.log.
  git status afterwards: only evidence/IB0-WP04/logs/negative-architecture-tests.log and reports/negative-tests.json are modified (plus the untracked node_modules symlink from the QA setup). No leftovers such as packages/frappe-sdk/node_modules.
Nothing was edited, committed or pushed in <repo>. Its HEAD has since moved to 3e171eb, a change made by another session; this review covers 05e593d. No secrets were printed.
