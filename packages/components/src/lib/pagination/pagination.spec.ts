import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepPagination } from './pagination';

@Component({
  imports: [PaepPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 #heading>Records</h3>
    <div [style.inline-size.px]="width()">
      <paep-pagination
        [(page)]="page"
        [pageCount]="count()"
        [pageHref]="href()"
        [focusTarget]="heading"
        (pageChange)="changes.push($event)"
      />
    </div>
  `,
})
class Host {
  readonly page = signal(8);
  readonly count = signal(20);
  readonly width = signal(800);
  readonly href = signal<((p: number) => string) | null>(null);
  readonly changes: number[] = [];
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('paep-pagination') as HTMLElement;
  const controls = () => Array.from(el.querySelectorAll<HTMLElement>('.paep-pagination__control'));
  const byName = (name: string) => controls().find((c) => c.getAttribute('aria-label') === name) as HTMLElement;
  const visibleText = () =>
    Array.from(el.querySelectorAll<HTMLElement>('li'))
      .filter((li) => getComputedStyle(li).display !== 'none')
      .map((li) => li.innerText.trim());
  const refresh = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, controls, byName, visibleText, refresh, host: fixture.componentInstance };
}

describe('PaepPagination', () => {
  it('is a named navigation landmark with a list of controls', async () => {
    const { el } = await setup();
    const nav = el.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Pagination');
    expect(nav.querySelector('ul > li')).not.toBeNull();
  });

  it('shows first, last and current ± 1 with gaps, and marks the current page', async () => {
    const { visibleText, byName } = await setup();
    expect(visibleText()).toEqual(['Previous', '1', '…', '7', '8', '9', '…', '20', 'Next', 'Page 8 of 20']);
    const current = byName('Page 8, current page');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(byName('Page 7').getAttribute('aria-current')).toBeNull();
    expect(getComputedStyle(current).fontWeight).toBe('700');
    expect(getComputedStyle(current).borderTopWidth).toBe('2px');
  });

  it('hides the gap marks from assistive technology and shows a single skipped page instead of a gap', async () => {
    const { el, visibleText } = await setup((h) => h.page.set(3));
    expect(visibleText()).toEqual(['Previous', '1', '2', '3', '4', '…', '20', 'Next', 'Page 3 of 20']);
    for (const gap of Array.from(el.querySelectorAll('.paep-pagination__gap'))) expect(gap.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps Previous at the first page but marks it aria-disabled and inert', async () => {
    const { byName, refresh, host } = await setup((h) => h.page.set(1));
    const prev = byName('Previous page');
    expect(prev).toBeTruthy();
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    prev.focus();
    expect(document.activeElement).toBe(prev);
    await userEvent.keyboard('{Enter}');
    await refresh();
    expect(host.page()).toBe(1);
    expect(host.changes).toEqual([]);
  });

  it('marks Next aria-disabled on the last page', async () => {
    const { byName } = await setup((h) => h.page.set(20));
    expect(byName('Next page').getAttribute('aria-disabled')).toBe('true');
    expect(byName('Previous page').getAttribute('aria-disabled')).toBeNull();
  });

  it('changes page with the keyboard, emits pageChange and moves focus to the paged heading', async () => {
    const { fixture, byName, refresh, host } = await setup();
    byName('Page 9').focus();
    await userEvent.keyboard('{Enter}');
    await refresh();
    expect(host.page()).toBe(9);
    expect(host.changes).toEqual([9]);
    const heading = fixture.nativeElement.querySelector('h3') as HTMLElement;
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    await userEvent.click(byName('Next page'));
    await refresh();
    expect(host.changes).toEqual([9, 10]);
    await userEvent.click(byName('Previous page'));
    await refresh();
    expect(host.changes).toEqual([9, 10, 9]);
  });

  it('does not emit when the current page is activated', async () => {
    const { byName, host } = await setup();
    await userEvent.click(byName('Page 8, current page'));
    expect(host.changes).toEqual([]);
  });

  it('renders links when pageHref is given; disabled ends have no href', async () => {
    const { byName, controls } = await setup((h) => {
      h.page.set(1);
      h.href.set((p) => `#records-page-${p}`);
    });
    expect(controls().every((c) => c.tagName === 'A')).toBe(true);
    expect(byName('Page 2').getAttribute('href')).toBe('#records-page-2');
    const prev = byName('Previous page');
    expect(prev.hasAttribute('href')).toBe(false);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.getAttribute('role')).toBe('link');
    expect(byName('Next page').getAttribute('href')).toBe('#records-page-2');
  });

  it('switches to the compact variant below a 36 rem container', async () => {
    const { visibleText, byName, refresh, host, el } = await setup((h) => h.width.set(300));
    expect(visibleText()).toEqual(['', '8 / 20', '']);
    const prev = byName('Previous page');
    expect(prev.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(el.scrollWidth).toBeLessThanOrEqual(300);
    host.width.set(800);
    await refresh();
    expect(visibleText()).toContain('Page 8 of 20');
  });

  it('keeps controls at least the minimum target size', async () => {
    const { controls } = await setup();
    for (const c of controls()) {
      const r = c.getBoundingClientRect();
      expect(r.width).toBeGreaterThanOrEqual(24);
      expect(r.height).toBeGreaterThanOrEqual(24);
    }
  });

  it('mirrors directional chevrons in RTL', async () => {
    const { fixture, byName } = await setup();
    fixture.nativeElement.setAttribute('dir', 'rtl');
    const icon = byName('Next page').querySelector('svg') as SVGElement;
    expect(getComputedStyle(icon).transform).not.toBe('none');
    fixture.nativeElement.removeAttribute('dir');
  });
});
