import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaepField, PaepInput } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const TEXTAREA_META: LabSpecimenMeta = {
  id: 'textarea',
  name: 'Textarea',
  family: 'Forms',
  selector: 'textarea[paepInput]',
  exports: ['PaepInput'],
  purpose:
    'Multi-line free text such as notes and reasons. Delivered by the Input component (PaepInput) on a native <textarea>; there is no separate textarea class.',
  variants: ['default only (auto-grow is not in IB2)'],
  states: [
    'default (empty or filled)',
    'hover (border strong)',
    'focus-visible (focus ring)',
    'disabled (as Input: dashed disabled border)',
    'read-only (as Input; text fully visible and wrapping)',
    'invalid (as Input: 2px error border via the field)',
    'dirty ("Unsaved change" meta text in the field)',
    'long content (vertical scroll inside the control)',
    'narrow-width (full width)',
  ],
  keyboard: ['Native: Enter inserts a new line; Tab leaves the textarea.'],
  accessibility: [
    'Native <textarea> named and described by its paep-field (error, then help).',
    'Minimum height 5.5rem (three lines) in both densities; vertical resize only (horizontal resize is prohibited).',
    'A character count, when shown, is referenced through aria-describedby.',
  ],
  responsive: 'Fluid: fills its container.',
  rtl: 'dir="auto" recommended for user-entered free text.',
  contentKeys: ['paep.common.unsavedChange'],
  unitTests: 'packages/components/src/lib/textarea/textarea.spec.ts',
};

@Component({
  selector: 'lab-textarea-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepField, PaepInput, ReactiveFormsModule],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Default (type to mark the field dirty)">
        <paep-field label="Reason for change" help="Up to 500 characters." [dirty]="reason.dirty">
          <textarea paepInput dir="auto" maxlength="500" [formControl]="reason" aria-describedby="reason-count"></textarea>
        </paep-field>
        <p class="note" id="reason-count">{{ reason.value.length }} of 500 characters</p>
      </lab-example>
      <lab-example heading="Invalid">
        <paep-field label="Delivery notes" required error="Enter delivery notes.">
          <textarea paepInput dir="auto"></textarea>
        </paep-field>
      </lab-example>
      <lab-example heading="Read-only and disabled">
        <div class="stack">
          <paep-field label="Approval comment" readonly>
            <textarea paepInput readonly>Approved by the site lead after the stock count on the second shift. The pallet labels were checked against the delivery note.</textarea>
          </paep-field>
          <paep-field label="Internal note" help="Unavailable while the record is locked for review.">
            <textarea paepInput disabled></textarea>
          </paep-field>
        </div>
      </lab-example>
      <lab-example heading="Long content (scrolls vertically inside the control)">
        <paep-field label="Incident description">
          <textarea paepInput dir="auto" [value]="longText"></textarea>
        </paep-field>
      </lab-example>
      <lab-example heading="Compact density (minimum height unchanged)">
        <div data-paep-density="compact">
          <paep-field label="Notes"><textarea paepInput dir="auto"></textarea></paep-field>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-4);
    }
    .note {
      margin: var(--paep-space-1) 0 0;
      color: var(--paep-color-text-secondary);
      font-size: var(--paep-font-size-body-sm);
    }
  `,
})
export class TextareaSpecimen {
  protected readonly meta = TEXTAREA_META;
  protected readonly reason = new FormControl('', { nonNullable: true });
  protected readonly longText = Array.from({ length: 12 }, (_, i) => `Line ${i + 1}: pallet ${i + 1} checked at North depot.`).join('\n');
}
