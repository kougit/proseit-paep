# IB2 component public API (generated from source at the PR head)

Source of truth: `packages/components/src/index.ts`. For each exported class: selector, inputs (`input`/`model`), outputs (`output`/`model` change events) and public methods. Generated from the TypeScript source; types abbreviated.

## PaepActionGroup (component, `action-group`)
* Selector: `paep-action-group`
* Inputs: `label` (required): string, `variant`: PaepActionGroupVariant, `moreLabel`: string ∣ undefined, `moreActionsLabel`: string ∣ undefined

## PaepAlert (component, `alert`)
* Selector: `paep-alert`
* Inputs: `status`: PaepAlertStatus, `heading`: string, `live`, `dismissible`, `focusAfterDismiss`: HTMLElement ∣ null ∣ undefined, `statusLabel`: string, `dismissLabel`: string
* Outputs: `dismissed`: void
* Public methods: `focus()`

## PaepBreadcrumb (component, `breadcrumb`)
* Selector: `paep-breadcrumb`
* Inputs: `items` (required): readonly PaepBreadcrumbItem[], `label`, `showFullPathLabel`

## PaepButton (component, `button`)
* Selector: `button[paepButton], a[paepButton]`
* Inputs: `variant`: PaepButtonVariant, `type`: PaepButtonType, `icon`: PaepIconName ∣ undefined, `trailingIcon`: PaepIconName ∣ undefined, `loading`, `block`

## PaepCard (component, `card`)
* Selector: `paep-card`
* Inputs: `heading`: string, `headingLevel`: PaepCardHeadingLevel, `description`: string

## PaepCheckbox (component, `checkbox`)
* Selector: `input[type=checkbox][paepCheckbox]`
* Inputs: `indeterminate` (two-way), `readonly`, `invalid`

## PaepDialogFooter (component, `dialog`)
* Selector: `paep-dialog-footer`

## PaepModalBase (directive, `dialog`)
* Selector: `(none; abstract base)`
* Inputs: `open` (two-way), `heading` (required): string, `description`: string, `busy`, `closeLabel`: string, `returnFocusTo`: HTMLElement ∣ null
* Outputs: `cancelled`: void, `closed`: void
* Public methods: `dismiss()`

## PaepDialogClose (directive, `dialog`)
* Selector: `[paepDialogClose]`

## PaepDialog (component, `dialog`)
* Selector: `paep-dialog`
* Inherits the inputs, outputs and methods of `PaepModalBase`
* Inputs: `size`: PaepDialogSize, `destructive`

## PaepDivider (component, `divider`)
* Selector: `hr[paepDivider]`
* Inputs: `inset`, `decorative`

## PaepVerticalDivider (component, `divider`)
* Selector: `paep-divider[vertical]`
* Inputs: `decorative`

## PaepDrawer (component, `drawer`)
* Selector: `paep-drawer`
* Inherits the inputs, outputs and methods of `PaepModalBase`
* Inputs: `side`: PaepDrawerSide, `size`: PaepDrawerSize

## PaepEmptyState (component, `empty-state`)
* Selector: `paep-empty-state`
* Inputs: `kind`: PaepEmptyStateKind, `headingLevel`: PaepHeadingLevel, unknown, `heading`: string, `description`: string ∣ undefined, `actionLabel`: string ∣ undefined, `actionDisabled`, `actionDisabledReason`: string
* Outputs: `action`: void

## PaepField (component, `field`)
* Selector: `paep-field`
* Inputs: `label` (required): string, `help`: string ∣ null ∣ undefined, `error`: string ∣ null ∣ undefined, `required`, `optional`, `readonly`, `dirty`, `prefix`: string ∣ null ∣ undefined, `suffix`: string ∣ null ∣ undefined, `optionalLabel`: string ∣ undefined, `readOnlyLabel`: string ∣ undefined, `unsavedChangeLabel`: string ∣ undefined

## PaepIconButton (component, `icon-button`)
* Selector: `button[paepIconButton]`
* Inputs: `icon` (required): PaepIconName, `label` (required): string, `variant`: PaepIconButtonVariant, `type`: PaepButtonType, `loading`

## PaepInput (component, `input`)
* Selector: `input[paepInput], textarea[paepInput]`
* Inherits the inputs, outputs and methods of `PaepFieldControlBase`

## PaepList (component, `list`)
* Selector: `paep-list`
* Inputs: `items`: readonly PaepListItem[], `state`: PaepCollectionState, `label`: string, `loadingItems`, `headingLevel`: PaepHeadingLevel, `focusTarget`: HTMLElement ∣ null ∣ undefined, `loadingLabel`: string, `emptyHeading`: string, `emptyDescription`: string ∣ undefined, `emptyActionLabel`: string, `noResultsHeading`: string, `noResultsDescription`: string ∣ undefined, `errorHeading`: string, `errorMessage`: string
* Outputs: `retry`: void, `emptyAction`: void, `clearFilters`: void, `itemAction`: PaepListItem

## PaepPagination (component, `pagination`)
* Selector: `paep-pagination`
* Inputs: `page` (two-way): number, `pageCount` (required): number, `focusTarget`: HTMLElement ∣ null ∣ undefined, `label`: string, `previousLabel`: string, `nextLabel`: string

## PaepPanel (component, `panel`)
* Selector: `paep-panel`
* Inputs: `heading` (required): string, `headingLevel`: PaepCardHeadingLevel, `collapsible`, `expanded` (two-way), `errorCount`

## PaepPopover (component, `popover`)
* Selector: `paep-popover`
* Inputs: `variant`: PaepPopoverVariant
* Outputs: `openChange`: boolean
* Public methods: `hide()`, `show()`, `toggle()`, `triggerFocusout()`

## PaepPopoverTrigger (directive, `popover`)
* Selector: `[paepPopoverTrigger]`
* Inputs: `paepPopoverTrigger` (required): PaepPopover

## PaepProgress (component, `progress`)
* Selector: `paep-progress`
* Inputs: `label` (required): string, `value`: number ∣ null ∣ undefined, `max`: number, `steps`: number ∣ null ∣ undefined, `valueText`: string, `inProgressLabel`: string

## PaepRadioGroup (component, `radio`)
* Selector: `paep-radio-group`
* Inputs: `legend` (required): string, `help`: string ∣ null ∣ undefined, `error`: string ∣ null ∣ undefined, `required`, `disabled`, `readonly`, `orientation`: 'vertical' ∣ 'horizontal'

## PaepRadio (component, `radio`)
* Selector: `input[type=radio][paepRadio]`
* Inputs: `invalid`

## PaepSelect (component, `select`)
* Selector: `select[paepSelect]`
* Inherits the inputs, outputs and methods of `PaepFieldControlBase`

## PaepSkeleton (component, `skeleton`)
* Selector: `paep-skeleton`
* Inputs: `shape`: PaepSkeletonShape, `lines`

## PaepStatusBadge (component, `status-badge`)
* Selector: `paep-status-badge`
* Inputs: `tone`: PaepStatusTone

## PaepTableCell (directive, `table`)
* Selector: `ng-template[paepTableCell]`
* Inputs: `paepTableCell` (required): string

## PaepTable (component, `table`)
* Selector: `paep-table`
* Inputs: `caption` (required): string, `columns` (required): readonly PaepTableColumn[], `rows`: readonly PaepTableRow[], `state`: PaepCollectionState, `variant`: PaepTableVariant, `rowIdKey`: string, `rowNameKey`: string, `total`: number ∣ null, `loadingRows`, `headingLevel`: PaepHeadingLevel, `errorReference`: string, `countLabel`: string, `loadingLabel`: string, `emptyHeading`: string, `emptyDescription`: string ∣ undefined, `emptyActionLabel`: string, `noResultsHeading`: string, `noResultsDescription`: string ∣ undefined, `errorHeading`: string, `errorMessage`: string
* Outputs: `retry`: void, `emptyAction`: void, `clearFilters`: void
* Public methods: `focusCaption()`

## PaepTab (component, `tabs`)
* Selector: `paep-tab`
* Inputs: `label` (required): string, `disabled`, `disabledReason`: string, `count`: number, `errorCount`

## PaepTabs (component, `tabs`)
* Selector: `paep-tabs`
* Inputs: `label` (required): string, `activation`: PaepTabsActivation, `selectedIndex` (two-way), `scrollStartLabel`, `scrollEndLabel`

## Other exports
Types and constants: `PAEP_DEFAULT_MESSAGES`, `PAEP_FIELD_CONTROL`, `PAEP_MESSAGES`, `PAEP_STATUS_ICONS`, `PaepActionGroupVariant`, `PaepActionPriority`, `PaepButtonType`, `PaepButtonVariant`, `PaepFieldControl`, `PaepIconButtonVariant`, `paepFormat`, `providePaepMessages`
