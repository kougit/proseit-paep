import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaepButton, PaepField, PaepInput, PaepSelect } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const FIELD_META: LabSpecimenMeta = {
  id: 'field',
  name: 'Field wrapper',
  family: 'Forms',
  selector: 'paep-field',
  exports: ['PaepField', 'PAEP_FIELD_CONTROL', 'PaepFieldControl'],
  purpose:
    'Give every form control a visible label, required indication, help and error text, and wire them programmatically to the control.',
  variants: ['stacked (the only variant; inline labels are not provided in IB2)', 'with prefix / suffix adornments'],
  states: [
    'default (label, optional help, control)',
    'hover (control border strengthens)',
    'focus-visible (ring on the control)',
    'required (asterisk, aria-hidden; native required on the control)',
    'optional ("(optional)" meta text)',
    'disabled (label in secondary colour; control dashed; reason via help)',
    'read-only ("(read only)" meta; control dashed, value at full contrast, focusable)',
    'invalid (2px error border + error icon + message; aria-invalid)',
    'dirty ("Unsaved change" meta text)',
    'long-label (label, help and error wrap to three or more lines)',
    'narrow-width (full container width; max 40rem)',
  ],
  keyboard: ['No keys of its own; Tab goes straight to the control. Clicking the label focuses the control.'],
  accessibility: [
    '<label for> names the control; the field gives the control an id unless it has its own.',
    'aria-describedby on the control lists the error first, then help, then prefix and suffix, then any id the consumer set.',
    'aria-invalid="true" while an error is shown; the error has an icon and text (never colour only).',
    'The error is not a live region: a form-level error summary announces problems on submit.',
    'Required: visual asterisk (aria-hidden) plus native required on the control.',
  ],
  responsive: 'Full container width up to the 40rem form maximum; anatomy unchanged at 320px.',
  rtl: 'Label, help and error align to the inline-start; prefix and suffix swap sides.',
  contentKeys: ['paep.common.required', 'paep.common.optional', 'paep.common.readOnly', 'paep.common.unsavedChange'],
  unitTests: 'packages/components/src/lib/field/field.spec.ts',
};

@Component({
  selector: 'lab-field-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepField, PaepInput, PaepSelect, PaepButton, ReactiveFormsModule],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Label, required, help">
        <div class="stack">
          <paep-field label="Reference number" required help="Shown on printed documents.">
            <input paepInput value="REC-2026-000184" dir="ltr" />
          </paep-field>
          <paep-field label="Contact email" optional help="Example format shown as placeholder; the label stays visible.">
            <input paepInput type="email" dir="ltr" placeholder="name@example.org" />
          </paep-field>
        </div>
      </lab-example>
      <lab-example heading="Prefix and suffix adornments">
        <div class="stack">
          <paep-field label="Unit price" required prefix="KES"><input paepInput inputmode="decimal" value="1,250.00" /></paep-field>
          <paep-field label="Net weight" suffix="kg"><input paepInput inputmode="decimal" value="87.5" /></paep-field>
        </div>
      </lab-example>
      <lab-example heading="Validation (error on blur or submit, removed as soon as the value is valid)">
        <form class="stack" (submit)="submit($event)">
          <paep-field label="Quantity" required help="Whole units, 0 or more." [error]="quantityError()">
            <input paepInput inputmode="numeric" [formControl]="quantity" (blur)="validate()" (input)="revalidate()" />
          </paep-field>
          <div><button paepButton type="submit" variant="primary">Save quantity</button></div>
        </form>
      </lab-example>
      <lab-example heading="Read-only, disabled and dirty">
        <div class="stack">
          <paep-field label="Site" readonly help="Set by the record owner."><input paepInput readonly value="Site 2" /></paep-field>
          <paep-field label="Approval route" help="Unavailable while the record is locked for review.">
            <input paepInput disabled value="Standard" />
          </paep-field>
          <paep-field label="Region" [dirty]="region.dirty">
            <select paepSelect [formControl]="region">
              <option value="North">North</option>
              <option value="Central">Central</option>
              <option value="South">South</option>
            </select>
          </paep-field>
        </div>
      </lab-example>
      <lab-example heading="Long label, help and error">
        <paep-field
          label="The name of the person responsible for approving deliveries to this depot during the weekend"
          help="If nobody is responsible at the weekend, enter the name of the regional manager who covers the depot instead."
          error="Enter the name of a person. A team name or a shared mailbox cannot approve a delivery."
        >
          <input paepInput />
        </paep-field>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl" class="stack">
          <paep-field label="Unit price" required prefix="KES" suffix="/ unit" help="Help aligns to the inline-start.">
            <input paepInput inputmode="decimal" dir="ltr" value="1,250.00" />
          </paep-field>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-4);
    }
  `,
})
export class FieldSpecimen {
  protected readonly meta = FIELD_META;
  protected readonly quantity = new FormControl('-4', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d+$/)] });
  protected readonly region = new FormControl('Central', { nonNullable: true });
  protected readonly quantityError = signal<string | null>(null);

  protected validate(): void {
    this.quantityError.set(this.quantity.valid ? null : 'Quantity must be a whole number, 0 or more.');
  }

  /** While an error is shown, clear it as soon as the value becomes valid. */
  protected revalidate(): void {
    if (this.quantityError() && this.quantity.valid) this.quantityError.set(null);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.validate();
  }
}
