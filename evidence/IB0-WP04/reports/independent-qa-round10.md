# IB0-WP04 independent QA, round 10: delta review of d2f142c

**Verdict: PASS.** F1 and F2 are closed. There are no false positives on normal dependencies, and no committable bypass. Three low findings are listed below; none of them blocks.

Setup: full `cp -a` copies of head d2f142c under qa10/, with node_modules symlinked. The source repo was not touched.

## 1. Fix confirmation
- `npm run qa:architecture` on the copy: PASS. 20 projects, 0 edges, 18 imports in 26 files, 0 violations. The `@angular/core` and `@angular/router` imports in apps/reference-app pass.
- **F1 closed.** A link to tooling/, docs/, config/ or the repo root is now rejected as OUTSIDE_PROJECT.
- **F2 closed.** The manifest probes (the value of frappe-sdk `dependencies["i18n-x"]`) gave these results:
  - Rejected as UNKNOWN_PACKAGE: `../i18n`, `./x`, `/abs/i18n`, `~/i18n`, `x-1.0.0.tgz`, `git+file:///tmp/r`, `FILE:`, `Link:`, `WORKSPACE:*`, `portal:`, `npm:@proseit/paep-i18n@*`, and `file:../i18n ` (trailing space).
  - Still pass (correct): `^1.2.3`, `1.x`, `latest`, `npm:lodash@4`, `github:user/repo`, `user/repo`, `git+ssh://…`, `git://…`, `*`, `https://codeload…/tar.gz/main`, and `http://x/y.TGZ?x=1`.
  - Flagged although it is a registry tarball: `https://registry…/x-1.0.0.tgz`, because the `.tgz` suffix matches. This is a false positive, but a reasonable one: it fails closed, nothing in the repo uses it, and a lockfile-pinned registry spec is the approved form.

## 2. Attempts to get around F1 (frappe-sdk `import 'i18n-x'`, re-exporting i18n)
| Link target | Result |
|---|---|
| packages/frappe-sdk/node_modules/i18n-x -> docs/x | caught, OUTSIDE_PROJECT |
| same link -> config/x | caught, OUTSIDE_PROJECT |
| same link -> repo root (`import 'i18n-x/packages/i18n/src/index'`) | caught, OUTSIDE_PROJECT (message shows an empty path, see L3) |
| chained: node_modules/evil -> tooling/x, then project nm/i18n-x -> node_modules/evil | caught, OUTSIDE_PROJECT (realpath follows the whole chain) |
| root node_modules/i18n-x -> tooling/x | caught, OUTSIDE_PROJECT |
| packages/node_modules/i18n-x -> ../i18n (intermediate level) | caught, CLASSIFICATION |
| packages/frappe-sdk/src/node_modules/i18n-x symlink | caught, CLASSIFICATION (projects contain no symlinks) |
| folder outside the repo that re-exports i18n by absolute path | NOT caught (treated as external); TypeScript resolves it with no error |
| real folder tooling/node_modules/evil (link target) | NOT caught (the "under node_modules" exception); TypeScript resolves it with no error |
| real folder root node_modules/i18n-x/index.ts | NOT caught; TypeScript resolves it with no error |

## 3. Negative suite
`npm run qa:ib0-wp04:negative` in a copy: **PASS (86/86)**, exit 0. N55 (OUTSIDE_PROJECT) and N56 (UNKNOWN_PACKAGE) both pass.

## Findings (all low, none blocking)
- **L1 (low): links to a folder outside the repo, or to a real folder under a node_modules directory, are still treated as external.** This is by design of the fix, and TypeScript compiles these cases.
  - Reproduction: `mkdir -p tooling/node_modules/evil`, add an `index.ts` there that re-exports `../../../packages/i18n/src/index`, then `ln -s ../../../tooling/node_modules/evil packages/frappe-sdk/node_modules/i18n-x` and `import 'i18n-x'`. The checker passes.
  - Not a real bypass. Every such path is git-ignored (`node_modules/`) or outside the repo, so it cannot be committed. `npm ci` against the lockfile, which V16 requires to be byte-identical, never creates it. F2 blocks every manifest spec that npm would turn into such a link.
- **L2 (low): the F2 regex misses a leading space (`" ../i18n"`) and Windows drive paths (`C:\x`, `c:/x`).** npm-package-arg reads all of these as `directory` specs.
  - Reproduction: set `"i18n-x": " ../i18n"` in packages/frappe-sdk/package.json. The checker passes.
  - Not a real bypass. Installing any of them changes package-lock.json, which the V16 check rejects. On POSIX, `" ../i18n"` resolves inside the project's own folder. A suggested hardening: trim the value and add `^[a-zA-Z]:|^\\`.
- **L3 (low, cosmetic): a link to the repo root gives an empty path in the message** ("links to , outside every project"). The rule still fires correctly.
