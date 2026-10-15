import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaepButton, PaepEmptyState } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_LOCK_ICONS } from '../nav/nav';
import { PAEP_SHELL_HOOKS, PAEP_SHELL_NAVIGATION, type PaepShellLockReason } from '../ports/ports';
import { PaepShellText } from '../shell/shell-text';

let nextLockId = 0;

/**
 * Locked state (HOF-IB3-001 E-10, SCR-SHELL-012): explains why a capability is shown but not usable, for one of the
 * four reasons. It is presentation only and always says that the server decides access.
 *
 * - `level="page"`: the explanation page with the `h1` route-focus target, the reason, the fixed explanation, the
 *   default explanation action (only when the host supplies `explainLock`) and "Go to Home".
 * - `level="section"`: the same explanation inside a page, composed on `PaepEmptyState kind="unavailable"` (P-06).
 *
 * - `level="action"`: wraps one control,
 *   `<paep-locked-state level="action" reason="permission" heading="Delete record"><button paepButton>Delete record</button></paep-locked-state>`.
 *   The control stays focusable with `aria-disabled="true"`, its activation is suppressed, and the reason text beside
 *   it is its description.
 *
 * The navigation-item level is part of `PaepShellNav`. Every level is a usability hint only; the server still decides.
 */
@Component({
  selector: 'paep-locked-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaepButton, PaepEmptyState, PaepIcon],
  host: { class: 'paep-locked', '[attr.data-reason]': 'reason()', '[attr.data-level]': 'level()' },
  template: `
    @if (level() === 'action') {
      <ng-content />
      <span class="paep-locked__reason" [id]="headingId">{{ reasonText() }}</span>
    } @else if (level() === 'page') {
      <section class="paep-locked__page" [attr.aria-labelledby]="headingId">
        <span class="paep-locked__reason"><svg [paepIcon]="icon()"></svg>{{ reasonText() }}</span>
        <h1 class="paep-locked__heading" [id]="headingId" tabindex="-1">{{ heading() }}</h1>
        <p>{{ body() }}</p>
        <p class="paep-locked__server">{{ text.t('paep.shell.locked.server') }}</p>
        <div class="paep-locked__actions">
          @if (hooks?.explainLock) {
            <button paepButton variant="primary" (click)="explain()">{{ actionText() }}</button>
          }
          <a paepButton variant="tertiary" [routerLink]="home">{{ text.t('paep.shell.error.home') }}</a>
        </div>
      </section>
    } @else {
      <paep-empty-state kind="unavailable" [icon]="icon()" [heading]="heading()" [reason]="reasonText()" [description]="body()" [headingLevel]="2" />
      <p class="paep-locked__server paep-locked__server--section">{{ text.t('paep.shell.locked.server') }}</p>
    }
  `,
  styleUrl: './locked-state.css',
})
export class PaepLockedState {
  protected readonly text = inject(PaepShellText);
  protected readonly hooks = inject(PAEP_SHELL_HOOKS, { optional: true });
  protected readonly home = inject(PAEP_SHELL_NAVIGATION).home;
  protected readonly headingId = `paep-locked-${nextLockId++}`;

  readonly reason = input.required<PaepShellLockReason>();
  /** Name of the locked area, e.g. "Archive". */
  readonly heading = input.required<string>();
  readonly level = input<'page' | 'section' | 'action'>('page');

  protected readonly icon = computed(() => PAEP_SHELL_LOCK_ICONS[this.reason()]);
  protected readonly reasonText = computed(() => this.text.t(`paep.shell.locked.${this.reason()}`));
  protected readonly body = computed(() => this.text.t(`paep.shell.locked.${this.reason()}.body`));
  protected readonly actionText = computed(() => this.text.t(`paep.shell.locked.${this.reason()}.action`));

  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Capture phase, so the wrapped control's own click handler never runs while it is locked.
    this.host.addEventListener('click', (e) => this.onClick(e), true);
    afterRenderEffect(() => {
      const control = this.control();
      if (!control) return;
      control.setAttribute('aria-disabled', 'true');
      control.setAttribute('aria-describedby', this.headingId);
    });
  }

  protected explain(): void {
    this.hooks?.explainLock?.(this.reason());
  }

  private onClick(event: Event): void {
    const control = this.control();
    if (control && event.target instanceof Node && control.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  /** The wrapped control at the action level. */
  private control(): HTMLElement | null {
    return this.level() === 'action' ? this.host.querySelector<HTMLElement>('button, a[href]') : null;
  }
}
