import { ChangeDetectionStrategy, Component, DOCUMENT, Injector, afterNextRender, computed, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PaepButton } from '@proseit/paep-components';
import { PaepAnnouncer, PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_NAVIGATION } from '../ports/ports';
import { PaepRouteFocus } from '../route-focus/route-focus';
import { PaepShellText } from '../shell/shell-text';
import { PaepShellErrors } from './shell-errors';

/**
 * Error boundary of the main region (HOF-IB3-001 E-11a, SCR-SHELL-013). It hosts the routed page (its own
 * `router-outlet`). While the shell holds an error it removes the page and shows fixed text for the kind (render,
 * route-load, version), the correlation reference, and the safe actions: "Try again" for retryable render errors,
 * "Reload page" for load and version failures, and "Go to Home". Focus goes to the error `h1` and the heading is
 * announced assertively once. No stack, server message or resource detail is shown.
 * `<main><paep-error-boundary /></main>`
 */
@Component({
  selector: 'paep-error-boundary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, PaepButton, PaepIcon],
  host: { class: 'paep-error-boundary' },
  template: `
    @if (!error()) {
      <router-outlet />
    }
    @if (error(); as e) {
      <section class="paep-error-page" aria-labelledby="paep-error-title">
        <svg paepIcon="error"></svg>
        <h1 id="paep-error-title" class="paep-error-page__title" tabindex="-1">{{ copy().title }}</h1>
        <p>{{ copy().body }}</p>
        @if (e.kind !== 'version') {
          <p class="paep-error-page__ref">
            {{ text.t('paep.shell.error.reference') }}: <code dir="ltr">{{ e.correlationId }}</code>
          </p>
        }
        <div class="paep-error-page__actions">
          @if (e.kind === 'render' && e.retryable) {
            <button paepButton variant="primary" icon="retry" (click)="retry()">{{ text.t('paep.shell.error.retry') }}</button>
          } @else if (e.kind !== 'render') {
            <button paepButton variant="primary" icon="retry" (click)="reload()">{{ text.t('paep.shell.error.reload') }}</button>
          }
          <a paepButton [routerLink]="home" (click)="errors.clear()">{{ text.t('paep.shell.error.home') }}</a>
        </div>
      </section>
    }
  `,
  styleUrl: './error.css',
})
export class PaepErrorBoundary {
  protected readonly text = inject(PaepShellText);
  protected readonly errors = inject(PaepShellErrors);
  protected readonly home = inject(PAEP_SHELL_NAVIGATION).home;
  private readonly focus = inject(PaepRouteFocus);
  private readonly announcer = inject(PaepAnnouncer);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  protected readonly error = this.errors.current;

  protected readonly copy = computed(() => {
    switch (this.error()?.kind) {
      case 'route-load':
        return { title: this.text.t('paep.shell.error.chunk'), body: this.text.t('paep.shell.error.chunk.body') };
      case 'version':
        return { title: this.text.t('paep.shell.error.version'), body: this.text.t('paep.shell.error.version.body') };
      default:
        return { title: this.text.t('paep.shell.error.title'), body: this.text.t('paep.shell.error.body') };
    }
  });

  constructor() {
    let shown: string | null = null;
    effect(() => {
      const e = this.error();
      untracked(() => {
        if (!e || e.correlationId === shown) {
          shown = e?.correlationId ?? null;
          return;
        }
        shown = e.correlationId;
        this.announcer.announce(this.copy().title, 'assertive');
        afterNextRender({ write: () => this.document.getElementById('paep-error-title')?.focus() }, { injector: this.injector });
      });
    });
  }

  /** Re-renders the current route; on success focus goes to the re-rendered `h1`. */
  protected retry(): void {
    // Clearing the error re-creates the outlet, which renders the current route again.
    this.errors.clear();
    afterNextRender({ read: () => (this.errors.current() ? undefined : this.focus.focusPage()) }, { injector: this.injector });
  }

  protected reload(): void {
    this.document.defaultView?.location.reload();
  }
}
