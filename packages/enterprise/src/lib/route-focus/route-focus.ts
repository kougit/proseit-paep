import { DOCUMENT, DestroyRef, Injectable, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PaepAnnouncer } from '@proseit/paep-foundation';
import { PaepShellText } from '../shell/shell-text';

/**
 * Route focus and announcement (HOF-IB3-001 E-14, SCR-SHELL-020): after every navigation except the first page
 * load, focus moves to the new page `h1` (tabindex −1) inside the shell main region, and "{title} page" is announced
 * politely once. Without an `h1` focus goes to the main region. Composes `PaepAnnouncer`.
 */
@Injectable()
export class PaepRouteFocus {
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(PaepAnnouncer);
  private readonly text = inject(PaepShellText);
  private readonly injector = inject(Injector);
  private main: HTMLElement | null = null;
  private navigations = 0;

  constructor() {
    const sub = inject(Router).events.subscribe((e) => {
      if (!(e instanceof NavigationEnd)) return;
      if (this.navigations++ === 0) return;
      afterNextRender({ read: () => this.focusPage() }, { injector: this.injector });
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  /** @internal The shell registers its main region. */
  attach(main: HTMLElement | null): void {
    this.main = main;
  }

  /** Moves focus to the page heading and announces it (also used after a successful retry or context switch). */
  focusPage(): void {
    const main = this.main ?? this.document.querySelector<HTMLElement>('main');
    if (!main) return;
    const heading = main.querySelector<HTMLElement>('h1');
    const target = heading ?? main;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest' });
    const title = heading?.textContent?.trim();
    if (title) this.announcer.announce(this.text.t('paep.shell.route.announce', { title }));
  }
}
