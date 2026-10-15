import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { PaepEmptyState, PaepEmptyStateKind, PaepHeadingLevel } from './empty-state';

@Component({
  imports: [PaepEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <paep-empty-state
      [kind]="kind()"
      [headingLevel]="level()"
      [heading]="heading()"
      [actionLabel]="actionLabel()"
      [actionDisabled]="disabled()"
      actionDisabledReason="You do not have permission to create records."
      (action)="actions = actions + 1"
    />
  `,
})
class Host {
  readonly kind = signal<PaepEmptyStateKind>('empty');
  readonly level = signal<PaepHeadingLevel>(3);
  readonly heading = signal('');
  readonly actionLabel = signal<string | undefined>(undefined);
  readonly disabled = signal(false);
  actions = 0;
}

@Component({
  imports: [PaepEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <paep-empty-state
      kind="unavailable"
      icon="edition"
      [headingLevel]="2"
      heading="Archive"
      reason="Not included in your edition"
      description="This capability is part of a different edition."
      [actionLabel]="action()"
      (action)="actions = actions + 1"
    />
  `,
})
class UnavailableHost {
  readonly action = signal<string | undefined>(undefined);
  actions = 0;
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement.querySelector('paep-empty-state') as HTMLElement;
  return { fixture, el, host: fixture.componentInstance };
}

describe('PaepEmptyState', () => {
  it('empty and no-results differ in icon, heading, description and action', async () => {
    const empty = await setup();
    const noResults = await setup((h) => h.kind.set('no-results'));
    expect(empty.el.querySelector('h3')?.textContent?.trim()).toBe('No records yet');
    expect(noResults.el.querySelector('h3')?.textContent?.trim()).toBe('No records match the current filters');
    expect(empty.el.querySelector('p')?.textContent).toContain('Records you create will appear here.');
    expect(noResults.el.querySelector('p')?.textContent).toContain('Try removing a filter');
    expect(empty.el.querySelector('svg')?.innerHTML).not.toBe(noResults.el.querySelector('svg')?.innerHTML);
    expect(empty.el.querySelector('button')).toBeNull();
    expect(noResults.el.querySelector('button')?.textContent?.trim()).toBe('Clear filters');
  });

  it('keeps the icon decorative and never moves focus on render', async () => {
    const before = document.activeElement;
    const { el } = await setup((h) => h.kind.set('no-results'));
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(before);
  });

  it('uses the configured heading level', async () => {
    for (const level of [2, 4, 6] as const) {
      const { el } = await setup((h) => h.level.set(level));
      expect(el.querySelector(`h${level}`)?.textContent?.trim()).toBe('No records yet');
    }
  });

  it('shows a consumer action that is keyboard operable', async () => {
    const { el, host } = await setup((h) => {
      h.actionLabel.set('Create record');
      h.heading.set('No stock movements yet');
    });
    expect(el.querySelector('h3')?.textContent?.trim()).toBe('No stock movements yet');
    const button = el.querySelector('button') as HTMLButtonElement;
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(host.actions).toBe(2);
  });

  it('hides the action when the label is empty', async () => {
    const { el } = await setup((h) => {
      h.kind.set('no-results');
      h.actionLabel.set('');
    });
    expect(el.querySelector('button')).toBeNull();
  });

  it('disables the action with a visible reason associated to it', async () => {
    const { el, host } = await setup((h) => {
      h.actionLabel.set('Create record');
      h.disabled.set(true);
    });
    const button = el.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    const reason = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(reason?.textContent).toContain('permission');
    button.click();
    expect(host.actions).toBe(0);
  });

  it('wraps long headings within the container', async () => {
    const { fixture, el } = await setup((h) => h.heading.set('No records match the current filters for the selected northern depot region'));
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.inlineSize = '200px';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  it('unavailable: host-supplied icon, heading and reason line, with no default description or action', async () => {
    const { el } = await setup((h) => {
      h.kind.set('unavailable');
      h.heading.set('Archive');
    });
    expect(el.querySelector('svg')).toBeNull();
    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Archive');
    expect(el.querySelector('p')).toBeNull();
    expect(el.querySelector('button')).toBeNull();
    const reasoned = TestBed.createComponent(UnavailableHost);
    reasoned.detectChanges();
    await reasoned.whenStable();
    const u = reasoned.nativeElement.querySelector('paep-empty-state') as HTMLElement;
    expect(u.getAttribute('data-kind')).toBe('unavailable');
    expect(u.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(u.querySelector('svg path')).not.toBeNull();
    expect(u.querySelector('h2')?.textContent?.trim()).toBe('Archive');
    expect(u.querySelector('.paep-empty-state__unavailable-reason')?.textContent?.trim()).toBe('Not included in your edition');
    expect(u.querySelector('.paep-empty-state__description')?.textContent?.trim()).toBe('This capability is part of a different edition.');
  });

  it('unavailable: the reason line precedes the description and keeps full text contrast', async () => {
    const f = TestBed.createComponent(UnavailableHost);
    f.detectChanges();
    await f.whenStable();
    const u = f.nativeElement.querySelector('paep-empty-state') as HTMLElement;
    const [reason, body] = [...u.querySelectorAll('p')];
    expect(reason.classList).toContain('paep-empty-state__unavailable-reason');
    expect(body.classList).toContain('paep-empty-state__description');
    expect(getComputedStyle(reason).color).toBe('rgb(26, 31, 38)');
    expect(getComputedStyle(reason).fontWeight).toBe('600');
  });

  it('unavailable: never takes focus and offers only a host-supplied action', async () => {
    const before = document.activeElement;
    const f = TestBed.createComponent(UnavailableHost);
    f.componentInstance.action.set('Learn about editions');
    f.detectChanges();
    await f.whenStable();
    expect(document.activeElement).toBe(before);
    const button = (f.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Learn about editions');
    button.click();
    expect(f.componentInstance.actions).toBe(1);
  });
});
