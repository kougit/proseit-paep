import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepPagination } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const PAGINATION_META: LabSpecimenMeta = {
  id: 'pagination',
  name: 'Pagination',
  family: 'Data',
  selector: 'paep-pagination',
  exports: ['PaepPagination'],
  purpose:
    'Move between pages of a bounded, server- or input-paged collection. IR-01 lists pagination under both Data and Navigation; it is one component.',
  variants: ['full (container at least 36 rem)', 'compact (below 36 rem: Previous · "8 / 20" · Next)', 'buttons (default) or links (pageHref)'],
  states: [
    'default (middle page)',
    'first page (Previous aria-disabled, not removed)',
    'last page (Next aria-disabled)',
    'hover and active (neutral)',
    'focus-visible (ring on each control)',
    'selected (current page: aria-current="page", selected fill, 2 px indicator border, bold)',
    'long-label (Previous / Next wrap; numbers never wrap)',
    'narrow-width (compact variant)',
  ],
  keyboard: ['Tab: moves between Previous, page numbers and Next.', 'Enter (and Space on buttons): activates.'],
  accessibility: [
    '<nav aria-label="Pagination"> containing a list of controls; the current page has aria-current="page" and the name "Page 8, current page".',
    'Disabled ends use aria-disabled="true" (and no href for links) and stay in place to avoid layout shift.',
    'After a page change focus moves to the paged region heading or caption (focusTarget) so the new content is announced.',
    'Current page is marked by fill, border and weight, not colour alone; targets are at least 24 px.',
  ],
  responsive: 'Container-query switch at 36 rem to the compact variant with visible "8 / 20" status text.',
  rtl: 'Previous at inline-start (right); chevrons mirror; digits stay LTR unless the locale formats differ.',
  contentKeys: [
    'paep.pagination.label',
    'paep.pagination.previous',
    'paep.pagination.next',
    'paep.pagination.previousPage',
    'paep.pagination.nextPage',
    'paep.pagination.page',
    'paep.pagination.currentPage',
    'paep.pagination.summary',
    'paep.pagination.compact',
  ],
  unitTests: 'packages/components/src/lib/pagination/pagination.spec.ts',
};

@Component({
  selector: 'lab-pagination-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepPagination],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Middle page (focus moves to the region heading)">
        <p class="region-heading" #region>Records, page {{ page() }}</p>
        <paep-pagination [(page)]="page" [pageCount]="20" [focusTarget]="region" />
      </lab-example>
      <lab-example heading="First page">
        <paep-pagination [page]="1" [pageCount]="20" />
      </lab-example>
      <lab-example heading="Last page">
        <paep-pagination [page]="20" [pageCount]="20" />
      </lab-example>
      <lab-example heading="Links (pageHref)">
        <paep-pagination [(page)]="linkPage" [pageCount]="5" [pageHref]="href" />
      </lab-example>
      <lab-example heading="Compact (container below 36 rem)">
        <div class="narrow">
          <paep-pagination [(page)]="compactPage" [pageCount]="20" />
        </div>
      </lab-example>
      <lab-example heading="Long labels (translated text)">
        <paep-pagination [(page)]="longPage" [pageCount]="9" previousLabel="Vorherige Ergebnisseite" nextLabel="Nächste Ergebnisseite" />
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .region-heading {
      margin: 0 0 var(--paep-space-3);
      font-weight: var(--paep-font-weight-label);
    }
    .narrow {
      max-inline-size: 22rem;
    }
  `,
})
export class PaginationSpecimen {
  protected readonly meta = PAGINATION_META;
  protected readonly page = signal(8);
  protected readonly linkPage = signal(2);
  protected readonly compactPage = signal(8);
  protected readonly longPage = signal(5);
  protected readonly href = (p: number): string => `/components/pagination?page=${p}`;
}
