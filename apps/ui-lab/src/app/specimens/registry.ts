import { Routes } from '@angular/router';
import { LabSpecimen } from '../lab/specimen-meta';
import { LAB_SPECIMEN_INDEX } from './specimen-index';
import { ButtonSpecimen, BUTTON_META } from './button.specimen';
import { IconButtonSpecimen, ICON_BUTTON_META } from './icon-button.specimen';
import { ActionGroupSpecimen, ACTION_GROUP_META } from './action-group.specimen';
import { FieldSpecimen, FIELD_META } from './field.specimen';
import { InputSpecimen, INPUT_META } from './input.specimen';
import { SelectSpecimen, SELECT_META } from './select.specimen';
import { TextareaSpecimen, TEXTAREA_META } from './textarea.specimen';
import { CheckboxSpecimen, CHECKBOX_META } from './checkbox.specimen';
import { RadioSpecimen, RADIO_META } from './radio.specimen';
import { ComboboxSpecimen, COMBOBOX_META } from './combobox.specimen';
import { TableSpecimen, TABLE_META } from './table.specimen';
import { ListSpecimen, LIST_META } from './list.specimen';
import { PaginationSpecimen, PAGINATION_META } from './pagination.specimen';
import { EmptyStateSpecimen, EMPTY_STATE_META } from './empty-state.specimen';
import { AlertSpecimen, ALERT_META } from './alert.specimen';
import { StatusBadgeSpecimen, STATUS_BADGE_META } from './status-badge.specimen';
import { CountBadgeSpecimen, COUNT_BADGE_META } from './count-badge.specimen';
import { ProgressSpecimen, PROGRESS_META } from './progress.specimen';
import { SkeletonSpecimen, SKELETON_META } from './skeleton.specimen';
import { DialogSpecimen, DIALOG_META } from './dialog.specimen';
import { DrawerSpecimen, DRAWER_META } from './drawer.specimen';
import { PopoverSpecimen, POPOVER_META } from './popover.specimen';
import { MenuSpecimen, MENU_META } from './menu.specimen';
import { TabsSpecimen, TABS_META } from './tabs.specimen';
import { BreadcrumbSpecimen, BREADCRUMB_META } from './breadcrumb.specimen';
import { CardSpecimen, CARD_META } from './card.specimen';
import { PanelSpecimen, PANEL_META } from './panel.specimen';
import { DividerSpecimen, DIVIDER_META } from './divider.specimen';

/**
 * Every component specimen, in IR-01 §6.4 order with the approved IB3 primitives (combobox, count badge, menu) in
 * their families. The coverage check requires exactly the 25 IB2 components plus those three.
 */
export const LAB_SPECIMENS: readonly LabSpecimen[] = [
  { meta: BUTTON_META, component: ButtonSpecimen },
  { meta: ICON_BUTTON_META, component: IconButtonSpecimen },
  { meta: ACTION_GROUP_META, component: ActionGroupSpecimen },
  { meta: FIELD_META, component: FieldSpecimen },
  { meta: INPUT_META, component: InputSpecimen },
  { meta: SELECT_META, component: SelectSpecimen },
  { meta: TEXTAREA_META, component: TextareaSpecimen },
  { meta: CHECKBOX_META, component: CheckboxSpecimen },
  { meta: RADIO_META, component: RadioSpecimen },
  { meta: COMBOBOX_META, component: ComboboxSpecimen },
  { meta: TABLE_META, component: TableSpecimen },
  { meta: LIST_META, component: ListSpecimen },
  { meta: PAGINATION_META, component: PaginationSpecimen },
  { meta: EMPTY_STATE_META, component: EmptyStateSpecimen },
  { meta: ALERT_META, component: AlertSpecimen },
  { meta: STATUS_BADGE_META, component: StatusBadgeSpecimen },
  { meta: COUNT_BADGE_META, component: CountBadgeSpecimen },
  { meta: PROGRESS_META, component: ProgressSpecimen },
  { meta: SKELETON_META, component: SkeletonSpecimen },
  { meta: DIALOG_META, component: DialogSpecimen },
  { meta: DRAWER_META, component: DrawerSpecimen },
  { meta: POPOVER_META, component: PopoverSpecimen },
  { meta: MENU_META, component: MenuSpecimen },
  { meta: TABS_META, component: TabsSpecimen },
  { meta: BREADCRUMB_META, component: BreadcrumbSpecimen },
  { meta: CARD_META, component: CardSpecimen },
  { meta: PANEL_META, component: PanelSpecimen },
  { meta: DIVIDER_META, component: DividerSpecimen },
];

/** Routes of the specimen pages, loaded on demand under /components. */
export const LAB_SPECIMEN_ROUTES: Routes = LAB_SPECIMENS.map((s) => ({
  path: s.meta.id,
  component: s.component,
  title: `${s.meta.name} · PAEP UI laboratory`,
}));

const drift = LAB_SPECIMENS.length !== LAB_SPECIMEN_INDEX.length
  || LAB_SPECIMENS.some((s, i) => {
    const e = LAB_SPECIMEN_INDEX[i];
    return s.meta.id !== e.id || s.meta.name !== e.name || s.meta.family !== e.family;
  });
if (drift) console.error('PAEP UI laboratory: specimen-index.ts does not match the specimen metadata in registry.ts');
