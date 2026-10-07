import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { userEvent } from 'vitest/browser';
import type { PaepShellAvailability } from '../ports/ports';
import { PaepShellLayout } from '../shell/shell-layout';
import { provideTestShell, settle, text } from '../testing/shell-testing';
import { PaepShellNav } from './nav';
import { PaepShellNavSheet } from './nav-sheet';

@Component({ template: '<h1>Page</h1>' })
class Page {}

@Component({
  imports: [PaepShellNav],
  template: '<paep-shell-nav [mode]="mode()" />',
})
class NavHost {
  readonly mode = signal<'persistent' | 'sheet'>('persistent');
}

const LOCKS: Record<string, PaepShellAvailability> = {
  archive: { state: 'locked', reason: 'edition' },
  secret: { state: 'not-permitted' },
};

async function create(extra: Parameters<typeof provideTestShell>[0] = {}): Promise<ComponentFixture<NavHost>> {
  const loaded = signal(true);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Page }]),
      ...provideTestShell({
        access: { loaded, availability: (id) => LOCKS[id] ?? { state: 'available' } },
        counts: { count: (id) => (id === 'work' ? 120 : id === 'activity' ? 'loading' : undefined) },
        ...extra,
      }),
    ],
  });
  const fixture = TestBed.createComponent(NavHost);
  await TestBed.inject(Router).navigateByUrl('/records/open');
  await settle(fixture);
  return fixture;
}

describe('PaepShellNav', () => {
  let fixture: ComponentFixture<NavHost>;
  afterEach(() => fixture?.destroy());
  const el = () => fixture.nativeElement as HTMLElement;
  const link = (label: string) => Array.from(el().querySelectorAll('a')).find((a) => text(a.querySelector('.paep-shell-nav__label')) === label) as HTMLAnchorElement | undefined;

  it('renders the manifest groups in order inside the "Primary" navigation landmark', async () => {
    fixture = await create();
    expect(el().querySelector('nav')?.getAttribute('aria-label')).toBe('Primary');
    expect(Array.from(el().querySelectorAll('.paep-shell-nav__group-label')).map(text)).toEqual(['Overview', 'Operations']);
  });

  it('marks only the current page with aria-current="page", including a nested item', async () => {
    fixture = await create();
    const current = el().querySelectorAll('[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(text(current[0])).toBe('Open records');
  });

  it('names a locked item "{label}, {reason}" with its reason icon and hides a not-permitted item', async () => {
    fixture = await create();
    const archive = link('Archive') as HTMLAnchorElement;
    expect(archive.getAttribute('aria-label')).toBe('Archive, Not included in your edition');
    expect(archive.getAttribute('href')).toBe('/archive');
    expect(archive.classList).toContain('paep-shell-nav__link--locked');
    expect(link('Secret area')).toBeUndefined();
  });

  it('shows counts capped at "99+" and a loading count with hidden text', async () => {
    fixture = await create();
    const work = link('Work items') as HTMLAnchorElement;
    expect(text(work.querySelector('paep-count-badge [aria-hidden="true"]'))).toBe('99+');
    expect(text(work)).toMatch(/99\+ items/);
    expect(text(link('Activity'))).toMatch(/Loading count/);
  });

  it('takes the loading and unknown count text from the shell keys, so the host can translate them', async () => {
    fixture = await create({
      counts: { count: (id) => (id === 'work' ? 'unknown' : id === 'activity' ? 'loading' : undefined) },
      messages: { en: { 'paep.shell.nav.count.loading': 'Count on its way', 'paep.shell.nav.count.unknown': 'No count' } },
    });
    const work = link('Work items') as HTMLAnchorElement;
    expect(text(work.querySelector('paep-count-badge [aria-hidden="true"]'))).toBe('–');
    expect(text(work)).toMatch(/No count/);
    expect(text(link('Activity'))).toMatch(/Count on its way/);
  });

  it('toggles a group as a disclosure with aria-expanded', async () => {
    fixture = await create();
    const button = el().querySelector('.paep-shell-nav__group-btn') as HTMLButtonElement;
    const region = el().querySelector(`#${button.getAttribute('aria-controls')}`) as HTMLElement;
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    await settle(fixture);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(region.hidden).toBe(true);
  });

  it('shows a skeleton until access information arrives', async () => {
    const loaded = signal(false);
    fixture = await create({ access: { loaded, availability: () => ({ state: 'available' }) } });
    expect(el().querySelector('.paep-shell-nav__loading')).not.toBeNull();
    expect(el().querySelectorAll('a').length).toBe(0);
    loaded.set(true);
    await settle(fixture);
    expect(el().querySelectorAll('a').length).toBeGreaterThan(0);
  });

  it('collapses to the rail: the toggle keeps focus and changes its name, groups show short labels', async () => {
    fixture = await create();
    const toggle = el().querySelector('.paep-shell-nav__toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Collapse navigation');
    toggle.focus();
    toggle.click();
    await settle(fixture);
    expect(TestBed.inject(PaepShellLayout).navCollapsed()).toBe(true);
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute('aria-label')).toBe('Expand navigation');
    expect(Array.from(el().querySelectorAll('.paep-shell-nav__rail-label')).map(text)).toEqual(['Overview', 'Ops']);
    const ops = el().querySelectorAll<HTMLButtonElement>('.paep-shell-nav__rail-btn')[1];
    expect(ops.getAttribute('aria-current')).toBe('true');
  });

  it('opens a rail flyout of links; Escape closes it and returns focus to its group button', async () => {
    fixture = await create();
    TestBed.inject(PaepShellLayout).navCollapsed.set(true);
    await settle(fixture);
    const ops = el().querySelectorAll<HTMLButtonElement>('.paep-shell-nav__rail-btn')[1];
    ops.focus();
    ops.click();
    await settle(fixture);
    expect(ops.getAttribute('aria-expanded')).toBe('true');
    const flyout = el().querySelector(`#${ops.getAttribute('aria-controls')}`) as HTMLElement;
    expect(flyout.tagName).toBe('PAEP-POPOVER');
    expect(flyout.matches(':popover-open')).toBe(true);
    expect(text(flyout.querySelector('h2'))).toBe('Operations');
    (flyout.querySelector('a') as HTMLElement).focus();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(flyout.matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(ops);
    expect(ops.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the rail flyout when one of its links is chosen', async () => {
    fixture = await create();
    TestBed.inject(PaepShellLayout).navCollapsed.set(true);
    await settle(fixture);
    const ops = el().querySelectorAll<HTMLButtonElement>('.paep-shell-nav__rail-btn')[1];
    ops.click();
    await settle(fixture);
    const flyout = el().querySelector<HTMLElement>(`#${ops.getAttribute('aria-controls')}`)!;
    expect(flyout.matches(':popover-open')).toBe(true);
    flyout.querySelector<HTMLElement>('a')!.click();
    await settle(fixture);
    expect(flyout.matches(':popover-open')).toBe(false);
  });

  it('places the rail flyout with the governed popover: below its button, inside the 16 px viewport margin, in LTR and RTL (DDR-IB3-02)', async () => {
    for (const dir of ['ltr', 'rtl']) {
      document.documentElement.setAttribute('dir', dir);
      fixture = await create();
      TestBed.inject(PaepShellLayout).navCollapsed.set(true);
      await settle(fixture);
      const ops = el().querySelectorAll<HTMLButtonElement>('.paep-shell-nav__rail-btn')[1];
      ops.click();
      await settle(fixture);
      const flyout = el().querySelector<HTMLElement>(`#${ops.getAttribute('aria-controls')}`)!;
      const b = ops.getBoundingClientRect();
      const f = flyout.getBoundingClientRect();
      expect(flyout.getAttribute('data-placement')).toBe('below');
      expect(f.top).toBeGreaterThanOrEqual(b.bottom);
      expect(f.left).toBeGreaterThanOrEqual(16 - 0.5);
      expect(f.right).toBeLessThanOrEqual(innerWidth - 16 + 0.5);
      fixture.destroy();
      TestBed.resetTestingModule();
    }
    document.documentElement.removeAttribute('dir');
  });

  it('has no collapse toggle inside the sheet', async () => {
    fixture = await create();
    fixture.componentInstance.mode.set('sheet');
    await settle(fixture);
    expect(el().querySelector('.paep-shell-nav__toggle')).toBeNull();
    expect(el().querySelectorAll('.paep-shell-nav__group').length).toBe(2);
  });

  it('shows nested items, the current page, counts and locked items the same way inside the sheet', async () => {
    fixture = await create();
    fixture.componentInstance.mode.set('sheet');
    await settle(fixture);
    const current = el().querySelectorAll('[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(text(current[0])).toBe('Open records');
    expect(current[0].closest('.paep-shell-nav__children')).not.toBeNull();
    expect(text(link('Work items')?.querySelector('paep-count-badge [aria-hidden="true"]'))).toBe('99+');
    expect(text(link('Activity'))).toMatch(/Loading count/);
    expect(link('Archive')?.getAttribute('aria-label')).toBe('Archive, Not included in your edition');
  });

  it('wraps a long label instead of truncating it, persistent and in the sheet', async () => {
    const long = 'Supplier qualification and onboarding requests awaiting regional compliance review';
    fixture = await create({ navigation: { home: '/home', groups: [{ id: 'g', label: 'Operations', icon: 'tasks', items: [{ id: 'long', label: long, route: '/long' }] }] } });
    for (const mode of ['persistent', 'sheet'] as const) {
      fixture.componentInstance.mode.set(mode);
      (el().querySelector('paep-shell-nav') as HTMLElement).style.inlineSize = '15rem';
      await settle(fixture);
      const label = link(long)?.querySelector('.paep-shell-nav__label') as HTMLElement;
      expect(text(label)).toBe(long);
      expect(getComputedStyle(label).textOverflow).not.toBe('ellipsis');
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
      expect(label.getBoundingClientRect().height).toBeGreaterThan(parseFloat(getComputedStyle(label).lineHeight) * 1.5);
    }
  });
});

@Component({
  imports: [PaepShellNavSheet],
  template: `
    <button id="opener" (click)="open.set(true)">Open navigation</button>
    <paep-shell-nav-sheet [(open)]="open" heading="Primary navigation" closeLabel="Close navigation">
      <a href="#x">Link</a>
    </paep-shell-nav-sheet>
  `,
})
class SheetHost {
  readonly open = signal(false);
}

describe('PaepShellNavSheet', () => {
  let fixture: ComponentFixture<SheetHost>;
  afterEach(() => fixture?.destroy());

  beforeEach(async () => {
    fixture = TestBed.createComponent(SheetHost);
    await settle(fixture);
  });

  const dialog = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

  it('opens as a modal dialog named by its heading, with focus on the heading', async () => {
    (fixture.nativeElement.querySelector('#opener') as HTMLButtonElement).click();
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(dialog().matches(':modal')).toBe(true);
    const heading = dialog().querySelector('h2') as HTMLElement;
    expect(dialog().getAttribute('aria-labelledby')).toBe(heading.id);
    expect(document.activeElement).toBe(heading);
  });

  it('closes with the close button and returns focus to the opener', async () => {
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await settle(fixture);
    (dialog().querySelector('.paep-shell-sheet__close') as HTMLButtonElement).click();
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes when the scrim (the dialog backdrop) is clicked, not when its content is clicked', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);
    (dialog().querySelector('a') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog().open).toBe(true);
    dialog().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    expect(dialog().open).toBe(false);
  });

  it('attaches to the inline-start edge: at most 20 rem from 600 px, the full width below', async () => {
    fixture.componentInstance.open.set(true);
    await settle(fixture);
    const rect = dialog().getBoundingClientRect();
    expect(rect.left).toBe(0);
    if (window.innerWidth >= 600) expect(rect.width).toBeLessThanOrEqual(320);
    else expect(Math.round(rect.width)).toBe(window.innerWidth);
  });
});
