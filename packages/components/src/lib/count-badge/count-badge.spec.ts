import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { PaepCount, PaepCountBadge, PaepCountBadgeVariant } from './count-badge';

@Component({
  imports: [PaepCountBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#work" id="link">Work items<paep-count-badge [count]="count()" [label]="label()" [max]="max()" [variant]="variant()" /></a>
    <div dir="rtl"><paep-count-badge id="rtl" [count]="120" /></div>
  `,
})
class Host {
  readonly count = signal<PaepCount>(12);
  readonly label = signal('');
  readonly max = signal(99);
  readonly variant = signal<PaepCountBadgeVariant>('neutral');
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const badge = el.querySelector('#link paep-count-badge') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, badge, host: fixture.componentInstance, settle };
}

// The hidden text is out of flow, so name computation may separate it from the label with a space.
const value = (badge: HTMLElement) => badge.querySelector('.paep-count-badge__value') as HTMLElement | null;
const hidden = (badge: HTMLElement) => badge.querySelector('.paep-visually-hidden')?.textContent?.trim();

describe('PaepCountBadge', () => {
  it('shows a decorative left-to-right value and puts the count in the owning name through hidden text', async () => {
    const { badge } = await setup();
    await expect.element(page.getByRole('link', { name: /^Work items ?, 12 items$/ })).toBeInTheDocument();
    expect(value(badge)?.textContent?.trim()).toBe('12');
    expect(value(badge)?.getAttribute('aria-hidden')).toBe('true');
    expect(value(badge)?.getAttribute('dir')).toBe('ltr');
    expect(hidden(badge)).toBe(', 12 items');
    expect(badge.hasAttribute('role')).toBe(false);
  });

  it('caps the shown value at "99+" (or the configured maximum) in the badge and the name alike', async () => {
    const { badge, el, host, settle } = await setup((h) => h.count.set(120));
    expect(value(badge)?.textContent?.trim()).toBe('99+');
    await expect.element(page.getByRole('link', { name: /^Work items ?, 99\+ items$/ })).toBeInTheDocument();
    host.max.set(9);
    host.count.set(10);
    await settle();
    expect(value(badge)?.textContent?.trim()).toBe('9+');
    host.count.set(9);
    await settle();
    expect(value(badge)?.textContent?.trim()).toBe('9');
    // "99+" stays "99+" inside right-to-left text.
    const rtl = el.querySelector('#rtl .paep-count-badge__value') as HTMLElement;
    expect(rtl.textContent?.trim()).toBe('99+');
    expect(getComputedStyle(rtl).direction).toBe('ltr');
  });

  it('loading shows a spinner with hidden "Loading count"; unknown shows "–" with hidden "Count not available"', async () => {
    const { badge, host, settle } = await setup((h) => h.count.set('loading'));
    expect(badge.querySelector('svg.paep-icon--spin')?.getAttribute('aria-hidden')).toBe('true');
    expect(value(badge)).toBeNull();
    await expect.element(page.getByRole('link', { name: /^Work items ?, Loading count$/ })).toBeInTheDocument();
    host.count.set('unknown');
    await settle();
    expect(value(badge)?.textContent?.trim()).toBe('–');
    expect(hidden(badge)).toBe(', Count not available');
    expect(badge.getAttribute('data-state')).toBe('unknown');
  });

  it('uses the host template for the hidden text', async () => {
    await setup((h) => {
      h.count.set(3);
      h.label.set('{count} unread');
    });
    await expect.element(page.getByRole('link', { name: /^Work items ?, 3 unread$/ })).toBeInTheDocument();
  });

  it('attention uses the strong fill, neutral and unknown the neutral status colours', async () => {
    const { badge, host, settle } = await setup();
    const neutral = getComputedStyle(value(badge)!).backgroundColor;
    expect(neutral).toBe('rgb(239, 242, 245)');
    host.variant.set('attention');
    await settle();
    expect(getComputedStyle(value(badge)!).backgroundColor).toBe('rgb(179, 38, 30)');
    expect(getComputedStyle(value(badge)!).color).toBe('rgb(255, 255, 255)');
    host.count.set('unknown');
    await settle();
    expect(getComputedStyle(value(badge)!).backgroundColor).toBe(neutral);
  });
});
