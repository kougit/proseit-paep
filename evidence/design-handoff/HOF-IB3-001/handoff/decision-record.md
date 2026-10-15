# Decision record: HOF-IB3-001 v1.0

> **Status: APPROVED_FOR_IMPLEMENTATION (revision 3, PO/SA 2026-10-05). Decisions recorded in revision 2.** DWP-IB3-001 v1.0 (APPROVED FOR DESIGN, 2026-09-30).
>
> **All fourteen design questions Q-01..Q-14, the five items X-01..X-05 and the three review decisions RD-01..RD-03 are RESOLVED by the PO/SA (Kouga), 2026-10-05.** The decisions are recorded below as given. The analysis that supported the review (recommendation, rationale, alternatives and why each was rejected) is kept under each question as the record of how the decision was reached. Where a decision differs from the original recommendation (X-05, and RD-01 / RD-02 on Q-02 / Q-04 details), the decision prevails and the affected prose and renders were reconciled (`provenance/candidate-delta-r2.md`).
>
> Resolving the decisions did not by itself approve the handoff. The human similarity review (`provenance/similarity-review.md`) then returned **PASS** and the PO/SA approved HOF-IB3-001 v1.0 for implementation on 2026-10-05 (`approvals.md`). Arabic/Hebrew native-copy review remains an IB3 acceptance follow-up.

## Summary

| # | Question | PO/SA decision (2026-10-05) | Evidence |
| --- | --- | --- | --- |
| Q-01 | Topbar surface | **RESOLVED.** A: light topbar. | SCR-SHELL-001, SCR-SHELL-020 focus-contrast table |
| Q-02 | Governed menu/positioning base | **RESOLVED.** A: extend `PaepPopover` with inline-start / inline-end alignment while retaining the governed flip/shift positioning (with the accepted 16 px viewport edge margin, RD-01). `PaepMenu` is the reusable menu interaction component composed on that governed positioning base, not a second positioning engine. The action-group overflow is rebuilt on that base where technically compatible. This changes accepted IB2 design intent and must be incorporated into HOF-IB2-001 v1.2 before the affected component code lands. | SCR-SHELL-023 |
| Q-03 | Collapsed navigation form | **RESOLVED.** A: 5.5 rem collapsed rail with visible authored short labels and link flyouts (see X-01). | SCR-SHELL-002 |
| Q-04 | Notifications container | **RESOLVED.** A, governed by RD-02: a non-modal inset panel anchored from the notification control, maximum inline size 24 rem, constrained to the available viewport with the normal 16 px shell edge margin. It is not a full-screen notification experience. | SCR-SHELL-009 |
| Q-05 | Palette grouping, empty query, locked results | **RESOLVED.** A: Go to / Actions / Records groups; explanatory locked results may be shown; truly denied results are omitted. | SCR-SHELL-008 |
| Q-06 | Connectivity at narrow widths | **RESOLVED.** A: non-online states remain visible; ordinary Online may be hidden below 600 px. | SCR-SHELL-014 |
| Q-07 | Tenant name below 600 px | **RESOLVED.** A: tenant/context presented in the page-header context line and the navigation sheet below 600 px. | SCR-SHELL-004, -005 |
| Q-08 | Toast | **RESOLVED.** A: no Toast component in IB3; announcer/live region plus inline alert. | SCR-SHELL-009 transient-vs-persistent |
| Q-09 | Mobile navigation container | **RESOLVED.** A: inline-start modal navigation sheet, 20 rem maximum and viewport-constrained; effectively full width where the narrow viewport requires it. `paep-drawer` is not used as application navigation. | SCR-SHELL-003, -004 |
| Q-10 | Permission-denied navigation items | **RESOLVED.** A: denied navigation items are hidden; a direct link results in the explanatory locked/unavailable experience. | SCR-SHELL-006 (hidden + alternative), SCR-SHELL-012 |
| Q-11 | Context presentation / switcher | **RESOLVED.** A: context always visible; switch affordance only for multiple contexts; switching is an explicit request. | SCR-SHELL-007 |
| Q-12 | Palette keyboard shortcut | **RESOLVED.** A: Ctrl/Command-K plus the always-available visible trigger. | SCR-SHELL-001, -008 |
| Q-13 | Locked-state tones | **RESOLVED.** A: existing neutral/info semantic tones. No new tone. | SCR-SHELL-012 |
| Q-14 | Chrome density | **RESOLVED.** A: comfortable shell chrome; content density independent. | SCR-SHELL-022 |

Status of every row: **RESOLVED by the PO/SA (Kouga), 2026-10-05.** Review decisions RD-01..RD-03 and items X-01..X-05: see the end of this record.

---

## Q-01: Topbar surface (light or Navy chrome)

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: light topbar.
- **Recommended:** a light topbar. `--paep-color-surface` background, `--paep-color-border-subtle` block-end border, and the brand shown by the placeholder mark and the Navy primary buttons.
- **Rationale:** the accepted focus ring (#2D4FD1) reaches 6.67:1 on white. Every chrome surface then passes on the ring itself (SCR-SHELL-020 table, lowest 5.61:1). Topbar text is `text-primary` on `surface` (16.56:1). The environment badge, the count badges and the status tones are all accepted pairs on a light surface. The Navy page actions stay the strongest brand signal.
- **Alternatives considered:**
  - **B: Navy topbar (#24364B) with inverse content.**
    - Rejected: on Navy the ring reaches only 1.85:1. Focus stays visible only through the white halo (12.32:1), so the design depends on one layer.
    - It also needs inverse variants of the search trigger, context button, badges and environment badge. Those inverse variants would be new component intents (D1), with no accepted tokens behind them.
    - It is rendered as a specimen in SCR-SHELL-020 so the PO/SA can judge it.
  - **C: Light topbar with a Navy product block only.**
    - Rejected: it adds a second chrome surface, and a focus ring on the block has the same 1.85:1 problem. It gains little over the mark alone.

## Q-02: Governed menu/positioning base (DDR-02)

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: extend `PaepPopover` with inline-start / inline-end alignment while retaining the governed flip/shift positioning (with the accepted 16 px viewport edge margin, RD-01). `PaepMenu` is the reusable menu interaction component composed on that governed positioning base, not a second positioning engine. The action-group overflow is rebuilt on that base where technically compatible. This changes accepted IB2 design intent and must be incorporated into HOF-IB2-001 v1.2 before the affected component code lands.
- **Recommended (accepted as A):** an extension of `@proseit/paep-components#PaepPopover` (D2). It adds:
  - `align: start | end`, logical, with `start` as the default so today's behaviour is unchanged;
  - retention of the governed flip from block-end to block-start and the inline shift that Generation 4 already provides, with the accepted 16 px viewport margin (RD-01; the candidate first proposed 8 px);
  - completion of the existing `menu` variant: the APG menu-button key map with Home/End and type-ahead, link items, and one open menu at a time;
  - light dismiss on the platform popover, replacing the action-group's `popover="manual"` menu and its document listener.

  The `PaepMenu`/menu-button pattern (D1, components) is composed on it. Every shell menu uses this base (account, help, language, page "More"), and the collapsed-rail flyout uses its positioning. The action-group overflow is rebuilt on it, and the parity table in SCR-SHELL-023 finds no behaviour loss.
- **Rationale:** one governed base satisfies DDR-02 and removes the separate `popover="manual"` overflow menu. It avoids a third ad-hoc implementation in enterprise. Logical alignment makes RTL correct by construction.
- **Alternatives considered:**
  - **B: a new standalone `PaepMenu` with its own positioning.**
    - Rejected: that would be a second positioning engine beside `PaepPopover`, which is the duplication DDR-02 asks to avoid.
  - **C: extend `PaepPopover` but leave the action-group overflow unchanged.**
    - Rejected as the recommendation: two menu implementations would remain, with divergent dismissal code. It stays a fallback if implementation finds a parity gap. The PO/SA may choose it, and the parity table then records the gap.
  - **D: a `popover="manual"` menu inside enterprise.**
    - Rejected: PD §11 chose one governed menu base and no third ad-hoc implementation (DDR-IB2-02 follow-up).

## Q-03: Desktop collapsed-navigation form

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: 5.5 rem collapsed rail with visible authored short labels and link flyouts (see X-01).
- **Recommended:** a collapsed rail (`--paep-shell-rail-inline-size`, 5.5 rem (approved 2026-10-05)).
  - It shows one button per group, with an icon and a **visible short label**.
  - The label comes from an optional authored manifest `shortLabel` (presentation only). A label is never automatically truncated or hyphenated into a short label (X-01 decision); without a `shortLabel` the full label wraps. The full label remains the accessible name.
  - Each button is a disclosure (`aria-expanded`). It opens a flyout of the group's links, positioned by the governed base.
  - The group containing the current page is marked `aria-current="true"`, with the selected background and a weight change as non-colour cues.
- **Rationale:** it keeps a visible text name without hover, because Gen 4 has no tooltip. It keeps real links, not menu items, inside the flyout. It keeps every destination two actions away.
- **Alternatives considered:**
  - **B: icon-only rail with tooltips.**
    - Rejected: Gen 4 has no tooltip. Hover-only names fail touch and some assistive-technology users. Icons alone are ambiguous for product-defined groups.
  - **C: a collapsed state that hides navigation completely** (the toggle re-opens the sidebar).
    - Rejected: the user loses orientation (no current-group cue) and needs an extra action for every move.
  - **D: flyouts as `role="menu"` of links.**
    - Rejected: links in menus change the expected link semantics and the key map. A disclosure of links is simpler and APG-conformant.

## Q-04: Notifications panel container

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A, governed by RD-02: a non-modal inset panel anchored from the notification control, maximum inline size 24 rem, constrained to the available viewport with the normal 16 px shell edge margin. It is not a full-screen notification experience.
- **Recommended (accepted as A, reconciled to RD-02):** a non-modal dialog panel on the governed base, aligned inline-end under the bell, maximum inline size 24 rem, constrained to the viewport with the normal 16 px shell edge margin. Below 600 px it stays an inset, non-modal panel (16 px from each viewport edge); it is never full screen. (The candidate text first said "max 26 rem" and "full-screen below 600 px"; the renders showed the inset panel at 24 rem. RD-02 confirmed the inset form.)
  - Focus moves to the panel heading on open and returns to the bell on close.
  - Items are plain text from the provider, rendered untrusted. Each item has a link that preserves or declares its context; the tenant mismatch case is rendered in SCR-SHELL-009.
- **Rationale:** the panel stays close to its trigger, reuses the governed base (Q-02), and needs no new overlay primitive.
- **Alternatives considered:**
  - **B: inline-end side panel (full height).**
    - Rejected: a full-height panel is a drawer-like surface. `paep-drawer` is excluded for chrome use, and a new sheet would be a second overlay primitive for a short list.
  - **C: a dedicated notifications page only.**
    - Rejected as the only access: it loses the user's place. Apps can still add such a page through their manifest.

## Q-05: Command palette grouping, empty query, locked results

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: Go to / Actions / Records groups; explanatory locked results may be shown; truly denied results are omitted.
- **Recommended:**
  - **Grouping:** fixed groups Go to (navigation destinations from the manifest) / Actions (host-supplied commands for the current page) / Records (provider results), in that order. Each group is a labelled listbox group.
  - **Empty query:** shows Go-to suggestions (the current group's destinations) and a hint line. No history is persisted.
  - **Locked results:** edition-locked results are shown with the edition icon and the text "Not included in your edition". Choosing one opens the locked explanation page, not the capability. Configuration- and environment-locked results follow the same rule.
  - **Denied results:** permission-denied results are omitted. The provider returns only authorised results; the palette never filters for security.
- **Rationale:** predictable group order helps keyboard and screen-reader users. Showing edition-locked items supports discovery without implying access. Omitting denied items follows DWP §18.
- **Alternatives considered:**
  - **B: a single relevance-ranked list without groups.**
    - Rejected: mixed result types are harder to scan and to announce.
  - **C: hide every locked result.**
    - Rejected: users lose discovery of edition capabilities, and navigation shows edition-locked items anyway, so the palette would be inconsistent.
  - **D: recent searches on empty query.**
    - Rejected: it needs persistence, which IB3 excludes.

## Q-06: Connectivity presentation at narrow widths

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: non-online states remain visible; ordinary Online may be hidden below 600 px.
- **Recommended:**
  - **Non-online states:** offline, degraded and unknown always appear in the status strip at every width, with an icon, a title and a short explanation, and never promise queueing or sync.
  - **Online:** shown in the topbar at ≥ 1024 px with an icon and label, at 600-1023 px as an icon with an accessible name, and not at all below 600 px.
  - **Several status messages below 600 px:** the strip shows the highest-priority message plus a disclosure "n more status messages" (SCR-SHELL-014 stacked-narrow-collapsed), so the chrome never fills the viewport at 320 × 256.
- **Rationale:** a strip is visible, has room for text, and is never hidden by overflow. The online state is not important enough to take narrow space.
- **Alternatives considered:**
  - **B: topbar icon only at every width.**
    - Rejected: offline and degraded need words, and an icon alone relies on recognition.
  - **C: a strip for every state, including online.**
    - Rejected: permanent noise that uses up vertical space at 400 % zoom.

## Q-07: Current tenant name below 600 px

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: tenant/context presented in the page-header context line and the navigation sheet below 600 px.
- **Recommended:** the topbar context button is removed below 600 px. The tenant and site then appear:
  1. in the page-header context line under the `h1`, with the building icon and full wrapping text;
  2. as a "Current context" block at the top of the mobile navigation container, which also hosts the switcher when one is offered.
- **Rationale:** the context stays visible on every page without truncating it into a 320 px topbar, and it is announced after the page title.
- **Alternatives considered:**
  - **B: a truncated context in the topbar.**
    - Rejected: at 320 px only about 6 characters fit, and the never-hidden set (toggle, search, notifications, account) takes priority.
  - **C: context only inside the navigation container.**
    - Rejected: it is invisible until opened, which is too weak for multi-tenant work (DWP §3, administrator row).

## Q-08: Toast

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: no Toast component in IB3; announcer/live region plus inline alert.
- **Recommended:** no Toast in IB3.
  - Transient confirmations go through `PaepAnnouncer` (polite) plus an inline alert where the action happened.
  - Persistent items go to notifications.
  - System states go to the status strip.
  - SCR-SHELL-009 "transient vs persistent" shows the rule.
- **Rationale:** a Toast adds timing problems (WCAG 2.2.1), focus and obscuring problems (2.4.11), and a new primitive, and no IB3 shell flow needs it.
- **Alternatives considered:**
  - **B: a PROPOSED `PaepToast` (D1, components) with no auto-dismiss.**
    - Rejected for IB3: no concrete shell need. It can be proposed when a product flow needs it (SPEC §8 lists it).
  - **C: toasts as an enterprise-local pattern.**
    - Rejected: it would be a private primitive in enterprise (PD §10).

## Q-09: Mobile navigation container

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: inline-start modal navigation sheet, 20 rem maximum and viewport-constrained; effectively full width where the narrow viewport requires it. `paep-drawer` is not used as application navigation.
- **Recommended:** a dedicated `PaepShellNavSheet` (enterprise composition) on the accepted `PaepModalBase`.
  - Below 1024 px it opens from inline-start; its width is `--paep-shell-sheet-inline-size` (20 rem (approved 2026-10-05)) from 600 to 1023 px, and full width below 600 px.
  - It is modal (inert background, scroll lock per DDR-04), and closes with Escape and the scrim.
  - Its header has the title and close button, then the current context block (Q-07), then the navigation.
- **Rationale:** it reuses the accepted modal semantics without using `paep-drawer` as application navigation, which component specs v1.1 exclude.
- **Alternatives considered:**
  - **B: `paep-drawer` from inline-start.**
    - Rejected: excluded by component specs v1.1 as application navigation.
  - **C: a push-down disclosure menu under the topbar.**
    - Rejected: it pushes content, and long navigation at 320 px becomes a very long page with the topbar off screen.
  - **D: a bottom tab bar.**
    - Rejected: it needs a fixed group count that product manifests cannot guarantee, and it adds sticky chrome at 400 % zoom.

## Q-10: Permission-denied navigation items

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: denied navigation items are hidden; a direct link results in the explanatory locked/unavailable experience.
- **Recommended:** hide items the host marks "not permitted". Direct navigation to such a route shows the permission locked page (SCR-SHELL-012 page-permission), with no resource details. Hiding is presentation only; the server decides.
- **Rationale:** users see only what they can use. A denied item gives no discovery value, unlike edition-locked items, and hiding reveals less about the structure of areas they cannot access.
- **Alternatives considered:**
  - **B: show denied items locked, with an explanation** (rendered as SCR-SHELL-006 locked-shown-alt).
    - Rejected as the recommendation: it adds noise for every role and exposes the names of restricted areas. DCH §13(i) allows it, so it stays a valid PO/SA choice, and the render is provided.

## Q-11: Tenant/site context presentation and switcher

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: context always visible; switch affordance only for multiple contexts; switching is an explicit request.
- **Recommended:**
  - **Presentation:** always show the context: the tenant name plus the site on a second line at ≥ 600 px, and Q-07 below 600 px. Long names truncate in the topbar with the full name in the accessible name and in the switch dialog.
  - **When the switcher appears:** only when the provider reports more than one available context. Otherwise the context is static text, not a button (SCR-SHELL-007 single-context).
  - **How switching works:** a request dialog with radio choices. Pending and rejected outcomes are rendered. The rejected message states that the user is still in the current context and includes a correlation reference.
  - **Deep links:** a deep link to another tenant shows an explanation and an explicit "Request switch" action. It never switches silently.
- **Rationale:** the context must always be visible, a control should appear only when it can act, and every switch is a server decision.
- **Alternatives considered:**
  - **B: always a button, even with one context.**
    - Rejected: a control that leads nowhere.
  - **C: switch immediately from a menu (no dialog).**
    - Rejected: switching changes the whole working context, so a deliberate step with a pending state is safer, and it reflects that the server decides.

## Q-12: Palette keyboard shortcut

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: Ctrl/Command-K plus the always-available visible trigger.
- **Recommended:** Ctrl+K on Windows and Linux, ⌘K on Apple platforms.
  - The trigger shows it visually, and its `aria-keyshortcuts` is set.
  - It uses a modifier, so WCAG 2.1.4 does not apply to it.
  - Apps can turn it off (`features.uiHints.commandPalette` already controls the capability).
  - The visible trigger is always available.
  - **Known conflicts:** Ctrl+K focuses the address/search bar in some browsers (Firefox, and Chrome on Linux) and inserts a link in some editors. The shell calls `preventDefault` only while focus is inside the application document, not inside a rich-text editor. Screen readers in browse mode pass Ctrl+K through to the page.
- **Rationale:** desk users who work mostly by keyboard (DWP §3) need a fast way to the palette from anywhere. Ctrl/⌘K is a widely learned convention for opening a search or command surface, so it needs little teaching. The visible hint on the trigger makes it discoverable. Because it uses a modifier it cannot fire while typing, and the visible trigger means nobody depends on the shortcut.
- **Alternatives considered:**
  - **B: "/" as the shortcut.**
    - Rejected: a single-character shortcut needs a remap/disable mechanism under WCAG 2.1.4, and it conflicts with typing in fields and with screen-reader quick keys.
  - **C: no shortcut.**
    - Rejected: keyboard-heavy desk users are a primary user group (DWP §3).
  - **D: Ctrl+Shift+P.**
    - Rejected: less familiar, and it opens a private window in Firefox.

## Q-13: Locked-state tones

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: existing neutral/info semantic tones. No new tone.
- **Recommended:** reuse the accepted tones.
  - **Neutral:** permission (`lock`), configuration (`sliders`) and environment (`device`).
  - **Info:** edition (`edition`), because it is the one reason with an actionable "learn more" path.
  - **Distinctness:** the four reasons differ in icon, title text and action, not in colour alone (SCR-SHELL-012 three-levels). No new tone is proposed.
- **Rationale:** a new tone would be a design-system change for little gain. Distinctness comes from words and icons (DAC-IB3-08).
- **Alternatives considered:**
  - **B: warning tone for permission.**
    - Rejected: warning suggests something is wrong or urgent. A missing permission is normal.
  - **C: a new "locked" tone.**
    - Rejected: it needs new protected tokens, its contrast is untested, and it adds nothing the icon and text do not already carry.

## Q-14: Shell chrome density relative to content

- **PO/SA decision (Kouga, 2026-10-05): RESOLVED.** A: comfortable shell chrome; content density independent.
- **Recommended:** the chrome keeps comfortable density: 40 px touch targets in the topbar and navigation. The content region follows the compact/comfortable preference (SCR-SHELL-022). The preference lives for the session only (SCR-SHELL-016).
- **Rationale:** the chrome is used on every page and by touch users, and a stable chrome keeps muscle memory. Compact brings its benefit (more rows) in the content.
- **Alternatives considered:**
  - **B: the chrome follows density too.**
    - Rejected: 32 px chrome targets on touch devices, and the layout jumps when the preference changes.
  - **C: a separate chrome density setting.**
    - Rejected: an extra setting with no evident user need.

---

## Other items X-01..X-05 (resolved)

| # | Item | Original recommendation | PO/SA decision (Kouga, 2026-10-05) |
| --- | --- | --- | --- |
| X-01 | Optional manifest `shortLabel` for the collapsed rail (Q-03) | Optional presentation field of the typed navigation manifest (enterprise type); no contracts change | **APPROVED:** optional authored `shortLabel`. Never automatically truncate or hyphenate a label into the short label. The full label remains the accessible name. The reference CSS no longer uses automatic hyphenation in the rail |
| X-02 | Narrow status-stack disclosure (Q-06) | Highest-priority message plus "n more" below 600 px | **APPROVED:** top status + "n more". The summary must expose an accessible, obvious mechanism to inspect the remaining statuses (the "n more status messages" disclosure button, `aria-expanded`), and must not conceal a critical state permanently |
| X-03 | Status-strip priority order | impersonation → offline/degraded/unknown → session expiring → environment | **APPROVED:** 1. impersonation; 2. connectivity; 3. session; 4. environment |
| X-04 | Arabic and Hebrew strings | Design fixtures only; native-speaker review before use as evidence | **APPROVED:** the Arabic/Hebrew design fixtures are valid for mechanical RTL qualification. Native-language copy review remains mandatory **before IB3 acceptance** (Arabic: PENDING; Hebrew: PENDING) |
| X-05 | Where the active locale is shown (REQ-IB3-SHELL-07) | Account menu (option A) | **OPTION B:** when more than one locale is available, the topbar has an explicit language (globe) control. Its visible label shows the active language code and its accessible name is "Language: {language}" (`paep.shell.locale.button`). The PO/SA allowed it to move into an account/overflow surface at narrow widths; the design applies this as: below 600 px it moves into the account menu. The active direction ("LTR"/"RTL") is not required as ordinary topbar text. With one locale there is no control; the account menu shows the language. Renders reconciled: SCR-SHELL-010 locale-selector, single-locale and every multi-locale topbar at ≥ 600 px |

## Review decisions RD-01..RD-03 (found in the independent review of the review pack; resolved)

| # | Decision | PO/SA decision (Kouga, 2026-10-05) | Effect on the candidate |
| --- | --- | --- | --- |
| RD-01 | `PaepPopover` viewport edge margin | **APPROVED:** retain the accepted 16 px margin. Do not change it to 8 px | Q-02 prose, SCR-SHELL-023 board text and specimens, and the reference CSS for menus and panels use 16 px (`--paep-space-4`) |
| RD-02 | Notification panel form and width | **APPROVED:** non-modal inset panel anchored from the notification control, maximum inline size 24 rem, constrained to the available viewport with the normal shell edge margin. Not a full-screen notification experience | Q-04 prose, `responsive-rules.md` and the SCR-SHELL-009 panel renders (inset at 16 px) |
| RD-03 | Official similarity record | **APPROVED:** the region-by-region human similarity-review form is the official record | `provenance/similarity-review.md` is replaced by that form (the superseded PASS/FAIL template is removed from the active bundle); status PENDING HUMAN REVIEW |

## HOF-IB2-001 v1.2 obligation

Q-02 changes accepted IB2 component design intent (the `PaepPopover` inline-start-only posture of DDR-IB2-02 and the action-group overflow mechanism). Therefore:

- **HOF-IB2-001 v1.2 must incorporate the approved `PaepPopover` alignment / governed menu-base intent BEFORE the affected component implementation lands.**
- HOF-IB2-001 v1.2 also keeps the other previously accepted DDR incorporation obligations: DDR-IB2-01, -04, -05, -07 and -08 (each ACCEPTED WITH FOLLOW-UP), and the DDR-IB2-06 residual constraint, due before IB3 acceptance (PD §3).
- HOF-IB2-001 v1.1 is not overwritten. HOF-IB2-001 v1.2 does not exist yet; this record creates no part of it.

## Native-language follow-up

| Item | Status |
| --- | --- |
| RTL mechanics (mirroring, focus order, icon direction, LTR identifiers, overflow, long content, landmarks, menu positioning) | **PASS** |
| Arabic native-copy review | **PENDING: REQUIRED BEFORE IB3 ACCEPTANCE** |
| Hebrew native-copy review | **PENDING: REQUIRED BEFORE IB3 ACCEPTANCE** |

Pending native-copy review is not an HOF implementation blocker unless it exposes a material layout or interaction design defect.

---

## Original record of other items (as raised for the review)

| # | Item | Recommendation | Why raised |
| --- | --- | --- | --- |
| X-01 | Optional manifest `shortLabel` for the collapsed rail (Q-03) | Add as an optional presentation field of the typed navigation manifest (an enterprise type). No contracts change | Needed for readable rail labels ("Admin") |
| X-02 | Narrow status-stack disclosure (Q-06) | Collapse to the highest-priority message plus "n more" below 600 px | Four stacked rows fill a 320 × 256 viewport |
| X-03 | Status-strip priority order | impersonation → offline/degraded/unknown → session expiring → environment | Needed for X-02 |
| X-04 | Arabic and Hebrew strings | Design fixtures only; native-speaker review before use as evidence | DWP §12 |
| X-05 | Where the active locale and direction are shown (REQ-IB3-SHELL-07) | In the account region (DWP §5.1 ACCOUNT contains the locale surface): the account menu shows the active language and direction. With more than one host-supplied locale it shows a `menuitemradio` language group (SCR-SHELL-010 locale-selector). Choosing one sends a request to the app through the i18n seam; the app applies it and the shell announces "Language changed to {language}". Alternative: a separate globe button in the topbar, rejected because it adds a control to the never-crowded-enough topbar and the DWP places locale in the account region | REQ-IB3-SHELL-07 says the topbar shows the active locale; this reading treats the account region of the banner as that place |

Design deviations from accepted DDRs: **NONE** (see `component-map.md` §4). Q-02 is a PO/SA-approved change of accepted IB2 intent, carried by the HOF-IB2-001 v1.2 obligation above, not a deviation.
