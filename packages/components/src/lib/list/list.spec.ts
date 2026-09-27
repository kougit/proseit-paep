import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepCollectionState, PaepList, PaepListItem } from './list';

const ITEMS: readonly PaepListItem[] = [
  { id: 'a', primary: 'Sample item Alpha', href: '#alpha', secondary: 'North depot', status: { tone: 'success', label: 'Approved' }, icon: 'contents' },
  { id: 'b', primary: 'Sample item Beta with a longer descriptive name that wraps', secondary: 'Reference REC-2026-000185-ATTACHMENT-ARCHIVE-0001', meta: '12,904.75', metaNumeric: true },
  { id: 'c', primary: 'Sample item Gamma', actionLabel: 'Remove' },
];

@Component({
  imports: [PaepList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 #heading>Recent items</h3>
    <div [style.inline-size.px]="width()">
      <paep-list
        [items]="items()"
        [state]="state()"
        label="Recent items"
        [focusTarget]="heading"
        emptyActionLabel="Create record"
        (retry)="retries = retries + 1"
        (emptyAction)="emptyActions = emptyActions + 1"
        (clearFilters)="clears = clears + 1"
        (itemAction)="acted.push($event.id)"
      />
    </div>
  `,
})
class Host {
  readonly items = signal<readonly PaepListItem[]>(ITEMS);
  readonly state = signal<PaepCollectionState>('populated');
  readonly width = signal(600);
  retries = 0;
  emptyActions = 0;
  clears = 0;
  readonly acted: string[] = [];
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('paep-list') as HTMLElement;
  const live = () => el.querySelector('[aria-live="polite"]') as HTMLElement;
  const refresh = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, live, refresh, host: fixture.componentInstance };
}

describe('PaepList', () => {
  it('renders items as a native list with links, secondary text, meta and badges', async () => {
    const { el } = await setup();
    const ul = el.querySelector('ul') as HTMLUListElement;
    expect(ul.getAttribute('aria-label')).toBe('Recent items');
    const lis = ul.querySelectorAll(':scope > li');
    expect(lis).toHaveLength(3);
    const link = lis[0].querySelector('a') as HTMLAnchorElement;
    expect(link.textContent).toBe('Sample item Alpha');
    expect(link.getAttribute('href')).toBe('#alpha');
    expect(lis[0].querySelector('paep-status-badge')?.textContent?.trim()).toBe('Approved');
    expect(lis[0].querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const meta = lis[1].querySelector('.paep-list__numeric') as HTMLElement;
    expect(getComputedStyle(meta).fontVariantNumeric).toContain('tabular-nums');
  });

  it('reaches only links and actions with Tab and runs item actions from the keyboard', async () => {
    const { el, host } = await setup();
    await userEvent.tab();
    expect(document.activeElement).toBe(el.querySelector('a'));
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Remove');
    await userEvent.keyboard('{Enter}');
    expect(host.acted).toEqual(['c']);
  });

  it('shows skeleton items with aria-busy and a polite loading message', async () => {
    const { el, live } = await setup((h) => h.state.set('loading'));
    const region = el.querySelector('.paep-list__region') as HTMLElement;
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('paep-skeleton')).toHaveLength(3);
    expect(el.querySelector('ul')?.getAttribute('aria-hidden')).toBe('true');
    expect(live().textContent?.trim()).toBe('Loading…');
    expect(region.contains(live())).toBe(false);
  });

  it('shows the empty state (with action) and announces it without moving focus', async () => {
    const before = document.activeElement;
    const { el, live, host } = await setup((h) => h.items.set([]));
    const empty = el.querySelector('paep-empty-state') as HTMLElement;
    expect(empty.getAttribute('data-kind')).toBe('empty');
    expect(live().textContent?.trim()).toBe('No records yet');
    expect(document.activeElement).toBe(before);
    await userEvent.click(empty.querySelector('button') as HTMLButtonElement);
    expect(host.emptyActions).toBe(1);
  });

  it('shows the distinct no-results state with Clear filters', async () => {
    const { el, live, host } = await setup((h) => h.state.set('no-results'));
    const empty = el.querySelector('paep-empty-state') as HTMLElement;
    expect(empty.getAttribute('data-kind')).toBe('no-results');
    expect(live().textContent?.trim()).toBe('No records match the current filters');
    await userEvent.click(empty.querySelector('button') as HTMLButtonElement);
    expect(host.clears).toBe(1);
  });

  it('shows an error alert with Retry; after reload focus moves to the heading', async () => {
    const { fixture, el, refresh, host } = await setup((h) => h.state.set('error'));
    const alert = el.querySelector('paep-alert') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(el.querySelector('ul')).toBeNull();
    const retry = alert.querySelector('button') as HTMLButtonElement;
    expect(retry.textContent?.trim()).toBe('Retry');
    retry.focus();
    await userEvent.keyboard('{Enter}');
    expect(host.retries).toBe(1);
    host.state.set('loading');
    await refresh();
    host.state.set('populated');
    await refresh();
    await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h3'));
  });

  it('moves trailing meta below the text in a container under 20 rem', async () => {
    const { el, refresh, host } = await setup();
    const li = el.querySelectorAll('li')[1] as HTMLElement;
    const main = li.querySelector('.paep-list__main') as HTMLElement;
    const meta = li.querySelector('.paep-list__meta') as HTMLElement;
    expect(meta.getBoundingClientRect().top).toBeLessThan(main.getBoundingClientRect().bottom);
    host.width.set(280);
    await refresh();
    expect(meta.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom - 1);
    expect(el.scrollWidth).toBeLessThanOrEqual(280);
  });

  it('keeps items at the density minimum height', async () => {
    const { el } = await setup((h) => h.items.set([{ id: 'x', primary: 'Short' }]));
    expect((el.querySelector('li') as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  });
});
