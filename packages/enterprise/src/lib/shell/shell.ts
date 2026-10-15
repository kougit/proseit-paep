import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { PaepStatusBadge } from '@proseit/paep-components';
import { PaepContextSwitcher } from '../context/context-switcher';
import { PaepCommandPalette } from '../palette/command-palette';
import { PaepShellNav } from '../nav/nav';
import { PaepShellNavSheet } from '../nav/nav-sheet';
import { PaepShellPreferences } from '../preferences/preferences';
import { PAEP_SHELL_RUNTIME_CONFIG } from '../ports/ports';
import { PaepRouteFocus } from '../route-focus/route-focus';
import { PaepStatusStrip, environmentLabel } from '../status/status-strip';
import { PaepShellTopbar } from '../topbar/topbar';
import { PaepShellLayout } from './shell-layout';
import { PaepShellText } from './shell-text';

/**
 * The enterprise application shell (HOF-IB3-001 E-01, SCR-SHELL-001..005): skip link, banner, status strip,
 * primary navigation (persistent at ≥ 1024 px, a modal sheet below), the main slot, the overlays and the route-focus
 * rule. The single `main` landmark comes from the app (SHELL-REGION-MAIN); the shell gives it the skip-link target
 * id, `tabindex="-1"` and the content density. It holds no product menu, no login and no route authority. Requires
 * `providePaepShell(...)`.
 *
 * `<paep-shell><svg paepShellMark …></svg><main><paep-error-boundary /></main></paep-shell>`
 */
@Component({
  selector: 'paep-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepCommandPalette, PaepContextSwitcher, PaepShellNav, PaepShellNavSheet, PaepShellPreferences, PaepStatusStrip, PaepShellTopbar, PaepStatusBadge],
  host: { class: 'paep-shell', '(document:keydown)': 'onKeydown($event)' },
  template: `
    <a class="paep-skip-link" [attr.href]="'#' + skipTarget()" (click)="skipToMain($event)">{{ text.t('paep.shell.skipLink.main') }}</a>
    <paep-shell-topbar>
      <ng-container ngProjectAs="[paepShellMark]"><ng-content select="[paepShellMark]" /></ng-container>
      <ng-container ngProjectAs="[paepShellLanguage]"><ng-content select="[paepShellLanguage]" /></ng-container>
      <ng-container ngProjectAs="[paepShellActions]"><ng-content select="[paepShellActions]" /></ng-container>
    </paep-shell-topbar>
    <paep-shell-status-strip />
    <div class="paep-shell__frame" [class.paep-shell__frame--rail]="layout.navCollapsed()" [class.paep-shell__frame--nav]="layout.wide()">
      @if (layout.wide()) {
        <paep-shell-nav class="paep-shell__nav" mode="persistent" />
      }
      <div #main class="paep-shell__main" [attr.data-paep-density]="layout.density() === 'compact' ? 'compact' : null">
        <ng-content select="main" />
      </div>
    </div>
    @if (!layout.wide()) {
      <paep-shell-nav-sheet [(open)]="sheetOpen" [heading]="text.t('paep.shell.nav.sheet.title')" [closeLabel]="text.t('paep.shell.nav.close')">
        @if (!layout.medium()) {
          <div paepShellSheetContext class="paep-shell__sheet-context">
            @if (environment(); as env) {
              <paep-status-badge tone="warning">{{ env }}</paep-status-badge>
            }
            <paep-context-switcher />
          </div>
        }
        <paep-shell-nav mode="sheet" />
      </paep-shell-nav-sheet>
    }
    @defer (when layout.paletteOpen()) {
      <paep-command-palette [(open)]="paletteOpen" [heading]="text.t('paep.shell.search.dialog')" />
    }
    @defer (when layout.preferencesOpen()) {
      <paep-shell-preferences [(open)]="preferencesOpen" />
    }
    <ng-content select="[paepShellOverlay]" />
  `,
  styleUrl: './shell.css',
})
export class PaepShell {
  protected readonly text = inject(PaepShellText);
  protected readonly layout = inject(PaepShellLayout);
  private readonly routeFocus = inject(PaepRouteFocus);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly env = inject(PAEP_SHELL_RUNTIME_CONFIG).config.deployment.environment;
  private readonly mainRef = viewChild.required<ElementRef<HTMLElement>>('main');
  /** The app's projected `main` element. */
  private readonly main = () => this.mainRef().nativeElement.querySelector<HTMLElement>(':scope > main');
  protected readonly skipTarget = signal('paep-shell-main');
  private readonly persistentNav = viewChild(PaepShellNav);
  private readonly topbar = viewChild.required(PaepShellTopbar);
  protected readonly sheetOpen = this.layout.sheetOpen;
  protected readonly paletteOpen = this.layout.paletteOpen;
  protected readonly preferencesOpen = this.layout.preferencesOpen;
  protected readonly environment = () => (this.env === 'production' ? null : this.text.t('paep.shell.env.badge', { environment: environmentLabel(this.env) }));

  constructor() {
    const root = this.document.documentElement;
    const previous = root.style.getPropertyValue('scroll-padding-block-start');
    // Sticky chrome never hides the focused element (WCAG 2.4.11).
    root.style.setProperty('scroll-padding-block-start', 'var(--paep-shell-sticky-offset)');
    afterRenderEffect(() => {
      const main = this.main();
      if (!main) return;
      if (!main.id) main.id = 'paep-shell-main';
      main.setAttribute('tabindex', '-1');
      this.skipTarget.set(main.id);
      this.routeFocus.attach(main);
    });

    const sub = inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.layout.sheetOpen.set(false);
        this.layout.paletteOpen.set(false);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      this.routeFocus.attach(null);
      root.style.setProperty('scroll-padding-block-start', previous);
    });

    // Crossing 1024 px while the sheet is open closes it; focus goes to the persistent navigation toggle.
    let wasWide = this.layout.wide();
    effect(() => {
      const wide = this.layout.wide();
      untracked(() => {
        if (wide && !wasWide && this.layout.sheetOpen()) {
          this.layout.sheetOpen.set(false);
          afterNextRender({ write: () => this.persistentNav()?.focusToggle() }, { injector: this.injector });
        }
        wasWide = wide;
      });
    });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.main();
    if (!main) return;
    main.focus();
    main.scrollIntoView({ block: 'start' });
  }

  /** Ctrl+K / ⌘K opens the command palette (Q-12). There is no single-character shortcut. */
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.layout.sheetOpen.set(false);
      this.layout.paletteOpen.set(true);
    }
  }

  /** Focuses the control that opened the navigation sheet. */
  focusNavToggle(): void {
    this.topbar().focusNavToggle();
  }
}
