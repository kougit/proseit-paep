import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { page, userEvent } from 'vitest/browser';
import type { PaepShellNotification } from '../ports/ports';
import { provideTestShell, settle, testNotifications, text } from '../testing/shell-testing';
import { PaepNotificationPanel } from './notification-panel';

@Component({ template: '<h1>Records</h1>' })
class RecordsPage {}

@Component({
  imports: [PaepNotificationPanel],
  template: '<div style="display: flex; justify-content: flex-end; padding: 8px"><paep-notification-panel /></div><button id="after">After</button>',
})
class PanelHost {}

const ITEMS: readonly PaepShellNotification[] = [
  { id: 'n1', text: '3 records need your review', time: '5 min ago', unread: true, route: '/records' },
  { id: 'n2', text: '<img src=x onerror="alert(1)"> Document DOC-2291 is ready', time: '1 h ago', unread: true },
  { id: 'n3', text: { key: 'paep.shell.notifications.title' }, time: 'yesterday', unread: false },
  { id: 'n4', text: 'Access review assigned to you', time: 'yesterday', unread: false, otherTenant: 'Site 07' },
];

describe('PaepNotificationPanel', () => {
  let fixture: ComponentFixture<PanelHost>;
  let el: HTMLElement;
  const bell = () => el.querySelector<HTMLButtonElement>('.paep-notification-panel__bell')!;
  const dialog = () => el.querySelector<HTMLElement>('[role="dialog"]')!;
  const popover = () => el.querySelector<HTMLElement>('paep-popover')!;
  const isOpen = () => popover().matches(':popover-open');

  async function create(provider: ReturnType<typeof testNotifications> | null): Promise<void> {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'records', component: RecordsPage }]), ...provideTestShell(provider ? { notifications: provider } : {})],
    });
    fixture = TestBed.createComponent(PanelHost);
    el = fixture.nativeElement;
    await settle(fixture);
  }

  async function openPanel(): Promise<void> {
    await userEvent.click(bell());
    await settle(fixture);
  }

  beforeEach(async () => {
    await page.viewport(1280, 800);
  });

  afterEach(async () => {
    fixture?.destroy();
    await page.viewport(414, 896);
  });

  it('shows nothing without a notification provider', async () => {
    await create(null);
    expect(el.querySelector('.paep-notification-panel__bell')).toBeNull();
    expect(el.querySelector('paep-popover')).toBeNull();
  });

  it('names the bell with its count: none, unread, 99+, loading and count error; unavailable shows no count', async () => {
    const provider = testNotifications({ unread: 0 });
    await create(provider);
    expect(bell().getAttribute('aria-label')).toBe('Notifications');
    expect(bell().getAttribute('aria-haspopup')).toBe('dialog');
    expect(bell().getAttribute('aria-expanded')).toBe('false');
    expect(bell().querySelector('paep-count-badge')).toBeNull();
    provider.unread.set(3);
    await settle(fixture);
    expect(bell().getAttribute('aria-label')).toBe('Notifications, 3 unread');
    provider.unread.set(120);
    await settle(fixture);
    expect(bell().getAttribute('aria-label')).toBe('Notifications, 99+ unread');
    expect(text(bell().querySelector('paep-count-badge'))).toMatch(/^99\+/);
    provider.unread.set('loading');
    await settle(fixture);
    expect(bell().getAttribute('aria-label')).toBe('Notifications, Loading count');
    provider.unread.set('unknown');
    await settle(fixture);
    expect(bell().getAttribute('aria-label')).toBe('Notifications, Count not available');
    provider.state.set('unavailable');
    await settle(fixture);
    expect(bell().getAttribute('aria-label')).toBe('Notifications');
  });

  it('opens a non-modal dialog named by its heading, focuses the heading, and Escape returns focus to the bell', async () => {
    await create(testNotifications({ unread: 2, items: ITEMS }));
    await openPanel();
    expect(isOpen()).toBe(true);
    expect(bell().getAttribute('aria-expanded')).toBe('true');
    expect(bell().getAttribute('aria-controls')).toBe(dialog().id);
    expect(dialog().getAttribute('aria-modal')).toBe('false');
    const heading = document.getElementById(dialog().getAttribute('aria-labelledby')!)!;
    expect(heading.tagName).toBe('H2');
    expect(text(heading)).toBe('Notifications');
    expect(document.activeElement).toBe(heading);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(isOpen()).toBe(false);
    expect(bell().hasAttribute('aria-controls')).toBe(false);
    expect(document.activeElement).toBe(bell());
  });

  it('Close returns focus to the bell; Tab moves through the items and actions; an outside click closes it', async () => {
    await create(testNotifications({ unread: 2, items: ITEMS }));
    await openPanel();
    await userEvent.tab();
    expect(text(document.activeElement)).toBe('Mark all as read');
    await userEvent.tab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close notifications');
    await userEvent.tab();
    expect(text(document.activeElement)).toBe('3 records need your review');
    await userEvent.click(el.querySelector<HTMLElement>('[aria-label="Close notifications"]')!);
    await settle(fixture);
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(bell());
    await openPanel();
    await userEvent.click(el.querySelector<HTMLElement>('#after')!);
    await settle(fixture);
    expect(isOpen()).toBe(false);
  });

  it('lists items as plain text (untrusted), resolves host keys, marks unread items for screen readers and shows other contexts', async () => {
    await create(testNotifications({ unread: 2, items: ITEMS }));
    await openPanel();
    const items = Array.from(dialog().querySelectorAll('li'));
    expect(items.length).toBe(4);
    expect(dialog().querySelector('img')).toBeNull();
    expect(text(items[1])).toContain('<img src=x onerror="alert(1)"> Document DOC-2291 is ready');
    expect(text(items[2])).toContain('Notifications');
    const link = items[0].querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/records');
    expect(text(items[0].querySelector('.paep-visually-hidden'))).toBe('1 unread');
    expect(items[2].querySelector('.paep-visually-hidden')).toBeNull();
    expect(items[0].querySelector('.paep-notification-panel__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(text(items[3].querySelector('paep-status-badge'))).toBe('In Site 07');
    expect(text(items[3])).toContain('yesterday');
  });

  it('"Mark all as read" sends the request and is offered only while an item is unread', async () => {
    const provider = testNotifications({ unread: 2, items: ITEMS });
    await create(provider);
    await openPanel();
    const markAll = () => Array.from(dialog().querySelectorAll('button')).find((b) => text(b) === 'Mark all as read');
    markAll()!.click();
    await settle(fixture);
    expect(provider.calls).toEqual(['markAllRead']);
    provider.items.set(ITEMS.map((i) => ({ ...i, unread: false })));
    await settle(fixture);
    expect(markAll()).toBeUndefined();
  });

  it('shows the loading, error (with Try again), stale, empty and unavailable states', async () => {
    const provider = testNotifications({ state: 'loading' });
    await create(provider);
    await openPanel();
    expect(text(dialog().querySelector('[role="status"]'))).toBe('Loading notifications…');
    provider.state.set('error');
    await settle(fixture);
    const alert = dialog().querySelector('[role="alert"]')!;
    expect(text(alert)).toContain('Notifications could not be loaded.');
    Array.from(alert.querySelectorAll('button')).find((b) => text(b) === 'Try again')!.click();
    expect(provider.calls).toEqual(['reload']);
    provider.state.set('stale');
    provider.staleSince.set('09:40');
    provider.items.set(ITEMS.slice(0, 2));
    await settle(fixture);
    expect(text(dialog().querySelector('[role="status"]'))).toBe('Showing notifications from 09:40. They may be out of date.');
    expect(dialog().querySelectorAll('li').length).toBe(2);
    provider.state.set('ready');
    provider.items.set([]);
    await settle(fixture);
    expect(text(dialog().querySelector('.paep-notification-panel__body'))).toBe('No notifications');
    provider.state.set('unavailable');
    await settle(fixture);
    expect(text(dialog().querySelector('.paep-notification-panel__body'))).toBe('Notifications are not available in this deployment.');
  });

  it('is an inset panel at most 24 rem wide and 16 px inside the viewport, never full screen (320 px and 1280 px)', async () => {
    await create(testNotifications({ unread: 2, items: ITEMS }));
    for (const width of [1280, 320]) {
      await page.viewport(width, 640);
      await openPanel();
      const r = popover().getBoundingClientRect();
      expect(r.width).toBeLessThanOrEqual(384 + 0.5);
      expect(r.left).toBeGreaterThanOrEqual(16 - 0.5);
      expect(r.right).toBeLessThanOrEqual(width - 16 + 0.5);
      expect(r.height).toBeLessThan(640);
      await userEvent.keyboard('{Escape}');
      await settle(fixture);
    }
  });

  it('announces an increase of the unread count once (batched), and never a decrease', async () => {
    const provider = testNotifications({ unread: 3 });
    await create(provider);
    const region = () => document.querySelector('[data-paep-announcer="polite"]')?.textContent ?? '';
    const live = document.querySelector('[data-paep-announcer="polite"]');
    if (live) live.textContent = '';
    provider.unread.set(4);
    await settle(fixture);
    provider.unread.set(5);
    await settle(fixture);
    await expect.poll(region, { timeout: 3000 }).toBe('Notifications, 5 unread');
    document.querySelector('[data-paep-announcer="polite"]')!.textContent = '';
    provider.unread.set(1);
    await settle(fixture, 1300);
    expect(region()).toBe('');
  });

  it('closes on a route change', async () => {
    await create(testNotifications({ unread: 2, items: ITEMS }));
    await openPanel();
    expect(isOpen()).toBe(true);
    await TestBed.inject(Router).navigateByUrl('/records');
    await settle(fixture);
    expect(isOpen()).toBe(false);
  });
});
