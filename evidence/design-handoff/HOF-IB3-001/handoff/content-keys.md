# Content keys: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05). 121 keys in the controlled `paep.shell.*` namespace (DWP §12), each with a typed English default and provider override per locale. The shell text in the reference screens comes from these keys. Sample app content (navigation labels, page titles, table rows, help menu items) is supplied by the app manifest or by the host, not by the shell. Placeholders use `{name}` and plural forms go through the i18n seam; there is no dictionary loading and no date/number formatting subsystem.

**Long text:** every string is tested at 2× English length on SCR-SHELL-018. **RTL:** Arabic and Hebrew overrides exist for the RTL board only. They are **design fixtures that need native-speaker review** before they are used as evidence. Identifiers inside messages render `dir="ltr"`.

| Key | English default | Note | Used in renders | ar/he fixture |
| --- | --- | --- | --- | --- |
| `paep.shell.skipLink.main` | Skip to main content | Skip link, first focusable element | yes | ar/he |
| `paep.shell.skipLink.nav` | Skip to navigation | Optional second skip link (wide layouts) | spec only | — |
| `paep.shell.banner.product.home` | {product} home | Accessible name of the product link | yes | — |
| `paep.shell.env.badge` | {environment} | Non-production environment badge text (from runtime config) | spec only | — |
| `paep.shell.context.label` | Current context | Accessible group name for tenant/site context | yes | ar/he |
| `paep.shell.context.switch` | Switch context | Context button accessible name suffix when a switcher is offered (Q-11) | yes | ar/he |
| `paep.shell.context.switch.title` | Switch context | Context switch dialog title | yes | — |
| `paep.shell.context.switch.pending` | Requesting a switch to {tenant}… | Switch request pending | yes | — |
| `paep.shell.context.switch.rejected` | The switch to {tenant} was not completed. You are still working in {current}. | Switch request rejected by the server | yes | — |
| `paep.shell.context.mismatch.title` | This link belongs to another context | Deep-link tenant mismatch | yes | — |
| `paep.shell.context.mismatch.body` | The link you opened is for {target}. You are working in {current}. Nothing has been switched. | Deep-link tenant mismatch body | yes | — |
| `paep.shell.context.mismatch.action` | Request switch to {target} | Explicit switch request action | yes | — |
| `paep.shell.context.mismatch.stay` | Stay in {current} | Stay in current context | yes | — |
| `paep.shell.search.trigger` | Search or go to… | Search/command trigger label | yes | ar/he |
| `paep.shell.search.shortcut` | Ctrl K | Visible shortcut hint (Q-12); platform-specific rendering | yes | — |
| `paep.shell.search.dialog` | Search and commands | Palette dialog accessible name | yes | ar/he |
| `paep.shell.search.input` | Search records, pages and commands | Combobox accessible name | yes | ar/he |
| `paep.shell.search.group.goto` | Go to | Result group: navigation destinations | yes | ar/he |
| `paep.shell.search.group.actions` | Actions | Result group: bounded commands | yes | ar/he |
| `paep.shell.search.group.records` | Records | Result group: provider results | yes | ar/he |
| `paep.shell.search.loading` | Searching… | Palette loading | yes | — |
| `paep.shell.search.count` | {count} results | Polite announcement of result count | spec only | — |
| `paep.shell.search.empty` | No results for “{query}” | No results | yes | — |
| `paep.shell.search.empty.hint` | Check the spelling or try a shorter search. | No-results hint | yes | — |
| `paep.shell.search.error` | Search is not available right now | Provider error | yes | — |
| `paep.shell.search.error.hint` | Pages and actions can still be opened below. Reference {ref}. | Provider error hint | yes | — |
| `paep.shell.search.partial` | Some results could not be loaded. Showing what is available. | Partial results | yes | — |
| `paep.shell.search.locked.edition` | Not included in your edition | Edition-locked result marker (Q-05) | yes | — |
| `paep.shell.search.help.keys` | ↑↓ to move · Enter to open · Esc to close | Palette key hint (visible) | yes | — |
| `paep.shell.notifications.button` | Notifications | Notification trigger accessible name | yes | ar/he |
| `paep.shell.notifications.unread` | {count} unread | Unread count, in the accessible name | yes | — |
| `paep.shell.notifications.title` | Notifications | Panel heading | yes | — |
| `paep.shell.notifications.empty` | No notifications | Empty panel | yes | — |
| `paep.shell.notifications.loading` | Loading notifications… | Loading | yes | — |
| `paep.shell.notifications.error` | Notifications could not be loaded. | Provider error | yes | — |
| `paep.shell.notifications.unavailable` | Notifications are not available in this deployment. | No provider configured | yes | — |
| `paep.shell.notifications.stale` | Showing notifications from {time}. They may be out of date. | Stale list | yes | — |
| `paep.shell.notifications.markAll` | Mark all as read | Request to provider | yes | — |
| `paep.shell.notifications.otherContext` | In {tenant} | Item belongs to another context | yes | — |
| `paep.shell.account.button` | Account | Account menu trigger accessible name prefix | yes | ar/he |
| `paep.shell.account.signOut` | Sign out | Sign-out menu item | yes | — |
| `paep.shell.account.signingOut` | Signing out… | Sign-out in progress | yes | — |
| `paep.shell.account.preferences` | Display preferences | Session-only shell preferences | yes | — |
| `paep.shell.account.help` | Help | Help entry inside the account menu below 600 px | yes | — |
| `paep.shell.locale.label` | Language | Locale surface label | yes | ar/he |
| `paep.shell.locale.button` | Language: {language} | Accessible name of the topbar language control (X-05 B; only with more than one locale); the visible label is the active language code | yes | — |
| `paep.shell.locale.current` | {language} ({direction}) | Active locale and direction | spec only | — |
| `paep.shell.locale.request` | Change language | Locale change request to the app (only with more than one locale) | yes | — |
| `paep.shell.help.button` | Help | Help trigger (app-configured hook) | yes | ar/he |
| `paep.shell.nav.label` | Primary | nav landmark label | yes | ar/he |
| `paep.shell.nav.open` | Open navigation | Navigation toggle | yes | ar/he |
| `paep.shell.nav.close` | Close navigation | Close mobile navigation | yes | ar/he |
| `paep.shell.nav.collapse` | Collapse navigation | Collapse persistent navigation | yes | ar/he |
| `paep.shell.nav.expand` | Expand navigation | Expand persistent navigation | yes | — |
| `paep.shell.nav.count` | {count} items | Count badge accessible text | yes | — |
| `paep.shell.nav.count.unknown` | Count not available | Count badge unknown | yes | — |
| `paep.shell.nav.locked` | {label}, {reason} | Locked item accessible name | yes | — |
| `paep.shell.locked.permission` | Not available to your role | Reason: permission | yes | ar/he |
| `paep.shell.locked.edition` | Not included in your edition | Reason: edition | yes | ar/he |
| `paep.shell.locked.configuration` | Not configured for this deployment | Reason: configuration | yes | ar/he |
| `paep.shell.locked.environment` | Not available in this environment | Reason: environment/capability | yes | ar/he |
| `paep.shell.locked.permission.body` | You do not have access to this area. Your administrator manages access. | Permission explanation | yes | — |
| `paep.shell.locked.edition.body` | This capability is part of a different edition. Contact your account owner to discuss your plan. | Edition explanation with upgrade messaging | yes | ar/he |
| `paep.shell.locked.configuration.body` | This capability has not been set up for this deployment. An administrator can enable it. | Configuration explanation | yes | — |
| `paep.shell.locked.environment.body` | This capability is not available in the current environment, such as this device, browser or deployment type. | Environment explanation | yes | — |
| `paep.shell.locked.server` | Access is decided by the server; this page only explains it. | Trust note, never implies client enforcement | yes | ar/he |
| `paep.shell.nav.sheet.title` | Primary navigation | Mobile navigation container heading (Q-09) | yes | ar/he |
| `paep.shell.search.close` | Close search | Palette close button accessible name; visible text is the key name Esc | yes | — |
| `paep.shell.context.switch.intro` | Contexts available to you (provided by the server). Choosing one sends a switch request; the server decides. | Switch dialog intro | yes | — |
| `paep.shell.context.switch.legend` | Context | Radio group legend (visually hidden) | yes | — |
| `paep.shell.context.switch.submit` | Request switch | Switch dialog primary action | yes | — |
| `paep.shell.dialog.cancel` | Cancel | Dialog cancel action | yes | — |
| `paep.shell.dialog.close` | Close | Dialog close button accessible name | yes | — |
| `paep.shell.nav.count.loading` | Loading count | Hidden text while a nav count loads | yes | — |
| `paep.shell.preferences.density.comfortable` | Comfortable (default) | Density option | yes | — |
| `paep.shell.preferences.density.compact` | Compact content | Density option (content only, Q-14) | yes | — |
| `paep.shell.search.results` | Results | Palette listbox accessible name | yes | — |
| `paep.shell.search.suggestions` | Suggestions | Palette listbox name for the empty-query state | yes | — |
| `paep.shell.notifications.close` | Close notifications | Notification panel close button | yes | — |
| `paep.shell.locked.permission.action` | Request access | Default explanation action for the permission reason (the host may replace or omit it) | yes | — |
| `paep.shell.locked.edition.action` | Learn about editions | Default explanation action for the edition reason (the host may replace or omit it) | yes | ar/he |
| `paep.shell.locked.configuration.action` | Contact administrator | Default explanation action for the configuration reason (the host may replace or omit it) | yes | — |
| `paep.shell.locked.environment.action` | See requirements | Default explanation action for the environment reason (the host may replace or omit it) | yes | — |
| `paep.shell.locale.changed` | Language changed to {language} | Polite announcement after the app applies a new locale (announced in the new language) | spec only | — |
| `paep.shell.status.label` | Status | Status region name | yes | — |
| `paep.shell.status.more` | {count} more status messages | Narrow (< 600 px) collapsed status stack disclosure; plural rules via the i18n seam | yes | — |
| `paep.shell.status.less` | Show fewer status messages | Collapse the narrow status stack | spec only | — |
| `paep.shell.connectivity.online` | Online | Connectivity online | yes | ar/he |
| `paep.shell.connectivity.offline` | Offline | Connectivity offline | yes | — |
| `paep.shell.connectivity.offline.body` | You are offline. Changes cannot be sent until the connection returns. | Offline message (no queue or sync promise) | yes | — |
| `paep.shell.connectivity.degraded` | Connection is slow or unstable | Degraded | yes | — |
| `paep.shell.connectivity.degraded.body` | Some requests may take longer or fail. Check results before continuing. | Degraded message | yes | — |
| `paep.shell.connectivity.unknown` | Connection status unknown | Unknown | yes | — |
| `paep.shell.connectivity.unknown.body` | The connection could not be checked. Data shown may not be current. | Unknown message (never implies current) | yes | — |
| `paep.shell.impersonation` | {agent} is viewing as {user} | Impersonation indicator (non-dismissible) | yes | — |
| `paep.shell.impersonation.end` | End session view | Request to end impersonation (host hook) | yes | — |
| `paep.shell.env.notice` | {environment} environment — not for production data | Non-production environment notice | yes | — |
| `paep.shell.session.expiring` | Your session ends in {minutes} minutes | Session expiring (state given by host) | yes | — |
| `paep.shell.session.continue` | Stay signed in | Host hook | yes | — |
| `paep.shell.error.title` | Something went wrong on this page | Error boundary heading | yes | — |
| `paep.shell.error.body` | The page could not be displayed. Your other pages are not affected. | Error boundary body | yes | — |
| `paep.shell.error.reference` | Reference | Correlation reference label | yes | — |
| `paep.shell.error.retry` | Try again | Retry (retryable errors only) | yes | — |
| `paep.shell.error.home` | Go to Home | Safe navigation | yes | ar/he |
| `paep.shell.error.chunk` | Part of the application could not be loaded | Route/lazy-load failure heading | yes | — |
| `paep.shell.error.chunk.body` | Check your connection and reload the page. | Route/lazy-load failure body | yes | — |
| `paep.shell.error.reload` | Reload page | Reload action | yes | — |
| `paep.shell.error.version` | A newer version is available | Incompatible version heading | yes | — |
| `paep.shell.error.version.body` | This page needs the latest version of the application. Reload to continue. | Incompatible version body | yes | — |
| `paep.shell.notFound.title` | Page not found | Not-found heading | yes | — |
| `paep.shell.notFound.body` | The address may be wrong, or the page may have moved. | Not-found body | yes | — |
| `paep.shell.page.loading` | Loading page… | Page loading | yes | — |
| `paep.shell.page.empty` | Nothing here yet | Generic empty | yes | — |
| `paep.shell.page.more` | More actions | Action overflow | yes | ar/he |
| `paep.shell.page.aside` | Details | Aside label | yes | — |
| `paep.shell.breadcrumb.label` | Breadcrumb | Breadcrumb nav label | yes | — |
| `paep.shell.preferences.title` | Display preferences | Preferences surface | yes | — |
| `paep.shell.preferences.density` | Content density | Density | yes | — |
| `paep.shell.preferences.navCollapsed` | Keep navigation collapsed | Navigation collapsed | yes | — |
| `paep.shell.preferences.session` | These preferences apply until you sign out. | Session-only notice | yes | — |
| `paep.shell.route.announce` | {title} page | Polite route-change announcement | spec only | — |
