import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { page, userEvent } from 'vitest/browser';
import { PaepField } from '../field/field';
import { PaepSelect } from './select';

@Component({
  imports: [PaepSelect, PaepField, ReactiveFormsModule, FormsModule],
  template: `
    <form (submit)="onSubmit($event)" ngNoForm>
      <paep-field label="Region" [error]="error()">
        <select paepSelect name="region" [disabled]="disabled()">
          <option value="">Choose a region</option>
          @for (r of regions; track r) {
            <option [value]="r">{{ r }}</option>
          }
        </select>
      </paep-field>
      <button type="submit">Submit</button>
    </form>
    <paep-field label="Priority"><select paepSelect [formControl]="priority" id="reactive"><option value="low">Low</option><option value="high">High</option></select></paep-field>
    <paep-field label="Site"><select paepSelect [(ngModel)]="site" id="template"><option value="Site 1">Site 1</option><option value="Site 2">Site 2</option></select></paep-field>
  `,
})
class SelectHost {
  readonly regions = ['North', 'Central', 'South', 'An exceptionally long region name that cannot fit in the closed control'];
  readonly error = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly priority = new FormControl('low', { nonNullable: true });
  site = 'Site 2';
  submitted: FormData | null = null;
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.target as HTMLFormElement);
  }
}

async function setup() {
  const fixture = TestBed.createComponent(SelectHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const select = el.querySelector('select[name="region"]') as HTMLSelectElement;
  select.style.transition = 'none';
  return { fixture, el, host: fixture.componentInstance, select, settle };
}

describe('PaepSelect', () => {
  it('is a native single select (combobox) named by the field label, with the first "Choose…" option', async () => {
    const { select } = await setup();
    await expect.element(page.getByRole('combobox', { name: 'Region' })).toBe(select);
    expect(select.multiple).toBe(false);
    expect(select.options[0].textContent).toBe('Choose a region');
    expect(select.options).toHaveLength(5);
  });

  it('uses appearance none with a decorative chevron at the inline-end and reserves space for it', async () => {
    const { select } = await setup();
    const s = getComputedStyle(select);
    expect(s.appearance).toBe('none');
    expect(s.backgroundImage).toContain('linear-gradient');
    expect(parseFloat(s.paddingRight)).toBeGreaterThan(parseFloat(s.paddingLeft));
    expect(s.backgroundPositionX).toContain('100%');
  });

  it('moves the chevron to the inline-end (left) in RTL', async () => {
    const { el, select, settle } = await setup();
    el.setAttribute('dir', 'rtl');
    await settle();
    const s = getComputedStyle(select);
    expect(parseFloat(s.paddingLeft)).toBeGreaterThan(parseFloat(s.paddingRight));
    expect(s.backgroundPositionX).not.toContain('100%');
  });

  it('changes value with the keyboard natively and submits with a native form', async () => {
    const { el, host, select } = await setup();
    await userEvent.selectOptions(select, 'Central');
    expect(select.value).toBe('Central');
    select.focus();
    await userEvent.keyboard('{ArrowDown}');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    expect(host.submitted?.get('region')).toBe(select.value);
  });

  it('works with reactive forms and ngModel', async () => {
    const { el, host, settle } = await setup();
    const reactive = el.querySelector('#reactive') as HTMLSelectElement;
    await userEvent.selectOptions(reactive, 'high');
    expect(host.priority.value).toBe('high');
    host.priority.setValue('low');
    await settle();
    expect(reactive.value).toBe('low');
    const template = el.querySelector('#template') as HTMLSelectElement;
    await settle();
    expect(template.value).toBe('Site 2');
    await userEvent.selectOptions(template, 'Site 1');
    expect(host.site).toBe('Site 1');
  });

  it('invalid via the field: 2px error border, aria-invalid, error described', async () => {
    const { host, select, settle } = await setup();
    host.error.set('Choose a region.');
    await settle();
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(getComputedStyle(select).borderTopWidth).toBe('2px');
    await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveAccessibleDescription('Choose a region.');
  });

  it('disabled: native disabled with a dashed border', async () => {
    const { host, select, settle } = await setup();
    host.disabled.set(true);
    await settle();
    expect(select.disabled).toBe(true);
    expect(getComputedStyle(select).borderTopStyle).toBe('dashed');
  });

  it('truncates a long selected option only in the closed control (the option keeps its full text)', async () => {
    const { select, el } = await setup();
    (el.querySelector('form') as HTMLElement).style.inlineSize = '12rem';
    select.selectedIndex = 4;
    const s = getComputedStyle(select);
    expect(s.textOverflow).toBe('ellipsis');
    expect(s.whiteSpace).toBe('nowrap');
    expect(select.getBoundingClientRect().width).toBeLessThanOrEqual(192);
    expect(select.options[4].text).toContain('cannot fit in the closed control');
  });
});
