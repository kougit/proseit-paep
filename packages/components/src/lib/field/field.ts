import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Signal,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES } from '../messages/messages';

/** Contract of a control that a paep-field labels and describes (input[paepInput], textarea[paepInput], select[paepSelect]). */
export interface PaepFieldControl {
  /** The id the control renders, used by the label's `for`. */
  readonly controlId: Signal<string>;
  /** True when the control itself was marked required. */
  readonly required: Signal<boolean>;
}

export const PAEP_FIELD_CONTROL = new InjectionToken<PaepFieldControl>('PAEP_FIELD_CONTROL');

let nextId = 0;

/**
 * Form field wrapper: visible label, required marker, meta text, help, optional prefix/suffix adornments and
 * error message, wired programmatically to the projected control:
 * `<paep-field label="Quantity" help="Whole units." [error]="err"><input paepInput formControlName="qty" /></paep-field>`.
 * The control receives its id (label `for`), `aria-describedby` = error, help, prefix, suffix (in that order),
 * `aria-invalid` while an error is shown and native `required`. The error is not a live region.
 */
@Component({
  selector: 'paep-field',
  exportAs: 'paepField',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [PaepIcon],
  host: {
    class: 'paep-field',
    '[class.paep-field--invalid]': 'invalid()',
  },
  template: `
    <label class="paep-field__label" [attr.for]="control()?.controlId() ?? null">
      {{ label() }}
      @if (isRequired()) {
        <span class="paep-field__req" aria-hidden="true">*</span>
      }
      @for (text of metaTexts(); track text) {
        <span class="paep-field__meta">{{ text }}</span>
      }
    </label>
    @if (help()) {
      <p class="paep-field__help" [id]="helpId">{{ help() }}</p>
    }
    <div class="paep-field__control">
      @if (prefix()) {
        <span class="paep-field__affix paep-field__affix--prefix" [id]="prefixId">{{ prefix() }}</span>
      }
      <ng-content />
      @if (suffix()) {
        <span class="paep-field__affix paep-field__affix--suffix" [id]="suffixId">{{ suffix() }}</span>
      }
    </div>
    @if (invalid()) {
      <p class="paep-field__error" [id]="errorId">
        <svg class="paep-field__error-icon" paepIcon="error"></svg>
        <span>{{ error() }}</span>
      </p>
    }
  `,
  styleUrl: './field.css',
})
export class PaepField {
  private readonly messages = inject(PAEP_MESSAGES);

  /** Visible label (never a placeholder). */
  readonly label = input.required<string>();
  /** Help text shown below the label. */
  readonly help = input<string | null | undefined>(undefined);
  /** Error message; when set the field is invalid (2px error border, icon + text, aria-invalid). */
  readonly error = input<string | null | undefined>(undefined);
  /** Marks the control required (asterisk + native required). A control's own `required` attribute also counts. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Shows "(optional)" meta text. */
  readonly optional = input(false, { transform: booleanAttribute });
  /** Shows "(read only)" meta text (set native readonly on the control as well). */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Shows the "Unsaved change" dirty meta text. */
  readonly dirty = input(false, { transform: booleanAttribute });
  /** Prefix adornment such as a currency code; referenced by aria-describedby. */
  readonly prefix = input<string | null | undefined>(undefined);
  /** Suffix adornment such as a unit; referenced by aria-describedby. */
  readonly suffix = input<string | null | undefined>(undefined);
  /** Overrides for the meta strings (paep.common.optional / readOnly / unsavedChange). */
  readonly optionalLabel = input<string | undefined>(undefined);
  readonly readOnlyLabel = input<string | undefined>(undefined);
  readonly unsavedChangeLabel = input<string | undefined>(undefined);

  private readonly id = `paep-field-${nextId++}`;
  /** Id a control uses when it has none of its own. */
  readonly defaultControlId = `${this.id}-control`;
  protected readonly helpId = `${this.id}-help`;
  protected readonly errorId = `${this.id}-error`;
  protected readonly prefixId = `${this.id}-prefix`;
  protected readonly suffixId = `${this.id}-suffix`;

  protected readonly control = contentChild(PAEP_FIELD_CONTROL, { descendants: true });

  /** True while an error message is shown. */
  readonly invalid = computed(() => !!this.error());
  /** Required from the field or from the control. */
  readonly isRequired = computed(() => this.required() || !!this.control()?.required());
  readonly hasPrefix = computed(() => !!this.prefix());
  readonly hasSuffix = computed(() => !!this.suffix());
  /** Ids for the control's aria-describedby: error first, then help, then adornments. */
  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.invalid()) ids.push(this.errorId);
    if (this.help()) ids.push(this.helpId);
    if (this.prefix()) ids.push(this.prefixId);
    if (this.suffix()) ids.push(this.suffixId);
    return ids;
  });
  protected readonly metaTexts = computed(() => {
    const out: string[] = [];
    if (this.optional()) out.push(this.optionalLabel() ?? this.messages['paep.common.optional']);
    if (this.readonly()) out.push(this.readOnlyLabel() ?? this.messages['paep.common.readOnly']);
    if (this.dirty()) out.push(this.unsavedChangeLabel() ?? this.messages['paep.common.unsavedChange']);
    return out;
  });
}
