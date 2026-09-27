import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepButton } from '../button/button';
import { PaepActionGroup, PaepActionGroupVariant } from './action-group';

@Component({
  imports: [PaepActionGroup, PaepButton],
  template: `
    <div [style.inline-size]="width()">
      <paep-action-group label="Record actions" [variant]="variant()">
        @if (destructiveFirst()) {
          <button paepButton variant="destructive" (click)="log.push('discard')">Discard draft</button>
        }
        <button paepButton (click)="log.push('edit')">Edit</button>
        <button paepButton [disabled]="true" (click)="log.push('duplicate')">Duplicate</button>
        <button paepButton variant="tertiary" (click)="log.push('export')">Export</button>
        <button paepButton variant="destructive" icon="delete" (click)="log.push('delete')">Delete record</button>
        <button paepButton variant="primary" (click)="log.push('save')">Save changes</button>
      </paep-action-group>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class GroupHost {
  readonly width = signal('60rem');
  readonly variant = signal<PaepActionGroupVariant>('toolbar');
  readonly destructiveFirst = signal(false);
  readonly log: string[] = [];
}

async function setup(width = '60rem', variant: PaepActionGroupVariant = 'toolbar', destructiveFirst = false) {
  const fixture = TestBed.createComponent(GroupHost);
  fixture.componentInstance.destructiveFirst.set(destructiveFirst);
  fixture.componentInstance.width.set(width);
  fixture.componentInstance.variant.set(variant);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const q = <T extends Element>(s: string) => el.querySelector(s) as T;
  const byText = (text: string) => [...el.querySelectorAll<HTMLButtonElement>('paep-action-group button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
  const more = () => q<HTMLButtonElement>('.paep-action-group__more');
  const menu = () => q<HTMLElement>('[role="menu"]');
  const items = () => [...el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
  const visible = (b: HTMLElement) => getComputedStyle(b).display !== 'none';
  return { fixture, el, host: fixture.componentInstance, byText, more, menu, items, visible };
}

describe('PaepActionGroup', () => {
  it('is a named group; at wide widths every action is visible and More is not shown', async () => {
    const { el, byText, more, visible } = await setup();
    await expect.element(page.getByRole('group', { name: 'Record actions' })).toBeInTheDocument();
    const group = el.querySelector('paep-action-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    for (const t of ['Edit', 'Duplicate', 'Export', 'Delete record', 'Save changes']) expect(visible(byText(t))).toBe(true);
    expect(visible(more())).toBe(false);
  });

  it('places the primary at the inline-end and separates the destructive action (LTR and RTL)', async () => {
    const { el, byText, fixture } = await setup();
    const sep = el.querySelector('.paep-action-group__sep') as HTMLElement;
    expect(sep.getAttribute('aria-hidden')).toBe('true');
    const x = (t: string) => byText(t).getBoundingClientRect().left;
    expect(x('Save changes')).toBeGreaterThan(x('Delete record'));
    expect(x('Delete record')).toBeGreaterThan(sep.getBoundingClientRect().left);
    expect(sep.getBoundingClientRect().left).toBeGreaterThan(x('Export'));
    el.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    expect(x('Save changes')).toBeLessThan(x('Delete record'));
  });

  it('below 30rem: the primary stays visible and stretches; the other actions move to "More"', async () => {
    const { byText, more, visible } = await setup('20rem');
    expect(visible(byText('Save changes'))).toBe(true);
    for (const t of ['Edit', 'Duplicate', 'Export', 'Delete record']) expect(visible(byText(t))).toBe(false);
    expect(visible(more())).toBe(true);
    expect(more().getAttribute('aria-haspopup')).toBe('menu');
    expect(more().getAttribute('aria-expanded')).toBe('false');
    expect(more().textContent?.trim()).toBe('More');
    await expect.element(page.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    const primary = byText('Save changes').getBoundingClientRect();
    expect(primary.width).toBeGreaterThan(more().getBoundingClientRect().width * 2);
    expect(more().getBoundingClientRect().left).toBeGreaterThan(primary.left);
  });

  it('ArrowDown opens the menu on the first item; items keep order with the destructive one last after a divider', async () => {
    const { more, menu, items } = await setup('20rem');
    more().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(menu().matches(':popover-open')).toBe(true);
    expect(more().getAttribute('aria-expanded')).toBe('true');
    expect(more().getAttribute('aria-controls')).toBe(menu().id);
    expect(menu().getAttribute('aria-label')).toBe('More actions');
    expect(items().map((i) => i.textContent?.trim())).toEqual(['Edit', 'Duplicate', 'Export', 'Delete record']);
    expect(document.activeElement).toBe(items()[0]);
    const divider = menu().querySelector('hr') as HTMLElement;
    expect(divider.nextElementSibling).toBe(items()[3]);
    expect(items()[1].getAttribute('aria-disabled')).toBe('true');
    expect(items().every((i) => i.tabIndex === -1)).toBe(true);
    expect(items()[3].querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(items()[0].querySelector('svg')).toBeNull();
  });

  it('moves destructive actions after the others in the menu even when they come first in the markup', async () => {
    const { more, menu, items } = await setup('20rem', 'toolbar', true);
    more().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items().map((i) => i.textContent?.trim())).toEqual(['Edit', 'Duplicate', 'Export', 'Discard draft', 'Delete record']);
    expect((menu().querySelector('hr') as HTMLElement).nextElementSibling).toBe(items()[3]);
  });

  it('moves with ArrowDown/ArrowUp (wrapping), Home and End', async () => {
    const { more, items } = await setup('20rem');
    more().focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items()[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items()[3]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items()[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items()[3]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('ArrowUp on More opens the menu on the last item; Escape closes it and returns focus to More', async () => {
    const { more, menu, items } = await setup('20rem');
    more().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items()[3]);
    await userEvent.keyboard('{Escape}');
    expect(menu().matches(':popover-open')).toBe(false);
    expect(more().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(more());
  });

  it('Enter on More opens the menu; Enter on an item runs the original action and returns focus to More', async () => {
    const { host, more, menu, items } = await setup('20rem');
    more().focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(items()[0]);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(host.log).toEqual(['export']);
    expect(menu().matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(more());
  });

  it('a disabled item is announced as disabled and does not run', async () => {
    const { host, more, menu, items } = await setup('20rem');
    await userEvent.click(more());
    items()[1].click();
    expect(host.log).toEqual([]);
    expect(menu().matches(':popover-open')).toBe(true);
    items()[3].click();
    expect(host.log).toEqual(['delete']);
  });

  it('Tab closes the menu and continues past the group', async () => {
    const { el, more, menu } = await setup('20rem');
    more().focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.tab();
    expect(menu().matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(el.querySelector('#after'));
  });

  it('a pointer press outside closes the menu (no hover needed anywhere)', async () => {
    const { el, more, menu } = await setup('20rem');
    await userEvent.click(more());
    expect(menu().matches(':popover-open')).toBe(true);
    await userEvent.click(el.querySelector('#after') as HTMLElement);
    expect(menu().matches(':popover-open')).toBe(false);
    await userEvent.click(more());
    expect(menu().matches(':popover-open')).toBe(true);
    await userEvent.click(more());
    expect(menu().matches(':popover-open')).toBe(false);
  });

  it('positions the menu below More and inside the viewport', async () => {
    const { more, menu } = await setup('20rem');
    await userEvent.click(more());
    const m = menu().getBoundingClientRect();
    const b = more().getBoundingClientRect();
    expect(m.top).toBeGreaterThanOrEqual(b.bottom);
    expect(m.left).toBeGreaterThanOrEqual(0);
    expect(m.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  });

  it('footer variant stacks every action full width in DOM order below 30rem, without a More menu', async () => {
    const { byText, more, visible } = await setup('20rem', 'footer');
    expect(more()).toBeNull();
    const rects = ['Edit', 'Export', 'Delete record', 'Save changes'].map((t) => byText(t).getBoundingClientRect());
    for (const t of ['Edit', 'Export', 'Delete record', 'Save changes']) expect(visible(byText(t))).toBe(true);
    for (let i = 1; i < rects.length; i++) expect(rects[i].top).toBeGreaterThan(rects[i - 1].top);
    expect(Math.round(rects[0].width)).toBe(Math.round(rects[3].width));
  });
});
