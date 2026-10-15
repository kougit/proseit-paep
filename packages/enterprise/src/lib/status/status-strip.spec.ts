import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaepShellLayout } from '../shell/shell-layout';
import { provideTestShell, settle, testConnectivity, testRuntimeConfig, testSession, text } from '../testing/shell-testing';
import { PaepStatusStrip } from './status-strip';

@Component({ imports: [PaepStatusStrip], template: '<paep-shell-status-strip />' })
class StripHost {}

describe('PaepStatusStrip', () => {
  let fixture: ComponentFixture<StripHost>;
  afterEach(() => fixture?.destroy());
  const rows = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-status]'));

  async function create(opts: Parameters<typeof provideTestShell>[0] = {}) {
    TestBed.configureTestingModule({ providers: provideTestShell(opts) });
    fixture = TestBed.createComponent(StripHost);
    await settle(fixture);
  }

  it('orders the rows impersonation, connectivity, session, environment (X-03) inside a "Status" region', async () => {
    const session = testSession({ agent: 'Support agent', minutes: 5 });
    await create({ session, connectivity: testConnectivity('degraded') });
    expect(rows().map((r) => r.dataset['status'])).toEqual(['impersonation', 'connectivity', 'session', 'environment']);
    expect(fixture.nativeElement.querySelector('section')?.getAttribute('aria-label')).toBe('Status');
    expect(text(rows()[0])).toContain('Support agent is viewing as Alex Morgan');
    expect(text(rows()[1])).toContain('Connection is slow or unstable');
    expect(text(rows()[2])).toContain('Your session ends in 5 minutes');
    expect(text(rows()[3])).toBe('Staging environment — not for production data');
  });

  it('shows no connectivity row while online and never promises queueing or sync when offline', async () => {
    const connectivity = testConnectivity('online');
    await create({ connectivity, runtimeConfig: testRuntimeConfig({ environment: 'production' }) });
    expect(rows().length).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('paep-shell-status-strip')?.hasAttribute('hidden')).toBe(true);
    connectivity.set('offline');
    await settle(fixture);
    expect(rows().map((r) => r.dataset['status'])).toEqual(['connectivity']);
    expect(text(rows()[0])).toBe('Offline You are offline. Changes cannot be sent until the connection returns.');
    expect(text(rows()[0])).not.toMatch(/queue|sync|later|automatically/i);
  });

  it('announces a connectivity change politely, once', async () => {
    const connectivity = testConnectivity('online');
    await create({ connectivity });
    connectivity.set('unknown');
    await settle(fixture, 120);
    expect(text(document.querySelector('[data-paep-announcer="polite"]'))).toBe('Connection status unknown');
  });

  it('calls the host hooks for "End session view" and "Stay signed in"; impersonation has no dismiss control', async () => {
    const session = testSession({ agent: 'Support agent', minutes: 3 });
    await create({ session });
    const [imp, , ] = rows();
    const buttons = imp.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(text(buttons[0])).toBe('End session view');
    buttons[0].click();
    (rows().find((r) => r.dataset['status'] === 'session')?.querySelector('button') as HTMLButtonElement).click();
    expect(session.calls).toEqual(['endImpersonation', 'continue']);
  });

  it('below 600 px shows the first row and an "n more status messages" disclosure that exposes the rest', async () => {
    const session = testSession({ agent: 'Support agent', minutes: 5 });
    await create({ session, connectivity: testConnectivity('offline'), medium: false });
    expect(TestBed.inject(PaepShellLayout).medium()).toBe(false);
    expect(rows().map((r) => r.dataset['status'])).toEqual(['impersonation']);
    const more = (fixture.nativeElement as HTMLElement).querySelector('.paep-shell-status__row--more button') as HTMLButtonElement;
    expect(text(more)).toBe('3 more status messages');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    more.click();
    await settle(fixture);
    expect(rows().length).toBe(4);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(text(more)).toBe('Show fewer status messages');
  });
});
