import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepButton, PaepCard } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const CARD_META: LabSpecimenMeta = {
  id: 'card',
  name: 'Card',
  family: 'Structure',
  selector: 'paep-card',
  exports: ['PaepCard', 'PaepCardHeadingLevel'],
  purpose: 'Group a self-contained unit of related content (for example a summary) within a page or grid.',
  variants: ['default (elevation level 1)'],
  states: [
    'default',
    'with header (title, description, actions)',
    'with actions (header actions wrap under the title below 30 rem)',
    'long title (wraps; actions move beneath)',
    'long content (body grows; no inner scroll)',
    'focus-visible (on contained controls only)',
    'narrow-width (full width; padding 16 px)',
  ],
  keyboard: ['None of its own; contained controls keep their native keyboard behaviour.'],
  accessibility: [
    '<section> labelled by its heading (aria-labelledby); heading level configurable (default h3).',
    'Not interactive: no whole-card click target and no hover effect.',
  ],
  responsive: 'Container query: header actions wrap under the title and padding becomes 16 px below 30 rem.',
  rtl: 'Header actions at inline-end (left).',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/card/card.spec.ts',
};

@Component({
  selector: 'lab-card-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepCard, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="With header, actions and footer">
        <paep-card heading="North depot summary" [headingLevel]="4" description="Updated today">
          <button paepButton variant="tertiary" paepCardActions>Edit</button>
          <p class="p">42 records, 3 awaiting review.</p>
          <button paepButton paepCardFooter>Open records</button>
        </paep-card>
      </lab-example>
      <lab-example heading="Body only">
        <paep-card><p class="p">A card without a header groups content without its own heading.</p></paep-card>
      </lab-example>
      <lab-example heading="Long title and long content">
        <paep-card heading="A long card title that wraps onto two lines or more when the container is narrow" [headingLevel]="4">
          <button paepButton variant="tertiary" paepCardActions>Edit</button>
          @for (n of paragraphs; track n) {
            <p class="p">Paragraph {{ n }}. The body grows with its content and never scrolls inside the card.</p>
          }
        </paep-card>
      </lab-example>
      <lab-example heading="Narrow container (below 30 rem)">
        <div class="narrow">
          <paep-card heading="Record 1" [headingLevel]="4" description="North depot">
            <button paepButton variant="tertiary" paepCardActions>Edit</button>
            <p class="p">Actions wrap under the title; padding is 16 px.</p>
          </paep-card>
        </div>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-card heading="Record 2" [headingLevel]="4">
            <button paepButton variant="tertiary" paepCardActions>Edit</button>
            <p class="p">Header actions sit at the inline-end (left).</p>
          </paep-card>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .p {
      margin: 0 0 var(--paep-space-2);
    }
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 4);
    }
  `,
})
export class CardSpecimen {
  protected readonly meta = CARD_META;
  protected readonly paragraphs = [1, 2, 3, 4];
}
