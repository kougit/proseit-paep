import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { PaepButton } from '@proseit/paep-components';
import { PaepAnnouncer, PaepIcon, type PaepIconName } from '@proseit/paep-foundation';
import type { ConnectivityState } from '@proseit/paep-platform';
import { PAEP_SHELL_CONNECTIVITY, PAEP_SHELL_RUNTIME_CONFIG, PAEP_SHELL_SESSION } from '../ports/ports';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';

/** One status row. */
export interface PaepShellStatusRow {
  readonly id: 'impersonation' | 'connectivity' | 'session' | 'environment';
  readonly tone: 'info' | 'warning' | 'error' | 'neutral';
  readonly icon: PaepIconName;
  readonly title: string;
  readonly body?: string;
  readonly action?: { readonly label: string; readonly run: () => void };
}

const CONNECTIVITY_ROWS: Readonly<Record<Exclude<ConnectivityState, 'online'>, { tone: PaepShellStatusRow['tone']; icon: PaepIconName }>> = {
  offline: { tone: 'error', icon: 'cloud-off' },
  degraded: { tone: 'warning', icon: 'signal-low' },
  unknown: { tone: 'neutral', icon: 'unknown' },
};

/**
 * @internal Connectivity state from the platform seam as a signal. Presentation only: no queue, replay or sync.
 */
export function connectivitySignal(): () => ConnectivityState {
  const source = inject(PAEP_SHELL_CONNECTIVITY);
  const state = signal<ConnectivityState>(source.current());
  const unsubscribe = source.subscribe((s) => state.set(s));
  inject(DestroyRef).onDestroy(unsubscribe);
  return state.asReadonly();
}

/**
 * Status strip (HOF-IB3-001 E-12, SCR-SHELL-014): one row per active status in the X-03 order impersonation,
 * connectivity (non-online only), session expiring, non-production environment. Impersonation is never dismissible.
 * Below 600 px only the first row shows, with an "n more status messages" disclosure that always exposes the rest
 * (X-02). Connectivity changes and the session threshold are announced politely once.
 */
@Component({
  selector: 'paep-shell-status-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepButton, PaepIcon],
  host: { class: 'paep-shell-status', '[hidden]': '!rows().length' },
  template: `
    <section [attr.aria-label]="text.t('paep.shell.status.label')">
      @for (row of shown(); track row.id) {
        <div class="paep-shell-status__row" [attr.data-tone]="row.tone" [attr.data-status]="row.id">
          <svg [paepIcon]="row.icon"></svg>
          <p class="paep-shell-status__text">
            <strong>{{ row.title }}</strong>
            @if (row.body) {
              <span> {{ row.body }}</span>
            }
          </p>
          @if (row.action; as action) {
            <button paepButton class="paep-shell-status__action" (click)="action.run()">{{ action.label }}</button>
          }
        </div>
      }
      @if (collapsible()) {
        <div class="paep-shell-status__row paep-shell-status__row--more">
          <button paepButton variant="tertiary" [attr.aria-expanded]="expanded()" (click)="expanded.set(!expanded())">
            {{ expanded() ? text.t('paep.shell.status.less') : text.t('paep.shell.status.more', { count: rows().length - 1 }) }}
          </button>
        </div>
      }
    </section>
  `,
  styleUrl: './status-strip.css',
})
export class PaepStatusStrip {
  protected readonly text = inject(PaepShellText);
  private readonly layout = inject(PaepShellLayout);
  private readonly session = inject(PAEP_SHELL_SESSION, { optional: true });
  private readonly config = inject(PAEP_SHELL_RUNTIME_CONFIG).config;
  private readonly announcer = inject(PaepAnnouncer);
  /** Current connectivity state (platform seam). */
  readonly connectivity = connectivitySignal();
  protected readonly expanded = signal(false);

  readonly rows = computed<readonly PaepShellStatusRow[]>(() => {
    const rows: PaepShellStatusRow[] = [];
    const t = this.text;
    const agent = this.session?.impersonatorName?.();
    const identity = this.session?.identity();
    if (agent && identity) {
      const end = this.session?.endImpersonation?.bind(this.session);
      rows.push({
        id: 'impersonation',
        tone: 'info',
        icon: 'impersonate',
        title: t.t('paep.shell.impersonation', { agent, user: identity.displayName }),
        action: end ? { label: t.t('paep.shell.impersonation.end'), run: end } : undefined,
      });
    }
    const c = this.connectivity();
    if (c !== 'online') {
      rows.push({ id: 'connectivity', ...CONNECTIVITY_ROWS[c], title: t.t(`paep.shell.connectivity.${c}`), body: t.t(`paep.shell.connectivity.${c}.body`) });
    }
    const minutes = this.session?.expiringInMinutes?.();
    if (typeof minutes === 'number') {
      const stay = this.session?.continueSession?.bind(this.session);
      rows.push({
        id: 'session',
        tone: 'warning',
        icon: 'pending',
        title: t.t('paep.shell.session.expiring', { minutes }),
        action: stay ? { label: t.t('paep.shell.session.continue'), run: stay } : undefined,
      });
    }
    const env = this.config.deployment.environment;
    if (env !== 'production') rows.push({ id: 'environment', tone: 'neutral', icon: 'environment', title: t.t('paep.shell.env.notice', { environment: environmentLabel(env) }) });
    return rows;
  });

  protected readonly collapsible = computed(() => !this.layout.medium() && this.rows().length > 1);
  protected readonly shown = computed(() => (this.collapsible() && !this.expanded() ? this.rows().slice(0, 1) : this.rows()));

  constructor() {
    let previous: ConnectivityState | null = null;
    let sessionAnnounced = false;
    effect(() => {
      const c = this.connectivity();
      const minutes = this.session?.expiringInMinutes?.() ?? null;
      untracked(() => {
        if (previous !== null && c !== previous) this.announcer.announce(this.text.t(`paep.shell.connectivity.${c}`));
        previous = c;
        if (minutes !== null && !sessionAnnounced) {
          sessionAnnounced = true;
          this.announcer.announce(this.text.t('paep.shell.session.expiring', { minutes }));
        } else if (minutes === null) sessionAnnounced = false;
      });
    });
  }
}

/** Display form of a deployment environment ("staging" → "Staging"). */
export function environmentLabel(env: string): string {
  return env.charAt(0).toUpperCase() + env.slice(1);
}
