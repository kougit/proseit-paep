import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PaepButtonType, suppressActivationWhile } from '../button/button';

/** Icon buttons are low emphasis only: there is no primary or destructive icon-only variant. */
export type PaepIconButtonVariant = 'secondary' | 'tertiary';

/**
 * Compact action with a conventional meaning: `<button paepIconButton icon="close" [label]="closeText"></button>`.
 * `label` is mandatory and becomes the accessible name (aria-label); there is no tooltip or title fallback.
 * Square target of control height (40/32 px, never below 24 px).
 */
@Component({
  selector: 'button[paepIconButton]',
  exportAs: 'paepIconButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-button paep-icon-button',
    '[class.paep-button--secondary]': 'variant() === "secondary"',
    '[class.paep-button--tertiary]': 'variant() === "tertiary"',
    '[attr.type]': 'type()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'loading() ? "true" : null',
  },
  template: `<svg class="paep-button__icon" [paepIcon]="loading() ? 'spinner' : icon()"></svg>`,
  styleUrls: ['../button/button.css', './icon-button.css'],
})
export class PaepIconButton {
  /** Icon name (decorative, aria-hidden). */
  readonly icon = input.required<PaepIconName>();
  /** Accessible name, e.g. "Close". Mandatory: an icon-only control has no visible text. */
  readonly label = input.required<string>();
  readonly variant = input<PaepIconButtonVariant>('tertiary');
  readonly type = input<PaepButtonType>('button');
  /** Busy state: spinner replaces the icon, aria-busy, activation suppressed, focus kept. */
  readonly loading = input(false, { transform: booleanAttribute });

  constructor() {
    suppressActivationWhile(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement, () => this.loading());
  }
}
