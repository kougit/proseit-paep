import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepActionGroup, PaepButton } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const ACTION_GROUP_META: LabSpecimenMeta = {
  id: 'action-group',
  name: 'Action group',
  family: 'Actions',
  selector: 'paep-action-group',
  exports: ['PaepActionGroup', 'PaepActionGroupVariant', 'PaepActionPriority'],
  purpose:
    'Lay out the related actions of a page, card, panel, dialog or table toolbar with stable primary placement and responsive overflow.',
  variants: [
    'toolbar (default): below 30rem the primary stretches and the other actions move into "More"',
    'footer (dialog/drawer): below 30rem every action stacks full width in DOM order',
    'item priority from each paepButton variant: primary / destructive / everything else is secondary',
  ],
  states: [
    'default (all actions shown at wide widths)',
    'hover / focus-visible / active (per item and on More)',
    'disabled (item keeps its position; aria-disabled in the menu)',
    'loading (busy item follows Button loading; aria-disabled in the menu)',
    'long-label (items wrap to a new row; nothing truncated)',
    'narrow-width (container < 30rem: primary + More)',
    'menu open',
  ],
  keyboard: [
    'Tab: moves between visible items.',
    'More: Enter / Space / ArrowDown opens the menu on the first item; ArrowUp opens it on the last item.',
    'Menu: ArrowDown / ArrowUp move (wrapping); Home / End jump; Enter / Space run the item.',
    'Escape closes the menu and returns focus to More; Tab closes it and continues.',
  ],
  accessibility: [
    'role="group" named by the label input.',
    'More is a <button aria-haspopup="menu" aria-expanded aria-controls> named "More actions" (visible text "More").',
    'The menu is role="menu" with native buttons as role="menuitem", in the same order, destructive last after a divider.',
    'After an item runs, focus returns to More (or to the overlay the item opened). Visual order equals DOM order.',
    'Nothing depends on hover. Hiding an action is never the authorisation control.',
  ],
  responsive:
    'Container-query driven (deterministic by rule, not by measurement): ≥ 30rem all visible and wrapping; < 30rem primary + More (toolbar) or stacked (footer).',
  rtl: 'Order mirrors through logical flex order; the menu opens aligned to the inline-end of More.',
  contentKeys: ['paep.action.more', 'paep.action.moreActions'],
  unitTests: 'packages/components/src/lib/action-group/action-group.spec.ts',
};

@Component({
  selector: 'lab-action-group-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepActionGroup, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Toolbar (wide)">
        <paep-action-group label="Record actions">
          <button paepButton (click)="ran('Edit')">Edit</button>
          <button paepButton (click)="ran('Duplicate')">Duplicate</button>
          <button paepButton (click)="ran('Export')">Export</button>
          <button paepButton variant="destructive" icon="delete" (click)="ran('Delete record')">Delete record</button>
          <button paepButton variant="primary" (click)="ran('Save changes')">Save changes</button>
        </paep-action-group>
        <p class="note" aria-live="polite">Last action: {{ last() }}</p>
      </lab-example>
      <lab-example heading="Toolbar in a narrow container (below 30rem: primary + More)">
        <div class="narrow">
          <paep-action-group label="Record actions">
            <button paepButton (click)="ran('Edit')">Edit</button>
            <button paepButton disabled>Duplicate</button>
            <button paepButton [loading]="exporting()" (click)="export()">Export</button>
            <button paepButton variant="destructive" icon="delete" (click)="ran('Delete record')">Delete record</button>
            <button paepButton variant="primary" (click)="ran('Save changes')">Save changes</button>
          </paep-action-group>
        </div>
      </lab-example>
      <lab-example heading="Footer (dialog / drawer)">
        <paep-action-group label="Dialog actions" variant="footer">
          <button paepButton (click)="ran('Cancel')">Cancel</button>
          <button paepButton variant="primary" (click)="ran('Save record')">Save record</button>
        </paep-action-group>
        <div class="narrow gap">
          <paep-action-group label="Dialog actions (narrow)" variant="footer">
            <button paepButton (click)="ran('Cancel')">Cancel</button>
            <button paepButton variant="primary" (click)="ran('Save record')">Save record</button>
          </paep-action-group>
        </div>
      </lab-example>
      <lab-example heading="Long labels (items wrap to new rows)">
        <paep-action-group label="Long actions">
          <button paepButton>Export the selected records as a spreadsheet</button>
          <button paepButton>Send the summary to the site lead</button>
          <button paepButton variant="primary">Save the changes and continue to the next step</button>
        </paep-action-group>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-action-group label="Record actions (RTL)">
            <button paepButton>Edit</button>
            <button paepButton variant="destructive" icon="delete">Delete record</button>
            <button paepButton variant="primary">Save changes</button>
          </paep-action-group>
          <div class="narrow gap">
            <paep-action-group label="Record actions (RTL, narrow)">
              <button paepButton>Edit</button>
              <button paepButton variant="destructive" icon="delete">Delete record</button>
              <button paepButton variant="primary">Save changes</button>
            </paep-action-group>
          </div>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 5);
    }
    .gap {
      margin-block-start: var(--paep-space-4);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class ActionGroupSpecimen {
  protected readonly meta = ACTION_GROUP_META;
  protected readonly last = signal('none');
  protected readonly exporting = signal(false);

  protected ran(action: string): void {
    this.last.set(action);
  }

  protected export(): void {
    this.exporting.set(true);
    setTimeout(() => {
      this.exporting.set(false);
      this.ran('Export');
    }, 1500);
  }
}
