import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepBreadcrumb, PaepBreadcrumbItem } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const BREADCRUMB_META: LabSpecimenMeta = {
  id: 'breadcrumb',
  name: 'Breadcrumb',
  family: 'Navigation',
  selector: 'paep-breadcrumb',
  exports: ['PaepBreadcrumb', 'PaepBreadcrumbItem'],
  purpose: 'Show the location of the current page in a hierarchy and allow moving up.',
  variants: ['full', 'collapsed (first · … · parent · current)'],
  states: [
    'default (all segments, wrapping when needed)',
    'collapsed (more than 4 segments, or container below 36 rem)',
    'expanded ("…" activated: all segments inline; focus on the first revealed link)',
    'hover (link underline thickens)',
    'focus-visible (links and "…" button)',
    'selected (current page: aria-current="page", weight 600, not a link)',
    'long-label (segments wrap; no truncation)',
    'narrow-width (collapsed variant; wraps as needed)',
  ],
  keyboard: ['Tab: moves between links and the "…" button.', 'Enter: follows a link or expands the full path.'],
  accessibility: [
    '<nav aria-label="Breadcrumb"> with an ordered list; the current item has aria-current="page".',
    '"…" is a <button aria-expanded="false" aria-label="Show full path">; expanding moves focus to the first revealed link.',
    'Separators are decorative icons (aria-hidden) and are not read.',
  ],
  responsive: 'Container-based collapse at 36 rem (and above 4 segments); segments wrap.',
  rtl: 'Reading order right to left; separators mirror.',
  contentKeys: ['paep.breadcrumb.label', 'paep.breadcrumb.showFullPath'],
  unitTests: 'packages/components/src/lib/breadcrumb/breadcrumb.spec.ts',
};

@Component({
  selector: 'lab-breadcrumb-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepBreadcrumb],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Full (3 segments)">
        <paep-breadcrumb [items]="short" />
      </lab-example>
      <lab-example heading="Collapsed (more than 4 segments; activate … to expand)">
        <paep-breadcrumb [items]="long" />
      </lab-example>
      <lab-example heading="Narrow container (below 36 rem, 4 segments)">
        <div class="narrow">
          <paep-breadcrumb [items]="four" />
        </div>
      </lab-example>
      <lab-example heading="Long segments">
        <paep-breadcrumb [items]="wordy" />
      </lab-example>
      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-breadcrumb [items]="short" />
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 4);
    }
  `,
})
export class BreadcrumbSpecimen {
  protected readonly meta = BREADCRUMB_META;
  protected readonly short: readonly PaepBreadcrumbItem[] = [
    { label: 'Laboratory home', link: '/' },
    { label: 'Records', href: '#lab-examples' },
    { label: 'Record 1' },
  ];
  protected readonly four: readonly PaepBreadcrumbItem[] = [
    { label: 'Laboratory home', link: '/' },
    { label: 'North depot', href: '#lab-examples' },
    { label: 'Records', href: '#lab-examples' },
    { label: 'Record 1' },
  ];
  protected readonly long: readonly PaepBreadcrumbItem[] = [
    { label: 'Laboratory home', link: '/' },
    { label: 'North depot', href: '#lab-examples' },
    { label: 'Records', href: '#lab-examples' },
    { label: 'Record group 4', href: '#lab-examples' },
    { label: 'Record 1' },
  ];
  protected readonly wordy: readonly PaepBreadcrumbItem[] = [
    { label: 'Laboratory home', link: '/' },
    { label: 'A long parent segment name that wraps onto more than one line', href: '#lab-examples' },
    { label: 'A long current page title that also wraps without being truncated' },
  ];
}
