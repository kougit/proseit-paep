import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { page, userEvent } from 'vitest/browser';
import { PaepRadio, PaepRadioGroup } from './radio';

@Component({
  imports: [PaepRadioGroup, PaepRadio, FormsModule, ReactiveFormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <form (submit)="onSubmit($event)" ngNoForm>
      <paep-radio-group
        id="main"
        legend="Delivery method"
        [help]="help()"
        [error]="error()"
        [required]="required()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [orientation]="orientation()"
      >
        <label><input type="radio" paepRadio name="delivery" value="standard" /> Standard</label>
        <label><input type="radio" paepRadio name="delivery" value="express" [checked]="preselect()" /> Express</label>
        <label><input type="radio" paepRadio name="delivery" value="collect" /> Collect from North depot</label>
      </paep-radio-group>
      <button type="submit" id="after">Submit</button>
    </form>
    <paep-radio-group legend="Priority" id="reactive">
      <label><input type="radio" paepRadio name="priority" value="low" [formControl]="priority" /> Low</label>
      <label><input type="radio" paepRadio name="priority" value="high" [formControl]="priority" /> High</label>
    </paep-radio-group>
    <paep-radio-group legend="Site" id="template">
      <label><input type="radio" paepRadio name="site" value="Site 1" [(ngModel)]="site" /> Site 1</label>
      <label><input type="radio" paepRadio name="site" value="Site 2" [(ngModel)]="site" /> Site 2</label>
    </paep-radio-group>
  `,
})
class RadioHost {
  readonly help = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly preselect = signal(false);
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly priority = new FormControl('low', { nonNullable: true });
  site = 'Site 2';
  submitted: FormData | null = null;
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.target as HTMLFormElement);
  }
}

async function setup(preselect = false) {
  const fixture = TestBed.createComponent(RadioHost);
  fixture.componentInstance.preselect.set(preselect);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const main = el.querySelector('#main') as HTMLElement;
  const radios = [...main.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  radios.forEach((r) => (r.style.transition = 'none'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, host: fixture.componentInstance, main, fieldset: main.querySelector('fieldset') as HTMLFieldSetElement, radios, settle };
}

describe('PaepRadioGroup + PaepRadio', () => {
  it('is a fieldset named by its legend with native radios named by their labels', async () => {
    const { fieldset, radios } = await setup();
    expect(fieldset.querySelector('legend')?.textContent?.trim()).toBe('Delivery method');
    await expect.element(page.getByRole('radiogroup', { name: 'Delivery method' })).toBe(fieldset);
    await expect.element(page.getByRole('radio', { name: 'Express' })).toBe(radios[1]);
    expect(radios.every((r) => r.name === 'delivery')).toBe(true);
  });

  it('Tab enters at the first option when none is selected; arrows move and select; Tab leaves', async () => {
    const { el, radios } = await setup();
    (el.querySelector('#before') as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(radios[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1].checked).toBe(true);
    await userEvent.keyboard('{ArrowUp}');
    expect(radios[0].checked).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(el.querySelector('#after'));
  });

  it('Tab enters at the selected option', async () => {
    const { el, radios } = await setup(true);
    (el.querySelector('#before') as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(radios[1]);
  });

  it('selected shows a 2px ring and an inner dot (shape cue)', async () => {
    const { radios } = await setup(true);
    const s = getComputedStyle(radios[1]);
    expect(s.borderTopWidth).toBe('2px');
    expect(parseFloat(getComputedStyle(radios[1], '::after').width)).toBeGreaterThan(0);
    expect(getComputedStyle(radios[0]).borderTopWidth).toBe('1px');
  });

  it('help and group error are described on the fieldset (error first); options get aria-invalid and a 2px error border', async () => {
    const { host, fieldset, main, radios, settle } = await setup();
    host.help.set('Choose how the order leaves the depot.');
    host.error.set('Choose a delivery method.');
    await settle();
    const error = main.querySelector('.paep-radio-group__error') as HTMLElement;
    const help = main.querySelector('.paep-radio-group__help') as HTMLElement;
    expect(fieldset.getAttribute('aria-describedby')).toBe(`${error.id} ${help.id}`);
    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(error.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(error.textContent?.trim()).toBe('Choose a delivery method.');
    for (const r of radios) {
      expect(r.getAttribute('aria-invalid')).toBe('true');
      expect(getComputedStyle(r).borderTopWidth).toBe('2px');
    }
    await expect.element(page.getByRole('radiogroup', { name: 'Delivery method' })).toHaveAccessibleDescription(
      'Choose a delivery method. Choose how the order leaves the depot.',
    );
    host.error.set(null);
    await settle();
    expect(radios[0].hasAttribute('aria-invalid')).toBe(false);
  });

  it('required: visual asterisk (aria-hidden) and aria-required on the group', async () => {
    const { host, fieldset, settle } = await setup();
    host.required.set(true);
    await settle();
    expect(fieldset.getAttribute('aria-required')).toBe('true');
    expect(fieldset.querySelector('legend [aria-hidden="true"]')?.textContent?.trim()).toBe('*');
  });

  it('disabled group: every option natively disabled (fieldset disabled) with a dashed border', async () => {
    const { host, radios, settle } = await setup();
    host.disabled.set(true);
    await settle();
    for (const r of radios) {
      expect(r.matches(':disabled')).toBe(true);
      expect(getComputedStyle(r).borderTopStyle).toBe('dashed');
    }
  });

  it('read-only: selection cannot change by click or arrow keys, focus still works and the value submits', async () => {
    const { host, fieldset, radios, settle } = await setup(true);
    host.readonly.set(true);
    await settle();
    expect(fieldset.getAttribute('aria-readonly')).toBe('true');
    expect(getComputedStyle(radios[0]).borderTopStyle).toBe('dashed');
    await userEvent.click(radios[2]);
    expect(radios[1].checked).toBe(true);
    radios[1].focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(radios[1].checked).toBe(true);
    expect(radios[2].checked).toBe(false);
    (document.querySelector('#after') as HTMLButtonElement).click();
    expect(host.submitted?.get('delivery')).toBe('express');
  });

  it('works with a native form, reactive forms and ngModel', async () => {
    const { el, host, radios, settle } = await setup();
    await userEvent.click(radios[2]);
    (el.querySelector('#after') as HTMLButtonElement).click();
    expect(host.submitted?.get('delivery')).toBe('collect');
    const reactive = [...el.querySelectorAll<HTMLInputElement>('#reactive input')];
    await settle();
    expect(reactive[0].checked).toBe(true);
    await userEvent.click(reactive[1]);
    expect(host.priority.value).toBe('high');
    const template = [...el.querySelectorAll<HTMLInputElement>('#template input')];
    await settle();
    expect(template[1].checked).toBe(true);
    await userEvent.click(template[0]);
    expect(host.site).toBe('Site 1');
  });

  it('horizontal options sit in a row and wrap to vertical when the container is narrow', async () => {
    const { host, main, radios, settle } = await setup();
    host.orientation.set('horizontal');
    await settle();
    const top = (i: number) => radios[i].getBoundingClientRect().top;
    expect(top(0)).toBe(top(1));
    main.style.inlineSize = '8rem';
    await settle();
    expect(top(1)).toBeGreaterThan(top(0));
  });

  it('keeps the circle at the inline-start in RTL', async () => {
    const { el, radios, settle } = await setup();
    el.setAttribute('dir', 'rtl');
    await settle();
    const label = radios[0].closest('label') as HTMLElement;
    expect(radios[0].getBoundingClientRect().right).toBeGreaterThan(label.getBoundingClientRect().right - 20);
  });
});
