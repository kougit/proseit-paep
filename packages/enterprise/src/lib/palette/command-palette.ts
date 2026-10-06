import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, forwardRef, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { PaepAlert, PaepButton, PaepCombobox, PaepEmptyState, PaepModalBase, type PaepComboboxGroup, type PaepComboboxOption } from '@proseit/paep-components';
import { PaepAnnouncer, PaepIcon, type PaepIconName } from '@proseit/paep-foundation';
import { sanitizeErrorReport } from '@proseit/paep-observability';
import { PAEP_SHELL_LOCK_ICONS } from '../nav/nav';
import { PaepShellNavModel } from '../nav/nav-model';
import {
  PAEP_SHELL_COMMANDS,
  PAEP_SHELL_ERROR_REPORTER,
  PAEP_SHELL_HOOKS,
  type PaepShellCommandGroup,
  type PaepShellCommandResult,
  type PaepShellLockReason,
} from '../ports/ports';
import { PaepShellText } from '../shell/shell-text';

/** Typing pause before record search runs and before the result count is announced. */
const DEBOUNCE_MS = 250;
/** Most "Go to" destinations shown at once. */
const GOTO_LIMIT = 8;
const GROUP_ICONS: Readonly<Record<PaepShellCommandGroup, PaepIconName>> = { goto: 'list', actions: 'tasks', records: 'document' };

type SearchState = { readonly status: 'idle' } | { readonly status: 'loading' } | { readonly status: 'ready'; readonly partial: boolean } | { readonly status: 'error'; readonly reference: string };

/** An internal route: one leading slash, no scheme or protocol-relative address. */
function isInternalRoute(route: string | undefined): route is string {
  return typeof route === 'string' && route.startsWith('/') && !route.startsWith('//') && !route.includes('\\');
}

/**
 * The command palette (HOF-IB3-001 E-06, Q-05, Q-12; SCR-SHELL-008, -021): a modal dialog on `PaepModalBase` that
 * composes `PaepCombobox`. Fixed groups in order: Go to (the presented navigation manifest, so not-permitted
 * destinations never appear), Actions (host commands) and Records (provider search, debounced and aborted when the
 * query changes). Locked results stay findable with their reason and open the explanation, never the capability.
 * Escape clears the query, a second Escape closes. Full screen below 600 px. Provider text is plain text. The shell
 * loads it on first use.
 */
@Component({
  selector: 'paep-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepAlert, PaepButton, PaepCombobox, PaepEmptyState, PaepIcon],
  providers: [{ provide: PaepModalBase, useExisting: forwardRef(() => PaepCommandPalette) }],
  template: `
    <dialog
      #dialog
      class="paep-palette"
      [class]="modalClass()"
      [attr.aria-labelledby]="titleId"
      (cancel)="onCancel($event)"
      (close)="onClose()"
      (keydown)="onKeydown($event)"
      (click)="onBackdrop($event)"
    >
      <h2 #title class="paep-palette__title" [id]="titleId" tabindex="-1">{{ heading() }}</h2>
      <div #body class="paep-palette__body">
        <svg class="paep-palette__search-icon" paepIcon="search"></svg>
        <paep-combobox
          class="paep-palette__combobox"
          [label]="text.t('paep.shell.search.input')"
          [listboxLabel]="text.t(query().trim() ? 'paep.shell.search.results' : 'paep.shell.search.suggestions')"
          [placeholder]="text.t('paep.shell.search.trigger')"
          [groups]="groups()"
          [(query)]="query"
          (optionSelect)="choose($event)"
        />
        <button paepButton variant="tertiary" type="button" class="paep-palette__close" [attr.aria-label]="text.t('paep.shell.search.close')" (click)="dismiss()">Esc</button>
        <div class="paep-palette__state">
          @switch (search().status) {
            @case ('loading') {
              <p class="paep-palette__loading" role="status"><svg class="paep-palette__spinner" paepIcon="spinner"></svg>{{ text.t('paep.shell.search.loading') }}</p>
            }
            @case ('error') {
              <paep-alert status="error" live [heading]="text.t('paep.shell.search.error')">
                @let hint = errorHint();
                {{ hint[0] }}<code class="paep-palette__ref" dir="ltr">{{ errorReference() }}</code>{{ hint[1] }}
              </paep-alert>
            }
            @case ('ready') {
              @if (partial()) {
                <paep-alert status="warning" live>{{ text.t('paep.shell.search.partial') }}</paep-alert>
              }
            }
          }
          @if (noResults()) {
            <paep-empty-state
              class="paep-palette__empty"
              kind="no-results"
              [headingLevel]="3"
              [heading]="text.t('paep.shell.search.empty', { query: settledQuery() })"
              [description]="text.t('paep.shell.search.empty.hint')"
              actionLabel=""
            />
          }
        </div>
      </div>
      <p class="paep-palette__foot" aria-hidden="true">{{ text.t('paep.shell.search.help.keys') }}</p>
    </dialog>
  `,
  styleUrl: './command-palette.css',
})
export class PaepCommandPalette extends PaepModalBase {
  protected readonly text = inject(PaepShellText);
  private readonly nav = inject(PaepShellNavModel);
  private readonly commands = inject(PAEP_SHELL_COMMANDS, { optional: true });
  private readonly hooks = inject(PAEP_SHELL_HOOKS, { optional: true });
  private readonly reporter = inject(PAEP_SHELL_ERROR_REPORTER);
  private readonly router = inject(Router);
  private readonly announcer = inject(PaepAnnouncer);
  protected readonly modalClass = computed(() => 'paep-palette');

  /** Text in the combobox. */
  readonly query = signal('');
  /** The query after a typing pause; record search and the count announcement follow it. */
  protected readonly settledQuery = signal('');
  protected readonly search = signal<SearchState>({ status: 'idle' });
  private readonly records = signal<readonly PaepShellCommandResult[]>([]);
  protected readonly partial = computed(() => {
    const s = this.search();
    return s.status === 'ready' && s.partial;
  });
  protected readonly errorReference = computed(() => {
    const s = this.search();
    return s.status === 'error' ? s.reference : '';
  });
  /** The error hint around its reference, so the reference renders as one left-to-right code span. */
  protected readonly errorHint = computed(() => {
    const marker = '\u0000';
    const parts = this.text.t('paep.shell.search.error.hint', { ref: marker }).split(marker);
    return [parts[0] ?? '', parts.slice(1).join('')] as const;
  });
  private controller: AbortController | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Results behind each option id. */
  private readonly byId = new Map<string, PaepShellCommandResult>();

  private readonly goto = computed<readonly PaepShellCommandResult[]>(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const all = this.nav.entries();
    let list: typeof all;
    if (q) {
      list = all.filter(({ entry, group }) => entry.label.toLocaleLowerCase().includes(q) || group.toLocaleLowerCase().includes(q));
    } else {
      // Empty query: Home and the current group's destinations (no history is kept).
      const current = this.nav.sections().find((s) => s.current) ?? this.nav.sections()[0];
      const inCurrent = new Set<string>();
      const walk = (items: NonNullable<typeof current>['items']) => items.forEach((e) => (inCurrent.add(e.id), walk(e.children)));
      if (current) walk(current.items);
      list = all.filter(({ entry }) => entry.route === this.nav.home || inCurrent.has(entry.id));
    }
    return list.slice(0, GOTO_LIMIT).map(({ entry, group }) => ({
      id: `goto:${entry.id}`,
      group: 'goto' as const,
      label: entry.label,
      description: group,
      route: entry.route,
      ...(entry.locked ? { locked: entry.locked } : {}),
    }));
  });

  private readonly actions = computed<readonly PaepShellCommandResult[]>(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const list = this.commands?.actions?.() ?? [];
    return list.filter((a) => !q || a.label.toLocaleLowerCase().includes(q) || (a.description ?? '').toLocaleLowerCase().includes(q));
  });

  protected readonly groups = computed<readonly PaepComboboxGroup[]>(() => {
    this.byId.clear();
    const option = (r: PaepShellCommandResult, prefix: string): PaepComboboxOption => {
      const id = r.id.startsWith(`${prefix}:`) ? r.id : `${prefix}:${r.id}`;
      this.byId.set(id, r);
      const reason = r.locked ? this.reasonText(r.locked) : null;
      const description = [r.description, reason].filter((x): x is string => !!x).join(' · ');
      return { id, label: r.label, icon: r.locked ? PAEP_SHELL_LOCK_ICONS[r.locked] : GROUP_ICONS[r.group], ...(description ? { description } : {}) };
    };
    const records = this.search().status === 'ready' ? this.records() : [];
    return [
      { id: 'goto', label: this.text.t('paep.shell.search.group.goto'), options: this.goto().map((r) => option(r, 'goto')) },
      { id: 'actions', label: this.text.t('paep.shell.search.group.actions'), options: this.actions().map((r) => option(r, 'action')) },
      { id: 'records', label: this.text.t('paep.shell.search.group.records'), options: records.map((r) => option(r, 'record')) },
    ];
  });

  private readonly total = computed(() => this.groups().reduce((n, g) => n + g.options.length, 0));
  /** Nothing matched, and nothing is still loading or failing. */
  protected readonly noResults = computed(() => {
    const status = this.search().status;
    return !!this.settledQuery().trim() && this.query() === this.settledQuery() && this.total() === 0 && (status === 'ready' || status === 'idle');
  });

  constructor() {
    super();
    effect(() => {
      const q = this.query();
      untracked(() => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.settle(q), q.trim() ? DEBOUNCE_MS : 0);
      });
    });
    inject(DestroyRef).onDestroy(() => this.reset());
  }

  /** Escape clears a non-empty query; with an empty query it closes the palette (handled by the dialog). */
  protected override onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.query()) {
      event.preventDefault();
      event.stopPropagation();
      this.query.set('');
      return;
    }
    super.onKeydown(event);
  }

  protected override onClose(): void {
    this.reset();
    super.onClose();
  }

  /** A click on the dialog element itself is a click on the scrim. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dismiss();
  }

  protected choose(option: PaepComboboxOption): void {
    const result = this.byId.get(option.id);
    if (!result) return;
    // A locked result opens its explanation: the destination's locked page, or the host's explanation.
    if (result.locked && !isInternalRoute(result.route)) {
      const reason: PaepShellLockReason = result.locked;
      this.dismiss();
      this.hooks?.explainLock?.(reason);
      return;
    }
    this.dismiss();
    if (isInternalRoute(result.route)) void this.router.navigateByUrl(result.route);
    else if (!result.locked) result.run?.();
  }

  private reasonText(reason: PaepShellLockReason): string {
    return this.text.t(reason === 'edition' ? 'paep.shell.search.locked.edition' : `paep.shell.locked.${reason}`);
  }

  private settle(q: string): void {
    this.timer = null;
    this.settledQuery.set(q);
    this.controller?.abort();
    this.controller = null;
    const term = q.trim();
    if (!term || !this.commands?.search) {
      this.records.set([]);
      this.search.set(term ? { status: 'ready', partial: false } : { status: 'idle' });
      this.announceCount();
      return;
    }
    const controller = new AbortController();
    this.controller = controller;
    this.search.set({ status: 'loading' });
    let pending: Promise<unknown>;
    try {
      pending = this.commands.search(term, controller.signal);
    } catch (error) {
      pending = Promise.reject(error);
    }
    pending.then(
      (value) => {
        if (controller.signal.aborted) return;
        const r = value as { results?: readonly PaepShellCommandResult[]; partial?: boolean };
        // Permission-denied results are the provider's to omit; the shell only drops what it cannot open safely.
        const results = (r.results ?? []).filter((x) => x.group === 'records' && (isInternalRoute(x.route) || typeof x.run === 'function'));
        this.records.set(results);
        this.search.set({ status: 'ready', partial: r.partial === true });
        this.announceCount();
      },
      () => {
        if (controller.signal.aborted) return;
        const report = sanitizeErrorReport({ kind: 'unknown', route: this.router.url, retryable: true });
        this.reporter.report(report);
        this.records.set([]);
        this.search.set({ status: 'error', reference: report.correlationId });
      },
    );
  }

  private announceCount(): void {
    if (!this.settledQuery().trim() || !this.open()) return;
    this.announcer.announce(this.text.t('paep.shell.search.count', { count: this.total() }), 'polite');
  }

  private reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.controller?.abort();
    this.controller = null;
    this.query.set('');
    this.settledQuery.set('');
    this.records.set([]);
    this.search.set({ status: 'idle' });
  }
}
