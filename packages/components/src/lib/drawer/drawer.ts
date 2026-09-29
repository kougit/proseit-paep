import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MODAL_TEMPLATE, PaepModalBase } from '../dialog/dialog';

export type PaepDrawerSide = 'end' | 'start';
export type PaepDrawerSize = 'md' | 'lg';

/**
 * Modal side sheet on a native `<dialog>` opened with showModal():
 * `<paep-drawer [(open)]="open" heading="Record 1">…<paep-dialog-footer>…</paep-dialog-footer></paep-drawer>`.
 * Attached to the inline-end edge by default (left in RTL); full width below 600 px.
 * Focus entry: first form field, else the title. Focus returns to the invoker; Escape closes unless busy.
 */
@Component({
  selector: 'paep-drawer',
  imports: [PaepIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PaepModalBase, useExisting: forwardRef(() => PaepDrawer) }],
  template: PAEP_MODAL_TEMPLATE,
  styleUrl: './drawer.css',
})
export class PaepDrawer extends PaepModalBase {
  /** Edge the sheet attaches to: end (default) or start (only for content related to the start edge). */
  readonly side = input<PaepDrawerSide>('end');
  /** md 30 rem (default) or lg 40 rem. */
  readonly size = input<PaepDrawerSize>('md');

  protected readonly modalClass = computed(() => `paep-modal--${this.side()} paep-modal--${this.size()}`);
}
