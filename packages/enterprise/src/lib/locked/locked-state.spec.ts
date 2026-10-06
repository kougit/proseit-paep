import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PaepShellHostHooks, PaepShellLockReason } from '../ports/ports';
import { provideTestShell, settle, text } from '../testing/shell-testing';
import { PaepLockedState } from './locked-state';

@Component({
  imports: [PaepLockedState],
  template: `
    <paep-locked-state [reason]="reason()" heading="Archive" [level]="level()" />
    <paep-locked-state level="action" reason="permission" heading="Delete record">
      <button type="button" (click)="clicks = clicks + 1">Delete record</button>
    </paep-locked-state>
  `,
})
class LockedHost {
  readonly reason = signal<PaepShellLockReason>('edition');
  readonly level = signal<'page' | 'section'>('page');
  clicks = 0;
}

describe('PaepLockedState', () => {
  let fixture: ComponentFixture<LockedHost>;
  afterEach(() => fixture?.destroy());
  const el = () => fixture.nativeElement as HTMLElement;
  const page = () => el().querySelector('paep-locked-state') as HTMLElement;

  async function create(hooks?: PaepShellHostHooks) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), ...provideTestShell({ hooks })] });
    fixture = TestBed.createComponent(LockedHost);
    await settle(fixture);
  }

  it('explains a page-level lock: reason, h1, fixed body, the server note and Go to Home', async () => {
    await create();
    const h1 = page().querySelector('h1') as HTMLElement;
    expect(text(h1)).toBe('Archive');
    expect(h1.getAttribute('tabindex')).toBe('-1');
    expect(page().querySelector('section')?.getAttribute('aria-labelledby')).toBe(h1.id);
    expect(text(page().querySelector('.paep-locked__reason'))).toBe('Not included in your edition');
    expect(text(page())).toContain('This capability is part of a different edition.');
    expect(text(page())).toContain('Access is decided by the server; this page only explains it.');
    expect(page().querySelector('a')?.getAttribute('href')).toBe('/home');
  });

  it('offers the default explanation action only when the host supplies a hook', async () => {
    const asked: PaepShellLockReason[] = [];
    await create({ explainLock: (r) => asked.push(r) });
    const action = Array.from(page().querySelectorAll('button')).find((b) => text(b) === 'Learn about editions') as HTMLButtonElement;
    action.click();
    expect(asked).toEqual(['edition']);
    fixture.destroy();
    TestBed.resetTestingModule();
    await create();
    expect(Array.from(page().querySelectorAll('button')).some((b) => text(b) === 'Learn about editions')).toBe(false);
  });

  it('uses the fixed text of each of the four reasons', async () => {
    await create();
    const expected: Record<PaepShellLockReason, string> = {
      permission: 'Not available to your role',
      edition: 'Not included in your edition',
      configuration: 'Not configured for this deployment',
      environment: 'Not available in this environment',
    };
    for (const [reason, label] of Object.entries(expected) as [PaepShellLockReason, string][]) {
      fixture.componentInstance.reason.set(reason);
      await settle(fixture);
      expect(text(page().querySelector('.paep-locked__reason'))).toBe(label);
      expect(page().dataset['reason']).toBe(reason);
    }
  });

  it('composes the unavailable empty state at the section level, with an h2 and no h1', async () => {
    await create();
    fixture.componentInstance.level.set('section');
    await settle(fixture);
    expect(page().querySelector('h1')).toBeNull();
    const empty = page().querySelector('paep-empty-state') as HTMLElement;
    expect(empty.dataset['kind']).toBe('unavailable');
    expect(text(empty.querySelector('h2'))).toBe('Archive');
    expect(text(empty)).toContain('Not included in your edition');
  });

  it('keeps an action-level control focusable with aria-disabled, the reason as its description, and no activation', async () => {
    await create();
    const button = el().querySelector('paep-locked-state[data-level="action"] button') as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    const description = el().querySelector(`#${button.getAttribute('aria-describedby')}`);
    expect(text(description)).toBe('Not available to your role');
    button.click();
    expect(fixture.componentInstance.clicks).toBe(0);
  });
});
