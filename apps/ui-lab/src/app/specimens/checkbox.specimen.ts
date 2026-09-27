import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PaepCheckbox } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const CHECKBOX_META: LabSpecimenMeta = {
  id: 'checkbox',
  name: 'Checkbox',
  family: 'Forms',
  selector: 'input[type=checkbox][paepCheckbox]',
  exports: ['PaepCheckbox'],
  purpose: 'Toggle an independent option, or agree to a statement.',
  variants: ['single', 'group inside a fieldset with a legend'],
  states: [
    'default (unchecked)',
    'checked (fill + tick glyph)',
    'indeterminate (fill + dash glyph)',
    'hover (border strong)',
    'focus-visible (ring around the box)',
    'disabled (dashed border; checked disabled uses a solid disabled fill)',
    'read-only (dashed border; checked shows a secondary-text fill; not toggleable; value still submitted)',
    'invalid (2px error border + message)',
    'long-label (wraps; the box aligns with the first line)',
  ],
  keyboard: ['Space: toggles.', 'Read-only: Space and clicks do nothing; focus still works.'],
  accessibility: [
    'Native checkbox named by its wrapping <label>; the label row gives a hit area of at least 24px.',
    'Indeterminate uses the DOM property (announced as mixed).',
    'Read-only uses aria-readonly on a click-cancelled input so the value is still submitted.',
    'Checked and indeterminate differ by glyph shape (tick vs dash), not colour alone.',
  ],
  responsive: 'Unchanged across widths.',
  rtl: 'The box sits at the inline-start (right).',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/checkbox/checkbox.spec.ts',
};

@Component({
  selector: 'lab-checkbox-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepCheckbox],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Single">
        <label><input type="checkbox" paepCheckbox name="terms" /> I confirm the stock count is complete</label>
      </lab-example>
      <lab-example heading="Group with indeterminate parent">
        <fieldset class="group">
          <legend>Notify</legend>
          <label>
            <input type="checkbox" paepCheckbox [checked]="allChecked()" [indeterminate]="someChecked()" (change)="toggleAll($event)" />
            All sites
          </label>
          <div class="nested">
            @for (site of sites; track site; let i = $index) {
              <label><input type="checkbox" paepCheckbox [checked]="selected()[i]" (change)="toggle(i)" /> {{ site }}</label>
            }
          </div>
        </fieldset>
      </lab-example>
      <lab-example heading="States">
        <div class="stack">
          <label><input type="checkbox" paepCheckbox checked /> Checked</label>
          <label><input type="checkbox" paepCheckbox [indeterminate]="true" /> Indeterminate</label>
          <label><input type="checkbox" paepCheckbox disabled /> Disabled</label>
          <label><input type="checkbox" paepCheckbox disabled checked /> Disabled and checked</label>
          <label><input type="checkbox" paepCheckbox readonly checked /> Read-only and checked (not toggleable)</label>
          <label><input type="checkbox" paepCheckbox readonly /> Read-only and unchecked</label>
        </div>
      </lab-example>
      <lab-example heading="Invalid (with a message)">
        <label>
          <input type="checkbox" paepCheckbox invalid required aria-describedby="terms-error" />
          I accept the delivery terms
        </label>
        <p class="error" id="terms-error">Accept the delivery terms to continue.</p>
      </lab-example>
      <lab-example heading="Long label">
        <label>
          <input type="checkbox" paepCheckbox />
          Include every record from every site, including the archived records from earlier reporting periods that were
          closed before the current financial year began
        </label>
      </lab-example>
      <lab-example heading="Compact density and right-to-left">
        <div class="stack">
          <div data-paep-density="compact"><label><input type="checkbox" paepCheckbox checked /> Compact (16px box)</label></div>
          <div dir="rtl"><label><input type="checkbox" paepCheckbox checked /> Box at the inline-start</label></div>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-1);
    }
    .group {
      display: grid;
      gap: var(--paep-space-1);
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .group legend {
      padding: 0;
      margin-block-end: var(--paep-space-1);
      font-weight: var(--paep-font-weight-label);
    }
    .nested {
      display: grid;
      gap: var(--paep-space-1);
      padding-inline-start: var(--paep-space-6);
    }
    .error {
      margin: var(--paep-space-1) 0 0;
      color: var(--paep-color-status-error-fg);
      font-weight: var(--paep-font-weight-label);
      font-size: var(--paep-font-size-body-sm);
    }
  `,
})
export class CheckboxSpecimen {
  protected readonly meta = CHECKBOX_META;
  protected readonly sites = ['North depot', 'Central depot', 'South depot'];
  protected readonly selected = signal<readonly boolean[]>([true, false, false]);
  protected readonly allChecked = computed(() => this.selected().every(Boolean));
  protected readonly someChecked = computed(() => this.selected().some(Boolean) && !this.allChecked());

  protected toggle(i: number): void {
    this.selected.update((s) => s.map((v, j) => (j === i ? !v : v)));
  }

  protected toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.set(this.sites.map(() => checked));
  }
}
