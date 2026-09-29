import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';

/** Status tones shared by feedback components. The consumer maps domain states to a tone. */
export type PaepStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/** Distinct icon shape per tone, so status never depends on colour alone (WCAG 1.4.1). */
export const PAEP_STATUS_ICONS: Readonly<Record<PaepStatusTone, PaepIconName>> = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/**
 * Status badge: `<paep-status-badge tone="success">Approved</paep-status-badge>`.
 * Non-interactive inline label; the projected text is always present and the icon is decorative. No role.
 */
@Component({
  selector: 'paep-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-status-badge',
    '[attr.data-tone]': 'tone()',
  },
  template: `<svg [paepIcon]="icon()"></svg><span class="paep-status-badge__text"><ng-content /></span>`,
  styles: `
    :host {
      --_fg: var(--paep-color-status-neutral-fg);
      --_bg: var(--paep-color-status-neutral-bg);
      --_border: var(--paep-color-status-neutral-border);
      display: inline-flex;
      align-items: flex-start;
      gap: var(--paep-space-1);
      max-inline-size: 100%;
      padding: 1px var(--paep-space-2);
      color: var(--_fg);
      background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--paep-radius-sm);
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
      font-weight: var(--paep-font-weight-label);
      vertical-align: middle;
      overflow-wrap: break-word;
    }
    :host([data-tone='info']) {
      --_fg: var(--paep-color-status-info-fg);
      --_bg: var(--paep-color-status-info-bg);
      --_border: var(--paep-color-status-info-border);
    }
    :host([data-tone='success']) {
      --_fg: var(--paep-color-status-success-fg);
      --_bg: var(--paep-color-status-success-bg);
      --_border: var(--paep-color-status-success-border);
    }
    :host([data-tone='warning']) {
      --_fg: var(--paep-color-status-warning-fg);
      --_bg: var(--paep-color-status-warning-bg);
      --_border: var(--paep-color-status-warning-border);
    }
    :host([data-tone='error']) {
      --_fg: var(--paep-color-status-error-fg);
      --_bg: var(--paep-color-status-error-bg);
      --_border: var(--paep-color-status-error-border);
    }
    svg {
      --paep-icon-size: var(--paep-font-size-body-sm);
      margin-block-start: 2px;
    }
    .paep-status-badge__text {
      min-inline-size: 0;
    }
  `,
})
export class PaepStatusBadge {
  /** Visual tone; the text carries the meaning. */
  readonly tone = input<PaepStatusTone>('neutral');
  protected readonly icon = computed(() => PAEP_STATUS_ICONS[this.tone()]);
}
