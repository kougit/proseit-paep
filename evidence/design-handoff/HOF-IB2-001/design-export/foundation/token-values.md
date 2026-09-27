# Foundation token values (candidate)

> HOF-IB2-001 v1.1 (brand revision) · DWP-IB2-001 v1.0 · status **READY_FOR_FINAL_PO_SA_APPROVAL**. v1.1 changes only the brand group (§1.1 brand bullet, §1.5, §1.6, §1.7) per *PO/SA review: CHANGES REQUESTED — BRAND REVISION* (2026-09-27). Brand primary `#24364B` and brand accent `#D4A62A` are **PO/SA-directed values**; every other value below remains a **CANDIDATE DESIGN VALUE — REQUIRES PO/SA APPROVAL**. Machine-readable copy: `foundation/token-values.candidate.json`. Visual specimens: SCR-IB2-F01…F09.

Token names follow the value-free architecture in `ib2/design-preparation/02-TECHNICAL-ANALYSIS.md` §C (layers: `--paep-ref-*` raw, `--paep-color-*`/`--paep-space-*` semantic, protected semantic, `--paep-brand-*` override points). This document supplies the **values and rationale**; the mechanism is Claude Code's.

## 1. Colour

### 1.1 Direction and rationale

- **Neutral:** a cool grey ramp (12 steps) tuned so that the three text roles clear AA on every light surface with margin (secondary text ≥ 5.95:1), because PAEP targets displays of uneven quality and bright ambient light (field offices, sites, shared tablets). Page background is neutral-50 so white panels separate without relying on shadows.
- **Brand (`proseit-default`):** **ProSEIT Navy `#24364B`** is the dominant brand colour (`brand-primary`: primary button, link, selected state, checked controls, progress fill) and **ProSEIT Gold `#D4A62A`** is a restrained accent (`brand-accent`: emphasis only). Both are **PO/SA-directed** (PO/SA review, 2026-09-27). White on navy is 12.32:1. Gold is only ever paired with dark text `on-brand-accent #1A1F26` (7.32:1) or used as text/decoration on navy (5.45:1); **white on gold (2.26:1) and gold as text or indicator on light surfaces (2.26:1) are prohibited**. Navy is low-chroma (OKLCH C 0.044), so despite its blue hue it reads as a dark neutral, not as information status; gold's hue (86.6°) is close to warning (59.9°), so gold is never used in status-like shapes (badges, alerts, icons) and every status keeps its protected colour, icon shape and text. The tonal variants (`primary-hover #1B2A3B`, `primary-active #121E2B`, `primary-subtle #E7ECF2`) are **CANDIDATE DESIGN VALUES**. The earlier petrol blue `#0B5E73` is **no longer a ProSEIT value**; it survives only as the obviously synthetic, non-product profile `synthetic-demo-petrol` used to prove brand override (§1.6, SCR-IB2-F09).
- **Status:** four protected families plus neutral, each with fg / bg / border / strong. All status text passes ≥ 5.66:1 on its tint; every status also has a distinct icon shape (circle-i, circle-tick, triangle, octagon, circle-dash).
- **Focus:** `#2D4FD1`, protected, with a white halo, so the ring is ≥ 3:1 against any adjacent colour including brand fills and dark surfaces.
- **Dark mode:** not in IB2 (decision OD-04); the layered tokens and `data-paep-theme` attribute keep it addable later under the same gates (PAEP §6.1).

### 1.2 Neutral reference ramp (foundation-internal)

| Token | Value |
| --- | --- |
| `--paep-ref-color-neutral-0` | `#FFFFFF` |
| `--paep-ref-color-neutral-25` | `#F7F8FA` |
| `--paep-ref-color-neutral-50` | `#EFF2F5` |
| `--paep-ref-color-neutral-100` | `#E3E7EC` |
| `--paep-ref-color-neutral-200` | `#D3D9E0` |
| `--paep-ref-color-neutral-300` | `#B6BCC4` |
| `--paep-ref-color-neutral-400` | `#8C949E` |
| `--paep-ref-color-neutral-500` | `#6A737E` |
| `--paep-ref-color-neutral-600` | `#545D68` |
| `--paep-ref-color-neutral-700` | `#3E4650` |
| `--paep-ref-color-neutral-800` | `#2A3038` |
| `--paep-ref-color-neutral-900` | `#1A1F26` |

### 1.3 Semantic neutral, text and state tokens (protected)

| Token | Value | Brand-overridable |
| --- | --- | --- |
| `--paep-color-bg-page` | `#EFF2F5` | protected |
| `--paep-color-surface` | `#FFFFFF` | protected |
| `--paep-color-surface-subtle` | `#F7F8FA` | protected |
| `--paep-color-surface-sunken` | `#EFF2F5` | protected |
| `--paep-color-surface-raised` | `#FFFFFF` | protected |
| `--paep-color-surface-overlay` | `#FFFFFF` | protected |
| `--paep-color-scrim` | `rgb(26 31 38 / 0.56)` | protected |
| `--paep-color-text-primary` | `#1A1F26` | protected |
| `--paep-color-text-secondary` | `#545D68` | protected |
| `--paep-color-text-placeholder` | `#545D68` | protected |
| `--paep-color-text-disabled` | `#6A737E` | protected |
| `--paep-color-text-inverse` | `#FFFFFF` | protected |
| `--paep-color-icon-default` | `#545D68` | protected |
| `--paep-color-border-subtle` | `#D3D9E0` | protected |
| `--paep-color-border-default` | `#6A737E` | protected |
| `--paep-color-border-strong` | `#3E4650` | protected |
| `--paep-color-hover-neutral` | `#EFF2F5` | protected |
| `--paep-color-active-neutral` | `#E3E7EC` | protected |
| `--paep-color-disabled-bg` | `#E3E7EC` | protected |
| `--paep-color-disabled-border` | `#B6BCC4` | protected |
| `--paep-color-disabled-fg` | `#6A737E` | protected |
| `--paep-color-readonly-bg` | `#F7F8FA` | protected |
| `--paep-color-readonly-border` | `#8C949E` | protected |
| `--paep-color-invalid-border` | `#B3261E` | protected |
| `--paep-color-invalid-fg` | `#B3261E` | protected |
| `--paep-color-focus-ring` | `#2D4FD1` | protected |
| `--paep-color-focus-halo` | `#FFFFFF` | protected |

Role notes: `text-placeholder` meets full text contrast but never replaces a label. `text-disabled`/`disabled-fg` are exempt from 1.4.3 but still reach 3.87:1 on `disabled-bg` for legibility. `readonly-border` (neutral-400, 3.07:1) is drawn **dashed**; dashed vs solid is the non-colour cue for read-only and disabled. `invalid-border` is drawn **2 px** (thickness cue) plus icon and text.

### 1.4 Status tokens (protected; `--paep-color-status-<status>-<role>`)

| Status | fg (text, icon, invalid border) | bg (tint) | border | strong (fills: destructive button) |
| --- | --- | --- | --- | --- |
| success | `#16693A` | `#E6F3EA` | `#6BAF83` | `#16693A` |
| warning | `#8A4B00` | `#FDF1DC` | `#D9A441` | `#8A4B00` |
| error | `#B3261E` | `#FCEBE9` | `#E08A83` | `#B3261E` |
| info | `#1F5AA8` | `#E7EFFA` | `#7FA3D6` | `#1F5AA8` |
| neutral | `#3E4650` | `#EFF2F5` | `#B6BCC4` | `#3E4650` |

Destructive hover/active fills: `#93201A` / `#76170F` (derived from error-strong; protected).

### 1.5 Brand tokens (the only product-overridable group)

| Token | proseit-default | Source | synthetic-demo-petrol (SYNTHETIC, non-product, demo only) | Role |
| --- | --- | --- | --- | --- |
| `--paep-brand-primary` | `#24364B` | PO/SA-directed | `#0B5E73` | dominant brand colour: primary button fill, link text, selected fg/indicator, checked control, progress fill |
| `--paep-brand-primary-hover` | `#1B2A3B` | CANDIDATE tone | `#094C5E` | primary button hover |
| `--paep-brand-primary-active` | `#121E2B` | CANDIDATE tone | `#073C4A` | primary button pressed |
| `--paep-brand-primary-subtle` | `#E7ECF2` | CANDIDATE tone | `#E4F1F4` | selected row/item background |
| `--paep-brand-on-primary` | `#FFFFFF` | CANDIDATE (contrast-derived) | `#FFFFFF` | text/icon on primary, primary-hover, primary-active |
| `--paep-brand-accent` | `#D4A62A` | PO/SA-directed | `#9ED6E0` | restrained emphasis: header band, emphasis fill with on-accent, text on primary |
| `--paep-brand-on-accent` | `#1A1F26` | CANDIDATE (contrast-derived) | `#1A1F26` | text/icon on accent (dark; white prohibited) |

Derived (not directly overridable): `--paep-color-selected-bg = primary-subtle`, `--paep-color-selected-fg = primary`, `--paep-color-selected-indicator = primary`, `--paep-color-link = primary`; progress fill = primary. Tertiary button uses primary text with the protected neutral hover/active fills.

Public model: 7 keys (v1.0 had 7 accent keys; `accent-subtle-hover` and `accent-text` were removed as redundant because link and selected text now use `primary` directly, and `accent`/`on-accent` now name the gold emphasis pair).

### 1.6 Brand override boundary and acceptance rule

A brand profile (`product.brandProfile`, IB-01 §9.3) may set **only** the seven `--paep-brand-*` keys above. The validator is fail-closed:

1. Any key outside the brand group → **reject**. Profiles must not override success, warning, error, information, focus, invalid, disabled, read-only, text, surface, scrim or any accessibility-contrast semantic.
2. `on-primary` vs `primary`, `primary-hover`, `primary-active` ≥ 4.5:1.
3. `primary` as text vs surface (#FFFFFF), surface-subtle and bg-page ≥ 4.5:1 (links).
4. `primary` vs `bg-page` ≥ 3:1 (checked controls, indicators) and `primary` vs neutral-200 track ≥ 3:1 (progress).
5. `primary` vs `primary-subtle` ≥ 4.5:1 (selected state text).
6. `on-accent` vs `accent` ≥ 4.5:1. `accent` is never used as text or as a meaningful indicator on light surfaces, and never carries white text.
7. `primary` hue must differ from `status-error-fg` hue by ≥ 30° in OKLCH unless its chroma is < 0.05 (brand must not read as error). `accent` is never used in status-like shapes.

Demonstration results (SCR-IB2-F09):

| Profile | Check | Ratio | Needed | Result |
| --- | --- | --- | --- | --- |
| proseit-default | on-brand-primary / brand-primary | 12.32:1 | ≥ 4.5:1 | PASS |
| proseit-default | brand-primary as text / surface | 12.32:1 | ≥ 4.5:1 | PASS |
| proseit-default | brand-primary / bg-page (non-text) | 10.97:1 | ≥ 3:1 | PASS |
| proseit-default | on-brand-accent / brand-accent | 7.32:1 | ≥ 4.5:1 | PASS |
| synthetic-demo-petrol | on-brand-primary / brand-primary | 7.34:1 | ≥ 4.5:1 | PASS |
| synthetic-demo-petrol | brand-primary as text / surface | 7.34:1 | ≥ 4.5:1 | PASS |
| synthetic-demo-petrol | brand-primary / bg-page (non-text) | 6.53:1 | ≥ 3:1 | PASS |
| synthetic-demo-petrol | on-brand-accent / brand-accent | 10.37:1 | ≥ 4.5:1 | PASS |
| rejected-demo-yellow | on-brand-primary / brand-primary | 1.92:1 | ≥ 4.5:1 | FAIL → profile rejected |
| rejected-demo-yellow | brand-primary as text / surface | 1.92:1 | ≥ 4.5:1 | FAIL → profile rejected |
| rejected-demo-yellow | brand-primary / bg-page (non-text) | 1.71:1 | ≥ 3:1 | FAIL → profile rejected |
| rejected-demo-yellow | on-brand-accent / brand-accent | 1.92:1 | ≥ 4.5:1 | FAIL → profile rejected |

`proseit-default` and `synthetic-demo-petrol` are accepted with **identical** status, focus, disabled and invalid rendering (F09 frames). `rejected-demo-yellow` (yellow `#E9B308` with white text) and a profile setting white on gold are rejected; a profile that tries to override `--paep-color-status-error-fg` is rejected by rule 1.

### 1.7 Contrast evidence (WCAG 2.2 AA; relative luminance per WCAG 2.x)

| Pair | Foreground | Background | Ratio | Needed | Result |
| --- | --- | --- | --- | --- | --- |
| text-primary / surface | `#1A1F26` | `#FFFFFF` | 16.56:1 | ≥ 4.5:1 | PASS |
| text-secondary / surface | `#545D68` | `#FFFFFF` | 6.68:1 | ≥ 4.5:1 | PASS |
| text-placeholder / surface | `#545D68` | `#FFFFFF` | 6.68:1 | ≥ 4.5:1 | PASS |
| border-default (control boundary) / surface | `#6A737E` | `#FFFFFF` | 4.81:1 | ≥ 3:1 | PASS |
| icon-default / surface | `#545D68` | `#FFFFFF` | 6.68:1 | ≥ 3:1 | PASS |
| focus-ring / surface | `#2D4FD1` | `#FFFFFF` | 6.67:1 | ≥ 3:1 | PASS |
| link, brand-primary as text / surface | `#24364B` | `#FFFFFF` | 12.32:1 | ≥ 4.5:1 | PASS |
| brand-primary (checked control, indicator) / surface | `#24364B` | `#FFFFFF` | 12.32:1 | ≥ 3:1 | PASS |
| text-primary / bg-page | `#1A1F26` | `#EFF2F5` | 14.74:1 | ≥ 4.5:1 | PASS |
| text-secondary / bg-page | `#545D68` | `#EFF2F5` | 5.95:1 | ≥ 4.5:1 | PASS |
| text-placeholder / bg-page | `#545D68` | `#EFF2F5` | 5.95:1 | ≥ 4.5:1 | PASS |
| border-default (control boundary) / bg-page | `#6A737E` | `#EFF2F5` | 4.28:1 | ≥ 3:1 | PASS |
| icon-default / bg-page | `#545D68` | `#EFF2F5` | 5.95:1 | ≥ 3:1 | PASS |
| focus-ring / bg-page | `#2D4FD1` | `#EFF2F5` | 5.93:1 | ≥ 3:1 | PASS |
| link, brand-primary as text / bg-page | `#24364B` | `#EFF2F5` | 10.97:1 | ≥ 4.5:1 | PASS |
| brand-primary (checked control, indicator) / bg-page | `#24364B` | `#EFF2F5` | 10.97:1 | ≥ 3:1 | PASS |
| text-primary / surface-subtle | `#1A1F26` | `#F7F8FA` | 15.59:1 | ≥ 4.5:1 | PASS |
| text-secondary / surface-subtle | `#545D68` | `#F7F8FA` | 6.29:1 | ≥ 4.5:1 | PASS |
| text-placeholder / surface-subtle | `#545D68` | `#F7F8FA` | 6.29:1 | ≥ 4.5:1 | PASS |
| border-default (control boundary) / surface-subtle | `#6A737E` | `#F7F8FA` | 4.53:1 | ≥ 3:1 | PASS |
| icon-default / surface-subtle | `#545D68` | `#F7F8FA` | 6.29:1 | ≥ 3:1 | PASS |
| focus-ring / surface-subtle | `#2D4FD1` | `#F7F8FA` | 6.27:1 | ≥ 3:1 | PASS |
| link, brand-primary as text / surface-subtle | `#24364B` | `#F7F8FA` | 11.60:1 | ≥ 4.5:1 | PASS |
| brand-primary (checked control, indicator) / surface-subtle | `#24364B` | `#F7F8FA` | 11.60:1 | ≥ 3:1 | PASS |
| text-primary / readonly-bg | `#1A1F26` | `#F7F8FA` | 15.59:1 | ≥ 4.5:1 | PASS |
| readonly-border (dashed) / surface | `#8C949E` | `#FFFFFF` | 3.07:1 | ≥ 3:1 | PASS |
| text-primary / surface-sunken (prefix/suffix) | `#1A1F26` | `#EFF2F5` | 14.74:1 | ≥ 4.5:1 | PASS |
| disabled-fg / disabled-bg (exempt, legibility target 3:1) | `#6A737E` | `#E3E7EC` | 3.87:1 | ≥ 3:1 | exempt (legibility target met) |
| on-brand-primary / brand-primary (primary button) | `#FFFFFF` | `#24364B` | 12.32:1 | ≥ 4.5:1 | PASS |
| on-brand-primary / brand-primary-hover | `#FFFFFF` | `#1B2A3B` | 14.57:1 | ≥ 4.5:1 | PASS |
| on-brand-primary / brand-primary-active | `#FFFFFF` | `#121E2B` | 16.85:1 | ≥ 4.5:1 | PASS |
| selected-fg (brand-primary) / selected-bg (brand-primary-subtle) | `#24364B` | `#E7ECF2` | 10.37:1 | ≥ 4.5:1 | PASS |
| selected indicator (brand-primary) / brand-primary-subtle | `#24364B` | `#E7ECF2` | 10.37:1 | ≥ 3:1 | PASS |
| on-brand-accent / brand-accent (gold emphasis fill) | `#1A1F26` | `#D4A62A` | 7.32:1 | ≥ 4.5:1 | PASS |
| brand-accent (gold) as text on brand-primary (navy) | `#D4A62A` | `#24364B` | 5.45:1 | ≥ 4.5:1 | PASS |
| white text / brand-accent (PROHIBITED combination) | `#FFFFFF` | `#D4A62A` | 2.26:1 | ≥ 4.5:1 | PROHIBITED combination (fails; never used, enforced by rule) |
| brand-accent (gold) as text or indicator on surface (PROHIBITED) | `#D4A62A` | `#FFFFFF` | 2.26:1 | ≥ 3:1 | PROHIBITED combination (fails; never used, enforced by rule) |
| text-inverse / status-error-strong (destructive button) | `#FFFFFF` | `#B3261E` | 6.54:1 | ≥ 4.5:1 | PASS |
| text-inverse / destructive hover #93201A | `#FFFFFF` | `#93201A` | 8.53:1 | ≥ 4.5:1 | PASS |
| status-error-fg (invalid border, error text) / surface | `#B3261E` | `#FFFFFF` | 6.54:1 | ≥ 4.5:1 | PASS |
| status-success-fg / status-success-bg | `#16693A` | `#E6F3EA` | 5.90:1 | ≥ 4.5:1 | PASS |
| text-primary / status-success-bg | `#1A1F26` | `#E6F3EA` | 14.49:1 | ≥ 4.5:1 | PASS |
| status-success-fg (icon) / surface | `#16693A` | `#FFFFFF` | 6.74:1 | ≥ 3:1 | PASS |
| status-warning-fg / status-warning-bg | `#8A4B00` | `#FDF1DC` | 6.09:1 | ≥ 4.5:1 | PASS |
| text-primary / status-warning-bg | `#1A1F26` | `#FDF1DC` | 14.82:1 | ≥ 4.5:1 | PASS |
| status-warning-fg (icon) / surface | `#8A4B00` | `#FFFFFF` | 6.80:1 | ≥ 3:1 | PASS |
| status-error-fg / status-error-bg | `#B3261E` | `#FCEBE9` | 5.66:1 | ≥ 4.5:1 | PASS |
| text-primary / status-error-bg | `#1A1F26` | `#FCEBE9` | 14.35:1 | ≥ 4.5:1 | PASS |
| status-error-fg (icon) / surface | `#B3261E` | `#FFFFFF` | 6.54:1 | ≥ 3:1 | PASS |
| status-info-fg / status-info-bg | `#1F5AA8` | `#E7EFFA` | 5.87:1 | ≥ 4.5:1 | PASS |
| text-primary / status-info-bg | `#1A1F26` | `#E7EFFA` | 14.30:1 | ≥ 4.5:1 | PASS |
| status-info-fg (icon) / surface | `#1F5AA8` | `#FFFFFF` | 6.80:1 | ≥ 3:1 | PASS |
| status-neutral-fg / status-neutral-bg | `#3E4650` | `#EFF2F5` | 8.51:1 | ≥ 4.5:1 | PASS |
| text-primary / status-neutral-bg | `#1A1F26` | `#EFF2F5` | 14.74:1 | ≥ 4.5:1 | PASS |
| status-neutral-fg (icon) / surface | `#3E4650` | `#FFFFFF` | 9.56:1 | ≥ 3:1 | PASS |
| focus-ring / brand-primary (ring never touches the fill; halo governs) | `#2D4FD1` | `#24364B` | 1.85:1 | n/a | informational |
| focus-ring / focus-halo (two-tone guarantee) | `#2D4FD1` | `#FFFFFF` | 6.67:1 | ≥ 3:1 | PASS |
| progress fill brand-primary / track neutral-200 | `#24364B` | `#D3D9E0` | 8.67:1 | ≥ 3:1 | PASS |
| skeleton block neutral-100 / surface (decorative, aria-hidden) | `#E3E7EC` | `#FFFFFF` | 1.24:1 | n/a | exempt (legibility target met) |

Summary: 54 required pairs, 54 PASS, 0 FAIL; 2 exempt pairs (disabled legibility, decorative skeleton) meet their targets; 2 PROHIBITED combinations (white on gold, gold on light surfaces) fail by design and are forbidden by rule 6 of §1.6; 1 informational pair. "focus-ring / brand-primary" is informational: the ring never touches the navy fill because of the 2 px white halo; the halo pair is the governing check.

## 2. Typography

**Strategy: system font stack, zero new dependency** (OD-01). Sans: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Arabic", "Noto Sans Ethiopic", "Helvetica Neue", Arial, sans-serif`. Mono: `ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Noto Sans Mono", Menlo, Consolas, "Liberation Mono", monospace`. Named families are used only if already installed; nothing is shipped or fetched (IB-01 §19.1(iv)). Noto Sans Arabic/Ethiopic appear only as installed-font preferences for script coverage.

| Role | Size token | Size | Line height | Weight | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| caption | `--paep-font-size-caption` | 12 px (0.75 rem) | 16 px | 400 | 0 |
| body-sm | `--paep-font-size-body-sm` | 13 px (0.8125 rem) | 18 px | 400 | 0 |
| body | `--paep-font-size-body` | 14 px (0.875 rem) | 20 px | 400 | 0 |
| body-lg | `--paep-font-size-body-lg` | 16 px (1 rem) | 24 px | 400 | 0 |
| label | `--paep-font-size-label` | 14 px (0.875 rem) | 20 px | 600 | 0 |
| title-sm | `--paep-font-size-title-sm` | 16 px (1 rem) | 24 px | 600 | 0 |
| title | `--paep-font-size-title` | 18 px (1.125 rem) | 26 px | 600 | 0 |
| heading-3 | `--paep-font-size-heading-3` | 20 px (1.25 rem) | 28 px | 600 | 0 |
| heading-2 | `--paep-font-size-heading-2` | 24 px (1.5 rem) | 32 px | 600 | -0.01em |
| heading-1 | `--paep-font-size-heading-1` | 30 px (1.875 rem) | 38 px | 600 | -0.01em |
| data | `--paep-font-size-data` | 14 px (0.875 rem) | 20 px | 400 | 0 |
| code | `--paep-font-size-code` | 13 px (0.8125 rem) | 20 px | 400 | 0 |

Weights used: 400 and 600 only (700 reserved for the current-page number in pagination). Rationale: 14 px/20 px body is the enterprise data default; 16 px body-lg for reading passages and field values on touch where desired; a restrained 1.125–1.25 step keeps dense screens calm. Letter spacing −0.01em only on heading-1/2 and reset to 0 for RTL/Arabic.

Numeric/data: `font-variant-numeric: tabular-nums lining-nums` on data cells, pagination and progress values; numbers align to the inline-end and never wrap. Identifiers and URLs use the mono stack with `overflow-wrap: anywhere`.

Wrapping/truncation: wrap by default; truncation only where the full value is exposed elsewhere in the same view (closed native select). No `text-transform: uppercase`. All sizes in rem so user font scaling works (WCAG 1.4.4); layouts tolerate WCAG 1.4.12 text-spacing overrides because no component fixes block sizes on text.

## 3. Spacing (4 px base)

| Token | Value |
| --- | --- |
| `--paep-space-0` | 0 px (0 rem) |
| `--paep-space-0-5` | 2 px (0.125 rem) |
| `--paep-space-1` | 4 px (0.25 rem) |
| `--paep-space-2` | 8 px (0.5 rem) |
| `--paep-space-3` | 12 px (0.75 rem) |
| `--paep-space-4` | 16 px (1 rem) |
| `--paep-space-5` | 20 px (1.25 rem) |
| `--paep-space-6` | 24 px (1.5 rem) |
| `--paep-space-7` | 32 px (2 rem) |
| `--paep-space-8` | 40 px (2.5 rem) |
| `--paep-space-9` | 48 px (3 rem) |
| `--paep-space-10` | 64 px (4 rem) |

Inline: space-1/2 inside controls (icon-label gap space-2), space-2 between related actions. Block: field gap space-1 (4 px) inside a field, space-4 between fields, space-6/7 between sections. Component padding: see density. Page margin: 16 px narrow, 24 px tablet, 32 px desktop/wide. Gutter: 16 px (narrow/tablet), 24 px (desktop+). No one-off values: every component value in the specimens resolves to a token.

## 4. Size

| Token | Value |
| --- | --- |
| `--paep-size-icon-sm` / `-md` / `-lg` | 16 / 20 / 24 px |
| `--paep-size-target-min` | 24 px (WCAG 2.5.8 floor, both densities) |
| `--paep-size-target-touch` | 40 px (comfortable controls; compact under `pointer: coarse`) |

## 5. Density

| Token | Comfortable (DEFAULT) | Compact |
| --- | --- | --- |
| `--paep-density-control-height` | 40 px | 32 px |
| `--paep-density-control-padding-inline` | 12 px | 8 px |
| `--paep-density-button-padding-inline` | 16 px | 12 px |
| `--paep-density-row-height` | 48 px | 36 px |
| `--paep-density-cell-padding-block` | 12 px | 6 px |
| `--paep-density-cell-padding-inline` | 16 px | 12 px |
| `--paep-density-card-padding` | 20 px | 16 px |
| `--paep-density-stack-gap` | 16 px | 12 px |
| `--paep-density-field-gap` | 4 px | 4 px |
| `--paep-density-choice-size` | 18 px | 16 px |
| `--paep-density-icon-size` | 20 px | 16 px |
| `--paep-density-tab-height` | 44 px | 36 px |
| `--paep-density-list-item-min-height` | 48 px | 36 px |

Compact under `(pointer: coarse)` restores control and tab height to 40 px. Density never changes text size, focus ring, labels or the 24 px floor.

## 6. Radius

| Token | Value |
| --- | --- |
| `--paep-radius-none` | 0 px |
| `--paep-radius-xs` | 2 px |
| `--paep-radius-sm` | 4 px |
| `--paep-radius-md` | 6 px |
| `--paep-radius-lg` | 8 px |
| `--paep-radius-full` | 9999 px |

Use: xs checkbox; sm buttons, inputs, badges, tabs, menu items; md cards, panels, alerts, popovers, table shell; lg dialogs; full progress track only. Drawers are square on their attached edge.

## 7. Elevation and surfaces

| Level | Role | Shadow | Border |
| --- | --- | --- | --- |
| 0 | page | `none` | none |
| 1 | panel, card | `none` | 1px border-subtle |
| 2 | raised card (reserved, not used by IB2 components) | `0 1px 2px rgb(26 31 38 / 0.08), 0 2px 6px rgb(26 31 38 / 0.06)` | 1px border-subtle |
| 3 | popover, overflow menu | `0 4px 16px rgb(26 31 38 / 0.16)` | 1px border-subtle |
| 4 | drawer | `0 8px 28px rgb(26 31 38 / 0.22)` | 1px border-subtle (leading edge) |
| 5 | dialog | `0 16px 40px rgb(26 31 38 / 0.26)` | 1px border-subtle |

Scrim for dialog/drawer: `rgb(26 31 38 / 0.56)`. Every raised layer keeps a border so hierarchy survives forced-colours mode and poor displays. Shadows have no horizontal offset (RTL-neutral).

## 8. Motion

| Token | Default | Reduced motion |
| --- | --- | --- |
| `--paep-motion-duration-instant` | 0 ms | 0 ms |
| `--paep-motion-duration-fast` | 90 ms | 0 ms |
| `--paep-motion-duration-base` | 150 ms | 0 ms |
| `--paep-motion-duration-moderate` | 200 ms | 0 ms |
| `--paep-motion-duration-slow` | 250 ms | 0 ms |

| Easing token | Value |
| --- | --- |
| `--paep-motion-easing-standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `--paep-motion-easing-enter` | `cubic-bezier(0.1, 0.6, 0.3, 1)` |
| `--paep-motion-easing-exit` | `cubic-bezier(0.5, 0, 0.8, 0.4)` |
| `--paep-motion-easing-linear` | `linear` |

| Loop token | Default | Reduced motion |
| --- | --- | --- |
| `--paep-motion-loop-spinner` | 900 ms | stopped |
| `--paep-motion-loop-indeterminate` | 1800 ms | stopped |
| `--paep-motion-loop-skeleton-pulse` | 1600 ms | stopped |

Exit durations are one step shorter than entry. Where motion is used and the complete reduced-motion experience: SCR-IB2-F05 and `interaction-notes.md` §Motion.

## 9. Breakpoints and layout

| Profile | From | To | Media query (em, zoom-safe) |
| --- | --- | --- | --- |
| narrow | 0 px | 599 px | 0 em |
| tablet | 600 px | 1023 px | 37.5 em |
| desktop | 1024 px | 1439 px | 64 em |
| wide | 1440 px | — px | 90 em |

Container/grid: 4 columns (narrow), 8 (tablet), 12 (desktop/wide); gutters 16/16/24 px; page margins 16/24/32 px; `--paep-layout-content-max` 90 rem (1440 px, wide screens keep side margins); `--paep-layout-form-max` 40 rem; `--paep-layout-reading-max` 45 rem. Component adaptation uses **container queries** (thresholds: 30 rem action group, 36 rem pagination/breadcrumb, 40 rem and 60 rem table priority tiers) so a component behaves correctly inside drawers, cards and columns, not only by viewport. Full rules: `responsive-rules.md`.

## 10. Focus

`--paep-color-focus-ring` `#2D4FD1`, `--paep-focus-ring-width` 2 px, `--paep-focus-ring-offset` 2 px, `--paep-color-focus-halo` `#FFFFFF` filling the offset gap. Geometry follows the element's radius. Inset variant (offset −2 px, no halo) only inside scroll containers that would clip an outer ring (tab list). Forced colours: `Highlight`. Protected.

## 11. Token versioning

All tokens start at `since: 1.0.0` in the implementation catalogue. Any later change to a protected token's meaning requires release notes (PAEP §6.1).
