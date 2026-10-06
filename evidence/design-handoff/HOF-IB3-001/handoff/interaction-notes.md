# Interaction notes: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2). These notes are behaviour intent for implementation. The WAI-ARIA APG patterns are used as behaviour specifications, not as visual references. The visual maps are in SCR-SHELL-020 (keyboard and focus), SCR-SHELL-021 (motion) and SCR-SHELL-023 (menus).

## 1. Trust rules (apply everywhere)

1. Hiding, locking or disabling something is presentation only. The server decides access. The shell never grants authority, and `@proseit/paep-enterprise` exports no permission-granting guard.
2. Provider text (notifications, command results, context names) is untrusted plain text. It is never rendered as HTML.
3. Error UI shows fixed text from `paep.shell.*` plus a correlation reference. It shows no stack trace, no server message and no resource detail.
4. Return URLs are internal routes only.
5. A tenant switch is a **request**: the pending state is shown, then the server's outcome. A deep link to another tenant never switches silently (SCR-SHELL-007 deep-link-mismatch).
6. Impersonation is always visible while it lasts (status strip, first priority; X-03 order: impersonation, connectivity, session, environment). Below 600 px the "n more status messages" disclosure always exposes the remaining statuses (X-02).
7. Offline, degraded and unknown copy never promises queueing, replay or sync.
8. Preferences last for the session only. There is no storage and no "saved" message.

## 2. Loading sequence

1. Runtime configuration loads and is validated by the platform seam. Until then the host shows its fail-safe state, not the shell.
2. The shell renders with product identity and a skeleton navigation (SCR-SHELL-001 loading).
3. Session, context and access information arrive, and the navigation fills. Count badges show a spinner while loading and "–" (with hidden text "count not available") when unknown.
4. The route renders. Focus follows §4.

## 3. Key maps

| Area | Keys |
| --- | --- |
| Skip link | First Tab stop. Enter moves focus to `main` (tabindex −1) |
| Navigation (expanded) | Tab / Shift+Tab through group buttons and links. Enter/Space toggles a group (`aria-expanded`). Enter follows a link. No arrow-key roving: the items are links |
| Collapsed rail | Tab to a group button (disclosure). Enter/Space opens the flyout of links. Tab enters the links. Escape closes and returns focus to the group button |
| Menus (account, help, language, page "More") | APG menu button on the governed base (16 px viewport margin, RD-01): Enter/Space/↓ open on the first item, ↑ on the last; ↑/↓ move; Home/End; type-ahead; Enter activates; Escape closes → button; Tab closes and continues |
| Command palette | Ctrl+K / ⌘K (Q-12) or the visible trigger opens it. Focus is in the combobox; typing filters (debounced); ↑/↓ move the active option (`aria-activedescendant`); Enter opens; Escape clears the query, a second Escape closes. There is no single-character shortcut |
| Notification panel | Non-modal inset panel at every width (RD-02; never full screen). Opening focuses the panel heading. Tab moves through the items (links) and actions. Escape closes → bell |
| Mobile navigation container | Modal: Tab is contained; Escape or the scrim closes → Open navigation button |
| Language (X-05 B) | With more than one locale, the topbar language button (≥ 600 px; name "Language: {language}", visible active language code) opens a menu with the `menuitemradio` group; below 600 px the same group is in the account menu. ↑/↓ move; Enter/Space chooses one, the menu closes and focus returns to the button that opened it. The choice is a request to the app (i18n seam); when the app has applied it, the shell announces "Language changed to {language}" (polite, in the new language) and the root `lang`/`dir` change |
| Context switch dialog | The radio group uses native arrow keys. "Request switch" submits, and the dialog shows the pending state. Escape / Cancel → context button |

## 4. Focus restoration

| Event | Focus goes to |
| --- | --- |
| Route change (any source) | the new page `h1` (tabindex −1), plus a polite announcement "{title} page" |
| Palette: choose a destination | new page `h1` |
| Palette: choose an action | the element the action names, or back to the trigger |
| Palette / menu / panel / sheet closed without choosing | the control that opened it |
| Context switch accepted | `h1` of the re-loaded page |
| Context switch rejected | the error alert inside the dialog (the dialog stays open) |
| Error boundary shown | the error heading (`h1`); the alert is announced once |
| Error "Try again" succeeds | the re-rendered `h1` |
| Collapse / expand navigation | stays on the toggle, whose name changes |
| Viewport crosses 1024 px while the sheet is open | the sheet closes and focus goes to the equivalent control in the persistent navigation |

`aria-controls` on the Open navigation button and on menu buttons is set only while the controlled element is in the DOM (the reference screens keep it on closed states for readability).

Focus is never moved on first page load except by the route-focus rule. Sticky chrome never hides the focused element: `scroll-padding-block-start` = `--paep-shell-sticky-offset` (WCAG 2.4.11).

## 5. Live regions

| Event | Politeness | Rule |
| --- | --- | --- |
| Route change | polite | once per navigation |
| Palette result count | polite | after a typing pause; never per keystroke |
| Notification count | polite | only when the count increases; batched |
| Connectivity change | polite (status strip) | on change only |
| Session expiring | polite | once, at the threshold the host gives |
| Blocking error | assertive | once per error |

Transient feedback uses `PaepAnnouncer` plus an inline alert where the action happened. There is no Toast (Q-08). Persistent items belong to notifications.

## 6. Transitions

See SCR-SHELL-021. Every transition uses accepted motion tokens and is removed under `prefers-reduced-motion: reduce` or `[data-paep-motion="reduce"]`. There are no page transitions.

## 7. Overflow sequence (topbar)

From widest to narrowest (SCR-SHELL-005):

1. The product name truncates with an ellipsis. The full name stays in the accessible name.
2. The account display name hides; the icon remains.
3. The online label hides; the icon remains until 600 px.
4. The search field becomes an icon button (below 1024 px). The persistent navigation becomes the Open navigation button.
5. The context button leaves the topbar and moves to the page-header context line and the sheet header (Q-07, below 600 px). The product name hides and the mark remains. The environment badge moves into the sheet header. Help and the language control (X-05 B) move into the account menu.

**Never hidden** (320 px and 320 × 256): navigation toggle, search, notifications with count, account with sign-out, non-online connectivity (status strip), current tenant context (page-header line), skip link.
