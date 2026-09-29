import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { userEvent } from 'vitest/browser';
import { PaepBreadcrumb, PaepBreadcrumbItem } from './breadcrumb';

const SHORT: PaepBreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Records', href: '#records' },
  { label: 'Record 1' },
];
const LONG: PaepBreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'North depot', href: '#depot' },
  { label: 'Records', href: '#records' },
  { label: 'Record group 4', link: ['/records', 'group-4'] },
  { label: 'Record 1' },
];

@Component({
  imports: [PaepBreadcrumb],
  template: `
    <div [attr.dir]="dir()" [style.inline-size]="width()">
      <paep-breadcrumb [items]="items()" />
    </div>
  `,
})
class BreadcrumbHost {
  readonly items = signal<PaepBreadcrumbItem[]>(SHORT);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly width = signal('800px');
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 20));
  f.detectChanges();
};

describe('PaepBreadcrumb', () => {
  let fixture: ComponentFixture<BreadcrumbHost>;
  let host: BreadcrumbHost;
  const nav = () => document.querySelector('nav') as HTMLElement;
  const visibleItems = () =>
    Array.from(nav().querySelectorAll<HTMLElement>('li'))
      .filter((li) => getComputedStyle(li).display !== 'none')
      .map((li) => li.textContent!.trim());

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(BreadcrumbHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('renders a named navigation landmark with an ordered list and the current page', () => {
    expect(nav().getAttribute('aria-label')).toBe('Breadcrumb');
    expect(nav().querySelector('ol')).not.toBeNull();
    const current = nav().querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.textContent).toBe('Record 1');
    expect(current.tagName).toBe('SPAN');
    expect(Array.from(nav().querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual(['#home', '#records']);
    expect(getComputedStyle(current).fontWeight).toBe('600');
  });

  it('shows every segment and no "…" button when short and wide', () => {
    expect(visibleItems()).toEqual(['Home', 'Records', 'Record 1']);
    expect(nav().querySelector('button')).toBeNull();
  });

  it('uses decorative separators that mirror in RTL', async () => {
    const sep = nav().querySelector('svg') as SVGElement;
    expect(sep.getAttribute('aria-hidden')).toBe('true');
    expect(nav().querySelectorAll('svg').length).toBe(2);
    expect(getComputedStyle(sep).transform).toBe('none');
    host.dir.set('rtl');
    await settle(fixture);
    expect(getComputedStyle(sep).transform).not.toBe('none');
    const [first, , last] = Array.from(nav().querySelectorAll('li')).map((li) => li.getBoundingClientRect());
    expect(first.left).toBeGreaterThan(last.left);
  });

  it('collapses to first, "…", parent and current when there are more than 4 segments', async () => {
    host.items.set(LONG);
    await settle(fixture);
    expect(visibleItems()).toEqual(['Home', '…', 'Record group 4', 'Record 1']);
    const more = nav().querySelector('button') as HTMLButtonElement;
    expect(more.getAttribute('aria-label')).toBe('Show full path');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect((nav().querySelector('a[href="/records/group-4"]') as HTMLElement).textContent).toBe('Record group 4');
  });

  it('expands inline with the "…" button and moves focus to the first revealed link', async () => {
    host.items.set(LONG);
    await settle(fixture);
    const more = nav().querySelector('button') as HTMLButtonElement;
    more.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(visibleItems()).toEqual(['Home', 'North depot', 'Records', 'Record group 4', 'Record 1']);
    expect(document.activeElement).toBe(nav().querySelector('a[href="#depot"]'));
  });

  it('collapses below a 36 rem container even with 4 segments, and resets when the path changes', async () => {
    host.items.set(LONG.slice(1));
    await settle(fixture);
    expect(visibleItems()).toEqual(['North depot', 'Records', 'Record group 4', 'Record 1']);
    host.width.set('300px');
    await settle(fixture);
    expect(visibleItems()).toEqual(['North depot', '…', 'Record group 4', 'Record 1']);
    await userEvent.click(nav().querySelector('button')!);
    await settle(fixture);
    expect(visibleItems().length).toBe(4);
    host.items.set(LONG);
    await settle(fixture);
    expect(visibleItems()).toEqual(['Home', '…', 'Record group 4', 'Record 1']);
  });

  it('wraps long segments without horizontal overflow and keeps links reachable with Tab', async () => {
    host.width.set('280px');
    host.items.set([
      { label: 'Home', href: '#home' },
      { label: 'A very long parent segment name that must wrap onto more lines', href: '#parent' },
      { label: 'A current page title that is long enough to wrap as well without truncation' },
    ]);
    await settle(fixture);
    expect(nav().scrollWidth).toBeLessThanOrEqual(280);
    (nav().querySelector('a') as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(nav().querySelector('a[href="#parent"]'));
  });
});
