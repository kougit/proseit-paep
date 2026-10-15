# Design brief: HOF-IB3-001 v1.0

> **Status: APPROVED_FOR_IMPLEMENTATION** (PO/SA, 2026-10-05; see `approvals.md`). It restates DWP-IB3-001 v1.0 (APPROVED FOR DESIGN, 2026-09-30) for the reviewer (DCH §6.2). Where this brief and the DWP differ, the DWP prevails.

## 1. What this design is

This is the product-neutral **PAEP enterprise application shell**: the frame every ProSEIT product app composes. It covers:

- skip link, topbar (product, context, search, help, notifications, account);
- status strip;
- navigation (sidebar, collapsed rail, mobile sheet);
- the page frame;
- command palette, notification panel and menus;
- locked, error, not-found, connectivity and preference surfaces.

It is built on the **accepted** design system: HOF-IB2-001 v1.1 plus DDR-IB2-01/02/04/05/07/08 at Generation 4 (81c223c). DDR-03 and DDR-06 are closed.

It is not:

- a product screen or domain workflow;
- analytics or reporting;
- an offline queue, sync or conflict design;
- a login or session flow;
- a backend contract;
- Angular code.

## 2. Users and tasks first (DWP §3)

| User | What the shell must let them do | Where it is shown |
| --- | --- | --- |
| Operational desk user | Know where they are (product, context, page); reach any permitted area in a few steps; work fully by keyboard | SCR-SHELL-001, -002, -008, -020 |
| Field / mobile user | Same tasks at 320 px and 400 % zoom; know when the connection is offline or degraded, with no promise of queueing | SCR-SHELL-004, -014, -018, -019 |
| Administrator / support agent | Always see the tenant context and impersonation; switch context only by an explicit request | SCR-SHELL-007, -014 |
| Keyboard, screen-reader, RTL, reduced-motion and zoom users | Full parity (WCAG 2.2 AA) | SCR-SHELL-017, -018, -020, -021 |

## 3. Key design choices (all Q-items RESOLVED by the PO/SA, 2026-10-05)

The PO/SA decisions for Q-01..Q-14, X-01..X-05 and RD-01..RD-03 are in `decision-record.md` (all RESOLVED, 2026-10-05; X-05 resolved as option B). The main ones:

- a light topbar (Q-01);
- one governed menu base, extending `PaepPopover` (Q-02);
- a collapsed rail with visible labels (Q-03);
- a modal navigation sheet below 1024 px (Q-09);
- permission-denied items hidden (Q-10);
- a context switcher only when more than one context exists (Q-11);
- Ctrl/⌘K (Q-12);
- no Toast (Q-08);
- no new tone (Q-13);
- comfortable chrome (Q-14).
- with more than one locale, a topbar language control showing the active language; below 600 px it moves into the account menu; direction ("LTR"/"RTL") is not shown as ordinary topbar text (X-05 option B, the PO/SA reading of REQ-IB3-SHELL-07);
- notifications in a non-modal inset panel, max 24 rem, never full screen (RD-02); 16 px viewport edge margin for menus and panels (RD-01).

## 4. Screen catalogue

There are 23 screen IDs, SCR-SHELL-001..023, drawn as 114 states and 402 renders. `screens/index.html` is the browsable catalogue, and the manifest lists every state with its viewports.

| ID | Content | States |
| --- | --- | --- |
| 001 | Desktop expanded shell | populated, loading (after config), default workspace |
| 002 | Desktop collapsed navigation | collapsed rail, group flyout, re-expanded (focus return) |
| 003 | Tablet (834) and 640 px shell | navigation closed / open |
| 004 | Narrow (375, 320) | closed, open, long labels |
| 005 | Topbar overflow 1440 → 320 | overflow sequence (6 widths), long names (5 widths) |
| 006 | Navigation states | current + nested, count loading/unknown, locked (Q-10 hidden), Q-10 alternative, long labels; each also in the mobile sheet |
| 007 | Context | long names, single context, switch dialog, pending, rejected, deep-link mismatch, impersonation |
| 008 | Command palette | idle, typing, loading, results, none, error, partial, locked result, full-screen narrow |
| 009 | Notifications | 6 access states, 6 panel states, transient vs persistent |
| 010 | Account / locale / help | account menu, language selector (more than one locale), single locale, signing out, help |
| 011 | Page frame | 11 variants incl. long content and content loading/empty/error |
| 012 | Locked / unavailable | 4 reasons at page level; 3 levels × 4 reasons board |
| 013 | Error boundary / not found | recoverable, not retryable, lazy-load failure, incompatible version, not found |
| 014 | Connectivity / status | online, offline, degraded, unknown, non-production, stacked, stacked-narrow-collapsed |
| 015 | Generic hosting example | default, loading, empty, error (no analytics) |
| 016 | Preferences (session only) | surface, applied compact + collapsed |
| 017 | RTL (ar, he) | 001, 004, 006, 008, 011, 012 mirrored in both Arabic and Hebrew |
| 018 | Long text 2× and zoom | long-text-2x, zoom-400 (incl. 320 × 256) |
| 019 | 320 px board | every 320 render with its scroll result |
| 020 | Keyboard / focus maps | numbered focus order on a page (1440, 834, 640, 320), maps board with focus contrast (1440, 320; a table board that does not change between widths) |
| 021 | Reduced motion | board (1440, 320), nav sheet open (834, 320) and palette (1440) with reduced motion; the sheet and palette layouts at other widths are in 003/004/008 |
| 022 | Density | comfortable, compact |
| 023 | Governed menu base (DDR-02) | alignment, collision, RTL, keyboard, dismissal, mobile, overflow parity (1440, 834, 640, 320) |

**Gaps: none.** Every state listed in DWP §5.2 is rendered. States that belong to later milestones are not drawn:

- offline queue, sync and conflict (PD §14);
- analytics (PD §9).

## 5. Data assumptions

Read-only and non-authoritative (DWP §9). The provider ports are listed in `component-map.md` §3. No backend, identity, permission, entitlement, search or notification contract is invented. All sample data is synthetic (DWP §12).

## 6. Requirement coverage

Every REQ-IB3-* ID in the design-input extract E02 is listed below, with the screens and documents that carry its design intent. Requirements that can only be proven in code (tests, gates, evidence) are marked "implementation stage". The design supplies their targets: region IDs, state IDs and the acceptance evidence plan.

<!-- COVERAGE -->
153 requirements.

| Requirement | Class | Summary | Design coverage |
| --- | --- | --- | --- |
| REQ-IB3-SHELL-01 | M | The enterprise shell shall be implemented in @proseit/paep-enterprise and composed from accepted IB2 foundation/components through public en… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-02 | M | The reference app shall load and validate runtime configuration through the immutable RuntimeConfigStore before protected routes activate. T… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-03 | M | The topbar shall show product identity (from runtime-config product) and the active tenant / legal entity / project context from the server-… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-04 | M (as applicable) | The topbar shall provide a global search/command entry point when the command capability is enabled. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-05 | M (as applicable) | The topbar shall provide a notifications access point. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-06 | M (as applicable) | The topbar shall provide a help entry point in a consistent location on every shell page. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-07 | M (as applicable) | The topbar shall show the active locale and direction. A locale selector appears only when the host supplies more than one usable locale, an… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-08 | M | The topbar shall provide user/account actions: display-name presentation and sign-out. Session presentation is PAEP's job; credential/sessio… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-09 | M | When IdentityContext.impersonatorId is present, the shell shall show a prominent, persistent support/impersonation indicator. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-10 | M | The topbar shall adapt across wide desktop, tablet, mobile and 320 CSS px. Secondary items move into an overflow; tenant context and primary… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-11 | M | Product branding shall be applied only through the approved brand tokens. The shell shall not override security/accessibility state semantic… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-12 | M (INFERRED) | The shell shall expose banner, navigation and main landmarks and a skip-to-content mechanism. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-13 | M (invalidation) / DP (switcher UI) | Any tenant-switch capability shall be presentation only: the tenant list comes from the identity adapter. A switch shall invalidate tenant-s… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-14 | M | Provider composition shall set up observability, i18n and platform services (and offline services where present) before route composition. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-15 | M | An incompatible backend/SDK/platform version shall resolve to a controlled, supportable state, never a blank screen. | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-SHELL-16 | DP (optional) | A support-diagnostics surface shall show the PAEP version, product release, runtime schema/config identifier, API compatibility state, conne… | SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md |
| REQ-IB3-NAV-01 | M | Navigation shall be configuration-driven. Each entry carries: group, route, label message key, icon, order, capability/edition hint, and res… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-02 | M | Navigation shall be composed from the product manifest plus server-derived capabilities/entitlements. Client composition may hide or explain… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-03 | M | The current route shall be exposed with aria-current plus a non-colour visual cue. Group expansion state shall be exposed programmatically. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-04 | M | Navigation shall adapt between an expanded sidebar, a collapsed form and a mobile navigation container. Route meaning and permissions shall … | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-05 | M | In the collapsed state, every item shall keep an accessible name. The full label shall be available without relying on hover. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-06 | M | All navigation shall be keyboard-operable in a logical order. The mobile drawer shall trap focus while open, restore it on close and close o… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-07 | M | Long and translated labels shall wrap or truncate without ambiguity. The full label shall stay available. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-08 | M | In activated RTL locales the sidebar edge, disclosure and directional icons shall mirror. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-09 | M | Items that are locked for entitlement reasons may be shown with an explanation and upgrade messaging, using LOCKED-* presentation. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-10 | M | Route guards may only improve UX. Every server operation shall stay independently authorised. Hidden or disabled navigation shall never be t… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-11 | M | After a route change, focus shall move to a predictable place (for example the page heading or main region) and the new page shall be announ… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-12 | M | @proseit/paep-enterprise shall export a NotFoundPage used for the  route. Route-level errors shall resolve to controlled states. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-13 | M | Products shall extend routes and navigation through manifests and feature packages, not by editing enterprise internals. Enterprise shall no… | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-14 | M (analytics) / DP (others) | Non-critical routes, and analytics routes by default, shall lazy-load. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-NAV-15 | M | Navigation structure shall support public and protected route composition. | SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3 |
| REQ-IB3-WORKSPACE-01 | M | The page frame shall provide a consistent title (a single page heading), a context line, and a primary-action region with a stable placement… | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-02 | M (conditional) | Breadcrumbs shall be shown only when the hierarchy justifies them, using the IB2 breadcrumb. | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-03 | M | The frame shall provide a status region and a filter region as defined slots. | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-04 | M | The frame shall support compact and comfortable density without dropping below the touch-target profile. | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-05 | M | The content region shall be responsive and tolerate long content: 320 px reflow, no page-wide horizontal scroll, and only bounded inner scro… | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-06 | M | The frame shall provide consistent platform patterns for these states: loading, empty, populated, filtered/no-results, validation error, per… | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-07 | M | Primary actions shall be discoverable without hover. | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-WORKSPACE-08 | M | The frame shall contain no product/domain content. The golden-workflow scaffold shall use synthetic/reference data behind contract doubles. | SCR-SHELL-011, -015; shell-information-architecture §5 |
| REQ-IB3-CMD-01 | M (invocation) / DP (key choice) | The palette shall open from a keyboard shortcut and from the visible topbar entry. The shortcut shall be documented and shall not rely on a … | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-02 | M | The palette shall offer global navigation derived from the same capability-filtered navigation model (NAV-02), plus a bounded, registered co… | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-03 | DP (grouping) / M (semantics) | Results shall be grouped by source (for example Navigation, Commands, Search results), with combobox/listbox semantics, active-descendant or… | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-04 | M | The palette shall have explicit states for idle, loading, empty query, no results, provider error and partial results. | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-05 | M | Record/search results shall come only from an injected search provider abstraction whose results the backend has already authorised. IB3 sha… | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-06 | M | Searches shall run in the active tenant/product context. Results shall be cleared on tenant change. | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-07 | M | No-result safety: an empty or unauthorised result shall not reveal that hidden items exist. Query text shall not be written to telemetry or … | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-08 | M | On narrow and mobile screens the palette shall be usable at 320 px (for example full-screen) and touch-operable. | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-09 | DP | The command-palette entry may be switched on or off by the features.uiHints.commandPalette presentation hint. The hint grants no authority. | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-10 | M | A command that mutates state or is destructive shall delegate to a server-authorised action provider and require confirmation. The palette i… | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-CMD-11 | M | The palette shall have manual keyboard/focus test evidence. | SCR-SHELL-008; decision-record Q-05, Q-12 |
| REQ-IB3-NOTIFY-01 | M | The topbar access point shall show an unread count with a non-colour indicator and a programmatic name that includes the count. | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-NOTIFY-02 | M | Transient UI feedback (toast or live region) and persistent domain notifications (panel/list) shall be visually and semantically distinct. | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-NOTIFY-03 | M | Persistent notifications shall come from a server-backed provider abstraction. IB3 shall supply the presentation, the seam and a test double… | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-NOTIFY-04 | M (preserve) / DP (confirm flow) | A notification deep link shall preserve its tenant/product context. Following a link that targets a different tenant than the active one sha… | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-NOTIFY-05 | M | The notification panel shall have loading, empty, populated, error and stale/offline states. | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-NOTIFY-06 | M (conditional on Q-08 for the toast part) | If a toast is approved (Q-08): toasts shall never be the only carrier of durable or critical information, error toasts shall not auto-dismis… | SCR-SHELL-009; decision-record Q-04, Q-08 |
| REQ-IB3-ERROR-01 | M | A global error boundary covering unhandled exceptions and route/lazy-load failures shall recover gracefully. The shell frame and navigation … | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-02 | M | The error surface shall show a non-sensitive correlation/reference identifier that the user can copy for support. | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-03 | M | The error surface shall show no stack traces, secrets, internal endpoint payloads or raw backend prose. Messages shall come from message key… | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-04 | M | Captured errors shall go through a @proseit/paep-observability error-reporting/correlation interface with a safe default implementation, int… | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-05 | M | Automatic or offered retry shall apply only to safe or idempotent operations, driven by PaepError.retryable. | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-06 | M | Each PaepErrorCategory shall map to a distinct presentation. authorization maps to LOCKED(permission); authentication maps to the session-st… | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-07 | M (hook) | Expired or invalid sessions shall not lose unsaved work when that is safe. IB3 shall provide the shell hook/state; full reauthentication bel… | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-08 | M | The telemetry adapter shall be replaceable and able to be disabled. Payloads shall carry no sensitive data. | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-ERROR-09 | M | The IB1 fail-safe configuration screen shall be brought into the IB3 error-experience pattern using IB2 primitives. Its non-sensitive identi… | SCR-SHELL-013; interaction-notes §1, §4 |
| REQ-IB3-LOCKED-01 | M | Unavailability shall be distinguished by four reasons: permission, edition, configuration and environment capability. Each reason shall be d… | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-LOCKED-02 | M | Explanations shall never imply client-side enforcement. Copy shall present the server as the authority. | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-LOCKED-03 | M | The edition state may carry upgrade messaging. Resource limits and entitlements stay server-enforced, and the shell contains no purchase or … | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-LOCKED-04 | M | Reason text shall come from Capability.reasonKey or an equivalent message key, not from hardcoded prose. | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-LOCKED-05 | M | Locked presentation shall work at navigation-item, route/page and action level. | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-LOCKED-06 | M (INFERRED) | A permission-denied page shall not show details of the protected resource. | SCR-SHELL-006, -012; decision-record Q-10, Q-13 |
| REQ-IB3-CONNECTIVITY-01 | M | The shell shall show connectivity state persistently enough for field users to judge data risk, using a non-colour cue. State changes shall … | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-02 | M (constraint) | IB3 shall render no sync summary, queue, replay or conflict state and no copy implying those capabilities exist. @proseit/paep-offline provi… | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-03 | M | Connectivity shall be read through the @proseit/paep-platform connectivity signal/port, not directly from browser globals inside enterprise … | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-04 | M | The indicator shall never imply "synced/current" when state is unknown. An unknown or degraded state shall be distinct. | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-05 | M | The offline state grants no client authority and does not bypass backend rules. | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-06 | M (hook) | Sign-out and tenant switch shall call a "pending local work" check hook before proceeding. In IB3 it reports none. | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-CONNECTIVITY-07 | DP | Behaviour when pwa.enabled=false or offlineProfile='none': connectivity is still shown; there is no sync summary in IB3 in any profile (CONN… | SCR-SHELL-014; decision-record Q-06 |
| REQ-IB3-RESP-01 | M | The shell shall be verified at wide desktop, tablet/constrained, mobile/narrow and 320 CSS px, and under zoom, long translation and RTL. | SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md |
| REQ-IB3-RESP-02 | M | There shall be no page-wide horizontal scroll, no hover-only essentials, and touch targets shall follow the controlled profile. | SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md |
| REQ-IB3-RESP-03 | M (INFERRED) | Persistent shell regions (topbar, indicators, rail) shall not consume so much space at 320 px or 400% zoom that content or actions are hidde… | SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md |
| REQ-IB3-RESP-04 | M (PO/SA deadline) | The DDR-IB2-07 follow-up (F07 focus/state examples and the full R03 320 px board in the UI lab) shall be complete before the enterprise-shel… | SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md |
| REQ-IB3-RESP-05 | M | Visual-regression baselines shall cover shell states at representative breakpoints. | SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md |
| REQ-IB3-A11Y-01 | M | The shell shall meet WCAG 2.2 Level AA, with any exceptions in the controlled exception register. | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-A11Y-02 | M | Focus shall be visible and shall not be obscured by the sticky topbar, sidebar, drawer or indicators. | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-A11Y-03 | M | Important asynchronous changes (connectivity, notification count, toasts, palette results, route change) shall use live-region or equivalent… | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-A11Y-04 | M | Drawer and sidebar motion shall respect reduced-motion preferences. | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-A11Y-05 | M | Automated axe checks shall pass on every shell state. Manual keyboard and assistive-technology evidence shall be retained for the palette, m… | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-A11Y-06 | DP | Critical shell interactions shall have usability evidence, from representative users or an approved equivalent. | SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5 |
| REQ-IB3-I18N-01 | M | Enterprise components shall contain no hardcoded user-visible text. They shall use stable content keys with English defaults, following the … | SCR-SHELL-017, -018; content-keys.md |
| REQ-IB3-I18N-02 | M | The document lang and dir shall follow the active locale. Activated RTL locales (rtlLocales) shall mirror the shell. | SCR-SHELL-017, -018; content-keys.md |
| REQ-IB3-I18N-03 | M (constraint) | IB3 shall not introduce a date/number/currency formatting subsystem. Counts are passed as message-key parameters, and any time or date text … | SCR-SHELL-017, -018; content-keys.md |
| REQ-IB3-I18N-04 | M | Backend errors and status shall be localised from structured codes, never parsed from prose. | SCR-SHELL-017, -018; content-keys.md |
| REQ-IB3-I18N-05 | M | Long-text expansion and RTL visual checks shall be run on the shell. There shall be no clipped critical UI. | SCR-SHELL-017, -018; content-keys.md |
| REQ-IB3-SEC-01 | M (security) | Navigation visibility is not authorization. The shell builds nav from the product manifest intersected with the access-decision provider. Hi… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-02 | M (security) | A disabled action is not authorization. Disabled, aria-disabled or locked controls must not be the only barrier. Invoking the underlying com… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-03 | M (security) | Edition presentation is not entitlement authority. Edition-locked and upgrade states come only from provider decisions (reason:'edition'). T… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-04 | M (security) | Locked-state explanation. A locked or unavailable item shows its reason category (permission / edition / configuration / environment) and a … | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-05 | M (security) | Command/search results respect backend authority. The palette renders exactly what the command/search provider returns, in the provider's or… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-06 | M (security) | No browser secrets. No secret, API key, client secret, private key, bearer or refresh token, cookie or session id may appear in source, fixt… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-07 | M (security) | No privileged credential in browser storage. The shell writes no token or credential to localStorage, sessionStorage, IndexedDB or the Cache… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-08 | M (security) | No unsafe HTML. Angular interpolation and bindings only. Forbidden in packages/{enterprise,platform,observability,i18n} and apps/reference-a… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-09 | M (security) | Redacted error UI. The shell error boundary shows fixed localised text, a correlation reference and safe retry/navigation actions only. It n… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-10 | M (security) | No client-side tenant authority. Active tenant/legal entity/project comes from SessionOutcome.identity.tenant (server). A tenant switch is a… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-11 | M (security) | Preferences cannot override authority. The preference store accepts only allowlisted presentation keys (for example density, sidebar collaps… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-12 | M (security) | Deep links preserve context without bypassing checks. A deep link (from a notification, search or bookmark) carries product and tenant conte… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-13 | M (security) | Open-redirect safety. Return URLs and deep-link targets must be same-origin internal router paths under deployment.basePath. The following a… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-14 | M (security) | Locale/RTL come from validated config only. Active locale ∈ localisation.supportedLocales. dir="rtl" only if the locale ∈ rtlLocales. Locale… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-15 | M (security) | Notification content is untrusted text. Content renders through a message key plus interpolated parameters, or as plain text. It is never HT… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-16 | M (security) | Logging/observability redaction. The error reporter payload is restricted to an allowlist: {category, code?, correlationId, route (path patt… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-17 | M (security) | Correlation reference. Every surfaced error has a correlation reference: the server-supplied PaepError.correlationId when present, otherwise… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-18 | M (security) | Impersonation and high-risk context visible. When IdentityContext.impersonatorId is present, the topbar shows a persistent, non-dismissible … | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-19 | M (security) | Config hints never grant. features.uiHints and capabilityDiscovery:'manifest' may only switch shell *presentation* (for example, whether the… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-20 | M (security) | Fail-safe preserved. IB3 keeps "validate before protected composition" and the immutable RuntimeConfigStore. It adds no config refresh or re… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-21 | M (security) | CSP/Trusted Types compatibility. Shell code must not depend on unsafe-inline/unsafe-eval and must run under the strict profile with Trusted … | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-SEC-22 | M (security) | No Frappe coupling. The shell reaches identity, access, search, notification and tenant through contracts and seams only. It has no @proseit… | interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3 |
| REQ-IB3-STATE-01 | M | Shell-level shared state shall be limited to identity, tenant, locale, capability, connectivity and the immutable runtime configuration. Any… | state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015 |
| REQ-IB3-STATE-02 | M | Local and derived state shall use signals/computed; streams and cancellation shall use RxJS. There shall be no NgRx or other global store fr… | state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015 |
| REQ-IB3-STATE-03 | M | The RuntimeConfigStore shall stay immutable after bootstrap. | state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015 |
| REQ-IB3-STATE-04 | M | Code shall be standalone-first and compatible with zoneless change detection. | state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015 |
| REQ-IB3-STATE-05 | M | Transient UI state (drawer open, palette query) shall stay local to its component. | state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015 |
| REQ-IB3-TEST-01 | M | Every enterprise component shall have unit and component tests covering states, keyboard/focus and responsive variants. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-02 | M | End-to-end tests shall show the reference app booting from runtime config and passing shell tests: responsive, a11y and error states (fail-s… | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-03 | M | Visual regression shall cover shell states × breakpoints × LTR/RTL × long text. Baselines shall not be bulk-updated. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-04 | M | Negative authorisation-presentation tests (SEC-01). | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-05 | M | The negative configuration startup tests shall stay green. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-06 | M | Architecture-boundary gates shall stay green: enterprise at L3, no frappe-sdk, no deep imports, no cycles. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-07 | DP | A qa:shell aggregate command shall exist, following the naming standard. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-08 | M (when applicable) | A shell initial-render and bundle budget shall be defined and measured. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-09 | M | Implementation shall be compared for conformance against HOF-IB3-001. Material deviations shall be recorded as DDRs and never silently norma… | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-10 | M | Contract test doubles shall exist for every new provider seam (search, notifications, tenant context, connectivity, observability, shell pre… | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-11 | M (PO/SA-I) | The known legacy failures of qa:ib0-wp03:negative and qa:ib0-wp04:negative shall be recorded and not remediated in IB3. | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-TEST-12 | M | Before IB3 acceptance, all six carried IB2 DDR follow-ups shall be dispositioned: DDR-IB2-07 CLOSED (mandatory deadline), and DDR-IB2-01/02/… | implementation stage (targets: region IDs, state IDs, accessibility-intent §7) |
| REQ-IB3-PROV-01 | M (provenance) | The DWP-IB3-001 brief and the Claude Design prompt describe capabilities, tasks and PAEP intent (shell, navigation, workspace frame, context… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-02 | M (provenance) | No proprietary template source, theme files, assets or distinctive implementation artefacts enter the HOF-IB3-001 bundle, packages/enterpris… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-03 | M (provenance) | Design provenance is retained: design rationale, the prompt of record (verbatim), the brief version, the selected-candidate reference and th… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-04 | M (provenance) | The final design rationale demonstrates independent composition. External inspiration is limited to capabilities and interaction requirement… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-05 | M (provenance) | Asset inventory: every asset (icons, logo placeholder, favicon, illustrations, fonts) records ID, owner, provenance, licence and alt-text in… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-06 | M (provenance) | Claude Design output (screens, prototype HTML/CSS/JS, SVG) is reviewed before adoption and linked to the provenance record. Prototype code i… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-07 | M (provenance) | Every new dependency records package, exact version, licence, rationale and approval status. A cross-cutting dependency needs an ADR. The li… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-08 | M (provenance) | Core shell assets are self-hostable. Rendering of the shell never depends on an external font, icon source or CDN. | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-09 | M (provenance) | The design approval gate "Provenance" (prompts, source references, assets and ownership recorded) is reviewed by a human. Claude does not se… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-10 | M (provenance) | The provenance register gets new rows for IB3: design handoff, assets, and any dependency or generator. Only a named human with a date may s… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-11 | M (provenance) | The clean-room scan (S06 pattern) is extended to cover packages/enterprise and the shell surface of apps/reference-app. S06 currently scans … | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-12 | M (provenance) | The Angular default favicon.ico in apps/reference-app/public/ is replaced by a ProSEIT-owned icon once the reference app becomes the shell h… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-13 | M (provenance) | Synthetic sample content only in the shell design and demo: no real customer, tenant or user data, and no real product brand in the demonstr… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-14 | M (provenance) | Release-level provenance, licence and unresolved-exception attestation stays part of the IB3 milestone evidence. | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-15 | M (provenance) | IB3 shall follow the D1 route: DWP-IB3-001 → Claude Design → HOF-IB3-001 REVIEW CANDIDATE → PO/SA design review → approved HOF-IB3-001 → Gen… | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-PROV-16 | M (provenance) | Evidence shall be kept under evidence/<IB3 WP>/ and evidence/design-handoff/HOF-IB3-001/ using the DCH §22 structure. | provenance.md; provenance/; assets/asset-register.md |
| REQ-IB3-REPORT-01 | M | The workspace/page frame shall expose generic filter, action and extension regions able to host future experiences, including future reporti… | SCR-SHELL-015 (generic frame only; no analytics behaviour) |
| REQ-IB3-REPORT-05 | M | IB3 shall implement no analytics datasets, reporting gateways, metrics, drill-down, saved report definitions, report persistence or analytic… | SCR-SHELL-015 (generic frame only; no analytics behaviour) |
| REQ-IB3-PREF-01 | M | User preferences (layout, navigation collapsed, density, filters) shall never override permissions, authoritative report definitions, requir… | SCR-SHELL-016, -022 (session only) |
| REQ-IB3-PREF-02 | M (constraint) | IB3 preference surfaces shall be limited to shell-local preferences (navigation collapsed, density) held for the session only, behind a pref… | SCR-SHELL-016, -022 (session only) |
