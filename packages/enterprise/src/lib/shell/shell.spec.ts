import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { userEvent } from 'vitest/browser';
import { PaepErrorBoundary } from '../error/error-boundary';
import type { PaepShellContext } from '../ports/ports';
import { PaepShellLayout } from './shell-layout';
import { PaepShell } from './shell';
import { provideTestShell, settle, testNotifications, testRuntimeConfig, testSession, text } from '../testing/shell-testing';

@Component({ template: '<h1>Home page</h1><p>Home body</p>' })
class HomePage {}

@Component({ template: '<h1>Activity page</h1>' })
class ActivityPage {}

@Component({
  imports: [PaepShell, PaepErrorBoundary],
  template: `
    <paep-shell>
      <svg paepShellMark viewBox="0 0 32 32"><rect width="32" height="32" /></svg>
      <main><paep-error-boundary /></main>
    </paep-shell>
  `,
})
class ShellHost {}

const LONG_CONTEXT: PaepShellContext = {
  tenant: { tenantId: 't-long', displayName: 'Northwind Holdings International Group (Southern Africa Regional Operations)' },
  site: 'Site 04: Distribution Campus North-East Extension',
};
const LONG_CONTEXT_B: PaepShellContext = { tenant: LONG_CONTEXT.tenant, site: 'Site 07' };

const ROUTES = [
  { path: 'home', component: HomePage },
  { path: 'activity', component: ActivityPage },
  { path: 'work', component: ActivityPage },
  { path: 'archive', component: ActivityPage },
  { path: 'records', component: ActivityPage },
];

async function create(options: Parameters<typeof provideTestShell>[0] = {}): Promise<ComponentFixture<ShellHost>> {
  TestBed.configureTestingModule({ providers: [provideRouter(ROUTES), ...provideTestShell(options)] });
  const fixture = TestBed.createComponent(ShellHost);
  await TestBed.inject(Router).navigateByUrl('/home');
  await settle(fixture);
  return fixture;
}

describe('PaepShell', () => {
  let fixture: ComponentFixture<ShellHost>;
  afterEach(() => fixture?.destroy());

  it('puts the skip link first and moves focus to the app main region', async () => {
    fixture = await create();
    const el: HTMLElement = fixture.nativeElement;
    const focusables = el.querySelectorAll<HTMLElement>('a[href], button');
    const skip = focusables[0];
    expect(skip.classList).toContain('paep-skip-link');
    expect(text(skip)).toBe('Skip to main content');
    const main = el.querySelector('main') as HTMLElement;
    expect(skip.getAttribute('href')).toBe(`#${main.id}`);
    expect(main.getAttribute('tabindex')).toBe('-1');
    skip.click();
    await settle(fixture);
    expect(document.activeElement).toBe(main);
  });

  it('has one banner, one primary navigation landmark and the app main at 1024 px and wider', async () => {
    fixture = await create({ wide: true });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('header').length).toBe(1);
    expect(el.querySelectorAll('main').length).toBe(1);
    const navs = el.querySelectorAll('nav[aria-label="Primary"]');
    expect(navs.length).toBe(1);
    expect(el.querySelector('paep-shell-nav-sheet')).toBeNull();
    expect(el.querySelector('.paep-shell-topbar__nav-toggle')).toBeNull();
  });

  it('replaces the persistent navigation with the Open navigation button and a modal sheet below 1024 px', async () => {
    fixture = await create({ wide: false });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.paep-shell__nav')).toBeNull();
    const toggle = el.querySelector('.paep-shell-topbar__nav-toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Open navigation');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.hasAttribute('aria-controls')).toBe(false);
    toggle.focus();
    toggle.click();
    await settle(fixture);
    const dialog = el.querySelector('dialog#paep-shell-nav-sheet') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('paep-shell-nav-sheet');
    expect(text(dialog.querySelector('h2'))).toBe('Primary navigation');
    expect(dialog.querySelector('.paep-shell-sheet__close')?.getAttribute('aria-label')).toBe('Close navigation');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('closes the sheet on navigation and focuses the new page heading with a polite announcement', async () => {
    fixture = await create({ wide: false });
    const layout = TestBed.inject(PaepShellLayout);
    layout.sheetOpen.set(true);
    await settle(fixture);
    const link = Array.from(fixture.nativeElement.querySelectorAll('dialog a')).find((a) => text(a as Element) === 'Activity') as HTMLAnchorElement;
    link.click();
    await settle(fixture, 120);
    expect(layout.sheetOpen()).toBe(false);
    expect(text(document.activeElement)).toBe('Activity page');
    await new Promise((r) => setTimeout(r, 80));
    expect(text(document.querySelector('[data-paep-announcer="polite"]'))).toBe('Activity page page');
  });

  it('opens the command palette state with Ctrl+K and Meta+K, and not with a single character', async () => {
    fixture = await create();
    const layout = TestBed.inject(PaepShellLayout);
    document.body.focus();
    await userEvent.keyboard('k');
    expect(layout.paletteOpen()).toBe(false);
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(layout.paletteOpen()).toBe(true);
    layout.paletteOpen.set(false);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(layout.paletteOpen()).toBe(true);
  });

  it('keeps focused elements clear of the sticky topbar with scroll padding, and restores it when destroyed', async () => {
    fixture = await create();
    expect(document.documentElement.style.getPropertyValue('scroll-padding-block-start')).toBe('var(--paep-shell-sticky-offset)');
    fixture.destroy();
    expect(document.documentElement.style.getPropertyValue('scroll-padding-block-start')).toBe('');
  });

  it('applies compact density to the content only', async () => {
    fixture = await create();
    const layout = TestBed.inject(PaepShellLayout);
    layout.density.set('compact');
    await settle(fixture);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.paep-shell__main')?.getAttribute('data-paep-density')).toBe('compact');
    expect(el.querySelector('paep-shell-topbar')?.closest('[data-paep-density]')).toBeNull();
  });
});

describe('PaepShellTopbar', () => {
  let fixture: ComponentFixture<ShellHost>;
  afterEach(() => fixture?.destroy());
  const bar = () => fixture.nativeElement.querySelector('header') as HTMLElement;

  it('names the product link "{product} home" and shows the environment badge outside production', async () => {
    fixture = await create();
    const product = bar().querySelector('.paep-shell-topbar__product') as HTMLAnchorElement;
    expect(product.getAttribute('aria-label')).toBe('Test Product home');
    expect(product.getAttribute('href')).toBe('/home');
    expect(text(bar().querySelector('paep-status-badge'))).toContain('Staging');
  });

  it('keeps doubled-length text inside the viewport: the product name truncates, labels and context wrap or truncate', async () => {
    const twice = (s: string) => `${s} ${s}`;
    const product = twice('Regional Operations Management Platform');
    const session = testSession();
    session.identity.set({ principalId: 'u-1', displayName: twice('Alexandra Montgomery-Whitfield'), tenant: LONG_CONTEXT.tenant });
    // The layout follows the test runner's viewport width.
    fixture = await create({
      wide: window.innerWidth >= 1024,
      medium: window.innerWidth >= 600,
      runtimeConfig: testRuntimeConfig({ productName: product }),
      navigation: { home: '/home', groups: [{ id: 'g', label: twice('Operations and compliance'), icon: 'tasks', items: [{ id: 'home', label: twice('Supplier qualification requests'), route: '/home' }] }] },
      context: { current: signal(LONG_CONTEXT), available: signal([LONG_CONTEXT, LONG_CONTEXT_B]), requestSwitch: async () => ({ status: 'accepted' }) },
      session,
      notifications: testNotifications({ unread: 120 }),
    });
    expect(bar().querySelector('.paep-account-menu__button')?.getAttribute('aria-label')).toBe(`Account: ${twice('Alexandra Montgomery-Whitfield')}`);
    const name = bar().querySelector('.paep-shell-topbar__product') as HTMLAnchorElement;
    expect(name.getAttribute('aria-label')).toBe(`${product} home`);
    const visible = Array.from(name.querySelectorAll<HTMLElement>('*')).find((e) => getComputedStyle(e).textOverflow === 'ellipsis');
    expect(visible).toBeDefined();
    expect(bar().scrollWidth).toBeLessThanOrEqual(bar().clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it('shows no environment badge or notice in production', async () => {
    fixture = await create({ runtimeConfig: testRuntimeConfig({ environment: 'production' }) });
    expect(bar().querySelector('paep-status-badge')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-status="environment"]')).toBeNull();
  });

  it('presents search as a field-style button with the shortcut at 1024 px and an icon button below', async () => {
    fixture = await create({ wide: true });
    let search = bar().querySelector('search button') as HTMLButtonElement;
    expect(search.classList).toContain('paep-button--field');
    expect(search.getAttribute('aria-haspopup')).toBe('dialog');
    expect(search.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    expect(text(search)).toContain('Search or go to…');
    fixture.destroy();
    TestBed.resetTestingModule();
    fixture = await create({ wide: false });
    search = bar().querySelector('search button') as HTMLButtonElement;
    expect(search.getAttribute('aria-label')).toBe('Search or go to…');
    expect(search.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    search.click();
    expect(TestBed.inject(PaepShellLayout).paletteOpen()).toBe(true);
  });

  it('shows the online indicator at 600 px and wider only, and help only when the app supplies a hook', async () => {
    fixture = await create({ medium: false });
    expect(bar().querySelector('.paep-shell-topbar__online')).toBeNull();
    expect(bar().querySelector('[aria-label="Help"]')).toBeNull();
    fixture.destroy();
    TestBed.resetTestingModule();
    let helped = 0;
    fixture = await create({ hooks: { openHelp: () => helped++ } });
    expect(bar().querySelector('.paep-shell-topbar__online')?.getAttribute('aria-label')).toBe('Online');
    (bar().querySelector('[aria-label="Help"]') as HTMLButtonElement).click();
    expect(helped).toBe(1);
  });

  it('keeps notifications with their count and the account with sign-out at 320 px; help and language move into the account menu', async () => {
    fixture = await create({
      wide: false,
      medium: false,
      session: testSession(),
      notifications: testNotifications({ unread: 3 }),
      hooks: { helpLinks: [{ label: 'Support site', href: '/support' }] },
      runtimeConfig: testRuntimeConfig({ locales: ['en', 'fr'] }),
    });
    expect(bar().querySelector('.paep-notification-panel__bell')?.getAttribute('aria-label')).toBe('Notifications, 3 unread');
    expect(bar().querySelector('.paep-account-menu__button')?.getAttribute('aria-label')).toBe('Account: Alex Morgan');
    expect(bar().querySelector('.paep-shell-topbar__language')).toBeNull();
    expect(bar().querySelector('[aria-label="Help"]')).toBeNull();
    const account = bar().querySelector<HTMLButtonElement>('.paep-account-menu__button')!;
    account.click();
    await settle(fixture);
    const menu = document.getElementById(account.getAttribute('aria-controls')!)!;
    expect(Array.from(menu.querySelectorAll('[role="menuitemradio"]')).length).toBe(2);
    expect(text(menu)).toContain('Support site');
    expect(text(menu)).toContain('Sign out');
  });

  it('offers the language menu at 600 px and wider with more than one locale; a choice is applied by the app and announced', async () => {
    const root = document.documentElement;
    fixture = await create({ runtimeConfig: testRuntimeConfig({ locales: ['en', 'fr', 'ar'] }) });
    const button = bar().querySelector<HTMLButtonElement>('.paep-shell-topbar__language')!;
    expect(button.getAttribute('aria-label')).toBe('Language: English');
    expect(text(button)).toBe('EN');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    const menu = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(menu.getAttribute('aria-label')).toBe('Language');
    const radios = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]'));
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(document.activeElement).toBe(radios[0]);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle(fixture, 120);
    expect(root.getAttribute('lang')).toBe('fr');
    expect(document.activeElement).toBe(button);
    expect(text(button)).toBe('FR');
    expect(button.getAttribute('aria-label')).toBe('Language: Français');
    await expect.poll(() => document.querySelector('[data-paep-announcer="polite"]')?.textContent).toBe('Language changed to Français');
    fixture.destroy();
    root.setAttribute('lang', 'en');
    TestBed.resetTestingModule();
    fixture = await create({ runtimeConfig: testRuntimeConfig({ locales: ['en'] }) });
    expect(bar().querySelector('.paep-shell-topbar__language')).toBeNull();
  });

  it('opens a help menu of the host\'s help links at 600 px and wider, aligned to the button\'s inline-end edge', async () => {
    const opened: string[] = [];
    fixture = await create({ hooks: { helpLinks: [{ label: 'Help for this page', run: () => opened.push('page') }, { label: 'Keyboard shortcuts', run: () => opened.push('keys') }, { label: 'Support site', href: '/support' }] } });
    const help = bar().querySelector<HTMLButtonElement>('[aria-label="Help"]')!;
    expect(help.getAttribute('aria-haspopup')).toBe('menu');
    help.focus();
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    const menu = document.getElementById(help.getAttribute('aria-controls')!)!;
    expect(menu.getAttribute('data-align')).toBe('end');
    expect(text(document.activeElement)).toBe('Support site');
    await userEvent.keyboard('k');
    expect(text(document.activeElement)).toBe('Keyboard shortcuts');
    await userEvent.keyboard('{Enter}');
    await settle(fixture, 40);
    expect(opened).toEqual(['keys']);
    expect(menu.matches(':popover-open')).toBe(false);
  });

  it('opens the display preferences dialog from the account menu', async () => {
    fixture = await create({ session: testSession() });
    const account = bar().querySelector<HTMLButtonElement>('.paep-account-menu__button')!;
    account.click();
    await settle(fixture);
    const menu = document.getElementById(account.getAttribute('aria-controls')!)!;
    Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).find((i) => text(i) === 'Display preferences')!.click();
    await settle(fixture, 100);
    await expect.poll(() => fixture.nativeElement.querySelector('paep-shell-preferences dialog')?.open).toBe(true);
  });
});
