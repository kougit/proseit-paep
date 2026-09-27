import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepDialog, PaepDialogClose, PaepDialogFooter, PaepDialogSize } from './dialog';

@Component({
  imports: [PaepDialog, PaepDialogFooter, PaepDialogClose],
  template: `
    <button type="button" id="invoker" (click)="open.set(true)">Delete Record 1</button>
    @if (showInvoker2()) {
      <button type="button" id="invoker2" (click)="open.set(true)">Open again</button>
    }
    <h2 id="region-heading" tabindex="-1">Records</h2>
    <paep-dialog
      [(open)]="open"
      heading="Delete Record 1?"
      description="Record 1 will be removed. This cannot be undone."
      [size]="size()"
      [destructive]="destructive()"
      [busy]="busy()"
      [returnFocusTo]="fallback"
      (cancelled)="cancels = cancels + 1"
      (closed)="closes = closes + 1"
    >
      @if (form()) {
        <label for="name">Name</label>
        <input id="name" />
      }
      @if (long()) {
        @for (p of paragraphs; track p) {
          <p>Paragraph {{ p }} of the long terms text that makes the body taller than the viewport.</p>
        }
      }
      <paep-dialog-footer>
        <button type="button" id="cancel" paepDialogClose>Cancel</button>
        <button type="button" id="confirm">Delete record</button>
      </paep-dialog-footer>
    </paep-dialog>
  `,
})
class DialogHost {
  readonly open = signal(false);
  readonly size = signal<PaepDialogSize>('sm');
  readonly destructive = signal(true);
  readonly busy = signal(false);
  readonly form = signal(false);
  readonly long = signal(false);
  readonly showInvoker2 = signal(false);
  readonly paragraphs = Array.from({ length: 40 }, (_, i) => i + 1);
  fallback: HTMLElement | null = null;
  cancels = 0;
  closes = 0;
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 20));
  f.detectChanges();
  await Promise.all(document.getAnimations().map((a) => a.finished));
};

describe('PaepDialog', () => {
  let fixture: ComponentFixture<DialogHost>;
  let host: DialogHost;
  const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;
  const dialog = () => q<HTMLDialogElement>('dialog');

  beforeEach(async () => {
    await page.viewport(1280, 800);
    fixture = TestBed.createComponent(DialogHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(async () => {
    fixture.destroy();
    await page.viewport(414, 896);
  });

  async function openFromInvoker(id = 'invoker') {
    const invoker = q(`#${id}`);
    invoker.focus();
    await userEvent.click(invoker);
    await settle(fixture);
  }

  it('opens as a native modal dialog named by its title and described by its message', async () => {
    expect(dialog().open).toBe(false);
    await openFromInvoker();
    const d = dialog();
    expect(d.open).toBe(true);
    expect(d.matches(':modal')).toBe(true);
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent).toBe('Delete Record 1?');
    expect(document.getElementById(d.getAttribute('aria-describedby')!)!.textContent).toContain('cannot be undone');
    const close = d.querySelector('.paep-modal__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    expect(close.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('focuses Cancel on entry for a destructive confirmation, never the destructive action', async () => {
    await openFromInvoker();
    expect(document.activeElement).toBe(q('#cancel'));
  });

  it('focuses the title (tabindex -1) on entry for an informational dialog', async () => {
    host.destructive.set(false);
    await openFromInvoker();
    const title = dialog().querySelector('h2')!;
    expect(title.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(title);
  });

  it('focuses the first form field on entry for a form dialog', async () => {
    host.form.set(true);
    await openFromInvoker();
    expect(document.activeElement).toBe(q('#name'));
  });

  it('keeps Tab and Shift+Tab inside the modal dialog', async () => {
    await openFromInvoker();
    const d = dialog();
    const visited = new Set<Element | null>();
    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      visited.add(document.activeElement);
      expect(d.contains(document.activeElement) || document.activeElement === document.body).toBe(true);
      expect(q('#invoker')).not.toBe(document.activeElement);
    }
    for (let i = 0; i < 8; i++) {
      await userEvent.tab({ shift: true });
      expect(d.contains(document.activeElement) || document.activeElement === document.body).toBe(true);
    }
    expect(visited.has(q('#confirm'))).toBe(true);
    expect(visited.has(d.querySelector('.paep-modal__close'))).toBe(true);
  });

  it('cancels on Escape, emits cancelled and closed, and returns focus to the invoker', async () => {
    await openFromInvoker();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(host.open()).toBe(false);
    expect(host.cancels).toBe(1);
    expect(host.closes).toBe(1);
    expect(document.activeElement).toBe(q('#invoker'));
  });

  it('suppresses Escape and the close button while busy', async () => {
    await openFromInvoker();
    host.busy.set(true);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog().open).toBe(true);
    const close = dialog().querySelector('.paep-modal__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(close, { force: true });
    await userEvent.click(q('#cancel'));
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(host.cancels).toBe(0);
    host.busy.set(false);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog().open).toBe(false);
  });

  it('closes from the close button and from a paepDialogClose control, restoring focus', async () => {
    await openFromInvoker();
    await userEvent.click(dialog().querySelector('.paep-modal__close')!);
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(q('#invoker'));
    await openFromInvoker();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(host.cancels).toBe(2);
    expect(host.closes).toBe(2);
    expect(document.activeElement).toBe(q('#invoker'));
  });

  it('closes when the consumer sets open to false', async () => {
    await openFromInvoker();
    host.open.set(false);
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(host.closes).toBe(1);
    expect(host.cancels).toBe(0);
    expect(document.activeElement).toBe(q('#invoker'));
  });

  it('returns focus to returnFocusTo when the invoker no longer exists', async () => {
    host.showInvoker2.set(true);
    host.fallback = q('#region-heading');
    fixture.detectChanges();
    await settle(fixture);
    await openFromInvoker('invoker2');
    host.showInvoker2.set(false);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(document.activeElement).toBe(q('#region-heading'));
  });

  it('sizes sm 25 rem, md 35 rem and lg 50 rem on wide screens', async () => {
    const widths: Record<PaepDialogSize, number> = { sm: 400, md: 560, lg: 800 };
    for (const size of ['sm', 'md', 'lg'] as const) {
      host.size.set(size);
      host.open.set(true);
      await settle(fixture);
      expect(Math.round(dialog().getBoundingClientRect().width)).toBe(widths[size]);
      host.open.set(false);
      await settle(fixture);
    }
  });

  it('scrolls long content inside the body while the header and footer stay in view', async () => {
    host.long.set(true);
    host.destructive.set(false);
    await openFromInvoker();
    const d = dialog();
    const body = d.querySelector('.paep-modal__body') as HTMLElement;
    const rect = d.getBoundingClientRect();
    expect(rect.height).toBeLessThanOrEqual(800 - 48 + 1);
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(d.classList.contains('paep-modal--scrolled')).toBe(false);
    body.scrollTop = 200;
    body.dispatchEvent(new Event('scroll'));
    await settle(fixture);
    expect(d.classList.contains('paep-modal--scrolled')).toBe(true);
    const head = d.querySelector('.paep-modal__head')!.getBoundingClientRect();
    const foot = d.querySelector('.paep-modal__foot')!.getBoundingClientRect();
    expect(head.top).toBeGreaterThanOrEqual(rect.top);
    expect(foot.bottom).toBeLessThanOrEqual(rect.bottom + 1);
  });

  it('insets 16 px and stacks the footer actions in DOM order below 600 px; lg becomes full screen', async () => {
    await page.viewport(375, 700);
    await openFromInvoker();
    const d = dialog();
    const rect = d.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(16);
    expect(Math.round(rect.width)).toBe(375 - 32);
    const cancel = q('#cancel').getBoundingClientRect();
    const confirm = q('#confirm').getBoundingClientRect();
    expect(cancel.top).toBeLessThan(confirm.top);
    expect(Math.round(cancel.width)).toBe(Math.round(confirm.width));
    expect(Math.round(confirm.width)).toBe(Math.round(d.querySelector('paep-dialog-footer')!.getBoundingClientRect().width));
    host.open.set(false);
    host.size.set('lg');
    await settle(fixture);
    host.open.set(true);
    await settle(fixture);
    const full = dialog().getBoundingClientRect();
    expect(Math.round(full.width)).toBe(375);
    expect(Math.round(full.height)).toBe(700);
  });

  it('closes the native dialog if the component is destroyed while open', async () => {
    await openFromInvoker();
    const d = dialog();
    fixture.destroy();
    expect(d.open).toBe(false);
    fixture = TestBed.createComponent(DialogHost);
  });
});
