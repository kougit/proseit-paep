# HOF-IB3-001 v1.0 design conformance report

**Work package:** IB3-ENTERPRISE-SHELL (Generation 5 CANDIDATE). **Design:** HOF-IB3-001 v1.0, APPROVED_FOR_IMPLEMENTATION, manifest `645dd2e9bb4274c9b787bbbcc52cf53eb4f08dc21d733b5985aa3ab572f4fce5` (retained under `handoff/`, checked by `qa:enterprise` E12).
**Status:** IN PROGRESS. Implementation of the HOF-IB2-001 v1.2-dependent parts has not started because v1.2 is awaiting PO/SA approval. This report is technical evidence; acceptance is a PO/SA decision.

Scope: every component-map row (P-01..P-10, E-01..E-14) and every screen state in `handoff.manifest.yaml` `screens:` (23 IDs, 114 states), mapped to the implementing symbol, the test or browser check that exercises it, and the result. A divergence from the approved design is recorded as a DDR-IB3 candidate (section D) for PO/SA decision; none is self-approved.

**Abbreviations**

- `ent/` = `packages/enterprise/src/lib/`; `cmp/` = `packages/components/src/lib/`; `fnd/` = `packages/foundation/src/`.
- Spec titles are quoted exactly, with the file (`shell.spec` = `ent/shell/shell.spec.ts`, which also holds the `PaepShellTopbar` describe; `nav.spec` = `ent/nav/nav.spec.ts`, which also holds `PaepShellNavSheet`; `palette.spec` = `ent/palette/command-palette.spec.ts`; `context.spec` = `ent/context/context-switcher.spec.ts`; `status.spec` = `ent/status/status-strip.spec.ts`; `locked.spec` = `ent/locked/locked-state.spec.ts`; `error.spec` = `ent/error/error-boundary.spec.ts`; `frame.spec` = `ent/page-frame/page-frame.spec.ts`; `provide.spec` = `ent/providers/provide-shell.spec.ts`; `fnd.spec` = `fnd/lib/foundation.spec.ts`).
- QA = `tooling/enterprise-shell/shell-qa.mjs` check IDs. `QA-H:<state>` is the H1–H4 audit (no page scroll, no console error, one h1 and one main, axe) of a shell-qa STATE (`workspace`, `locked` = /locked/edition, `error` = /error-demo, `not-found`, `palette` = Ctrl+K then "sample", `sheet`, `context`) at 1440/1024/834/640/375/320/320×256 in LTR and RTL. The latest run of every check is retained under `evidence/IB3-ENTERPRISE-SHELL/gates/`.
- Ref route = a reference-app route (`apps/reference-app/src/app/app.routes.ts`).

**Cross-cutting notes**

1. **Blocked topbar actions.** The topbar has no language control, help menu, notifications or account menu (E-07, E-09 and P-01/P-02 are blocked on HOF-IB2-001 v1.2). It offers only a `[paepShellLanguage]` / `[paepShellActions]` projection slot (`ent/topbar/topbar.ts`) and a plain help icon button that calls the host `openHelp` hook. Every full-shell render in the handoff shows "EN", the bell with a count and "Alex Morgan". This gap is recorded once, on the rows where the topbar is the state's subject: 001-populated, 005, 019, 020 and E-02.
2. **RTL** in shell-qa is set by writing `dir="rtl" lang="ar"` on `<html>` (`shell-qa.mjs:86`). No Arabic or Hebrew text, locale request or `he` tag is exercised. Locale→dir switching is unit-tested on its own (provide.spec "applies the default locale, and only a supported locale on request, with lang and dir on the root").
3. **Viewport-dependent unit tests.** Two size tests assert only the branch that matches the test-runner viewport: nav.spec "attaches to the inline-start edge: at most 20 rem from 600 px, the full width below" and palette.spec "is centred and at most 40 rem from 600 px, full screen below".

## A. Component map

| Row | Pattern | Implementation | Evidence | Result | Note |
| --- | --- | --- | --- | --- | --- |
| P-01 | Governed positioning base (`align`, inline shift, completed menu) | Not done. `cmp/popover/popover.ts` is the accepted IB2 base: inline-start only, no `align` input, no type-ahead, no link items, action group not rebuilt on it | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | The existing base already flips and shifts 16 px ("flips above when there is no room below and shifts to stay 16 px inside the viewport"); `align:start\|end` and the menu completion are missing |
| P-02 | `PaepMenu` + trigger | None (`cmp/index.ts` exports no `PaepMenu`) | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| P-03 | `PaepCombobox` | `cmp/combobox/combobox.ts` | `cmp/combobox/combobox.spec.ts`: "is a named combobox controlling a named listbox of labelled option groups", "starts on the first option and moves the active option with ↓ ↑ Home End while focus stays in the input", "Enter selects the active option; …", "typing updates the two-way query; …", "keeps the active option while it is still offered …" | IMPLEMENTED-TESTED | Composed by E-06 |
| P-04 | Count badge (`PaepIconButton count`, `PaepCountBadge`) | `cmp/count-badge/count-badge.ts`; `cmp/icon-button/icon-button.ts` (`count`) | count-badge.spec: "shows a decorative left-to-right value …", "caps the shown value at "99+" …", "loading shows a spinner with hidden "Loading count"; unknown shows "–" …"; icon-button.spec: "count: a decorative badge at the inline-end corner …", "count: capped at 99+; …", "count: the badge mirrors …" | IMPLEMENTED-TESTED | Used by nav counts. No shell icon button uses `count`, because the bell is blocked |
| P-05 | `PaepButton variant="field"` | `cmp/button/button.ts` (`'field'`, `keyHint`) | button.spec: "field: a button presented like a field with a leading search icon and a decorative keyboard hint", "field: activates like any button …", "field: a long label truncates …"; shell.spec "presents search as a field-style button with the shortcut at 1024 px and an icon button below" | IMPLEMENTED-TESTED | |
| P-06 | `PaepEmptyState kind="unavailable"` | `cmp/empty-state/empty-state.ts` | empty-state.spec: "unavailable: host-supplied icon, heading and reason line, …", "unavailable: the reason line precedes the description …", "unavailable: never takes focus …"; locked.spec "composes the unavailable empty state at the section level, …" | IMPLEMENTED-TESTED | |
| P-07 | `.paep-skip-link` | `fnd/styles/paep-foundation.css` | fnd.spec ".paep-skip-link is visually hidden until focused, then shown above every layer"; shell.spec "puts the skip link first …"; QA K1/K1b | IMPLEMENTED-TESTED | |
| P-08 | 24 shell icons | `fnd/lib/icons/icons.ts` (`PAEP_ICONS`) | fnd.spec "adds the 24 approved HOF-IB3-001 shell icons on the same grid; panel-start and sign-out mirror in RTL" | IMPLEMENTED-TESTED | |
| P-09 | Placeholder product mark | Inline SVG in `apps/reference-app/src/app/app.html`, ui-lab `showcase-preview.ts`, `apps/reference-app/public/favicon.svg` | enterprise-qa E11 (favicon.svg must be the approved mark) | IMPLEMENTED-TESTED | Copied inline into apps rather than held as a foundation asset. This is consistent with the qualification "not a public foundation API" |
| P-10 | 12 shell/layer tokens | `fnd/styles/paep-tokens.css` | fnd.spec "loads the 12 approved shell and layer tokens, and not the rejected content-max alias" | IMPLEMENTED-TESTED | |
| E-01 | `PaepShell` | `ent/shell/shell.ts` | shell.spec: "puts the skip link first and moves focus to the app main region", "has one banner, one primary navigation landmark and the app main at 1024 px and wider", "replaces the persistent navigation with the Open navigation button …", "opens the command palette state with Ctrl+K and Meta+K, …", "keeps focused elements clear of the sticky topbar …"; QA H (all states), K1, K5 | IMPLEMENTED-TESTED | |
| E-02 | `PaepShellTopbar` | `ent/topbar/topbar.ts` | shell.spec (describe PaepShellTopbar): "names the product link …", "shows no environment badge or notice in production", "presents search as a field-style button …", "shows the online indicator at 600 px and wider only, and help only when the app supplies a hook"; QA N1, T1 | PARTIAL | Missing: the language control (X-05 B), notifications and account. Help is a hook button, not a help menu or popover. All of these are blocked on v1.2. Below 600 px, help simply disappears instead of moving into the account menu. The active locale and direction are not shown in the topbar (REQ-SHELL-07) |
| E-03 | `PaepShellNav` | `ent/nav/nav.ts`, `ent/nav/nav-model.ts` | nav.spec (8 PaepShellNav tests, see Table B 002/006); QA K4, R1 | IMPLEMENTED-TESTED | The rail flyout is CSS-positioned rather than on the governed base (002 group-flyout, DDR-IB3-02 candidate). Count loading/unknown text comes from the shell keys |
| E-04 | `PaepShellNavSheet` | `ent/nav/nav-sheet.ts` | nav.spec: "opens as a modal dialog named by its heading, …", "closes with the close button and returns focus to the opener", "closes when the scrim … is clicked, …", "attaches to the inline-start edge: …"; QA K3, M1, R1, QA-H:sheet | IMPLEMENTED-TESTED | |
| E-05 | `PaepPageFrame` | `ent/page-frame/page-frame.ts` | frame.spec (8 tests): incl. "shows the host empty description and action, or no description when it is empty text", "replaces the content with an error alert: host text, the reference left to right and Try again only when retryable" | IMPLEMENTED-TESTED | `PaepPageState` is `ready \| loading \| empty \| error`. The empty state takes `emptyDescription` and a projected `[paepPageEmptyAction]`; the error state is an error alert with the reference and "Try again" (`retry` output, `retryable`) |
| E-06 | `PaepCommandPalette` | `ent/palette/command-palette.ts` | palette.spec (11 tests, see Table B 008); shell.spec Ctrl/Meta+K; QA K2, M1, T1, QA-H:palette | IMPLEMENTED-TESTED | No results uses `PaepEmptyState kind="no-results"`. One divergence remains at state level: 008-locked (DDR-IB3-01 candidate) |
| E-07 | `PaepNotificationPanel` | Not done. Only the port `PAEP_SHELL_NOTIFICATIONS` (`ent/ports/ports.ts`) and the `paep.shell.notifications.*` keys exist | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| E-08 | `PaepContextSwitcher` | `ent/context/context-switcher.ts` | context.spec (7 tests): incl. "treats two sites of one tenant as different contexts and names the site in every message", "truncates long names in the topbar with the full text in its name and in the switch dialog"; QA-H:context | IMPLEMENTED-TESTED | A context is identified by tenant and site (`contextKey`); `requestSwitch(context)` receives the context itself. Pending and mismatch texts name tenant · site; rejected and the two mismatch buttons name only the site when the tenant is the same, as in the renders |
| E-09 | `PaepAccountMenu` | Not done. Only the session port (`signOut`, `signingOut`) and the `paep.shell.account.*` keys exist | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | Sign-out, which the design lists in the never-hidden set, has no UI |
| E-10 | `PaepLockedState` | `ent/locked/locked-state.ts` | locked.spec (5 tests, see Table B 012); QA-H:locked; Ref route `/locked/:reason` | IMPLEMENTED-TESTED | |
| E-11 | `PaepErrorBoundary` + `PaepNotFound` | `ent/error/error-boundary.ts`, `ent/error/not-found.ts`, `ent/error/shell-errors.ts` | error.spec (6 tests, see Table B 013); QA-H:error, QA-H:not-found | IMPLEMENTED-TESTED | Version errors show no reference line; not-found offers "Search or go to…" |
| E-12 | `PaepStatusStrip` | `ent/status/status-strip.ts` | status.spec (5 tests, see Table B 014) | IMPLEMENTED-TESTED | |
| E-13 | `PaepShellPreferences` | `ent/preferences/preferences.ts` | provide.spec "sets content density and the navigation collapse for the session, and says nothing is stored" | IMPLEMENTED-TESTED | No trigger exists in the shell or the reference app: the design entry point is the account menu's "Display preferences" (E-09, blocked) |
| E-14 | `PaepRouteFocus` | `ent/route-focus/route-focus.ts` | provide.spec "does not move focus on the first load, then focuses the new h1 and announces "{title} page""; shell.spec "closes the sheet on navigation and focuses the new page heading with a polite announcement"; QA K4 | IMPLEMENTED-TESTED | |

## B. Screen states (114)

| SCR | State | Implementation | Evidence | Result | Note |
| --- | --- | --- | --- | --- | --- |
| 001 | populated | `PaepShell` + topbar + nav + `PaepPageFrame` | shell.spec landmark tests; QA-H:workspace | PARTIAL | The topbar lacks the language "EN", the bell with count and the account name (blocked v1.2). Frame, nav and page frame are present |
| 001 | loading | nav skeleton `ent/nav/nav.ts` (`!model.loaded()`); `PaepPageFrame state="loading"` | nav.spec "shows a skeleton until access information arrives"; frame.spec "replaces the content with a loading status or the empty state, keeping the header" | IMPLEMENTED-TESTED | The design render shows a populated nav with a content skeleton. The impl also has the skeleton nav described in interaction-notes §2 |
| 001 | default | Ref route `/workspace` (`pages/workspace.ts`) | QA-H:workspace; QA N1, T1, K1, K5 | IMPLEMENTED-TESTED | |
| 002 | collapsed | `PaepShellNav` rail (`layout.navCollapsed`) | nav.spec "collapses to the rail: the toggle keeps focus and changes its name, groups show short labels" | IMPLEMENTED-TESTED | |
| 002 | group-flyout | `ent/nav/nav.ts` `.paep-shell-nav__flyout` | nav.spec "opens a rail flyout of links; Escape closes it and returns focus to its group button" | DIVERGENT | Keys match interaction-notes §3. Positioned by CSS, not by the governed P-01 base (Q-03), which is part of HOF-IB2-001 v1.2 and not approved. DDR-IB3-02 candidate; moves to P-01 once v1.2 is approved |
| 002 | re-expanded | nav toggle `ent/nav/nav.ts` `toggleRail()` | nav.spec "collapses to the rail: the toggle keeps focus and changes its name, …" | IMPLEMENTED-TESTED | Only collapse is asserted; re-expanding uses the same code path |
| 003 | nav-closed | topbar `.paep-shell-topbar__nav-toggle` below 1024 | shell.spec "replaces the persistent navigation with the Open navigation button and a modal sheet below 1024 px"; QA-H:workspace @834/640 | IMPLEMENTED-TESTED | |
| 003 | nav-open | `PaepShellNavSheet` | shell.spec (same); nav.spec sheet tests; QA K3 (834), QA-H:sheet @834/640 | IMPLEMENTED-TESTED | The design render also shows the sheet context block ("Current context … Staging, Switch context") at 834/640. The impl shows it only below 600 (`shell.ts`), which matches responsive-rules |
| 004 | nav-closed | as 003 below 600 | QA-H:workspace @375/320/320×256; QA N1 | IMPLEMENTED-TESTED | |
| 004 | nav-open | sheet full width + context/env header below 600 (`shell.ts`) | nav.spec "attaches to the inline-start edge: …" (viewport-dependent branch); QA-H:sheet @375/320 | IMPLEMENTED-TESTED | No unit test asserts the below-600 sheet context block |
| 004 | long-labels | nav label `overflow-wrap:anywhere` (`nav.css`) | nav.spec "wraps a long label instead of truncating it, persistent and in the sheet"; shell.spec "keeps doubled-length text inside the viewport: …" | IMPLEMENTED-TESTED | Label wrap and doubled-length shell text are asserted at the test runner width (414 px) |
| 005 | overflow-sequence | `topbar.ts` + `topbar.css` (@media 63.9375em / 37.4375em) | shell.spec "presents search as a field-style button …", "shows the online indicator at 600 px and wider only, …"; QA N1 (checks only toggle, product, search, h1) | PARTIAL | Steps 2 (account name hides) and 5 (help/language into the account menu) cannot happen. Never-hidden "notifications with count" and "account with sign-out" are absent (blocked v1.2) |
| 005 | long-names | product name ellipsis (`topbar.css`), context text | shell.spec "keeps doubled-length text inside the viewport: …"; context.spec "truncates long names in the topbar …" | PARTIAL | Product and tenant/site truncation is tested; the long user name has no element (account blocked on v1.2) |
| 006 | current-nested | nav-model `bestMatch`, `aria-current="page"` | nav.spec "marks only the current page with aria-current="page", including a nested item" | IMPLEMENTED-TESTED | |
| 006 | count-loading-unknown | `PaepCountBadge` in nav (`nav.ts`) | nav.spec "shows counts capped at "99+" and a loading count with hidden text", "takes the loading and unknown count text from the shell keys, so the host can translate them" | IMPLEMENTED-TESTED | Loading and unknown use the shell keys `paep.shell.nav.count.loading` / `.unknown` |
| 006 | locked-hidden | nav-model drops `not-permitted`; locked items get reason icon + name | nav.spec "names a locked item "{label}, {reason}" with its reason icon and hides a not-permitted item" | IMPLEMENTED-TESTED | |
| 006 | locked-shown-alt | host returns `{state:'locked', reason:'permission'}` | nav.spec (same mechanism, edition reason); QA-H:workspace (ref nav shows a permission-locked item) | IMPLEMENTED-TESTED | The permission reason in the nav is rendered only by shell-qa, not asserted |
| 006 | long-labels | `overflow-wrap:anywhere` | nav.spec "wraps a long label instead of truncating it, persistent and in the sheet" | IMPLEMENTED-TESTED |  |
| 006 | current-nested-sheet | `<paep-shell-nav mode="sheet">` (same template) | nav.spec "shows nested items, the current page, counts and locked items the same way inside the sheet" | IMPLEMENTED-TESTED |  |
| 006 | count-loading-unknown-sheet | same template | nav.spec (same) | IMPLEMENTED-TESTED | Unknown in the sheet uses the same template as the persistent test |
| 006 | locked-hidden-sheet | same model | QA-H:sheet (ref sheet renders locked items); model filter covered by nav.spec | IMPLEMENTED-TESTED | |
| 006 | locked-shown-alt-sheet | same | QA-H:sheet (permission-locked item in sheet) | IMPLEMENTED-TESTED | |
| 006 | long-labels-sheet | same | nav.spec "wraps a long label instead of truncating it, persistent and in the sheet" | IMPLEMENTED-TESTED |  |
| 007 | long-names | `PaepContextSwitcher` tenant/site lines | context.spec "truncates long names in the topbar with the full text in its name and in the switch dialog" | IMPLEMENTED-TESTED |  |
| 007 | single-context | static `role="group"` text (`context-switcher.ts`) | context.spec "shows static text in a "Current context" group when only one context is offered" | IMPLEMENTED-TESTED | |
| 007 | switch-dialog | `PaepDialog` + radio group | context.spec "offers a switch button …", "treats two sites of one tenant as different contexts …"; QA-H:context | IMPLEMENTED-TESTED | Two sites of one tenant are separate options. The render's "· current" marker on the current option has no approved key; the current option is the checked radio (DDR-IB3-03 candidate) |
| 007 | switch-pending | `state.kind==='pending'`, `role="status"` | context.spec "treats two sites of one tenant as different contexts …", "sends a switch request, shows the pending state, …" | IMPLEMENTED-TESTED | "Requesting a switch to Northwind Holdings · Site 07…" |
| 007 | switch-rejected | rejected alert + reference, focus to outcome | context.spec (same two-site test), "on rejection keeps the dialog open, …" | IMPLEMENTED-TESTED | "The switch to Site 07 was not completed. You are still working in Northwind Holdings · Site 04." |
| 007 | deep-link-mismatch | `mode="mismatch"` + `target` input | context.spec "shows the deep-link mismatch notice …", two-site test | IMPLEMENTED-TESTED | "Request switch to Site 07" / "Stay in Site 04". The shell does no deep-link detection: the host places the notice; the reference app does not use it |
| 007 | impersonation | status strip row `impersonation` | status.spec "orders the rows impersonation, connectivity, session, environment (X-03) …", "calls the host hooks for "End session view" …; impersonation has no dismiss control" | IMPLEMENTED-TESTED | Not shown in the reference app |
| 008 | idle | Go to = Home + current group (`command-palette.ts` `goto`) | palette.spec "opens as a modal dialog named "Search and commands" …", "suggests Home and the current group with an empty query, without searching records" | IMPLEMENTED-TESTED | |
| 008 | typing | debounced `settle()` (250 ms) | palette.spec "searches records once after a typing pause, aborts a superseded search and announces the count" | IMPLEMENTED-TESTED | |
| 008 | loading | `search.status==='loading'` "Searching…" | palette.spec (same test asserts "Searching…") | IMPLEMENTED-TESTED | |
| 008 | results | 3 groups, plain-text labels | palette.spec (same; "REC-000181 <b>Access</b> review" stays text), "opens a destination with Enter and closes", "runs an action; …"; QA-H:palette, QA K2 | IMPLEMENTED-TESTED | |
| 008 | none | `.paep-palette__empty` local markup (`command-palette.ts`) | palette.spec "shows partial results with a warning, and the no-results state with the query as plain text" | IMPLEMENTED-TESTED | `PaepEmptyState kind="no-results"` with an h3, the query as plain text and the hint |
| 008 | error | `paep-alert status="error"` + reference | palette.spec "keeps pages and actions when record search fails, with the error and the reported reference" | IMPLEMENTED-TESTED | |
| 008 | partial | warning alert | palette.spec "shows partial results with a warning, …" | IMPLEMENTED-TESTED | |
| 008 | locked | `groups()` option builder (`command-palette.ts`); `choose()` routes to the locked page or `explainLock` | palette.spec "filters Go to from the presented manifest: locked results keep their reason, not-permitted never appear", "runs an action; a locked action opens its explanation and never runs" | DIVERGENT | Q-05 is met (edition icon and "Not included in your edition"; opens the explanation, never the capability). The render detail differs: the impl shows the reason icon as the option icon and the reason in the description line; the design keeps the destination icon, adds "opens an explanation, not the page" and a separate trailing marker. A trailing marker needs a P-03 option field and the sub-line a key not in content-keys. DDR-IB3-01 candidate |
| 008 | full-screen-narrow | `command-palette.css` full screen below 600 | palette.spec "is centred and at most 40 rem from 600 px, full screen below" (one branch per run); QA-H:palette @375/320/320×256; QA T1 @320 | IMPLEMENTED-TESTED | No browser check asserts the full-screen geometry |
| 009 | access-none | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | E-07 |
| 009 | access-unread | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | P-04 is ready; no bell exists |
| 009 | access-99plus | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | access-count-loading | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | access-count-error | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | access-provider-unavailable | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-populated | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-empty | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-loading | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-error | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-stale | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | panel-unavailable | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 009 | transient-vs-persistent | Transient half: `PaepAnnouncer` + inline alerts (no Toast) | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | The persistent half (panel and bell) is blocked |
| 010 | account-menu | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | E-09 / P-02 |
| 010 | single-locale | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | The active language is not shown anywhere |
| 010 | locale-selector | `PAEP_SHELL_LOCALE.request()` seam only (`provide-shell.ts`) | provide.spec "applies the default locale, and only a supported locale on request, …" (seam only) | NOT-IMPLEMENTED-BLOCKED-v1.2 | No topbar or menu control; `paep.shell.locale.changed` is not announced |
| 010 | signing-out | session `signingOut` port only | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | |
| 010 | help | Topbar help icon button calls the host `openHelp` (`topbar.ts`) | shell.spec "… help only when the app supplies a hook" | NOT-IMPLEMENTED-BLOCKED-v1.2 | The help menu/popover ("Help for this page / Keyboard shortcuts / Support site") is blocked; only the hook trigger exists |
| 011 | title-only | `PaepPageFrame` h1 | frame.spec "renders the one page h1 as the route-focus target (tabindex -1) and projects the named regions in order" | IMPLEMENTED-TESTED | |
| 011 | title-context-status | `[paepPageStatus]`, `[paepPageContext]`, tenant line | frame.spec (same); "carries the current tenant context line for narrow layouts, …" | IMPLEMENTED-TESTED | |
| 011 | actions-overflow | `[paepPageActions]` slot + accepted IB2 `PaepActionGroup` | frame.spec asserts an action in the slot | NOT-IMPLEMENTED-BLOCKED-v1.2 | The `[paepPageActions]` slot exists; the "More" overflow is the ActionGroup rebuild on P-01 (HOF-IB2-001 v1.2) |
| 011 | breadcrumbs | `PaepBreadcrumb` when `breadcrumbs` non-empty | frame.spec "shows breadcrumbs only when given, named "Breadcrumb"" | IMPLEMENTED-TESTED | |
| 011 | filter-region | `[paepPageToolbar]` | frame.spec region-order test | IMPLEMENTED-TESTED | |
| 011 | extension-regions | `[paepPageBefore]`/`[paepPageAfter]` | frame.spec region-order test | IMPLEMENTED-TESTED | |
| 011 | aside | `aside` input, `<aside aria-label="Details">`, beside at ≥ 90em | frame.spec "shows the aside as a complementary region named "Details" when enabled"; QA-H:workspace (aside on) | IMPLEMENTED-TESTED | Beside/below placement is not asserted |
| 011 | long-content | h1 wraps | frame.spec "wraps a long unbroken title instead of overflowing" | IMPLEMENTED-TESTED | |
| 011 | content-loading | `state="loading"` | frame.spec "replaces the content with a loading status or the empty state, keeping the header" | IMPLEMENTED-TESTED | |
| 011 | content-empty | `state="empty"` → `PaepEmptyState kind="empty"` heading only (`page-frame.ts`) | frame.spec "shows the host empty description and action, or no description when it is empty text" | IMPLEMENTED-TESTED | Description input and projected action ("New record") |
| 011 | content-error | none (`PaepPageState` has no `error`) | frame.spec "replaces the content with an error alert: host text, the reference left to right and Try again only when retryable" | IMPLEMENTED-TESTED | Error alert, reference, "Try again" when retryable |
| 012 | page-permission | `PaepLockedState level="page"` | locked.spec "uses the fixed text of each of the four reasons", "explains a page-level lock: …"; Ref `/locked/permission` | IMPLEMENTED-TESTED | The reason action ("Request access") appears only when the host supplies `explainLock`; the reference app does not, so no action shows there |
| 012 | page-edition | same | locked.spec "explains a page-level lock: reason, h1, fixed body, the server note and Go to Home", "offers the default explanation action only when the host supplies a hook"; QA-H:locked | IMPLEMENTED-TESTED | |
| 012 | page-configuration | same | locked.spec "uses the fixed text of each of the four reasons" | IMPLEMENTED-TESTED | |
| 012 | page-environment | same | locked.spec (same) | IMPLEMENTED-TESTED | |
| 012 | three-levels | page + `level="action"` + nav item | locked.spec "keeps an action-level control focusable with aria-disabled, the reason as its description, and no activation"; nav.spec locked-item test | IMPLEMENTED-TESTED | |
| 013 | recoverable | `PaepErrorBoundary` render + retryable | error.spec "replaces a page that fails to render with fixed text, a reference and focus on the error h1", ""Try again" renders the page again and moves focus to its h1"; QA-H:error; Ref `/error-demo` | IMPLEMENTED-TESTED | |
| 013 | not-retryable | `error-boundary.ts` (render && !retryable → only "Go to Home") | error.spec "offers only Go to Home, with the reference, for a render failure that is not retryable" | IMPLEMENTED-TESTED |  |
| 013 | lazy-load-failure | `route-load` kind, "Reload page" | error.spec "shows the load-failure text with "Reload page" (not "Try again") when a lazy route cannot be fetched" | IMPLEMENTED-TESTED | |
| 013 | incompatible-version | `raise('version')` | error.spec "shows the version text when the host raises an incompatible version, and clears on navigation" | IMPLEMENTED-TESTED | No reference line, as in the render |
| 013 | not-found | `PaepNotFound` | error.spec "shows fixed text, Go to Home and Search or go to… (opens the palette), and nothing from the requested address" | IMPLEMENTED-TESTED | "Search or go to…" opens the palette |
| 014 | online | no status row; topbar online indicator | status.spec "shows no connectivity row while online and never promises queueing or sync when offline"; shell.spec online-indicator test | IMPLEMENTED-TESTED | |
| 014 | offline | status row `cloud-off` | status.spec (same) | IMPLEMENTED-TESTED | |
| 014 | degraded | status row `signal-low` | status.spec "orders the rows …" (asserts "Connection is slow or unstable") | IMPLEMENTED-TESTED | |
| 014 | unknown | status row `unknown` | status.spec "announces a connectivity change politely, once" | IMPLEMENTED-TESTED | Only the announcement is asserted; the row body is not |
| 014 | non-production | environment row + topbar badge | status.spec "orders the rows …" (asserts the env notice); shell.spec "names the product link … shows the environment badge outside production", "shows no environment badge or notice in production" | IMPLEMENTED-TESTED | |
| 014 | stacked | rows in X-03 order | status.spec "orders the rows impersonation, connectivity, session, environment (X-03) inside a "Status" region" | IMPLEMENTED-TESTED | |
| 014 | stacked-narrow-collapsed | "n more status messages" disclosure | status.spec "below 600 px shows the first row and an "n more status messages" disclosure that exposes the rest" | IMPLEMENTED-TESTED | |
| 015 | default | Ref `/workspace` (`PaepPageFrame` with actions, cards, aside) | QA-H:workspace; frame.spec region tests | IMPLEMENTED-TESTED | The reference example shows no filter/toolbar region, though the frame supports it |
| 015 | loading | `state="loading"` | frame.spec loading/empty test | IMPLEMENTED-TESTED | Generic frame only; no hosting example shows it |
| 015 | empty | `state="empty"` + `emptyHeading` | frame.spec "shows the host empty description and action, or no description when it is empty text" | IMPLEMENTED-TESTED | `emptyDescription` replaces the default description |
| 015 | error | none | frame.spec (same) | IMPLEMENTED-TESTED | Same pattern as 011 content-error |
| 016 | preferences | `PaepShellPreferences` (dialog) | provide.spec "sets content density and the navigation collapse for the session, and says nothing is stored" | IMPLEMENTED-TESTED | No trigger (account menu blocked). The render draws a page with the extra sentence "Preferences change presentation only…"; the component map says dialog and content-keys has only the first sentence |
| 016 | applied-compact-collapsed | `layout.density`, `layout.navCollapsed` | shell.spec "applies compact density to the content only"; nav.spec rail test | IMPLEMENTED-TESTED | |
| 017 | ar-001-shell | logical CSS; dir from locale | QA-H:workspace RTL; QA R1 | IMPLEMENTED-TESTED | dir only, see cross-cutting note 2 |
| 017 | ar-004-nav-open | sheet at inline start | QA-H:sheet RTL @375/320; QA R1 (sheet on right edge @834) | IMPLEMENTED-TESTED | |
| 017 | ar-008-palette | palette | QA-H:palette RTL | IMPLEMENTED-TESTED | |
| 017 | he-001-shell | as ar | QA-H:workspace RTL (lang set to `ar`, never `he`) | IMPLEMENTED-TESTED | dir only |
| 017 | he-004-nav-open | as ar | QA-H:sheet RTL | IMPLEMENTED-TESTED | dir only |
| 017 | he-008-palette | as ar | QA-H:palette RTL | IMPLEMENTED-TESTED | dir only |
| 017 | ar-006-nav-locked | nav locked items | QA-H:workspace RTL (ref nav has 4 locked items); QA R1 | IMPLEMENTED-TESTED | |
| 017 | ar-011-frame | page frame; references `dir="ltr"` | QA-H:workspace RTL | IMPLEMENTED-TESTED | The ref page has no mixed-direction identifiers |
| 017 | ar-012-locked | locked page | QA-H:locked RTL | IMPLEMENTED-TESTED | |
| 017 | he-006-nav-locked | as ar | QA-H:workspace RTL | IMPLEMENTED-TESTED | dir only |
| 017 | he-011-frame | as ar | QA-H:workspace RTL | IMPLEMENTED-TESTED | dir only |
| 017 | he-012-locked | as ar | QA-H:locked RTL | IMPLEMENTED-TESTED | dir only |
| 018 | long-text-2x | wrap/ellipsis CSS across parts | shell.spec "keeps doubled-length text inside the viewport: …"; nav.spec long-label test; QA L1/L1b | IMPLEMENTED-TESTED | Doubled strings over topbar, navigation and context at the runner width (414 px); 200 % text over the whole shell in QA L1/L1b |
| 018 | zoom-400 | responsive CSS | QA-H all states @320 and 320×256 ("400 % zoom is covered by the 320 px states"); QA N1 @320×256 | IMPLEMENTED-TESTED | |
| 019 | board | all 320 renders | QA-H (7 states @320/320×256, H1 no page scroll); QA N1, T1 @320 | PARTIAL | The board's notification-panel and account/language/help renders do not exist (blocked v1.2) |
| 020 | focus-order | DOM order: skip, toggle, product, context, search, help, nav, main | QA K1, K5, F1/F1b; shell.spec skip-link test | PARTIAL | The numbered order includes language, notifications and account stops, which do not exist (blocked v1.2). No check compares the order with the design map |
| 020 | maps | keyboard maps per area | nav.spec, palette.spec, nav-sheet and context tests; QA F1/F1b (focus ≥ 2 px) | PARTIAL | The menu, notification-panel and language key maps cannot be met (blocked v1.2) |
| 021 | nav-open-reduced | `nav-sheet.css` no-preference only | QA M1 (sheet opens with no running animation, reduce) | IMPLEMENTED-TESTED | |
| 021 | palette-reduced | `command-palette.css` spinner animates only on no-preference | QA M1 (palette opens with no animation) | IMPLEMENTED-TESTED | M1 excludes the spinner from its animation scan, so "spinner static" is not asserted |
| 021 | board | foundation reduced-motion tokens | QA M1 (motion tokens 0 ms) | IMPLEMENTED-TESTED | |
| 022 | comfortable | default density | provide.spec "starts with the comfortable density and an expanded navigation …"; fnd.spec "applies compact density values and keeps comfortable as the default" | IMPLEMENTED-TESTED | |
| 022 | compact | `data-paep-density="compact"` on the main wrapper only | shell.spec "applies compact density to the content only" | IMPLEMENTED-TESTED | |
| 023 | board | — | — | NOT-IMPLEMENTED-BLOCKED-v1.2 | P-01/P-02 |

## Result counts

| Result | Table A (24) | Table B (114) |
| --- | --- | --- |
| IMPLEMENTED-TESTED | 19 | 86 |
| PARTIAL (only the v1.2-blocked parts are missing) | 1 | 6 |
| DIVERGENT (DDR-IB3 candidate) | 0 | 2 |
| NOT-IMPLEMENTED-BLOCKED-v1.2 | 4 | 20 |
| IMPLEMENTED-UNTESTED | 0 | 0 |
| NOT-IMPLEMENTED (not blocked) | 0 | 0 |

## C. Gaps closed after the first mapping

The first mapping (same date) found these gaps; each was fixed and is now tested:

- **E-08 context (007 switch-dialog, -pending, -rejected, deep-link-mismatch, long-names).** Contexts were keyed by tenant only. A context is now identified by tenant and site, `requestSwitch` receives the context, and the texts name the site as the renders do.
- **E-05 page frame (011 content-empty, content-error; 015 empty, error).** Added the content-error state (error alert, reference, "Try again"), the empty description and the empty action slot.
- **E-11 (013 not-retryable, incompatible-version, not-found).** The version error shows no reference line; not-found offers "Search or go to…"; the not-retryable path is tested.
- **E-06 (008 none).** No results now composes `PaepEmptyState kind="no-results"` (component map §1).
- **E-03 (006 count-loading-unknown, sheet states, long labels).** Count loading and unknown text comes from `paep.shell.nav.count.loading` / `.unknown`; nested items, counts, locked items and long labels are tested in the sheet too.
- **004, 005, 018 long text.** Doubled-length product, navigation and context text is tested.

## D. DDR-IB3 candidates (for PO/SA decision)

| ID | Element | Divergence | Why not built as drawn | Proposal |
| --- | --- | --- | --- | --- |
| DDR-IB3-01 | 008 locked palette result | The reason icon replaces the destination icon and the reason is in the description line. The render keeps the destination icon, adds the sub-line "… · opens an explanation, not the page" and a separate trailing reason marker | The trailing marker needs a new `PaepComboboxOption` field and the sub-line a message key; neither is in the approved P-03 API or content-keys | Accept as built (Q-05 text and behaviour are met), or approve the option field and the key |
| DDR-IB3-02 | 002 rail group flyout | Positioned by CSS beside the rail, without block flip or viewport shift | Q-03 names the governed P-01 base, which is part of HOF-IB2-001 v1.2 (awaiting approval) | Move to P-01 once v1.2 is approved |
| DDR-IB3-03 | 007 switch dialog "· current" marker | The current option is the checked radio; there is no "current" text | No approved key for the marker | Accept as built, or approve a key |
| DDR-IB3-04 | Test doubles location | Shell test doubles are in `packages/enterprise/src/lib/testing/` (not exported) | WORK_PACKAGE §5 names `tooling/test-utils`, but package code may not import `tooling/` (`qa:contracts` S10) | Accept the package-local location |
| DDR-IB3-05 | Palette lazy split | `@defer` is declared, but the palette stays in the main chunk because the entry point exports it | The §12 census requires `PaepCommandPalette` in the single entry point | Accept; the budget holds (WORK_PACKAGE §8) |

## E. Open items outside this report's control

- E-02, E-07, E-09, 005, 009, 010, 011 actions-overflow, 019, 020 and 023 wait for HOF-IB2-001 v1.2 approval (P-01 align, P-02 `PaepMenu`, ActionGroup overflow).
- Arabic and Hebrew wording has not had native-speaker review. RTL mechanics are tested with `dir="rtl"`; the wording is not validated.
