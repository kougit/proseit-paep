import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepCard, PaepCardHeadingLevel } from './card';

@Component({
  imports: [PaepCard],
  template: `
    <div [style.inline-size]="width()" [attr.dir]="dir()">
      <paep-card id="summary" [heading]="heading()" [headingLevel]="level()" description="Updated today">
        <button type="button" paepCardActions id="edit">Edit</button>
        <p id="body">Record 1 is stored at North depot.</p>
        <button type="button" paepCardFooter id="open">Open record</button>
      </paep-card>
      <paep-card id="plain"><p>Body only</p></paep-card>
    </div>
  `,
})
class CardHost {
  readonly heading = signal('Summary');
  readonly level = signal<PaepCardHeadingLevel>(3);
  readonly width = signal('800px');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
};

describe('PaepCard', () => {
  let fixture: ComponentFixture<CardHost>;
  let host: CardHost;
  const section = (id = 'summary') => document.querySelector(`#${id} section`) as HTMLElement;
  const css = (el: Element) => getComputedStyle(el);
  const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  beforeEach(async () => {
    fixture = TestBed.createComponent(CardHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('is a section labelled by its heading, level 3 by default', () => {
    const heading = document.getElementById(section().getAttribute('aria-labelledby')!)!;
    expect(heading.tagName).toBe('H3');
    expect(heading.textContent!.trim()).toBe('Summary');
    expect(section().textContent).toContain('Updated today');
  });

  it('supports a configurable heading level', async () => {
    host.level.set(2);
    await settle(fixture);
    expect(document.getElementById(section().getAttribute('aria-labelledby')!)!.tagName).toBe('H2');
    host.level.set(5);
    await settle(fixture);
    expect(document.getElementById(section().getAttribute('aria-labelledby')!)!.tagName).toBe('H5');
  });

  it('places header actions, body and footer in their slots', () => {
    expect(section().querySelector('.paep-card__actions')!.contains(document.getElementById('edit'))).toBe(true);
    expect(section().querySelector('.paep-card__body')!.contains(document.getElementById('body'))).toBe(true);
    expect(section().querySelector('.paep-card__foot')!.contains(document.getElementById('open'))).toBe(true);
    const edit = document.getElementById('edit')!.getBoundingClientRect();
    const title = section().querySelector('h3')!.getBoundingClientRect();
    expect(edit.left).toBeGreaterThan(title.left);
    expect(Math.abs(edit.top - title.top)).toBeLessThan(title.height);
  });

  it('omits the heading, label and empty slots when there is no title or footer', () => {
    const plain = section('plain');
    expect(plain.hasAttribute('aria-labelledby')).toBe(false);
    expect(plain.querySelector('h3')).toBeNull();
    expect(css(plain.querySelector('.paep-card__foot')!).display).toBe('none');
  });

  it('uses a 1 px subtle border, medium radius and elevation 1, with no hover effect', async () => {
    const s = section();
    expect(css(s).borderTopWidth).toBe('1px');
    const probe = document.createElement('div');
    probe.style.color = 'var(--paep-color-border-subtle)';
    document.body.appendChild(probe);
    expect(css(s).borderTopColor).toBe(getComputedStyle(probe).color);
    probe.remove();
    expect(css(s).borderRadius).toBe(token('--paep-radius-md'));
    expect(css(s).boxShadow).toBe(token('--paep-elevation-1'));
    const before = { bg: css(s).backgroundColor, shadow: css(s).boxShadow, cursor: css(s).cursor };
    await userEvent.hover(s);
    expect({ bg: css(s).backgroundColor, shadow: css(s).boxShadow, cursor: css(s).cursor }).toEqual(before);
  });

  it('wraps header actions under the title and uses 16 px padding below 30 rem', async () => {
    host.width.set('320px');
    host.heading.set('A long summary title that needs two lines or more at narrow widths');
    await settle(fixture);
    const edit = document.getElementById('edit')!.getBoundingClientRect();
    const title = section().querySelector('h3')!.getBoundingClientRect();
    expect(edit.top).toBeGreaterThanOrEqual(title.bottom);
    expect(css(section()).paddingTop).toBe('16px');
    expect(section().scrollWidth).toBeLessThanOrEqual(320);
  });

  it('puts header actions at the inline-end (left) in RTL', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    const edit = document.getElementById('edit')!.getBoundingClientRect();
    const title = section().querySelector('h3')!.getBoundingClientRect();
    expect(edit.right).toBeLessThan(title.right);
  });
});
