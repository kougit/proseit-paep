import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { PAEP_FIELD_CONTROL } from '../field/field';
import { PaepFieldControlBase } from '../field/field-control';

/**
 * Native text entry: `<input paepInput />` for single-line values and `<textarea paepInput></textarea>` for
 * multi-line text (min 5.5rem, vertical resize only). Place it in a paep-field for its label, help, error and
 * prefix/suffix adornments. Native value, readonly, disabled, forms (template-driven, reactive and native
 * submission) stay untouched. States: read-only = dashed read-only border, value at full contrast; disabled =
 * dashed disabled border; invalid = 2px error border.
 */
@Component({
  selector: 'input[paepInput], textarea[paepInput]',
  exportAs: 'paepInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PAEP_FIELD_CONTROL, useExisting: forwardRef(() => PaepInput) }],
  host: { class: 'paep-input' },
  template: '',
  styleUrl: './input.css',
})
export class PaepInput extends PaepFieldControlBase {}
