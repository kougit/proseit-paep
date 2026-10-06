import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input, numberAttribute } from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES, PaepMessages, paepFormat } from '../messages/messages';

/** A count, or its state while no number is available: `loading` (spinner) or `unknown` ("–"). */
export type PaepCount = number | 'loading' | 'unknown';
/** `attention`: unread or actionable counts (strong fill). `neutral`: informational counts such as navigation items. */
export type PaepCountBadgeVariant = 'attention' | 'neutral';

/** Symbol shown while a count is unknown; its meaning is carried by the hidden text. */
const UNKNOWN_MARK = '–';

/**
 * Visible value and description of a count, shared by the count badge and the icon button: a number above `max` is
 * shown capped ("99+"); `label` is a template whose {count} receives the shown value.
 */
export function paepCountText(
  messages: PaepMessages,
  locale: string,
  count: PaepCount,
  max: number,
  label: string,
): { readonly shown: string; readonly text: string } {
  if (count === 'loading') return { shown: '', text: messages['paep.count.loading'] };
  if (count === 'unknown' || !Number.isFinite(count)) return { shown: UNKNOWN_MARK, text: messages['paep.count.unknown'] };
  const n = new Intl.NumberFormat(locale);
  const value = Math.max(0, Math.floor(count));
  const shown = value > max ? `${n.format(max)}+` : n.format(value);
  return { shown, text: paepFormat(label || messages['paep.count.items'], { count: shown }, locale) };
}

/**
 * Count next to a label: `<a href="…">Work items <paep-count-badge [count]="12" /></a>`.
 * The visible value is decorative (aria-hidden, dir="ltr", capped at "99+"); hidden text appended to the owning
 * control's name carries it (", 12 items"). While loading it shows a spinner, and when unknown "–", each with hidden
 * text. Non-interactive; for an icon-only control use the icon button's `count` input instead.
 */
@Component({
  selector: 'paep-count-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-count-badge',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'state()',
  },
  template: `
    @if (state() === 'loading') {
      <svg class="paep-count-badge__spinner" paepIcon="spinner"></svg>
    } @else {
      <span class="paep-count-badge__value" aria-hidden="true" dir="ltr">{{ display().shown }}</span>
    }
    <span class="paep-visually-hidden">{{ hiddenText() }}</span>
  `,
  styles: `
    :host {
      display: inline;
    }
    .paep-count-badge__value {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 1.25rem;
      block-size: 1.25rem;
      padding-inline: var(--paep-space-1);
      border: 1px solid transparent;
      border-radius: var(--paep-radius-full);
      background: var(--paep-color-status-error-strong);
      color: var(--paep-color-text-inverse);
      font-size: var(--paep-font-size-caption);
      font-weight: var(--paep-font-weight-label);
      font-variant-numeric: tabular-nums lining-nums;
      line-height: 1;
      white-space: nowrap;
      vertical-align: middle;
      direction: ltr;
      unicode-bidi: isolate;
    }
    :host([data-variant='neutral']) .paep-count-badge__value,
    :host([data-state='unknown']) .paep-count-badge__value {
      background: var(--paep-color-status-neutral-bg);
      color: var(--paep-color-status-neutral-fg);
      border-color: var(--paep-color-status-neutral-border);
    }
    .paep-count-badge__spinner {
      --paep-icon-size: var(--paep-size-icon-sm);
      color: var(--paep-color-status-neutral-fg);
    }
    @media (forced-colors: active) {
      .paep-count-badge__value {
        border-color: CanvasText;
      }
    }
  `,
})
export class PaepCountBadge {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly locale = inject(LOCALE_ID);

  /** The count, or `loading` / `unknown`. */
  readonly count = input.required<PaepCount>();
  /** Largest value shown in full; a larger count is shown as "{max}+". */
  readonly max = input(99, { transform: (v: unknown) => Math.max(1, Math.floor(numberAttribute(v, 99))) });
  /** Hidden-text template; {count} receives the shown value (default paep.count.items: "{count} items"). */
  readonly label = input<string>('');
  readonly variant = input<PaepCountBadgeVariant>('neutral');

  protected readonly state = computed(() => {
    const c = this.count();
    return c === 'loading' ? 'loading' : c === 'unknown' || !Number.isFinite(c) ? 'unknown' : 'count';
  });
  protected readonly display = computed(() => paepCountText(this.messages, this.locale, this.count(), this.max(), this.label()));
  /** Appended to the owning control's name: ", 12 items" (paep.count.inName with an empty name). */
  protected readonly hiddenText = computed(() => paepFormat(this.messages['paep.count.inName'], { name: '', count: this.display().text }, this.locale));
}
