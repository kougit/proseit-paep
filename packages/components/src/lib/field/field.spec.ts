import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepInput } from '../input/input';
import { PaepSelect } from '../select/select';
import { PaepField } from './field';

@Component({
  imports: [PaepField, PaepInput, PaepSelect],
  template: `
    <paep-field
      id="main"
      [label]="label()"
      [help]="help()"
      [error]="error()"
      [required]="required()"
      [optional]="optional()"
      [readonly]="readonly()"
      [dirty]="dirty()"
      [prefix]="prefix()"
      [suffix]="suffix()"
    >
      <input paepInput [disabled]="disabled()" [readOnly]="readonly()" />
    </paep-field>
    <paep-field label="Region" id="sel">
      <select paepSelect required><option value="">Choose a region</option><option>North</option></select>
    </paep-field>
    <paep-field label="Reference" id="own">
      <input paepInput id="custom-ref" aria-describedby="ref-count" />
      <span id="ref-count">0 of 20</span>
    </paep-field>
  `,
})
class FieldHost {
  readonly label = signal('Quantity');
  readonly help = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly optional = signal(false);
  readonly readonly = signal(false);
  readonly dirty = signal(false);
  readonly disabled = signal(false);
  readonly prefix = signal<string | null>(null);
  readonly suffix = signal<string | null>(null);
}

async function setup() {
  const fixture = TestBed.createComponent(FieldHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const field = el.querySelector('#main') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return {
    fixture,
    el,
    host: fixture.componentInstance,
    field,
    input: field.querySelector('input') as HTMLInputElement,
    label: field.querySelector('label') as HTMLLabelElement,
    settle,
  };
}

describe('PaepField', () => {
  it('labels the projected control with <label for> and clicking the label focuses it', async () => {
    const { input, label } = await setup();
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
    await expect.element(page.getByLabelText('Quantity')).toBe(input);
    await userEvent.click(label);
    expect(document.activeElement).toBe(input);
  });

  it('keeps a consumer id and appends a consumer aria-describedby after the field ids', async () => {
    const { el } = await setup();
    const own = el.querySelector('#own') as HTMLElement;
    const input = own.querySelector('input') as HTMLInputElement;
    expect(input.id).toBe('custom-ref');
    expect(own.querySelector('label')?.htmlFor).toBe('custom-ref');
    expect(input.getAttribute('aria-describedby')).toBe('ref-count');
  });

  it('required: visual asterisk hidden from assistive technology, native required on the control', async () => {
    const { host, input, label, settle } = await setup();
    expect(label.querySelector('.paep-field__req')).toBeNull();
    expect(input.required).toBe(false);
    host.required.set(true);
    await settle();
    const star = label.querySelector('.paep-field__req') as HTMLElement;
    expect(star.textContent?.trim()).toBe('*');
    expect(star.getAttribute('aria-hidden')).toBe('true');
    expect(input.required).toBe(true);
    await expect.element(page.getByRole('textbox', { name: 'Quantity' })).toBeRequired();
  });

  it('shows the required marker when the control itself carries required', async () => {
    const { el } = await setup();
    const sel = el.querySelector('#sel') as HTMLElement;
    expect(sel.querySelector('.paep-field__req')).not.toBeNull();
    expect((sel.querySelector('select') as HTMLSelectElement).required).toBe(true);
    expect(sel.querySelector('label')?.htmlFor).toBe(sel.querySelector('select')?.id);
  });

  it('help text is associated through aria-describedby', async () => {
    const { host, input, field, settle } = await setup();
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    host.help.set('Whole units only.');
    await settle();
    const help = field.querySelector('.paep-field__help') as HTMLElement;
    expect(input.getAttribute('aria-describedby')).toBe(help.id);
    await expect.element(page.getByRole('textbox', { name: 'Quantity' })).toHaveAccessibleDescription('Whole units only.');
  });

  it('error: icon + text, aria-invalid, described error first then help; not a live region; removed when fixed', async () => {
    const { host, input, field, settle } = await setup();
    host.help.set('Whole units only.');
    host.error.set('Quantity must be 0 or more.');
    await settle();
    const error = field.querySelector('.paep-field__error') as HTMLElement;
    const help = field.querySelector('.paep-field__help') as HTMLElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(`${error.id} ${help.id}`);
    expect(error.textContent?.trim()).toBe('Quantity must be 0 or more.');
    expect(error.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(error.hasAttribute('role')).toBe(false);
    expect(error.hasAttribute('aria-live')).toBe(false);
    expect(getComputedStyle(input).borderTopWidth).toBe('2px');
    await expect.element(page.getByRole('textbox', { name: 'Quantity' })).toHaveAccessibleDescription('Quantity must be 0 or more. Whole units only.');
    host.error.set(null);
    await settle();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(field.querySelector('.paep-field__error')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe(help.id);
  });

  it('meta texts "(optional)", "(read only)" and "Unsaved change" are text in the label', async () => {
    const { host, label, settle } = await setup();
    host.optional.set(true);
    await settle();
    await expect.element(page.getByRole('textbox', { name: 'Quantity (optional)' })).toBeInTheDocument();
    host.optional.set(false);
    host.readonly.set(true);
    host.dirty.set(true);
    await settle();
    const metas = [...label.querySelectorAll('.paep-field__meta')].map((m) => m.textContent?.trim());
    expect(metas).toEqual(['(read only)', 'Unsaved change']);
  });

  it('prefix and suffix adornments are referenced after error and help so units are announced', async () => {
    const { host, input, field, settle } = await setup();
    host.help.set('Net weight of one unit.');
    host.prefix.set('KES');
    host.suffix.set('kg');
    await settle();
    const [prefix, suffix] = [...field.querySelectorAll<HTMLElement>('.paep-field__affix')];
    const help = field.querySelector('.paep-field__help') as HTMLElement;
    expect(prefix.textContent?.trim()).toBe('KES');
    expect(input.getAttribute('aria-describedby')).toBe(`${help.id} ${prefix.id} ${suffix.id}`);
    const p = prefix.getBoundingClientRect();
    const i = input.getBoundingClientRect();
    const s = suffix.getBoundingClientRect();
    expect(p.right).toBeLessThanOrEqual(i.left + 1);
    expect(s.left).toBeGreaterThanOrEqual(i.right - 1);
    expect(getComputedStyle(prefix).whiteSpace).toBe('nowrap');
  });

  it('swaps prefix and suffix sides in RTL', async () => {
    const { host, el, field, settle } = await setup();
    el.setAttribute('dir', 'rtl');
    host.prefix.set('KES');
    host.suffix.set('kg');
    await settle();
    const [prefix, suffix] = [...field.querySelectorAll<HTMLElement>('.paep-field__affix')];
    expect(prefix.getBoundingClientRect().left).toBeGreaterThan(suffix.getBoundingClientRect().left);
    expect(getComputedStyle(field.querySelector('label') as HTMLElement).textAlign).toBe('start');
  });

  it('disabled control: label turns secondary colour and the control keeps native disabled', async () => {
    const { host, input, label, settle } = await setup();
    const before = getComputedStyle(label).color;
    host.disabled.set(true);
    await settle();
    expect(input.disabled).toBe(true);
    expect(getComputedStyle(label).color).not.toBe(before);
  });

  it('wraps a long label, help and error instead of truncating; max inline size 40rem', async () => {
    const { host, field, settle } = await setup();
    const long = 'A deliberately long translated label that needs to wrap onto several lines in a narrow column';
    host.label.set(long);
    host.help.set(long);
    host.error.set(long);
    field.style.inlineSize = '12rem';
    await settle();
    for (const part of field.querySelectorAll<HTMLElement>('label, .paep-field__help, .paep-field__error')) {
      expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth + 1);
      expect(part.getBoundingClientRect().height).toBeGreaterThan(40);
    }
    field.style.inlineSize = '';
    expect(getComputedStyle(field).maxWidth).toBe('640px');
  });
});
