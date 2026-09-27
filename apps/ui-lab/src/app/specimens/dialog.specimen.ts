import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepButton, PaepDialog, PaepDialogClose, PaepDialogFooter } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const DIALOG_META: LabSpecimenMeta = {
  id: 'dialog',
  name: 'Dialog',
  family: 'Overlay',
  selector: 'paep-dialog, paep-dialog-footer, [paepDialogClose]',
  exports: ['PaepDialog', 'PaepDialogFooter', 'PaepDialogClose', 'PaepModalBase', 'PaepDialogSize'],
  purpose: 'Interrupt for a short, focused decision or task that must complete or be cancelled before returning.',
  variants: ['sm 25 rem (confirmations)', 'md 35 rem (default)', 'lg 50 rem (content-heavy)', 'destructive confirmation (sm + destructive primary + Cancel)'],
  states: [
    'open (top layer, scrim, focus inside)',
    'long-content (body scrolls; header and footer fixed; header divider when scrolled)',
    'busy (primary loading; Escape, close button and Cancel suppressed)',
    'focus-visible (standard ring on all controls)',
    'long-label (title wraps; footer buttons wrap or stack)',
    'narrow-width (< 600 px: 16 px inset, stacked footer; lg full screen)',
    'invalid (form dialog shows field errors in the body)',
  ],
  keyboard: [
    'Tab / Shift+Tab: cycle within the dialog (native modal inertness).',
    'Escape: Cancel when dismissible; suppressed while busy.',
    'Enter: activates the focused button; submits only from a field in a form dialog.',
  ],
  accessibility: [
    'Native <dialog> opened with showModal(); aria-labelledby = title; aria-describedby = main message when given.',
    'Focus entry: first form field (form dialogs), Cancel (destructive confirmations), otherwise the title (tabindex=-1).',
    'Focus returns to the invoking control; if it no longer exists, to returnFocusTo (for example the region heading).',
    'Close icon button named "Close"; the destructive button is never focused automatically.',
  ],
  responsive: 'sm/md/lg widths clamp to the viewport with a 24 px margin and max-height viewport - 48 px; below 600 px the dialog is inset 16 px, footer actions stack full width in DOM order and lg becomes full screen.',
  rtl: 'Close button at inline-end (left); footer order mirrors.',
  contentKeys: ['paep.common.close', 'paep.common.cancel'],
  unitTests: 'packages/components/src/lib/dialog/dialog.spec.ts',
};

@Component({
  selector: 'lab-dialog-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepDialog, PaepDialogFooter, PaepDialogClose, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Destructive confirmation (sm, busy while deleting)">
        <button paepButton variant="destructive" (click)="confirmOpen.set(true)">Delete Record 1</button>
        @if (deleted()) {
          <p class="note" role="status">Record 1 was deleted (simulated).</p>
        }
        <paep-dialog
          [(open)]="confirmOpen"
          size="sm"
          destructive
          heading="Delete Record 1?"
          description="Record 1 and its 3 attachments will be removed. This cannot be undone."
          [busy]="deleting()"
        >
          <paep-dialog-footer>
            <button paepButton paepDialogClose [disabled]="deleting()">Cancel</button>
            <button paepButton variant="destructive" icon="delete" [loading]="deleting()" (click)="confirmDelete()">Delete record</button>
          </paep-dialog-footer>
        </paep-dialog>
      </lab-example>

      <lab-example heading="Informational, long content (md)">
        <button paepButton (click)="termsOpen.set(true)">Read the retention rules</button>
        <paep-dialog [(open)]="termsOpen" heading="Record retention rules">
          @for (n of paragraphs; track n) {
            <p>Rule {{ n }}. Records are kept for the configured retention period and then archived. Archived records stay searchable but cannot be edited.</p>
          }
          <paep-dialog-footer>
            <button paepButton variant="primary" paepDialogClose>Close</button>
          </paep-dialog-footer>
        </paep-dialog>
      </lab-example>

      <lab-example heading="Form dialog (lg) with validation">
        <button paepButton variant="primary" (click)="formOpen.set(true)">Rename depot</button>
        <paep-dialog [(open)]="formOpen" size="lg" heading="Rename depot" (closed)="nameError.set(false)">
          <form id="lab-rename-form" class="form" (submit)="$event.preventDefault(); save(nameInput.value)">
            <label for="lab-depot-name">Depot name</label>
            <input
              #nameInput
              id="lab-depot-name"
              class="input"
              value="North depot"
              [attr.aria-invalid]="nameError() || null"
              [attr.aria-describedby]="nameError() ? 'lab-depot-name-error' : null"
            />
            @if (nameError()) {
              <p id="lab-depot-name-error" class="error">Error: enter a depot name.</p>
            }
          </form>
          <paep-dialog-footer>
            <button paepButton paepDialogClose>Cancel</button>
            <button paepButton variant="primary" type="submit" form="lab-rename-form">Save changes</button>
          </paep-dialog-footer>
        </paep-dialog>
      </lab-example>

      <lab-example heading="Long title and RTL">
        <div dir="rtl">
          <button paepButton (click)="rtlOpen.set(true)">Open right-to-left dialog</button>
          <paep-dialog
            [(open)]="rtlOpen"
            heading="A long dialog title that wraps onto a second line when translated into a longer language"
          >
            <p>The close button sits at the inline-end (left) and the footer order mirrors.</p>
            <paep-dialog-footer>
              <button paepButton paepDialogClose>Cancel</button>
              <button paepButton variant="primary" paepDialogClose>Continue</button>
            </paep-dialog-footer>
          </paep-dialog>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .note {
      margin: var(--paep-space-3) 0 0;
    }
    .form {
      display: grid;
      gap: var(--paep-space-1);
    }
    .input {
      min-block-size: var(--paep-density-control-height);
      padding-inline: var(--paep-density-control-padding-inline);
      border: 1px solid var(--paep-color-border-default);
      border-radius: var(--paep-radius-sm);
      font: inherit;
    }
    .input[aria-invalid='true'] {
      border: 2px solid var(--paep-color-invalid-border);
    }
    .error {
      margin: 0;
      color: var(--paep-color-invalid-fg);
    }
  `,
})
export class DialogSpecimen {
  protected readonly meta = DIALOG_META;
  protected readonly paragraphs = Array.from({ length: 24 }, (_, i) => i + 1);
  protected readonly confirmOpen = signal(false);
  protected readonly termsOpen = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly rtlOpen = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleted = signal(false);
  protected readonly nameError = signal(false);

  protected confirmDelete(): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    setTimeout(() => {
      this.deleting.set(false);
      this.deleted.set(true);
      this.confirmOpen.set(false);
    }, 1500);
  }

  protected save(name: string): void {
    this.nameError.set(!name.trim());
    if (!this.nameError()) this.formOpen.set(false);
  }
}
