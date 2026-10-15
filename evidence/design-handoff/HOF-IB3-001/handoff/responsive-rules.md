# Responsive rules: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2).
>
> **Breakpoints:** the accepted em breakpoints: 37.5em (600 px), 64em (1024 px), 90em (1440 px).
>
> **Render profiles:**
> - 1440 × 900 (desktop);
> - 834 × 1112 (tablet);
> - 640 × 900 (= 1280 px at 200 % zoom);
> - 320 × 640 (= 1280 px at 400 % zoom);
> - 375 × 812 where the narrow layout differs;
> - audit profiles 1024 × 768 and 320 × 256.
>
> Evidence: `screens/render-check.json`: 402 renders, **0** with page-wide horizontal scroll, **0** off-screen controls, **0** targets under 24 px.

## 1. Regions by width

| Region | ≥ 1024 px | 600-1023 px | < 600 px |
| --- | --- | --- | --- |
| Skip link | first Tab stop | same | same |
| Product | mark + name (ellipsis) + environment badge | mark + name + badge | mark only; the badge moves to the sheet header |
| Context | button (switcher) or static text; tenant + site on two lines, ellipsis | same | removed from the topbar; shown in the page-header context line and the sheet header (Q-07) |
| Search | field-style trigger with Ctrl/⌘K hint | icon button | icon button |
| Connectivity (online) | icon + label | icon with accessible name | hidden; non-online states always show in the status strip (Q-06) |
| Language (only with more than one locale, X-05 B) | globe button with the active language code; name "Language: {language}" | same | inside the account menu |
| Help | icon button | icon button | inside the account menu |
| Notifications | icon button + count | same | same |
| Account | icon + display name (ellipsis) | icon | icon |
| Navigation | persistent sidebar 16 rem, user-collapsible to a 5.5 rem rail (Q-03) | modal sheet from inline-start, max 20 rem, viewport-constrained (Q-09) | modal sheet, effectively full width |
| Status strip | full-width rows, one per message, in X-03 order | same | highest-priority row + an obvious "n more status messages" disclosure button when several (X-02); a critical state is never concealed permanently |
| Page header | `h1`, breadcrumbs, status, actions at inline-end | actions wrap below the title | actions wrap; "More" overflow per `PaepActionGroup` (container < 30 rem) |
| Aside | beside the content (≥ 1440 px) or below | below | below |
| Palette | centred modal, max 40 rem | same | full screen |
| Notification panel | non-modal inset panel under the bell, inline-end, max 24 rem, 16 px viewport margin (RD-02) | same | non-modal inset panel, 16 px from each viewport edge; never full screen |
| Menus | governed base, inline-end aligned, 16 px viewport margin (RD-01) | same | max inline size = viewport − 2 × 16 px |

## 2. Never-hidden set

At 320 px and at 320 × 256: navigation toggle · search · notifications with count · account with sign-out · non-online connectivity · current tenant context · skip link. Evidence: SCR-SHELL-004, -005, -014 stacked-narrow-collapsed, -018 zoom-400 (320 × 256).

## 3. Long content

| Content | Rule |
| --- | --- |
| Product name | one line, ellipsis in the topbar; the full name is in the accessible name and the page title |
| Tenant / site in topbar | one line each, ellipsis; the full text is in the accessible name and the switch dialog |
| Tenant / site in page-header context line | wraps, never truncates |
| Navigation labels | wrap (no ellipsis); the rail uses the authored `shortLabel`, otherwise the full label wraps; never auto-truncated or auto-hyphenated (X-01) |
| Page `h1` | wraps (`overflow-wrap: anywhere` for unbroken strings) |
| User display name | ellipsis in the topbar; wraps in the account menu header |
| Identifiers (tenant id, record ids, references) | `dir="ltr"`, no wrapping inside the identifier except at 320 px with extreme values (DDR-01) |

Evidence: SCR-SHELL-005 long-names, -011 long-content, -018 long-text-2x, -004 long-labels.

## 4. Scrolling

- **Document scrolling only.** The topbar is sticky, and `scroll-padding-block-start` keeps focused elements clear of it.
- **At 320 × 256** the topbar stays sticky (56 px, 22 % of the height), and the status strip scrolls with the page.
- **Bounded inner scroll** is used only for 2-D content (tables, via `PaepTable` and DDR-01) and for overlay bodies (palette list, sheet body, panel body). Each is a named region when it can take focus (DDR-04).
- **No page-wide horizontal scroll** at any profile.

## 5. Zoom

| Condition | Result |
| --- | --- |
| 200 % (640 px) | tablet rules; SCR-SHELL-003 and every screen marked `zoom200` |
| 400 % (320 px) | narrow rules; SCR-SHELL-019 board of every 320 render |
| 400 % short (320 × 256) | never-hidden set visible; SCR-SHELL-018, -014 |
| Text-only 200 % | all chrome sizes are in rem, and targets grow with text; audit at implementation |

## 6. Density

The chrome stays comfortable: 40 px touch targets in the topbar and navigation. Content follows `[data-paep-density]` (Q-14; SCR-SHELL-022). Coarse pointers keep 40 px in content too (accepted foundation rule).
