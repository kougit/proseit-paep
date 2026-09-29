import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepSkeleton } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const SKELETON_META: LabSpecimenMeta = {
  id: 'skeleton',
  name: 'Skeleton',
  family: 'Feedback',
  selector: 'paep-skeleton',
  exports: ['PaepSkeleton', 'PaepSkeletonShape'],
  purpose: 'Reserve layout and signal loading for content with a known shape.',
  variants: ['text lines (shape="text", last line 60%)', 'list item (shape="item")', 'table cell (shape="cell", used by the table shell)'],
  states: ['loading (opacity pulse 1 to 0.5, 1.6 s alternate)', 'reduced-motion (static blocks, no pulse)', 'narrow-width (fluid blocks)'],
  keyboard: ['None.'],
  accessibility: [
    'aria-hidden="true": the skeleton is invisible to assistive technology.',
    'The busy container carries aria-busy="true" and a visually hidden "Loading…" text (the table shell and list do this themselves).',
    'The pulse stops under prefers-reduced-motion and the UI-lab reduced-motion simulation (WCAG 2.2.2). No directional shimmer.',
  ],
  responsive: 'Fluid: blocks take a percentage of the container width.',
  rtl: 'The short last line aligns to inline-start.',
  contentKeys: ['paep.common.loading'],
  unitTests: 'packages/components/src/lib/skeleton/skeleton.spec.ts',
};

@Component({
  selector: 'lab-skeleton-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepSkeleton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Text lines in a busy region">
        <div aria-busy="true">
          <paep-skeleton shape="text" [lines]="3" />
          <span class="paep-visually-hidden">Loading…</span>
        </div>
      </lab-example>
      <lab-example heading="List items">
        <div aria-busy="true" class="stack">
          <paep-skeleton shape="item" />
          <paep-skeleton shape="item" />
          <span class="paep-visually-hidden">Loading…</span>
        </div>
      </lab-example>
      <lab-example heading="Table cells">
        <div aria-busy="true" class="cells">
          <paep-skeleton shape="cell" />
          <paep-skeleton shape="cell" />
          <paep-skeleton shape="cell" />
          <span class="paep-visually-hidden">Loading…</span>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-4);
    }
    .cells {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--paep-space-4);
    }
  `,
})
export class SkeletonSpecimen {
  protected readonly meta = SKELETON_META;
}
