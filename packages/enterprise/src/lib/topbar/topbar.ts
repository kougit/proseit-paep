import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaepButton, PaepIconButton, PaepStatusBadge } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PaepContextSwitcher } from '../context/context-switcher';
import { PAEP_SHELL_HOOKS, PAEP_SHELL_NAVIGATION, PAEP_SHELL_RUNTIME_CONFIG } from '../ports/ports';
import { connectivitySignal, environmentLabel } from '../status/status-strip';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';

/** Visible shortcut hint and aria-keyshortcuts of the palette (Q-12). */
function shortcutHint(nav: Navigator | undefined, text: PaepShellText): string {
  const apple = /Mac|iPhone|iPad/.test(nav?.platform ?? nav?.userAgent ?? '');
  return apple ? '⌘ K' : text.t('paep.shell.search.shortcut');
}

/**
 * Topbar (banner) of the shell (HOF-IB3-001 E-02, SCR-SHELL-001/-005): navigation toggle (below 1024 px), product
 * link with the app's mark and name, environment badge (non-production), context, the search trigger (field-style
 * at ≥ 1024 px, an icon button below), the online indicator, help and the global actions the shell projects
 * (language, notifications, account). Overflow follows interaction-notes §7; the never-hidden set stays visible at
 * 320 px. There is no `role="toolbar"`: each control is a Tab stop.
 *
 * Slots: `[paepShellMark]` (the product's approved mark), `[paepShellActions]` (global actions at the inline end).
 */
@Component({
  selector: 'paep-shell-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaepButton, PaepIcon, PaepIconButton, PaepStatusBadge, PaepContextSwitcher],
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
        <ng-content select="[paepShellLanguage]" />
        @if (layout.medium() && hooks?.openHelp) {
          <button paepIconButton icon="help" [label]="text.t('paep.shell.help.button')" (click)="help()"></button>
        }
        <ng-content select="[paepShellActions]" />
      </div>
    </header>
  `,
  styleUrl: './topbar.css',
})
export class PaepShellTopbar {
  protected readonly text = inject(PaepShellText);
  protected readonly layout = inject(PaepShellLayout);
  protected readonly hooks = inject(PAEP_SHELL_HOOKS, { optional: true });
  protected readonly home = inject(PAEP_SHELL_NAVIGATION).home;
  private readonly config = inject(PAEP_SHELL_RUNTIME_CONFIG).config;
  private readonly navToggle = viewChild<ElementRef<HTMLElement>>('navToggle');
  protected readonly product = this.config.product.name;
  protected readonly connectivity = connectivitySignal();
  protected readonly shortcut = shortcutHint(inject(ElementRef).nativeElement.ownerDocument.defaultView?.navigator, this.text);
  protected readonly environment = computed(() => {
    const env = this.config.deployment.environment;
    return env === 'production' ? null : this.text.t('paep.shell.env.badge', { environment: environmentLabel(env) });
  });

  /** Focuses the Open navigation button (focus return after the sheet closes). */
  focusNavToggle(): void {
    this.navToggle()?.nativeElement.focus();
  }

  protected help(): void {
    this.hooks?.openHelp?.();
  }
}
