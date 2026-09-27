import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES } from '../messages/messages';

let nextModalId = 0;

const FIELD_SELECTOR = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

/**
 * Footer action area of a dialog or drawer: `<paep-dialog-footer>` holding the actions in DOM order
 * (secondary, then primary). Below 600 px the actions stack full width in that order.
 */
@Component({
  selector: 'paep-dialog-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--paep-space-2);
    }
    @media (max-width: 37.4375em) {
      :host {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
})
export class PaepDialogFooter {}

/**
 * Shared behaviour of the modal overlays (dialog and drawer): a native `<dialog>` opened with
 * showModal() (the browser makes the rest of the page inert and contains Tab), focus entry, Escape as
 * cancel (suppressed while busy) and focus return to the invoking control.
 */
@Directive()
export abstract class PaepModalBase {
  private readonly messages = inject(PAEP_MESSAGES);

  /** Whether the overlay is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Visible title; it is the accessible name of the dialog. */
  readonly heading = input.required<string>();
  /** Optional main message, referenced by aria-describedby. */
  readonly description = input<string>();
  /** While true an irreversible action is in flight: Escape, the close button and paepDialogClose do nothing. */
  readonly busy = input(false, { transform: booleanAttribute });
  /** Accessible name of the close icon button. */
  readonly closeLabel = input<string>(this.messages['paep.common.close']);
  /** Element to focus on close when the invoker no longer exists (for example the collection heading). */
  readonly returnFocusTo = input<HTMLElement | null>(null);
  /** The user dismissed the overlay (Escape, close button or a paepDialogClose control). */
  readonly cancelled = output<void>();
  /** The overlay closed, for any reason. */
  readonly closed = output<void>();

  protected readonly titleId = `paep-modal-${nextModalId}-title`;
  protected readonly descriptionId = `paep-modal-${nextModalId++}-description`;
  protected readonly scrolled = signal(false);
  /** True while the body overflows: it then becomes a named, focusable region so keyboard users can scroll it. */
  protected readonly bodyScrollable = signal(false);
  protected readonly footer = contentChild(PaepDialogFooter);
  private readonly closers = contentChildren(forwardRef(() => PaepDialogClose), { descendants: true });
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly titleRef = viewChild.required<ElementRef<HTMLElement>>('title');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');
  private invoker: HTMLElement | null = null;
  private dialogEl: HTMLDialogElement | null = null;
  private bodyObserver: ResizeObserver | null = null;
  private lockedOverflow: string | null = null;

  /** CSS classes of the `<dialog>` element for the concrete overlay. */
  protected abstract readonly modalClass: () => string;

  constructor() {
    afterRenderEffect(() => {
      const open = this.open();
      const dialog = this.dialogRef().nativeElement;
      this.dialogEl = dialog;
      if (open && !dialog.open) this.show(dialog);
      else if (!open && dialog.open) dialog.close();
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.dialogEl?.open) {
        this.dialogEl.close();
        this.release();
        this.restoreFocus();
      }
    });
  }

  /** Whether focus entry should go to the least-destructive (paepDialogClose) control. */
  protected destructiveEntry(): boolean {
    return false;
  }

  /** Dismisses the overlay as the user would (ignored while busy). */
  dismiss(): void {
    if (this.busy() || !this.dialogEl?.open) return;
    this.cancelled.emit();
    this.dialogEl.close();
    this.open.set(false);
  }

  protected onCancel(event: Event): void {
    if (this.busy()) {
      event.preventDefault();
      return;
    }
    this.cancelled.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Stops the browser's close request so repeated Escape presses cannot close a busy dialog.
    if (event.key === 'Escape' && this.busy()) event.preventDefault();
  }

  protected onClose(): void {
    this.open.set(false);
    this.scrolled.set(false);
    this.release();
    this.closed.emit();
    this.restoreFocus();
  }

  protected onScroll(): void {
    this.scrolled.set(this.bodyRef().nativeElement.scrollTop > 0);
  }

  private show(dialog: HTMLDialogElement): void {
    const active = dialog.ownerDocument.activeElement;
    this.invoker = active instanceof HTMLElement && active !== dialog.ownerDocument.body ? active : null;
    dialog.showModal();
    // The page behind a modal must not scroll, so the invoker is still in view when focus returns to it.
    const root = dialog.ownerDocument.documentElement;
    this.lockedOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const body = this.bodyRef().nativeElement;
    body.scrollTop = 0;
    const measure = () => this.bodyScrollable.set(body.scrollHeight > body.clientHeight + 1);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.bodyObserver = new ResizeObserver(measure);
      this.bodyObserver.observe(body);
    }
    const field = body.querySelector<HTMLElement>(FIELD_SELECTOR);
    const cancel = this.destructiveEntry() ? this.closers()[0]?.element : undefined;
    (field ?? cancel ?? this.titleRef().nativeElement).focus();
  }

  private release(): void {
    this.bodyObserver?.disconnect();
    this.bodyObserver = null;
    this.bodyScrollable.set(false);
    if (this.lockedOverflow !== null && this.dialogEl) this.dialogEl.ownerDocument.documentElement.style.overflow = this.lockedOverflow;
    this.lockedOverflow = null;
  }

  private restoreFocus(): void {
    const target = this.invoker?.isConnected ? this.invoker : this.returnFocusTo();
    this.invoker = null;
    if (target?.isConnected) {
      target.focus();
      target.scrollIntoView({ block: 'nearest' });
    }
  }
}

/**
 * Marks a control inside a dialog or drawer that dismisses it, typically the Cancel button:
 * `<button paepButton paepDialogClose>Cancel</button>`. Destructive dialogs focus it on entry.
 */
@Directive({
  selector: '[paepDialogClose]',
  host: { '(click)': 'modal.dismiss()' },
})
export class PaepDialogClose {
  protected readonly modal = inject(PaepModalBase);
  /** @internal */
  readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}

/** @internal Template shared by the dialog and the drawer; each supplies its own styles. Not part of the public API. */
export const PAEP_MODAL_TEMPLATE = `
  <dialog
    #dialog
    class="paep-modal"
    [class]="modalClass()"
    [class.paep-modal--scrolled]="scrolled()"
    [attr.aria-labelledby]="titleId"
    [attr.aria-describedby]="description() ? descriptionId : null"
    (cancel)="onCancel($event)"
    (close)="onClose()"
    (keydown)="onKeydown($event)"
  >
    <div class="paep-modal__head">
      <h2 #title class="paep-modal__title" [id]="titleId" tabindex="-1">{{ heading() }}</h2>
      <button
        type="button"
        class="paep-modal__close"
        [attr.aria-label]="closeLabel()"
        [attr.aria-disabled]="busy() || null"
        (click)="dismiss()"
      >
        <svg paepIcon="close"></svg>
      </button>
    </div>
    <div
      #body
      class="paep-modal__body"
      [attr.tabindex]="bodyScrollable() ? 0 : null"
      [attr.role]="bodyScrollable() ? 'region' : null"
      [attr.aria-labelledby]="bodyScrollable() ? titleId : null"
      (scroll)="onScroll()"
    >
      @if (description()) {
        <p class="paep-modal__description" [id]="descriptionId">{{ description() }}</p>
      }
      <ng-content />
    </div>
    @if (footer()) {
      <div class="paep-modal__foot"><ng-content select="paep-dialog-footer" /></div>
    }
  </dialog>
`;

export type PaepDialogSize = 'sm' | 'md' | 'lg';

/**
 * Modal dialog on a native `<dialog>` opened with showModal():
 * `<paep-dialog [(open)]="open" heading="Delete Record 1?" size="sm" destructive>…<paep-dialog-footer>…</paep-dialog-footer></paep-dialog>`.
 * Focus entry: first form field, else the paepDialogClose control of a destructive dialog, else the title.
 */
@Component({
  selector: 'paep-dialog',
  imports: [PaepIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PaepModalBase, useExisting: forwardRef(() => PaepDialog) }],
  template: PAEP_MODAL_TEMPLATE,
  styleUrl: './dialog.css',
})
export class PaepDialog extends PaepModalBase {
  /** sm 25 rem (confirmations), md 35 rem (default), lg 50 rem (content-heavy; full screen below 600 px). */
  readonly size = input<PaepDialogSize>('md');
  /** Destructive confirmation: focus starts on the least-destructive (paepDialogClose) control. */
  readonly destructive = input(false, { transform: booleanAttribute });

  protected readonly modalClass = computed(() => `paep-modal--${this.size()}`);

  protected override destructiveEntry(): boolean {
    return this.destructive();
  }
}
