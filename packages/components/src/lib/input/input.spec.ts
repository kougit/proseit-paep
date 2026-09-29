import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { page, userEvent } from 'vitest/browser';
import { PaepField } from '../field/field';
import { PaepInput } from './input';

@Component({
  imports: [PaepInput, PaepField, ReactiveFormsModule, FormsModule],
  template: `
    <form id="native" (submit)="onSubmit($event)">
      <paep-field label="Batch code">
        <input paepInput name="batch" value="B-7781" [invalid]="invalid()" [readOnly]="readonly()" [disabled]="disabled()" placeholder="B-0000" />
      </paep-field>
      <button type="submit">Submit</button>
    </form>
    <paep-field label="Reactive name" [error]="reactive.invalid && reactive.touched ? 'Enter a name.' : null">
      <input paepInput [formControl]="reactive" id="reactive" />
    </paep-field>
    <paep-field label="Template name">
      <input paepInput [(ngModel)]="templateValue" id="template" />
    </paep-field>
    <input paepInput aria-label="Search records" type="search" id="standalone" />
  `,
})
class InputHost {
  readonly invalid = signal(false);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly reactive = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  templateValue = 'Initial';
  submitted: FormData | null = null;
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.target as HTMLFormElement);
  }
}

async function setup() {
  const fixture = TestBed.createComponent(InputHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const input = el.querySelector('input[name="batch"]') as HTMLInputElement;
  input.style.transition = 'none';
  return { fixture, el, host: fixture.componentInstance, input, settle };
}

describe('PaepInput', () => {
  it('stays a native textbox with the field label as its name', async () => {
    const { input } = await setup();
    await expect.element(page.getByRole('textbox', { name: 'Batch code' })).toBe(input);
    expect(input.tagName).toBe('INPUT');
    expect(input.classList).toContain('paep-input');
  });

  it('accepts typing natively and submits with a native form', async () => {
    const { el, host, input } = await setup();
    await userEvent.clear(input);
    await userEvent.type(input, 'B-1234');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    expect(host.submitted?.get('batch')).toBe('B-1234');
  });

  it('works with reactive forms: value both ways, validation drives the field error and aria-invalid', async () => {
    const { el, host, settle } = await setup();
    const input = el.querySelector('#reactive') as HTMLInputElement;
    await userEvent.type(input, 'North depot');
    expect(host.reactive.value).toBe('North depot');
    host.reactive.setValue('');
    host.reactive.markAsTouched();
    await settle();
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await expect.element(page.getByRole('textbox', { name: 'Reactive name' })).toHaveAccessibleDescription('Enter a name.');
    host.reactive.disable();
    await settle();
    expect(input.disabled).toBe(true);
  });

  it('works with template-driven forms (ngModel)', async () => {
    const { el, host, settle } = await setup();
    const input = el.querySelector('#template') as HTMLInputElement;
    await settle();
    expect(input.value).toBe('Initial');
    await userEvent.clear(input);
    await userEvent.type(input, 'Record 1');
    expect(host.templateValue).toBe('Record 1');
  });

  it('uses the density control height (40px comfortable, 32px compact)', async () => {
    const { el, input, settle } = await setup();
    expect(Math.round(input.getBoundingClientRect().height)).toBe(40);
    el.setAttribute('data-paep-density', 'compact');
    await settle();
    expect(getComputedStyle(input).minHeight).toBe(matchMedia('(pointer: coarse)').matches ? '40px' : '32px');
  });

  it('read-only: dashed read-only border, value at full text contrast, still focusable', async () => {
    const { host, input, settle } = await setup();
    const normalColor = getComputedStyle(input).color;
    host.readonly.set(true);
    await settle();
    const s = getComputedStyle(input);
    expect(input.readOnly).toBe(true);
    expect(s.borderTopStyle).toBe('dashed');
    expect(s.color).toBe(normalColor);
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('disabled: dashed disabled border and disabled fill', async () => {
    const { host, input, settle } = await setup();
    const fill = getComputedStyle(input).backgroundColor;
    host.disabled.set(true);
    await settle();
    expect(input.disabled).toBe(true);
    expect(getComputedStyle(input).borderTopStyle).toBe('dashed');
    expect(getComputedStyle(input).backgroundColor).not.toBe(fill);
  });

  it('invalid: 2px error border (thickness is the non-colour cue) and aria-invalid', async () => {
    const { host, input, settle } = await setup();
    expect(getComputedStyle(input).borderTopWidth).toBe('1px');
    host.invalid.set(true);
    await settle();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(getComputedStyle(input).borderTopWidth).toBe('2px');
  });

  it('shows the placeholder only as an example, never as the name', async () => {
    const { input } = await setup();
    expect(input.placeholder).toBe('B-0000');
    await expect.element(page.getByRole('textbox', { name: 'Batch code' })).toBeInTheDocument();
    expect(page.getByRole('textbox', { name: 'B-0000' }).elements()).toHaveLength(0);
  });

  it('works outside a field with its own accessible name and an auto id', async () => {
    const { el } = await setup();
    const input = el.querySelector('input[type="search"]') as HTMLInputElement;
    await expect.element(page.getByRole('searchbox', { name: 'Search records' })).toBe(input);
    expect(input.id).toBe('standalone');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('shrinks to the container at narrow widths (fluid, no overflow)', async () => {
    const { el, input } = await setup();
    const form = el.querySelector('#native') as HTMLElement;
    form.style.inlineSize = '10rem';
    expect(input.getBoundingClientRect().width).toBeLessThanOrEqual(160);
  });
});
