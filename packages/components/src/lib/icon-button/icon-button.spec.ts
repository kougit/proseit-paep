import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepCount } from '../count-badge/count-badge';
import { PaepIconButton, PaepIconButtonVariant } from './icon-button';

@Component({
  imports: [PaepIconButton],
  template: `
    <button paepIconButton icon="close" [label]="label()" [variant]="variant()" [loading]="loading()" [disabled]="disabled()" (click)="clicks = clicks + 1"></button>
    <button paepIconButton icon="chevron-end" label="Next page" id="dir"></button>
  `,
})
class IconButtonHost {
  readonly label = signal('Close');
  readonly variant = signal<PaepIconButtonVariant>('tertiary');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  clicks = 0;
}

@Component({
  imports: [PaepIconButton],
  template: `<button paepIconButton icon="bell" label="Notifications" [count]="count()" countLabel="{count} unread"></button>`,
})
class CountHost {
  readonly count = signal<PaepCount | null>(3);
}

async function setupCount() {
  const fixture = TestBed.createComponent(CountHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { host: fixture.componentInstance, button, settle };
}

async function setup() {
  const fixture = TestBed.createComponent(IconButtonHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, host: fixture.componentInstance, button: el.querySelector('button') as HTMLButtonElement, settle };
}

describe('PaepIconButton', () => {
  it('takes its accessible name from the mandatory label (aria-label), never from title', async () => {
    const { button } = await setup();
    await expect.element(page.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.textContent?.trim()).toBe('');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('updates the name when the label changes', async () => {
    const { button, host, settle } = await setup();
    host.label.set('Close dialog');
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Close dialog');
  });

  it('activates with Enter and Space', async () => {
    const { button, host } = await setup();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(host.clicks).toBe(2);
  });

  it('is a square target of control height in both densities (never below 24px)', async () => {
    const { button, el, settle } = await setup();
    let r = button.getBoundingClientRect();
    expect(Math.round(r.width)).toBe(40);
    expect(Math.round(r.height)).toBe(40);
    el.setAttribute('data-paep-density', 'compact');
    await settle();
    r = button.getBoundingClientRect();
    const expected = matchMedia('(pointer: coarse)').matches ? 40 : 32;
    expect(Math.round(r.width)).toBe(expected);
    expect(Math.round(r.height)).toBe(expected);
    expect(r.width).toBeGreaterThanOrEqual(24);
  });

  it('offers only the secondary (bordered) and tertiary (borderless) variants', async () => {
    const { button, host, settle } = await setup();
    button.style.transition = 'none';
    expect(button.classList).toContain('paep-button--tertiary');
    expect(getComputedStyle(button).borderTopColor).toBe('rgba(0, 0, 0, 0)');
    host.variant.set('secondary');
    await settle();
    expect(button.classList).toContain('paep-button--secondary');
    expect(getComputedStyle(button).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('loading: spinner replaces the icon, aria-busy, focus kept, activation suppressed', async () => {
    const { button, host, settle } = await setup();
    button.focus();
    host.loading.set(true);
    await settle();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.querySelector('svg')?.classList).toContain('paep-icon--spin');
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    expect(host.clicks).toBe(0);
  });

  it('disabled: native disabled with a dashed border', async () => {
    const { button, host, settle } = await setup();
    host.disabled.set(true);
    await settle();
    expect(button.disabled).toBe(true);
    expect(getComputedStyle(button).borderTopStyle).toBe('dashed');
  });

  it('mirrors directional icons in RTL only', async () => {
    const { el, settle } = await setup();
    const icon = el.querySelector('#dir svg') as SVGElement;
    expect(getComputedStyle(icon).transform).toBe('none');
    el.setAttribute('dir', 'rtl');
    await settle();
    expect(getComputedStyle(icon).transform).not.toBe('none');
  });

  it('count: a decorative badge at the inline-end corner and the count appended to the name', async () => {
    const { button } = await setupCount();
    await expect.element(page.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
    const wrap = button.querySelector('.paep-icon-button__count') as HTMLElement;
    expect(wrap.getAttribute('aria-hidden')).toBe('true');
    expect(wrap.querySelector('.paep-count-badge__value')?.getAttribute('dir')).toBe('ltr');
    expect(wrap.querySelector('.paep-count-badge__value')?.textContent?.trim()).toBe('3');
    const b = button.getBoundingClientRect();
    const r = wrap.getBoundingClientRect();
    // Inside the 1px button border, at the inline-end corner.
    expect(Math.abs(r.top - b.top)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(r.right - b.right)).toBeLessThanOrEqual(1.5);
    expect(Math.round(b.width)).toBe(40);
  });

  it('count: capped at 99+; zero or null shows no badge; loading and unknown are named', async () => {
    const { button, host, settle } = await setupCount();
    host.count.set(120);
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Notifications, 99+ unread');
    expect(button.querySelector('.paep-count-badge__value')?.textContent?.trim()).toBe('99+');
    for (const none of [0, null]) {
      host.count.set(none);
      await settle();
      expect(button.getAttribute('aria-label')).toBe('Notifications');
      expect(button.querySelector('paep-count-badge')).toBeNull();
    }
    host.count.set('loading');
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Notifications, Loading count');
    expect(button.querySelector('paep-count-badge svg.paep-icon--spin')).not.toBeNull();
    host.count.set('unknown');
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Notifications, Count not available');
    expect(button.querySelector('.paep-count-badge__value')?.textContent?.trim()).toBe('–');
  });

  it('count: the badge mirrors to the inline-end corner in RTL', async () => {
    const { button, settle } = await setupCount();
    button.parentElement!.setAttribute('dir', 'rtl');
    await settle();
    const b = button.getBoundingClientRect();
    const r = (button.querySelector('.paep-icon-button__count') as HTMLElement).getBoundingClientRect();
    expect(Math.abs(r.left - b.left)).toBeLessThanOrEqual(1.5);
  });
});
