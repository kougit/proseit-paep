import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaepRadio, PaepRadioGroup } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const RADIO_META: LabSpecimenMeta = {
  id: 'radio',
  name: 'Radio group',
  family: 'Forms',
  selector: 'paep-radio-group, input[type=radio][paepRadio]',
  exports: ['PaepRadioGroup', 'PaepRadio'],
  purpose: 'Choose exactly one of a small set of mutually exclusive options that should stay visible.',
  variants: ['vertical (default)', 'horizontal (≤ 3 short options; wraps and so falls back to vertical)'],
  states: [
    'default (none or one selected)',
    'selected (2px brand ring + inner dot)',
    'hover (border strong)',
    'focus-visible (ring around the focused option)',
    'disabled (group or single option; dashed)',
    'read-only (dashed; selection shown with a secondary-text dot; not changeable)',
    'invalid (group error under the legend; each circle has a 2px error border)',
    'long-label (option labels wrap)',
    'narrow-width (horizontal collapses to vertical by wrapping)',
  ],
  keyboard: [
    'Tab: enters the group at the selected (or first) option; Tab again leaves the group.',
    'Arrow keys: move and select (native; ArrowLeft/Right follow RTL).',
  ],
  accessibility: [
    '<fieldset> with a <legend> (role="radiogroup" so aria-required, aria-readonly and aria-invalid are valid).',
    'Native radios sharing a name; each option named by its wrapping label.',
    'aria-describedby on the fieldset lists the group error, then the help; each option gets aria-invalid.',
    'Selected differs by an inner dot (shape), not colour alone.',
  ],
  responsive: 'Vertical at narrow widths; horizontal options wrap.',
  rtl: 'The circle sits at the inline-start (right); arrow keys follow native RTL behaviour.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/radio/radio.spec.ts',
};

@Component({
  selector: 'lab-radio-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepRadioGroup, PaepRadio, FormsModule],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Vertical with help">
        <paep-radio-group legend="Delivery method" help="Choose how the order leaves the depot.">
          @for (o of deliveries; track o.value) {
            <label><input type="radio" paepRadio name="lab-delivery" [value]="o.value" [(ngModel)]="delivery" /> {{ o.label }}</label>
          }
        </paep-radio-group>
        <p class="note">Selected: {{ delivery() }}</p>
      </lab-example>
      <lab-example heading="Horizontal (short options; wraps when narrow)">
        <paep-radio-group legend="Priority" orientation="horizontal">
          <label><input type="radio" paepRadio name="lab-priority" value="low" checked /> Low</label>
          <label><input type="radio" paepRadio name="lab-priority" value="normal" /> Normal</label>
          <label><input type="radio" paepRadio name="lab-priority" value="high" /> High</label>
        </paep-radio-group>
      </lab-example>
      <lab-example heading="Invalid and required">
        <paep-radio-group legend="Packaging" required error="Choose a packaging type." help="Pallets must be shrink-wrapped.">
          <label><input type="radio" paepRadio name="lab-pack" value="box" /> Box</label>
          <label><input type="radio" paepRadio name="lab-pack" value="pallet" /> Pallet</label>
        </paep-radio-group>
      </lab-example>
      <lab-example heading="Disabled and read-only">
        <div class="stack">
          <paep-radio-group legend="Warehouse (disabled)" disabled>
            <label><input type="radio" paepRadio name="lab-wh" value="north" checked /> North depot</label>
            <label><input type="radio" paepRadio name="lab-wh" value="south" /> South depot</label>
          </paep-radio-group>
          <paep-radio-group legend="Carrier (one option disabled)">
            <label><input type="radio" paepRadio name="lab-carrier" value="own" checked /> Own fleet</label>
            <label><input type="radio" paepRadio name="lab-carrier" value="partner" disabled /> Partner carrier (unavailable)</label>
          </paep-radio-group>
          <paep-radio-group legend="Billing site (read-only)" readonly>
            <label><input type="radio" paepRadio name="lab-bill" value="1" checked /> Site 1</label>
            <label><input type="radio" paepRadio name="lab-bill" value="2" /> Site 2</label>
          </paep-radio-group>
        </div>
      </lab-example>
      <lab-example heading="Long labels">
        <paep-radio-group legend="Return policy for damaged items">
          <label><input type="radio" paepRadio name="lab-return" value="a" /> Return the damaged items to the depot that dispatched them and record the reason on the delivery note</label>
          <label><input type="radio" paepRadio name="lab-return" value="b" /> Keep the items on site until an inspector confirms the damage</label>
        </paep-radio-group>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-radio-group legend="Delivery method" orientation="horizontal">
            <label><input type="radio" paepRadio name="lab-rtl" value="standard" checked /> Standard</label>
            <label><input type="radio" paepRadio name="lab-rtl" value="express" /> Express</label>
          </paep-radio-group>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-5);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class RadioSpecimen {
  protected readonly meta = RADIO_META;
  protected readonly deliveries = [
    { value: 'standard', label: 'Standard' },
    { value: 'express', label: 'Express' },
    { value: 'collect', label: 'Collect from North depot' },
  ];
  protected readonly delivery = signal('standard');
}
