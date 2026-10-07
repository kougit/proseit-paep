import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, untracked, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PaepButton,
  PaepIconButton,
  PaepMenu,
  PaepMenuGroup,
  PaepMenuItem,
  PaepMenuItemRadio,
  PaepMenuTrigger,
  PaepStatusBadge,
} from '@proseit/paep-components';
import { PaepAnnouncer, PaepIcon } from '@proseit/paep-foundation';
import { PaepAccountMenu } from '../account/account-menu';
import { PaepContextSwitcher } from '../context/context-switcher';
import { PaepNotificationPanel } from '../notifications/notification-panel';
import { PAEP_SHELL_HOOKS, PAEP_SHELL_LOCALE, PAEP_SHELL_NAVIGATION, PAEP_SHELL_RUNTIME_CONFIG } from '../ports/ports';
import { connectivitySignal, environmentLabel } from '../status/status-strip';
import { PaepShellLayout } from '../shell/shell-layout';
import { closeOnNavigation, directionLabel, languageCode, languageName } from '../shell/shell-locale';
import { PaepShellText } from '../shell/shell-text';

/** Visible shortcut hint and aria-keyshortcuts of the palette (Q-12). */
function shortcutHint(nav: Navigator | undefined, text: PaepShellText): string {
  const apple = /Mac|iPhone|iPad/.test(nav?.platform ?? nav?.userAgent ?? '');
  return apple ? '⌘ K' : text.t('paep.shell.search.shortcut');
}

/**
 * Topbar (banner) of the shell (HOF-IB3-001 E-02, SCR-SHELL-001/-005): navigation toggle (below 1024 px), product
 * link with the app's mark and name, environment badge (non-production), context, the search trigger (field-style
 * at ≥ 1024 px, an icon button below), the online indicator, the language menu (X-05 B: at 600 px and wider, with
 * more than one locale), help (a menu of the host's help links, or the host's help request), any global actions the
 * app projects, notifications (E-07) and the account menu (E-09). Below 600 px language and help move into the account
 * menu. Overflow follows interaction-notes §7; the never-hidden set (navigation toggle, search, notifications with
 * count, account with sign-out) stays visible at 320 px. There is no `role="toolbar"`: each control is a Tab stop.
 * After the app applies a language the shell announces "Language changed to {language}" in that language.
 *
 * Slots: `[paepShellMark]` (the product's approved mark), `[paepShellLanguage]` and `[paepShellActions]` (app
 * controls before notifications).
 */
@Component({
  selector: 'paep-shell-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PaepButton,
    PaepIcon,
    PaepIconButton,
    PaepMenu,
    PaepMenuGroup,
    PaepMenuItem,
    PaepMenuItemRadio,
    PaepMenuTrigger,
    PaepStatusBadge,
    PaepAccountMenu,
    PaepContextSwitcher,
    PaepNotificationPanel,
  ],
  host: { class: 'paep-shell-topbar' },
  template: `
    <header class="paep-shell-topbar__bar">
      @if (!layout.wide()) {
        <button
          #navToggle
          paepIconButton
          icon="menu"
          class="paep-shell-topbar__nav-toggle"
          [label]="text.t('paep.shell.nav.open')"
          [attr.aria-expanded]="layout.sheetOpen()"
          [attr.aria-controls]="layout.sheetOpen() ? 'paep-shell-nav-sheet' : null"
          (click)="layout.sheetOpen.set(true)"
        ></button>
      }
      <a class="paep-shell-topbar__product" [routerLink]="home" [attr.aria-label]="text.t('paep.shell.banner.product.home', { product: product })">
        <span class="paep-shell-topbar__mark" aria-hidden="true"><ng-content select="[paepShellMark]" /></span>
        <span class="paep-shell-topbar__name" aria-hidden="true">{{ product }}</span>
      </a>
      @if (environment(); as env) {
        @if (layout.medium()) {
          <paep-status-badge class="paep-shell-topbar__env" tone="warning">{{ env }}</paep-status-badge>
        }
      }
      @if (layout.medium()) {
        <paep-context-switcher class="paep-shell-topbar__context" />
      }
      <search class="paep-shell-topbar__search">
        @if (layout.wide()) {
          <button
            paepButton
            variant="field"
            class="paep-shell-topbar__search-field"
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K Meta+K"
            [keyHint]="shortcut"
            (click)="layout.paletteOpen.set(true)"
          >
            {{ text.t('paep.shell.search.trigger') }}
          </button>
        } @else {
          <button
            paepIconButton
            icon="search"
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K Meta+K"
            [label]="text.t('paep.shell.search.trigger')"
            (click)="layout.paletteOpen.set(true)"
          ></button>
        }
      </search>
      <span class="paep-shell-topbar__spacer"></span>
      <div class="paep-shell-topbar__actions">
        @if (layout.medium() && connectivity() === 'online') {
          <span class="paep-shell-topbar__online" role="img" [attr.aria-label]="text.t('paep.shell.connectivity.online')">
            <svg paepIcon="signal"></svg>
            @if (layout.wide()) {
              <span aria-hidden="true">{{ text.t('paep.shell.connectivity.online') }}</span>
            }
          </span>
        }
        @if (layout.medium() && locales().length > 1) {
          <button
            #languageButton
            paepButton
            variant="tertiary"
            icon="globe"
            class="paep-shell-topbar__language"
            [paepMenuTrigger]="languageMenu"
            [attr.aria-label]="text.t('paep.shell.locale.button', { language: activeName() })"
          >{{ activeCode() }}</button>
          <paep-menu #languageMenu [label]="text.t('paep.shell.locale.label')" align="end">
            <paep-menu-group [label]="text.t('paep.shell.locale.label')">
              @for (l of locales(); track l.tag) {
                <button paepMenuItemRadio [checked]="l.tag === locale.active()" [attr.lang]="l.tag" (select)="locale.request(l.tag)">
                  {{ l.name }} <span class="paep-shell-topbar__hint" lang="en">{{ l.direction }}</span>
                </button>
              }
            </paep-menu-group>
          </paep-menu>
        }
        <ng-content select="[paepShellLanguage]" />
        @if (layout.medium()) {
          @if (helpLinks.length) {
            <button paepIconButton icon="help" [label]="text.t('paep.shell.help.button')" [paepMenuTrigger]="helpMenu"></button>
            <paep-menu #helpMenu [label]="text.t('paep.shell.help.button')" align="end">
              @for (link of helpLinks; track $index) {
                @if (link.href) {
                  <a paepMenuItem [attr.href]="link.href">{{ link.label }}</a>
                } @else {
                  <button paepMenuItem (click)="link.run?.()">{{ link.label }}</button>
                }
              }
            </paep-menu>
          } @else if (hooks?.openHelp) {
            <button paepIconButton icon="help" [label]="text.t('paep.shell.help.button')" (click)="help()"></button>
          }
        }
        <ng-content select="[paepShellActions]" />
        <paep-notification-panel />
        <paep-account-menu />
      </div>
    </header>
  `,
  styleUrl: './topbar.css',
})
export class PaepShellTopbar {
  protected readonly text = inject(PaepShellText);
  protected readonly layout = inject(PaepShellLayout);
  protected readonly hooks = inject(PAEP_SHELL_HOOKS, { optional: true });
  protected readonly helpLinks = this.hooks?.helpLinks ?? [];
  protected readonly home = inject(PAEP_SHELL_NAVIGATION).home;
  private readonly config = inject(PAEP_SHELL_RUNTIME_CONFIG).config;
  private readonly navToggle = viewChild<ElementRef<HTMLElement>>('navToggle');
  protected readonly locale = inject(PAEP_SHELL_LOCALE);
  private readonly rtl = this.config.localisation.rtlLocales ?? [];
  private readonly languageButton = viewChild('languageButton', { read: ElementRef<HTMLElement> });
  private readonly languageMenu = viewChild<PaepMenu>('languageMenu');
  private readonly helpMenu = viewChild<PaepMenu>('helpMenu');
  protected readonly locales = computed(() =>
    this.locale.supported().map((tag) => ({ tag, name: languageName(tag), direction: directionLabel(tag, this.rtl) })),
  );
  protected readonly activeName = computed(() => languageName(this.locale.active()));
  protected readonly activeCode = computed(() => languageCode(this.locale.active()));
  protected readonly product = this.config.product.name;
  protected readonly connectivity = connectivitySignal();
  protected readonly shortcut = shortcutHint(inject(ElementRef).nativeElement.ownerDocument.defaultView?.navigator, this.text);
  protected readonly environment = computed(() => {
    const env = this.config.deployment.environment;
    return env === 'production' ? null : this.text.t('paep.shell.env.badge', { environment: environmentLabel(env) });
  });

  constructor() {
    closeOnNavigation(() => {
      this.languageMenu()?.hide();
      this.helpMenu()?.hide();
    });
    // "Change language" in the account menu opens the topbar language menu.
    effect(() => {
      if (!this.layout.languageMenuRequest()) return;
      untracked(() => {
        const button = this.languageButton()?.nativeElement;
        if (button) setTimeout(() => this.languageMenu()?.show(button, 'first'));
      });
    });
    // Once the app has applied another language: announce it politely, in the new language.
    const announcer = inject(PaepAnnouncer);
    let previous = this.locale.active();
    effect(() => {
      const active = this.locale.active();
      untracked(() => {
        if (active === previous) return;
        previous = active;
        announcer.announce(this.text.t('paep.shell.locale.changed', { language: languageName(active) }));
      });
    });
  }

  /** Focuses the Open navigation button (focus return after the sheet closes). */
  focusNavToggle(): void {
    this.navToggle()?.nativeElement.focus();
  }

  protected help(): void {
    this.hooks?.openHelp?.();
  }
}
