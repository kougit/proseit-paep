import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, model } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PaepIcon } from '@proseit/paep-foundation';
import { PaepCardHeadingLevel } from '../card/card';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';

let nextPanelId = 0;

/**
 * Titled page section, optionally collapsible (disclosure pattern):
 * `<paep-panel heading="Delivery" collapsible [(expanded)]="open">body</paep-panel>`.
 * Collapsible panels put a button with aria-expanded/aria-controls inside the heading; the collapsed
 * body is hidden. Header actions go in `[paepPanelActions]`. Expanded by default; state is not persisted.
 */
@Component({
  selector: 'paep-panel',
  imports: [NgTemplateOutlet, PaepIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class PaepPanel {
  private readonly messages = inject(PAEP_MESSAGES);

  /** Title text (the section's accessible name). */
  readonly heading = input.required<string>();
  /** Heading level of the title (default 3). */
  readonly headingLevel = input<PaepCardHeadingLevel>(3);
  /** Whether the body can be collapsed with a toggle button in the heading. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Expanded state of a collapsible panel. Two-way bindable: `[(expanded)]`. */
  readonly expanded = model(true);
  /** Errors inside the body; announced in the header while collapsed so they are not hidden from view. */
  readonly errorCount = input(0);

  protected readonly headingId = `paep-panel-${nextPanelId}-heading`;
  protected readonly bodyId = `paep-panel-${nextPanelId}-body`;
  protected readonly errorsId = `paep-panel-${nextPanelId++}-errors`;
  protected readonly collapsed = computed(() => this.collapsible() && !this.expanded());
  protected readonly errorText = computed(() =>
    paepFormat(this.messages['paep.form.containsErrors'], { count: this.errorCount() }),
  );

  protected toggle(): void {
    this.expanded.update((v) => !v);
  }
}
