# IB0-WP04 Independent QA (final, round 8): b084402 (base ac6b786)
Fresh clone at b084402 with `npm ci` rc=0, Node 24.21.0 / npm 11.19.0. The review was read-only: nothing was committed or pushed. The evidence rewritten by local runs was restored with git checkout.
Logs and probes are in qa8/: arch.json, graph.json, neg.log, closure.mjs/.log, probe.mjs/.log, effopts.mjs.

## Overall verdict: PASS (technical)
Lanes B, C and D PASS. Lane A PASS for traceability and scope. The docs are stale and must be updated (list below).
There are no high findings. One medium checker gap (M1) is not a bypass of the WP04 gate, because the verifier (V17, V07; V16 on a real install) blocks it.

## Lane A: definition and traceability: PASS, docs stale
- AC01–AC29 each trace to IB-01, IR-01, EQP, PAEP v1.1 or CLAUDE.md (definition-audit §4). TRACEABILITY has 21 rows and all are PASS.
- Scope: package.json adds only 4 scripts (arch:check, qa:architecture, qa:ib0-wp04, qa:ib0-wp04:negative); no empty EQP names, no CI/test-runner/lint config; every entry point is still `export {}`. No WP05 or IB1 scope.
- Stale items to update:
  1. WORK_PACKAGE.md header: "DRAFT pending PO/SA approval" should say approved (D5).
     - §4(iii) says "three scripts". Make it four, adding qa:architecture (D1, EQP App. B).
     - §6 "Decisions taken by default (pending)" should become the approved decisions:
       - D1–D4;
       - the Optional links (permitted, not required);
       - "No" as a reachability constraint;
       - the same-category allowlist, which replaces §6(i) "not allowed without an ADR";
       - the WP03 bounded exception.
     - §9 needs drafting entries for QA rounds 6 and 7, D1–D4, and the reachability decision (b084402).
  2. ACCEPTANCE.md:
     - AC09: "same-category edges are not allowed" should read "only when allowlisted, directly and transitively". Also add "No" as a reachability constraint.
     - AC16: add C5, O1–O8, T1–T5, N46–N52, S1–S9 and S1c/S2c. Change the result "5/5 controls; 45/45 rejected" to "16/16 controls; 66/66 rejected (82/82)".
     - AC21: "three WP04 scripts" should be four.
     - AC06: add S1/S2 build proofs, S6 noCheck, S7 inheritance. AC23: remove "Pending PO/SA decision".
  3. TRACEABILITY.csv:
     - IB0-ARCH-NEG-001: "5/5 controls; 45/45" should be 82/82.
     - IB0-ARCH-DIR-001: add N46–N48, N50–N52, O1–O8, T1–T5 and C5.
     - IB0-ARCH-CYCLE-001: add N49. IB0-ARCH-STRICT-001: add S1–S9. Add a row or source for D1 (EQP App. B qa:architecture) and the D2 allowlist.
  4. definition-audit.md:
     - §5 D2, D3 and D12, and §6 C1, are still marked "default, pending". Record them as resolved by the PO/SA.
     - Add the reachability rule, the 4 forbidden reachable pairs, and a note that 8 of the 19 Optional cells are same-layer.
  5. Evidence is from commit 9c74dbe with 50/50 cases. It must be regenerated at the final head for:
     - negative-tests.json and the negative logs;
     - ib0-wp04-verification.json;
     - README, technical-verification.md and acceptance-readiness.md (all say "50/50" and "PO/SA decisions needed").
  6. Also update:
     - ACCEPTANCE_REPORT.md ("50/50" and "Exceptions (pending PO/SA decision)");
     - work-package.json (definition_status DRAFT, optional_cells);
     - the implementation plan §(i)/(i-a) and the checker README (no allowlist or reachability yet);
     - the negative runner's header comment.

## Lane B: architecture graph: PASS
- The check exits 0: 20 projects (18 libraries, 2 apps), 144/144 matrix cells, 18 aliases resolving 36/36, 0 violations. `--graph` writes 20 nodes, 0 edges.
- The 18 npm workspaces match packages/ directories and package.json names; angular.json has exactly 2 apps with matching roots.
- Tags are layer:/type:. depConstraints follow the matrix; for example frappe-sdk allows only contracts, platform, observability and offline.
- Imports: 18 across 26 files, all @angular/* or local to the app, so there are 0 workspace edges.
- 0 forbidden edges, 0 deep imports, 0 cycles and 0 unknown owners. 0 nested package.json files (18 manifests found, all at package roots) and 0 symlinks.
- My own closure of Appendix B, parsed from the controlled text:
  - 5 two-step chains end in a "No" pair, exactly T1–T5: obs>plat>found, offl>plat>found, offl>i18n>found, frappe>plat>found, frappe>offl>i18n.
  - They give 4 forbidden reachable pairs (obs→found, offl→found, frappe→found, frappe→i18n); longer chains add none. The only possible cycle is platform↔observability (N05).

## Lane C: adversarial: PASS
- `qa:ib0-wp04:negative` exits 0 with 82/82 (16 controls, 66 rejections). Each case fails on its intended rule. T1–T5 fail on transitive DIRECTION only, and O1–O8 pass with 1 Optional edge each.
- My own probes: 13 behaved as expected and 3 did not (recorded as M1 and L1 below).
  - P1: 3-step chain frappe→offline→platform→foundation. Rejected (transitive DIRECTION, frappe→foundation).
  - P2: chain made only through manifest dependencies (offline→platform→foundation). Rejected.
  - P3/P3b: chain through a `#` import (bare target, and a relative target) plus offline→i18n. Rejected (DIRECTION, and ENTRY_BYPASS for the relative target).
  - P4/P4b: directory or file symlink whose real path is inside the same package. REJECTED (CLASSIFICATION): every symlink below a project root is refused whatever its real path, which is stricter than a real-path check and fails closed.
  - P4c: symlink at the workspace root into another package, reached by a relative import. Rejected (OUTSIDE_PROJECT).
  - P5/P5b: Optional dq→enterprise plus allowlisted dq→df plus df→analytics or df→enterprise. Pass, which is correct. P5c, the same chain ending upward in domain-iot, is rejected. P1b, P1c and P8 are positive controls and pass.

## Lane D: tsconfig and strictness: PASS
- tsconfig.base.json holds only compilerOptions.paths: 18 exact entries, with no wildcard, alias chain or baseUrl.
- The inheritance chain is tsconfig.json → extends ./tsconfig.base.json, which keeps the literal strict, noImplicitAny and strictTemplates settings. Both apps/*/tsconfig.app.json files extend ../../tsconfig.json and are unchanged.
- readConfiguration, both apps: 0 errors; strict, noImplicitAny, strictTemplates true; noCheck unset; no strict-family option false; 18/18 aliases resolve to packages/<dir>/src/index.ts.
- S1–S9 cover everything required (S1c/S2c prove the build proofs are sensitive to the setting): S1 TS build fails TS7006/TS2322; S2 template build fails TS2345;
  S3/S4/S5 strict, noImplicitAny, strictTemplates fail V05; S6 noCheck fails V05; S7 base weakening fails V04; S8 strictNullChecks=false fails; S9 @ts-nocheck fails.

## Findings
- M1 (medium; checker gap; not a real bypass in WP04). A workspace package reached under a non-@proseit name is treated as external, so the edge is invisible. The checker judges bare specifiers by name, not by canonical real path.
  - Repro: add `"i18n-x": "file:../i18n"` or `"npm:@proseit/paep-i18n@0.0.0"` to the frappe-sdk dependencies and `import 'i18n-x'` (P6/P6b). The check exits 0.
  - With the node_modules link that npm would create, TypeScript resolves `i18n-x/src/index` to packages/i18n/src/index.ts.
  - Contained in WP04: my verifier run failed V17 (packages changed) and V07, and a real install would also change the lockfile (V16), so it cannot merge now. It becomes live once packages and the lockfile may change (IB1).
  - Fix: realpath-resolve bare specifiers and manifest deps via node_modules, or reject file:/link:/workspace:/npm: specs naming workspace packages; else record as a known limitation.
- L1 (low; not a bypass). A symlinked directory under packages/ (for example packages/zzz → i18n) is not reported, because Dirent.isDirectory() is false for a symlink (P4d). By code reading (not run), imports through it fail closed (OUTSIDE_PROJECT) and V17 would catch it.
- L2 (low; reporting). The negative-tests.json `controls` and `negatives` counters count only C* and N* ids, so O, T and S cases are uncounted (it shows 6/52 instead of 16/66).
- L3 (low; hardening). V05 does not assert that the effective `noCheck` is not true. It is covered indirectly by the baseline diff (S6), the paths-only base (S7) and the unchanged app tsconfigs.
