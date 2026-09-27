import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaepSkeleton, PaepSkeletonShape } from './skeleton';

@Component({
  imports: [PaepSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="inline-size: 300px"><paep-skeleton [shape]="shape()" [lines]="lines()" /></div>`,
})
class Host {
  readonly shape = signal<PaepSkeletonShape>('text');
  readonly lines = signal(3);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('paep-skeleton') as HTMLElement;
  return { fixture, el, blocks: () => Array.from(el.querySelectorAll<HTMLElement>('.paep-skeleton__block')) };
}

describe('PaepSkeleton', () => {
  afterEach(() => document.documentElement.removeAttribute('data-paep-motion'));

  it('is hidden from assistive technology and not focusable', async () => {
    const { el } = await setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[tabindex], button, a')).toBeNull();
  });

  it('renders text lines with a shorter last line', async () => {
    const { blocks } = await setup();
    const b = blocks();
    expect(b).toHaveLength(3);
    const full = b[0].getBoundingClientRect().width;
    expect(b[1].getBoundingClientRect().width).toBeCloseTo(full, 0);
    expect(b[2].getBoundingClientRect().width).toBeCloseTo(full * 0.6, 0);
  });

  it('supports the list item and table cell shapes and a bounded line count', async () => {
    const { fixture, blocks } = await setup();
    fixture.componentInstance.shape.set('item');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(blocks()).toHaveLength(2);
    fixture.componentInstance.shape.set('cell');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(blocks()).toHaveLength(1);
    fixture.componentInstance.shape.set('text');
    fixture.componentInstance.lines.set(50);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(blocks()).toHaveLength(10);
  });

  it('pulses by default and stops under reduced motion', async () => {
    const { fixture, blocks } = await setup();
    expect(getComputedStyle(blocks()[0]).animationName).toContain('paep-skeleton-pulse');
    document.documentElement.setAttribute('data-paep-motion', 'reduce');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getComputedStyle(blocks()[0]).animationName).toBe('none');
  });
});
