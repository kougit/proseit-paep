import { ChangeDetectionStrategy, Component, ElementRef, LOCALE_ID, booleanAttribute, computed, inject, input } from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PaepButtonType, suppressActivationWhile } from '../button/button';
import { PaepCount, PaepCountBadge, PaepCountBadgeVariant, paepCountText } from '../count-badge/count-badge';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';

/** Icon buttons are low emphasis only: there is no primary or destructive icon-only variant. */
export type PaepIconButtonVariant = 'secondary' | 'tertiary';

/**
 * Compact action with a conventional meaning: `<button paepIconButton icon="close" [label]="closeText"></button>`.
 * `label` is mandatory and becomes the accessible name (aria-label); there is no tooltip or title fallback.
 * Square target of control height (40/32 px, never below 24 px). An optional `count` shows a count badge at the
 * inline-end corner and is appended to the name ("Notifications, 3 unread"); the badge itself is decorative, and a
 * zero count shows no badge.
 */
@Component({
  selector: 'button[paepIconButton]',
  exportAs: 'paepIconButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon, PaepCountBadge],
  host: {
    class: 'paep-button paep-icon-button',
    '[class.paep-button--secondary]': 'variant() === "secondary"',
    '[class.paep-button--tertiary]': 'variant() === "tertiary"',
    '[attr.type]': 'type()',
    '[attr.aria-label]': 'name()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'loading() ? "true" : null',
  },
  template: `
    <svg class="paep-button__icon" [paepIcon]="loading() ? 'spinner' : icon()"></svg>
    @if (badge(); as c) {
      <span class="paep-icon-button__count" aria-hidden="true">
        <paep-count-badge [count]="c" [label]="countLabel()" [variant]="countVariant()" />
      </span>
    }
  `,
  styleUrls: ['../button/button.css', './icon-button.css'],
})
export class PaepIconButton {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly locale = inject(LOCALE_ID);

  /** Icon name (decorative, aria-hidden). */
  readonly icon = input.required<PaepIconName>();
  /** Accessible name, e.g. "Close". Mandatory: an icon-only control has no visible text. */
  readonly label = input.required<string>();
  readonly variant = input<PaepIconButtonVariant>('tertiary');
  readonly type = input<PaepButtonType>('button');
  /** Busy state: spinner replaces the icon, aria-busy, activation suppressed, focus kept. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Optional count badge: a number (capped at "99+"), `loading` or `unknown`; 0, null or undefined shows none. */
  readonly count = input<PaepCount | null | undefined>(undefined);
  /** Template of the count in the name; {count} receives the shown value (default paep.count.items). */
  readonly countLabel = input<string>('');
  /** Badge emphasis; unread or actionable counts on icon buttons use `attention`. */
  readonly countVariant = input<PaepCountBadgeVariant>('attention');

  protected readonly badge = computed(() => {
    const c = this.count();
    return c === null || c === undefined || c === 0 ? null : c;
  });
  protected readonly name = computed(() => {
    const c = this.badge();
    if (c === null) return this.label();
    const text = paepCountText(this.messages, this.locale, c, 99, this.countLabel()).text;
    return paepFormat(this.messages['paep.count.inName'], { name: this.label(), count: text }, this.locale);
  });

  constructor() {
    suppressActivationWhile(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement, () => this.loading());
  }
}
