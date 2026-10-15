import { ChangeDetectionStrategy, Component, computed, forwardRef } from '@angular/core';
import { PaepModalBase } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';

/**
 * Modal navigation container below 1024 px (HOF-IB3-001 E-04, Q-09): a sheet from the inline-start edge, at most
 * 20 rem and viewport-constrained, full width below 600 px. Built on the accepted `PaepModalBase` (native modal
 * dialog: Tab contained, Escape or the scrim closes, focus returns to the Open navigation button); it is not a
 * `paep-drawer` variant. Below 600 px the host projects the context and the environment badge into the header region.
 * `<paep-shell-nav-sheet [(open)]="open" heading="Primary navigation" closeLabel="Close navigation">…</paep-shell-nav-sheet>`
 */
@Component({
  selector: 'paep-shell-nav-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  providers: [{ provide: PaepModalBase, useExisting: forwardRef(() => PaepShellNavSheet) }],
  template: `
    <dialog
      #dialog
      id="paep-shell-nav-sheet"
      class="paep-shell-sheet"
      [class]="modalClass()"
      [attr.aria-labelledby]="titleId"
      (cancel)="onCancel($event)"
      (close)="onClose()"
      (keydown)="onKeydown($event)"
      (click)="onBackdrop($event)"
    >
      <div class="paep-shell-sheet__head">
        <h2 #title class="paep-shell-sheet__title" [id]="titleId" tabindex="-1">{{ heading() }}</h2>
        <button type="button" class="paep-shell-sheet__close" [attr.aria-label]="closeLabel()" (click)="dismiss()">
          <svg paepIcon="close"></svg>
        </button>
      </div>
      <ng-content select="[paepShellSheetContext]" />
      <div
        #body
        class="paep-shell-sheet__body"
        [attr.tabindex]="bodyScrollable() ? 0 : null"
        [attr.role]="bodyScrollable() ? 'region' : null"
        [attr.aria-labelledby]="bodyScrollable() ? titleId : null"
        (scroll)="onScroll()"
      >
        <ng-content />
      </div>
    </dialog>
  `,
  styleUrl: './nav-sheet.css',
})
export class PaepShellNavSheet extends PaepModalBase {
  protected readonly modalClass = computed(() => 'paep-shell-sheet');

  /** A click on the dialog element itself is a click on the scrim (the backdrop), which closes the sheet. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dismiss();
  }
}
