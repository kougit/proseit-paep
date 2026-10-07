// Public entry point of @proseit/paep-components: the IB2 core component tranche (PAEP-IR-01 §6.4), the approved
// HOF-IB3-001 primitives (combobox, count badge), the HOF-IB2-001 v1.2 menu and the message catalogue. Consumers import this package only
// through this entry point.

// Messages
export { PAEP_DEFAULT_MESSAGES, PAEP_MESSAGES, paepFormat, providePaepMessages } from './lib/messages/messages';
export type { PaepMessageKey, PaepMessages } from './lib/messages/messages';

// Actions
export { PaepButton, type PaepButtonVariant, type PaepButtonType } from './lib/button/button';
export { PaepIconButton, type PaepIconButtonVariant } from './lib/icon-button/icon-button';
export { PaepActionGroup, type PaepActionGroupVariant, type PaepActionPriority } from './lib/action-group/action-group';

// Forms (textarea is textarea[paepInput], exported through PaepInput)
export { PaepField, PAEP_FIELD_CONTROL, type PaepFieldControl } from './lib/field/field';
export { PaepInput } from './lib/input/input';
export { PaepSelect } from './lib/select/select';
export { PaepCheckbox } from './lib/checkbox/checkbox';
export { PaepRadioGroup, PaepRadio } from './lib/radio/radio';
export { PaepCombobox } from './lib/combobox/combobox';
export type { PaepComboboxGroup, PaepComboboxOption } from './lib/combobox/combobox';

// Data
export { PaepTable, PaepTableCell } from './lib/table/table';
export type { PaepTableCellContext, PaepTableColumn, PaepTableRow, PaepTableVariant } from './lib/table/table';
export { PaepList } from './lib/list/list';
export type { PaepCollectionState, PaepListItem } from './lib/list/list';
export { PaepPagination } from './lib/pagination/pagination';
export { PaepEmptyState } from './lib/empty-state/empty-state';
export type { PaepEmptyStateKind, PaepHeadingLevel } from './lib/empty-state/empty-state';

// Feedback
export { PaepAlert } from './lib/alert/alert';
export type { PaepAlertStatus } from './lib/alert/alert';
export { PaepStatusBadge, PAEP_STATUS_ICONS } from './lib/status-badge/status-badge';
export type { PaepStatusTone } from './lib/status-badge/status-badge';
export { PaepCountBadge } from './lib/count-badge/count-badge';
export type { PaepCount, PaepCountBadgeVariant } from './lib/count-badge/count-badge';
export { PaepProgress } from './lib/progress/progress';
export { PaepSkeleton } from './lib/skeleton/skeleton';
export type { PaepSkeletonShape } from './lib/skeleton/skeleton';

// Overlay
export { PaepDialog, PaepDialogClose, PaepDialogFooter, PaepModalBase } from './lib/dialog/dialog';
export type { PaepDialogSize } from './lib/dialog/dialog';
export { PaepDrawer } from './lib/drawer/drawer';
export type { PaepDrawerSide, PaepDrawerSize } from './lib/drawer/drawer';
export { PaepPopover, PaepPopoverTrigger } from './lib/popover/popover';
export type { PaepPopoverAlign, PaepPopoverFocus, PaepPopoverVariant } from './lib/popover/popover';
export { PaepMenu, PaepMenuGroup, PaepMenuItem, PaepMenuItemRadio, PaepMenuSeparator, PaepMenuTrigger } from './lib/menu/menu';

// Navigation
export { PaepTab, PaepTabs } from './lib/tabs/tabs';
export type { PaepTabsActivation } from './lib/tabs/tabs';
export { PaepBreadcrumb } from './lib/breadcrumb/breadcrumb';
export type { PaepBreadcrumbItem } from './lib/breadcrumb/breadcrumb';

// Structure
export { PaepCard } from './lib/card/card';
export type { PaepCardHeadingLevel } from './lib/card/card';
export { PaepPanel } from './lib/panel/panel';
export { PaepDivider, PaepVerticalDivider } from './lib/divider/divider';
