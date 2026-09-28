import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepProgress } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const PROGRESS_META: LabSpecimenMeta = {
  id: 'progress',
  name: 'Progress',
  family: 'Feedback',
  selector: 'paep-progress',
  exports: ['PaepProgress'],
  purpose: 'Show progress of a long-running operation.',
  variants: ['determinate (percentage)', 'step ("Step 3 of 7")', 'indeterminate (no value)'],
  states: [
    'determinate (fill width = value, value text always visible)',
    'indeterminate (35% segment travels along the track, 1.8 s loop)',
    'reduced-motion (indeterminate becomes a static hatched fill with "In progress"; determinate changes without transition)',
    'complete (the consumer replaces it with a success alert or status text)',
    'long-label (label wraps, value text moves below)',
    'loading (= indeterminate)',
    'narrow-width (unchanged)',
  ],
  keyboard: ['None: progress is not focusable.'],
  accessibility: [
    'Native <progress> (value/max; no value = indeterminate) named by a visible <label>.',
    'The step variant exposes aria-valuetext "Step 3 of 7".',
    'Completion is announced by the consumer through a status message.',
    'Fill vs track contrast 8.67:1 (brand primary on neutral-200).',
  ],
  responsive: 'Fluid width; the label and value text wrap.',
  rtl: 'The fill grows from inline-start (right) and the indeterminate segment travels right to left.',
  contentKeys: ['paep.progress.percent', 'paep.progress.step', 'paep.common.inProgress'],
  unitTests: 'packages/components/src/lib/progress/progress.spec.ts',
};

@Component({
  selector: 'lab-progress-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepProgress],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Determinate">
        <div class="stack">
          <paep-progress label="Uploading files" [value]="value()" />
          <div class="row">
            <button type="button" (click)="value.set(Math.max(0, value() - 15))">Decrease</button>
            <button type="button" (click)="value.set(Math.min(100, value() + 15))">Increase</button>
          </div>
        </div>
      </lab-example>
      <lab-example heading="Step">
        <paep-progress label="Import records" [value]="3" [steps]="7" />
      </lab-example>
      <lab-example heading="Indeterminate (static hatched fill with reduced motion)">
        <paep-progress label="Preparing export" />
      </lab-example>
      <lab-example heading="Long label">
        <paep-progress label="Importing the quarterly stock movement records for every northern depot" [value]="80" />
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-3);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    button {
      min-block-size: var(--paep-size-target-touch);
    }
  `,
})
export class ProgressSpecimen {
  protected readonly meta = PROGRESS_META;
  protected readonly Math = Math;
  protected readonly value = signal(45);
}
