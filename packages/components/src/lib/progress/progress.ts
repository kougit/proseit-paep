import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';

/**
 * Progress of a long-running operation: a native <progress> with a visible <label> and value text.
 * - determinate: `<paep-progress label="Uploading files" [value]="45" />` shows "45%".
 * - step: `<paep-progress label="Import" [value]="3" [steps]="7" />` shows "Step 3 of 7".
 * - indeterminate: omit `value` (or pass null). A 35% segment travels along the track; under reduced motion
 *   it becomes a static hatched fill with the text "In progress".
 * Completion is announced by the consumer (status message or success alert).
 */
@Component({
  selector: 'paep-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'paep-progress', '[attr.data-mode]': 'mode()' },
  template: `
    <div class="paep-progress__head">
      <label [for]="id">{{ label() }}</label>
      @if (mode() === 'indeterminate') {
        <span class="paep-progress__value paep-progress__value--reduced">{{ inProgressText() }}</span>
      } @else {
        <span class="paep-progress__value">{{ valueDisplay() }}</span>
      }
    </div>
    <progress
      [id]="id"
      [attr.value]="mode() === 'indeterminate' ? null : clampedValue()"
      [attr.max]="effectiveMax()"
      [attr.aria-valuetext]="mode() === 'step' ? valueDisplay() : null"
    ></progress>
  `,
  styleUrl: './progress.css',
})
export class PaepProgress {
  private static nextId = 0;
  private readonly messages = inject(PAEP_MESSAGES);
  protected readonly id = `paep-progress-${PaepProgress.nextId++}`;

  /** Visible label naming the operation (required: a percentage without a label is prohibited). */
  readonly label = input.required<string>();
  /** Current value (or current step). Null/undefined means indeterminate. */
  readonly value = input<number | null | undefined>(undefined);
  /** Maximum for the percentage variant. */
  readonly max = input<number>(100);
  /** Total number of steps; switches to the step variant ("Step {step} of {total}"). */
  readonly steps = input<number | null | undefined>(undefined);
  /** Overrides the visible value text. */
  readonly valueText = input<string>('');
  /** Overrides the reduced-motion indeterminate text (default paep.common.inProgress). */
  readonly inProgressLabel = input<string>('');

  protected readonly mode = computed<'determinate' | 'step' | 'indeterminate'>(() => {
    if (this.value() === null || this.value() === undefined) return 'indeterminate';
    return this.steps() ? 'step' : 'determinate';
  });
  protected readonly effectiveMax = computed(() => (this.mode() === 'step' ? (this.steps() ?? 1) : this.max() > 0 ? this.max() : 100));
  protected readonly clampedValue = computed(() => Math.min(this.effectiveMax(), Math.max(0, this.value() ?? 0)));
  protected readonly valueDisplay = computed(() => {
    if (this.valueText()) return this.valueText();
    if (this.mode() === 'step') {
      return paepFormat(this.messages['paep.progress.step'], { step: this.clampedValue(), total: this.effectiveMax() });
    }
    return paepFormat(this.messages['paep.progress.percent'], { value: this.clampedValue() / this.effectiveMax() });
  });
  protected readonly inProgressText = computed(() => this.inProgressLabel() || this.messages['paep.common.inProgress']);
}
