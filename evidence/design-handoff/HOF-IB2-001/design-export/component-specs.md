# Component specifications (DWP-IB2-001)

> HOF-IB2-001 v1.1 (brand revision) · DWP-IB2-001 v1.0 · status **READY_FOR_FINAL_PO_SA_APPROVAL** (DCH §17.1 "REVIEW"). Not APPROVED_FOR_IMPLEMENTATION. Candidate values require PO/SA approval.

25 components across 7 families (IR-01 §6.4). Each entry gives the 15 fields required by the design stage. "Not applicable" states are stated, not manufactured.

## Actions

### Button

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: button[paepButton], a[paepButton] |
| Requirements | REQ-IB2-CMP-01/02, A11Y-02/03, RSP-04 |
| Specimen screens | SCR-IB2-C01, SCR-IB2-R01, SCR-IB2-R03 |
| Purpose | Trigger a single task action. The visible label names the outcome ("Save changes", "Delete supplier"). |
| Anatomy | Container (min-height = density control height) · optional leading icon (16/20 px) · label (always visible text, weight 600) · busy indicator replaces the leading icon while loading. |
| Visual hierarchy | One primary per region. Secondary for alternative actions; tertiary for low-emphasis actions inside content; destructive only for irreversible or data-removing actions. |
| Variants | primary (brand-primary navy fill) · secondary (surface fill + 1 px default border) · tertiary (no container until hover, brand-primary text) · destructive (protected error-strong fill; label must name the destructive outcome). Size is set by density, not by a size variant. Full-width ("block") is a layout option at narrow widths. |
| States | **default**: As variant. <br>**hover**: primary-hover / neutral hover fill; tertiary gains underline. Pointer only; never carries essential information. <br>**focus-visible**: 2 px focus ring, 2 px offset, white halo in the gap. <br>**active/pressed**: One step darker than hover. <br>**disabled**: Disabled fill + dashed disabled border (non-colour cue) + disabled text; native disabled; an adjacent reason text is recommended when the cause is not obvious. <br>**loading**: Spinner replaces leading icon, label stays (may change to a progressive label such as "Saving…"), width locked, aria-busy="true" + aria-disabled="true"; remains focusable; activation suppressed. <br>**long-label**: Wraps onto more lines; never truncated; min-height grows. <br>**narrow-width**: Inside an action group below 30 rem the primary button stretches to fill the row. <br>**selected**: Not applicable (use tabs, checkbox or radio for selection). <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | Enter and Space activate (native <button>). A link-styled-as-button (<a paepButton>) activates with Enter only and must navigate, not perform an in-page action. |
| Focus intent | Focus stays on the button after activation unless the action opens an overlay or navigates. While loading, focus stays on the busy button. |
| Semantics intent | Native <button type="button/submit">. aria-busy while loading; aria-disabled keeps it focusable while loading; native disabled otherwise. Icon inside is aria-hidden. |
| Responsive behaviour | Intrinsic width at wide sizes; full width when it is the primary action of a narrow action group or a narrow dialog footer. |
| Long-content behaviour | Labels ~2× English length wrap; height grows; icon stays aligned to the first line. |
| RTL behaviour | Leading icon moves to the inline-start (right). Directional icons mirror. |
| Density behaviour | Comfortable 40 px / compact 32 px min-height; compact falls back to 40 px under (pointer: coarse). |
| Token usage | --paep-brand-primary*, --paep-brand-on-primary, --paep-color-status-error-strong, --paep-color-border-default, --paep-color-disabled-*, --paep-density-control-height, --paep-density-button-padding-inline, --paep-radius-sm, --paep-motion-duration-fast |
| Prohibited usage | Icon-only primary actions; colour as the only destructive signal ("OK" in red); more than one primary per region; truncating labels; disabling without any available explanation of why in critical flows; implying that hiding/disabling is the authorisation control. |
| Accessibility notes | WCAG 2.5.8 target size met in both densities; 2.4.7 focus visible; 1.4.11 non-text contrast for the secondary border (4.81:1); 4.1.2 name from visible text; 2.5.3 label in name for any aria-label. |

### Icon button

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: button[paepIconButton] |
| Requirements | REQ-IB2-CMP-01/02, TOK-09, A11Y-02 |
| Specimen screens | SCR-IB2-C01 |
| Purpose | Compact action whose meaning is conventional and unambiguous (close, more actions, previous/next page, collapse). |
| Anatomy | Square container (control height × control height) · single icon (20 px comfortable, 16 px compact) · required accessible name. |
| Visual hierarchy | Low emphasis (secondary or tertiary styling). Never the only primary action of a region. |
| Variants | secondary (bordered) · tertiary (borderless). No primary or destructive icon-only variant. |
| States | **default**: As variant. <br>**hover**: Neutral hover fill. <br>**focus-visible**: Standard focus ring. <br>**active/pressed**: Neutral active fill. <br>**disabled**: Dashed disabled border / disabled icon colour. <br>**loading**: Spinner replaces icon; aria-busy; activation suppressed. <br>**long-label**: Not applicable (no visible label; long accessible names are allowed). <br>**narrow-width**: Unchanged; never shrinks below target size. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | Enter / Space. |
| Focus intent | As button. |
| Semantics intent | <button aria-label="…"> (label input is mandatory in the API). No tooltip dependency: IB2 has no tooltip component, so meaning must not rely on hover text or the title attribute. |
| Responsive behaviour | Unchanged across profiles. |
| Long-content behaviour | Accessible name only; no visual text. |
| RTL behaviour | Directional icons (chevron-start/end, page-first/last) mirror; non-directional icons do not. |
| Density behaviour | 40 × 40 comfortable, 32 × 32 compact (≥ 24 × 24 minimum). |
| Token usage | as Button + --paep-size-icon-* |
| Prohibited usage | Uncommon or domain-specific actions as icon-only; relying on title/tooltip for the name; destructive icon-only buttons. |
| Accessibility notes | 4.1.2 name via aria-label; 1.1.1 icon aria-hidden; 2.5.8 target size. |

### Action group

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-action-group |
| Requirements | REQ-IB2-RSP-02/04, CMP-01/02, SEC-01 |
| Specimen screens | SCR-IB2-C01, SCR-IB2-R03 |
| Purpose | Lay out the related actions of a page, card, panel, dialog or table toolbar with stable primary placement and responsive overflow. |
| Anatomy | Group container (role=group, aria-label) · primary action (always visible; placed at the inline-end at wide widths; at narrow widths it fills the row and the More button sits after it at the inline-end) · secondary actions · optional separator · destructive actions (after separator) · "More" overflow button (visible text "More" + icon) · overflow menu (Popover-based) listing moved actions in the same order, destructive last after a divider. |
| Visual hierarchy | Primary at inline-end; secondary before it; destructive separated from the rest. |
| Variants | Page/toolbar group (wraps at medium widths) · Footer group (dialog/drawer: stacked full width at narrow). Items declare priority: primary / secondary / destructive. |
| States | **default**: All actions shown (wide). <br>**hover**: Per item. <br>**focus-visible**: Per item and on the More button. <br>**active/pressed**: Per item. <br>**disabled**: Disabled item stays in its position (and in the overflow menu, marked disabled with aria-disabled). <br>**loading**: The busy item follows Button loading; other items remain available unless the action is exclusive. <br>**long-label**: Items wrap to a new row before any item overflows at medium widths. <br>**narrow-width**: Container < 30 rem: primary stays visible and stretches; secondary + destructive move to "More" at the inline-end. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | Tab moves between visible items. More button: Enter/Space/ArrowDown opens the menu and focuses the first item; ArrowUp opens and focuses the last; ArrowUp/ArrowDown move, Home/End jump; Enter/Space activates; Escape closes and returns focus to More; Tab closes the menu and continues. |
| Focus intent | After a menu item runs, focus returns to More (or to the overlay the item opened). |
| Semantics intent | role="group" + aria-label; More = <button aria-haspopup="menu" aria-expanded>; menu = role="menu" with role="menuitem" native buttons; destructive item text carries the outcome; the overflow menu is part of this component, not a new public component. |
| Responsive behaviour | Container-query driven (≥ 30 rem: all visible, wrapping allowed; < 30 rem: primary + More). Deterministic by rule, not by measurement. |
| Long-content behaviour | Labels wrap inside buttons; rows wrap; nothing is truncated. |
| RTL behaviour | Order mirrors automatically (logical flex order); More menu opens aligned to the inline-end. |
| Density behaviour | Inherits button density; gap space-2. |
| Token usage | --paep-space-2, --paep-color-border-subtle (separator), --paep-elevation-3 (menu) |
| Prohibited usage | Moving the primary action into overflow; hover-to-reveal actions; icon-only More without accessible name; hiding a destructive action's explicit text inside overflow. |
| Accessibility notes | REQ-IB2-RSP-02 hover never required; menu button pattern; focus return; 1.3.2 visual order equals DOM order. |

## Forms

### Field wrapper

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-field |
| Requirements | REQ-IB2-CMP-02, A11Y-02/03, I18N-01 |
| Specimen screens | SCR-IB2-C02, SCR-IB2-R01, SCR-IB2-R02 |
| Purpose | Give every form control a visible label, required indication, help and error text, and wire them programmatically to the control. |
| Anatomy | Label (above control, weight 600) · required marker "*" (aria-hidden; control carries required) or "(optional)" meta text · help text (below label, above control) · control slot (Input, Select, Textarea) with optional prefix/suffix adornments · error message (below control: error icon + text, weight 600) · optional dirty indicator text "Unsaved change" in the meta slot. |
| Visual hierarchy | Label > control value > error > help. |
| Variants | Default (stacked). Inline (label beside control) is NOT provided in IB2 — stacked survives translation, zoom and 320 px. |
| States | **default**: Label, optional help, control. <br>**hover**: Control border strengthens. <br>**focus-visible**: Focus ring around the control box (focus-within). <br>**active/pressed**: Not applicable <br>**disabled**: Label in secondary colour; control dashed disabled border; reason text via help. <br>**read-only**: Control dashed read-only border on read-only surface; value keeps full text contrast; remains focusable and copyable. <br>**invalid**: 2 px error border (thickness change is the non-colour cue) + error icon + message; aria-invalid="true". <br>**loading**: Not applicable (async validation messaging belongs to the consuming form). <br>**long-label**: Label, help and error wrap to three or more lines; never truncated. <br>**narrow-width**: Full container width; unchanged anatomy. <br>**selected**: Not applicable <br>**dirty**: Optional meta text "Unsaved change" (text, not colour). |
| Keyboard intent | No own keys; focus goes directly to the control. |
| Focus intent | Clicking the label focuses the control. |
| Semantics intent | <label for>, control aria-describedby="error-id help-id" (error first), aria-invalid, required/aria-required; error region is not a live region by default (form-level summary announces on submit). |
| Responsive behaviour | Max inline size 40 rem (form max); full width below. |
| Long-content behaviour | Three-line label/help/error proven in SCR-IB2-R01. |
| RTL behaviour | Label, help and error align to the inline-start; prefix/suffix swap sides via logical properties. |
| Density behaviour | Gap 4 px between parts in both densities; control height by density. |
| Token usage | --paep-font-size-label, --paep-color-text-secondary, --paep-color-status-error-fg, --paep-color-invalid-border, --paep-color-readonly-*, --paep-layout-form-max |
| Prohibited usage | Placeholder as label; colour-only errors; floating labels; hiding help in a tooltip; error text without a programmatic association. |
| Accessibility notes | 1.3.1, 3.3.1 error identification, 3.3.2 labels, 4.1.2; errors never colour-only (REQ-IB2-A11Y-03). |

### Input

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: input[paepInput] |
| Requirements | REQ-IB2-CMP-02, A11Y-02 |
| Specimen screens | SCR-IB2-C02 |
| Purpose | Single-line text, number-like and identifier entry using the native input element. |
| Anatomy | Control box (1 px default border, radius sm) · optional prefix/suffix adornment (sunken surface, e.g. currency code or unit) · native input. |
| Visual hierarchy | Value text primary; placeholder secondary and only an example format. |
| Variants | Plain · with prefix · with suffix · with both. Types follow native (text, email, tel, search, number with inputmode). |
| States | **default**: Empty or filled. <br>**hover**: Border strong. <br>**focus-visible**: Focus ring on control box. <br>**active/pressed**: Not applicable <br>**disabled**: Dashed disabled border, disabled fill. <br>**read-only**: Dashed read-only border, value at full contrast. <br>**invalid**: 2 px error border via field wrapper. <br>**loading**: Not applicable <br>**long-label**: Handled by field wrapper. <br>**narrow-width**: Full width; adornments keep nowrap and the input shrinks. <br>**selected**: Not applicable |
| Keyboard intent | Native. |
| Focus intent | Native. |
| Semantics intent | Native input; adornment text is referenced by aria-describedby so units are announced. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Long values scroll within the input natively; long IDs displayed read-only wrap. |
| RTL behaviour | Text direction follows content; use dir="auto" for mixed-direction values; LTR-only values (IDs, URLs, emails) set dir="ltr". |
| Density behaviour | 40 / 32 px; padding-inline 12 / 8 px. |
| Token usage | --paep-color-surface, --paep-color-border-default/strong, --paep-color-text-placeholder, --paep-density-control-* |
| Prohibited usage | Placeholder-only labelling; custom-drawn caret or selection; locale-specific number formatting baked into the component (belongs to i18n). |
| Accessibility notes | Native semantics; placeholder contrast 6.68:1 but still never a label. |

### Native select

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: select[paepSelect] |
| Requirements | REQ-IB2-CMP-02 |
| Specimen screens | SCR-IB2-C02 |
| Purpose | Choose one option from a short, known list using the platform picker. |
| Anatomy | Control box · native select (appearance none) · chevron-down icon at inline-end (decorative) · platform option list. |
| Visual hierarchy | As Input. |
| Variants | Single select only. Multi-select, search and custom listbox are out of IB2 scope. |
| States | **default**: Shows selected option or a first "Choose…" option. <br>**hover**: Border strong. <br>**focus-visible**: Focus ring. <br>**active/pressed**: Platform popup open (rendered by the operating system). <br>**disabled**: As Input. <br>**read-only**: Rendered as read-only text in a read-only control box (native select has no readonly). <br>**invalid**: As Input. <br>**loading**: Not applicable <br>**long-label**: Selected text truncates visually inside the closed control only (full text in the platform list and accessible name); labels wrap. <br>**narrow-width**: Full width. <br>**selected**: Platform-rendered. |
| Keyboard intent | Native (Alt+ArrowDown / Space opens; arrows change). |
| Focus intent | Native. |
| Semantics intent | Native <select>. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Closed-state truncation is the one permitted truncation because the platform list shows the full option. |
| RTL behaviour | Chevron moves to inline-end (left) automatically. |
| Density behaviour | As Input. |
| Token usage | as Input + --paep-color-icon-default |
| Prohibited usage | Custom-drawn option lists in IB2; hiding the chevron. |
| Accessibility notes | Native semantics; label via field wrapper. |

### Textarea

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: textarea[paepInput] |
| Requirements | REQ-IB2-CMP-02 |
| Specimen screens | SCR-IB2-C02 |
| Purpose | Multi-line free text such as notes and reasons. |
| Anatomy | Control box · native textarea (min 3 lines, vertical resize) · optional character count in the field meta slot. |
| Visual hierarchy | As Input. |
| Variants | Default only. Auto-grow is not in IB2. |
| States | **default**: Empty or filled. <br>**hover**: Border strong. <br>**focus-visible**: Focus ring. <br>**active/pressed**: Not applicable <br>**disabled**: As Input. <br>**read-only**: As Input; text fully visible, wraps. <br>**invalid**: As Input. <br>**loading**: Not applicable <br>**long-label**: As field wrapper. <br>**narrow-width**: Full width. <br>**selected**: Not applicable |
| Keyboard intent | Native; Tab leaves the textarea. |
| Focus intent | Native. |
| Semantics intent | Native <textarea>; character count (if shown) referenced via aria-describedby and announced politely only when the limit is near. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Vertical scroll inside the control; user-resizable vertically. |
| RTL behaviour | dir="auto" recommended. |
| Density behaviour | Min-height 5.5 rem both densities. |
| Token usage | as Input |
| Prohibited usage | Horizontal resize; hard character truncation without a message. |
| Accessibility notes | Native. |

### Checkbox

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: input[type=checkbox][paepCheckbox] |
| Requirements | REQ-IB2-CMP-02, A11Y-03/04 |
| Specimen screens | SCR-IB2-C02 |
| Purpose | Toggle an independent option, or agree to a statement. |
| Anatomy | Box 18 px (16 compact) · check or dash glyph · label text (clickable; hit area ≥ 24 px tall). |
| Visual hierarchy | Label text is primary. |
| Variants | Single · group inside a fieldset with legend. |
| States | **default**: Unchecked. <br>**checked**: Brand-primary fill + check glyph (shape cue). <br>**indeterminate**: Brand-primary fill + dash glyph (distinct shape). <br>**hover**: Border strong. <br>**focus-visible**: Ring around the box. <br>**active/pressed**: Not applicable <br>**disabled**: Dashed disabled border; checked disabled uses solid disabled fill. <br>**read-only**: Dashed read-only border; checked shows secondary-text fill; not toggleable (implemented as aria-readonly on a click-cancelled input, value still submitted). <br>**invalid**: 2 px error border + field error message. <br>**loading**: Not applicable <br>**long-label**: Label wraps; box aligns with first line. <br>**narrow-width**: Unchanged. <br>**selected**: = checked. |
| Keyboard intent | Space toggles. |
| Focus intent | Native. |
| Semantics intent | Native checkbox; indeterminate via the DOM property; group via fieldset/legend. |
| Responsive behaviour | Unchanged. |
| Long-content behaviour | Multi-line label proven. |
| RTL behaviour | Box at inline-start (right). |
| Density behaviour | 18 / 16 px box; row min-height 24 px. |
| Token usage | --paep-brand-primary, --paep-brand-on-primary, --paep-color-border-default, --paep-radius-xs, --paep-density-choice-size |
| Prohibited usage | Toggle switches styled from checkboxes (not in IB2); colour-only checked state. |
| Accessibility notes | Box border 4.81:1; checked fill 12.32:1; 2.5.8 via label hit area. |

### Radio group

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-radio-group + input[type=radio][paepRadio] |
| Requirements | REQ-IB2-CMP-02, A11Y-03 |
| Specimen screens | SCR-IB2-C02, SCR-IB2-R02 |
| Purpose | Choose exactly one of a small set of mutually exclusive options that should stay visible. |
| Anatomy | Fieldset · legend (label style) · optional help · options (18 px circle + label) · group error. |
| Visual hierarchy | Legend > options. |
| Variants | Vertical (default). Horizontal only for ≤ 3 short options and wraps. |
| States | **default**: None selected or one selected. <br>**selected**: Brand-primary 2 px ring + inner dot (shape cue). <br>**hover**: Border strong. <br>**focus-visible**: Ring around the focused option's circle. <br>**active/pressed**: Not applicable <br>**disabled**: Group or single option disabled (dashed). <br>**read-only**: Dashed read-only style; selection shown with secondary-text dot. <br>**invalid**: Group error text under legend region; each circle 2 px error border. <br>**loading**: Not applicable <br>**long-label**: Option labels wrap. <br>**narrow-width**: Horizontal layout collapses to vertical. |
| Keyboard intent | Tab enters the group at the selected (or first) option; arrow keys move and select; Tab leaves the group. |
| Focus intent | Native roving behaviour. |
| Semantics intent | <fieldset><legend>; native radios sharing a name; aria-describedby on fieldset for help/error; aria-invalid on inputs. |
| Responsive behaviour | Vertical at narrow widths. |
| Long-content behaviour | Proven. |
| RTL behaviour | Circle at inline-start; ArrowLeft/Right follow native RTL behaviour. |
| Density behaviour | As Checkbox. |
| Token usage | as Checkbox |
| Prohibited usage | Radio groups without a legend; using radios for > 7 options (use Native select). |
| Accessibility notes | 1.3.1 group labelling; 3.3.1. |

## Data

### Table shell

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-table |
| Requirements | REQ-IB2-RSP-03, CMP-01/02, A11Y-02 |
| Specimen screens | SCR-IB2-C03, SCR-IB2-C03N, SCR-IB2-R01, SCR-IB2-R03 |
| Purpose | Present a bounded, backend-neutral set of rows with a caption, column headers and complete state handling. |
| Anatomy | Shell container (surface, border subtle, radius md) · header region (title/caption, count, optional action group) · native table (thead on subtle surface, body rows, row-detail rows) · per-row "Details" disclosure button (appears when columns are hidden) · state region (loading skeleton rows, empty state, no-results state, error alert with Retry) · footer region (pagination slot). |
| Visual hierarchy | Key column and status column are priority 1; the key cell may carry a secondary line (e.g. the record name with its identifier beneath) so a single column identifies the row at 320 px; other columns are declared priority 2 or 3 by the consumer. |
| Variants | Standard (priority columns + row detail, PRIMARY) · Bounded inner scroll (FALLBACK, only for genuinely two-dimensional comparison, with sticky first column). |
| States | **loading**: Skeleton rows (count = expected page size, max 10) in the body; header retained; aria-busy on the table region; polite "Loading records" message. <br>**empty**: Empty state (tray icon, "No records yet", optional create action). <br>**filtered/no-results**: No-results state (search-with-cross icon, "No records match the current filters", Clear filters action) - distinct icon and text from empty. <br>**populated**: Rows. <br>**error**: Error alert inside the shell with Retry (tertiary) and a reference slot; last good data is not shown as current. <br>**hover**: Row hover NOT used (rows are not interactive in IB2). <br>**focus-visible**: On Details buttons and links inside cells; the inner-scroll fallback region is focusable (tabindex=0) for keyboard scrolling. <br>**disabled**: Not applicable <br>**selected**: Not applicable (row selection is out of IB2 scope). <br>**read-only**: The shell is read-only by nature. <br>**invalid**: Not applicable <br>**long-label**: Headers wrap only when necessary (nowrap by default, wrap below 40 rem); unbroken IDs and URLs break anywhere; never truncated without the full text available. <br>**narrow-width**: See responsive rules (priority columns + row detail). |
| Keyboard intent | Tab reaches interactive content only (links, Details buttons, actions). Details: Enter/Space toggles the detail row. Inner-scroll fallback: the region is a tab stop; arrow keys scroll it. |
| Focus intent | Toggling Details keeps focus on the button; Retry moves focus to the table caption after reload. |
| Semantics intent | Native <table> with <caption>, <th scope="col">; key cell may be <th scope="row">; Details button aria-expanded + aria-controls pointing to the detail row; detail row uses a <dl> repeating the hidden column headers as <dt>; state messages via a polite live region; fallback scroll region role="region" + aria-label + tabindex=0. |
| Responsive behaviour | Container-query based: ≥ 60 rem all columns; < 60 rem priority-3 columns move to row detail; < 40 rem priority-2 columns also move; the key column and status never hide. No page-wide horizontal scroll. |
| Long-content behaviour | Wrapping IDs/URLs; long status badge wraps; long header wraps below 40 rem. |
| RTL behaviour | Column order mirrors (native table direction); numeric columns align to the inline-end; IDs keep dir="ltr". |
| Density behaviour | Row min-height 48 / 36 px; cell padding 12×16 / 6×12 px. Compact recommended for desktop data-heavy screens. |
| Token usage | --paep-color-surface(-subtle), --paep-color-border-subtle, --paep-density-row-height, --paep-density-cell-padding-*, --paep-font-family-mono, --paep-font-size-body-sm |
| Prohibited usage | Page-wide horizontal scroll; hidden columns without row detail; card transformation that drops header association; sort/filter/selection UI (out of scope); backend calls or domain types in the shell. |
| Accessibility notes | 1.3.1 table semantics; 1.4.10 reflow at 320 px; 4.1.3 status messages; 2.1.1 keyboard for scroll fallback. |

### List

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-list |
| Requirements | REQ-IB2-CMP-02 |
| Specimen screens | SCR-IB2-C04 |
| Purpose | Show a vertical collection of items where column comparison is not needed. |
| Anatomy | List container · item: optional leading icon · primary text (may contain a link) · secondary text · trailing meta (badge/number) · optional per-item action (tertiary button). |
| Visual hierarchy | Primary text > meta > secondary. |
| Variants | Plain · with meta · with action. |
| States | **loading**: Skeleton items. <br>**empty**: Empty state. <br>**filtered/no-results**: No-results state. <br>**populated**: Items. <br>**error**: Error alert with Retry. <br>**hover**: Not used (items not interactive). <br>**focus-visible**: On links/actions inside items. <br>**disabled**: Not applicable <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable <br>**long-label**: Primary and secondary text wrap; trailing meta max 45% width, wraps. <br>**narrow-width**: Trailing meta moves below the text under 20 rem. |
| Keyboard intent | Tab to links/actions only. |
| Focus intent | As content. |
| Semantics intent | <ul>/<li>; state messages via polite live region. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Proven with long IDs. |
| RTL behaviour | Leading icon and meta mirror. |
| Density behaviour | Item min-height 48 / 36 px. |
| Token usage | --paep-density-list-item-min-height, --paep-color-border-subtle |
| Prohibited usage | Using List as a navigation menu or selectable listbox in IB2. |
| Accessibility notes | Native list semantics. |

### Pagination

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-pagination |
| Requirements | REQ-IB2-CMP-01, RSP-01 |
| Specimen screens | SCR-IB2-C04, SCR-IB2-R02, SCR-IB2-R03 |
| Purpose | Move between pages of a bounded, server- or input-paged collection. |
| Anatomy | <nav> · Previous (icon + text) · page numbers with gaps (first, current ± 1, last) · Next · summary "Page 8 of 20" · narrow status "8 / 20". |
| Visual hierarchy | Current page most prominent (selected fill + 2 px indicator border + bold). |
| Variants | Full (≥ 36 rem container) · Compact (< 36 rem: Previous / "Page 8 of 20" / Next, icon buttons with names). |
| States | **default**: Middle page. <br>**first page**: Previous disabled (aria-disabled, not removed). <br>**last page**: Next disabled. <br>**hover**: Neutral hover on page links. <br>**focus-visible**: Ring on each link. <br>**active/pressed**: Neutral active. <br>**selected**: Current page: aria-current="page", selected fill, indicator border, bold. <br>**disabled**: Prev/Next at the ends. <br>**loading**: Not applicable (the paged content shows loading). <br>**read-only**: Not applicable <br>**invalid**: Not applicable <br>**long-label**: Previous/Next text wraps; numbers never wrap. <br>**narrow-width**: Compact variant. |
| Keyboard intent | Tab between links; Enter activates. |
| Focus intent | After page change, focus moves to the paged region's caption/heading so the new content is announced. |
| Semantics intent | <nav aria-label="Pagination">, list of links, aria-current="page"; disabled ends use aria-disabled + no href; compact status is visible text. |
| Responsive behaviour | Container-query switch at 36 rem. |
| Long-content behaviour | Translated "Previous"/"Next" wrap. |
| RTL behaviour | Previous at inline-start (right); chevrons mirror; numbers stay LTR digits unless locale formats differ (i18n). |
| Density behaviour | Targets 40 / 32 px. |
| Token usage | --paep-color-selected-*, --paep-density-control-height |
| Prohibited usage | Colour-only current page; removing Prev/Next at ends (layout shift). |
| Accessibility notes | aria-current; 2.5.8. |

### Empty state

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-empty-state |
| Requirements | IR-01 §6.5(ii), CMP-02 |
| Specimen screens | SCR-IB2-C04, SCR-IB2-C03 |
| Purpose | Explain why a collection has nothing to show and what to do next. |
| Anatomy | Decorative icon (32 px) · heading (level set by input) · description · optional action (button). |
| Visual hierarchy | Heading > description > action. |
| Variants | empty (tray icon, "No … yet") · no-results (search-with-cross icon, "No … match the current filters", Clear filters). The two differ in icon, heading and action text. |
| States | **default**: As variant. <br>**hover**: Not applicable <br>**focus-visible**: On the action. <br>**disabled**: Action may be disabled with reason text (e.g. no permission) - never implying client authority. <br>**loading**: Not applicable <br>**long-label**: Wraps, max 36 rem measure. <br>**narrow-width**: Unchanged; centred stack. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | None of its own. |
| Focus intent | Not moved automatically. |
| Semantics intent | Heading element with configurable level; icon aria-hidden; announced via the host collection's live region when it replaces content. |
| Responsive behaviour | Padding reduces at narrow. |
| Long-content behaviour | Proven. |
| RTL behaviour | Centred; no mirroring needed. |
| Density behaviour | Unchanged. |
| Token usage | --paep-color-text-secondary, --paep-color-icon-default, --paep-space-7 |
| Prohibited usage | Using illustrations or marketing imagery; identical wording for empty and no-results. |
| Accessibility notes | Text carries meaning; icon decorative. |

## Feedback

### Alert

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-alert |
| Requirements | REQ-IB2-A11Y-03, TOK-01, CMP-02 |
| Specimen screens | SCR-IB2-C05, SCR-IB2-R01, SCR-IB2-R03 |
| Purpose | Persistent inline feedback about a region or the page. |
| Anatomy | Container (status tint + status border) · status icon (distinct shape per status) · visually hidden status word ("Error:") · optional title · body text · optional actions (tertiary/secondary buttons) · optional dismiss icon button. |
| Visual hierarchy | Title > body > actions. |
| Variants | info · success · warning · error; persistent (default) or dismissible (info/success/warning only). |
| States | **default**: As status. <br>**hover**: Not applicable <br>**focus-visible**: On actions and dismiss. <br>**disabled**: Not applicable <br>**loading**: Not applicable <br>**long-label**: Long body wraps; very long content stays inline (no inner scroll) - it is page content. <br>**narrow-width**: Icon + text column; actions wrap under the body. <br>**dismissed**: Removed; focus moves to the next logical element (region heading). <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | Tab to actions / dismiss; Enter/Space. |
| Focus intent | Not auto-focused, except an error summary alert after a failed submit which receives focus (tabindex=-1). |
| Semantics intent | Persistent alert present at load: no live role (static content). Inserted dynamically: role="alert" for error, role="status" for info/success/warning. Transient announcements (e.g. "Saved") use a visually hidden platform live region, not an Alert; a Toast component is outside the IB2 tranche. |
| Responsive behaviour | Full width of its container. |
| Long-content behaviour | Proven (SCR-IB2-R01). |
| RTL behaviour | Icon at inline-start; dismiss at inline-end. |
| Density behaviour | Padding 12×16 both densities. |
| Token usage | --paep-color-status-{info,success,warning,error}-{fg,bg,border} (PROTECTED) |
| Prohibited usage | Colour-only status; dismissible error alerts tied to unresolved errors; using Alert for transient confirmation; brand colours for status. |
| Accessibility notes | 1.4.1 (icon shape + text + hidden status word); 4.1.3 status messages. |

### Status badge

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-status-badge |
| Requirements | REQ-IB2-A11Y-03, TOK-01 |
| Specimen screens | SCR-IB2-C05, SCR-IB2-R01 |
| Purpose | Label the state of an item (e.g. in a table cell or card header). |
| Anatomy | Inline container (status tint, 1 px status border, radius sm) · status icon 14 px · text (always present). |
| Visual hierarchy | Secondary to the item it labels. |
| Variants | neutral · info · success · warning · error. The consumer maps domain states to one of these tones; the text is domain-provided. |
| States | **default**: As tone. <br>**hover**: Not applicable (not interactive). <br>**focus-visible**: Not applicable <br>**disabled**: Not applicable <br>**loading**: Not applicable <br>**long-label**: Wraps (no truncation); icon stays on the first line. <br>**narrow-width**: Wraps within the cell. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | None. |
| Focus intent | Not focusable. |
| Semantics intent | Plain text inside <span>; icon aria-hidden; no role. |
| Responsive behaviour | Inline. |
| Long-content behaviour | Proven. |
| RTL behaviour | Icon at inline-start. |
| Density behaviour | Unchanged. |
| Token usage | status tokens (PROTECTED), --paep-font-size-body-sm, --paep-radius-sm |
| Prohibited usage | Colour dot without text; interactive badges; brand-coloured status. |
| Accessibility notes | 1.4.1; text contrast ≥ 5.66:1. |

### Progress

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-progress |
| Requirements | REQ-IB2-TOK-05, CMP-02 |
| Specimen screens | SCR-IB2-C05, SCR-IB2-F05 |
| Purpose | Show progress of a long-running operation. |
| Anatomy | Label · value text ("45%", or "Step 3 of 7") · track (8 px, neutral-200) · fill (brand-primary). |
| Visual hierarchy | Label and value text carry meaning; the bar reinforces. |
| Variants | determinate · indeterminate. |
| States | **determinate**: Fill width = value; value text always visible. <br>**indeterminate**: 35% segment travels along the track (1.8 s loop). <br>**reduced-motion**: Indeterminate becomes a static full-width hatched fill + "In progress" text; determinate changes without transition. <br>**complete**: Consumer replaces with a success alert or status text. <br>**hover**: Not applicable <br>**focus-visible**: Not applicable <br>**disabled**: Not applicable <br>**loading**: = indeterminate. <br>**long-label**: Label wraps; value text moves below. <br>**narrow-width**: Unchanged. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | None. |
| Focus intent | Not focusable. |
| Semantics intent | Native <progress> (value/max; no value = indeterminate) with <label>; completion announced by the consumer via a status message. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Proven. |
| RTL behaviour | Fill grows from inline-start (right); indeterminate travels right→left. |
| Density behaviour | Unchanged. |
| Token usage | --paep-brand-primary (gated 8.67:1 vs track), --paep-ref-color-neutral-200, --paep-motion-loop-indeterminate |
| Prohibited usage | Percentage without label; infinite decorative animation under reduced motion. |
| Accessibility notes | 2.2.2 pause/stop via reduced motion; 1.4.11 fill vs track 8.67:1. |

### Skeleton

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-skeleton |
| Requirements | REQ-IB2-TOK-05 |
| Specimen screens | SCR-IB2-C05, SCR-IB2-F05 |
| Purpose | Reserve layout and signal loading for content with a known shape. |
| Anatomy | Blocks (text lines, 14 px tall, radius sm; last line 60% width) in neutral-100. |
| Visual hierarchy | Decorative. |
| Variants | text lines · table rows (inside Table shell) · list items. |
| States | **loading**: Blocks pulse opacity 1 → 0.5 (1.6 s, alternate). <br>**reduced-motion**: Static blocks, no pulse. <br>**hover**: Not applicable <br>**focus-visible**: Not applicable <br>**disabled**: Not applicable <br>**long-label**: Not applicable <br>**narrow-width**: Blocks are fluid. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | None. |
| Focus intent | None. |
| Semantics intent | aria-hidden="true"; the host region sets aria-busy="true" and provides a visually hidden "Loading…" text. |
| Responsive behaviour | Fluid. |
| Long-content behaviour | Not applicable |
| RTL behaviour | Short last line aligns to inline-start. |
| Density behaviour | Row heights follow density. |
| Token usage | --paep-ref-color-neutral-100 (foundation-internal), --paep-motion-loop-skeleton-pulse |
| Prohibited usage | Directional shimmer sweeps; skeletons for > 10 s without a message. |
| Accessibility notes | 2.2.2; hidden from AT. |

## Overlays

### Dialog

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-dialog (native <dialog> + showModal()) |
| Requirements | REQ-IB2-CMP-01/02, A11Y-02, RSP-01 |
| Specimen screens | SCR-IB2-C06A, SCR-IB2-C06B, SCR-IB2-C06C |
| Purpose | Interrupt for a short, focused decision or task that must complete or be cancelled before returning. |
| Anatomy | Scrim · container (radius lg, elevation 5) · header (title heading + close icon button) · body (scrolls when content exceeds height) · footer (action group: secondary then primary; destructive confirm uses destructive primary). |
| Visual hierarchy | Title > body > primary action. |
| Variants | sm 25 rem (confirmations) · md 35 rem (default) · lg 50 rem (content-heavy); destructive confirmation (sm + destructive primary + Cancel). |
| States | **open**: Top layer, scrim, focus inside. <br>**long-content**: Max height = viewport − 48 px; header and footer fixed; body scrolls; header gains a divider when scrolled. <br>**busy**: Primary in loading state; Escape and close suppressed while an irreversible action is in flight. <br>**hover**: Not applicable <br>**focus-visible**: Standard ring on all controls. <br>**disabled**: Not applicable <br>**long-label**: Title wraps; footer buttons wrap/stack. <br>**narrow-width**: < 600 px: inset 16 px from each edge; footer buttons stacked full width in DOM order (secondary, primary); lg becomes full screen. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Form dialogs show field errors in the body. |
| Keyboard intent | Tab / Shift+Tab cycle within the dialog (native modal inertness). Escape = Cancel when dismissible. Enter submits only when focus is in a form field and the dialog is a form. |
| Focus intent | Entry: (a) first form field for form dialogs; (b) the Cancel (least-destructive) button for destructive confirmations; (c) the title (tabindex=-1) for informational/long-content dialogs. Return: to the invoking control; if it no longer exists, to the nearest region heading. |
| Semantics intent | Native <dialog> opened with showModal(); aria-labelledby = title id; aria-describedby = main message for confirmations; close button aria-label "Close". |
| Responsive behaviour | Size tokens clamp to viewport; narrow rules above. |
| Long-content behaviour | Proven (SCR-IB2-C06B). |
| RTL behaviour | Close at inline-end (left); footer order mirrors. |
| Density behaviour | Padding fixed (24 / 16 narrow) - dialogs are not density-scaled. |
| Token usage | --paep-color-surface-overlay, --paep-color-scrim, --paep-elevation-5, --paep-radius-lg, --paep-motion-duration-slow (enter), --paep-motion-easing-enter/exit |
| Prohibited usage | Nested dialogs; dialogs for non-blocking information; destructive confirmations with generic "OK"; auto-focusing the destructive button. |
| Accessibility notes | 2.4.3 focus order; 2.1.2 no keyboard trap (Escape/close available); 2.4.11 focus not obscured. |

### Drawer

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-drawer (native <dialog>, modal) |
| Requirements | REQ-IB2-CMP-01/02, RSP-01 |
| Specimen screens | SCR-IB2-C06D, SCR-IB2-R02 |
| Purpose | Show supplementary detail or a secondary task beside the current context without leaving it. |
| Anatomy | Scrim · sheet attached to the inline-end edge, full height (elevation 4, leading border) · header (title + close) · scrolling body · optional footer action group. |
| Visual hierarchy | As dialog. |
| Variants | side: end (DEFAULT) / start (only when the content relates to the start edge); width md 30 rem (default) / lg 40 rem. |
| States | **open**: Modal, focus inside. <br>**long-content**: Body scrolls; header/footer fixed. <br>**hover**: Not applicable <br>**focus-visible**: Standard. <br>**disabled**: Not applicable <br>**long-label**: Title wraps. <br>**narrow-width**: < 600 px: full width and full height; footer buttons stacked. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Form content errors in body. |
| Keyboard intent | As Dialog (Tab contained, Escape closes). |
| Focus intent | Entry: drawer title (tabindex=-1) or first field for forms. Return: invoker. |
| Semantics intent | Native modal <dialog> with aria-labelledby. Non-modal persistent side panels are shell patterns (IB3), not this component. |
| Responsive behaviour | Desktop 30/40 rem; tablet min(30 rem, 100vw − 48 px) leaves a visible strip of context; mobile full width. |
| Long-content behaviour | Proven. |
| RTL behaviour | end = left in RTL; slide direction mirrors; shadow is symmetric so needs no mirroring. |
| Density behaviour | Padding 20 / 16 narrow. |
| Token usage | --paep-elevation-4, --paep-color-surface-overlay, --paep-motion-duration-slow |
| Prohibited usage | Using the drawer as application navigation (IB3 shell); stacking drawers. |
| Accessibility notes | As Dialog. |

### Popover

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-popover (HTML popover attribute + anchor positioning with script fallback) |
| Requirements | REQ-IB2-RSP-02, CMP-02 |
| Specimen screens | SCR-IB2-C06E |
| Purpose | Show short, non-essential supplementary content or a small set of options anchored to a trigger (also the base of the action-group overflow menu). |
| Anatomy | Trigger button (aria-expanded) · panel (surface overlay, border subtle, radius md, elevation 3, max 20 rem) · optional arrow · content. |
| Visual hierarchy | Secondary to the page. |
| Variants | Informational (text) · Menu (used by Action group overflow). |
| States | **open**: Anchored below the trigger, aligned to its inline-start edge. <br>**flipped**: Opens above when space below < panel height; shifts inline to stay 16 px inside the viewport. <br>**narrow-width**: Panel width min(20 rem, 100vw − 32 px); still anchored; max-height with inner scroll. <br>**hover**: Hover never opens a popover. <br>**focus-visible**: On trigger and content controls. <br>**disabled**: Trigger disabled. <br>**loading**: Not applicable <br>**long-label**: Content wraps; max-height 60vh then scrolls. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | Enter/Space on trigger toggles; Escape closes and returns focus to trigger; Tab from the last element closes and continues in page order (non-modal). |
| Focus intent | Informational popover: focus stays on trigger (content referenced via aria-describedby when short) or moves to the panel if it contains interactive content. Menu variant: first item. |
| Semantics intent | Trigger aria-expanded + aria-controls; panel uses the popover attribute (light-dismiss "auto"); menu variant role="menu". |
| Responsive behaviour | See narrow width state. |
| Long-content behaviour | Inner scroll after 60vh. |
| RTL behaviour | "Align start" becomes right-aligned; arrow position mirrors. |
| Density behaviour | Padding fixed. |
| Token usage | --paep-elevation-3, --paep-radius-md, --paep-motion-duration-moderate |
| Prohibited usage | Hover-only or focus-only opening; essential information only reachable in a popover; forms inside popovers (use Dialog or Drawer). |
| Accessibility notes | 1.4.13 content on hover/focus not used; 2.1.1. |

## Navigation

### Tabs

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-tabs, paep-tab |
| Requirements | REQ-IB2-CMP-01/02, A11Y-02 |
| Specimen screens | SCR-IB2-C07, SCR-IB2-R01, SCR-IB2-R02, SCR-IB2-R03 |
| Purpose | Switch between peer views of the same object or region without navigation. |
| Anatomy | Tab list (bottom border subtle) · tabs (label, optional count badge) · selected indicator (3 px brand-primary bar at block-end) · scroll buttons at the edges when overflowing · tab panel. |
| Visual hierarchy | Selected tab: primary text, weight 600, indicator bar. Unselected: secondary text. |
| Variants | Default only (no pill/segmented variant in IB2). Activation: automatic (DEFAULT) or manual (opt-in). |
| States | **default**: Unselected. <br>**selected**: Indicator bar (shape cue) + weight + primary text; aria-selected. <br>**hover**: Neutral hover fill. <br>**focus-visible**: Inset focus ring (inside the tab so the list does not clip it). <br>**disabled**: Disabled text; aria-disabled; still reachable with arrows so it can be discovered; cannot activate; reason via aria-describedby. <br>**active/pressed**: Not applicable <br>**loading**: Panel content handles loading; tab itself unchanged. <br>**long-label**: Wraps within max 18 rem; no truncation. <br>**narrow-width**: List scrolls inside its own box (bounded inner scroll); selected tab scrolled into view; edge scroll buttons for pointer users. <br>**read-only**: Not applicable <br>**invalid**: Optional error icon + text count ("2 errors") inside the tab label - text, not colour. |
| Keyboard intent | Tab moves into the list to the selected tab; ArrowLeft/Right move between tabs (mirrored in RTL); Home/End first/last; automatic activation selects on arrow; manual activation requires Enter/Space; Tab moves into the panel. |
| Focus intent | Roving tabindex; panel tabindex=0 only if it has no focusable content. |
| Semantics intent | role=tablist (aria-label) / tab (aria-selected, aria-controls) / tabpanel (aria-labelledby). Scroll buttons are aria-hidden pointer affordances (keyboard users use arrows). |
| Responsive behaviour | Bounded scroll below available width; never wraps to multiple rows. |
| Long-content behaviour | ~2× label proven. |
| RTL behaviour | Order and arrow semantics mirror; scroll buttons swap edges. |
| Density behaviour | Tab height 44 / 36 px. |
| Token usage | --paep-color-selected-indicator, --paep-color-text-*, --paep-density-tab-height, --paep-color-border-subtle |
| Prohibited usage | Tabs as page navigation (use links); nested tabs; colour-only selection. |
| Accessibility notes | WAI-ARIA tabs pattern; 1.4.1; 2.4.7. |

### Breadcrumb

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-breadcrumb |
| Requirements | REQ-IB2-CMP-01, RSP-01, I18N-01 |
| Specimen screens | SCR-IB2-C07, SCR-IB2-R01, SCR-IB2-R02, SCR-IB2-R03 |
| Purpose | Show the location of the current page in a hierarchy and allow moving up. |
| Anatomy | <nav> · ordered list · ancestor links · separators (chevron-end, decorative, mirrored) · current page (text, weight 600, not a link) · "Show full path" button (text "…" with accessible name) when collapsed. |
| Visual hierarchy | Current page strongest; ancestors as links. |
| Variants | Full · Collapsed (first · … · parent · current). |
| States | **default**: All segments, wrapping onto lines when needed. <br>**collapsed**: When > 4 segments or container < 36 rem: first, "…", parent, current. <br>**expanded**: "…" activated: all segments shown inline, focus moves to the first revealed link. <br>**hover**: Link underline thickens. <br>**focus-visible**: Ring on links/button. <br>**disabled**: Not applicable <br>**selected**: Current page: aria-current="page". <br>**long-label**: Segments wrap (no truncation); each segment is one flex item that can break. <br>**narrow-width**: Collapsed variant; wraps as needed. <br>**read-only**: Not applicable <br>**invalid**: Not applicable <br>**loading**: Not applicable |
| Keyboard intent | Tab through links and the "…" button; Enter activates. |
| Focus intent | After expand: first revealed link. |
| Semantics intent | <nav aria-label="Breadcrumb"><ol>; current item aria-current="page"; separators are CSS masks (not read); "…" is <button aria-expanded="false" aria-label="Show full path">. |
| Responsive behaviour | Container-based collapse at 36 rem. |
| Long-content behaviour | Many long segments proven. |
| RTL behaviour | Reading order right→left; separators mirror. |
| Density behaviour | Unchanged. |
| Token usage | --paep-color-link, --paep-color-icon-default |
| Prohibited usage | Breadcrumb as the only navigation; truncating the current page title; making the current item a link. |
| Accessibility notes | aria-current; 2.4.8 location. |

## Structure

### Card

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-card |
| Requirements | REQ-IB2-TOK-04, CMP-01 |
| Specimen screens | SCR-IB2-C08, SCR-IB2-R01 |
| Purpose | Group a self-contained unit of related content (e.g. a summary) within a page or grid. |
| Anatomy | Container (surface, 1 px subtle border, radius md, elevation 1) · optional header (title heading, optional description, optional action group at inline-end) · body · optional footer (actions). |
| Visual hierarchy | Title > body > footer actions. |
| Variants | Default (level 1). Raised (level 2) is DEFINED as a token but NOT used by any IB2 component: no controlled use case justifies it yet. |
| States | **default**: As anatomy. <br>**with header**: Title + actions. <br>**with actions**: Header action group wraps under the title below 30 rem. <br>**long title**: Two-line (or longer) titles wrap; actions wrap beneath. <br>**long content**: Body grows; no inner scroll. <br>**hover**: Not applicable (cards are not interactive in IB2). <br>**focus-visible**: On contained controls only. <br>**disabled**: Not applicable <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable <br>**narrow-width**: Full width; padding 16 px. |
| Keyboard intent | None of its own. |
| Focus intent | None. |
| Semantics intent | <section> with aria-labelledby when it has a title, or <article> for standalone items; heading level configurable. |
| Responsive behaviour | Container query for header layout. |
| Long-content behaviour | Proven. |
| RTL behaviour | Header actions at inline-end (left). |
| Density behaviour | Padding 20 / 16 px. |
| Token usage | --paep-color-surface, --paep-color-border-subtle, --paep-radius-md, --paep-density-card-padding |
| Prohibited usage | Whole-card click targets; decorative shadows; nesting cards in cards. |
| Accessibility notes | Landmark-free grouping with heading structure. |

### Panel

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: paep-panel |
| Requirements | REQ-IB2-TOK-04, CMP-01 |
| Specimen screens | SCR-IB2-C08 |
| Purpose | Divide a page into titled sections, optionally collapsible for progressive disclosure of long forms (PAEP §6.2). |
| Anatomy | Container (surface, border subtle, radius md) · header bar on subtle surface (title or toggle button with chevron, optional actions) · body. |
| Visual hierarchy | Header > body. |
| Variants | Static · Collapsible (justified by PAEP §6.2 progressive disclosure; default expanded; state is not persisted by the component). |
| States | **default**: Expanded. <br>**collapsed**: Body hidden; chevron rotated to point at inline-end. <br>**with actions**: Actions wrap under the title at narrow widths. <br>**long title**: Wraps. <br>**long content**: Body grows. <br>**hover**: Toggle button hover (collapsible only). <br>**focus-visible**: Ring on toggle. <br>**disabled**: Not applicable <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Optional "Contains 2 errors" text in the header when collapsed content has errors. <br>**narrow-width**: Full width. |
| Keyboard intent | Collapsible: Enter/Space on the toggle. |
| Focus intent | Stays on toggle. |
| Semantics intent | <section aria-labelledby>; collapsible: heading containing <button aria-expanded aria-controls>; collapsed body uses hidden. |
| Responsive behaviour | As Card. |
| Long-content behaviour | Proven. |
| RTL behaviour | Chevron rotation mirrors. |
| Density behaviour | Header padding 12 × 20/16; body 20 / 16. |
| Token usage | --paep-color-surface-subtle (header), --paep-color-border-subtle |
| Prohibited usage | Accordion-style mutually exclusive panels (not in IB2); collapsing required errors out of sight without a header message. |
| Accessibility notes | Disclosure pattern. |

### Divider

| Field | Specification |
| --- | --- |
| Production target | @proseit/paep-components: hr[paepDivider], paep-divider[vertical] |
| Requirements | REQ-IB2-CMP-01 |
| Specimen screens | SCR-IB2-C08 |
| Purpose | Separate groups of content when spacing alone is insufficient. |
| Anatomy | 1 px line in border-subtle. |
| Visual hierarchy | Lowest. |
| Variants | horizontal (full, inset) · vertical. |
| States | **default**: Only state. <br>**hover**: Not applicable <br>**focus-visible**: Not applicable <br>**disabled**: Not applicable <br>**loading**: Not applicable <br>**long-label**: Not applicable <br>**narrow-width**: Vertical dividers inside wrapping rows are hidden when items wrap. <br>**selected**: Not applicable <br>**read-only**: Not applicable <br>**invalid**: Not applicable |
| Keyboard intent | None. |
| Focus intent | None. |
| Semantics intent | Horizontal: <hr> (thematic break) or aria-hidden when purely visual; vertical: role="separator" aria-orientation="vertical" only when it separates groups meaningfully, otherwise aria-hidden. |
| Responsive behaviour | See narrow. |
| Long-content behaviour | Not applicable |
| RTL behaviour | Logical margins. |
| Density behaviour | Margin 16 / 12 px. |
| Token usage | --paep-color-border-subtle, --paep-space-4 |
| Prohibited usage | Using dividers to fake table rows; heavy or coloured dividers. |
| Accessibility notes | Decorative contrast exempt. |
