import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepButton } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const BUTTON_META: LabSpecimenMeta = {
  id: 'button',
  name: 'Button',
  family: 'Actions',
  selector: 'button[paepButton], a[paepButton]',
  exports: ['PaepButton', 'PaepButtonVariant', 'PaepButtonType'],
  purpose: 'Trigger a single task action. The visible label names the outcome ("Save changes", "Delete record").',
  variants: [
    'primary (brand fill; one per region)',
    'secondary (surface fill + 1px border; default)',
    'tertiary (no container until hover)',
    'destructive (error-strong fill; label names the outcome)',
    'leading icon / trailing icon',
    'block (full width, a layout option at narrow widths)',
    'link-styled button (a[paepButton])',
    'size comes from density (40px comfortable / 32px compact), not from a size variant',
  ],
  states: [
    'default',
    'hover (pointer only; tertiary gains an underline)',
    'focus-visible (2px ring, 2px offset, white halo)',
    'active/pressed',
    'disabled (native disabled + dashed border)',
    'loading (spinner replaces the leading icon, aria-busy + aria-disabled, focusable, activation suppressed, width locked)',
    'long-label (wraps, never truncated)',
    'narrow-width (primary stretches inside an action group)',
  ],
  keyboard: ['Enter / Space: activate a <button>.', 'Enter: follow an a[paepButton] link (links navigate; they never run in-page actions).'],
  accessibility: [
    'Native <button> (type="button" by default; set type="submit" for form submission) or native <a href>.',
    'Accessible name from the visible label; icons are aria-hidden.',
    'Loading: aria-busy="true" + aria-disabled="true"; focus stays on the busy button; clicks, Enter and Space do nothing.',
    'Disabled: native disabled plus a dashed border (non-colour cue); give an adjacent reason when the cause is not obvious.',
    'Hiding or disabling a button is never the authorisation control.',
  ],
  responsive: 'Intrinsic width at wide sizes; full width (block) as the primary action of a narrow action group or dialog footer.',
  rtl: 'The leading icon moves to the inline-start (right); directional icons mirror.',
  contentKeys: ['paep.button.busy'],
  unitTests: 'packages/components/src/lib/button/button.spec.ts',
};

@Component({
  selector: 'lab-button-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Variants">
        <div class="row">
          <button paepButton variant="primary">Save changes</button>
          <button paepButton>Cancel</button>
          <button paepButton variant="tertiary">View history</button>
          <button paepButton variant="destructive" icon="delete">Delete record</button>
        </div>
      </lab-example>
      <lab-example heading="Icons">
        <div class="row">
          <button paepButton variant="primary" icon="plus">Add record</button>
          <button paepButton icon="retry">Retry</button>
          <a paepButton href="#lab-examples" trailingIcon="chevron-end">Next step</a>
        </div>
      </lab-example>
      <lab-example heading="Loading (activate to start; focus stays on the button)">
        <div class="row">
          <button paepButton variant="primary" icon="check" [loading]="saving()" (click)="save()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
          <button paepButton [loading]="true">Exporting…</button>
        </div>
        <p class="note">Saved {{ saves() }} time(s). Activations while busy are ignored.</p>
      </lab-example>
      <lab-example heading="Disabled (with a visible reason)">
        <div class="row">
          <button paepButton variant="primary" disabled aria-describedby="btn-reason">Approve</button>
          <button paepButton disabled>Cancel</button>
          <button paepButton variant="tertiary" disabled>View history</button>
          <button paepButton variant="destructive" disabled>Delete record</button>
        </div>
        <p class="note" id="btn-reason">Approval is unavailable while the record is locked for review.</p>
      </lab-example>
      <lab-example heading="Long label (wraps, never truncated)">
        <div class="narrow">
          <button paepButton variant="primary" icon="check">Save the changes to this record and continue to the next step</button>
        </div>
      </lab-example>
      <lab-example heading="Block (full width)">
        <button paepButton variant="primary" block>Continue</button>
      </lab-example>
      <lab-example heading="Compact density">
        <div class="row" data-paep-density="compact">
          <button paepButton variant="primary">Save changes</button>
          <button paepButton icon="plus">Add record</button>
        </div>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div class="row" dir="rtl">
          <button paepButton variant="primary" icon="plus">Add record</button>
          <button paepButton trailingIcon="chevron-end">Next step</button>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 4);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class ButtonSpecimen {
  protected readonly meta = BUTTON_META;
  protected readonly saving = signal(false);
  protected readonly saves = signal(0);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saves.update((n) => n + 1);
    }, 1500);
  }
}
