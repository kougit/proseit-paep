import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepField, PaepInput } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const INPUT_META: LabSpecimenMeta = {
  id: 'input',
  name: 'Input',
  family: 'Forms',
  selector: 'input[paepInput], textarea[paepInput]',
  exports: ['PaepInput'],
  purpose: 'Single-line text, number-like and identifier entry using the native input element.',
  variants: [
    'plain',
    'with prefix (paep-field prefix)',
    'with suffix (paep-field suffix)',
    'with both',
    'native types: text, email, tel, search, number-like with inputmode',
    'textarea[paepInput] delivers the Textarea component (see the Textarea page)',
  ],
  states: [
    'default (empty or filled)',
    'hover (border strong)',
    'focus-visible (focus ring)',
    'disabled (dashed disabled border, disabled fill)',
    'read-only (dashed read-only border, value at full contrast)',
    'invalid (2px error border via the field wrapper or the invalid input)',
    'narrow-width (full width; adornments keep nowrap and the input shrinks)',
  ],
  keyboard: ['Native text entry keys; Tab moves on.'],
  accessibility: [
    'Native input; the name comes from the paep-field label (the placeholder is only an example format, never the name).',
    'Adornment text is referenced by aria-describedby so units and currency codes are announced.',
    'Read-only stays focusable and copyable. Works with native forms, ngModel and reactive forms.',
  ],
  responsive: 'Fluid: fills its container; long values scroll inside the input.',
  rtl: 'Text direction follows content: dir="auto" for mixed values, dir="ltr" for identifiers, URLs and emails. Adornments swap sides.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/input/input.spec.ts',
};

@Component({
  selector: 'lab-input-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepField, PaepInput],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Plain, prefix, suffix, both">
        <div class="stack">
          <paep-field label="Batch code"><input paepInput dir="ltr" value="B-7781" /></paep-field>
          <paep-field label="Unit price" prefix="KES"><input paepInput inputmode="decimal" value="1,250.00" /></paep-field>
          <paep-field label="Net weight" suffix="kg"><input paepInput inputmode="decimal" value="87.5" /></paep-field>
          <paep-field label="Freight cost" prefix="KES" suffix="per pallet"><input paepInput inputmode="decimal" value="3,400.00" /></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Empty with an example-format placeholder">
        <paep-field label="Contact phone"><input paepInput type="tel" dir="ltr" placeholder="+000 000 000 000" /></paep-field>
      </lab-example>
      <lab-example heading="Read-only and disabled">
        <div class="stack">
          <paep-field label="Site" readonly><input paepInput readonly value="Site 2" /></paep-field>
          <paep-field label="Approval route" help="Unavailable while the record is locked for review."><input paepInput disabled value="Standard" /></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Invalid">
        <paep-field label="Quantity" required error="Quantity must be 0 or more."><input paepInput inputmode="numeric" value="-4" /></paep-field>
      </lab-example>
      <lab-example heading="Long value and narrow width">
        <div class="narrow">
          <paep-field label="Reference" prefix="REF"><input paepInput dir="ltr" value="REC-2026-000185-ATTACHMENT-ARCHIVE-0001-NORTH-DEPOT" /></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Compact density">
        <div data-paep-density="compact">
          <paep-field label="Batch code"><input paepInput dir="ltr" value="B-7781" /></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-field label="Unit price" prefix="KES"><input paepInput inputmode="decimal" dir="ltr" value="1,250.00" /></paep-field>
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
  `,
})
export class InputSpecimen {
  protected readonly meta = INPUT_META;
}
