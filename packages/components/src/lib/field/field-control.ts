import { Directive, HostAttributeToken, booleanAttribute, computed, inject, input } from '@angular/core';
import { PaepField, PaepFieldControl } from './field';

let nextId = 0;

/**
 * Shared behaviour of the native text controls (input/textarea[paepInput], select[paepSelect]): inside a
 * paep-field the control takes the field's id, aria-describedby (error, help, adornments, then any
 * aria-describedby the consumer wrote), aria-invalid and required. Outside a field the same inputs work alone.
 */
@Directive({
  host: {
    '[id]': 'controlId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.required]': 'isRequired() ? "" : null',
    '[class.paep-control--prefixed]': '!!field?.hasPrefix()',
    '[class.paep-control--suffixed]': '!!field?.hasSuffix()',
  },
})
export abstract class PaepFieldControlBase implements PaepFieldControl {
  /** Element id; defaults to the field's generated id. */
  readonly id = input<string | undefined>(undefined);
  /** Marks the control invalid when it is used without a field (a field sets this from its error). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Native required; also shows the field's required marker. */
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly field = inject(PaepField, { optional: true });
  private readonly ownDescribedBy = inject(new HostAttributeToken('aria-describedby'), { optional: true });
  private readonly autoId = `paep-control-${nextId++}`;

  readonly controlId = computed(() => this.id() ?? this.field?.defaultControlId ?? this.autoId);
  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());
  protected readonly describedBy = computed(() => {
    const ids = [...(this.field?.describedBy() ?? [])];
    if (this.ownDescribedBy) ids.push(this.ownDescribedBy);
    return ids.length ? ids.join(' ') : null;
  });
}
