import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepMenu, PaepMenuGroup, PaepMenuItem, PaepMenuItemRadio, PaepMenuSeparator, PaepMenuTrigger } from './menu';

@Component({
  imports: [PaepMenu, PaepMenuTrigger, PaepMenuItem, PaepMenuItemRadio, PaepMenuGroup, PaepMenuSeparator],
  template: `
    <div [attr.dir]="dir()" style="display: flex; gap: 8px; padding: 40px 300px">
      <button type="button" id="before">Before</button>
      <button type="button" id="account" [paepMenuTrigger]="account">Account</button>
      <paep-menu #account label="Account" align="end">
        <button paepMenuItem id="prefs" icon="sliders" (click)="log.push('prefs')">Display preferences</button>
        <a paepMenuItem id="help" href="#help" (click)="log.push('help')">Help</a>
        <button paepMenuItem id="export" disabled (click)="log.push('export')">Export</button>
        <paep-menu-group label="Language" id="lang">
          @for (l of locales; track l.id) {
            <button paepMenuItemRadio [id]="'lang-' + l.id" [checked]="locale() === l.id" (select)="locale.set(l.id)">{{ l.name }}</button>
          }
        </paep-menu-group>
        <hr paepMenuSeparator />
        <button paepMenuItem id="sign-out" keepOpen (click)="log.push('sign-out')">Sign out</button>
      </paep-menu>
      <button type="button" id="actions" [paepMenuTrigger]="actions">Actions</button>
      <paep-menu #actions label="Actions">
        <button paepMenuItem id="a1">Duplicate</button>
        <button paepMenuItem id="a2" destructive>Archive</button>
      </paep-menu>
      <button type="button" id="after">After</button>
    </div>
  `,
})
class MenuHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly locale = signal('en');
  readonly log: string[] = [];
  readonly locales = [
    { id: 'en', name: 'English' },
    { id: 'fr', name: 'Français' },
    { id: 'ar', name: 'العربية' },
  ];
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 20));
  f.detectChanges();
  await Promise.all(document.getAnimations().map((a) => a.finished));
};

describe('PaepMenu', () => {
  let fixture: ComponentFixture<MenuHost>;
  let host: MenuHost;
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const menuOf = (trigger: string) => document.getElementById(q(trigger).getAttribute('aria-controls')!)!;
  const open = (trigger: string) => menuOf(trigger).matches(':popover-open');

  beforeEach(async () => {
    await page.viewport(1024, 768);
    fixture = TestBed.createComponent(MenuHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(async () => {
    fixture.destroy();
    await page.viewport(414, 896);
  });

  it('menu button: aria-haspopup="menu", aria-expanded and aria-controls to a named role="menu" on the popover base', async () => {
    const button = q('#account');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const menu = menuOf('#account');
    expect(menu.tagName).toBe('PAEP-POPOVER');
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-label')).toBe('Account');
    expect(menu.getAttribute('popover')).toBe('auto');
    expect(q('#prefs').getAttribute('role')).toBe('menuitem');
    expect(q('#help').getAttribute('role')).toBe('menuitem');
    expect(q('#lang-en').getAttribute('role')).toBe('menuitemradio');
    expect(q('hr').getAttribute('role')).toBe('separator');
    await userEvent.click(button);
    await settle(fixture);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('Enter and Space open on the first item, ArrowDown on the first and ArrowUp on the last', async () => {
    const button = q('#actions');
    for (const [key, first] of [['{Enter}', '#a1'], [' ', '#a1'], ['{ArrowDown}', '#a1'], ['{ArrowUp}', '#a2']] as const) {
      button.focus();
      await userEvent.keyboard(key);
      await settle(fixture);
      expect(open('#actions')).toBe(true);
      expect(document.activeElement).toBe(q(first));
      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      expect(open('#actions')).toBe(false);
      expect(document.activeElement).toBe(button);
    }
  });

  it('arrows move and wrap, Home/End jump, a printable character types ahead; a disabled item stays reachable', async () => {
    q('#account').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(document.activeElement).toBe(q('#prefs'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#help'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#export'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#lang-en'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(q('#sign-out'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#prefs'));
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(q('#sign-out'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(q('#prefs'));
    await userEvent.keyboard('f');
    expect(document.activeElement).toBe(q('#lang-fr'));
    await new Promise((r) => setTimeout(r, 600));
    await userEvent.keyboard('h');
    expect(document.activeElement).toBe(q('#help'));
  });

  it('activating an item runs it, closes the menu and returns focus to the button', async () => {
    q('#account').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(host.log).toEqual(['prefs']);
    expect(open('#account')).toBe(false);
    expect(document.activeElement).toBe(q('#account'));
  });

  it('Space activates a link item as Enter does', async () => {
    q('#account').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#help'));
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(host.log).toEqual(['help']);
    expect(open('#account')).toBe(false);
  });

  it('a radio item: Enter checks it, unchecks the others in its group and closes; the group is named by its label', async () => {
    const group = q('#lang');
    expect(group.getAttribute('role')).toBe('group');
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Language');
    expect(q('#lang-en').getAttribute('aria-checked')).toBe('true');
    expect(q('#lang-fr').getAttribute('aria-checked')).toBe('false');
    q('#account').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.keyboard('f');
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(host.locale()).toBe('fr');
    expect(q('#lang-fr').getAttribute('aria-checked')).toBe('true');
    expect(q('#lang-en').getAttribute('aria-checked')).toBe('false');
    expect(open('#account')).toBe(false);
    expect(document.activeElement).toBe(q('#account'));
  });

  it('a disabled item is announced (aria-disabled) but does nothing and keeps the menu open; a keepOpen item keeps it open', async () => {
    await userEvent.click(q('#account'));
    await settle(fixture);
    expect(q('#export').getAttribute('aria-disabled')).toBe('true');
    expect(q('#export').hasAttribute('disabled')).toBe(false);
    // Pointer activation of an aria-disabled item (the test driver refuses to click it, so dispatch the click).
    q('#export').click();
    await settle(fixture);
    expect(host.log).toEqual([]);
    expect(open('#account')).toBe(true);
    await userEvent.click(q('#sign-out'));
    await settle(fixture);
    expect(host.log).toEqual(['sign-out']);
    expect(open('#account')).toBe(true);
  });

  it('Tab closes the menu and moves on in page order', async () => {
    q('#account').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.tab();
    await settle(fixture);
    expect(open('#account')).toBe(false);
    expect(document.activeElement).not.toBe(q('#prefs'));
    expect(menuOf('#account').contains(document.activeElement)).toBe(false);
  });

  it('one menu open at a time; an outside click closes it (light dismiss)', async () => {
    await userEvent.click(q('#account'));
    await settle(fixture);
    await userEvent.click(q('#actions'));
    await settle(fixture);
    expect(open('#actions')).toBe(true);
    expect(open('#account')).toBe(false);
    expect(q('#account').getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(q('#after'));
    await settle(fixture);
    expect(open('#actions')).toBe(false);
    expect(document.activeElement).toBe(q('#after'));
  });

  it('align="end" sits at the button\'s inline-end edge (right in LTR, left in RTL)', async () => {
    await userEvent.click(q('#account'));
    await settle(fixture);
    expect(Math.round(menuOf('#account').getBoundingClientRect().right)).toBe(Math.round(q('#account').getBoundingClientRect().right));
    await userEvent.keyboard('{Escape}');
    host.dir.set('rtl');
    await settle(fixture);
    await userEvent.click(q('#account'));
    await settle(fixture);
    expect(Math.round(menuOf('#account').getBoundingClientRect().left)).toBe(Math.round(q('#account').getBoundingClientRect().left));
  });

  it('below 600 px items are at least 40 px tall and the menu stays 16 px inside the viewport', async () => {
    await page.viewport(360, 640);
    await settle(fixture);
    await userEvent.click(q('#account'));
    await settle(fixture);
    const r = menuOf('#account').getBoundingClientRect();
    expect(r.left).toBeGreaterThanOrEqual(16 - 0.5);
    expect(r.right).toBeLessThanOrEqual(360 - 16 + 0.5);
    for (const item of Array.from(menuOf('#account').querySelectorAll<HTMLElement>('[role^="menuitem"]'))) {
      expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(40 - 0.5);
    }
  });
});
