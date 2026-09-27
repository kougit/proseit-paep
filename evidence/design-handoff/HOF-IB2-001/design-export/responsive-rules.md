# Responsive rules

> HOF-IB2-001 v1.1 (brand revision; this document unchanged from v1.0) · READY_FOR_FINAL_PO_SA_APPROVAL. Adaptive, not shrunk: components adapt by **container width** (container queries); page layout and overlays adapt by **viewport** (em-based media queries so text zoom also triggers them).

## 1. Profiles
| Profile | Viewport | Media query | Columns | Gutter | Page margin |
| --- | --- | --- | --- | --- | --- |
| Wide desktop | ≥ 1440 px | `(min-width: 90em)` | 12 | 24 px | 32 px; content max 90 rem |
| Constrained desktop | 1024-1439 | `(min-width: 64em)` | 12 | 24 px | 32 px |
| Tablet | 600-1023 | `(min-width: 37.5em)` | 8 | 16 px | 24 px |
| Narrow / mobile | < 600 | default | 4 | 16 px | 16 px |
| 320 CSS px reflow | 320 | (narrow) | 4 | 16 px | 16 px → 288 px content |

Zoom: 200 % of a 1280 px window = 640 CSS px (tablet profile); 400 % = 320 CSS px (narrow). Both were rendered for every specimen (`screens/render-check.json`, viewports `zoom200` and `narrow320`).

## 2. Component container thresholds
| Component | Threshold | Behaviour below |
| --- | --- | --- |
| Action group | 30 rem | Primary stretches; secondary + destructive move to "More" at inline-end |
| Card header | wraps | Actions wrap under the title |
| Pagination | 36 rem | Compact: Previous · "8 / 20" · Next (icon + accessible names) |
| Breadcrumb | 36 rem or > 4 segments | first · … · parent · current |
| Table shell | 60 rem | Priority-3 columns → row detail; Details button appears |
| Table shell | 40 rem | Priority-2 columns → row detail; Details becomes icon-only (named); cell padding 8 px; headers wrap |
| Tabs | list overflow | Bounded horizontal scroll in the tab list; edge scroll buttons |
| Radio group (horizontal) | wraps | Falls back to vertical |
| List | 20 rem | Trailing meta moves below text |

## 3. Viewport rules for overlays
| Overlay | ≥ 600 px | < 600 px |
| --- | --- | --- |
| Dialog sm / md | 25 / 35 rem wide, 24 px viewport margin, max-height viewport − 48 px | width viewport − 32 px, max-height viewport − 32 px, footer buttons stacked full width in DOM order |
| Dialog lg | 50 rem | Full screen, no radius |
| Drawer | 30 rem (lg 40 rem); tablet min(30 rem, 100vw − 48 px) keeps a context strip | Full width, full height |
| Popover | max 20 rem, flips block-side, shifts to stay 16 px inside viewport | min(20 rem, 100vw − 32 px); max-height 60vh then inner scroll |

## 4. Table shell narrow strategy (D1)
PRIMARY: priority columns + row detail (key column and status never hide; the key cell may carry a secondary line). CONTROLLED FALLBACK: bounded inner horizontal scroll, only for genuinely two-dimensional comparison, with sticky first column, `role="region"`, `aria-label`, `tabindex="0"`. Never page-wide horizontal scroll. Comparison and 320 px specimens: SCR-IB2-C03N; `decision-record.md` OD-14.

## 5. 320 CSS px proof
Explicit 320 px renders exist for all 28 screens (`screens/renders/*--narrow320.png`), including the dedicated board SCR-IB2-R03 and the component pages for button/action group (C01), field/input (C02), alert (C05), tabs and breadcrumb (C07), table shell (C03, C03N), pagination (C04), dialog (C06A-C), drawer (C06D, R02D), popover (C06E), card/panel (C08) and the UI-lab pages (L01, L02).
Automated result: **28/28 screens, scrollWidth = 320, 0 interactive elements outside the viewport, 0 targets < 24 px.** Visual review confirmed: primary actions visible, labels and errors visible, row detail reachable, focus rings unclipped (inset only in tab list).

## 6. Long content and translation
Wrap by default; ~2× labels proven (SCR-IB2-R01): buttons grow in height; tabs wrap within 18 rem; three-line label/help/error; unbroken IDs/URLs break anywhere; long alerts stay inline; long status badges wrap at word boundaries; card/panel titles wrap with actions moving below. Known trade-off: at 320 px with extreme values, words in a narrow key column may break mid-word rather than overflow.

## 7. RTL
Logical properties only (`inline-start/end`, `block-start/end`); shadows symmetric; directional icons mirror; drawer `end` = left; tab arrow keys follow visual direction; numeric columns align to inline-end; identifiers `dir="ltr"`. Proof: SCR-IB2-R02 (forms, tabs, breadcrumb, pagination, directional icons, alert, table) and SCR-IB2-R02D (drawer).

## 8. Touch
Comfortable density by default (40 px). Compact on coarse pointer returns to 40 px controls. No hover-only discovery anywhere.
