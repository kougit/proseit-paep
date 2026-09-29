import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaepProgress } from './progress';

@Component({
  imports: [PaepProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<paep-progress [label]="label()" [value]="value()" [steps]="steps()" />`,
})
class Host {
  readonly label = signal('Uploading files');
  readonly value = signal<number | null>(45);
  readonly steps = signal<number | null>(null);
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('paep-progress') as HTMLElement;
  const progress = () => el.querySelector('progress') as HTMLProgressElement;
  const refresh = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, el, progress, refresh, host: fixture.componentInstance };
}

describe('PaepProgress', () => {
  afterEach(() => document.documentElement.removeAttribute('data-paep-motion'));

  it('is a native progress named by its visible label', async () => {
    const { el, progress } = await setup();
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(progress().id);
    expect(progress().labels?.[0]).toBe(label);
    expect(label.textContent).toBe('Uploading files');
    expect(progress().tabIndex).toBe(-1);
  });

  it('shows a determinate value and percentage text', async () => {
    const { el, progress, refresh, host } = await setup();
    expect(progress().value).toBe(45);
    expect(progress().max).toBe(100);
    expect(el.querySelector('.paep-progress__value')?.textContent?.trim()).toBe('45%');
    host.value.set(250);
    await refresh();
    expect(progress().value).toBe(100);
    expect(el.querySelector('.paep-progress__value')?.textContent?.trim()).toBe('100%');
  });

  it('supports the step variant with a value text', async () => {
    const { el, progress } = await setup((h) => {
      h.value.set(3);
      h.steps.set(7);
    });
    expect(el.querySelector('.paep-progress__value')?.textContent?.trim()).toBe('Step 3 of 7');
    expect(progress().max).toBe(7);
    expect(progress().getAttribute('aria-valuetext')).toBe('Step 3 of 7');
  });

  it('is indeterminate without a value and animates a travelling segment', async () => {
    const { el, progress } = await setup((h) => h.value.set(null));
    expect(progress().hasAttribute('value')).toBe(false);
    expect(progress().matches(':indeterminate')).toBe(true);
    expect(getComputedStyle(progress()).animationName).toContain('paep-progress-travel');
    const text = el.querySelector('.paep-progress__value--reduced') as HTMLElement;
    expect(getComputedStyle(text).display).toBe('none');
  });

  it('under reduced motion shows a static hatched fill and "In progress"', async () => {
    document.documentElement.setAttribute('data-paep-motion', 'reduce');
    const { el, progress } = await setup((h) => h.value.set(null));
    const style = getComputedStyle(progress());
    expect(style.animationName).toBe('none');
    expect(style.backgroundImage).toContain('repeating-linear-gradient');
    const text = el.querySelector('.paep-progress__value--reduced') as HTMLElement;
    expect(getComputedStyle(text).display).not.toBe('none');
    expect(text.textContent?.trim()).toBe('In progress');
  });

  it('wraps a long label and keeps the value text visible', async () => {
    const { fixture, el } = await setup((h) => h.label.set('Importing the quarterly stock movement records for every depot'));
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.inlineSize = '200px';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    const value = el.querySelector('.paep-progress__value') as HTMLElement;
    expect(value.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});
