import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PaepCollectionState,
  PaepPagination,
  PaepStatusBadge,
  PaepStatusTone,
  PaepTable,
  PaepTableCell,
  PaepTableColumn,
  PaepTableRow,
} from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const TABLE_META: LabSpecimenMeta = {
  id: 'table',
  name: 'Table shell',
  family: 'Data',
  selector: 'paep-table, ng-template[paepTableCell]',
  exports: ['PaepTable', 'PaepTableCell', 'PaepTableColumn', 'PaepTableRow', 'PaepTableVariant', 'PaepTableCellContext', 'PaepCollectionState'],
  purpose: 'Present a bounded, backend-neutral set of rows with a caption, column headers and complete state handling.',
  variants: [
    'standard (priority columns + row detail, primary)',
    'scroll (bounded inner horizontal scroll with sticky first column; fallback for genuinely two-dimensional comparison only)',
  ],
  states: [
    'loading (skeleton rows, header retained, aria-busy, polite "Loading records")',
    'empty (empty state with optional create action)',
    'filtered/no-results (no-results state with Clear filters)',
    'populated',
    'error (error alert with Retry and reference; after reload focus moves to the caption)',
    'focus-visible (Details buttons, links, scroll region)',
    'read-only (by nature)',
    'long-label (headers wrap below 40 rem; IDs break anywhere)',
    'narrow-width (priority columns move to the row detail)',
  ],
  keyboard: [
    'Tab: reaches links, Details buttons and actions only.',
    'Enter / Space on Details: toggles the row detail; focus stays on the button.',
    'Scroll fallback: the region is a tab stop; arrow keys scroll it.',
  ],
  accessibility: [
    'Native <table> with a <caption>, <th scope="col"> headers and the key cell as <th scope="row">.',
    'Details button: aria-expanded, aria-controls to the detail row, name "Details for {rowName}"; the detail row is a <dl> repeating the hidden headers as <dt>.',
    'State messages in a polite live region outside the busy table; the error alert uses role="alert".',
    'Fallback region: role="region", aria-label "{caption}, scrollable", tabindex="0".',
    'Bounded data volume: renders every row it is given (no virtual scrolling); keep a page to at most 100 rows and page with paep-pagination in the footer slot.',
  ],
  responsive:
    'Container width: at 60 rem and wider every column shows; below 60 rem priority-3 columns move to the row detail; below 40 rem priority-2 columns also move, Details becomes icon-only and headers wrap. The key column and status never hide. No page-wide horizontal scroll.',
  rtl: 'Column order mirrors with the native table direction; numeric columns align to the inline end; identifiers keep dir="ltr".',
  contentKeys: [
    'paep.table.details',
    'paep.table.detailsFor',
    'paep.table.loading',
    'paep.table.count',
    'paep.table.errorTitle',
    'paep.table.errorBody',
    'paep.table.errorReference',
    'paep.table.scrollRegion',
    'paep.common.retry',
    'paep.empty.title',
    'paep.noResults.title',
    'paep.noResults.clear',
  ],
  unitTests: 'packages/components/src/lib/table/table.spec.ts',
};

const COLUMNS: readonly PaepTableColumn[] = [
  { key: 'name', header: 'Record', secondaryKey: 'ref' },
  { key: 'location', header: 'Location', priority: 3 },
  { key: 'quantity', header: 'Quantity', priority: 2, numeric: true },
  { key: 'updated', header: 'Updated', priority: 3 },
  { key: 'status', header: 'Status' },
];

const SCROLL_COLUMNS: readonly PaepTableColumn[] = [
  { key: 'ref', header: 'Reference', identifier: true },
  { key: 'name', header: 'Name' },
  { key: 'location', header: 'Location' },
  { key: 'quantity', header: 'Quantity', numeric: true },
  { key: 'updated', header: 'Updated' },
  { key: 'status', header: 'Status' },
];

const TONES: Readonly<Record<string, PaepStatusTone>> = { Approved: 'success', 'Awaiting review': 'warning', Rejected: 'error', Draft: 'neutral' };

const ROWS: readonly PaepTableRow[] = [
  { id: '184', name: 'Sample item Alpha', ref: 'REC-2026-000184', location: 'Site 3 · Store B', quantity: '1,250.00', updated: '2026-09-21', status: 'Approved' },
  { id: '185', name: 'Sample item Beta with a longer descriptive name', ref: 'REC-2026-000185', location: 'Site 1 · Yard', quantity: '87.50', updated: '2026-09-20', status: 'Awaiting review' },
  { id: '186', name: 'Sample item Gamma', ref: 'REC-2026-000186', location: 'Site 2', quantity: '0.00', updated: '2026-09-19', status: 'Rejected' },
  { id: '187', name: 'Sample item Delta', ref: 'REC-2026-000187-ATTACHMENT-ARCHIVE-0001', location: 'Site 3 · Store A', quantity: '12,904.75', updated: '2026-09-18', status: 'Draft' },
];

@Component({
  selector: 'lab-table-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepTable, PaepTableCell, PaepStatusBadge, PaepPagination],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Standard with states (choose a state; resize to see priority columns move)">
        <div class="row" role="group" aria-label="Table state">
          @for (s of states; track s) {
            <button type="button" [attr.aria-pressed]="state() === s" (click)="state.set(s)">{{ s }}</button>
          }
        </div>
        <paep-table
          #records
          caption="Records"
          [columns]="columns"
          [rows]="rows"
          [state]="state()"
          [total]="184"
          [loadingRows]="4"
          errorReference="7F3A-22C1"
          emptyActionLabel="Create record"
          (retry)="reload()"
          (clearFilters)="state.set('populated')"
          (emptyAction)="state.set('populated')"
        >
          <button paepTableActions type="button" class="lab-action">Create record</button>
          <ng-template paepTableCell="status" let-row>
            <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
          </ng-template>
          <paep-pagination paepTableFooter [(page)]="page" [pageCount]="46" [focusTarget]="records.captionElement()" />
        </paep-table>
      </lab-example>
      <lab-example heading="Container below 60 rem (priority 3 in row detail)">
        <div class="medium">
          <paep-table caption="Records, medium container" [columns]="columns" [rows]="rows">
            <ng-template paepTableCell="status" let-row>
              <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
            </ng-template>
          </paep-table>
        </div>
      </lab-example>
      <lab-example heading="Container below 40 rem (priority 2 and 3 in row detail)">
        <div class="narrow">
          <paep-table caption="Records, narrow container" [columns]="columns" [rows]="rows">
            <ng-template paepTableCell="status" let-row>
              <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
            </ng-template>
          </paep-table>
        </div>
      </lab-example>
      <lab-example heading="Compact density">
        <div data-paep-density="compact">
          <paep-table caption="Records, compact" [columns]="columns" [rows]="rows" [total]="184">
            <ng-template paepTableCell="status" let-row>
              <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
            </ng-template>
          </paep-table>
        </div>
      </lab-example>
      <lab-example heading="Bounded scroll fallback (two-dimensional comparison only)">
        <div class="narrow">
          <paep-table caption="Comparison" variant="scroll" [columns]="scrollColumns" [rows]="rows">
            <ng-template paepTableCell="status" let-row>
              <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
            </ng-template>
          </paep-table>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
      margin-block-end: var(--paep-space-3);
    }
    button {
      min-block-size: var(--paep-size-target-touch);
    }
    button[aria-pressed='true'] {
      font-weight: var(--paep-font-weight-label);
      outline: 2px solid var(--paep-color-selected-indicator);
    }
    .medium {
      max-inline-size: 50rem;
    }
    .narrow {
      max-inline-size: 30rem;
    }
  `,
})
export class TableSpecimen {
  protected readonly meta = TABLE_META;
  protected readonly columns = COLUMNS;
  protected readonly scrollColumns = SCROLL_COLUMNS;
  protected readonly rows = ROWS;
  protected readonly states: readonly PaepCollectionState[] = ['populated', 'loading', 'empty', 'no-results', 'error'];
  protected readonly state = signal<PaepCollectionState>('populated');
  protected readonly page = signal(1);

  protected tone(row: PaepTableRow): PaepStatusTone {
    return TONES[String(row['status'])] ?? 'neutral';
  }

  protected reload(): void {
    this.state.set('loading');
    setTimeout(() => this.state.set('populated'), 1200);
  }
}
