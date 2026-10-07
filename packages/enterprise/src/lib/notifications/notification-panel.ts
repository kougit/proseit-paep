import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PAEP_MESSAGES, PaepButton, PaepIconButton, PaepPopover, PaepStatusBadge } from '@proseit/paep-components';
import { PaepAnnouncer } from '@proseit/paep-foundation';
import { navMessages } from '../nav/nav';
import { PAEP_SHELL_NOTIFICATIONS, type PaepShellNotification } from '../ports/ports';
import { closeOnNavigation } from '../shell/shell-locale';
import { PaepShellText } from '../shell/shell-text';

let nextPanelId = 0;
/** Count increases within this interval are announced once (interaction-notes §5: batched). */
const ANNOUNCE_BATCH_MS = 1000;

/**
 * Notifications (HOF-IB3-001 E-07, SCR-SHELL-009): the bell with its unread count and the non-modal inset panel on the
 * governed positioning base (P-01, `align="end"`; at most 24 rem wide, 16 px from the viewport edge, never full screen,
 * RD-02). Opening focuses the panel heading; Escape and Close return focus to the bell; a route change closes it.
 * States: count none / unread / 99+ / loading / error; list loading, error (Try again), stale, empty, populated and
 * unavailable. Notification text is untrusted plain text (or a message key the host gives). An increase of the unread
 * count is announced politely, batched. Without a notification provider nothing is shown.
 */
@Component({
  selector: 'paep-notification-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaepButton, PaepIconButton, PaepPopover, PaepStatusBadge],
  providers: [{ provide: PAEP_MESSAGES, useFactory: navMessages }],
  host: { class: 'paep-notification-panel' },
  template: `
    @if (provider) {
      <button
        #bell
        paepIconButton
        icon="bell"
        class="paep-notification-panel__bell"
        aria-haspopup="dialog"
        [label]="text.t('paep.shell.notifications.button')"
        [countLabel]="text.t('paep.shell.notifications.unread')"
        [count]="count()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? panelId : null"
        (pointerdown)="wasOpen = open()"
        (click)="toggle()"
      ></button>
      <paep-popover #panel class="paep-notification-panel__popover" align="end" (openChange)="open.set($event)">
        <section class="paep-notification-panel__dialog" role="dialog" aria-modal="false" [id]="panelId" [attr.aria-labelledby]="headingId">
          <div class="paep-notification-panel__head">
            <h2 #heading class="paep-notification-panel__title" tabindex="-1" [id]="headingId">{{ text.t('paep.shell.notifications.title') }}</h2>
            @if (canMarkAll()) {
              <button paepButton variant="tertiary" (click)="markAll()">{{ text.t('paep.shell.notifications.markAll') }}</button>
            }
            <button paepIconButton icon="close" [label]="text.t('paep.shell.notifications.close')" (click)="close()"></button>
          </div>
          <div class="paep-notification-panel__body">
            @switch (provider.state()) {
              @case ('unavailable') {
                <p class="paep-notification-panel__message">{{ text.t('paep.shell.notifications.unavailable') }}</p>
              }
              @case ('loading') {
                <p class="paep-notification-panel__message" role="status">{{ text.t('paep.shell.notifications.loading') }}</p>
              }
              @case ('error') {
                <div class="paep-notification-panel__message" role="alert">
                  <p>{{ text.t('paep.shell.notifications.error') }}</p>
                  @if (provider.reload) {
                    <button paepButton icon="retry" (click)="reload()">{{ text.t('paep.shell.error.retry') }}</button>
                  }
                </div>
              }
              @default {
                @if (provider.state() === 'stale') {
                  <p class="paep-notification-panel__stale" role="status">
                    {{ text.t('paep.shell.notifications.stale', { time: provider.staleSince?.() ?? '' }) }}
                  </p>
                }
                @if (provider.items().length) {
                  <ul class="paep-notification-panel__list">
                    @for (item of provider.items(); track item.id) {
                      <li class="paep-notification-panel__item" [class.paep-notification-panel__item--unread]="item.unread">
                        <span class="paep-notification-panel__dot" aria-hidden="true"></span>
                        <div class="paep-notification-panel__main">
                          @if (item.unread) {
                            <span class="paep-visually-hidden">{{ unreadMarker() }}</span>
                          }
                          @if (item.route) {
                            <a class="paep-notification-panel__text" [routerLink]="item.route">{{ itemText(item) }}</a>
                          } @else {
                            <span class="paep-notification-panel__text">{{ itemText(item) }}</span>
                          }
                          @if (item.otherTenant) {
                            <paep-status-badge tone="neutral">{{ text.t('paep.shell.notifications.otherContext', { tenant: item.otherTenant }) }}</paep-status-badge>
                          }
                          <span class="paep-notification-panel__meta">{{ item.time }}</span>
                        </div>
                      </li>
                    }
                  </ul>
                } @else if (provider.state() === 'ready') {
                  <p class="paep-notification-panel__message">{{ text.t('paep.shell.notifications.empty') }}</p>
                }
              }
            }
          </div>
        </section>
      </paep-popover>
    }
  `,
  styleUrl: './notification-panel.css',
})
export class PaepNotificationPanel {
  protected readonly text = inject(PaepShellText);
  protected readonly provider = inject(PAEP_SHELL_NOTIFICATIONS, { optional: true });
  private readonly announcer = inject(PaepAnnouncer);
  private readonly bell = viewChild('bell', { read: ElementRef<HTMLElement> });
  private readonly panel = viewChild(PaepPopover);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly panelId = `paep-notification-panel-${nextPanelId++}`;
  protected readonly headingId = `${this.panelId}-heading`;
  /** Whether the panel is open. */
  readonly open = signal(false);
  /** Open state captured on pointerdown, before light dismiss can close the panel. */
  protected wasOpen: boolean | null = null;
  /** The bell's count: none when the deployment has notifications switched off. */
  protected readonly count = computed(() => (this.provider && this.provider.state() !== 'unavailable' ? this.provider.unread() : null));
  protected readonly canMarkAll = computed(() => {
    const p = this.provider;
    return !!p?.markAllRead && (p.state() === 'ready' || p.state() === 'stale') && p.items().some((i) => i.unread);
  });
  /**
   * Hidden marker before an unread item. HOF-IB3-001 content-keys has no per-item key, so the approved unread key is
   * used with a count of 1 ("1 unread"); see conformance report DDR-IB3-06.
   */
  protected readonly unreadMarker = computed(() => this.text.t('paep.shell.notifications.unread', { count: 1 }));

  constructor() {
    closeOnNavigation(() => this.panel()?.hide());
    // Announce increases of the unread count only (politely, batched); never decreases, loading or errors.
    let last: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    effect(() => {
      const c = this.count();
      untracked(() => {
        if (typeof c !== 'number') return;
        const increased = last !== null && c > last;
        last = c;
        if (!increased) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.announcer.announce(
            `${this.text.t('paep.shell.notifications.button')}, ${this.text.t('paep.shell.notifications.unread', { count: c > 99 ? '99+' : c })}`,
          );
        }, ANNOUNCE_BATCH_MS);
      });
    });
  }

  /** Opens the panel and focuses its heading. */
  show(): void {
    const bell = this.bell()?.nativeElement;
    const panel = this.panel();
    if (!bell || !panel) return;
    panel.show(bell);
    this.heading()?.nativeElement.focus();
  }

  /** Closes the panel; focus returns to the bell. */
  close(): void {
    this.panel()?.hide(true);
  }

  protected toggle(): void {
    const open = this.wasOpen ?? this.open();
    this.wasOpen = null;
    if (open) this.close();
    else this.show();
  }

  protected markAll(): void {
    this.provider?.markAllRead?.();
    this.heading()?.nativeElement.focus();
  }

  protected reload(): void {
    this.provider?.reload?.();
    this.heading()?.nativeElement.focus();
  }

  /** Untrusted provider text stays plain text; a key the host gives resolves through the message seam. */
  protected itemText(item: PaepShellNotification): string {
    return typeof item.text === 'string' ? item.text : this.text.resolve(item.text.key, item.text.params);
  }
}
