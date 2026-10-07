# IB3 Enterprise Application Shell — Implementation Design

**Work package:** IB3-ENTERPRISE-SHELL (Generation 5 CANDIDATE). **Design:** HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION, manifest `645dd2e9bb4274c9b787bbbcc52cf53eb4f08dc21d733b5985aa3ab572f4fce5`, retained verbatim under `evidence/design-handoff/HOF-IB3-001/handoff/`.  
**Status:** IN PROGRESS. Technical PASS is not ACCEPTED; acceptance, merge and Generation 5 promotion are PO/SA decisions.

This record says how the approved design is built. The design itself (layout, states, copy, decisions Q-01..Q-14, X-01..X-05, RD-01..RD-03) is the handoff; `evidence/design-handoff/HOF-IB3-001/conformance-report.md` maps every handoff element to its symbol, test and result.

## 1. Packages and dependency direction

| Package | IB3 content | May import |
| --- | --- | --- |
| `@proseit/paep-enterprise` (L3) | The shell parts, provider ports, the shell message catalogue | Angular core/common/router; the public entry points of components, foundation, contracts, i18n, observability, platform |
| `@proseit/paep-platform` (L1) | Connectivity source (`browserConnectivitySource`, `ConnectivitySource`) | unchanged rules |
| `@proseit/paep-i18n` (L1) | Locale resolution and `applyLocale` (`lang`, `dir`), message lookup with English defaults | unchanged rules |
| `@proseit/paep-observability` (L1) | `sanitizeErrorReport`, `PaepErrorReporter`, `consoleErrorReporter` (kind, reference, route, retryable only) | unchanged rules |
| `@proseit/paep-components` / `-foundation` | The approved HOF-IB3-001 extensions P-03..P-06, P-07, P-08, P-10 | unchanged rules |
| `apps/reference-app` | Composes the shell; owns its routes | enterprise, components, foundation, contracts, platform |
| `apps/ui-lab` | Shell showcase, only under `src/app/showcase/` | as IB2, plus the enterprise entry point in the showcase |

Every package is imported through its single public entry point; there is no secondary entry point, no store framework and no Nx. `@proseit/paep-contracts`, the runtime-configuration schema, `package-lock.json` and the dependency set are unchanged (`qa:enterprise` E09).

## 2. Enterprise public API

One entry point, `packages/enterprise/src/index.ts`: `providePaepShell(options)`, thirteen port tokens, `PAEP_SHELL_DEFAULT_MESSAGES` (121 `paep.shell.*` keys) and the shell parts. `qa:enterprise` E02 pins the census to the 15 approved shell symbols of authorisation §12. Two of them are not built yet: `PaepNotificationPanel` (E-07) and `PaepAccountMenu` (E-09) need `PaepMenu` and the `PaepPopover` alignment of HOF-IB2-001 v1.2, which is awaiting PO/SA approval. E02 therefore fails until they exist; it is not relaxed.

`providePaepShell` takes the validated `RuntimeConfigStore` and the navigation manifest (required) and optional ports: access, counts, context, commands, notifications, session, host hooks, connectivity, error reporter, locale control and message overrides. Every port is presentation input; `requestSwitch` receives the chosen context and the server decides. Nothing in the shell grants authority: the server decides access, context and session, no route guard is exported (E07), and locked pages and items only explain.

## 3. Shell parts

| Part | Built on | Notes |
| --- | --- | --- |
| `PaepShell` (E-01) | — | Skip link (foundation `.paep-skip-link`), banner, status strip, navigation, the host's `main`, overlays and two live regions |
| `PaepShellTopbar` (E-02) | `PaepButton variant="field"`, `PaepIconButton`, `PaepStatusBadge` | Never-hidden set: product, search, navigation toggle |
| `PaepShellNav` (E-03) | `PaepCountBadge`, foundation icons | Disclosure groups, `aria-current`, counts, locked items, 5.5 rem rail with focus/hover flyout |
| `PaepShellNavSheet` (E-04) | `PaepModalBase` | Inline-start modal sheet below 64 em, max 20 rem; not `paep-drawer` |
| `PaepPageFrame` (E-05) | `PaepBreadcrumb`, `PaepEmptyState`, `PaepAlert` | `h1`, context line, status, actions, toolbar, aside; loading, empty (description, action) and error (reference, "Try again") states |
| `PaepCommandPalette` (E-06) | `PaepModalBase`, `PaepCombobox` | Go to / Actions / Records; debounce 250 ms with abort; loading, error with reference, partial, empty; full screen below 37.4375 em |
| `PaepContextSwitcher` (E-08) | `PaepDialog` | A context is a tenant plus an optional site; two sites of one tenant are separate contexts. Request, pending, rejected with reference; deep-link mismatch notice |
| `PaepLockedState` (E-10) | `PaepEmptyState kind="unavailable"` | Four reasons; neutral/info tone |
| `PaepErrorBoundary`, `PaepNotFound` (E-11) | `PaepButton` | Fixed text; correlation reference; retry only when retryable |
| `PaepStatusStrip` (E-12) | platform connectivity | Order impersonation → connectivity → session → environment; "n more" disclosure |
| `PaepShellPreferences` (E-13) | `PaepDialog` | Session only, nothing stored (E06) |
| `PaepRouteFocus` (E-14) | `PaepAnnouncer` | Focuses the new `h1`, announces the title |

The palette is declared in the shell template with `@defer (when layout.paletteOpen())`. Because the entry point also exports `PaepCommandPalette`, the bundler keeps it in the main chunk (about 11 kB). The same holds for the notification panel and the account menu. The reference-app initial bundle is 516 746 bytes raw / 121 444 bytes transfer (516.75 / 121.44 kB): above the 500 kB raw engineering target and inside the hard limits of 525 kB raw / 150 kB transfer that the PO/SA set on 2026-10-07 (DDR-IB3-07, WORK_PACKAGE §8). `qa:shell` B1 enforces the hard limits on exact bytes; `tooling/enterprise-shell/bundle-composition.mjs` attributes the bundle to its sources and checks it for avoidable duplication.

Render failures reach the root `ErrorHandler`, which `providePaepShell` replaces with the shell handler: the failure becomes an allowlisted report (`PAEP error <kind> (ERR-…)`) and the boundary shows fixed text. Raw messages reach the console only in development builds.

## 4. Reference application and UI-lab showcase

The reference app boots through the unchanged IB1 fail-safe startup and provides the shell with neutral sample data (`shell-sample.ts`). Routes are exactly `/workspace`, `/locked/:reason`, `/error-demo` and not-found (E08). Its favicon is the approved placeholder mark (E11).

The UI lab keeps its own chrome. Under "Enterprise shell" it has one page per built part, each with a live preview: an iframe of the same lab build under `/showcase/preview/`, where the lab starts the real shell instead of its frame (`showcase-mode.ts`). The preview loads the shell lazily, so the lab's initial bundle does not grow by the shell, and every document keeps one `h1` and one `main`. The lab's density, direction, brand and motion settings pass to the preview; `connectivity=offline` shows the offline status. Error reports in the preview stay in memory.

**Strict CSP (AC-IB3-12, PO/SA decision 2026-10-07).** `index.html` puts the placeholder `%PAEP_CSP_NONCE%` in `ngCspNonce` on the root element. The Angular build copies it to every inline script and style it emits (the critical-CSS loader and inlined styles), replacing the loader's inline `onload` handler with a nonced script; at runtime Angular gives every component style element the same nonce. Generating the nonce is a deployment duty described in `apps/reference-app/deployment/csp-strict.json`: a fresh value of at least 16 random bytes for every HTML response, substituted for every placeholder and sent in the policy header, with `index.html` not cached. The profile policy is `default-src 'self'; script-src 'self' 'nonce-…'; style-src 'self' 'nonce-…'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types angular`. The AOT build needs no `angular#bundler` policy (its lazy chunks load through `import()`), no `angular#unsafe-jit` and no `angular#unsafe-bypass`. A placeholder left unsubstituted is not a valid nonce, so the page fails closed. The build itself has no deploy-time value, so one build serves every profile.

## 5. Quality gates added or extended

| Gate | What it proves | Negatives |
| --- | --- | --- |
| `test:enterprise` | 122 behaviour tests in 14 files (enterprise and the three seams), real Chromium | — |
| `qa:enterprise` E01-E12 | Imports, API census, no duplicated primitive, 121 keys, no unsafe HTML, no storage, no guard, bounded routes, milestone scope, the one CLAUDE.md line, clean-room scan, retained HOF | `qa:enterprise:negative` (33 + control) |
| `qa:shell` | 22 checks on the production reference app, every page served under the strict CSP: B1 budget, C1 strict CSP, H1-H5 over 124 state × viewport × direction combinations (7 viewports, LTR/RTL, axe, CSP violations), never-hidden set, targets, label in name, keyboard, focus, reduced motion, RTL mirroring, 200 % / 400 % zoom | `qa:shell:negative` (41 + 7 controls) |
| `bundle-composition.mjs` | What the initial bundle holds (DDR-IB3-07 §5): no UI-lab, test, analytics, offline, Frappe or domain code; no duplicate source, selector or positioning; Angular, rxjs and tslib only; optimisation and AOT on | — (one-off evidence) |
| `qa:design-system` S03, S05, S07, S08, S11, S12 | Approved component, icon, token and key extensions; S05 admits the enterprise entry point only in the lab showcase | `design-system-extension-negative.mjs` (34) |
| `qa:accessibility` A1 | axe also runs inside the framed showcase previews | B16, B17 |
| `qa:ddr07` | DDR-IB2-07 sequence, content and release guard | `qa:ddr07:negative` (19) |
| `qa:ib0-wp05` W02 | An in-scope CLAUDE.md change must be exactly the approved amendment | F02 |
| `qa:ib0-wp05` floor, W18 | The two IB3 jobs and their negatives cannot be dropped or moved; the W18 edge bound uses the base graph | `qa:ib3:ci-negative` (11 + control, pinned; J11 is the W18 edge-bound negative, kept out of `PAEP / negative-ci` for its 20-minute budget) |

## 6. Known limits

- Shell test doubles live in `packages/enterprise/src/lib/testing/` (not exported), because package code may not import `tooling/` (`qa:contracts` S10). WORK_PACKAGE §5 names `tooling/test-utils`; recorded as a DDR-IB3 candidate.
- DDR-IB3-07 is ACCEPTED; DDR-IB3-01..06 and -08 are candidates in the conformance report (section D); none is self-approved.
- The strict CSP is verified with the gate's own server, which behaves as the deployment profile requires; each real deployment must show its emitted header and nonce handling in its own deployment evidence.
- Arabic and Hebrew shell copy has not had native-speaker review; RTL mechanics are tested, the wording is not validated.
