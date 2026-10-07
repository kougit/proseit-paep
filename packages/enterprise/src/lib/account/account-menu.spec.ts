import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page, userEvent } from 'vitest/browser';
import { PaepShellLayout } from '../shell/shell-layout';
import { provideTestShell, settle, testRuntimeConfig, testSession, text } from '../testing/shell-testing';
import { PaepAccountMenu } from './account-menu';

@Component({
  imports: [PaepAccountMenu],
  template: '<div style="display: flex; justify-content: flex-end; padding: 8px"><paep-account-menu /></div>',
})
class AccountHost {}

describe('PaepAccountMenu', () => {
  let fixture: ComponentFixture<AccountHost>;
  let el: HTMLElement;
  const button = () => el.querySelector<HTMLButtonElement>('.paep-account-menu__button')!;
  const menu = () => document.getElementById(button().getAttribute('aria-controls')!)!;
  const items = () => Array.from(menu().querySelectorAll<HTMLElement>('[role^="menuitem"]'));
  const item = (label: string) => items().find((i) => text(i).startsWith(label))!;
  const root = document.documentElement;
  const lang = root.getAttribute('lang');
  const dir = root.getAttribute('dir');

  async function create(options: Parameters<typeof provideTestShell>[0] = {}): Promise<void> {
    TestBed.configureTestingModule({ providers: [provideRouter([]), ...provideTestShell(options)] });
    fixture = TestBed.createComponent(AccountHost);
    el = fixture.nativeElement;
    await settle(fixture);
  }

  async function open(): Promise<void> {
    button().focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
  }

  afterEach(async () => {
    fixture?.destroy();
    root.setAttribute('lang', lang ?? 'en');
    if (dir) root.setAttribute('dir', dir);
    else root.removeAttribute('dir');
    await page.viewport(414, 896);
  });

  it('shows nothing without a session provider', async () => {
    await create();
    expect(el.querySelector('.paep-account-menu__button')).toBeNull();
  });

  it('is a menu button named "Account: {name}" opening a named menu: identity, preferences, help, sign out', async () => {
    await create({ session: testSession(), hooks: { openHelp: () => undefined } });
    expect(button().getAttribute('aria-label')).toBe('Account: Alex Morgan');
    expect(button().getAttribute('aria-haspopup')).toBe('menu');
    expect(button().getAttribute('aria-expanded')).toBe('false');
    await open();
    expect(menu().getAttribute('role')).toBe('menu');
    expect(menu().getAttribute('aria-label')).toBe('Account');
    expect(text(menu().querySelector('.paep-account-menu__identity'))).toBe('Alex Morgan');
    expect(items().map((i) => text(i))).toEqual(['Display preferences', 'Help', 'Sign out']);
    expect(text(menu())).toContain('Language: English (LTR)');
    expect(document.activeElement).toBe(item('Display preferences'));
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(document.activeElement).toBe(button());
  });

  it('opens the display preferences from "Display preferences"', async () => {
    await create({ session: testSession() });
    await open();
    item('Display preferences').click();
    await settle(fixture);
    expect(TestBed.inject(PaepShellLayout).preferencesOpen()).toBe(true);
    expect(menu().matches(':popover-open')).toBe(false);
  });

  it('signs out on request and stays open as "Signing out…" (aria-disabled) while the host signs out', async () => {
    const session = testSession();
    await create({ session });
    await open();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(item('Sign out'));
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(session.calls).toEqual(['signOut']);
    expect(menu().matches(':popover-open')).toBe(true);
    const busy = item('Signing out…');
    expect(busy.getAttribute('aria-disabled')).toBe('true');
    busy.click();
    expect(session.calls).toEqual(['signOut']);
  });

  it('with one locale shows the active language as text and offers no language choice', async () => {
    await create({ session: testSession(), medium: false });
    await open();
    expect(text(menu())).toContain('Language: English (LTR)');
    expect(menu().querySelector('[role="menuitemradio"]')).toBeNull();
  });

  it('below 600 px holds the language group; choosing a language requests it and closes the menu', async () => {
    await create({ session: testSession(), medium: false, runtimeConfig: testRuntimeConfig({ locales: ['en', 'fr', 'ar'] }) });
    await open();
    const group = menu().querySelector<HTMLElement>('[role="group"]')!;
    expect(text(document.getElementById(group.getAttribute('aria-labelledby')!))).toBe('Language');
    const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="menuitemradio"]'));
    expect(radios.map((r) => text(r))).toEqual(['English LTR', 'Français LTR', 'العربية RTL']);
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(radios[2].getAttribute('lang')).toBe('ar');
    radios[2].click();
    await settle(fixture);
    expect(root.getAttribute('lang')).toBe('ar');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(menu().matches(':popover-open')).toBe(false);
    await open();
    expect(Array.from(menu().querySelectorAll('[role="menuitemradio"]')).map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });

  it('at 600 px and wider offers "Change language", which asks the topbar to open its language menu', async () => {
    await create({ session: testSession(), runtimeConfig: testRuntimeConfig({ locales: ['en', 'fr'] }) });
    await open();
    expect(menu().querySelector('[role="menuitemradio"]')).toBeNull();
    const change = item('Change language');
    expect(text(change)).toBe('Change language English (LTR)');
    change.click();
    await settle(fixture);
    expect(TestBed.inject(PaepShellLayout).languageMenuRequest()).toBe(1);
  });

  it('below 600 px the host help links move into the menu as a Help group', async () => {
    const opened: string[] = [];
    await create({
      session: testSession(),
      medium: false,
      hooks: { helpLinks: [{ label: 'Help for this page', run: () => opened.push('page') }, { label: 'Support site', href: '/support' }] },
    });
    await open();
    const group = Array.from(menu().querySelectorAll<HTMLElement>('[role="group"]')).find((g) => text(document.getElementById(g.getAttribute('aria-labelledby')!)) === 'Help')!;
    const links = Array.from(group.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    expect(links.map((l) => text(l))).toEqual(['Help for this page', 'Support site']);
    expect(links[1].tagName).toBe('A');
    expect(links[1].getAttribute('href')).toBe('/support');
    links[0].click();
    expect(opened).toEqual(['page']);
  });

  it('neutralises a script URL in a host help link (Angular URL sanitisation): it never runs', async () => {
    await create({ session: testSession(), medium: false, hooks: { helpLinks: [{ label: 'Bad link', href: 'javascript:alert(1)' }] } });
    await open();
    const link = items().find((i) => text(i) === 'Bad link') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toMatch(/^unsafe:javascript:/);
  });

  it('shows the display name at 1280 px and wider only; the name never widens the button past its limit', async () => {
    await create({ session: testSession() });
    const name = () => el.querySelector<HTMLElement>('.paep-account-menu__name')!;
    await page.viewport(1280, 800);
    await settle(fixture);
    expect(getComputedStyle(name()).display).not.toBe('none');
    expect(name().getAttribute('aria-hidden')).toBe('true');
    await page.viewport(1100, 800);
    await settle(fixture);
    expect(getComputedStyle(name()).display).toBe('none');
    expect(button().getBoundingClientRect().width).toBeGreaterThanOrEqual(40 - 0.5);
  });
});
