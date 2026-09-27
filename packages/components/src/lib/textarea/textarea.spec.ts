import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { page, userEvent } from 'vitest/browser';
import { PaepField } from '../field/field';
import { PaepInput } from '../input/input';

/** The IR-01 Textarea is delivered by PaepInput on a native <textarea> (component-specs: textarea[paepInput]). */
@Component({
  imports: [PaepInput, PaepField, ReactiveFormsModule],
  template: `
    <form (submit)="onSubmit($event)">
      <paep-field label="Reason for change" help="Up to 500 characters." [error]="error()" [dirty]="notes.dirty">
        <textarea paepInput name="reason" dir="auto" [formControl]="notes" [readOnly]="readonly()"></textarea>
      </paep-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
class TextareaHost {
  readonly error = signal<string | null>(null);
  readonly readonly = signal(false);
  readonly notes = new FormControl('', { nonNullable: true });
  submitted: FormData | null = null;
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.target as HTMLFormElement);
  }
}

async function setup() {
  const fixture = TestBed.createComponent(TextareaHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const textarea = el.querySelector('textarea') as HTMLTextAreaElement;
  textarea.style.transition = 'none';
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, host: fixture.componentInstance, textarea, settle };
}

describe('Textarea (textarea[paepInput])', () => {
  it('is a native multi-line textbox labelled and described by its field', async () => {
    const { textarea } = await setup();
    await expect.element(page.getByRole('textbox', { name: 'Reason for change' })).toBe(textarea);
    await expect.element(page.getByRole('textbox', { name: 'Reason for change' })).toHaveAccessibleDescription('Up to 500 characters.');
    expect(textarea.classList).toContain('paep-input');
  });

  it('has a 5.5rem minimum height in both densities and resizes vertically only', async () => {
    const { el, textarea, settle } = await setup();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(getComputedStyle(textarea).minHeight).toBe(`${5.5 * rem}px`);
    expect(getComputedStyle(textarea).resize).toBe('vertical');
    el.setAttribute('data-paep-density', 'compact');
    await settle();
    expect(getComputedStyle(textarea).minHeight).toBe(`${5.5 * rem}px`);
  });

  it('Enter inserts a new line; Tab leaves the textarea', async () => {
    const { el, textarea } = await setup();
    await userEvent.click(textarea);
    await userEvent.keyboard('First line{Enter}Second line');
    expect(textarea.value).toBe('First line\nSecond line');
    await userEvent.tab();
    expect(document.activeElement).toBe(el.querySelector('button'));
  });

  it('works with reactive forms, marks the field dirty and submits natively', async () => {
    const { el, host, textarea, settle } = await setup();
    await userEvent.type(textarea, 'Stock count corrected');
    await settle();
    expect(host.notes.value).toBe('Stock count corrected');
    expect(el.querySelector('.paep-field__meta')?.textContent?.trim()).toBe('Unsaved change');
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(host.submitted?.get('reason')).toBe('Stock count corrected');
  });

  it('invalid: 2px error border, aria-invalid and error described before help', async () => {
    const { host, textarea, settle } = await setup();
    host.error.set('Enter a reason.');
    await settle();
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(getComputedStyle(textarea).borderTopWidth).toBe('2px');
    await expect.element(page.getByRole('textbox', { name: 'Reason for change' })).toHaveAccessibleDescription('Enter a reason. Up to 500 characters.');
  });

  it('read-only: dashed read-only border, text fully visible and focusable', async () => {
    const { host, textarea, settle } = await setup();
    host.notes.setValue('Approved by the site lead.');
    host.readonly.set(true);
    await settle();
    expect(textarea.readOnly).toBe(true);
    expect(getComputedStyle(textarea).borderTopStyle).toBe('dashed');
    textarea.focus();
    expect(document.activeElement).toBe(textarea);
  });

  it('disabled: dashed disabled border (reactive disable)', async () => {
    const { host, textarea, settle } = await setup();
    host.notes.disable();
    await settle();
    expect(textarea.disabled).toBe(true);
    expect(getComputedStyle(textarea).borderTopStyle).toBe('dashed');
  });

  it('long content scrolls vertically inside the control and wraps', async () => {
    const { textarea } = await setup();
    textarea.value = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
    expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth + 1);
  });
});
