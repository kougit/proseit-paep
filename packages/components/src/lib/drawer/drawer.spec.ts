import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepDialogClose, PaepDialogFooter } from '../dialog/dialog';
import { PaepDrawer, PaepDrawerSide, PaepDrawerSize } from './drawer';

@Component({
  imports: [PaepDrawer, PaepDialogFooter, PaepDialogClose],
  template: `
    <div [attr.dir]="dir()">
      <button type="button" id="invoker" (click)="open.set(true)">Show details</button>
      <paep-drawer
        [(open)]="open"
        heading="Record 1 details"
        [side]="side()"
        [size]="size()"
        [busy]="busy()"
        (cancelled)="cancels = cancels + 1"
        (closed)="closes = closes + 1"
      >
        @if (form()) {
          <label for="depot">Depot</label>
          <input id="depot" value="North depot" />
        }
        @for (p of paragraphs; track p) {
          <p>Detail line {{ p }} for Record 1.</p>
        }
        <paep-dialog-footer>
          <button type="button" id="cancel" paepDialogClose>Cancel</button>
          <button type="button" id="save">Save changes</button>
        </paep-dialog-footer>
      </paep-drawer>
    </div>
  `,
})
class DrawerHost {
  readonly open = signal(false);
  readonly side = signal<PaepDrawerSide>('end');
  readonly size = signal<PaepDrawerSize>('md');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly busy = signal(false);
  readonly form = signal(false);
  readonly paragraphs = Array.from({ length: 60 }, (_, i) => i + 1);
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

describe('PaepDrawer', () => {
  let fixture: ComponentFixture<DrawerHost>;
  let host: DrawerHost;
  const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;
  const dialog = () => q<HTMLDialogElement>('dialog');

  beforeEach(async () => {
    await page.viewport(1280, 800);
    fixture = TestBed.createComponent(DrawerHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(async () => {
    fixture.destroy();
    await page.viewport(414, 896);
  });

  async function openFromInvoker() {
    await userEvent.click(q('#invoker'));
    await settle(fixture);
  }

  it('opens as a modal dialog named by its title and focuses the title', async () => {
    await openFromInvoker();
    const d = dialog();
    expect(d.matches(':modal')).toBe(true);
    const title = document.getElementById(d.getAttribute('aria-labelledby')!)!;
    expect(title.textContent).toBe('Record 1 details');
    expect(title.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(title);
    expect(d.querySelector('.paep-modal__close')!.getAttribute('aria-label')).toBe('Close');
  });

  it('focuses the first field on entry when the drawer holds a form', async () => {
    host.form.set(true);
    await openFromInvoker();
    expect(document.activeElement).toBe(q('#depot'));
  });

  it('contains Tab, closes on Escape and returns focus to the invoker', async () => {
    await openFromInvoker();
    const d = dialog();
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(d.contains(document.activeElement) || document.activeElement === document.body).toBe(true);
    }
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(d.open).toBe(false);
    expect(host.open()).toBe(false);
    expect(host.cancels).toBe(1);
    expect(host.closes).toBe(1);
    expect(document.activeElement).toBe(q('#invoker'));
  });

  it('ignores Escape and Cancel while busy', async () => {
    await openFromInvoker();
    host.busy.set(true);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(q('#cancel'));
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(host.cancels).toBe(0);
  });

  it('closes from a paepDialogClose control', async () => {
    await openFromInvoker();
    await userEvent.click(q('#cancel'));
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(q('#invoker'));
  });

  it('attaches to the inline-end edge at full height, 30 rem wide, with a scrolling body', async () => {
    await openFromInvoker();
    const rect = dialog().getBoundingClientRect();
    expect(Math.round(rect.right)).toBe(1280);
    expect(Math.round(rect.width)).toBe(480);
    expect(Math.round(rect.top)).toBe(0);
    expect(Math.round(rect.height)).toBe(800);
    const body = q('.paep-modal__body');
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(q('.paep-modal__foot').getBoundingClientRect().bottom).toBeLessThanOrEqual(801);
  });

  it('mirrors to the left edge in RTL and supports the start side', async () => {
    host.dir.set('rtl');
    await openFromInvoker();
    expect(Math.round(dialog().getBoundingClientRect().left)).toBe(0);
    host.open.set(false);
    host.dir.set('ltr');
    host.side.set('start');
    await settle(fixture);
    host.open.set(true);
    await settle(fixture);
    expect(Math.round(dialog().getBoundingClientRect().left)).toBe(0);
  });

  it('uses 40 rem for lg and leaves a context strip on tablets', async () => {
    host.size.set('lg');
    await openFromInvoker();
    expect(Math.round(dialog().getBoundingClientRect().width)).toBe(640);
    await page.viewport(640, 800);
    await settle(fixture);
    expect(Math.round(dialog().getBoundingClientRect().width)).toBe(640 - 48);
  });

  it('is full width below 600 px with stacked footer actions', async () => {
    await page.viewport(375, 700);
    await openFromInvoker();
    const rect = dialog().getBoundingClientRect();
    expect(Math.round(rect.width)).toBe(375);
    expect(Math.round(rect.height)).toBe(700);
    const cancel = q('#cancel').getBoundingClientRect();
    const save = q('#save').getBoundingClientRect();
    expect(cancel.top).toBeLessThan(save.top);
    expect(Math.round(cancel.width)).toBe(Math.round(save.width));
  });
});
