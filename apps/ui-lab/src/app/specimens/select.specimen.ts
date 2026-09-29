import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaepField, PaepInput, PaepSelect } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const SELECT_META: LabSpecimenMeta = {
  id: 'select',
  name: 'Native select',
  family: 'Forms',
  selector: 'select[paepSelect]',
  exports: ['PaepSelect'],
  purpose: 'Choose one option from a short, known list using the platform picker.',
  variants: ['single select only (multi-select, search and custom listboxes are out of IB2 scope)'],
  states: [
    'default (selected option or a first "Choose…" option)',
    'hover (border strong)',
    'focus-visible (focus ring)',
    'active/pressed (platform list open, rendered by the operating system)',
    'disabled (dashed disabled border)',
    'read-only (a native select has no readonly: shown as a read-only input[paepInput])',
    'invalid (2px error border via the field)',
    'long-label (closed control truncates; the platform list shows the full text)',
    'narrow-width (full width)',
    'selected (platform-rendered option list)',
  ],
  keyboard: ['Native: Alt+ArrowDown or Space opens the platform list; arrow keys change the value.'],
  accessibility: [
    'Native <select> named by the paep-field label; the chevron is decorative.',
    'The chevron is never hidden; the closed-state truncation is the one permitted truncation.',
  ],
  responsive: 'Fluid: fills its container.',
  rtl: 'The chevron moves to the inline-end (left) automatically.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/select/select.spec.ts',
};

@Component({
  selector: 'lab-select-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepField, PaepSelect, PaepInput, FormsModule],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Default and with a selected value">
        <div class="stack">
          <paep-field label="Region" required>
            <select paepSelect [(ngModel)]="region">
              <option value="">Choose a region</option>
              @for (r of regions; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </paep-field>
          <p class="note">Selected: {{ region() || 'none' }}</p>
        </div>
      </lab-example>
      <lab-example heading="Invalid">
        <paep-field label="Priority" required error="Choose a priority.">
          <select paepSelect><option value="">Choose a priority</option><option>Low</option><option>High</option></select>
        </paep-field>
      </lab-example>
      <lab-example heading="Disabled and read-only">
        <div class="stack">
          <paep-field label="Warehouse" help="Unavailable while the record is locked for review.">
            <select paepSelect disabled><option>North depot</option></select>
          </paep-field>
          <paep-field label="Warehouse" readonly help="A native select has no read-only state, so the value is shown in a read-only input.">
            <input paepInput readonly value="North depot" />
          </paep-field>
        </div>
      </lab-example>
      <lab-example heading="Long option (closed control truncates)">
        <div class="narrow">
          <paep-field label="Delivery window">
            <select paepSelect>
              <option>Weekday mornings between 06:00 and 09:00, excluding public holidays</option>
              <option>Weekday afternoons</option>
            </select>
          </paep-field>
        </div>
      </lab-example>
      <lab-example heading="Compact density">
        <div data-paep-density="compact">
          <paep-field label="Region"><select paepSelect><option>Central</option><option>North</option></select></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-field label="Region"><select paepSelect><option>Central</option><option>North</option></select></paep-field>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-4);
    }
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 4);
    }
    .note {
      margin: 0;
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class SelectSpecimen {
  protected readonly meta = SELECT_META;
  protected readonly regions = ['North', 'Central', 'South'];
  protected readonly region = signal('');
}
