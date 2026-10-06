import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaepButton } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_NAVIGATION } from '../ports/ports';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';

/**
 * Not-found page (HOF-IB3-001 E-11b, SCR-SHELL-013): fixed text, "Go to Home" and "Search or go to…" (opens the
 * command palette). Use it as the app's wildcard route:
 * `{ path: '**', component: PaepNotFound, title: 'Page not found' }`. It reveals nothing about the requested address.
 */
@Component({
  selector: 'paep-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaepButton, PaepIcon],
  host: { class: 'paep-not-found' },
  template: `
    <section class="paep-error-page" aria-labelledby="paep-not-found-title">
      <svg paepIcon="no-results"></svg>
      <h1 id="paep-not-found-title" class="paep-error-page__title" tabindex="-1">{{ text.t('paep.shell.notFound.title') }}</h1>
      <p>{{ text.t('paep.shell.notFound.body') }}</p>
      <div class="paep-error-page__actions">
        <a paepButton variant="primary" icon="home" [routerLink]="home">{{ text.t('paep.shell.error.home') }}</a>
        <button paepButton icon="search" aria-haspopup="dialog" (click)="layout.paletteOpen.set(true)">{{ text.t('paep.shell.search.trigger') }}</button>
      </div>
    </section>
  `,
  styleUrl: './error.css',
})
export class PaepNotFound {
  protected readonly text = inject(PaepShellText);
  protected readonly home = inject(PAEP_SHELL_NAVIGATION).home;
  protected readonly layout = inject(PaepShellLayout);
}
