import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepTab, PaepTabs, PaepTabsActivation } from './tabs';

@Component({
  imports: [PaepTabs, PaepTab],
  template: `
    <button type="button" id="before">Before</button>
    <div [attr.dir]="dir()" [style.inline-size]="width()" style="display: grid">
      <paep-tabs label="Record sections" [activation]="activation()" [(selectedIndex)]="selected">
        <paep-tab label="Overview"><p>Overview text without controls.</p></paep-tab>
        <paep-tab label="Lines" [count]="12"><button type="button" id="add-line">Add line</button></paep-tab>
        <paep-tab label="Approvals" disabled disabledReason="Available after the record is submitted.">
          <p>Approvals</p>
        </paep-tab>
        <paep-tab label="Attachments" [errorCount]="2"><p>Attachments</p></paep-tab>
        @for (extra of extras(); track extra) {
          <paep-tab [label]="extra"><p>{{ extra }}</p></paep-tab>
        }
      </paep-tabs>
    </div>
  `,
})
class TabsHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly width = signal('auto');
  readonly activation = signal<PaepTabsActivation>('automatic');
  readonly extras = signal<string[]>([]);
  selected = 0;
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 20));
  f.detectChanges();
};

describe('PaepTabs', () => {
  let fixture: ComponentFixture<TabsHost>;
  let host: TabsHost;
  const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
  const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const list = () => document.querySelector('[role="tablist"]') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TabsHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('exposes tablist, tab and tabpanel semantics with names and relationships', () => {
    expect(list().getAttribute('aria-label')).toBe('Record sections');
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    tabs().forEach((tab, i) => {
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)!;
      expect(panel).toBe(panels()[i]);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    });
    expect(panels().map((p) => p.hidden)).toEqual([false, true, true, true]);
    expect(tabs()[0].textContent!.trim()).toBe('Overview');
  });

  it('uses a roving tabindex: Tab enters on the selected tab, then moves into the panel', async () => {
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    document.getElementById('before')!.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs()[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(panels()[0]);
    expect(panels()[0].getAttribute('tabindex')).toBe('0');
  });

  it('does not make a panel with focusable content a Tab stop', async () => {
    tabs()[1].focus();
    await userEvent.keyboard('{Home}');
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(panels()[1].hasAttribute('tabindex')).toBe(false);
    await userEvent.tab();
    expect(document.activeElement).toBe(document.getElementById('add-line'));
  });

  it('automatic activation: arrows select, wrap, and Home/End jump', async () => {
    tabs()[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(document.activeElement).toBe(tabs()[1]);
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    expect(host.selected).toBe(1);
    expect(panels()[1].hidden).toBe(false);
    expect(tabs()[1].tabIndex).toBe(0);
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(host.selected).toBe(3);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(document.activeElement).toBe(tabs()[0]);
    expect(host.selected).toBe(0);
    await userEvent.keyboard('{ArrowLeft}');
    await settle(fixture);
    expect(host.selected).toBe(3);
    await userEvent.keyboard('{Home}');
    await settle(fixture);
    expect(host.selected).toBe(0);
  });

  it('mirrors ArrowLeft and ArrowRight in RTL', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    tabs()[0].focus();
    await userEvent.keyboard('{ArrowLeft}');
    await settle(fixture);
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.selected).toBe(1);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(host.selected).toBe(0);
  });

  it('keeps disabled tabs focusable but not activatable, with the reason as description', async () => {
    const disabled = tabs()[2];
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.hasAttribute('disabled')).toBe(false);
    expect(document.getElementById(disabled.getAttribute('aria-describedby')!)!.textContent).toBe(
      'Available after the record is submitted.',
    );
    await userEvent.click(tabs()[1]);
    await settle(fixture);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(document.activeElement).toBe(disabled);
    expect(disabled.getAttribute('aria-selected')).toBe('false');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(disabled, { force: true });
    await settle(fixture);
    expect(disabled.getAttribute('aria-selected')).toBe('false');
    expect(host.selected).toBe(1);
  });

  it('manual activation: arrows move focus only; Enter or Space selects', async () => {
    host.activation.set('manual');
    await settle(fixture);
    tabs()[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.selected).toBe(0);
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(host.selected).toBe(1);
    await userEvent.keyboard('{End}');
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(host.selected).toBe(3);
  });

  it('selects on click and shows counts and errors as text, not colour alone', async () => {
    await userEvent.click(tabs()[3]);
    await settle(fixture);
    expect(host.selected).toBe(3);
    expect(tabs()[1].textContent).toContain('12');
    expect(tabs()[3].textContent).toContain('Contains 2 errors');
    expect(tabs()[3].querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(tabs()[3], '::after').blockSize).toBe('3px');
  });

  it('draws the focus ring inside the tab', async () => {
    document.getElementById('before')!.focus();
    await userEvent.tab();
    expect(tabs()[0].matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(tabs()[0]).outlineOffset).toBe('-2px');
  });

  it('scrolls an overflowing list inside its own box with aria-hidden edge scroll buttons', async () => {
    host.width.set('240px');
    host.extras.set(['History', 'Related records', 'Audit trail', 'Notes']);
    await settle(fixture);
    const l = list();
    expect(l.scrollWidth).toBeGreaterThan(l.clientWidth);
    expect(Math.round(l.getBoundingClientRect().width)).toBe(240);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    const [start, end] = Array.from(document.querySelectorAll<HTMLButtonElement>('.paep-tabs__scroll'));
    expect(start.getAttribute('aria-hidden')).toBe('true');
    expect(end.tabIndex).toBe(-1);
    expect(start.hidden).toBe(true);
    expect(end.hidden).toBe(false);
    await userEvent.click(end);
    await settle(fixture);
    expect(l.scrollLeft).toBeGreaterThan(0);
    expect(start.hidden).toBe(false);
    tabs()[0].focus();
    await userEvent.keyboard('{End}');
    await settle(fixture);
    const last = tabs()[tabs().length - 1].getBoundingClientRect();
    expect(last.right).toBeLessThanOrEqual(l.getBoundingClientRect().right + 1);
    expect(end.hidden).toBe(true);
  });

  it('scroll buttons swap edges in RTL', async () => {
    host.dir.set('rtl');
    host.width.set('240px');
    host.extras.set(['History', 'Related records', 'Audit trail', 'Notes']);
    await settle(fixture);
    const end = document.querySelector('.paep-tabs__scroll--end') as HTMLElement;
    expect(end.hidden).toBe(false);
    expect(Math.round(end.getBoundingClientRect().left)).toBe(Math.round(list().getBoundingClientRect().left));
    await userEvent.click(end);
    await settle(fixture);
    expect(list().scrollLeft).toBeLessThan(0);
  });
});
