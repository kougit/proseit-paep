import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepCardHeadingLevel } from '../card/card';
import { PaepPanel } from './panel';

@Component({
  imports: [PaepPanel],
  template: `
    <div [attr.dir]="dir()">
      <paep-panel id="delivery" heading="Delivery" collapsible [(expanded)]="expanded" [errorCount]="errors()" [headingLevel]="level()">
        <button type="button" paepPanelActions id="action">Reset</button>
        <label for="depot">Depot</label>
        <input id="depot" />
      </paep-panel>
      <paep-panel id="static" heading="Notes"><p>Static body</p></paep-panel>
    </div>
  `,
})
class PanelHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly errors = signal(0);
  readonly level = signal<PaepCardHeadingLevel>(3);
  expanded = true;
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await Promise.all(document.getAnimations().map((a) => a.finished));
};

describe('PaepPanel', () => {
  let fixture: ComponentFixture<PanelHost>;
  let host: PanelHost;
  const section = (id: string) => document.querySelector(`#${id} section`) as HTMLElement;
  const toggle = () => section('delivery').querySelector('h3 button, h2 button') as HTMLButtonElement;
  const body = () => document.getElementById(toggle().getAttribute('aria-controls')!)!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(PanelHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('is a section labelled by a heading that contains the disclosure button', () => {
    const heading = document.getElementById(section('delivery').getAttribute('aria-labelledby')!)!;
    expect(heading.tagName).toBe('H3');
    expect(heading.contains(toggle())).toBe(true);
    expect(toggle().textContent!.trim()).toBe('Delivery');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(body().hidden).toBe(false);
    expect(body().contains(document.getElementById('depot'))).toBe(true);
  });

  it('collapses and expands with Enter and Space, keeping focus on the toggle', async () => {
    toggle().focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(body().hidden).toBe(true);
    expect(getComputedStyle(body()).display).toBe('none');
    expect(host.expanded).toBe(false);
    expect(document.activeElement).toBe(toggle());
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(body().hidden).toBe(false);
    expect(host.expanded).toBe(true);
  });

  it('rotates the chevron to point at the inline-end when collapsed, mirrored in RTL', async () => {
    const chevron = () => section('delivery').querySelector('.paep-panel__chevron') as SVGElement;
    expect(getComputedStyle(chevron()).rotate).toBe('none');
    await userEvent.click(toggle());
    await settle(fixture);
    expect(getComputedStyle(chevron()).rotate).toBe('-90deg');
    host.dir.set('rtl');
    await settle(fixture);
    expect(getComputedStyle(chevron()).rotate).toBe('90deg');
  });

  it('shows "Contains N errors" in the header while collapsed and describes the toggle with it', async () => {
    host.errors.set(2);
    await settle(fixture);
    expect(section('delivery').textContent).not.toContain('Contains 2 errors');
    await userEvent.click(toggle());
    await settle(fixture);
    const describedBy = document.getElementById(toggle().getAttribute('aria-describedby')!)!;
    expect(describedBy.textContent).toBe('Contains 2 errors');
    expect(describedBy.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a static panel without a toggle, always showing its body', () => {
    const s = section('static');
    const heading = document.getElementById(s.getAttribute('aria-labelledby')!)!;
    expect(heading.textContent!.trim()).toBe('Notes');
    expect(s.querySelector('button')).toBeNull();
    expect(s.textContent).toContain('Static body');
  });

  it('supports a configurable heading level and header actions', async () => {
    host.level.set(2);
    await settle(fixture);
    expect(document.getElementById(section('delivery').getAttribute('aria-labelledby')!)!.tagName).toBe('H2');
    expect(section('delivery').querySelector('.paep-panel__head')!.contains(document.getElementById('action'))).toBe(true);
  });

  it('uses the subtle surface for the header', () => {
    const head = section('delivery').querySelector('.paep-panel__head')!;
    const probe = document.createElement('div');
    probe.style.background = 'var(--paep-color-surface-subtle)';
    document.body.appendChild(probe);
    expect(getComputedStyle(head).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
    probe.remove();
  });
});
