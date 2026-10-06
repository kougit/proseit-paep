# Token-use map: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (revision 3: human similarity review PASS and PO/SA design approval, 2026-10-05; decisions recorded in revision 2). Every value in the shell reference CSS (`provenance/generator/shell.css`) is an **accepted** token from HOF-IB2-001 v1.1 (`foundation/prototype-reference.css`), except the `--paep-shell-*` and `--paep-layer-*` tokens in §3, whose design intent the PO/SA approved on 2026-10-05.
>
> Contrast is computed with the IB2 formula (`provenance/generator/contrast.py`, WCAG 2.x relative luminance). The check that every referenced token exists was run against the IB2 prototype CSS: **0 undefined tokens**.

## 1. Accepted tokens used, by region

| Region | Tokens |
| --- | --- |
| SHELL-REGION-BANNER (topbar) | `--paep-color-surface`, `--paep-color-border-subtle`, `--paep-color-text-primary`, `--paep-color-text-secondary`, `--paep-color-hover-neutral`, `--paep-space-2..4`, `--paep-font-size-title-sm`, `--paep-font-size-body(-sm)`, `--paep-size-target-touch` |
| SHELL-REGION-PRODUCT | `--paep-brand-primary`, `--paep-brand-on-primary`, `--paep-brand-accent` (mark); environment badge: `--paep-color-status-warning-{fg,bg,border}` |
| SHELL-REGION-CONTEXT, -SEARCH | `--paep-color-surface-subtle`, `--paep-color-border-default`, `--paep-radius-sm`, `--paep-font-family-mono` (keyboard hint) |
| SHELL-REGION-NOTIFICATIONS | `--paep-color-status-error-strong` + `--paep-color-text-inverse` (unread count); `--paep-color-status-neutral-{fg,bg,border}` (loading/unknown count) |
| SHELL-REGION-NAV | `--paep-color-surface`, `--paep-color-selected-{bg,fg,indicator}`, `--paep-color-hover-neutral`, `--paep-color-text-secondary` (locked item), `--paep-radius-sm`, `--paep-space-*` |
| SHELL-REGION-STATUS | `--paep-color-status-{warning,error,info,neutral}-{fg,bg,border}` |
| SHELL-REGION-MAIN / page frame | `--paep-color-bg-page`, `--paep-font-size-heading-2`, `--paep-line-height-heading-2`, `--paep-color-link`, `--paep-layout-content-max` (directly; the shell alias was rejected) |
| Locked state | `--paep-color-surface`, `--paep-color-status-{neutral,info}-{fg,bg,border}`, `--paep-font-size-heading-3`, `--paep-space-3..6` |
| SHELL-REGION-OVERLAY | `--paep-color-surface-overlay`, `--paep-color-scrim`, `--paep-elevation-3` (menus, flyout), `--paep-elevation-5` (sheet, palette), `--paep-radius-md`, `--paep-radius-lg` |
| Focus (all), skip link | `--paep-color-border-strong` (skip link edge), `--paep-color-focus-ring`, `--paep-color-focus-halo`, `--paep-focus-ring-width`, `--paep-focus-ring-offset` |
| Motion | `--paep-motion-duration-{fast,base,moderate}`, `--paep-motion-easing-*`, `--paep-motion-loop-*` (all removable, SCR-SHELL-021) |
| Density | `--paep-density-*` in content only (Q-14) |

## 2. Contrast evidence (text and non-text pairs used by the shell)

| Pair | Foreground / background | Ratio | Requirement | Result |
| --- | --- | --- | --- | --- |
| Topbar and nav text | `#1A1F26` / `#FFFFFF` | 16.56:1 | 4.5:1 | PASS |
| Secondary text (site line, locked nav item) on surface | `#545D68` / `#FFFFFF` | 6.68:1 | 4.5:1 | PASS |
| Secondary text on surface-subtle (context, search trigger) | `#545D68` / `#F7F8FA` | 6.29:1 | 4.5:1 | PASS |
| Secondary text on page background | `#545D68` / `#EFF2F5` | 5.95:1 | 4.5:1 | PASS |
| Current nav item text | `#24364B` / `#E7ECF2` | 10.37:1 | 4.5:1 | PASS |
| Current nav indicator (non-text) on surface | `#24364B` / `#FFFFFF` | 12.32:1 | 3:1 | PASS |
| Links on page background | `#24364B` / `#EFF2F5` | 10.97:1 | 4.5:1 | PASS |
| Unread count badge | `#FFFFFF` / `#B3261E` | 6.54:1 | 4.5:1 | PASS |
| Neutral count / status | `#3E4650` / `#EFF2F5` | 8.51:1 | 4.5:1 | PASS |
| Warning strip / environment badge | `#8A4B00` / `#FDF1DC` | 6.09:1 | 4.5:1 | PASS |
| Info strip / edition locked | `#1F5AA8` / `#E7EFFA` | 5.87:1 | 4.5:1 | PASS |
| Error strip / rejected switch | `#B3261E` / `#FCEBE9` | 5.66:1 | 4.5:1 | PASS |
| Online indicator | `#16693A` / `#FFFFFF` | 6.74:1 | 4.5:1 | PASS |
| Field-style search trigger border (non-text) | `border-default #6A737E` / `#FFFFFF` | 4.81:1 | 3:1 | PASS |
| Hover row text | `#1A1F26` / `#EFF2F5` | 14.74:1 | 4.5:1 | PASS |
| Placeholder mark: white on Navy | `#FFFFFF` / `#24364B` | 12.32:1 | decorative (named by adjacent text) | n/a |
| Placeholder mark: Gold on Navy | `#D4A62A` / `#24364B` | 5.45:1 | decorative | n/a |
| Focus ring and halo on every chrome surface | see SCR-SHELL-020 | lowest ring 5.61:1 (light chrome) | 3:1 | PASS |

The status borders (neutral 1.91:1, info 2.59:1, warning 2.25:1) are **decorative** edges. The locked reason and the status meaning are always carried by the icon and the text, never by the edge colour. White on Gold is not used (prohibited in v1.1).

## 3. Shell tokens (foundation, D1): PO/SA decision 2026-10-05

**12 tokens approved** (design intent): six `--paep-shell-*` sizes and six `--paep-layer-*` semantic layers. **1 rejected:** the content-max alias. The controlled token count of this handoff is therefore 12 (13 proposed − 1 rejected).

| Token | Value | Purpose | Decision |
| --- | --- | --- | --- |
| `--paep-shell-topbar-block-size` | `3.5rem` (56 px) | Holds a 40 px touch target plus 8 px block padding. Also the sticky-chrome height | APPROVED |
| `--paep-shell-sidebar-inline-size` | `16rem` (256 px) | Fits labels of about 28 characters on one line; the rest wrap | APPROVED |
| `--paep-shell-rail-inline-size` | `5.5rem` (88 px) | Collapsed rail with a visible authored short label under the icon (Q-03, X-01) | APPROVED |
| `--paep-shell-sheet-inline-size` | `20rem` (320 px) | Maximum inline size of the mobile navigation sheet; viewport-constrained (`min(20rem, 100vw)`), effectively full width below 600 px (Q-09) | APPROVED |
| `--paep-shell-status-block-size` | `2.5rem` (40 px) | Minimum height of one status row; rows grow with wrapped text | APPROVED |
| `--paep-shell-sticky-offset` | `calc(topbar + --paep-space-2)` | `scroll-padding-block-start`, so focused elements are never hidden under the sticky topbar (WCAG 2.4.11) | APPROVED |
| `--paep-shell-content-max-inline-size` | `90rem` | Alias of the accepted `--paep-layout-content-max` | **REJECTED** (duplicate). The reference CSS uses `--paep-layout-content-max` |
| `--paep-layer-sticky` | `30` | Sticky topbar; collapsed rail column | APPROVED |
| `--paep-layer-flyout` | `40` | Collapsed-rail group flyout | APPROVED |
| `--paep-layer-popup` | `45` | Topbar menus and panels; implementation uses the top layer, this is the fallback value | APPROVED |
| `--paep-layer-overlay-scrim` | `60` | Scrim behind modal overlays | APPROVED |
| `--paep-layer-overlay` | `61` | Navigation sheet, command palette, dialogs | APPROVED |
| `--paep-layer-skip-link` | `80` | Skip link when focused | APPROVED |

Each `--paep-layer-*` value is attached to its reviewed semantic layer purpose. They are **not** an arbitrary numeric z-index ladder: a new layer needs its own reviewed purpose. The reference CSS now declares the six layer tokens and uses them for every shell `z-index`.

No new colour, tone, radius, spacing, typography, motion or elevation token is proposed or approved (Q-13: no new tone).
