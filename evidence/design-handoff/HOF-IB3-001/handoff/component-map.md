# Component map: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2). DCH §10.1. Every design element maps either to an accepted Generation 4 component or token (HOF-IB2-001 v1.1 + DDR-IB2-01/02/04/05/07/08 @ 81c223c), or to a **NEW PATTERN**. Each new pattern has a target package, a D1/D2 class and a rationale. The PO/SA approved the design intent of every new pattern on 2026-10-05, with the qualifications recorded in §2a. No enterprise-local duplicate of a generic primitive is authorised.
>
> Targets use **single-entry-point symbols** only (`@proseit/paep-components#…`, `@proseit/paep-foundation#…`, `@proseit/paep-enterprise#…`). There are no secondary entry points (PD §15).
>
> Placement rule (PD §10):
> - generic primitives and variants → `components`;
> - generic assets, icons, tokens and CSS utilities → `foundation`;
> - shell compositions → `enterprise`.
>
> Enterprise contains **no** private restyle or substitute of a generic primitive. `paep-contracts` is not changed (RM-02). Shell-specific provider ports live in `enterprise`, and the minimal seams stay with their owners (platform, i18n, observability).

## 1. Reused as accepted (no change)

| Design element | Target | Notes |
| --- | --- | --- |
| Page actions (primary, secondary) | `@proseit/paep-components#PaepButton` | primary = Navy; secondary; tertiary for Reset |
| Page action overflow "More" | `@proseit/paep-components#PaepActionGroup` | rebuilt on the governed base per Q-02 (see §2 P-01) |
| Icon-only topbar/page controls | `@proseit/paep-components#PaepIconButton` | label becomes the accessible name; count via P-04 |
| Breadcrumbs | `@proseit/paep-components#PaepBreadcrumb` | collapse rule unchanged |
| Page status / count ("6 records") | `@proseit/paep-components#PaepStatusBadge` | non-interactive, text always present |
| Records table in page examples | `@proseit/paep-components#PaepTable` | DDR-01: narrow rule on container < 40 rem; the sidebar narrows the container |
| Filter region fields | `#PaepField`, `#PaepSelect`, `#PaepInput` | generic filter region only; no filter-chip UI |
| Context switch dialog, preferences dialog | `@proseit/paep-components#PaepDialog` + `#PaepDialogFooter` + `#PaepDialogClose` | DDR-08 footer; **no automatic `role="group"`**; DDR-04 scroll lock and focusable scroll body |
| Context choices, density choice | `@proseit/paep-components#PaepRadioGroup` / `#PaepRadio` | |
| "Collapsed navigation" preference | `@proseit/paep-components#PaepCheckbox` | session only; no checkbox error API (DDR-06 residual) |
| Error, rejected-switch and tenant-mismatch messages | `@proseit/paep-components#PaepAlert` | correlation reference in mono, `dir="ltr"` |
| Content loading | `@proseit/paep-components#PaepSkeleton` | |
| Content empty / palette no results | `@proseit/paep-components#PaepEmptyState` (`empty`, `no-results`) | |
| Notification list items, palette list chrome | layout only; the list semantics come from P-02 / P-06 | `PaepList` is not used for the palette (it has no active option) |
| Page cards (hosting example) | `@proseit/paep-components#PaepCard` | |
| Help content (short) | `@proseit/paep-components#PaepPopover` (`info`) | kept short (DDR-05) |
| Live announcements | `@proseit/paep-foundation#PaepAnnouncer` | route, counts, results, connectivity, blocking errors |
| Modal semantics for sheet and palette | `@proseit/paep-components#PaepModalBase` | exported (index.ts:39) |
| Tokens | `@proseit/paep-foundation` tokens | see `token-use-map.md` |
| Accepted icons (25) | `@proseit/paep-foundation#PAEP_ICONS` | search, chevrons, close, more, plus, retry, spinner, pending, info, warning, error, check, external |

## 2. NEW PATTERNS (design intent approved, 2026-10-05)

| ID | Pattern | Target | Class | Rationale | Evidence |
| --- | --- | --- | --- | --- | --- |
| P-01 | Governed positioning base: `PaepPopover` `align: start\|end` (logical), block flip, inline shift with the accepted 16 px viewport margin (RD-01), completed `menu` variant (Home/End, type-ahead, link items, one open menu); action-group overflow rebuilt on it | `@proseit/paep-components#PaepPopover` (+ `#PaepActionGroup` internals) | D2 (variant of an approved component; closes DDR-02) | One base for every menu; no third `popover="manual"` implementation (DDR-02) | SCR-SHELL-023; Q-02 |
| P-02 | Menu-button pattern (`PaepMenu` + trigger) on P-01, with `menuitem`, `menuitemradio` groups (language) and link items | `@proseit/paep-components#PaepMenu` | D1 | Generic menu interaction component composed on the P-01 positioning base (not a second positioning engine); account, help, language and page "More" menus use it; enterprise does not build a menu | SCR-SHELL-010, -023 |
| P-03 | Combobox + listbox with `aria-activedescendant` and groups | `@proseit/paep-components#PaepCombobox` | D1 | Generic (also autocomplete later); the palette composes it. No CDK (S06) | SCR-SHELL-008 |
| P-04 | Count badge on icon buttons and nav items (`count` input; "99+" cap; hidden text; `dir="ltr"`) | `@proseit/paep-components#PaepIconButton` (`count`) + `#PaepCountBadge` | D2 | The status badge prohibits interactive or count use | SCR-SHELL-009, -006 |
| P-05 | Search-trigger presentation: a button styled as a field, with a leading search icon and a keyboard hint | `@proseit/paep-components#PaepButton` (`variant="field"`) | D2 | Opens the palette; it is a button, so the rule that a field needs a visible label does not arise | SCR-SHELL-001, -005 |
| P-06 | Empty state `unavailable` kind: icon and heading supplied by the host, with a reason line | `@proseit/paep-components#PaepEmptyState` (`kind="unavailable"`) | D2 | Base for the four locked reasons | SCR-SHELL-012 |
| P-07 | Skip-link utility `.paep-skip-link` | `@proseit/paep-foundation` (CSS utility) | D2 | Generic a11y utility; enterprise supplies markup; no copy of the UI-lab `.lab-skip` | SCR-SHELL-020 |
| P-08 | 24 shell icons (menu, panel-start, bell, user, help, globe, building, lock, edition, sliders, device, signal, signal-low, cloud-off, unknown, impersonate, environment, home, list, tasks, document, shield, sign-out, keyboard) | `@proseit/paep-foundation#PAEP_ICONS` | D2 (the icon-count gate changes 25 → 49 under an authorised WP) | Glyphs authored in HOF-IB3-001 on the PAEP 24 px grid, 2 px round stroke (same as the accepted 25) | `assets/`, `asset-register.md` |
| P-09 | Neutral placeholder product mark (test content only) | `@proseit/paep-foundation` (asset) | D2 | Approved only as design / reference-app / ui-lab test content; not a public foundation API. Each product supplies its own approved brand asset | `assets/placeholder-mark.svg` |
| P-10 | `--paep-shell-*` layout tokens and `--paep-layer-*` semantic layer tokens (12 approved; content-max alias rejected) | `@proseit/paep-foundation` (generated tokens) | D1 (part of the HOF-IB3 token set) | No topbar, sidebar or layer tokens exist | `token-use-map.md` §3 |
| E-01 | `PaepShell` (frame: skip link, banner, status, nav, main slot, overlays, live regions) | `@proseit/paep-enterprise#PaepShell` | D1 | Shell composition | SCR-SHELL-001..005 |
| E-02 | `PaepShellTopbar` (product, environment badge, context, search trigger, language control when more than one locale (X-05 B), global actions, notifications, account; overflow order) | `@proseit/paep-enterprise#PaepShellTopbar` | D1 | | SCR-SHELL-001, -005 |
| E-03 | `PaepShellNav` (groups as disclosures, links with `aria-current`, count, locked item, collapsed rail and flyout) | `@proseit/paep-enterprise#PaepShellNav` | D1 | Enterprise owns "navigation" (SPEC package table); not a generic tree | SCR-SHELL-002, -006 |
| E-04 | `PaepShellNavSheet` (modal mobile navigation on `PaepModalBase`; not `paep-drawer`) | `@proseit/paep-enterprise#PaepShellNavSheet` | D1 | Q-09 | SCR-SHELL-003, -004 |
| E-05 | `PaepPageFrame` (page header with `h1`, breadcrumbs, context line, status, actions; toolbar/filter region; content; aside; generic extension regions) | `@proseit/paep-enterprise#PaepPageFrame` | D1 | Generic frame that later experiences can host (no analytics) | SCR-SHELL-011, -015 |
| E-06 | `PaepCommandPalette` (modal; composes P-03; groups Go to / Actions / Records; states) | `@proseit/paep-enterprise#PaepCommandPalette` | D1 | Q-05, Q-12 | SCR-SHELL-008 |
| E-07 | `PaepNotificationPanel` (non-modal inset dialog on P-01, max 24 rem, 16 px viewport margin, never full screen (RD-02); states; untrusted text) | `@proseit/paep-enterprise#PaepNotificationPanel` | D1 | Q-04 | SCR-SHELL-009 |
| E-08 | `PaepContextSwitcher` (context button or static text; request dialog; pending/rejected; mismatch notice) | `@proseit/paep-enterprise#PaepContextSwitcher` | D1 | Q-11 | SCR-SHELL-007 |
| E-09 | `PaepAccountMenu` (composes P-02: identity header, preferences, help and the language group below 600 px (X-05 B), the active language when only one locale, sign-out) | `@proseit/paep-enterprise#PaepAccountMenu` | D1 | | SCR-SHELL-010 |
| E-10 | `PaepLockedState` (page / nav item / action levels; four reasons; composes P-06) | `@proseit/paep-enterprise#PaepLockedState` | D1 | Reason category is an enterprise presentation type (RM-02), not a contracts change | SCR-SHELL-012 |
| E-11 | `PaepErrorBoundary` + `PaepNotFound` (two public symbols; the reviewed split E-11a / E-11b is kept) | `@proseit/paep-enterprise#PaepErrorBoundary`, `#PaepNotFound` | D1 | Correlation reference via the observability seam | SCR-SHELL-013 |
| E-12 | `PaepStatusStrip` + connectivity indicator (online / offline / degraded / unknown; impersonation; session; environment; narrow stack disclosure) | `@proseit/paep-enterprise#PaepStatusStrip` | D1 | Connectivity signal via the platform seam; no queue/sync state | SCR-SHELL-014 |
| E-13 | Shell preferences surface (session only) | `@proseit/paep-enterprise#PaepShellPreferences` | D1 | No persistence | SCR-SHELL-016 |
| E-14 | Route focus and announcement service (focus `h1`, announce title) | `@proseit/paep-enterprise#PaepRouteFocus` | D1 | Composes `PaepAnnouncer` | SCR-SHELL-020 |

**Not included:** Toast (Q-08 decision), Tooltip, Avatar, a `role="toolbar"` roving topbar, a `paep-drawer` navigation variant, a checkbox error API, automatic `role="group"` on dialog footers.

## 2a. Qualifications recorded with the approval (PO/SA, 2026-10-05)

| Item | Qualification |
| --- | --- |
| P-01 / P-02 | `PaepMenu` composes the single governed positioning base; the action-group overflow is rebuilt on it where technically compatible (Q-02). HOF-IB2-001 v1.2 must incorporate this before the affected component code lands |
| P-09 | The placeholder mark is test content for design, the reference app and the UI lab only; it is not exposed as a meaningful public foundation API |
| P-10 | 12 tokens approved: six `--paep-shell-*` sizes and six `--paep-layer-*` semantic layers. The `--paep-shell-content-max-inline-size` alias is rejected; `--paep-layout-content-max` is used |
| E-11 | Two symbols, `PaepErrorBoundary` and `PaepNotFound`, each accounted for explicitly |
| All | No enterprise-local duplicate of a generic primitive is authorised |

## 3. Provider ports (enterprise; assumptions only, no contract authority)

Shell-specific ports live in `@proseit/paep-enterprise` (RM-02). They are listed as **design assumptions**, not API.

| Port | Supplies | Screens |
| --- | --- | --- |
| Navigation manifest (typed, build time) | groups, items, order, optional `shortLabel` (X-01), count source | 001-006 |
| Access information | per item/action: available / locked (reason) / not permitted | 006, 012 |
| Context provider | current context, available contexts, switch outcome | 007 |
| Command provider | authorised results per query, grouped | 008 |
| Notification provider | summary count, items as plain text or key + params | 009 |
| Session state (given by the host) | display name, impersonator, expiry notice | 010, 014 |

Seams used from their owners, unchanged in shape by this design:
- platform: runtime-config exposure and the connectivity signal;
- i18n: active locale, direction and message resolution;
- observability: error reporting and correlation.

Types consumed read-only from contracts: `Capability`, `TenantContext`, `IdentityContext`, `PaepError`. **No** InjectionToken or shell DI construct is placed in contracts.

## 4. DDR constraints: how each was respected

| DDR | Constraint | How the design respects it |
| --- | --- | --- |
| DDR-IB2-01 | Table narrow rule is container-based (< 40 rem) | Page examples place `PaepTable` in the content container. With the sidebar, the container at 1024 px is about 45 rem, so the full table shows. At 834/640/320 px the narrow rule applies. No shell rule overrides it |
| DDR-IB2-02 | Popover is inline-start only; one governed base; no third `popover="manual"` | P-01 + P-02; SCR-SHELL-023 shows inline-start, inline-end, flip, shift (16 px), LTR, RTL, keyboard, dismissal, mobile, and the overflow parity table. Q-02 A changes accepted IB2 intent; HOF-IB2-001 v1.2 records it before the affected component code lands |
| DDR-IB2-04 | Overflowing dialog body is a focusable named region; `html` scroll lock while modal | Context switch dialog and preferences dialog inherit it. The shell uses document scroll and never sets `html` overflow itself. The nav sheet and palette use `PaepModalBase` |
| DDR-IB2-05 | Long informational popover takes focus as a named region | The help popover is limited to about 2 lines plus a link to the app's help destination |
| DDR-IB2-07 | F07 and R03 are the approved focus and 320 px references; UI-lab completion is implementation stage S1a | Shell focus visuals use the same ring and halo. SCR-SHELL-019 and -020 extend them to the shell without redefining them |
| DDR-IB2-08 | `paep-dialog-footer` / `paepDialogClose`; no automatic `role="group"` | Both shell dialogs use the footer as accepted. `role="group"` is **not** proposed (no concrete IB3 need) |
| DDR-06 residual | Checkbox error API not introduced automatically | Not proposed |
| Component specs v1.1 | `paep-drawer` not used as application navigation | Q-09 decision: a dedicated sheet; the drawer is not used anywhere in the shell |

Deviations: **NONE**.
