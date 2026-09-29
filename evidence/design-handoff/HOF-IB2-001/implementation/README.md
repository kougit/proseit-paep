# Implementation mapping: HOF-IB2-001 v1.1 → IB2-FOUNDATION-COMPONENTS

PAEP-DCH-01 §10, §18(ii), §22. Each `design-export/component-map.md` entry is mapped to its production source, selector and UI-lab specimen route. Package: `@proseit/paep-components`; public entry point `packages/components/src/index.ts` (S03). Foundation (tokens, icons, styles): `@proseit/paep-foundation`, `packages/foundation/src/`. Lab: `apps/ui-lab/src/app/` (routes in `app.routes.ts`, specimens in `specimens/`).

Lab routes are relative to the UI-lab root. The route pattern is `/components/<id>`, where `<id>` comes from `apps/ui-lab/src/app/specimens/specimen-index.ts`.

## Components (25)

| # | Handoff design element | Handoff target | Source (`packages/components/src/lib/…`) | Selector(s) in code | Lab route | Behaviour tests |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Button | `button[paepButton], a[paepButton]` | `button/button.ts` | `button[paepButton], a[paepButton]` | `/components/button` | `button/button.spec.ts` |
| 2 | Icon button | `button[paepIconButton]` | `icon-button/icon-button.ts` | `button[paepIconButton]` | `/components/icon-button` | `icon-button/icon-button.spec.ts` |
| 3 | Action group | `paep-action-group` | `action-group/action-group.ts` | `paep-action-group` (overflow menu internal; DDR-IB2-02; menu icons since `0132ff6`, DDR-IB2-03 resolved) | `/components/action-group` | `action-group/action-group.spec.ts` |
| 4 | Field wrapper | `paep-field` | `field/field.ts` (+ `field/field-control.ts` control contract) | `paep-field` | `/components/field` | `field/field.spec.ts` |
| 5 | Input | `input[paepInput]` | `input/input.ts` | `input[paepInput], textarea[paepInput]` | `/components/input` | `input/input.spec.ts` |
| 6 | Native select | `select[paepSelect]` | `select/select.ts` | `select[paepSelect]` | `/components/select` | `select/select.spec.ts` |
| 7 | Textarea | `textarea[paepInput]` | `input/input.ts` (the same `PaepInput` directive; no separate class) | `textarea[paepInput]` | `/components/textarea` | `textarea/textarea.spec.ts` |
| 8 | Checkbox | `input[type=checkbox][paepCheckbox]` | `checkbox/checkbox.ts` | `input[type=checkbox][paepCheckbox]` | `/components/checkbox` | `checkbox/checkbox.spec.ts` |
| 9 | Radio group | `paep-radio-group + input[type=radio][paepRadio]` | `radio/radio.ts` | `paep-radio-group`, `input[type=radio][paepRadio]` | `/components/radio` | `radio/radio.spec.ts` |
| 10 | Table shell | `paep-table` | `table/table.ts`, `table/table.html`, `table/table.css` | `paep-table`, `ng-template[paepTableCell]` (projection slots `[paepTableActions]`, `[paepTableFooter]`) | `/components/table` | `table/table.spec.ts` |
| 11 | List | `paep-list` | `list/list.ts` | `paep-list` | `/components/list` | `list/list.spec.ts` |
| 12 | Pagination | `paep-pagination` | `pagination/pagination.ts` | `paep-pagination` | `/components/pagination` | `pagination/pagination.spec.ts` |
| 13 | Empty state | `paep-empty-state` | `empty-state/empty-state.ts` | `paep-empty-state` | `/components/empty-state` | `empty-state/empty-state.spec.ts` |
| 14 | Alert | `paep-alert` | `alert/alert.ts` | `paep-alert` (slot `[paepAlertActions]`) | `/components/alert` | `alert/alert.spec.ts` |
| 15 | Status badge | `paep-status-badge` | `status-badge/status-badge.ts` | `paep-status-badge` | `/components/status-badge` | `status-badge/status-badge.spec.ts` |
| 16 | Progress | `paep-progress` | `progress/progress.ts`, `progress/progress.css` | `paep-progress` | `/components/progress` | `progress/progress.spec.ts` |
| 17 | Skeleton | `paep-skeleton` | `skeleton/skeleton.ts` | `paep-skeleton` | `/components/skeleton` | `skeleton/skeleton.spec.ts` |
| 18 | Dialog | `paep-dialog` (native `<dialog>` + `showModal()`) | `dialog/dialog.ts`, `dialog/dialog.css` | `paep-dialog`; sub-elements `paep-dialog-footer`, `[paepDialogClose]` (DDR-IB2-08) | `/components/dialog` | `dialog/dialog.spec.ts` |
| 19 | Drawer | `paep-drawer` (native `<dialog>`, modal) | `drawer/drawer.ts`, `drawer/drawer.css` (shares `PaepModalBase` in `dialog/dialog.ts`) | `paep-drawer` | `/components/drawer` | `drawer/drawer.spec.ts` |
| 20 | Popover | `paep-popover` (HTML popover + anchoring with script fallback) | `popover/popover.ts` | `paep-popover`, `[paepPopoverTrigger]` | `/components/popover` | `popover/popover.spec.ts` |
| 21 | Tabs | `paep-tabs, paep-tab` | `tabs/tabs.ts`, `tabs/tabs.html`, `tabs/tabs.css` | `paep-tabs`, `paep-tab` | `/components/tabs` | `tabs/tabs.spec.ts` |
| 22 | Breadcrumb | `paep-breadcrumb` | `breadcrumb/breadcrumb.ts`, `breadcrumb/breadcrumb.html` | `paep-breadcrumb` | `/components/breadcrumb` | `breadcrumb/breadcrumb.spec.ts` |
| 23 | Card | `paep-card` | `card/card.ts` | `paep-card` | `/components/card` | `card/card.spec.ts` |
| 24 | Panel | `paep-panel` | `panel/panel.ts`, `panel/panel.html` | `paep-panel` | `/components/panel` | `panel/panel.spec.ts` |
| 25 | Divider | `hr[paepDivider], paep-divider[vertical]` | `divider/divider.ts` | `hr[paepDivider]`, `paep-divider[vertical]` | `/components/divider` | `divider/divider.spec.ts` |

Shared message catalogue (content keys, `design-export/content-keys.md`): `packages/components/src/lib/messages/messages.ts` (`PAEP_MESSAGES`), tests `messages/messages.spec.ts`.

## Component-map sub-elements

| Sub-element | Implemented in |
| --- | --- |
| Overflow ("More") menu | `action-group/action-group.ts:67-106`: internal `popover="manual"` `role="menu"` (not `PaepPopover`; DDR-IB2-02) |
| Row-detail disclosure | `table/table.html:104-135`: Details button + detail row + `<dl>` |
| Scroll buttons in tab list | `tabs/tabs.html`, `tabs/tabs.ts` |
| "Show full path" button | `breadcrumb/breadcrumb.html` |
| Error summary alert | `paep-alert` with focus (consumer composition; `/components/alert`) |
| Live-region announcer | `PaepAnnouncer` in `packages/foundation/src/lib/announcer/announcer.ts` (exported from `@proseit/paep-foundation`) |

## Handoff screens → lab pages

| Handoff screen | Lab route(s) |
| --- | --- |
| SCR-IB2-L01 UI-lab home | `/` |
| SCR-IB2-L02 Specimen template (Button) | `/components/button` |
| SCR-IB2-F01…F08 | `/foundations/colour`, `/foundations/typography`, `/foundations/spacing`, `/foundations/surfaces`, `/foundations/motion`, `/foundations/density`, `/foundations/focus`, `/foundations/icons` |
| SCR-IB2-F09 Brand override | `/proofs/brand` |
| SCR-IB2-C01…C08 | the component routes of each family above |
| SCR-IB2-C03N Table narrow strategies | `/proofs/table-strategies` |
| SCR-IB2-R01 Long content | `/proofs/long-content` |
| SCR-IB2-R02 RTL | `/proofs/rtl` |
| SCR-IB2-R02D Drawer RTL | `/components/drawer` (RTL example; `?dir=rtl`) |
| SCR-IB2-R03 320 px reflow | `/proofs/responsive` |
| (no handoff screen) Token catalogue | `/tokens` |

`EV` = `evidence/IB2-FOUNDATION-COMPONENTS`.
