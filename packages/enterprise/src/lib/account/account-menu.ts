import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { PaepMenu, PaepMenuGroup, PaepMenuItem, PaepMenuItemRadio, PaepMenuSeparator, PaepMenuTrigger } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_HOOKS, PAEP_SHELL_LOCALE, PAEP_SHELL_RUNTIME_CONFIG, PAEP_SHELL_SESSION } from '../ports/ports';
import { PaepShellLayout } from '../shell/shell-layout';
import { closeOnNavigation, directionLabel, languageName } from '../shell/shell-locale';
import { PaepShellText } from '../shell/shell-text';
import { isExternalHelpHref, safeHelpLinks } from '../shell/safe-links';

/**
 * Account menu (HOF-IB3-001 E-09, SCR-SHELL-010), composed on `PaepMenu` (P-02, `align="end"`): the identity header,
 * Display preferences, the language (X-05 B: below 600 px the language group, at 600 px and wider "Change language",
 * which opens the topbar language menu; with one locale the active language as text), Help (below 600 px the help
 * entries, which leave the topbar) and Sign out, which stays in the menu as "Signing out…" while the host signs out.
 * The button is named "Account: {name}"; the display name is visible at 1280 px and wider. Never hidden at 320 px.
 * Without a session provider nothing is shown.
 */
@Component({
  selector: 'paep-account-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon, PaepMenu, PaepMenuGroup, PaepMenuItem, PaepMenuItemRadio, PaepMenuSeparator, PaepMenuTrigger],
  host: { class: 'paep-account-menu' },
  template: `
    @if (session) {
      <button type="button" class="paep-account-menu__button" [paepMenuTrigger]="menu" [attr.aria-label]="buttonName()">
        <svg paepIcon="user"></svg>
        @if (displayName(); as name) {
          <span class="paep-account-menu__name" aria-hidden="true">{{ name }}</span>
        }
      </button>
      <paep-menu #menu [label]="text.t('paep.shell.account.button')" align="end">
        @if (displayName(); as name) {
          <div class="paep-account-menu__identity" role="none">{{ name }}</div>
          <hr paepMenuSeparator />
        }
        <button paepMenuItem icon="sliders" (click)="layout.preferencesOpen.set(true)">{{ text.t('paep.shell.account.preferences') }}</button>
        @if (locales().length > 1) {
          @if (layout.medium()) {
            <button paepMenuItem icon="globe" (click)="openLanguageMenu()">
              {{ text.t('paep.shell.locale.request') }}
              <span class="paep-account-menu__hint">{{ currentLanguage() }}</span>
            </button>
          } @else {
            <paep-menu-group [label]="text.t('paep.shell.locale.label')">
              @for (l of locales(); track l.tag) {
                <button paepMenuItemRadio [checked]="l.tag === locale.active()" [attr.lang]="l.tag" (select)="locale.request(l.tag)">
                  {{ l.name }} <span class="paep-account-menu__hint" lang="en">{{ l.direction }}</span>
                </button>
              }
            </paep-menu-group>
          }
        } @else {
          <div class="paep-account-menu__identity paep-account-menu__identity--language" role="none">
            {{ text.t('paep.shell.locale.button', { language: currentLanguage() }) }}
          </div>
        }
        @if (!layout.medium() && helpLinks.length) {
          <paep-menu-group [label]="text.t('paep.shell.account.help')">
            @for (link of helpLinks; track $index) {
              @if (link.href) {
                <a paepMenuItem [attr.href]="link.href" [attr.rel]="external(link.href) ? 'noopener noreferrer' : null">{{ link.label }}</a>
              } @else {
                <button paepMenuItem (click)="link.run?.()">{{ link.label }}</button>
              }
            }
          </paep-menu-group>
        } @else if (hooks?.openHelp) {
          <button paepMenuItem icon="help" (click)="openHelp()">{{ text.t('paep.shell.account.help') }}</button>
        }
        <hr paepMenuSeparator />
        <button paepMenuItem icon="sign-out" keepOpen [disabled]="signingOut()" (click)="signOut()">
          {{ signingOut() ? text.t('paep.shell.account.signingOut') : text.t('paep.shell.account.signOut') }}
        </button>
      </paep-menu>
    }
  `,
  styleUrl: './account-menu.css',
})
export class PaepAccountMenu {
  protected readonly text = inject(PaepShellText);
  protected readonly layout = inject(PaepShellLayout);
  protected readonly session = inject(PAEP_SHELL_SESSION, { optional: true });
  protected readonly hooks = inject(PAEP_SHELL_HOOKS, { optional: true });
  protected readonly locale = inject(PAEP_SHELL_LOCALE);
  private readonly rtl = inject(PAEP_SHELL_RUNTIME_CONFIG).config.localisation.rtlLocales ?? [];
  private readonly menu = viewChild(PaepMenu);
  /** Host help links under the shell link policy (internal routes and https: only). */
  protected readonly helpLinks = safeHelpLinks(this.hooks?.helpLinks);
  protected readonly external = isExternalHelpHref;

  protected readonly displayName = computed(() => this.session?.identity()?.displayName ?? '');
  protected readonly signingOut = computed(() => this.session?.signingOut?.() ?? false);
  /** "Account: {name}" (accessibility-intent §3, `paep.shell.account.button.named`, DDR-IB3-06); "Account" before the identity is known. */
  protected readonly buttonName = computed(() => {
    const name = this.displayName();
    return name ? this.text.t('paep.shell.account.button.named', { name }) : this.text.t('paep.shell.account.button');
  });
  protected readonly locales = computed(() =>
    this.locale.supported().map((tag) => ({ tag, name: languageName(tag), direction: directionLabel(tag, this.rtl) })),
  );
  /** "English (LTR)". */
  protected readonly currentLanguage = computed(() => {
    const tag = this.locale.active();
    return this.text.t('paep.shell.locale.current', { language: languageName(tag), direction: directionLabel(tag, this.rtl) });
  });

  constructor() {
    closeOnNavigation(() => this.menu()?.hide());
  }

  protected openHelp(): void {
    this.hooks?.openHelp?.();
  }

  protected openLanguageMenu(): void {
    this.layout.languageMenuRequest.update((n) => n + 1);
  }

  protected signOut(): void {
    if (!this.signingOut()) this.session?.signOut();
  }
}
