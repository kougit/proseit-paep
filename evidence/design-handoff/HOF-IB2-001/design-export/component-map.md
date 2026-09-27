# Component map

> HOF-IB2-001 v1.1 (brand revision) · DWP-IB2-001 v1.0 · status **READY_FOR_FINAL_PO_SA_APPROVAL** (DCH §17.1 "REVIEW"). Not APPROVED_FOR_IMPLEMENTATION. Candidate values require PO/SA approval.

Maps every design element to its PAEP production target (DCH §10). IB2 creates these targets, so every row is a **new IB2 tranche component** authorised by IR-01 §6.4, not a PROPOSED NEW PATTERN beyond the tranche. No component outside the 25 is introduced.

| # | Family | Design element | PAEP target | Screens | Primary tokens |
| --- | --- | --- | --- | --- | --- |
| 1 | Actions | Button | `button[paepButton], a[paepButton]` | SCR-IB2-C01, SCR-IB2-R01, SCR-IB2-R03 | --paep-brand-primary* … |
| 2 | Actions | Icon button | `button[paepIconButton]` | SCR-IB2-C01 | as Button + --paep-size-icon-* … |
| 3 | Actions | Action group | `paep-action-group` | SCR-IB2-C01, SCR-IB2-R03 | --paep-space-2 … |
| 4 | Forms | Field wrapper | `paep-field` | SCR-IB2-C02, SCR-IB2-R01, SCR-IB2-R02 | --paep-font-size-label … |
| 5 | Forms | Input | `input[paepInput]` | SCR-IB2-C02 | --paep-color-surface … |
| 6 | Forms | Native select | `select[paepSelect]` | SCR-IB2-C02 | as Input + --paep-color-icon-default … |
| 7 | Forms | Textarea | `textarea[paepInput]` | SCR-IB2-C02 | as Input … |
| 8 | Forms | Checkbox | `input[type=checkbox][paepCheckbox]` | SCR-IB2-C02 | --paep-brand-primary … |
| 9 | Forms | Radio group | `paep-radio-group + input[type=radio][paepRadio]` | SCR-IB2-C02, SCR-IB2-R02 | as Checkbox … |
| 10 | Data | Table shell | `paep-table` | SCR-IB2-C03, SCR-IB2-C03N, SCR-IB2-R01, SCR-IB2-R03 | --paep-color-surface(-subtle) … |
| 11 | Data | List | `paep-list` | SCR-IB2-C04 | --paep-density-list-item-min-height … |
| 12 | Data | Pagination | `paep-pagination` | SCR-IB2-C04, SCR-IB2-R02, SCR-IB2-R03 | --paep-color-selected-* … |
| 13 | Data | Empty state | `paep-empty-state` | SCR-IB2-C04, SCR-IB2-C03 | --paep-color-text-secondary … |
| 14 | Feedback | Alert | `paep-alert` | SCR-IB2-C05, SCR-IB2-R01, SCR-IB2-R03 | --paep-color-status-{info … |
| 15 | Feedback | Status badge | `paep-status-badge` | SCR-IB2-C05, SCR-IB2-R01 | status tokens (PROTECTED) … |
| 16 | Feedback | Progress | `paep-progress` | SCR-IB2-C05, SCR-IB2-F05 | --paep-brand-primary (gated 8.67:1 vs track) … |
| 17 | Feedback | Skeleton | `paep-skeleton` | SCR-IB2-C05, SCR-IB2-F05 | --paep-ref-color-neutral-100 (foundation-internal) … |
| 18 | Overlays | Dialog | `paep-dialog (native <dialog> + showModal())` | SCR-IB2-C06A, SCR-IB2-C06B, SCR-IB2-C06C | --paep-color-surface-overlay … |
| 19 | Overlays | Drawer | `paep-drawer (native <dialog>, modal)` | SCR-IB2-C06D, SCR-IB2-R02 | --paep-elevation-4 … |
| 20 | Overlays | Popover | `paep-popover (HTML popover attribute + anchor positioning with script fallback)` | SCR-IB2-C06E | --paep-elevation-3 … |
| 21 | Navigation | Tabs | `paep-tabs, paep-tab` | SCR-IB2-C07, SCR-IB2-R01, SCR-IB2-R02, SCR-IB2-R03 | --paep-color-selected-indicator … |
| 22 | Navigation | Breadcrumb | `paep-breadcrumb` | SCR-IB2-C07, SCR-IB2-R01, SCR-IB2-R02, SCR-IB2-R03 | --paep-color-link … |
| 23 | Structure | Card | `paep-card` | SCR-IB2-C08, SCR-IB2-R01 | --paep-color-surface … |
| 24 | Structure | Panel | `paep-panel` | SCR-IB2-C08 | --paep-color-surface-subtle (header) … |
| 25 | Structure | Divider | `hr[paepDivider], paep-divider[vertical]` | SCR-IB2-C08 | --paep-color-border-subtle … |

## Sub-elements that are part of a tranche component (not new public components)

| Sub-element | Belongs to | Note |
| --- | --- | --- |
| Overflow ("More") menu | Action group | Built on Popover (menu variant); role=menu. Not a general Menu component. |
| Row-detail disclosure | Table shell | Button + detail row + `<dl>`. |
| Scroll buttons in tab list | Tabs | Pointer affordance, aria-hidden. |
| "Show full path" button | Breadcrumb | Inline expansion, no popover. |
| Error summary alert | Alert | Focus target after failed submit. |
| Visually hidden live-region announcer | Foundation / platform utility | For transient messages; not a Toast. See interaction-notes §Transient. |

## Items deliberately NOT created

| Item | Reason |
| --- | --- |
| Toast | Not in IR-01 §6.4 tranche (PAEP §8 lists it for later). Transient messages use the live-region announcer. |
| Tooltip | Not in tranche. Icon-only buttons therefore restricted to conventional meanings. |
| Menu / menubar (general) | Not in tranche; overflow menu is internal to Action group. |
| Toggle switch, date/time, autocomplete, multi-select | Not in tranche. |
| Row selection, sort, filter UI | Out of IB2 scope (02-TECHNICAL-ANALYSIS §D). |
| Raised card usage | Token level 2 defined, no controlled use case. |
| Lab navigation shell | Lab uses a plain contents list; enterprise shell is IB3. |
