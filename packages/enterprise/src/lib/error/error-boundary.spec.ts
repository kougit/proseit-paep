import { Component, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTestShell, settle as settleFixture, testReporter, text } from '../testing/shell-testing';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepErrorBoundary } from './error-boundary';
import { PaepNotFound } from './not-found';
import { PaepShellErrorHandler, PaepShellErrors } from './shell-errors';

let failures = 0;

@Component({ template: '<h1>{{ value() }}</h1>' })
class FlakyPage {
  protected value(): string {
    if (failures > 0) {
      failures--;
      throw new Error('secret server detail /api/tenants/42?token=abc');
    }
    return 'Recovered page';
  }
}

@Component({ template: '<h1>Home page</h1>' })
class HomePage {}

@Component({ imports: [PaepErrorBoundary], template: '<main><paep-error-boundary /></main>' })
class BoundaryHost {}

/**
 * Lets the change-detection scheduler render, as the running app does, so a render error reaches the ErrorHandler.
 * (A direct `detectChanges()` or `ApplicationRef.tick()` call rethrows it into the test instead.)
 */
async function settle(f: ComponentFixture<unknown>, ms = 20): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, ms));
  await f.whenStable();
}

describe('PaepErrorBoundary', () => {
  let fixture: ComponentFixture<BoundaryHost>;
  let reporter: ReturnType<typeof testReporter>;
  afterEach(() => fixture?.destroy());
  const el = () => fixture.nativeElement as HTMLElement;

  async function create(url: string) {
    reporter = testReporter();
    TestBed.configureTestingModule({
      // The boundary handles render errors itself; TestBed must not rethrow them into the test.
      rethrowApplicationErrors: false,
      providers: [
        provideRouter([
          { path: 'flaky', component: FlakyPage },
          { path: 'home', component: HomePage },
          { path: 'lazy', loadComponent: () => Promise.reject(new Error('ChunkLoadError: Loading chunk 7 failed')) },
          { path: '**', component: PaepNotFound },
        ]),
        ...provideTestShell({ errorReporter: reporter }),
      ],
    });
    fixture = TestBed.createComponent(BoundaryHost);
    fixture.autoDetectChanges();
    await TestBed.inject(Router).navigateByUrl(url).catch(() => false);
    await settle(fixture, 60);
    await settle(fixture);
  }

  it('installs the shell error handler', async () => {
    await create('/home');
    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(PaepShellErrorHandler);
  });

  it('replaces a page that fails to render with fixed text, a reference and focus on the error h1', async () => {
    failures = 1;
    await create('/flaky');
    const h1 = el().querySelector('h1') as HTMLElement;
    expect(text(h1)).toBe('Something went wrong on this page');
    expect(document.activeElement).toBe(h1);
    const ref = el().querySelector('.paep-error-page__ref code') as HTMLElement;
    expect(ref.getAttribute('dir')).toBe('ltr');
    expect(ref.textContent).toMatch(/^ERR-[A-Z0-9]{12}$/);
    expect(text(el())).not.toMatch(/secret|token|api\/tenants/);
    expect(reporter.reports.length).toBe(1);
    expect(Object.keys(reporter.reports[0]).sort()).toEqual(['at', 'correlationId', 'kind', 'retryable', 'route']);
    expect(reporter.reports[0].correlationId).toBe(ref.textContent);
    expect(reporter.reports[0].route).toBe('/flaky');
  });

  it('"Try again" renders the page again and moves focus to its h1', async () => {
    failures = 1;
    await create('/flaky');
    const retry = Array.from(el().querySelectorAll('button')).find((b) => text(b) === 'Try again') as HTMLButtonElement;
    retry.click();
    await settle(fixture, 60);
    const h1 = el().querySelector('h1') as HTMLElement;
    expect(text(h1)).toBe('Recovered page');
    expect(document.activeElement).toBe(h1);
  });

  it('offers only Go to Home, with the reference, for a render failure that is not retryable', async () => {
    await create('/home');
    TestBed.inject(PaepShellErrors).raise('render', { retryable: false });
    await settle(fixture);
    expect(text(el().querySelector('h1'))).toBe('Something went wrong on this page');
    expect(el().querySelector('.paep-error-page__ref code')?.textContent).toMatch(/^ERR-/);
    expect(Array.from(el().querySelectorAll('button, a')).map((b) => text(b))).toEqual(['Go to Home']);
  });

  it('shows the load-failure text with "Reload page" (not "Try again") when a lazy route cannot be fetched', async () => {
    await create('/lazy');
    expect(text(el().querySelector('h1'))).toBe('Part of the application could not be loaded');
    const labels = Array.from(el().querySelectorAll('button, a')).map((b) => text(b));
    expect(labels).toContain('Reload page');
    expect(labels).not.toContain('Try again');
    expect(labels).toContain('Go to Home');
    expect(reporter.reports[0].kind).toBe('route-load');
  });

  it('shows the version text when the host raises an incompatible version, and clears on navigation', async () => {
    await create('/home');
    TestBed.inject(PaepShellErrors).raise('version', { retryable: false });
    await settle(fixture);
    expect(text(el().querySelector('h1'))).toBe('A newer version is available');
    // HOF-IB3-001 SCR-SHELL-013 incompatible-version: no reference line; Reload page and Go to Home.
    expect(el().querySelector('.paep-error-page__ref')).toBeNull();
    expect(Array.from(el().querySelectorAll('button, a')).map((b) => text(b))).toEqual(['Reload page', 'Go to Home']);
    await TestBed.inject(Router).navigateByUrl('/elsewhere');
    await settle(fixture);
    expect(text(el().querySelector('h1'))).toBe('Page not found');
  });
});

describe('PaepNotFound', () => {
  it('shows fixed text, Go to Home and Search or go to… (opens the palette), and nothing from the requested address', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', component: PaepNotFound }]), ...provideTestShell()] });
    const fixture = TestBed.createComponent(BoundaryHost);
    await TestBed.inject(Router).navigateByUrl('/no/such/<script>page');
    await settleFixture(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el.querySelector('h1'))).toBe('Page not found');
    expect(el.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(text(el)).toContain('The address may be wrong, or the page may have moved.');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/home');
    expect(text(el)).not.toContain('script');
    const search = Array.from(el.querySelectorAll('button')).find((b) => text(b) === 'Search or go to…') as HTMLButtonElement;
    expect(search.getAttribute('aria-haspopup')).toBe('dialog');
    search.click();
    expect(TestBed.inject(PaepShellLayout).paletteOpen()).toBe(true);
    fixture.destroy();
  });
});
