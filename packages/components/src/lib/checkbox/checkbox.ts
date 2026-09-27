import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, input, model } from '@angular/core';

/**
 * Native checkbox: `<label><input type="checkbox" paepCheckbox name="terms" /> I accept the terms</label>`.
 * Checked = fill + tick, indeterminate = fill + dash (set through the DOM property), read-only =
 * aria-readonly with clicks and Space cancelled while the value is still submitted, invalid = 2px error
 * border + aria-invalid. Wrap it in its label (the label row provides the ≥24px hit area); group several
 * inside a fieldset with a legend.
 */
@Component({
  selector: 'input[type=checkbox][paepCheckbox]',
  exportAs: 'paepCheckbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'paep-choice paep-checkbox',
    '[indeterminate]': 'indeterminate()',
    '[class.paep-checkbox--mixed]': 'indeterminate()',
    '[attr.aria-readonly]': 'readonly() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '(click)': 'onClick($event)',
    '(change)': 'indeterminate.set(false)',
  },
  template: '',
  styleUrl: './checkbox.css',
})
export class PaepCheckbox {
  /** Mixed state (DOM `indeterminate` property); cleared when the user toggles the box. */
  readonly indeterminate = model(false);
  /** Read-only: focusable and submitted, but not toggleable (aria-readonly). */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Invalid: 2px error border and aria-invalid; pair it with a visible error message. */
  readonly invalid = input(false, { transform: booleanAttribute });

  protected onClick(event: Event): void {
    if (this.readonly()) event.preventDefault();
  }
}
