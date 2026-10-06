# Shell information architecture: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2). The region IDs are the DWP-IB3-001 §5.1 definitions (design and test identifiers, not public API). This document adds how the regions are arranged and how they move between widths.

## 1. Region layout

```
┌ SHELL-REGION-SKIPLINK (first Tab stop, visible on focus)
┌──────────────────────────── SHELL-REGION-BANNER (header, sticky) ────────────────────────────┐
│ PRODUCT (mark, name, env) │ CONTEXT │ SEARCH (search) │ … │ GLOBAL-ACTIONS (help) │ NOTIFICATIONS │ ACCOUNT │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
┌ SHELL-REGION-STATUS (only when a status applies; rows in priority order) ┐
┌ SHELL-REGION-NAV (nav "Primary") ┐┌ SHELL-REGION-MAIN (main, one, from the app) ───────────────┐
│ collapse toggle                   ││ PAGE-HEADER: breadcrumb · h1 · context line · status · actions│
│ group ▸ items (manifest order)    ││ PAGE-TOOLBAR: filter / status region (optional)               │
│ …                                 ││ CONTENT                                   │ ASIDE (optional) │
└───────────────────────────────────┘└───────────────────────────────────────────────────────────────┘
SHELL-REGION-OVERLAY: nav sheet · command palette · notification panel · menus · dialogs (top layer)
SHELL-REGION-LIVE: polite + assertive (visually hidden)
```

At the inline-end of the banner, the connectivity indicator (online only) sits before help. The non-online states are in STATUS.

## 2. Navigation model

- **Source:** a typed, build-time manifest supplied by each app. The groups, items and order come from the app. The shell never contains a product menu and is never the route authority.
- **Depth:** a group plus up to two item levels. The design shows one item level plus nesting in SCR-SHELL-006 current-nested.
- **Per-item presentation:**
  - label;
  - optional icon (groups);
  - optional `shortLabel` (X-01, rail only);
  - optional count, from a provider: a number, "99+", loading or unknown;
  - availability from host access information: available, locked (permission / edition / configuration / environment) or not permitted.
- **Not permitted:** hidden (Q-10 decision A, PO/SA 2026-10-05). Direct navigation to such a route shows the permission locked page.
- **Current item:** `aria-current="page"` on the link. In the collapsed rail, `aria-current="true"` on its group.

## 3. Context model

- **Current context:** tenant (legal entity or project) plus an optional site level. It comes from the server (`IdentityContext` / `TenantContext`) and is displayed only.
- **Switcher:** offered only when the context provider reports more than one context (Q-11). Switching is a request, and the server decides. The outcomes are pending, accepted (the page reloads its data, and focus goes to the `h1`) and rejected (the user stays in the current context; a correlation reference is shown).
- **Deep link to another context:** a mismatch notice with "Request switch to {target}" or "Stay in {current}". Nothing switches silently.
- **Impersonation:** the first status row, "{agent} is viewing as {user}", with "End session view" (the host decides what it does).
- **Environment:** the badge in the product region (moved to the sheet header below 600 px) plus an optional status row for non-production.

## 4. Movement between widths

| Region | ≥ 1024 | 600-1023 | < 600 |
| --- | --- | --- | --- |
| NAV | persistent sidebar or rail | inside OVERLAY (sheet 20 rem) | inside OVERLAY (sheet full width) |
| CONTEXT | BANNER | BANNER | PAGE-HEADER context line + sheet header |
| SEARCH | BANNER field-style trigger | BANNER icon | BANNER icon; palette full screen |
| LANGUAGE (more than one locale, X-05 B) | BANNER | BANNER | account menu |
| GLOBAL-ACTIONS (help) | BANNER | BANNER | account menu |
| STATUS | all rows | all rows | first row + disclosure |
| ASIDE | beside content (wide) | below content | below content |

## 5. Page frame variants (SCR-SHELL-011)

- **Header variants:** title only; title + context + status; primary and secondary actions with overflow; breadcrumbs (when the app's IA justifies them).
- **Page regions:** a filter region; generic extension regions (a named slot before and after the content, for later experiences); an aside.
- **Content states:** loading, empty, error; long content.

The hosting example (SCR-SHELL-015) fills the generic regions with neutral placeholder blocks. It has **no** analytics or reporting behaviour, data, metrics, drill-down or saved views.

## 6. What the shell does not contain

- a login page or authentication flow;
- a backend search, notification, identity, permission or entitlement contract;
- offline queue, replay, sync or conflict state;
- analytics or reporting behaviour;
- preference persistence;
- runtime-config fields;
- a domain menu;
- a `contentinfo` footer.
