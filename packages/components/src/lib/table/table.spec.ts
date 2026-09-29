import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepCollectionState } from '../list/list';
import { PaepPagination } from '../pagination/pagination';
import { PaepStatusBadge } from '../status-badge/status-badge';
import { PaepTable, PaepTableCell, PaepTableColumn, PaepTableRow, PaepTableVariant } from './table';

const COLUMNS: readonly PaepTableColumn[] = [
  { key: 'name', header: 'Record', secondaryKey: 'ref' },
  { key: 'location', header: 'Location', priority: 3 },
  { key: 'quantity', header: 'Quantity', priority: 2, numeric: true },
  { key: 'updated', header: 'Updated', priority: 3 },
  { key: 'status', header: 'Status' },
];

const ROWS: readonly PaepTableRow[] = [
  { id: 'r1', name: 'Sample item Alpha', ref: 'REC-2026-000184', location: 'North depot', quantity: '1,250.00', updated: '2026-09-21', status: 'Approved' },
  { id: 'r2', name: 'Sample item Beta', ref: 'REC-2026-000185', location: 'South yard', quantity: '87.50', updated: '2026-09-20', status: 'Draft' },
];

@Component({
  imports: [PaepTable, PaepTableCell, PaepStatusBadge, PaepPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style.inline-size.px]="width()">
      <paep-table
        #table
        caption="Records"
        [columns]="columns"
        [rows]="rows()"
        [state]="state()"
        [variant]="variant()"
        [total]="184"
        [loadingRows]="loadingRows()"
        errorReference="7F3A-22C1"
        emptyActionLabel="Create record"
        (retry)="retries = retries + 1"
        (emptyAction)="emptyActions = emptyActions + 1"
        (clearFilters)="clears = clears + 1"
      >
        <button paepTableActions type="button">Create record</button>
        <ng-template paepTableCell="status" let-row>
          <paep-status-badge tone="success">{{ row['status'] }}</paep-status-badge>
        </ng-template>
        <paep-pagination paepTableFooter [(page)]="page" [pageCount]="20" [focusTarget]="table.captionElement()" />
      </paep-table>
    </div>
  `,
})
class Host {
  readonly columns = COLUMNS;
  readonly rows = signal<readonly PaepTableRow[]>(ROWS);
  readonly state = signal<PaepCollectionState>('populated');
  readonly variant = signal<PaepTableVariant>('standard');
  readonly width = signal(1100);
  readonly loadingRows = signal(4);
  readonly page = signal(2);
  readonly table = viewChild.required(PaepTable);
  retries = 0;
  emptyActions = 0;
  clears = 0;
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  await settle();
  const el = fixture.nativeElement.querySelector('paep-table') as HTMLElement;
  const headers = () => Array.from(el.querySelectorAll<HTMLElement>('thead th')).map((th) => th.textContent?.trim());
  const toggles = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.paep-table__toggle'));
  const live = () => el.querySelector('[aria-live="polite"]') as HTMLElement;
  return { fixture, el, headers, toggles, live, settle, host: fixture.componentInstance };
}

describe('PaepTable', () => {
  it('uses native table semantics with a caption, column headers and row headers', async () => {
    const { el } = await setup();
    const table = el.querySelector('table') as HTMLTableElement;
    const caption = table.caption as HTMLTableCaptionElement;
    expect(caption.textContent).toContain('Records');
    const labelledBy = document.getElementById(table.getAttribute('aria-labelledby') ?? '');
    expect(labelledBy?.textContent).toBe('Records');
    expect(caption.contains(labelledBy)).toBe(true);
    for (const th of Array.from(table.querySelectorAll('thead th'))) expect(th.getAttribute('scope')).toBe('col');
    const rowHeader = table.querySelector('tbody tr th') as HTMLElement;
    expect(rowHeader.getAttribute('scope')).toBe('row');
    expect(rowHeader.textContent).toContain('Sample item Alpha');
    const id = rowHeader.querySelector('[dir="ltr"]') as HTMLElement;
    expect(id.textContent).toBe('REC-2026-000184');
    expect(el.textContent).toContain('2 of 184 records');
    expect(caption.querySelector('button')?.textContent).toBe('Create record');
  });

  it('shows every column and no Details control at 60 rem and wider', async () => {
    const { headers, toggles } = await setup();
    expect(headers()).toEqual(['Record', 'Location', 'Quantity', 'Updated', 'Status']);
    expect(toggles()).toHaveLength(0);
  });

  it('moves priority-3 columns into a row detail below 60 rem, toggled from the keyboard', async () => {
    const { el, headers, toggles, settle } = await setup((h) => h.width.set(800));
    expect(headers()).toEqual(['Record', 'Quantity', 'Status', 'Details']);
    const button = toggles()[0];
    expect(button.getAttribute('aria-label')).toBe('Details for Sample item Alpha');
    expect(button.textContent).toContain('Details');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const detail = document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLTableRowElement;
    expect(detail.tagName).toBe('TR');
    expect(detail.hidden).toBe(true);
    expect(getComputedStyle(detail).display).toBe('none');

    button.focus();
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(detail.hidden).toBe(false);
    expect(document.activeElement).toBe(button);
    const dl = detail.querySelector('dl') as HTMLDListElement;
    expect(Array.from(dl.querySelectorAll('dt')).map((d) => d.textContent)).toEqual(['Location', 'Updated']);
    expect(Array.from(dl.querySelectorAll('dd')).map((d) => d.textContent?.trim())).toEqual(['North depot', '2026-09-21']);
    expect(el.querySelectorAll('tbody tr:not(.paep-table__detail) > *')).toHaveLength(ROWS.length * 4);

    await userEvent.keyboard(' ');
    await settle();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(detail.hidden).toBe(true);
  });

  it('also moves priority-2 columns below 40 rem; key and status never hide; Details becomes icon-only', async () => {
    const { el, headers, toggles, settle } = await setup((h) => h.width.set(500));
    expect(headers()).toEqual(['Record', 'Status', 'Details']);
    const button = toggles()[1];
    expect(button.getAttribute('aria-label')).toBe('Details for Sample item Beta');
    expect((button.querySelector('.paep-table__toggle-text') as HTMLElement).getBoundingClientRect().width).toBe(0);
    expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    await userEvent.click(button);
    await settle();
    const detail = document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(Array.from(detail.querySelectorAll('dt')).map((d) => d.textContent)).toEqual(['Location', 'Quantity', 'Updated']);
    expect(getComputedStyle(el.querySelector('thead th') as HTMLElement).whiteSpace).toBe('normal');
  });

  it('reflows at 320 px without horizontal overflow', async () => {
    const { el } = await setup((h) => h.width.set(320));
    const shell = el.querySelector('.paep-table__shell') as HTMLElement;
    expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth + 1);
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(320);
  });

  it('restores all columns when the container widens again', async () => {
    const { headers, host, settle } = await setup((h) => h.width.set(500));
    host.width.set(1100);
    await settle();
    expect(headers()).toEqual(['Record', 'Location', 'Quantity', 'Updated', 'Status']);
  });

  it('aligns numeric columns to the inline end with tabular numbers', async () => {
    const { el } = await setup();
    const cells = [el.querySelectorAll('thead th')[2], el.querySelector('tbody tr')?.children[2]] as HTMLElement[];
    for (const c of cells) {
      expect(getComputedStyle(c).textAlign).toBe('end');
      expect(getComputedStyle(c).fontVariantNumeric).toContain('tabular-nums');
    }
  });

  it('renders custom cell templates in cells', async () => {
    const { el } = await setup();
    expect(el.querySelector('tbody paep-status-badge')?.textContent?.trim()).toBe('Approved');
  });

  it('loading: keeps the header, shows bounded skeleton rows, sets aria-busy and a polite message', async () => {
    const { el, live, headers, host, settle } = await setup((h) => h.state.set('loading'));
    const table = el.querySelector('table') as HTMLElement;
    expect(headers()).toHaveLength(5);
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(4);
    expect(el.querySelectorAll('tbody paep-skeleton').length).toBe(20);
    expect(live().textContent?.trim()).toBe('Loading records');
    expect(table.contains(live())).toBe(false);
    host.loadingRows.set(40);
    await settle();
    expect(el.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(10);
  });

  it('empty: shows the empty state with its action and announces it', async () => {
    const { el, live, host } = await setup((h) => h.rows.set([]));
    const empty = el.querySelector('tbody paep-empty-state') as HTMLElement;
    expect(empty.getAttribute('data-kind')).toBe('empty');
    expect(empty.closest('td')?.getAttribute('colspan')).toBe('5');
    expect(live().textContent?.trim()).toBe('No records yet');
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBeNull();
    await userEvent.click(empty.querySelector('button') as HTMLButtonElement);
    expect(host.emptyActions).toBe(1);
  });

  it('no-results: shows the distinct state with Clear filters', async () => {
    const { el, live, host } = await setup((h) => h.state.set('no-results'));
    const empty = el.querySelector('tbody paep-empty-state') as HTMLElement;
    expect(empty.getAttribute('data-kind')).toBe('no-results');
    expect(live().textContent?.trim()).toBe('No records match the current filters');
    await userEvent.click(empty.querySelector('button') as HTMLButtonElement);
    expect(host.clears).toBe(1);
  });

  it('error: shows an alert with reference and Retry, no stale rows; after reload focus moves to the caption', async () => {
    const { el, host, settle } = await setup((h) => h.state.set('error'));
    const alert = el.querySelector('tbody paep-alert') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('Records could not be loaded');
    expect(alert.textContent).toContain('Reference: 7F3A-22C1');
    expect(el.textContent).not.toContain('Sample item Alpha');
    const retry = alert.querySelector('button') as HTMLButtonElement;
    retry.focus();
    await userEvent.keyboard('{Enter}');
    expect(host.retries).toBe(1);
    host.state.set('loading');
    await settle();
    expect(document.activeElement).not.toBe(el.querySelector('caption'));
    host.state.set('populated');
    await settle();
    expect(document.activeElement).toBe(el.querySelector('caption'));
  });

  it('does not move focus on ordinary state changes', async () => {
    const { el, host, settle } = await setup((h) => h.state.set('loading'));
    const before = document.activeElement;
    host.state.set('populated');
    await settle();
    expect(document.activeElement).toBe(before);
    expect(el.querySelector('caption')).not.toBe(document.activeElement);
  });

  it('moves focus to the caption after a page change in the footer pagination', async () => {
    const { el, settle } = await setup();
    const next = el.querySelector('paep-pagination [aria-label="Next page"]') as HTMLElement;
    await userEvent.click(next);
    await settle();
    expect(document.activeElement).toBe(el.querySelector('caption'));
  });

  it('scroll fallback: all columns in a named, focusable, keyboard-scrollable region with a sticky first column', async () => {
    const { el, headers, toggles } = await setup((h) => {
      h.variant.set('scroll');
      h.width.set(320);
    });
    expect(headers()).toEqual(['Record', 'Location', 'Quantity', 'Updated', 'Status']);
    expect(toggles()).toHaveLength(0);
    const region = el.querySelector('[role="region"]') as HTMLElement;
    expect(region.getAttribute('aria-label')).toBe('Records, scrollable');
    expect(region.tabIndex).toBe(0);
    expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    expect(getComputedStyle(el.querySelector('tbody th') as HTMLElement).position).toBe('sticky');
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    region.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await new Promise((r) => setTimeout(r, 300));
    expect(region.scrollLeft).toBeGreaterThan(0);
  });

  it('standard variant has no scroll region', async () => {
    const { el } = await setup();
    expect(el.querySelector('[role="region"]')).toBeNull();
    expect(el.querySelector('[tabindex="0"]')).toBeNull();
  });
});
