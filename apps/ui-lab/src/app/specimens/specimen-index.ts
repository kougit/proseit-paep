import { LabFamily } from '../lab/specimen-meta';

/**
 * Light contents entries for the 25 specimens, so the lab frame can list them without loading the specimen
 * pages: those load on demand from registry.ts (LAB_SPECIMEN_ROUTES). The registry reports any drift between
 * this list and the specimen metadata as a console error, which the browser gate (A3) fails on.
 */
export const LAB_SPECIMEN_INDEX: readonly { readonly id: string; readonly name: string; readonly family: LabFamily }[] = [
  { id: 'button', name: 'Button', family: 'Actions' },
  { id: 'icon-button', name: 'Icon button', family: 'Actions' },
  { id: 'action-group', name: 'Action group', family: 'Actions' },
  { id: 'field', name: 'Field wrapper', family: 'Forms' },
  { id: 'input', name: 'Input', family: 'Forms' },
  { id: 'select', name: 'Native select', family: 'Forms' },
  { id: 'textarea', name: 'Textarea', family: 'Forms' },
  { id: 'checkbox', name: 'Checkbox', family: 'Forms' },
  { id: 'radio', name: 'Radio group', family: 'Forms' },
  { id: 'table', name: 'Table shell', family: 'Data' },
  { id: 'list', name: 'List', family: 'Data' },
  { id: 'pagination', name: 'Pagination', family: 'Data' },
  { id: 'empty-state', name: 'Empty state', family: 'Data' },
  { id: 'alert', name: 'Alert', family: 'Feedback' },
  { id: 'status-badge', name: 'Status badge', family: 'Feedback' },
  { id: 'progress', name: 'Progress', family: 'Feedback' },
  { id: 'skeleton', name: 'Skeleton', family: 'Feedback' },
  { id: 'dialog', name: 'Dialog', family: 'Overlay' },
  { id: 'drawer', name: 'Drawer', family: 'Overlay' },
  { id: 'popover', name: 'Popover', family: 'Overlay' },
  { id: 'tabs', name: 'Tabs', family: 'Navigation' },
  { id: 'breadcrumb', name: 'Breadcrumb', family: 'Navigation' },
  { id: 'card', name: 'Card', family: 'Structure' },
  { id: 'panel', name: 'Panel', family: 'Structure' },
  { id: 'divider', name: 'Divider', family: 'Structure' },
];
