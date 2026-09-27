import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { userEvent } from 'vitest/browser';
import { PaepAlert, PaepAlertStatus } from './alert';

@Component({
  imports: [PaepAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 #regionHeading>Region</h3>
    @if (shown()) {
      <paep-alert
        [status]="status()"
        [heading]="heading()"
        [live]="live()"
        [dismissible]="dismissible()"
        [focusAfterDismiss]="regionHeading"
        (dismissed)="dismissCount = dismissCount + 1"
      >
        Body text
        <button paepAlertActions type="button" (click)="actionCount = actionCount + 1">Retry</button>
      </paep-alert>
    }
    <button type="button">After</button>
  `,
})
class Host {
  readonly status = signal<PaepAlertStatus>('info');
  readonly heading = signal('Heads up');
  readonly live = signal(false);
  readonly dismissible = signal(false);
  readonly shown = signal(true);
  dismissCount = 0;
  actionCount = 0;
}

async function setup(init?: (h: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const alert = () => fixture.nativeElement.querySelector('paep-alert') as HTMLElement;
  const refresh = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, alert, refresh, host: fixture.componentInstance };
}

describe('PaepAlert', () => {
  it('is static content (no live role) when present at load', async () => {
    const { alert } = await setup((h) => h.status.set('error'));
    expect(alert().getAttribute('role')).toBeNull();
  });

  it('uses role=alert for dynamically inserted errors and role=status otherwise', async () => {
    const { alert, refresh, host } = await setup((h) => {
      h.shown.set(false);
      h.live.set(true);
    });
    host.status.set('error');
    host.shown.set(true);
    await refresh();
    expect(alert().getAttribute('role')).toBe('alert');
    for (const s of ['info', 'success', 'warning'] as const) {
      host.status.set(s);
      await refresh();
      expect(alert().getAttribute('role')).toBe('status');
    }
  });

  it('carries a visually hidden status word and a distinct icon per status', async () => {
    const { alert, refresh, host } = await setup();
    const words: Record<PaepAlertStatus, string> = { info: 'Information', success: 'Success', warning: 'Warning', error: 'Error' };
    const icons = new Set<string>();
    for (const s of ['info', 'success', 'warning', 'error'] as const) {
      host.status.set(s);
      await refresh();
      const word = alert().querySelector('.paep-visually-hidden') as HTMLElement;
      expect(word.textContent?.trim()).toBe(words[s]);
      const icon = alert().querySelector('svg') as SVGElement;
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      icons.add(icon.innerHTML);
    }
    expect(icons.size).toBe(4);
    const text = alert().textContent ?? '';
    expect(text.indexOf('Error')).toBeLessThan(text.indexOf('Heads up'));
    expect(text).toContain('Body text');
  });

  it('renders the title and projected actions, which are keyboard operable', async () => {
    const { alert, host } = await setup();
    expect(alert().querySelector('.paep-alert__title')?.textContent).toBe('Heads up');
    const action = alert().querySelector('.paep-alert__actions button') as HTMLButtonElement;
    action.focus();
    await userEvent.keyboard('{Enter}');
    expect(host.actionCount).toBe(1);
  });

  it('dismisses with the keyboard, emits dismissed and moves focus to the region heading', async () => {
    const { fixture, alert, refresh, host } = await setup((h) => h.dismissible.set(true));
    const dismiss = alert().querySelector('.paep-alert__dismiss') as HTMLButtonElement;
    expect(dismiss.textContent?.trim()).toBe('Dismiss');
    dismiss.focus();
    await userEvent.keyboard('{Enter}');
    await refresh();
    expect(host.dismissCount).toBe(1);
    expect(alert().hidden).toBe(true);
    expect(getComputedStyle(alert()).display).toBe('none');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h3'));
  });

  it('never offers dismissal for error alerts', async () => {
    const { alert } = await setup((h) => {
      h.dismissible.set(true);
      h.status.set('error');
    });
    expect(alert().querySelector('.paep-alert__dismiss')).toBeNull();
  });

  it('can receive focus programmatically (error summary after a failed submit)', async () => {
    const { fixture } = await setup((h) => h.status.set('error'));
    const debug = fixture.debugElement.query(By.directive(PaepAlert));
    (debug.componentInstance as PaepAlert).focus();
    expect(document.activeElement).toBe(debug.nativeElement);
    expect((debug.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('-1');
  });

  it('keeps long content inline and wraps actions at narrow width', async () => {
    const { fixture, alert, refresh } = await setup();
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.inlineSize = '240px';
    await refresh();
    expect(alert().scrollWidth).toBeLessThanOrEqual(alert().clientWidth + 1);
    expect(getComputedStyle(alert()).overflowY).toBe('visible');
  });
});
