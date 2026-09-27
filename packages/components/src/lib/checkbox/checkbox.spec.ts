import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { page, userEvent } from 'vitest/browser';
import { PaepCheckbox } from './checkbox';

@Component({
  imports: [PaepCheckbox, FormsModule, ReactiveFormsModule],
  template: `
    <form (submit)="onSubmit($event)" ngNoForm>
      <label id="l-main"><input type="checkbox" paepCheckbox name="notify" value="yes" [(indeterminate)]="mixed" [readonly]="readonly()" [invalid]="invalid()" [disabled]="disabled()" [checked]="checked()" /> Notify the site lead</label>
      <button type="submit">Submit</button>
    </form>
    <label><input type="checkbox" paepCheckbox [formControl]="terms" id="reactive" /> I accept the terms</label>
    <label><input type="checkbox" paepCheckbox [(ngModel)]="archive" id="template" /> Archive after export</label>
    <label id="l-long" style="inline-size: 12rem"><input type="checkbox" paepCheckbox /> Include every record from every site, including the archived ones from earlier periods</label>
  `,
})
class CheckboxHost {
  readonly mixed = signal(false);
  readonly readonly = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly checked = signal(false);
  readonly terms = new FormControl(false, { nonNullable: true });
  archive = true;
  submitted: FormData | null = null;
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.target as HTMLFormElement);
  }
}

async function setup() {
  const fixture = TestBed.createComponent(CheckboxHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const box = el.querySelector('input[name="notify"]') as HTMLInputElement;
  box.style.transition = 'none';
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const submit = () => {
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    return fixture.componentInstance.submitted;
  };
  return { fixture, el, host: fixture.componentInstance, box, settle, submit };
}

describe('PaepCheckbox', () => {
  it('is a native checkbox named by its wrapping label; Space and label clicks toggle it', async () => {
    const { el, box } = await setup();
    await expect.element(page.getByRole('checkbox', { name: 'Notify the site lead' })).toBe(box);
    box.focus();
    await userEvent.keyboard(' ');
    expect(box.checked).toBe(true);
    await userEvent.click(el.querySelector('#l-main') as HTMLElement);
    expect(box.checked).toBe(false);
  });

  it('checked shows a fill plus a tick glyph (shape cue, not colour alone)', async () => {
    const { box } = await setup();
    const uncheckedFill = getComputedStyle(box).backgroundColor;
    box.checked = true;
    expect(getComputedStyle(box).backgroundColor).not.toBe(uncheckedFill);
    expect(getComputedStyle(box, '::after').clipPath).toContain('polygon');
  });

  it('indeterminate uses the DOM property, reads as mixed, shows a dash and clears when toggled', async () => {
    const { host, box, settle } = await setup();
    host.mixed.set(true);
    await settle();
    expect(box.indeterminate).toBe(true);
    await expect.element(page.getByRole('checkbox', { name: 'Notify the site lead' })).toBePartiallyChecked();
    const dash = getComputedStyle(box, '::after');
    expect(dash.clipPath).toBe('none');
    expect(parseFloat(dash.height)).toBe(2);
    expect(parseFloat(dash.width)).toBeGreaterThan(0);
    await userEvent.click(box);
    expect(box.indeterminate).toBe(false);
    expect(host.mixed()).toBe(false);
  });

  it('read-only: aria-readonly, clicks and Space do not toggle, the value is still submitted', async () => {
    const { host, box, settle, submit } = await setup();
    host.checked.set(true);
    host.readonly.set(true);
    await settle();
    expect(box.getAttribute('aria-readonly')).toBe('true');
    expect(getComputedStyle(box).borderTopStyle).toBe('dashed');
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    box.focus();
    await userEvent.keyboard(' ');
    expect(box.checked).toBe(true);
    expect(document.activeElement).toBe(box);
    expect(submit()?.get('notify')).toBe('yes');
  });

  it('invalid: aria-invalid with a 2px error border', async () => {
    const { host, box, settle } = await setup();
    expect(getComputedStyle(box).borderTopWidth).toBe('1px');
    host.invalid.set(true);
    await settle();
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(getComputedStyle(box).borderTopWidth).toBe('2px');
  });

  it('disabled: native disabled, dashed border, not toggleable, and a solid disabled fill when checked', async () => {
    const { host, box, settle } = await setup();
    host.disabled.set(true);
    await settle();
    expect(box.disabled).toBe(true);
    expect(getComputedStyle(box).borderTopStyle).toBe('dashed');
    await userEvent.click(box, { force: true });
    expect(box.checked).toBe(false);
    host.checked.set(true);
    await settle();
    expect(getComputedStyle(box).borderTopStyle).toBe('solid');
  });

  it('works with reactive forms and ngModel', async () => {
    const { el, host, settle } = await setup();
    const reactive = el.querySelector('#reactive') as HTMLInputElement;
    await userEvent.click(reactive);
    expect(host.terms.value).toBe(true);
    host.terms.setValue(false);
    await settle();
    expect(reactive.checked).toBe(false);
    const template = el.querySelector('#template') as HTMLInputElement;
    await settle();
    expect(template.checked).toBe(true);
    await userEvent.click(template);
    expect(host.archive).toBe(false);
  });

  it('the label row gives a hit area of at least 24px; the box follows density (18px / 16px)', async () => {
    const { el, box, settle } = await setup();
    expect((el.querySelector('#l-main') as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(Math.round(box.getBoundingClientRect().width)).toBe(18);
    el.setAttribute('data-paep-density', 'compact');
    await settle();
    expect(Math.round(box.getBoundingClientRect().width)).toBe(16);
  });

  it('a long label wraps with the box aligned to the first line; the box sits at the inline-start in RTL', async () => {
    const { el, settle } = await setup();
    const label = el.querySelector('#l-long') as HTMLElement;
    const box = label.querySelector('input') as HTMLInputElement;
    expect(label.getBoundingClientRect().height).toBeGreaterThan(40);
    expect(box.getBoundingClientRect().top - label.getBoundingClientRect().top).toBeLessThan(8);
    el.setAttribute('dir', 'rtl');
    await settle();
    expect(box.getBoundingClientRect().right).toBeGreaterThan(label.getBoundingClientRect().right - 20);
  });
});
