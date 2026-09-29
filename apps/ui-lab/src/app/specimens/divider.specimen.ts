import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepDivider, PaepVerticalDivider } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const DIVIDER_META: LabSpecimenMeta = {
  id: 'divider',
  name: 'Divider',
  family: 'Structure',
  selector: 'hr[paepDivider], paep-divider[vertical]',
  exports: ['PaepDivider', 'PaepVerticalDivider'],
  purpose: 'Separate groups of content when spacing alone is insufficient.',
  variants: ['horizontal (full)', 'horizontal (inset)', 'vertical', 'decorative (aria-hidden)'],
  states: ['default (only state)', 'narrow-width (vertical dividers hide when the items beside them wrap)'],
  keyboard: ['None.'],
  accessibility: [
    'Horizontal: native <hr> (thematic break, implicit separator role), or aria-hidden with decorative.',
    'Vertical: role="separator" aria-orientation="vertical" when it separates groups meaningfully; decorative makes it aria-hidden.',
    'Decorative contrast exempt; 1 px border-subtle line.',
  ],
  responsive: 'Vertical dividers inside wrapping rows are hidden when the items wrap.',
  rtl: 'Logical margins.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/divider/divider.spec.ts',
};

@Component({
  selector: 'lab-divider-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepDivider, PaepVerticalDivider],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Horizontal (full and inset)">
        <p class="p">Delivery address</p>
        <hr paepDivider />
        <p class="p">Billing address</p>
        <hr paepDivider inset decorative />
        <p class="p">Notes (the inset divider above is decorative)</p>
      </lab-example>
      <lab-example heading="Vertical (resize to see it hide when items wrap)">
        <div class="row">
          <span>Filters applied: 3</span>
          <paep-divider vertical />
          <span>Sorted by record name</span>
          <paep-divider vertical decorative />
          <span>42 records</span>
        </div>
      </lab-example>
      <lab-example heading="Compact density">
        <div data-paep-density="compact">
          <p class="p">Group A</p>
          <hr paepDivider />
          <p class="p">Group B</p>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .p {
      margin: 0;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      row-gap: var(--paep-space-2);
    }
  `,
})
export class DividerSpecimen {
  protected readonly meta = DIVIDER_META;
}
