import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaepStatusBadge, PaepStatusTone } from './status-badge';

@Component({
  imports: [PaepStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<paep-status-badge [tone]="tone()">{{ text() }}</paep-status-badge>`,
})
class Host {
  readonly tone = signal<PaepStatusTone>('neutral');
  readonly text = signal('Draft');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const badge = fixture.nativeElement.querySelector('paep-status-badge') as HTMLElement;
  return { fixture, badge };
}

describe('PaepStatusBadge', () => {
  it('always shows its text and has no role or tab stop', async () => {
    const { badge } = await setup();
    expect(badge.textContent?.trim()).toBe('Draft');
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.querySelector('[tabindex], button, a')).toBeNull();
    expect(badge.tabIndex).toBe(-1);
  });

  it('shows a decorative icon whose shape differs per tone (not colour alone)', async () => {
    const { fixture, badge } = await setup();
    const shapes = new Set<string>();
    for (const tone of ['neutral', 'info', 'success', 'warning', 'error'] as const) {
      fixture.componentInstance.tone.set(tone);
      fixture.detectChanges();
      await fixture.whenStable();
      const icon = badge.querySelector('svg') as SVGElement;
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(badge.getAttribute('data-tone')).toBe(tone);
      shapes.add(icon.innerHTML);
    }
    expect(shapes.size).toBe(5);
  });

  it('uses the status colour tokens for each tone', async () => {
    const { fixture, badge } = await setup();
    const neutral = getComputedStyle(badge).backgroundColor;
    fixture.componentInstance.tone.set('error');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getComputedStyle(badge).backgroundColor).not.toBe(neutral);
    const probe = document.createElement('span');
    probe.style.color = 'var(--paep-color-status-error-fg)';
    document.body.appendChild(probe);
    expect(getComputedStyle(badge).color).toBe(getComputedStyle(probe).color);
    probe.remove();
  });

  it('wraps long labels instead of truncating them', async () => {
    const { fixture, badge } = await setup();
    fixture.componentInstance.text.set('Awaiting review by the second approver in the regional office');
    fixture.nativeElement.style.inlineSize = '8rem';
    fixture.nativeElement.style.display = 'block';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(badge.getBoundingClientRect().width).toBeLessThanOrEqual(fixture.nativeElement.getBoundingClientRect().width + 0.5);
    expect(badge.textContent).toContain('regional office');
    expect(getComputedStyle(badge).textOverflow).not.toBe('ellipsis');
    expect(badge.getBoundingClientRect().height).toBeGreaterThan(30);
  });
});
