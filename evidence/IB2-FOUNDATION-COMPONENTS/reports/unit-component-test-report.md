# IB2-FOUNDATION-COMPONENTS — Unit and Component Test Report

Runner: `npm run test:components` → `tooling/design-system/run-component-tests.mjs` → Angular `@angular/build:unit-test` (`ui-lab:test`), Vitest 4.1.11 browser mode through `@vitest/browser-playwright` 1.63.0, in the installed Chromium/Chrome (`CHROME_BIN`; nothing downloaded). Tests render real components in a real browser and drive them with `userEvent` (keyboard and pointer), then assert DOM semantics, focus, emitted events and computed styles.

The wrapper fails the run when the runner exits non-zero, when no passing-test summary is printed, or when zero tests run (IB2-AC08). `qa:design-system` S09 rejects focused, skipped, todo and expected-to-fail tests and requires at least three tests per component spec (negatives N24, N25, N29).

Result: see `logs/verification-<commit>/test-components.log` (fresh clone, clean `npm ci`) and the `PAEP / components` job in `ci-report.md`.

| Spec | Tests |
| --- | --- |
| `packages/components/src/lib/action-group/action-group.spec.ts` | 13 |
| `packages/components/src/lib/alert/alert.spec.ts` | 8 |
| `packages/components/src/lib/breadcrumb/breadcrumb.spec.ts` | 7 |
| `packages/components/src/lib/button/button.spec.ts` | 10 |
| `packages/components/src/lib/card/card.spec.ts` | 7 |
| `packages/components/src/lib/checkbox/checkbox.spec.ts` | 9 |
| `packages/components/src/lib/dialog/dialog.spec.ts` | 15 |
| `packages/components/src/lib/divider/divider.spec.ts` | 5 |
| `packages/components/src/lib/drawer/drawer.spec.ts` | 9 |
| `packages/components/src/lib/empty-state/empty-state.spec.ts` | 7 |
| `packages/components/src/lib/field/field.spec.ts` | 11 |
| `packages/components/src/lib/icon-button/icon-button.spec.ts` | 8 |
| `packages/components/src/lib/input/input.spec.ts` | 11 |
| `packages/components/src/lib/list/list.spec.ts` | 8 |
| `packages/components/src/lib/messages/messages.spec.ts` | 5 |
| `packages/components/src/lib/pagination/pagination.spec.ts` | 14 |
| `packages/components/src/lib/panel/panel.spec.ts` | 7 |
| `packages/components/src/lib/popover/popover.spec.ts` | 17 |
| `packages/components/src/lib/progress/progress.spec.ts` | 6 |
| `packages/components/src/lib/radio/radio.spec.ts` | 11 |
| `packages/components/src/lib/select/select.spec.ts` | 8 |
| `packages/components/src/lib/skeleton/skeleton.spec.ts` | 4 |
| `packages/components/src/lib/status-badge/status-badge.spec.ts` | 4 |
| `packages/components/src/lib/table/table.spec.ts` | 16 |
| `packages/components/src/lib/tabs/tabs.spec.ts` | 11 |
| `packages/components/src/lib/textarea/textarea.spec.ts` | 8 |
| `packages/foundation/src/lib/foundation.spec.ts` | 15 |
| **Total (27 spec files)** | **254** |

## Test titles by spec (what each test proves)

### `packages/components/src/lib/action-group/action-group.spec.ts`

- is a named group; at wide widths every action is visible and More is not shown
- places the primary at the inline-end and separates the destructive action (LTR and RTL)
- below 30rem: the primary stays visible and stretches; the other actions move to "More"
- ArrowDown opens the menu on the first item; items keep order with the destructive one last after a divider
- moves destructive actions after the others in the menu even when they come first in the markup
- moves with ArrowDown/ArrowUp (wrapping), Home and End
- ArrowUp on More opens the menu on the last item; Escape closes it and returns focus to More
- Enter on More opens the menu; Enter on an item runs the original action and returns focus to More
- a disabled item is announced as disabled and does not run
- Tab closes the menu and continues past the group
- a pointer press outside closes the menu (no hover needed anywhere)
- positions the menu below More and inside the viewport
- footer variant stacks every action full width in DOM order below 30rem, without a More menu

### `packages/components/src/lib/alert/alert.spec.ts`

- is static content (no live role) when present at load
- uses role=alert for dynamically inserted errors and role=status otherwise
- carries a visually hidden status word and a distinct icon per status
- renders the title and projected actions, which are keyboard operable
- dismisses with the keyboard, emits dismissed and moves focus to the region heading
- never offers dismissal for error alerts
- can receive focus programmatically (error summary after a failed submit)
- keeps long content inline and wraps actions at narrow width

### `packages/components/src/lib/breadcrumb/breadcrumb.spec.ts`

- renders a named navigation landmark with an ordered list and the current page
- shows every segment and no "…" button when short and wide
- uses decorative separators that mirror in RTL
- collapses to first, "…", parent and current when there are more than 4 segments
- expands inline with the "…" button and moves focus to the first revealed link
- collapses below a 36 rem container even with 4 segments, and resets when the path changes
- wraps long segments without horizontal overflow and keeps links reachable with Tab

### `packages/components/src/lib/button/button.spec.ts`

- is a native button named by its visible label with an aria-hidden decorative icon
- activates with Enter and Space and keeps focus on the button
- renders each variant with its own class and fill
- uses the density control height as minimum height (40px comfortable, 32px compact)
- loading: spinner replaces the leading icon, aria-busy + aria-disabled, stays focusable, suppresses activation
- a loading submit button does not submit the form; otherwise it submits natively
- disabled uses the native attribute with a dashed border as the non-colour cue
- link-styled button keeps link semantics and has no type attribute
- wraps a long label instead of truncating it and grows in height
- mirrors in RTL: the leading icon sits at the inline-start (right)

### `packages/components/src/lib/card/card.spec.ts`

- is a section labelled by its heading, level 3 by default
- supports a configurable heading level
- places header actions, body and footer in their slots
- omits the heading, label and empty slots when there is no title or footer
- uses a 1 px subtle border, medium radius and elevation 1, with no hover effect
- wraps header actions under the title and uses 16 px padding below 30 rem
- puts header actions at the inline-end (left) in RTL

### `packages/components/src/lib/checkbox/checkbox.spec.ts`

- is a native checkbox named by its wrapping label; Space and label clicks toggle it
- checked shows a fill plus a tick glyph (shape cue, not colour alone)
- indeterminate uses the DOM property, reads as mixed, shows a dash and clears when toggled
- read-only: aria-readonly, clicks and Space do not toggle, the value is still submitted
- invalid: aria-invalid with a 2px error border
- disabled: native disabled, dashed border, not toggleable, and a solid disabled fill when checked
- works with reactive forms and ngModel
- the label row gives a hit area of at least 24px; the box follows density (18px / 16px)
- a long label wraps with the box aligned to the first line; the box sits at the inline-start in RTL

### `packages/components/src/lib/dialog/dialog.spec.ts`

- opens as a native modal dialog named by its title and described by its message
- focuses Cancel on entry for a destructive confirmation, never the destructive action
- focuses the title (tabindex -1) on entry for an informational dialog
- focuses the first form field on entry for a form dialog
- keeps Tab and Shift+Tab inside the modal dialog
- cancels on Escape, emits cancelled and closed, and returns focus to the invoker
- suppresses Escape and the close button while busy
- closes from the close button and from a paepDialogClose control, restoring focus
- closes when the consumer sets open to false
- returns focus to returnFocusTo when the invoker no longer exists
- sizes sm 25 rem, md 35 rem and lg 50 rem on wide screens
- scrolls long content inside the body while the header and footer stay in view
- makes an overflowing body a focusable region named by the title, and locks page scroll while open
- insets 16 px and stacks the footer actions in DOM order below 600 px; lg becomes full screen
- closes the native dialog if the component is destroyed while open

### `packages/components/src/lib/divider/divider.spec.ts`

- is a native thematic break drawn as a 1 px subtle line
- is hidden from assistive technology when decorative and indents when inset
- uses 16 px margins, 12 px in compact density
- vertical: separator with vertical orientation, or aria-hidden when decorative
- vertical: hidden when the items on either side wrap onto different lines

### `packages/components/src/lib/drawer/drawer.spec.ts`

- opens as a modal dialog named by its title and focuses the title
- focuses the first field on entry when the drawer holds a form
- contains Tab, closes on Escape and returns focus to the invoker
- ignores Escape and Cancel while busy
- closes from a paepDialogClose control
- attaches to the inline-end edge at full height, 30 rem wide, with a scrolling body
- mirrors to the left edge in RTL and supports the start side
- uses 40 rem for lg and leaves a context strip on tablets
- is full width below 600 px with stacked footer actions

### `packages/components/src/lib/empty-state/empty-state.spec.ts`

- empty and no-results differ in icon, heading, description and action
- keeps the icon decorative and never moves focus on render
- uses the configured heading level
- shows a consumer action that is keyboard operable
- hides the action when the label is empty
- disables the action with a visible reason associated to it
- wraps long headings within the container

### `packages/components/src/lib/field/field.spec.ts`

- labels the projected control with <label for> and clicking the label focuses it
- keeps a consumer id and appends a consumer aria-describedby after the field ids
- required: visual asterisk hidden from assistive technology, native required on the control
- shows the required marker when the control itself carries required
- help text is associated through aria-describedby
- error: icon + text, aria-invalid, described error first then help; not a live region; removed when fixed
- meta texts "(optional)", "(read only)" and "Unsaved change" are text in the label
- prefix and suffix adornments are referenced after error and help so units are announced
- swaps prefix and suffix sides in RTL
- disabled control: label turns secondary colour and the control keeps native disabled
- wraps a long label, help and error instead of truncating; max inline size 40rem

### `packages/components/src/lib/icon-button/icon-button.spec.ts`

- takes its accessible name from the mandatory label (aria-label), never from title
- updates the name when the label changes
- activates with Enter and Space
- is a square target of control height in both densities (never below 24px)
- offers only the secondary (bordered) and tertiary (borderless) variants
- loading: spinner replaces the icon, aria-busy, focus kept, activation suppressed
- disabled: native disabled with a dashed border
- mirrors directional icons in RTL only

### `packages/components/src/lib/input/input.spec.ts`

- stays a native textbox with the field label as its name
- accepts typing natively and submits with a native form
- works with reactive forms: value both ways, validation drives the field error and aria-invalid
- works with template-driven forms (ngModel)
- uses the density control height (40px comfortable, 32px compact)
- read-only: dashed read-only border, value at full text contrast, still focusable
- disabled: dashed disabled border and disabled fill
- invalid: 2px error border (thickness is the non-colour cue) and aria-invalid
- shows the placeholder only as an example, never as the name
- works outside a field with its own accessible name and an auto id
- shrinks to the container at narrow widths (fluid, no overflow)

### `packages/components/src/lib/list/list.spec.ts`

- renders items as a native list with links, secondary text, meta and badges
- reaches only links and actions with Tab and runs item actions from the keyboard
- shows skeleton items with aria-busy and a polite loading message
- shows the empty state (with action) and announces it without moving focus
- shows the distinct no-results state with Clear filters
- shows an error alert with Retry; after reload focus moves to the heading
- moves trailing meta below the text in a container under 20 rem
- keeps items at the density minimum height

### `packages/components/src/lib/messages/messages.spec.ts`

- formats named placeholders and leaves unknown placeholders visible
- selects ICU plural forms with the locale plural rules and substitutes #
- formats plain numeric placeholders and plural forms with the given locale
- formats percentages through Intl and the given locale
- defaults to English and lets an application replace messages

### `packages/components/src/lib/pagination/pagination.spec.ts`

- is a named navigation landmark with a list of controls
- uses overridden Previous and Next texts as their accessible names (label in name)
- shows first, last and current ± 1 with gaps, and marks the current page
- formats page numbers with the application's LOCALE_ID
- hides the gap marks from assistive technology and shows a single skipped page instead of a gap
- shows page 2 itself, not a gap, when it is the only page skipped
- keeps Previous at the first page but marks it aria-disabled and inert
- marks Next aria-disabled on the last page
- changes page with the keyboard, emits pageChange and moves focus to the paged heading
- does not emit when the current page is activated
- renders links when pageHref is given; disabled ends have no href
- switches to the compact variant below a 36 rem container
- keeps controls at least the minimum target size
- mirrors directional chevrons in RTL

### `packages/components/src/lib/panel/panel.spec.ts`

- is a section labelled by a heading that contains the disclosure button
- collapses and expands with Enter and Space, keeping focus on the toggle
- rotates the chevron to point at the inline-end when collapsed, mirrored in RTL
- shows "Contains N errors" in the header while collapsed and describes the toggle with it
- renders a static panel without a toggle, always showing its body
- supports a configurable heading level and header actions
- uses the subtle surface for the header

### `packages/components/src/lib/popover/popover.spec.ts`

- uses the HTML popover attribute and links the trigger with aria-controls and aria-expanded
- is never opened by hover
- toggles with Enter and Space; informational content keeps focus on the trigger and describes it
- toggles on pointer click, including clicking the trigger again while open
- anchors below the trigger at its inline-start edge
- aligns to the right edge of the trigger in RTL
- flips above when there is no room below and shifts to stay 16 px inside the viewport
- is at most min(20 rem, 100vw - 32 px) wide on narrow screens
- moves focus into interactive content and closes on Escape, returning focus to the trigger
- closes on Escape while focus stays on the trigger
- closes when Tab moves past the last element and focus continues in page order
- closes an informational panel when Tab moves on from the trigger it describes
- closes an informational panel when focus leaves the document from its trigger, not on a click inside the page
- keeps the trigger in view when Escape returns focus to it
- makes long content without controls a focusable region named by the trigger, scrollable with the keyboard
- closes on an outside click (light dismiss)
- menu variant: role menu, ArrowDown opens on the first item, arrows/Home/End move, Escape returns to the trigger

### `packages/components/src/lib/progress/progress.spec.ts`

- is a native progress named by its visible label
- shows a determinate value and percentage text
- supports the step variant with a value text
- is indeterminate without a value and animates a travelling segment
- under reduced motion shows a static hatched fill and "In progress"
- wraps a long label and keeps the value text visible

### `packages/components/src/lib/radio/radio.spec.ts`

- is a fieldset named by its legend with native radios named by their labels
- Tab enters at the first option when none is selected; arrows move and select; Tab leaves
- Tab enters at the selected option
- selected shows a 2px ring and an inner dot (shape cue)
- help and group error are described on the fieldset (error first); options get aria-invalid and a 2px error border
- required: visual asterisk (aria-hidden) and aria-required on the group
- disabled group: every option natively disabled (fieldset disabled) with a dashed border
- read-only: selection cannot change by click or arrow keys, focus still works and the value submits
- works with a native form, reactive forms and ngModel
- horizontal options sit in a row and wrap to vertical when the container is narrow
- keeps the circle at the inline-start in RTL

### `packages/components/src/lib/select/select.spec.ts`

- is a native single select (combobox) named by the field label, with the first "Choose…" option
- uses appearance none with a decorative chevron at the inline-end and reserves space for it
- moves the chevron to the inline-end (left) in RTL
- changes value with the keyboard natively and submits with a native form
- works with reactive forms and ngModel
- invalid via the field: 2px error border, aria-invalid, error described
- disabled: native disabled with a dashed border
- truncates a long selected option only in the closed control (the option keeps its full text)

### `packages/components/src/lib/skeleton/skeleton.spec.ts`

- is hidden from assistive technology and not focusable
- renders text lines with a shorter last line
- supports the list item and table cell shapes and a bounded line count
- pulses by default and stops under reduced motion

### `packages/components/src/lib/status-badge/status-badge.spec.ts`

- always shows its text and has no role or tab stop
- shows a decorative icon whose shape differs per tone (not colour alone)
- uses the status colour tokens for each tone
- wraps long labels instead of truncating them

### `packages/components/src/lib/table/table.spec.ts`

- uses native table semantics with a caption, column headers and row headers
- shows every column and no Details control at 60 rem and wider
- moves priority-3 columns into a row detail below 60 rem, toggled from the keyboard
- also moves priority-2 columns below 40 rem; key and status never hide; Details becomes icon-only
- reflows at 320 px without horizontal overflow
- restores all columns when the container widens again
- aligns numeric columns to the inline end with tabular numbers
- renders custom cell templates in cells
- loading: keeps the header, shows bounded skeleton rows, sets aria-busy and a polite message
- empty: shows the empty state with its action and announces it
- no-results: shows the distinct state with Clear filters
- error: shows an alert with reference and Retry, no stale rows; after reload focus moves to the caption
- does not move focus on ordinary state changes
- moves focus to the caption after a page change in the footer pagination
- scroll fallback: all columns in a named, focusable, keyboard-scrollable region with a sticky first column
- standard variant has no scroll region

### `packages/components/src/lib/tabs/tabs.spec.ts`

- exposes tablist, tab and tabpanel semantics with names and relationships
- uses a roving tabindex: Tab enters on the selected tab, then moves into the panel
- does not make a panel with focusable content a Tab stop
- automatic activation: arrows select, wrap, and Home/End jump
- mirrors ArrowLeft and ArrowRight in RTL
- keeps disabled tabs focusable but not activatable, with the reason as description
- manual activation: arrows move focus only; Enter or Space selects
- selects on click and shows counts and errors as text, not colour alone
- draws the focus ring inside the tab
- scrolls an overflowing list inside its own box with aria-hidden edge scroll buttons
- scroll buttons swap edges in RTL

### `packages/components/src/lib/textarea/textarea.spec.ts`

- is a native multi-line textbox labelled and described by its field
- has a 5.5rem minimum height in both densities and resizes vertically only
- Enter inserts a new line; Tab leaves the textarea
- works with reactive forms, marks the field dirty and submits natively
- invalid: 2px error border, aria-invalid and error described before help
- read-only: dashed read-only border, text fully visible and focusable
- disabled: dashed disabled border (reactive disable)
- long content scrolls vertically inside the control and wraps

### `packages/foundation/src/lib/foundation.spec.ts`

- loads every catalogued token with its approved value into the document
- marks only the seven brand tokens as overridable and every status, text, surface and focus token as protected
- applies compact density values and keeps comfortable as the default
- computes WCAG ratios matching the handoff evidence
- every approved text pair meets 4.5:1 and every non-text pair 3:1
- accepts the approved Navy/Gold default and the synthetic petrol profile
- rejects the yellow demo profile and white on gold
- rejects protected, unknown, missing and malformed keys (rule 1)
- enforces each contrast rule 2-6 independently
- rejects a primary whose hue reads as error (rule 7) unless it is near-neutral
- applies a valid profile to a subtree without changing protected tokens, and applies nothing when rejected
- applies exactly the values it validated, even when a value changes between reads
- renders decorative, non-focusable SVG from PAEP-owned data and mirrors directional icons in RTL
- announces through persistent polite and assertive live regions
- clears the region before repeating a message, and keeps polite and assertive messages independent
