import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';

let nextId = 0;

/**
 * Radio group: `<paep-radio-group legend="Delivery"><label><input type="radio" paepRadio name="d" value="a" /> Standard</label>…</paep-radio-group>`.
 * A native fieldset + legend (role radiogroup so read-only, required and invalid can be exposed) with optional
 * help and a group error; aria-describedby lists the error, then the help. Native radios sharing a name keep
 * the platform keyboard: Tab enters at the selected (or first) option, arrow keys move and select.
 */
@Component({
  selector: 'paep-radio-group',
  exportAs: 'paepRadioGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: { class: 'paep-radio-group' },
  template: `
    <fieldset
      class="paep-radio-group__fieldset"
      role="radiogroup"
      [disabled]="disabled()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
    >
      <legend class="paep-radio-group__legend">
        {{ legend() }}
        @if (required()) {
          <span class="paep-radio-group__req" aria-hidden="true">*</span>
        }
      </legend>
      @if (help()) {
        <p class="paep-radio-group__help" [id]="helpId">{{ help() }}</p>
      }
      @if (invalid()) {
        <p class="paep-radio-group__error" [id]="errorId">
          <svg class="paep-radio-group__error-icon" paepIcon="error"></svg>
          <span>{{ error() }}</span>
        </p>
      }
      <div class="paep-radio-group__options" [class.paep-radio-group__options--horizontal]="orientation() === 'horizontal'">
        <ng-content />
      </div>
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      max-inline-size: var(--paep-layout-form-max);
    }
    .paep-radio-group__fieldset {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-1);
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .paep-radio-group__legend {
      padding: 0;
      margin-block-end: var(--paep-space-1);
      font-size: var(--paep-font-size-label);
      font-weight: var(--paep-font-weight-label);
      line-height: var(--paep-line-height-label);
    }
    .paep-radio-group__fieldset:disabled .paep-radio-group__legend {
      color: var(--paep-color-text-secondary);
    }
    .paep-radio-group__req {
      margin-inline-start: var(--paep-space-1);
      color: var(--paep-color-status-error-fg);
    }
    .paep-radio-group__help,
    .paep-radio-group__error {
      margin: 0;
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
    }
    .paep-radio-group__help {
      color: var(--paep-color-text-secondary);
    }
    .paep-radio-group__error {
      display: flex;
      align-items: flex-start;
      gap: var(--paep-space-1);
      color: var(--paep-color-status-error-fg);
      font-weight: var(--paep-font-weight-label);
    }
    .paep-radio-group__error-icon {
      --paep-icon-size: var(--paep-size-icon-sm);
      margin-block-start: calc((var(--paep-line-height-body-sm) - var(--paep-size-icon-sm)) / 2);
    }
    .paep-radio-group__options {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-1);
    }
    .paep-radio-group__options--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      column-gap: var(--paep-space-5);
    }
  `,
})
export class PaepRadioGroup {
  /** Visible group label (legend). Required: a radio group without a legend is prohibited. */
  readonly legend = input.required<string>();
  readonly help = input<string | null | undefined>(undefined);
  /** Group error; when set every option shows a 2px error border and aria-invalid. */
  readonly error = input<string | null | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  /** Disables the whole group (native fieldset disabled). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Read-only: selection shown, not changeable; values are still submitted. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Horizontal only for up to three short options; it wraps (and so falls back to vertical) when narrow. */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  private readonly id = `paep-radio-group-${nextId++}`;
  protected readonly helpId = `${this.id}-help`;
  protected readonly errorId = `${this.id}-error`;
  readonly invalid = computed(() => !!this.error());
  protected readonly describedBy = computed(() => {
    const ids = [this.invalid() ? this.errorId : '', this.help() ? this.helpId : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * Native radio option: `<input type="radio" paepRadio name="…" value="…" />`, wrapped in its label. Inside a
 * paep-radio-group it takes the group's invalid and read-only states. Works with native forms, ngModel and
 * reactive forms unchanged.
 */
@Component({
  selector: 'input[type=radio][paepRadio]',
  exportAs: 'paepRadio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'paep-choice paep-radio',
    '[class.paep-radio--readonly]': 'isReadonly()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
  template: '',
  styleUrls: ['../checkbox/checkbox.css', './radio.css'],
})
export class PaepRadio {
  /** Invalid when used outside a paep-radio-group. */
  readonly invalid = input(false, { transform: booleanAttribute });
  private readonly group = inject(PaepRadioGroup, { optional: true });
  protected readonly isInvalid = computed(() => this.invalid() || !!this.group?.invalid());
  protected readonly isReadonly = computed(() => !!this.group?.readonly());

  protected onClick(event: Event): void {
    if (this.isReadonly()) event.preventDefault();
  }

  /** Read-only groups keep Tab navigation but arrow keys must not change the selection. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isReadonly() && ARROW_KEYS.has(event.key)) event.preventDefault();
  }
}
