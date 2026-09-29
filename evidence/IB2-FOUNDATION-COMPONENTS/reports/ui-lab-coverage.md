# IB2-FOUNDATION-COMPONENTS — UI Laboratory Coverage (IB2-AC13)

Measured on the final code commit (`logs/verification-6dc71cc/`) on 2026-09-27 from `apps/ui-lab/src/app/app.routes.ts`, `specimens/registry.ts`, `specimens/specimen-index.ts`, `lab/specimen-page.ts`, `pages/*.ts|html` and each specimen's `*_META`. Status: PASS (technical) for S07 (`qa:design-system` 10/10 and `qa:design-system:negative` 49/49). Browser-gate results are not re-run here.

## 1. Routes

| Group | Routes | Count |
| --- | --- | --- |
| Home | `/` | 1 |
| Token catalogue | `/tokens` | 1 |
| Foundations | `/foundations/colour`, `/typography`, `/spacing`, `/surfaces`, `/motion`, `/density`, `/focus`, `/icons` | 8 |
| Components | `/components/<id>` for the 25 ids (lazy, `LAB_SPECIMEN_ROUTES`) | 25 |
| Proofs | `/proofs/responsive`, `/long-content`, `/rtl`, `/brand`, `/table-strategies` (lazy) | 5 |
| **Total** | every route is listed in the "Laboratory contents" navigation (`LAB_NAV`) | **40** |

`**` redirects to `/`. Lab-wide settings are mirrored in the URL: `?density=compact`, `?dir=rtl`, `?brand=synthetic-demo-petrol`, `?motion=reduce` (`lab/lab-settings.ts`).

## 2. What every specimen page shows

`lab-specimen-page` renders, from the metadata: family, `h1` name, purpose, selector; **Examples** (the projected `lab-example` blocks); **Variants and states**; **Accessibility** (Keyboard list, Semantics and focus list); **Responsive and localisation** (Responsive, RTL, Content keys); **Evidence** (behaviour-test path from `unitTests` with `npm run test:components`; axe-core at 320/834/1440 px LTR/RTL and reduced motion via `npm run qa:accessibility`; visual CANDIDATE captures under `evidence/IB2-FOUNDATION-COMPONENTS/visual/`, "not self-approved"). The Evidence text other than the test path is fixed in the frame, not per component.

Columns: number of metadata entries per field; content keys; the live example headings; whether the page itself contains a `dir="rtl"` example. Every page is also audited whole-page in RTL (`?dir=rtl`) by the browser gate, and `/proofs/rtl` shows an Arabic composition.

| Route | Name | Variants | States | Keyboard | Accessibility | Content keys | Examples | In-page RTL example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/components/button` | Button | 8 | 8 | 2 | 5 | `paep.button.busy` | 8: Variants; Icons; Loading (activate to start; focus stays on the button); Disabled (with a visible reason); Long label (wraps, never truncated); Block (full width); Compact density; Right-to-left | yes |
| `/components/icon-button` | Icon button | 3 | 7 | 1 | 3 | `paep.common.close`, `paep.action.moreActions`, `paep.pagination.previousPage`, `paep.pagination.nextPage` | 5: Variants; Disabled; Loading; Compact density (32 × 32); Right-to-left (directional icons mirror) | yes |
| `/components/action-group` | Action group | 3 | 9 | 4 | 5 | `paep.action.more`, `paep.action.moreActions` | 5: Toolbar (wide); Toolbar in a narrow container (below 30rem: primary + More); Footer (dialog / drawer); Long labels (items wrap to new rows); Right-to-left | yes |
| `/components/field` | Field wrapper | 2 | 11 | 1 | 5 | `paep.common.required`, `paep.common.optional`, `paep.common.readOnly`, `paep.common.unsavedChange` | 6: Label, required, help; Prefix and suffix adornments; Validation (error on blur or submit, removed as soon as the value is valid); Read-only, disabled and dirty; Long label, help and error; Right-to-left | yes |
| `/components/input` | Input | 6 | 8 | 1 | 3 | none | 7: Plain, prefix, suffix, both; Empty with an example-format placeholder; Read-only and disabled; Invalid; Long value and narrow width; Compact density; Right-to-left | yes |
| `/components/select` | Native select | 1 | 10 | 1 | 2 | none | 6: Default and with a selected value; Invalid; Disabled and read-only; Long option (closed control truncates); Compact density; Right-to-left | yes |
| `/components/textarea` | Textarea | 1 | 10 | 1 | 3 | `paep.common.unsavedChange` | 5: Default (type to mark the field dirty); Invalid; Read-only and disabled; Long content (scrolls vertically inside the control); Compact density (minimum height unchanged) | no |
| `/components/checkbox` | Checkbox | 2 | 11 | 2 | 4 | none | 6: Single; Group with indeterminate parent; States; Invalid (with a message); Long label; Compact density and right-to-left | yes |
| `/components/radio` | Radio group | 2 | 9 | 2 | 4 | none | 6: Vertical with help; Horizontal (short options; wraps when narrow); Invalid and required; Disabled and read-only; Long labels; Right-to-left | yes |
| `/components/table` | Table shell | 2 | 10 | 3 | 5 | `paep.table.details`, `paep.table.detailsFor`, `paep.table.loading`, `paep.table.count`, `paep.table.errorTitle`, `paep.table.errorBody`, `paep.table.errorReference`, `paep.table.scrollRegion`, `paep.common.retry`, `paep.empty.title`, `paep.noResults.title`, `paep.noResults.clear` | 5: Standard with states (choose a state; resize to see priority columns move); Container below 60 rem (priority 3 in row detail); Container below 40 rem (priority 2 and 3 in row detail); Compact density; Bounded scroll fallback (two-dimensional comparison only) | no |
| `/components/list` | List | 3 | 9 | 2 | 4 | `paep.common.loading`, `paep.common.retry`, `paep.table.errorTitle`, `paep.table.errorBody`, `paep.empty.title`, `paep.noResults.title`, `paep.noResults.clear` | 2: States (choose a state); Narrow container (meta below text under 20 rem) | no |
| `/components/pagination` | Pagination | 3 | 10 | 2 | 4 | `paep.pagination.label`, `paep.pagination.previous`, `paep.pagination.next`, `paep.pagination.previousPage`, `paep.pagination.nextPage`, `paep.pagination.page`, `paep.pagination.currentPage`, `paep.pagination.summary`, `paep.pagination.compact` | 6: Middle page (focus moves to the region heading); First page; Last page; Links (pageHref); Compact (container below 36 rem); Long labels (translated text) | no |
| `/components/empty-state` | Empty state | 2 | 5 | 1 | 4 | `paep.empty.title`, `paep.empty.body`, `paep.noResults.title`, `paep.noResults.body`, `paep.noResults.clear` | 4: Empty with create action; No results; Disabled action with reason; Long text, no action | no |
| `/components/alert` | Alert | 6 | 6 | 2 | 4 | `paep.status.info`, `paep.status.success`, `paep.status.warning`, `paep.status.error`, `paep.common.dismiss`, `paep.common.retry` | 5: Statuses (static, present at load); With actions; Dismissible (focus returns to the region heading); Inserted dynamically (announced); Long content | no |
| `/components/status-badge` | Status badge | 5 | 3 | 1 | 3 | none | 3: Tones; Long label in a narrow cell; In running text | no |
| `/components/progress` | Progress | 3 | 7 | 1 | 4 | `paep.progress.percent`, `paep.progress.step`, `paep.common.inProgress` | 4: Determinate; Step; Indeterminate (static hatched fill with reduced motion); Long label | no |
| `/components/skeleton` | Skeleton | 3 | 3 | 1 | 3 | `paep.common.loading` | 3: Text lines in a busy region; List items; Table cells | no |
| `/components/dialog` | Dialog | 4 | 7 | 3 | 4 | `paep.common.close`, `paep.common.cancel` | 4: Destructive confirmation (sm, busy while deleting); Informational, long content (md); Form dialog (lg) with validation; Long title and RTL | yes |
| `/components/drawer` | Drawer | 4 | 7 | 2 | 3 | `paep.common.close`, `paep.common.cancel` | 3: Detail drawer (end, md, long content); Form drawer (focus on the first field, busy while saving); Right-to-left (end = left) | yes |
| `/components/popover` | Popover | 3 | 7 | 4 | 4 | none | 6: Informational (focus stays on the trigger); With interactive content (focus moves into the panel); Menu variant; Long content and inline-end placement (shifts inside the viewport); Disabled trigger; Right-to-left | yes |
| `/components/tabs` | Tabs | 2 | 9 | 4 | 4 | `paep.tabs.scrollStart`, `paep.tabs.scrollEnd`, `paep.form.containsErrors` | 5: Automatic activation with count, error and disabled tabs; Manual activation (Enter or Space selects); Overflow (bounded scroll in a narrow container); Long labels; Right-to-left | yes |
| `/components/breadcrumb` | Breadcrumb | 2 | 8 | 2 | 3 | `paep.breadcrumb.label`, `paep.breadcrumb.showFullPath` | 5: Full (3 segments); Collapsed (more than 4 segments; activate … to expand); Narrow container (below 36 rem, 4 segments); Long segments; Right-to-left | yes |
| `/components/card` | Card | 1 | 7 | 1 | 2 | none | 5: With header, actions and footer; Body only; Long title and long content; Narrow container (below 30 rem); Right-to-left | yes |
| `/components/panel` | Panel | 2 | 9 | 1 | 3 | `paep.form.containsErrors` | 5: Static; Collapsible with header action; Collapsed with errors inside; Long title and long content; Right-to-left | yes |
| `/components/divider` | Divider | 4 | 2 | 1 | 3 | none | 3: Horizontal (full and inset); Vertical (resize to see it hide when items wrap); Compact density | no |

## 3. Token, foundation and proof pages

| Route | Sections (`h2`) |
| --- | --- |
| `/` | Contents; How the laboratory is organised |
| `/tokens` | Override rules; Catalogue |
| `/foundations/colour` | Neutral reference ramp (foundation-internal); Semantic colours (protected); Status colours (protected; always with an icon and text); Brand layer (the only overridable group); Contrast evidence (approved defaults, WCAG 2.2) |
| `/foundations/typography` | Type scale; Families |
| `/foundations/spacing` | Spacing; Size and radius |
| `/foundations/surfaces` | Elevation levels |
| `/foundations/motion` | Durations, easings and loops |
| `/foundations/density` | Density tokens |
| `/foundations/focus` | Focus ring |
| `/foundations/icons` | Icon set (25) |
| `/proofs/responsive` | Action group; Field with error; Alert; Tabs; Breadcrumb; Table shell with pagination |
| `/proofs/long-content` | Buttons and tabs at about twice the length; Three-line label, help and error; Alert, status badge and card; Long identifiers, addresses and statuses in a table |
| `/proofs/rtl` | Arabic sample: form, tabs, breadcrumb, pagination and directional icons, alert and table |
| `/proofs/brand` | Components under the current profile; Protected tokens (live values); Fail-closed validation |
| `/proofs/table-strategies` | A · Priority columns and row detail (primary); C · Bounded inner scroll (controlled fallback); B · Card summary (rejected as a table mode) |

## 4. How coverage is checked

| Check | What it requires | Negative |
| --- | --- | --- |
| S07 (`design-system-qa.mjs`) | For each of the 25 components: `specimens/<id>.specimen.ts` exists; `registry.ts` imports it; meta `id` and `family` match the census; meta fields `purpose`, `variants`, `states`, `keyboard`, `accessibility`, `responsive`, `rtl`, `contentKeys`, `unitTests` present; a `<lab-specimen-page>` and at least one `<lab-example>`; imports `@proseit/paep-components`; every applicable handoff state from `component-specs.md` documented in the specimen (185 required states) | N20 specimen removed; N21 specimen not registered; N22 `accessibility` field renamed; N36 checkbox "indeterminate" state removed |
| Index drift (`registry.ts`) | `specimen-index.ts` (contents list) must equal the registry metadata in id, name, family and order, else `console.error`, which browser check A3 fails on | none |
| Browser gate page census (`browser-qa.mjs` `main`) | Discovers pages from the contents navigation; fails "coverage" if fewer than 40 are found; audits each at 1440/834/320 px × LTR/RTL (A1 axe, A2 overflow, A3 console, A4 one `h1`/`main`) | B01–B07 (A1–A4); no negative for the 40-page census |

## 5. Observations

| # | Finding | Status |
| --- | --- | --- |
| UL-1 | S07 checks only the 25 component specimens. The token, foundation and proof pages are covered by the browser gate's "at least 40 pages" census, and no negative case proves that census fails when a page is missing. AC13 says "the coverage check fails when a component or page is missing". | Open |
| UL-2 | S07's title named "evidence", but the metadata has no evidence field; S07 checks `unitTests`. | **Resolved**: the S07 title now reads "… content keys and its unit-test reference", matching what it checks |
| UL-3 | 10 specimens (textarea, table, list, pagination, empty-state, alert, status-badge, progress, skeleton, divider) have no in-page RTL example; their RTL behaviour is described in the metadata and exercised whole-page via `?dir=rtl` and `/proofs/rtl`. | Open, Low |
