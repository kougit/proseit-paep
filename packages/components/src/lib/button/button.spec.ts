import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepButton, PaepButtonVariant } from './button';

@Component({
  imports: [PaepButton],
  template: `
    <form (submit)="onSubmit($event)">
      <button paepButton [variant]="variant()" [icon]="icon()" [loading]="loading()" [disabled]="disabled()" (click)="clicks = clicks + 1">
        {{ label() }}
      </button>
      <button paepButton type="submit" variant="primary" id="submit" [loading]="loading()">Save changes</button>
      <a paepButton href="#target" id="link" trailingIcon="external">Open guide</a>
    </form>
  `,
})
class ButtonHost {
  readonly variant = signal<PaepButtonVariant>('secondary');
  readonly icon = signal<'plus' | undefined>('plus');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly label = signal('Add record');
  clicks = 0;
  submits = 0;
  onSubmit(event: Event): void {
    event.preventDefault();
    this.submits++;
  }
}

@Component({
  imports: [PaepButton],
  template: `
    <div [style.inline-size.px]="width()">
      <button paepButton variant="field" keyHint="Ctrl K" aria-keyshortcuts="Control+K Meta+K" (click)="clicks = clicks + 1">{{ label() }}</button>
    </div>
  `,
})
class FieldHost {
  readonly width = signal(320);
  readonly label = signal('Search or go to…');
  clicks = 0;
}

async function setupField() {
  const fixture = TestBed.createComponent(FieldHost);
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
  const fixture = TestBed.createComponent(ButtonHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const button = el.querySelector('button') as HTMLButtonElement;
  const submit = el.querySelector('#submit') as HTMLButtonElement;
  const link = el.querySelector('#link') as HTMLAnchorElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, button, submit, link, settle };
}

describe('PaepButton', () => {
  it('is a native button named by its visible label with an aria-hidden decorative icon', async () => {
    const { button } = await setup();
    await expect.element(page.getByRole('button', { name: 'Add record' })).toBeInTheDocument();
    expect(button.getAttribute('type')).toBe('button');
    const icon = button.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
  });

  it('activates with Enter and Space and keeps focus on the button', async () => {
    const { button, host } = await setup();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(host.clicks).toBe(2);
    expect(document.activeElement).toBe(button);
  });

  it('renders each variant with its own class and fill', async () => {
    const { button, host, settle } = await setup();
    const fills = new Set<string>();
    button.style.transition = 'none';
    for (const v of ['primary', 'secondary', 'tertiary', 'destructive'] as const) {
      host.variant.set(v);
      await settle();
      expect(button.classList).toContain(`paep-button--${v}`);
      fills.add(getComputedStyle(button).backgroundColor);
    }
    expect(fills.size).toBe(4);
  });

  it('uses the density control height as minimum height (40px comfortable, 32px compact)', async () => {
    const { button, fixture, settle } = await setup();
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    (fixture.nativeElement as HTMLElement).setAttribute('data-paep-density', 'compact');
    await settle();
    const expected = matchMedia('(pointer: coarse)').matches ? '40px' : '32px';
    expect(getComputedStyle(button).minHeight).toBe(expected);
    (fixture.nativeElement as HTMLElement).removeAttribute('data-paep-density');
  });

  it('loading: spinner replaces the leading icon, aria-busy + aria-disabled, stays focusable, suppresses activation', async () => {
    const { button, host, settle } = await setup();
    const width = button.getBoundingClientRect().width;
    button.focus();
    host.loading.set(true);
    await settle();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    expect(document.activeElement).toBe(button);
    const icons = button.querySelectorAll('svg');
    expect(icons.length).toBe(1);
    expect(icons[0].classList).toContain('paep-icon--spin');
    await userEvent.keyboard('{Enter}');
    button.click();
    expect(host.clicks).toBe(0);
    expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(width - 0.5);
    host.loading.set(false);
    await settle();
    expect(button.hasAttribute('aria-busy')).toBe(false);
    button.click();
    expect(host.clicks).toBe(1);
  });

  it('a loading submit button does not submit the form; otherwise it submits natively', async () => {
    const { submit, host, settle } = await setup();
    submit.click();
    expect(host.submits).toBe(1);
    host.loading.set(true);
    await settle();
    submit.click();
    expect(host.submits).toBe(1);
  });

  it('disabled uses the native attribute with a dashed border as the non-colour cue', async () => {
    const { button, host, settle } = await setup();
    host.disabled.set(true);
    await settle();
    expect(button.disabled).toBe(true);
    expect(getComputedStyle(button).borderTopStyle).toBe('dashed');
    button.click();
    expect(host.clicks).toBe(0);
  });

  it('link-styled button keeps link semantics and has no type attribute', async () => {
    const { link } = await setup();
    await expect.element(page.getByRole('link', { name: 'Open guide' })).toBeInTheDocument();
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.classList).toContain('paep-button');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('wraps a long label instead of truncating it and grows in height', async () => {
    const { button, host, fixture, settle } = await setup();
    (fixture.nativeElement as HTMLElement).style.inlineSize = '12rem';
    host.label.set('Save the changes to this record and continue to the next step');
    await settle();
    const label = button.querySelector('.paep-button__label') as HTMLElement;
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    expect(button.getBoundingClientRect().height).toBeGreaterThan(40);
    expect(getComputedStyle(label).textOverflow).not.toBe('ellipsis');
  });

  it('mirrors in RTL: the leading icon sits at the inline-start (right)', async () => {
    const { button, fixture, settle } = await setup();
    (fixture.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
    await settle();
    const icon = button.querySelector('svg') as SVGElement;
    const label = button.querySelector('.paep-button__label') as HTMLElement;
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().left);
  });

  it('field: a button presented like a field with a leading search icon and a decorative keyboard hint', async () => {
    const { button } = await setupField();
    await expect.element(page.getByRole('button', { name: 'Search or go to…' })).toBeInTheDocument();
    expect(button.classList).toContain('paep-button--field');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    const [icon] = [...button.querySelectorAll('svg')];
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('path')).not.toBeNull();
    const hint = button.querySelector('kbd') as HTMLElement;
    expect(hint.textContent?.trim()).toBe('Ctrl K');
    expect(hint.getAttribute('aria-hidden')).toBe('true');
    const s = getComputedStyle(button);
    expect(s.borderTopStyle).toBe('solid');
    expect(s.borderTopColor).toBe('rgb(106, 115, 126)');
    expect(s.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(s.color).toBe('rgb(84, 93, 104)');
  });

  it('field: activates like any button with Enter and Space', async () => {
    const { button, host } = await setupField();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(host.clicks).toBe(2);
  });

  it('field: a long label truncates on one line inside a narrow container while the name keeps it in full', async () => {
    const { button, host, settle } = await setupField();
    host.width.set(200);
    host.label.set('Search records, pages, commands and recently viewed destinations');
    await settle();
    const label = button.querySelector('.paep-button__label') as HTMLElement;
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    expect(button.getBoundingClientRect().height).toBeLessThanOrEqual(41);
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
    await expect.element(page.getByRole('button', { name: 'Search records, pages, commands and recently viewed destinations' })).toBeInTheDocument();
  });
});
