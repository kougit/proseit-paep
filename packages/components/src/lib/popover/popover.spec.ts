import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { PaepPopover, PaepPopoverTrigger } from './popover';

@Component({
  imports: [PaepPopover, PaepPopoverTrigger],
  template: `
    <div [attr.dir]="dir()" [style]="placeStyle()">
      <button type="button" id="info-trigger" [paepPopoverTrigger]="info">About status</button>
      <paep-popover #info (openChange)="events.push($event)">
        <p id="info-text">Pending means the record is waiting for review.</p>
      </paep-popover>
      <button type="button" id="links-trigger" [paepPopoverTrigger]="links">Related</button>
      <paep-popover #links>
        <a href="#record-1" id="link-1">Record 1</a>
        <a href="#record-2" id="link-2">Record 2</a>
      </paep-popover>
      <button type="button" id="menu-trigger" [paepPopoverTrigger]="menu">More actions</button>
      <paep-popover #menu variant="menu">
        <button type="button" role="menuitem" id="m1">Duplicate</button>
        <button type="button" role="menuitem" id="m2">Archive</button>
        <button type="button" role="menuitem" id="m3">Export</button>
      </paep-popover>
      <button type="button" id="long-trigger" [paepPopoverTrigger]="long">Retention details</button>
      <paep-popover #long>
        @for (n of lines; track n) {
          <p>Retention rule {{ n }} keeps records for the period set by the record owner.</p>
        }
      </paep-popover>
      <button type="button" id="after">Next control</button>
    </div>
  `,
})
class PopoverHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly placeStyle = signal('');
  readonly events: boolean[] = [];
  readonly lines = Array.from({ length: 40 }, (_, i) => i + 1);
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 20));
  f.detectChanges();
  await Promise.all(document.getAnimations().map((a) => a.finished));
};

describe('PaepPopover', () => {
  let fixture: ComponentFixture<PopoverHost>;
  let host: PopoverHost;
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const panel = (trigger: string) => document.getElementById(q(trigger).getAttribute('aria-controls')!)!;

  beforeEach(async () => {
    await page.viewport(1024, 768);
    fixture = TestBed.createComponent(PopoverHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(async () => {
    fixture.destroy();
    await page.viewport(414, 896);
  });

  it('uses the HTML popover attribute and links the trigger with aria-controls and aria-expanded', () => {
    const trigger = q('#info-trigger');
    const p = panel('#info-trigger');
    expect(p.tagName).toBe('PAEP-POPOVER');
    expect(p.getAttribute('popover')).toBe('auto');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(p.matches(':popover-open')).toBe(false);
  });

  it('is never opened by hover', async () => {
    await userEvent.hover(q('#info-trigger'));
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
  });

  it('toggles with Enter and Space; informational content keeps focus on the trigger and describes it', async () => {
    const trigger = q('#info-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    const p = panel('#info-trigger');
    expect(p.matches(':popover-open')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-describedby')).toBe(p.id);
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(p.matches(':popover-open')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    expect(host.events).toEqual([true, false]);
  });

  it('toggles on pointer click, including clicking the trigger again while open', async () => {
    const trigger = q('#info-trigger');
    await userEvent.click(trigger);
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(true);
    await userEvent.click(trigger);
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
  });

  it('anchors below the trigger at its inline-start edge', async () => {
    host.placeStyle.set('padding: 40px 100px');
    await settle(fixture);
    await userEvent.click(q('#links-trigger'));
    await settle(fixture);
    const t = q('#links-trigger').getBoundingClientRect();
    const p = panel('#links-trigger');
    const r = p.getBoundingClientRect();
    expect(p.getAttribute('data-placement')).toBe('below');
    expect(r.top).toBeGreaterThanOrEqual(t.bottom);
    expect(Math.round(r.left)).toBe(Math.round(t.left));
  });

  it('aligns to the right edge of the trigger in RTL', async () => {
    host.dir.set('rtl');
    host.placeStyle.set('padding: 40px 100px');
    await settle(fixture);
    await userEvent.click(q('#links-trigger'));
    await settle(fixture);
    const t = q('#links-trigger').getBoundingClientRect();
    expect(Math.round(panel('#links-trigger').getBoundingClientRect().right)).toBe(Math.round(t.right));
  });

  it('flips above when there is no room below and shifts to stay 16 px inside the viewport', async () => {
    host.placeStyle.set('position: fixed; inset-block-end: 8px; inset-inline-end: 0; display: flex; gap: 4px');
    await settle(fixture);
    await userEvent.click(q('#menu-trigger'));
    await settle(fixture);
    const t = q('#menu-trigger').getBoundingClientRect();
    const p = panel('#menu-trigger');
    const r = p.getBoundingClientRect();
    expect(p.getAttribute('data-placement')).toBe('above');
    expect(r.bottom).toBeLessThanOrEqual(t.top);
    expect(r.right).toBeLessThanOrEqual(1024 - 16 + 0.5);
  });

  it('is at most min(20 rem, 100vw - 32 px) wide on narrow screens', async () => {
    await page.viewport(300, 600);
    await userEvent.click(q('#info-trigger'));
    await settle(fixture);
    const r = panel('#info-trigger').getBoundingClientRect();
    expect(r.width).toBeLessThanOrEqual(300 - 32 + 0.5);
    expect(r.left).toBeGreaterThanOrEqual(16 - 0.5);
    await page.viewport(1024, 768);
    await settle(fixture);
    expect(panel('#info-trigger').getBoundingClientRect().width).toBeLessThanOrEqual(320);
  });

  it('moves focus into interactive content and closes on Escape, returning focus to the trigger', async () => {
    const trigger = q('#links-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(document.activeElement).toBe(q('#link-1'));
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(panel('#links-trigger').matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape while focus stays on the trigger', async () => {
    const trigger = q('#info-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when Tab moves past the last element and focus continues in page order', async () => {
    q('#links-trigger').focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    await userEvent.tab();
    expect(document.activeElement).toBe(q('#link-2'));
    await userEvent.tab();
    await settle(fixture);
    expect(panel('#links-trigger').matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(q('#menu-trigger'));
  });

  it('closes an informational panel when Tab moves on from the trigger it describes', async () => {
    const trigger = q('#info-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(true);
    expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard('{Tab}');
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(q('#links-trigger'));
  });

  it('closes an informational panel when focus leaves the document from its trigger, not on a click inside the page', async () => {
    const trigger = q('#info-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    const leave = async (documentHasFocus: boolean) => {
      const spy = vi.spyOn(document, 'hasFocus').mockReturnValue(documentHasFocus);
      try {
        trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
        await new Promise((r) => setTimeout(r, 20));
        await settle(fixture);
      } finally {
        spy.mockRestore();
      }
    };
    await leave(true);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(true);
    await leave(false);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the trigger in view when Escape returns focus to it', async () => {
    const trigger = q('#long-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    const spy = vi.spyOn(trigger, 'scrollIntoView');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(document.activeElement).toBe(trigger);
    expect(spy).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    spy.mockRestore();
  });

  it('makes long content without controls a focusable region named by the trigger, scrollable with the keyboard', async () => {
    const trigger = q('#long-trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    const p = panel('#long-trigger');
    expect(p.scrollHeight).toBeGreaterThan(p.clientHeight);
    expect(document.activeElement).toBe(p);
    expect(p.getAttribute('tabindex')).toBe('0');
    expect(p.getAttribute('role')).toBe('region');
    expect(p.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    await userEvent.keyboard('{PageDown}');
    await settle(fixture);
    expect(p.scrollTop).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(document.activeElement).toBe(trigger);
    expect(p.hasAttribute('role')).toBe(false);
  });

  it('closes on an outside click (light dismiss)', async () => {
    await userEvent.click(q('#info-trigger'));
    await settle(fixture);
    await userEvent.click(q('#after'));
    await settle(fixture);
    expect(panel('#info-trigger').matches(':popover-open')).toBe(false);
    expect(q('#info-trigger').getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(q('#after'));
  });

  it('menu variant: role menu, ArrowDown opens on the first item, arrows/Home/End move, Escape returns to the trigger', async () => {
    const trigger = q('#menu-trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(panel('#menu-trigger').getAttribute('role')).toBe('menu');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(document.activeElement).toBe(q('#m1'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#m2'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(q('#m3'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(q('#m1'));
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(q('#m3'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(q('#m1'));
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(document.activeElement).toBe(q('#m3'));
  });
});
