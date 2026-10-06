import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { PaepAlert, PaepButton, PaepDialog, PaepDialogClose, PaepDialogFooter, PaepRadio, PaepRadioGroup } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_CONTEXT, type PaepShellContext } from '../ports/ports';
import { PaepRouteFocus } from '../route-focus/route-focus';
import { PaepShellText } from '../shell/shell-text';

/** Display text of a context: tenant plus optional site. */
export function contextText(c: PaepShellContext): string {
  return [c.tenant.displayName, c.site].filter(Boolean).join(', ');
}

type SwitchState = { readonly kind: 'idle' } | { readonly kind: 'pending'; readonly tenant: string } | { readonly kind: 'rejected'; readonly tenant: string; readonly reference: string };

/**
 * Context display and switch request (HOF-IB3-001 E-08, SCR-SHELL-007, Q-11).
 *
 * - `mode="topbar"` (default): the current tenant and site on two lines; a button that opens the switch dialog only
 *   when the context provider offers more than one context, otherwise static text.
 * - `mode="mismatch"`: the deep-link notice for a link that belongs to `target`, with "Request switch to {target}"
 *   and "Stay in {current}". Nothing ever switches silently.
 *
 * A switch is a request; the dialog shows the pending state and then the server's outcome. Accepted: the dialog
 * closes and focus goes to the page `h1`. Rejected: the dialog stays open and focus goes to the error alert, which
 * carries the correlation reference.
 */
@Component({
  selector: 'paep-context-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepAlert, PaepButton, PaepDialog, PaepDialogClose, PaepDialogFooter, PaepIcon, PaepRadio, PaepRadioGroup],
  host: { class: 'paep-context-switcher', '[attr.data-mode]': 'mode()', '[hidden]': '!current()' },
  template: `
    @if (current(); as c) {
      @if (mode() === 'mismatch') {
        @if (mismatchTarget(); as t) {
          <paep-alert status="warning" [heading]="text.t('paep.shell.context.mismatch.title')">
            <p class="paep-context-switcher__body">{{ text.t('paep.shell.context.mismatch.body', { target: t.tenant.displayName, current: c.tenant.displayName }) }}</p>
            <div class="paep-context-switcher__actions">
              <button paepButton variant="primary" (click)="openDialog(t.tenant.tenantId)">{{ text.t('paep.shell.context.mismatch.action', { target: t.tenant.displayName }) }}</button>
              <button paepButton (click)="stay()">{{ text.t('paep.shell.context.mismatch.stay', { current: c.tenant.displayName }) }}</button>
            </div>
          </paep-alert>
        }
      } @else if (switchable()) {
        <button
          #trigger
          type="button"
          class="paep-context-switcher__button"
          aria-haspopup="dialog"
          [attr.aria-label]="text.t('paep.shell.context.label') + ': ' + contextText(c) + '. ' + text.t('paep.shell.context.switch')"
          (click)="openDialog(c.tenant.tenantId)"
        >
          <svg paepIcon="building"></svg>
          <span class="paep-context-switcher__text">
            <span class="paep-context-switcher__tenant">{{ c.tenant.displayName }}</span>
            @if (c.site) {
              <span class="paep-context-switcher__site">{{ c.site }}</span>
            }
          </span>
          <svg paepIcon="chevron-down"></svg>
        </button>
      } @else {
        <span class="paep-context-switcher__static" role="group" [attr.aria-label]="text.t('paep.shell.context.label')">
          <svg paepIcon="building"></svg>
          <span class="paep-context-switcher__text">
            <span class="paep-context-switcher__tenant">{{ c.tenant.displayName }}</span>
            @if (c.site) {
              <span class="paep-context-switcher__site">{{ c.site }}</span>
            }
          </span>
        </span>
      }

      <paep-dialog
        [(open)]="dialogOpen"
        size="sm"
        [heading]="text.t('paep.shell.context.switch.title')"
        [description]="text.t('paep.shell.context.switch.intro')"
        [busy]="state().kind === 'pending'"
        [closeLabel]="text.t('paep.shell.dialog.close')"
        (closed)="state.set({ kind: 'idle' })"
      >
        @if (state(); as s) {
          @if (s.kind === 'rejected') {
            <div #rejected tabindex="-1" class="paep-context-switcher__outcome">
              <paep-alert status="error" live>
                {{ text.t('paep.shell.context.switch.rejected', { tenant: s.tenant, current: c.tenant.displayName }) }}
                {{ text.t('paep.shell.error.reference') }}: <code dir="ltr">{{ s.reference }}</code>
              </paep-alert>
            </div>
          } @else if (s.kind === 'pending') {
            <p class="paep-context-switcher__pending" role="status">{{ text.t('paep.shell.context.switch.pending', { tenant: s.tenant }) }}</p>
          }
        }
        <paep-radio-group class="paep-context-switcher__legend" [legend]="text.t('paep.shell.context.switch.legend')" [disabled]="state().kind === 'pending'">
          @for (option of available(); track option.tenant.tenantId) {
            <label>
              <input
                type="radio"
                paepRadio
                name="paep-shell-context"
                [value]="option.tenant.tenantId"
                [checked]="selected() === option.tenant.tenantId"
                (change)="selected.set(option.tenant.tenantId)"
              />
              <span>
                {{ option.tenant.displayName }}
                @if (option.site) {
                  <span class="paep-context-switcher__site">{{ option.site }}</span>
                }
              </span>
            </label>
          }
        </paep-radio-group>
        <paep-dialog-footer>
          <button paepButton paepDialogClose>{{ text.t('paep.shell.dialog.cancel') }}</button>
          <button paepButton variant="primary" [loading]="state().kind === 'pending'" (click)="submit()">{{ text.t('paep.shell.context.switch.submit') }}</button>
        </paep-dialog-footer>
      </paep-dialog>
    }
  `,
  styleUrl: './context-switcher.css',
})
export class PaepContextSwitcher {
  protected readonly text = inject(PaepShellText);
  private readonly provider = inject(PAEP_SHELL_CONTEXT, { optional: true });
  private readonly routeFocus = inject(PaepRouteFocus);
  private readonly injector = inject(Injector);
  private readonly rejectedRef = viewChild<ElementRef<HTMLElement>>('rejected');
  protected readonly contextText = contextText;

  readonly mode = input<'topbar' | 'mismatch'>('topbar');
  /** The context a deep link belongs to (mismatch mode). */
  readonly target = input<PaepShellContext | null>(null);

  protected readonly current = computed(() => this.provider?.current() ?? null);
  protected readonly available = computed(() => this.provider?.available() ?? []);
  protected readonly switchable = computed(() => this.available().length > 1);
  protected readonly dialogOpen = signal(false);
  protected readonly selected = signal<string | null>(null);
  protected readonly state = signal<SwitchState>({ kind: 'idle' });
  private readonly dismissedMismatch = signal(false);
  protected readonly mismatchTarget = computed(() => (this.dismissedMismatch() ? null : this.target()));

  protected openDialog(tenantId: string): void {
    this.selected.set(tenantId);
    this.state.set({ kind: 'idle' });
    this.dialogOpen.set(true);
  }

  protected stay(): void {
    this.dismissedMismatch.set(true);
  }

  protected async submit(): Promise<void> {
    const id = this.selected();
    const provider = this.provider;
    if (!id || !provider || this.state().kind === 'pending') return;
    const name = this.available().find((c) => c.tenant.tenantId === id)?.tenant.displayName ?? id;
    if (id === this.current()?.tenant.tenantId) {
      this.dialogOpen.set(false);
      return;
    }
    this.state.set({ kind: 'pending', tenant: name });
    let outcome: Awaited<ReturnType<typeof provider.requestSwitch>>;
    try {
      outcome = await provider.requestSwitch(id);
    } catch {
      outcome = { status: 'rejected', reference: '' };
    }
    if (outcome.status === 'accepted') {
      this.state.set({ kind: 'idle' });
      this.dialogOpen.set(false);
      afterNextRender({ read: () => this.routeFocus.focusPage() }, { injector: this.injector });
      return;
    }
    this.state.set({ kind: 'rejected', tenant: name, reference: outcome.reference || '—' });
    afterNextRender({ write: () => this.rejectedRef()?.nativeElement.focus() }, { injector: this.injector });
  }
}
