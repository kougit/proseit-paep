# DWP-IB2-001 component specifications (single source for component-specs.md, component-map.md and UI-lab specimen notes).
NA='Not applicable'
C=[]
def comp(**k): C.append(k)

# ---------------- ACTIONS ----------------
comp(id='button',name='Button',family='Actions',target='@proseit/paep-components: button[paepButton], a[paepButton]',screens=['SCR-IB2-C01','SCR-IB2-R01','SCR-IB2-R03'],reqs='REQ-IB2-CMP-01/02, A11Y-02/03, RSP-04',
 purpose='Trigger a single task action. The visible label names the outcome ("Save changes", "Delete supplier").',
 anatomy='Container (min-height = density control height) · optional leading icon (16/20 px) · label (always visible text, weight 600) · busy indicator replaces the leading icon while loading.',
 hierarchy='One primary per region. Secondary for alternative actions; tertiary for low-emphasis actions inside content; destructive only for irreversible or data-removing actions.',
 variants='primary (brand-primary navy fill) · secondary (surface fill + 1 px default border) · tertiary (no container until hover, brand-primary text) · destructive (protected error-strong fill; label must name the destructive outcome). Size is set by density, not by a size variant. Full-width ("block") is a layout option at narrow widths.',
 states={'default':'As variant.','hover':'primary-hover / neutral hover fill; tertiary gains underline. Pointer only; never carries essential information.','focus-visible':'2 px focus ring, 2 px offset, white halo in the gap.','active/pressed':'One step darker than hover.','disabled':'Disabled fill + dashed disabled border (non-colour cue) + disabled text; native disabled; an adjacent reason text is recommended when the cause is not obvious.','loading':'Spinner replaces leading icon, label stays (may change to a progressive label such as "Saving…"), width locked, aria-busy="true" + aria-disabled="true"; remains focusable; activation suppressed.','long-label':'Wraps onto more lines; never truncated; min-height grows.','narrow-width':'Inside an action group below 30 rem the primary button stretches to fill the row.','selected':NA+' (use tabs, checkbox or radio for selection).','read-only':NA,'invalid':NA},
 keyboard='Enter and Space activate (native <button>). A link-styled-as-button (<a paepButton>) activates with Enter only and must navigate, not perform an in-page action.',
 focus='Focus stays on the button after activation unless the action opens an overlay or navigates. While loading, focus stays on the busy button.',
 semantics='Native <button type="button|submit">. aria-busy while loading; aria-disabled keeps it focusable while loading; native disabled otherwise. Icon inside is aria-hidden.',
 responsive='Intrinsic width at wide sizes; full width when it is the primary action of a narrow action group or a narrow dialog footer.',
 long_content='Labels ~2× English length wrap; height grows; icon stays aligned to the first line.',
 rtl='Leading icon moves to the inline-start (right). Directional icons mirror.',
 density='Comfortable 40 px / compact 32 px min-height; compact falls back to 40 px under (pointer: coarse).',
 tokens='--paep-brand-primary*, --paep-brand-on-primary, --paep-color-status-error-strong, --paep-color-border-default, --paep-color-disabled-*, --paep-density-control-height, --paep-density-button-padding-inline, --paep-radius-sm, --paep-motion-duration-fast',
 prohibited='Icon-only primary actions; colour as the only destructive signal ("OK" in red); more than one primary per region; truncating labels; disabling without any available explanation of why in critical flows; implying that hiding/disabling is the authorisation control.',
 a11y='WCAG 2.5.8 target size met in both densities; 2.4.7 focus visible; 1.4.11 non-text contrast for the secondary border (4.81:1); 4.1.2 name from visible text; 2.5.3 label in name for any aria-label.')

comp(id='icon-button',name='Icon button',family='Actions',target='@proseit/paep-components: button[paepIconButton]',screens=['SCR-IB2-C01'],reqs='REQ-IB2-CMP-01/02, TOK-09, A11Y-02',
 purpose='Compact action whose meaning is conventional and unambiguous (close, more actions, previous/next page, collapse).',
 anatomy='Square container (control height × control height) · single icon (20 px comfortable, 16 px compact) · required accessible name.',
 hierarchy='Low emphasis (secondary or tertiary styling). Never the only primary action of a region.',
 variants='secondary (bordered) · tertiary (borderless). No primary or destructive icon-only variant.',
 states={'default':'As variant.','hover':'Neutral hover fill.','focus-visible':'Standard focus ring.','active/pressed':'Neutral active fill.','disabled':'Dashed disabled border / disabled icon colour.','loading':'Spinner replaces icon; aria-busy; activation suppressed.','long-label':NA+' (no visible label; long accessible names are allowed).','narrow-width':'Unchanged; never shrinks below target size.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='Enter / Space.',focus='As button.',
 semantics='<button aria-label="…"> (label input is mandatory in the API). No tooltip dependency: IB2 has no tooltip component, so meaning must not rely on hover text or the title attribute.',
 responsive='Unchanged across profiles.',long_content='Accessible name only; no visual text.',
 rtl='Directional icons (chevron-start/end, page-first/last) mirror; non-directional icons do not.',
 density='40 × 40 comfortable, 32 × 32 compact (≥ 24 × 24 minimum).',
 tokens='as Button + --paep-size-icon-*',
 prohibited='Uncommon or domain-specific actions as icon-only; relying on title/tooltip for the name; destructive icon-only buttons.',
 a11y='4.1.2 name via aria-label; 1.1.1 icon aria-hidden; 2.5.8 target size.')

comp(id='action-group',name='Action group',family='Actions',target='@proseit/paep-components: paep-action-group',screens=['SCR-IB2-C01','SCR-IB2-R03'],reqs='REQ-IB2-RSP-02/04, CMP-01/02, SEC-01',
 purpose='Lay out the related actions of a page, card, panel, dialog or table toolbar with stable primary placement and responsive overflow.',
 anatomy='Group container (role=group, aria-label) · primary action (always visible; placed at the inline-end at wide widths; at narrow widths it fills the row and the More button sits after it at the inline-end) · secondary actions · optional separator · destructive actions (after separator) · "More" overflow button (visible text "More" + icon) · overflow menu (Popover-based) listing moved actions in the same order, destructive last after a divider.',
 hierarchy='Primary at inline-end; secondary before it; destructive separated from the rest.',
 variants='Page/toolbar group (wraps at medium widths) · Footer group (dialog/drawer: stacked full width at narrow). Items declare priority: primary | secondary | destructive.',
 states={'default':'All actions shown (wide).','hover':'Per item.','focus-visible':'Per item and on the More button.','active/pressed':'Per item.','disabled':'Disabled item stays in its position (and in the overflow menu, marked disabled with aria-disabled).','loading':'The busy item follows Button loading; other items remain available unless the action is exclusive.','long-label':'Items wrap to a new row before any item overflows at medium widths.','narrow-width':'Container < 30 rem: primary stays visible and stretches; secondary + destructive move to "More" at the inline-end.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='Tab moves between visible items. More button: Enter/Space/ArrowDown opens the menu and focuses the first item; ArrowUp opens and focuses the last; ArrowUp/ArrowDown move, Home/End jump; Enter/Space activates; Escape closes and returns focus to More; Tab closes the menu and continues.',
 focus='After a menu item runs, focus returns to More (or to the overlay the item opened).',
 semantics='role="group" + aria-label; More = <button aria-haspopup="menu" aria-expanded>; menu = role="menu" with role="menuitem" native buttons; destructive item text carries the outcome; the overflow menu is part of this component, not a new public component.',
 responsive='Container-query driven (≥ 30 rem: all visible, wrapping allowed; < 30 rem: primary + More). Deterministic by rule, not by measurement.',
 long_content='Labels wrap inside buttons; rows wrap; nothing is truncated.',
 rtl='Order mirrors automatically (logical flex order); More menu opens aligned to the inline-end.',
 density='Inherits button density; gap space-2.',
 tokens='--paep-space-2, --paep-color-border-subtle (separator), --paep-elevation-3 (menu)',
 prohibited='Moving the primary action into overflow; hover-to-reveal actions; icon-only More without accessible name; hiding a destructive action\'s explicit text inside overflow.',
 a11y='REQ-IB2-RSP-02 hover never required; menu button pattern; focus return; 1.3.2 visual order equals DOM order.')

# ---------------- FORMS ----------------
comp(id='field',name='Field wrapper',family='Forms',target='@proseit/paep-components: paep-field',screens=['SCR-IB2-C02','SCR-IB2-R01','SCR-IB2-R02'],reqs='REQ-IB2-CMP-02, A11Y-02/03, I18N-01',
 purpose='Give every form control a visible label, required indication, help and error text, and wire them programmatically to the control.',
 anatomy='Label (above control, weight 600) · required marker "*" (aria-hidden; control carries required) or "(optional)" meta text · help text (below label, above control) · control slot (Input, Select, Textarea) with optional prefix/suffix adornments · error message (below control: error icon + text, weight 600) · optional dirty indicator text "Unsaved change" in the meta slot.',
 hierarchy='Label > control value > error > help.',
 variants='Default (stacked). Inline (label beside control) is NOT provided in IB2 — stacked survives translation, zoom and 320 px.',
 states={'default':'Label, optional help, control.','hover':'Control border strengthens.','focus-visible':'Focus ring around the control box (focus-within).','active/pressed':NA,'disabled':'Label in secondary colour; control dashed disabled border; reason text via help.','read-only':'Control dashed read-only border on read-only surface; value keeps full text contrast; remains focusable and copyable.','invalid':'2 px error border (thickness change is the non-colour cue) + error icon + message; aria-invalid="true".','loading':NA+' (async validation messaging belongs to the consuming form).','long-label':'Label, help and error wrap to three or more lines; never truncated.','narrow-width':'Full container width; unchanged anatomy.','selected':NA,'dirty':'Optional meta text "Unsaved change" (text, not colour).'},
 keyboard='No own keys; focus goes directly to the control.',focus='Clicking the label focuses the control.',
 semantics='<label for>, control aria-describedby="error-id help-id" (error first), aria-invalid, required/aria-required; error region is not a live region by default (form-level summary announces on submit).',
 responsive='Max inline size 40 rem (form max); full width below.',long_content='Three-line label/help/error proven in SCR-IB2-R01.',
 rtl='Label, help and error align to the inline-start; prefix/suffix swap sides via logical properties.',
 density='Gap 4 px between parts in both densities; control height by density.',
 tokens='--paep-font-size-label, --paep-color-text-secondary, --paep-color-status-error-fg, --paep-color-invalid-border, --paep-color-readonly-*, --paep-layout-form-max',
 prohibited='Placeholder as label; colour-only errors; floating labels; hiding help in a tooltip; error text without a programmatic association.',
 a11y='1.3.1, 3.3.1 error identification, 3.3.2 labels, 4.1.2; errors never colour-only (REQ-IB2-A11Y-03).')

comp(id='input',name='Input',family='Forms',target='@proseit/paep-components: input[paepInput]',screens=['SCR-IB2-C02'],reqs='REQ-IB2-CMP-02, A11Y-02',
 purpose='Single-line text, number-like and identifier entry using the native input element.',
 anatomy='Control box (1 px default border, radius sm) · optional prefix/suffix adornment (sunken surface, e.g. currency code or unit) · native input.',
 hierarchy='Value text primary; placeholder secondary and only an example format.',
 variants='Plain · with prefix · with suffix · with both. Types follow native (text, email, tel, search, number with inputmode).',
 states={'default':'Empty or filled.','hover':'Border strong.','focus-visible':'Focus ring on control box.','active/pressed':NA,'disabled':'Dashed disabled border, disabled fill.','read-only':'Dashed read-only border, value at full contrast.','invalid':'2 px error border via field wrapper.','loading':NA,'long-label':'Handled by field wrapper.','narrow-width':'Full width; adornments keep nowrap and the input shrinks.','selected':NA},
 keyboard='Native.',focus='Native.',semantics='Native input; adornment text is referenced by aria-describedby so units are announced.',
 responsive='Fluid.',long_content='Long values scroll within the input natively; long IDs displayed read-only wrap.',
 rtl='Text direction follows content; use dir="auto" for mixed-direction values; LTR-only values (IDs, URLs, emails) set dir="ltr".',
 density='40 / 32 px; padding-inline 12 / 8 px.',
 tokens='--paep-color-surface, --paep-color-border-default/strong, --paep-color-text-placeholder, --paep-density-control-*',
 prohibited='Placeholder-only labelling; custom-drawn caret or selection; locale-specific number formatting baked into the component (belongs to i18n).',
 a11y='Native semantics; placeholder contrast 6.68:1 but still never a label.')

comp(id='select',name='Native select',family='Forms',target='@proseit/paep-components: select[paepSelect]',screens=['SCR-IB2-C02'],reqs='REQ-IB2-CMP-02',
 purpose='Choose one option from a short, known list using the platform picker.',
 anatomy='Control box · native select (appearance none) · chevron-down icon at inline-end (decorative) · platform option list.',
 hierarchy='As Input.',variants='Single select only. Multi-select, search and custom listbox are out of IB2 scope.',
 states={'default':'Shows selected option or a first "Choose…" option.','hover':'Border strong.','focus-visible':'Focus ring.','active/pressed':'Platform popup open (rendered by the operating system).','disabled':'As Input.','read-only':'Rendered as read-only text in a read-only control box (native select has no readonly).','invalid':'As Input.','loading':NA,'long-label':'Selected text truncates visually inside the closed control only (full text in the platform list and accessible name); labels wrap.','narrow-width':'Full width.','selected':'Platform-rendered.'},
 keyboard='Native (Alt+ArrowDown / Space opens; arrows change).',focus='Native.',semantics='Native <select>.',
 responsive='Fluid.',long_content='Closed-state truncation is the one permitted truncation because the platform list shows the full option.',
 rtl='Chevron moves to inline-end (left) automatically.',density='As Input.',tokens='as Input + --paep-color-icon-default',
 prohibited='Custom-drawn option lists in IB2; hiding the chevron.',a11y='Native semantics; label via field wrapper.')

comp(id='textarea',name='Textarea',family='Forms',target='@proseit/paep-components: textarea[paepInput]',screens=['SCR-IB2-C02'],reqs='REQ-IB2-CMP-02',
 purpose='Multi-line free text such as notes and reasons.',anatomy='Control box · native textarea (min 3 lines, vertical resize) · optional character count in the field meta slot.',
 hierarchy='As Input.',variants='Default only. Auto-grow is not in IB2.',
 states={'default':'Empty or filled.','hover':'Border strong.','focus-visible':'Focus ring.','active/pressed':NA,'disabled':'As Input.','read-only':'As Input; text fully visible, wraps.','invalid':'As Input.','loading':NA,'long-label':'As field wrapper.','narrow-width':'Full width.','selected':NA},
 keyboard='Native; Tab leaves the textarea.',focus='Native.',semantics='Native <textarea>; character count (if shown) referenced via aria-describedby and announced politely only when the limit is near.',
 responsive='Fluid.',long_content='Vertical scroll inside the control; user-resizable vertically.',rtl='dir="auto" recommended.',density='Min-height 5.5 rem both densities.',
 tokens='as Input',prohibited='Horizontal resize; hard character truncation without a message.',a11y='Native.')

comp(id='checkbox',name='Checkbox',family='Forms',target='@proseit/paep-components: input[type=checkbox][paepCheckbox]',screens=['SCR-IB2-C02'],reqs='REQ-IB2-CMP-02, A11Y-03/04',
 purpose='Toggle an independent option, or agree to a statement.',anatomy='Box 18 px (16 compact) · check or dash glyph · label text (clickable; hit area ≥ 24 px tall).',
 hierarchy='Label text is primary.',variants='Single · group inside a fieldset with legend.',
 states={'default':'Unchecked.','checked':'Brand-primary fill + check glyph (shape cue).','indeterminate':'Brand-primary fill + dash glyph (distinct shape).','hover':'Border strong.','focus-visible':'Ring around the box.','active/pressed':NA,'disabled':'Dashed disabled border; checked disabled uses solid disabled fill.','read-only':'Dashed read-only border; checked shows secondary-text fill; not toggleable (implemented as aria-readonly on a click-cancelled input, value still submitted).','invalid':'2 px error border + field error message.','loading':NA,'long-label':'Label wraps; box aligns with first line.','narrow-width':'Unchanged.','selected':'= checked.'},
 keyboard='Space toggles.',focus='Native.',semantics='Native checkbox; indeterminate via the DOM property; group via fieldset/legend.',
 responsive='Unchanged.',long_content='Multi-line label proven.',rtl='Box at inline-start (right).',density='18 / 16 px box; row min-height 24 px.',
 tokens='--paep-brand-primary, --paep-brand-on-primary, --paep-color-border-default, --paep-radius-xs, --paep-density-choice-size',
 prohibited='Toggle switches styled from checkboxes (not in IB2); colour-only checked state.',a11y='Box border 4.81:1; checked fill 12.32:1; 2.5.8 via label hit area.')

comp(id='radio-group',name='Radio group',family='Forms',target='@proseit/paep-components: paep-radio-group + input[type=radio][paepRadio]',screens=['SCR-IB2-C02','SCR-IB2-R02'],reqs='REQ-IB2-CMP-02, A11Y-03',
 purpose='Choose exactly one of a small set of mutually exclusive options that should stay visible.',anatomy='Fieldset · legend (label style) · optional help · options (18 px circle + label) · group error.',
 hierarchy='Legend > options.',variants='Vertical (default). Horizontal only for ≤ 3 short options and wraps.',
 states={'default':'None selected or one selected.','selected':'Brand-primary 2 px ring + inner dot (shape cue).','hover':'Border strong.','focus-visible':'Ring around the focused option\'s circle.','active/pressed':NA,'disabled':'Group or single option disabled (dashed).','read-only':'Dashed read-only style; selection shown with secondary-text dot.','invalid':'Group error text under legend region; each circle 2 px error border.','loading':NA,'long-label':'Option labels wrap.','narrow-width':'Horizontal layout collapses to vertical.'},
 keyboard='Tab enters the group at the selected (or first) option; arrow keys move and select; Tab leaves the group.',focus='Native roving behaviour.',
 semantics='<fieldset><legend>; native radios sharing a name; aria-describedby on fieldset for help/error; aria-invalid on inputs.',
 responsive='Vertical at narrow widths.',long_content='Proven.',rtl='Circle at inline-start; ArrowLeft/Right follow native RTL behaviour.',density='As Checkbox.',
 tokens='as Checkbox',prohibited='Radio groups without a legend; using radios for > 7 options (use Native select).',a11y='1.3.1 group labelling; 3.3.1.')

# ---------------- DATA ----------------
comp(id='table-shell',name='Table shell',family='Data',target='@proseit/paep-components: paep-table',screens=['SCR-IB2-C03','SCR-IB2-C03N','SCR-IB2-R01','SCR-IB2-R03'],reqs='REQ-IB2-RSP-03, CMP-01/02, A11Y-02',
 purpose='Present a bounded, backend-neutral set of rows with a caption, column headers and complete state handling.',
 anatomy='Shell container (surface, border subtle, radius md) · header region (title/caption, count, optional action group) · native table (thead on subtle surface, body rows, row-detail rows) · per-row "Details" disclosure button (appears when columns are hidden) · state region (loading skeleton rows, empty state, no-results state, error alert with Retry) · footer region (pagination slot).',
 hierarchy='Key column and status column are priority 1; the key cell may carry a secondary line (e.g. the record name with its identifier beneath) so a single column identifies the row at 320 px; other columns are declared priority 2 or 3 by the consumer.',
 variants='Standard (priority columns + row detail, PRIMARY) · Bounded inner scroll (FALLBACK, only for genuinely two-dimensional comparison, with sticky first column).',
 states={'loading':'Skeleton rows (count = expected page size, max 10) in the body; header retained; aria-busy on the table region; polite "Loading records" message.','empty':'Empty state (tray icon, "No records yet", optional create action).','filtered/no-results':'No-results state (search-with-cross icon, "No records match the current filters", Clear filters action) - distinct icon and text from empty.','populated':'Rows.','error':'Error alert inside the shell with Retry (tertiary) and a reference slot; last good data is not shown as current.','hover':'Row hover NOT used (rows are not interactive in IB2).','focus-visible':'On Details buttons and links inside cells; the inner-scroll fallback region is focusable (tabindex=0) for keyboard scrolling.','disabled':NA,'selected':NA+' (row selection is out of IB2 scope).','read-only':'The shell is read-only by nature.','invalid':NA,'long-label':'Headers wrap only when necessary (nowrap by default, wrap below 40 rem); unbroken IDs and URLs break anywhere; never truncated without the full text available.','narrow-width':'See responsive rules (priority columns + row detail).'},
 keyboard='Tab reaches interactive content only (links, Details buttons, actions). Details: Enter/Space toggles the detail row. Inner-scroll fallback: the region is a tab stop; arrow keys scroll it.',
 focus='Toggling Details keeps focus on the button; Retry moves focus to the table caption after reload.',
 semantics='Native <table> with <caption>, <th scope="col">; key cell may be <th scope="row">; Details button aria-expanded + aria-controls pointing to the detail row; detail row uses a <dl> repeating the hidden column headers as <dt>; state messages via a polite live region; fallback scroll region role="region" + aria-label + tabindex=0.',
 responsive='Container-query based: ≥ 60 rem all columns; < 60 rem priority-3 columns move to row detail; < 40 rem priority-2 columns also move; the key column and status never hide. No page-wide horizontal scroll.',
 long_content='Wrapping IDs/URLs; long status badge wraps; long header wraps below 40 rem.',
 rtl='Column order mirrors (native table direction); numeric columns align to the inline-end; IDs keep dir="ltr".',
 density='Row min-height 48 / 36 px; cell padding 12×16 / 6×12 px. Compact recommended for desktop data-heavy screens.',
 tokens='--paep-color-surface(-subtle), --paep-color-border-subtle, --paep-density-row-height, --paep-density-cell-padding-*, --paep-font-family-mono, --paep-font-size-body-sm',
 prohibited='Page-wide horizontal scroll; hidden columns without row detail; card transformation that drops header association; sort/filter/selection UI (out of scope); backend calls or domain types in the shell.',
 a11y='1.3.1 table semantics; 1.4.10 reflow at 320 px; 4.1.3 status messages; 2.1.1 keyboard for scroll fallback.')

comp(id='list',name='List',family='Data',target='@proseit/paep-components: paep-list',screens=['SCR-IB2-C04'],reqs='REQ-IB2-CMP-02',
 purpose='Show a vertical collection of items where column comparison is not needed.',anatomy='List container · item: optional leading icon · primary text (may contain a link) · secondary text · trailing meta (badge/number) · optional per-item action (tertiary button).',
 hierarchy='Primary text > meta > secondary.',variants='Plain · with meta · with action.',
 states={'loading':'Skeleton items.','empty':'Empty state.','filtered/no-results':'No-results state.','populated':'Items.','error':'Error alert with Retry.','hover':'Not used (items not interactive).','focus-visible':'On links/actions inside items.','disabled':NA,'selected':NA,'read-only':NA,'invalid':NA,'long-label':'Primary and secondary text wrap; trailing meta max 45% width, wraps.','narrow-width':'Trailing meta moves below the text under 20 rem.'},
 keyboard='Tab to links/actions only.',focus='As content.',semantics='<ul>/<li>; state messages via polite live region.',
 responsive='Fluid.',long_content='Proven with long IDs.',rtl='Leading icon and meta mirror.',density='Item min-height 48 / 36 px.',
 tokens='--paep-density-list-item-min-height, --paep-color-border-subtle',prohibited='Using List as a navigation menu or selectable listbox in IB2.',a11y='Native list semantics.')

comp(id='pagination',name='Pagination',family='Data',target='@proseit/paep-components: paep-pagination',screens=['SCR-IB2-C04','SCR-IB2-R02','SCR-IB2-R03'],reqs='REQ-IB2-CMP-01, RSP-01',
 purpose='Move between pages of a bounded, server- or input-paged collection.',
 anatomy='<nav> · Previous (icon + text) · page numbers with gaps (first, current ± 1, last) · Next · summary "Page 8 of 20" · narrow status "8 / 20".',
 hierarchy='Current page most prominent (selected fill + 2 px indicator border + bold).',variants='Full (≥ 36 rem container) · Compact (< 36 rem: Previous / "Page 8 of 20" / Next, icon buttons with names).',
 states={'default':'Middle page.','first page':'Previous disabled (aria-disabled, not removed).','last page':'Next disabled.','hover':'Neutral hover on page links.','focus-visible':'Ring on each link.','active/pressed':'Neutral active.','selected':'Current page: aria-current="page", selected fill, indicator border, bold.','disabled':'Prev/Next at the ends.','loading':NA+' (the paged content shows loading).','read-only':NA,'invalid':NA,'long-label':'Previous/Next text wraps; numbers never wrap.','narrow-width':'Compact variant.'},
 keyboard='Tab between links; Enter activates.',focus='After page change, focus moves to the paged region\'s caption/heading so the new content is announced.',
 semantics='<nav aria-label="Pagination">, list of links, aria-current="page"; disabled ends use aria-disabled + no href; compact status is visible text.',
 responsive='Container-query switch at 36 rem.',long_content='Translated "Previous"/"Next" wrap.',rtl='Previous at inline-start (right); chevrons mirror; numbers stay LTR digits unless locale formats differ (i18n).',
 density='Targets 40 / 32 px.',tokens='--paep-color-selected-*, --paep-density-control-height',prohibited='Colour-only current page; removing Prev/Next at ends (layout shift).',a11y='aria-current; 2.5.8.')

comp(id='empty-state',name='Empty state',family='Data',target='@proseit/paep-components: paep-empty-state',screens=['SCR-IB2-C04','SCR-IB2-C03'],reqs='IR-01 §6.5(ii), CMP-02',
 purpose='Explain why a collection has nothing to show and what to do next.',anatomy='Decorative icon (32 px) · heading (level set by input) · description · optional action (button).',
 hierarchy='Heading > description > action.',variants='empty (tray icon, "No … yet") · no-results (search-with-cross icon, "No … match the current filters", Clear filters). The two differ in icon, heading and action text.',
 states={'default':'As variant.','hover':NA,'focus-visible':'On the action.','disabled':'Action may be disabled with reason text (e.g. no permission) - never implying client authority.','loading':NA,'long-label':'Wraps, max 36 rem measure.','narrow-width':'Unchanged; centred stack.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='None of its own.',focus='Not moved automatically.',semantics='Heading element with configurable level; icon aria-hidden; announced via the host collection\'s live region when it replaces content.',
 responsive='Padding reduces at narrow.',long_content='Proven.',rtl='Centred; no mirroring needed.',density='Unchanged.',tokens='--paep-color-text-secondary, --paep-color-icon-default, --paep-space-7',
 prohibited='Using illustrations or marketing imagery; identical wording for empty and no-results.',a11y='Text carries meaning; icon decorative.')

# ---------------- FEEDBACK ----------------
comp(id='alert',name='Alert',family='Feedback',target='@proseit/paep-components: paep-alert',screens=['SCR-IB2-C05','SCR-IB2-R01','SCR-IB2-R03'],reqs='REQ-IB2-A11Y-03, TOK-01, CMP-02',
 purpose='Persistent inline feedback about a region or the page.',anatomy='Container (status tint + status border) · status icon (distinct shape per status) · visually hidden status word ("Error:") · optional title · body text · optional actions (tertiary/secondary buttons) · optional dismiss icon button.',
 hierarchy='Title > body > actions.',variants='info · success · warning · error; persistent (default) or dismissible (info/success/warning only).',
 states={'default':'As status.','hover':NA,'focus-visible':'On actions and dismiss.','disabled':NA,'loading':NA,'long-label':'Long body wraps; very long content stays inline (no inner scroll) - it is page content.','narrow-width':'Icon + text column; actions wrap under the body.','dismissed':'Removed; focus moves to the next logical element (region heading).','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='Tab to actions / dismiss; Enter/Space.',focus='Not auto-focused, except an error summary alert after a failed submit which receives focus (tabindex=-1).',
 semantics='Persistent alert present at load: no live role (static content). Inserted dynamically: role="alert" for error, role="status" for info/success/warning. Transient announcements (e.g. "Saved") use a visually hidden platform live region, not an Alert; a Toast component is outside the IB2 tranche.',
 responsive='Full width of its container.',long_content='Proven (SCR-IB2-R01).',rtl='Icon at inline-start; dismiss at inline-end.',density='Padding 12×16 both densities.',
 tokens='--paep-color-status-{info,success,warning,error}-{fg,bg,border} (PROTECTED)',
 prohibited='Colour-only status; dismissible error alerts tied to unresolved errors; using Alert for transient confirmation; brand colours for status.',
 a11y='1.4.1 (icon shape + text + hidden status word); 4.1.3 status messages.')

comp(id='status-badge',name='Status badge',family='Feedback',target='@proseit/paep-components: paep-status-badge',screens=['SCR-IB2-C05','SCR-IB2-R01'],reqs='REQ-IB2-A11Y-03, TOK-01',
 purpose='Label the state of an item (e.g. in a table cell or card header).',anatomy='Inline container (status tint, 1 px status border, radius sm) · status icon 14 px · text (always present).',
 hierarchy='Secondary to the item it labels.',variants='neutral · info · success · warning · error. The consumer maps domain states to one of these tones; the text is domain-provided.',
 states={'default':'As tone.','hover':NA+' (not interactive).','focus-visible':NA,'disabled':NA,'loading':NA,'long-label':'Wraps (no truncation); icon stays on the first line.','narrow-width':'Wraps within the cell.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='None.',focus='Not focusable.',semantics='Plain text inside <span>; icon aria-hidden; no role.',responsive='Inline.',long_content='Proven.',rtl='Icon at inline-start.',density='Unchanged.',
 tokens='status tokens (PROTECTED), --paep-font-size-body-sm, --paep-radius-sm',prohibited='Colour dot without text; interactive badges; brand-coloured status.',a11y='1.4.1; text contrast ≥ 5.66:1.')

comp(id='progress',name='Progress',family='Feedback',target='@proseit/paep-components: paep-progress',screens=['SCR-IB2-C05','SCR-IB2-F05'],reqs='REQ-IB2-TOK-05, CMP-02',
 purpose='Show progress of a long-running operation.',anatomy='Label · value text ("45%", or "Step 3 of 7") · track (8 px, neutral-200) · fill (brand-primary).',
 hierarchy='Label and value text carry meaning; the bar reinforces.',variants='determinate · indeterminate.',
 states={'determinate':'Fill width = value; value text always visible.','indeterminate':'35% segment travels along the track (1.8 s loop).','reduced-motion':'Indeterminate becomes a static full-width hatched fill + "In progress" text; determinate changes without transition.','complete':'Consumer replaces with a success alert or status text.','hover':NA,'focus-visible':NA,'disabled':NA,'loading':'= indeterminate.','long-label':'Label wraps; value text moves below.','narrow-width':'Unchanged.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='None.',focus='Not focusable.',semantics='Native <progress> (value/max; no value = indeterminate) with <label>; completion announced by the consumer via a status message.',
 responsive='Fluid.',long_content='Proven.',rtl='Fill grows from inline-start (right); indeterminate travels right→left.',density='Unchanged.',
 tokens='--paep-brand-primary (gated 8.67:1 vs track), --paep-ref-color-neutral-200, --paep-motion-loop-indeterminate',prohibited='Percentage without label; infinite decorative animation under reduced motion.',a11y='2.2.2 pause/stop via reduced motion; 1.4.11 fill vs track 8.67:1.')

comp(id='skeleton',name='Skeleton',family='Feedback',target='@proseit/paep-components: paep-skeleton',screens=['SCR-IB2-C05','SCR-IB2-F05'],reqs='REQ-IB2-TOK-05',
 purpose='Reserve layout and signal loading for content with a known shape.',anatomy='Blocks (text lines, 14 px tall, radius sm; last line 60% width) in neutral-100.',
 hierarchy='Decorative.',variants='text lines · table rows (inside Table shell) · list items.',
 states={'loading':'Blocks pulse opacity 1 → 0.5 (1.6 s, alternate).','reduced-motion':'Static blocks, no pulse.','hover':NA,'focus-visible':NA,'disabled':NA,'long-label':NA,'narrow-width':'Blocks are fluid.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='None.',focus='None.',semantics='aria-hidden="true"; the host region sets aria-busy="true" and provides a visually hidden "Loading…" text.',
 responsive='Fluid.',long_content=NA,rtl='Short last line aligns to inline-start.',density='Row heights follow density.',
 tokens='--paep-ref-color-neutral-100 (foundation-internal), --paep-motion-loop-skeleton-pulse',prohibited='Directional shimmer sweeps; skeletons for > 10 s without a message.',a11y='2.2.2; hidden from AT.')

# ---------------- OVERLAYS ----------------
comp(id='dialog',name='Dialog',family='Overlays',target='@proseit/paep-components: paep-dialog (native <dialog> + showModal())',screens=['SCR-IB2-C06A','SCR-IB2-C06B','SCR-IB2-C06C'],reqs='REQ-IB2-CMP-01/02, A11Y-02, RSP-01',
 purpose='Interrupt for a short, focused decision or task that must complete or be cancelled before returning.',
 anatomy='Scrim · container (radius lg, elevation 5) · header (title heading + close icon button) · body (scrolls when content exceeds height) · footer (action group: secondary then primary; destructive confirm uses destructive primary).',
 hierarchy='Title > body > primary action.',variants='sm 25 rem (confirmations) · md 35 rem (default) · lg 50 rem (content-heavy); destructive confirmation (sm + destructive primary + Cancel).',
 states={'open':'Top layer, scrim, focus inside.','long-content':'Max height = viewport − 48 px; header and footer fixed; body scrolls; header gains a divider when scrolled.','busy':'Primary in loading state; Escape and close suppressed while an irreversible action is in flight.','hover':NA,'focus-visible':'Standard ring on all controls.','disabled':NA,'long-label':'Title wraps; footer buttons wrap/stack.','narrow-width':'< 600 px: inset 16 px from each edge; footer buttons stacked full width in DOM order (secondary, primary); lg becomes full screen.','selected':NA,'read-only':NA,'invalid':'Form dialogs show field errors in the body.'},
 keyboard='Tab / Shift+Tab cycle within the dialog (native modal inertness). Escape = Cancel when dismissible. Enter submits only when focus is in a form field and the dialog is a form.',
 focus='Entry: (a) first form field for form dialogs; (b) the Cancel (least-destructive) button for destructive confirmations; (c) the title (tabindex=-1) for informational/long-content dialogs. Return: to the invoking control; if it no longer exists, to the nearest region heading.',
 semantics='Native <dialog> opened with showModal(); aria-labelledby = title id; aria-describedby = main message for confirmations; close button aria-label "Close".',
 responsive='Size tokens clamp to viewport; narrow rules above.',long_content='Proven (SCR-IB2-C06B).',rtl='Close at inline-end (left); footer order mirrors.',density='Padding fixed (24 / 16 narrow) - dialogs are not density-scaled.',
 tokens='--paep-color-surface-overlay, --paep-color-scrim, --paep-elevation-5, --paep-radius-lg, --paep-motion-duration-slow (enter), --paep-motion-easing-enter/exit',
 prohibited='Nested dialogs; dialogs for non-blocking information; destructive confirmations with generic "OK"; auto-focusing the destructive button.',
 a11y='2.4.3 focus order; 2.1.2 no keyboard trap (Escape/close available); 2.4.11 focus not obscured.')

comp(id='drawer',name='Drawer',family='Overlays',target='@proseit/paep-components: paep-drawer (native <dialog>, modal)',screens=['SCR-IB2-C06D','SCR-IB2-R02'],reqs='REQ-IB2-CMP-01/02, RSP-01',
 purpose='Show supplementary detail or a secondary task beside the current context without leaving it.',
 anatomy='Scrim · sheet attached to the inline-end edge, full height (elevation 4, leading border) · header (title + close) · scrolling body · optional footer action group.',
 hierarchy='As dialog.',variants='side: end (DEFAULT) | start (only when the content relates to the start edge); width md 30 rem (default) | lg 40 rem.',
 states={'open':'Modal, focus inside.','long-content':'Body scrolls; header/footer fixed.','hover':NA,'focus-visible':'Standard.','disabled':NA,'long-label':'Title wraps.','narrow-width':'< 600 px: full width and full height; footer buttons stacked.','selected':NA,'read-only':NA,'invalid':'Form content errors in body.'},
 keyboard='As Dialog (Tab contained, Escape closes).',focus='Entry: drawer title (tabindex=-1) or first field for forms. Return: invoker.',
 semantics='Native modal <dialog> with aria-labelledby. Non-modal persistent side panels are shell patterns (IB3), not this component.',
 responsive='Desktop 30/40 rem; tablet min(30 rem, 100vw − 48 px) leaves a visible strip of context; mobile full width.',long_content='Proven.',rtl='end = left in RTL; slide direction mirrors; shadow is symmetric so needs no mirroring.',density='Padding 20 / 16 narrow.',
 tokens='--paep-elevation-4, --paep-color-surface-overlay, --paep-motion-duration-slow',prohibited='Using the drawer as application navigation (IB3 shell); stacking drawers.',a11y='As Dialog.')

comp(id='popover',name='Popover',family='Overlays',target='@proseit/paep-components: paep-popover (HTML popover attribute + anchor positioning with script fallback)',screens=['SCR-IB2-C06E'],reqs='REQ-IB2-RSP-02, CMP-02',
 purpose='Show short, non-essential supplementary content or a small set of options anchored to a trigger (also the base of the action-group overflow menu).',
 anatomy='Trigger button (aria-expanded) · panel (surface overlay, border subtle, radius md, elevation 3, max 20 rem) · optional arrow · content.',
 hierarchy='Secondary to the page.',variants='Informational (text) · Menu (used by Action group overflow).',
 states={'open':'Anchored below the trigger, aligned to its inline-start edge.','flipped':'Opens above when space below < panel height; shifts inline to stay 16 px inside the viewport.','narrow-width':'Panel width min(20 rem, 100vw − 32 px); still anchored; max-height with inner scroll.','hover':'Hover never opens a popover.','focus-visible':'On trigger and content controls.','disabled':'Trigger disabled.','loading':NA,'long-label':'Content wraps; max-height 60vh then scrolls.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='Enter/Space on trigger toggles; Escape closes and returns focus to trigger; Tab from the last element closes and continues in page order (non-modal).',
 focus='Informational popover: focus stays on trigger (content referenced via aria-describedby when short) or moves to the panel if it contains interactive content. Menu variant: first item.',
 semantics='Trigger aria-expanded + aria-controls; panel uses the popover attribute (light-dismiss "auto"); menu variant role="menu".',
 responsive='See narrow width state.',long_content='Inner scroll after 60vh.',rtl='"Align start" becomes right-aligned; arrow position mirrors.',density='Padding fixed.',
 tokens='--paep-elevation-3, --paep-radius-md, --paep-motion-duration-moderate',prohibited='Hover-only or focus-only opening; essential information only reachable in a popover; forms inside popovers (use Dialog or Drawer).',a11y='1.4.13 content on hover/focus not used; 2.1.1.')

# ---------------- NAVIGATION ----------------
comp(id='tabs',name='Tabs',family='Navigation',target='@proseit/paep-components: paep-tabs, paep-tab',screens=['SCR-IB2-C07','SCR-IB2-R01','SCR-IB2-R02','SCR-IB2-R03'],reqs='REQ-IB2-CMP-01/02, A11Y-02',
 purpose='Switch between peer views of the same object or region without navigation.',
 anatomy='Tab list (bottom border subtle) · tabs (label, optional count badge) · selected indicator (3 px brand-primary bar at block-end) · scroll buttons at the edges when overflowing · tab panel.',
 hierarchy='Selected tab: primary text, weight 600, indicator bar. Unselected: secondary text.',variants='Default only (no pill/segmented variant in IB2). Activation: automatic (DEFAULT) or manual (opt-in).',
 states={'default':'Unselected.','selected':'Indicator bar (shape cue) + weight + primary text; aria-selected.','hover':'Neutral hover fill.','focus-visible':'Inset focus ring (inside the tab so the list does not clip it).','disabled':'Disabled text; aria-disabled; still reachable with arrows so it can be discovered; cannot activate; reason via aria-describedby.','active/pressed':NA,'loading':'Panel content handles loading; tab itself unchanged.','long-label':'Wraps within max 18 rem; no truncation.','narrow-width':'List scrolls inside its own box (bounded inner scroll); selected tab scrolled into view; edge scroll buttons for pointer users.','read-only':NA,'invalid':'Optional error icon + text count ("2 errors") inside the tab label - text, not colour.'},
 keyboard='Tab moves into the list to the selected tab; ArrowLeft/Right move between tabs (mirrored in RTL); Home/End first/last; automatic activation selects on arrow; manual activation requires Enter/Space; Tab moves into the panel.',
 focus='Roving tabindex; panel tabindex=0 only if it has no focusable content.',
 semantics='role=tablist (aria-label) / tab (aria-selected, aria-controls) / tabpanel (aria-labelledby). Scroll buttons are aria-hidden pointer affordances (keyboard users use arrows).',
 responsive='Bounded scroll below available width; never wraps to multiple rows.',long_content='~2× label proven.',rtl='Order and arrow semantics mirror; scroll buttons swap edges.',density='Tab height 44 / 36 px.',
 tokens='--paep-color-selected-indicator, --paep-color-text-*, --paep-density-tab-height, --paep-color-border-subtle',prohibited='Tabs as page navigation (use links); nested tabs; colour-only selection.',a11y='WAI-ARIA tabs pattern; 1.4.1; 2.4.7.')

comp(id='breadcrumb',name='Breadcrumb',family='Navigation',target='@proseit/paep-components: paep-breadcrumb',screens=['SCR-IB2-C07','SCR-IB2-R01','SCR-IB2-R02','SCR-IB2-R03'],reqs='REQ-IB2-CMP-01, RSP-01, I18N-01',
 purpose='Show the location of the current page in a hierarchy and allow moving up.',
 anatomy='<nav> · ordered list · ancestor links · separators (chevron-end, decorative, mirrored) · current page (text, weight 600, not a link) · "Show full path" button (text "…" with accessible name) when collapsed.',
 hierarchy='Current page strongest; ancestors as links.',variants='Full · Collapsed (first · … · parent · current).',
 states={'default':'All segments, wrapping onto lines when needed.','collapsed':'When > 4 segments or container < 36 rem: first, "…", parent, current.','expanded':'"…" activated: all segments shown inline, focus moves to the first revealed link.','hover':'Link underline thickens.','focus-visible':'Ring on links/button.','disabled':NA,'selected':'Current page: aria-current="page".','long-label':'Segments wrap (no truncation); each segment is one flex item that can break.','narrow-width':'Collapsed variant; wraps as needed.','read-only':NA,'invalid':NA,'loading':NA},
 keyboard='Tab through links and the "…" button; Enter activates.',focus='After expand: first revealed link.',
 semantics='<nav aria-label="Breadcrumb"><ol>; current item aria-current="page"; separators are CSS masks (not read); "…" is <button aria-expanded="false" aria-label="Show full path">.',
 responsive='Container-based collapse at 36 rem.',long_content='Many long segments proven.',rtl='Reading order right→left; separators mirror.',density='Unchanged.',
 tokens='--paep-color-link, --paep-color-icon-default',prohibited='Breadcrumb as the only navigation; truncating the current page title; making the current item a link.',a11y='aria-current; 2.4.8 location.')

# ---------------- STRUCTURE ----------------
comp(id='card',name='Card',family='Structure',target='@proseit/paep-components: paep-card',screens=['SCR-IB2-C08','SCR-IB2-R01'],reqs='REQ-IB2-TOK-04, CMP-01',
 purpose='Group a self-contained unit of related content (e.g. a summary) within a page or grid.',anatomy='Container (surface, 1 px subtle border, radius md, elevation 1) · optional header (title heading, optional description, optional action group at inline-end) · body · optional footer (actions).',
 hierarchy='Title > body > footer actions.',variants='Default (level 1). Raised (level 2) is DEFINED as a token but NOT used by any IB2 component: no controlled use case justifies it yet.',
 states={'default':'As anatomy.','with header':'Title + actions.','with actions':'Header action group wraps under the title below 30 rem.','long title':'Two-line (or longer) titles wrap; actions wrap beneath.','long content':'Body grows; no inner scroll.','hover':NA+' (cards are not interactive in IB2).','focus-visible':'On contained controls only.','disabled':NA,'selected':NA,'read-only':NA,'invalid':NA,'narrow-width':'Full width; padding 16 px.'},
 keyboard='None of its own.',focus='None.',semantics='<section> with aria-labelledby when it has a title, or <article> for standalone items; heading level configurable.',
 responsive='Container query for header layout.',long_content='Proven.',rtl='Header actions at inline-end (left).',density='Padding 20 / 16 px.',
 tokens='--paep-color-surface, --paep-color-border-subtle, --paep-radius-md, --paep-density-card-padding',prohibited='Whole-card click targets; decorative shadows; nesting cards in cards.',a11y='Landmark-free grouping with heading structure.')

comp(id='panel',name='Panel',family='Structure',target='@proseit/paep-components: paep-panel',screens=['SCR-IB2-C08'],reqs='REQ-IB2-TOK-04, CMP-01',
 purpose='Divide a page into titled sections, optionally collapsible for progressive disclosure of long forms (PAEP §6.2).',
 anatomy='Container (surface, border subtle, radius md) · header bar on subtle surface (title or toggle button with chevron, optional actions) · body.',
 hierarchy='Header > body.',variants='Static · Collapsible (justified by PAEP §6.2 progressive disclosure; default expanded; state is not persisted by the component).',
 states={'default':'Expanded.','collapsed':'Body hidden; chevron rotated to point at inline-end.','with actions':'Actions wrap under the title at narrow widths.','long title':'Wraps.','long content':'Body grows.','hover':'Toggle button hover (collapsible only).','focus-visible':'Ring on toggle.','disabled':NA,'selected':NA,'read-only':NA,'invalid':'Optional "Contains 2 errors" text in the header when collapsed content has errors.','narrow-width':'Full width.'},
 keyboard='Collapsible: Enter/Space on the toggle.',focus='Stays on toggle.',
 semantics='<section aria-labelledby>; collapsible: heading containing <button aria-expanded aria-controls>; collapsed body uses hidden.',
 responsive='As Card.',long_content='Proven.',rtl='Chevron rotation mirrors.',density='Header padding 12 × 20/16; body 20 / 16.',
 tokens='--paep-color-surface-subtle (header), --paep-color-border-subtle',prohibited='Accordion-style mutually exclusive panels (not in IB2); collapsing required errors out of sight without a header message.',a11y='Disclosure pattern.')

comp(id='divider',name='Divider',family='Structure',target='@proseit/paep-components: hr[paepDivider], paep-divider[vertical]',screens=['SCR-IB2-C08'],reqs='REQ-IB2-CMP-01',
 purpose='Separate groups of content when spacing alone is insufficient.',anatomy='1 px line in border-subtle.',hierarchy='Lowest.',variants='horizontal (full, inset) · vertical.',
 states={'default':'Only state.','hover':NA,'focus-visible':NA,'disabled':NA,'loading':NA,'long-label':NA,'narrow-width':'Vertical dividers inside wrapping rows are hidden when items wrap.','selected':NA,'read-only':NA,'invalid':NA},
 keyboard='None.',focus='None.',semantics='Horizontal: <hr> (thematic break) or aria-hidden when purely visual; vertical: role="separator" aria-orientation="vertical" only when it separates groups meaningfully, otherwise aria-hidden.',
 responsive='See narrow.',long_content=NA,rtl='Logical margins.',density='Margin 16 / 12 px.',tokens='--paep-color-border-subtle, --paep-space-4',prohibited='Using dividers to fake table rows; heavy or coloured dividers.',a11y='Decorative contrast exempt.')

assert len(C)==25, len(C)
FAMILIES=['Actions','Forms','Data','Feedback','Overlays','Navigation','Structure']
