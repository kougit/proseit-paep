# Accessibility intent: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2). The target is WCAG 2.2 AA. This document states the design intent. Conformance is proven at the implementation stage by the gates listed in §7.

## 1. Structure

- **Single skip link** "Skip to main content" as the first focusable element (P-07). There is an optional second link "Skip to navigation" on wide layouts only.
- **Landmarks:**
  - exactly one `header` (banner), one `nav` labelled "Primary", and one `main` (projected from the app, tabindex −1);
  - `search` around the search trigger;
  - the status region labelled "Status" with `role=status`;
  - breadcrumb `nav`;
  - a labelled `aside` when present;
  - no `contentinfo`.

  Render check: all 402 renders have exactly one `main` and exactly one visible `h1`; every shell render has one banner (the 10 review-board renders have none, by design).
- **Headings:** one `h1` per view (page title, locked-state title or error title). Overlays use `h2`.

## 2. Names, roles, states

| Control | Name | State |
| --- | --- | --- |
| Open/close navigation | "Open navigation" / "Close navigation" | `aria-expanded`, `aria-controls` |
| Collapse navigation | "Collapse navigation" / "Expand navigation" | `aria-expanded` |
| Nav group | group label | `aria-expanded` |
| Nav link (current) | label + count text ("12 items") | `aria-current="page"`; current group in the rail: `aria-current="true"` |
| Locked nav item | label + reason ("Archive, not included in your edition") | a link to the explanation page, not disabled |
| Context button | "Current context: {tenant}, {site}. Switch context" | `aria-haspopup="dialog"` |
| Search trigger | "Search or go to…" | `aria-keyshortcuts="Control+K Meta+K"` |
| Notifications | "Notifications, {n} unread" / "count not available" | `aria-haspopup="dialog"`, `aria-expanded` |
| Language (more than one locale, X-05 B) | "Language: {language}" (visible: active language code) | `aria-haspopup="menu"`, `aria-expanded` |
| Help | "Help" | `aria-haspopup="menu"`, `aria-expanded`; items are app-configured |
| Account | "Account: {display name}" | `aria-haspopup="menu"`, `aria-expanded` |
| Online indicator | "Online" (visible label at ≥ 1024 px, hidden text below) | none |

## 3. Non-colour cues

| Meaning | Cues besides colour |
| --- | --- |
| Current navigation item | inset indicator bar + weight 600 + `aria-current` |
| Locked reasons | a distinct icon (lock / edition / sliders / device) + a title text + a distinct action |
| Connectivity | icon shape (signal / signal-low / cloud-off / unknown) + words |
| Unread count | a number in the badge + text in the accessible name |
| Status strip tone | icon + title |
| Environment | a flag icon + the environment name |

## 4. Keyboard and focus

The key maps, focus order, focus restoration and live-region plan are in `interaction-notes.md` §3-§5 and on the SCR-SHELL-020 board. Summary:

- **Keyboard:** every function works by keyboard. The palette shortcut uses a modifier (WCAG 2.1.4 not triggered), and there is no single-character shortcut.
- **Focus appearance:** the accepted ring (2 px #2D4FD1, 2 px offset, white halo) on every chrome surface. The lowest ring contrast on light chrome is 5.61:1 (SCR-SHELL-020). Q-01 is resolved as A (light topbar); the rejected Navy alternative (ring 1.85:1) stays only as a specimen on SCR-SHELL-020.
- **Focus not obscured (2.4.11):** `scroll-padding-block-start` = the sticky topbar height plus 8 px. Overlays are modal or positioned so they do not cover the focused trigger.
- **Modals** (sheet, palette, dialogs) make the background inert and lock `html` scroll through `PaepModalBase` (DDR-04).

## 5. Motion, zoom, targets, density

- **Motion:** every transition is removable (SCR-SHELL-021).
- **Zoom and reflow:** reflow at 320 px, and 320 × 256 keeps the never-hidden set (`responsive-rules.md`).
- **Targets:** 24 × 24 px minimum everywhere; 40 px chrome targets (render check: 0 targets under 24 px).
- **Density:** content follows density; chrome stays comfortable (Q-14).

## 6. Language and direction

- **Root direction:** `lang` and `dir` are set on the root from the active locale (i18n seam).
- **RTL:** logical properties throughout. Directional icons mirror (chevrons, `panel-start`, `sign-out`); the other icons do not.
- **Identifiers and counts:** rendered `dir="ltr"` inside RTL text ("99+" stays "99+").
- **RTL boards:** SCR-SHELL-017 (ar, he). RTL mechanics: PASS. The Arabic and Hebrew strings are design fixtures, valid for mechanical RTL qualification (X-04); native-copy review is PENDING and REQUIRED BEFORE IB3 ACCEPTANCE.

## 7. Evidence limits and implementation gates

This design stage ran **structural checks only** (Playwright/Chromium: horizontal scroll, off-screen controls, target size, unnamed controls, landmarks, `h1`, script errors). An automated rule engine (axe-core or equivalent) was **not** run in the design environment. It is a mandatory implementation-stage gate (acceptance criterion AC-07 in the IB3 acceptance-criteria draft, pre-flight file `14`).

The manual evidence required before IB3 acceptance (FA §3, RM-03):

- **Screen reader (mandatory):** NVDA with current Chromium (Chrome or Edge) on Windows, versions recorded, covering the 15 critical journeys. VoiceOver with Safari is supplementary only, and VoiceOver validation is never claimed unless it was tested.
- **Keyboard:** an independent keyboard-only review.
- **Usability:** a structured independent usability evaluation of 8 tasks, with at least one reviewer independent of the implementation. Automated tests do not substitute.
- **Acceptance threshold:** HIGH 0 and MEDIUM 0 accessibility/usability findings. LOW findings only with a documented disposition.
