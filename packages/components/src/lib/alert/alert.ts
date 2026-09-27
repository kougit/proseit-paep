import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, inject, input, output, signal } from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES } from '../messages/messages';
import { PAEP_STATUS_ICONS } from '../status-badge/status-badge';

export type PaepAlertStatus = 'info' | 'success' | 'warning' | 'error';

/**
 * Persistent inline feedback: `<paep-alert status="warning" heading="…">Body <button paepAlertActions>…</button></paep-alert>`.
 * An alert present at load is static content (no live role). Set `live` when the alert is inserted dynamically:
 * errors then use role="alert", other statuses role="status". Error alerts are never dismissible.
 */
@Component({
  selector: 'paep-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-alert',
    '[attr.data-status]': 'status()',
    '[attr.role]': 'role()',
    '[attr.hidden]': 'closed() ? "" : null',
  },
  template: `
    <svg class="paep-alert__icon" [paepIcon]="icon()"></svg>
    <div class="paep-alert__body">
      <span class="paep-visually-hidden">{{ statusWord() }}</span>
      @if (heading()) {
        <p class="paep-alert__title">{{ heading() }}</p>
      }
      <div class="paep-alert__content"><ng-content /></div>
      <div class="paep-alert__actions"><ng-content select="[paepAlertActions]" /></div>
    </div>
    @if (canDismiss()) {
      <button type="button" class="paep-alert__dismiss" (click)="dismiss()">
        <svg paepIcon="close"></svg><span class="paep-visually-hidden">{{ dismissText() }}</span>
      </button>
    }
  `,
  styles: `
    :host {
      --_fg: var(--paep-color-status-info-fg);
      --_bg: var(--paep-color-status-info-bg);
      --_border: var(--paep-color-status-info-border);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: var(--paep-space-3);
      align-items: start;
      padding: var(--paep-space-3) var(--paep-space-4);
      color: var(--paep-color-text-primary);
      background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--paep-radius-md);
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }
    :host([hidden]) {
      display: none;
    }
    :host([data-status='success']) {
      --_fg: var(--paep-color-status-success-fg);
      --_bg: var(--paep-color-status-success-bg);
      --_border: var(--paep-color-status-success-border);
    }
    :host([data-status='warning']) {
      --_fg: var(--paep-color-status-warning-fg);
      --_bg: var(--paep-color-status-warning-bg);
      --_border: var(--paep-color-status-warning-border);
    }
    :host([data-status='error']) {
      --_fg: var(--paep-color-status-error-fg);
      --_bg: var(--paep-color-status-error-bg);
      --_border: var(--paep-color-status-error-border);
    }
    .paep-alert__icon {
      color: var(--_fg);
    }
    .paep-alert__body {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-1);
      min-inline-size: 0;
    }
    .paep-alert__title {
      margin: 0;
      font-weight: var(--paep-font-weight-label);
    }
    .paep-alert__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
      margin-block-start: var(--paep-space-2);
    }
    .paep-alert__actions:empty {
      display: none;
    }
    .paep-alert__dismiss {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: var(--paep-density-control-height);
      block-size: var(--paep-density-control-height);
      margin: calc(var(--paep-space-2) * -1);
      margin-inline-start: 0;
      padding: 0;
      color: var(--paep-color-text-primary);
      background: transparent;
      border: 0;
      border-radius: var(--paep-radius-sm);
      cursor: pointer;
      transition: background-color var(--paep-motion-duration-fast) var(--paep-motion-easing-standard);
    }
    .paep-alert__dismiss:hover {
      background: var(--paep-color-hover-neutral);
    }
    .paep-alert__dismiss:active {
      background: var(--paep-color-active-neutral);
    }
  `,
})
export class PaepAlert {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly status = input<PaepAlertStatus>('info');
  /** Optional title (heading="…") shown above the body. */
  readonly heading = input<string>('');
  /** Set when the alert is inserted dynamically, so it is announced (role=alert for error, role=status otherwise). */
  readonly live = input(false, { transform: booleanAttribute });
  /** Shows a dismiss button (ignored for error alerts, which stay until the error is resolved). */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Element to focus after dismissal (usually the region heading); made programmatically focusable if needed. */
  readonly focusAfterDismiss = input<HTMLElement | null | undefined>(undefined);
  /** Overrides the visually hidden status word (default paep.status.*). */
  readonly statusLabel = input<string>('');
  /** Overrides the dismiss button name (default paep.common.dismiss). */
  readonly dismissLabel = input<string>('');

  /** Emits after the user dismisses the alert. */
  readonly dismissed = output<void>();

  protected readonly closed = signal(false);
  protected readonly icon = computed(() => PAEP_STATUS_ICONS[this.status()]);
  protected readonly role = computed(() => (this.live() ? (this.status() === 'error' ? 'alert' : 'status') : null));
  protected readonly canDismiss = computed(() => this.dismissible() && this.status() !== 'error');
  protected readonly statusWord = computed(() => this.statusLabel() || this.messages[`paep.status.${this.status()}`]);
  protected readonly dismissText = computed(() => this.dismissLabel() || this.messages['paep.common.dismiss']);

  /** Moves focus to the alert (for an error summary after a failed submit). */
  focus(): void {
    const el = this.host.nativeElement;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus();
  }

  protected dismiss(): void {
    this.closed.set(true);
    this.dismissed.emit();
    const target = this.focusAfterDismiss();
    if (target) {
      if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus();
    }
  }
}
