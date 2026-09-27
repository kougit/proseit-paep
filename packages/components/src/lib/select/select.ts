import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { PAEP_FIELD_CONTROL } from '../field/field';
import { PaepFieldControlBase } from '../field/field-control';

/**
 * Native single select with the platform picker: `<select paepSelect><option value="">Choose…</option>…</select>`.
 * appearance: none with a decorative chevron at the inline-end (mirrors to the left in RTL). Place it in a
 * paep-field for label, help and error wiring. A native select has no read-only state: show a read-only value
 * with a read-only input[paepInput] instead.
 */
@Component({
  selector: 'select[paepSelect]',
  exportAs: 'paepSelect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PAEP_FIELD_CONTROL, useExisting: forwardRef(() => PaepSelect) }],
  host: { class: 'paep-select' },
  template: '<ng-content />',
  styleUrls: ['../input/input.css', './select.css'],
})
export class PaepSelect extends PaepFieldControlBase {}
