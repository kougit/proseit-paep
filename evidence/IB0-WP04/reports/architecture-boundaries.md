# IB0-WP04 Architecture Boundaries and Project Graph

Human-readable view of `tooling/architecture-boundaries/architecture-model.json` and `reports/project-graph.json` at the commit under test. Source rules: PAEP-IB-01 §6.1, §6.2 and Appendix B.

## Classification (20/20)

| Layer | Category (tag `type:`) | Projects |
| --- | --- | --- |
| L0 Base | `contracts` | `@proseit/paep-contracts` |
| L0 Base | `foundation` | `@proseit/paep-foundation` |
| L1 Cross-cutting platform | `platform`, `i18n`, `observability` | `@proseit/paep-platform`, `@proseit/paep-i18n`, `@proseit/paep-observability` |
| L2 Reusable interaction / adapters | `components`, `offline`, `frappe-sdk` | `@proseit/paep-components`, `@proseit/paep-offline`, `@proseit/frappe-sdk` |
| L3 Experience capabilities | `enterprise`, `analytics`, `domain` | `@proseit/paep-enterprise`, `@proseit/paep-analytics`, `@proseit/paep-domain-{ai,commerce,construction,fiscal,iot,maintenance,manufacturing,quality}` (8) |
| L4 Applications | `app` | `reference-app`, `ui-lab` |

Each project carries the tags `layer:<L>` and `type:<category>`. Every package's `package.json` name equals its model name and its alias; every application equals its `angular.json` key.

## Allowed dependencies (Nx `depConstraints` form, generated from Appendix B)

| sourceTag | onlyDependOnLibsWithTags ("Yes" and "Optional"; Optional in *italics*) |
| --- | --- |
| `type:contracts` | none |
| `type:foundation` | none (foundation → contracts is "No") |
| `type:platform` | contracts, *foundation*, *observability* |
| `type:i18n` | contracts, *foundation*, *platform*, *observability* |
| `type:observability` | contracts, *platform* |
| `type:components` | *contracts*, foundation, *platform*, i18n, *observability* |
| `type:offline` | contracts, platform, *i18n*, observability |
| `type:frappe-sdk` | contracts, *platform*, observability, *offline* |
| `type:enterprise` | contracts, foundation, platform, i18n, observability, components, offline |
| `type:analytics` | contracts, foundation, platform, i18n, observability, components, *offline*, *enterprise* |
| `type:domain` | contracts, foundation, *platform*, i18n, *observability*, components, *offline*, *enterprise*, *analytics* |
| `type:app` | every package category |

Not allowed: every "No" cell (e.g. frappe-sdk → components/foundation/i18n; enterprise/analytics/domain → frappe-sdk; observability → foundation/i18n; offline → foundation/components), every upward cell, and any edge between two projects of the same category (domain → domain, app → app) unless `sameCategoryAllowlist` names the pair (PO/SA Decision 2; apps can never be listed).

Same-category edges are allowed only when `sameCategoryAllowlist` in the model names the exact pair (currently empty, so none is allowed). "No" is also a reachability constraint: the checker rejects a chain of allowed edges whose end pair is "No"; the matrix's closure has four such pairs (observability → foundation, offline → foundation, frappe-sdk → foundation, frappe-sdk → i18n), exercised by T1–T5.

## Graph at the commit under test

20 nodes, 0 edges, 0 cycles, 0 Optional edges. 26 source files and 18 import statements scanned (all `@angular/*` imports in the two apps). The graph is empty because every package is still a placeholder; the negative runner's control C1 shows edges are detected and classified when present (3 edges, 1 Optional).

## Rules enforced by `npm run arch:check`

| Rule | Rejects | Controlled source |
| --- | --- | --- |
| MODEL | Model malformed; layers or any of the 144 matrix cells differ from the controlled IB-01 text | §6.1, App. B; §6.2(viii) |
| CLASSIFICATION | Unclassified package directory, npm workspace or `angular.json` project; unknown category; bad tags; missing root; name mismatch | §6.1; §6.2(viii) |
| ALIAS | `tsconfig.base.json` not the only alias registry; alias missing, extra, wildcard or not pointing at `src/index.ts`; alias not resolving from an app; app build not inheriting the registry | §5.2(ii), §6.2(ii) |
| ENTRY_POINT | Package without `src/index.ts` | §5.2(ii) |
| DIRECTION | Edge not allowed by the matrix or the same-category allowlist, or a chain of edges whose end pair is not allowed, from `import`, `import type`, `export … from`, `import = require()`, `require()`, `import()`, `import('…')` types or a `package.json` dependency | §6.1, App. B, §6.2(iv)-(v); IR-01 §4.3(i)-(iii) |
| CYCLE | Strongly connected component of more than one project (Tarjan) | §6.2(i); IR-01 §4.3(v) |
| DEEP_IMPORT, UNKNOWN_PACKAGE | `@proseit/<pkg>/<path>`; unknown `@proseit/*` module | §6.2(ii); IR-01 §4.3(iv) |
| ENTRY_BYPASS, OUTSIDE_PROJECT | Relative/absolute/rooted import into another project, or outside every project | §5.2(i)-(ii), §6.2(ii) |
| CONTRACTS_NEUTRAL | contracts importing or declaring any external module (approved list empty) or failing an ES2022-only, no-ambient-types compile | §6.1 L0, §6.2(iii), §7.1(i) |
| ANALYTICS_VENDOR_EXPORT | analytics re-exporting an external module | §6.2(v); EQP Claude contract |
| COPIED_CODE | App source file (≥ 200 non-whitespace characters) identical to a package source file | PAEP v1.1 §5.3; EQP §16(iv) |

## tsconfig inheritance

`apps/<app>/tsconfig.app.json` → `tsconfig.json` (explicit WP03 strictness, unchanged except `extends`) → `tsconfig.base.json` (18 aliases only). Effective options for both apps: `strict`, `noImplicitAny`, `strictTemplates` true; 18 paths; 36/36 alias resolutions to the entry points.
