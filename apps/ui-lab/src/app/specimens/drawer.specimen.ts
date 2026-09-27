import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepButton, PaepDialogClose, PaepDialogFooter, PaepDrawer, PaepDrawerSide, PaepDrawerSize } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const DRAWER_META: LabSpecimenMeta = {
  id: 'drawer',
  name: 'Drawer',
  family: 'Overlay',
  selector: 'paep-drawer (footer: paep-dialog-footer, [paepDialogClose])',
  exports: ['PaepDrawer', 'PaepDrawerSide', 'PaepDrawerSize'],
  purpose: 'Show supplementary detail or a secondary task beside the current context without leaving it.',
  variants: ['side end (default)', 'side start', 'md 30 rem (default)', 'lg 40 rem'],
  states: [
    'open (modal, focus inside)',
    'long-content (body scrolls; header and footer fixed)',
    'busy (Escape and Cancel suppressed while saving)',
    'focus-visible',
    'long-label (title wraps)',
    'narrow-width (< 600 px: full width and full height; footer buttons stacked)',
    'invalid (form errors in the body)',
  ],
  keyboard: ['Tab / Shift+Tab: contained within the drawer (native modal).', 'Escape: closes (suppressed while busy).'],
  accessibility: [
    'Native modal <dialog> with aria-labelledby = title; close icon button named "Close".',
    'Focus entry: the title (tabindex=-1), or the first field when the drawer holds a form. Focus returns to the invoker.',
    'Non-modal persistent side panels are shell patterns (IB3), not this component.',
  ],
  responsive: 'Desktop 30 / 40 rem; tablet min(30 rem, 100vw - 48 px) keeps a strip of context visible; below 600 px full width.',
  rtl: 'end = left in RTL; the slide direction mirrors; the shadow is symmetric.',
  contentKeys: ['paep.common.close', 'paep.common.cancel'],
  unitTests: 'packages/components/src/lib/drawer/drawer.spec.ts',
};

@Component({
  selector: 'lab-drawer-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepDrawer, PaepDialogFooter, PaepDialogClose, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Detail drawer (end, md, long content)">
        <div class="row">
          <button paepButton (click)="openDetail('end', 'md')">Show Record 1 details</button>
          <button paepButton (click)="openDetail('end', 'lg')">Show details (lg)</button>
          <button paepButton (click)="openDetail('start', 'md')">Show details (start side)</button>
        </div>
        <paep-drawer [(open)]="detailOpen" [side]="side()" [size]="size()" heading="Record 1 details">
          <dl class="dl">
            @for (n of lines; track n) {
              <dt>Field {{ n }}</dt>
              <dd>Sample value {{ n }} for Record 1 at North depot</dd>
            }
          </dl>
          <paep-dialog-footer>
            <button paepButton paepDialogClose>Close</button>
          </paep-dialog-footer>
        </paep-drawer>
      </lab-example>

      <lab-example heading="Form drawer (focus on the first field, busy while saving)">
        <button paepButton variant="primary" (click)="formOpen.set(true)">Edit Record 1</button>
        @if (saved()) {
          <p class="note" role="status">Record 1 was saved (simulated).</p>
        }
        <paep-drawer [(open)]="formOpen" heading="Edit Record 1" [busy]="saving()" (closed)="depotError.set(false)">
          <form id="lab-drawer-form" class="form" (submit)="$event.preventDefault(); save(depot.value)">
            <label for="lab-drawer-depot">Depot</label>
            <input
              #depot
              id="lab-drawer-depot"
              class="input"
              value="North depot"
              [attr.aria-invalid]="depotError() || null"
              [attr.aria-describedby]="depotError() ? 'lab-drawer-depot-error' : null"
            />
            @if (depotError()) {
              <p id="lab-drawer-depot-error" class="error">Error: enter a depot.</p>
            }
          </form>
          <paep-dialog-footer>
            <button paepButton paepDialogClose [disabled]="saving()">Cancel</button>
            <button paepButton variant="primary" type="submit" form="lab-drawer-form" [loading]="saving()">Save changes</button>
          </paep-dialog-footer>
        </paep-drawer>
      </lab-example>

      <lab-example heading="Right-to-left (end = left)">
        <div dir="rtl">
          <button paepButton (click)="rtlOpen.set(true)">Open right-to-left drawer</button>
          <paep-drawer [(open)]="rtlOpen" heading="A long drawer title that wraps when the translated text is longer">
            <p>The drawer attaches to the left edge and slides in from it.</p>
          </paep-drawer>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .note {
      margin: var(--paep-space-3) 0 0;
    }
    .dl {
      margin: 0;
    }
    .dl dt {
      font-weight: var(--paep-font-weight-label);
    }
    .dl dd {
      margin: 0 0 var(--paep-space-3);
    }
    .form {
      display: grid;
      gap: var(--paep-space-1);
    }
    .input {
      min-block-size: var(--paep-density-control-height);
      padding-inline: var(--paep-density-control-padding-inline);
      border: 1px solid var(--paep-color-border-default);
      border-radius: var(--paep-radius-sm);
      font: inherit;
    }
    .input[aria-invalid='true'] {
      border: 2px solid var(--paep-color-invalid-border);
    }
    .error {
      margin: 0;
      color: var(--paep-color-invalid-fg);
    }
  `,
})
export class DrawerSpecimen {
  protected readonly meta = DRAWER_META;
  protected readonly lines = Array.from({ length: 30 }, (_, i) => i + 1);
  protected readonly detailOpen = signal(false);
  protected readonly side = signal<PaepDrawerSide>('end');
  protected readonly size = signal<PaepDrawerSize>('md');
  protected readonly formOpen = signal(false);
  protected readonly rtlOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly depotError = signal(false);

  protected openDetail(side: PaepDrawerSide, size: PaepDrawerSize): void {
    this.side.set(side);
    this.size.set(size);
    this.detailOpen.set(true);
  }

  protected save(depot: string): void {
    this.depotError.set(!depot.trim());
    if (this.depotError() || this.saving()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
      this.formOpen.set(false);
    }, 1500);
  }
}
