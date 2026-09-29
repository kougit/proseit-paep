import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepButton, PaepPanel } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const PANEL_META: LabSpecimenMeta = {
  id: 'panel',
  name: 'Panel',
  family: 'Structure',
  selector: 'paep-panel',
  exports: ['PaepPanel'],
  purpose: 'Divide a page into titled sections, optionally collapsible for progressive disclosure of long forms.',
  variants: ['static', 'collapsible (expanded by default; state not persisted)'],
  states: [
    'default (expanded)',
    'collapsed (body hidden; chevron points at inline-end)',
    'with actions (wrap under the title at narrow widths)',
    'long title (wraps)',
    'long content (body grows)',
    'hover (toggle button, collapsible only)',
    'focus-visible (ring on the toggle)',
    'invalid ("Contains 2 errors" in the header while collapsed)',
    'narrow-width (full width)',
  ],
  keyboard: ['Enter / Space on the heading toggle: collapses or expands; focus stays on the toggle.'],
  accessibility: [
    '<section> labelled by its heading; heading level configurable (default h3).',
    'Collapsible: the heading contains a <button aria-expanded aria-controls>; the collapsed body uses hidden.',
    'Errors in collapsed content are shown as text in the header and describe the toggle.',
  ],
  responsive: 'Full width; header actions wrap under the title; padding 16 px below 30 rem.',
  rtl: 'Chevron rotation mirrors.',
  contentKeys: ['paep.form.containsErrors'],
  unitTests: 'packages/components/src/lib/panel/panel.spec.ts',
};

@Component({
  selector: 'lab-panel-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepPanel, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Static">
        <paep-panel heading="Notes" [headingLevel]="4">
          <p class="p">A titled section without a toggle.</p>
        </paep-panel>
      </lab-example>
      <lab-example heading="Collapsible with header action">
        <paep-panel heading="Delivery details" [headingLevel]="4" collapsible [(expanded)]="deliveryOpen">
          <button paepButton variant="tertiary" paepPanelActions>Reset</button>
          <p class="p">Deliver to North depot, loading bay 2.</p>
        </paep-panel>
        <p class="note">Expanded: {{ deliveryOpen() ? 'yes' : 'no' }}</p>
      </lab-example>
      <lab-example heading="Collapsed with errors inside">
        <paep-panel heading="Billing" [headingLevel]="4" collapsible [expanded]="false" [errorCount]="2">
          <p class="p">Two fields in this section need attention.</p>
        </paep-panel>
      </lab-example>
      <lab-example heading="Long title and long content">
        <paep-panel heading="A long panel title that wraps onto a second line when the container is narrow or translated" [headingLevel]="4" collapsible>
          @for (n of paragraphs; track n) {
            <p class="p">Paragraph {{ n }}. The body grows with its content.</p>
          }
        </paep-panel>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-panel heading="Attachments" [headingLevel]="4" collapsible [expanded]="false">
            <p class="p">The collapsed chevron points to the left.</p>
          </paep-panel>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .p {
      margin: 0 0 var(--paep-space-2);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
    }
  `,
})
export class PanelSpecimen {
  protected readonly meta = PANEL_META;
  protected readonly deliveryOpen = signal(true);
  protected readonly paragraphs = [1, 2, 3, 4];
}
