import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
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
});
