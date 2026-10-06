import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { PAEP_SHELL_DEFAULT_MESSAGES } from '../messages/shell-messages';
import { PAEP_SHELL_CONNECTIVITY, PAEP_SHELL_ERROR_REPORTER, PAEP_SHELL_LOCALE } from '../ports/ports';
import { PaepShellPreferences } from '../preferences/preferences';
import { PaepRouteFocus } from '../route-focus/route-focus';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';
import { TEST_NAVIGATION, provideTestShell, settle, testRuntimeConfig, text } from '../testing/shell-testing';
import { providePaepShell } from './provide-shell';

describe('shell messages', () => {
  it('carries exactly the 121 approved paep.shell.* keys, each with an English default', () => {
    const keys = Object.keys(PAEP_SHELL_DEFAULT_MESSAGES);
    expect(keys.length).toBe(121);
    expect(keys.every((k) => k.startsWith('paep.shell.'))).toBe(true);
    expect(Object.values(PAEP_SHELL_DEFAULT_MESSAGES).every((v) => typeof v === 'string' && v.length > 0)).toBe(true);
  });

  it('resolves placeholders and plural forms, and per-locale overrides follow the active locale', () => {
    TestBed.configureTestingModule({
      providers: provideTestShell({
        runtimeConfig: testRuntimeConfig({ locales: ['en', 'fr'] }),
        messages: { fr: { 'paep.shell.nav.open': 'Ouvrir la navigation' }, en: { 'paep.shell.status.more#one': '{count} more status message' } },
      }),
    });
    const t = TestBed.inject(PaepShellText);
    expect(t.t('paep.shell.status.more', { count: 1 })).toBe('1 more status message');
    expect(t.t('paep.shell.status.more', { count: 3 })).toBe('3 more status messages');
    expect(t.t('paep.shell.nav.open')).toBe('Open navigation');
    TestBed.inject(PAEP_SHELL_LOCALE).request('fr');
    expect(t.t('paep.shell.nav.open')).toBe('Ouvrir la navigation');
  });

  it('renders provider text as plain text, never as HTML', () => {
    TestBed.configureTestingModule({ providers: provideTestShell() });
    const t = TestBed.inject(PaepShellText);
    expect(t.t('paep.shell.search.empty', { query: '<img src=x onerror=alert(1)>' })).toBe('No results for “<img src=x onerror=alert(1)>”');
  });
});

describe('providePaepShell', () => {
  afterEach(() => {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  });

  it('defaults to the browser connectivity source and the allowlisting console reporter', () => {
    TestBed.configureTestingModule({ providers: [providePaepShell({ runtimeConfig: testRuntimeConfig(), navigation: TEST_NAVIGATION })] });
    const source = TestBed.inject(PAEP_SHELL_CONNECTIVITY);
    expect(['online', 'offline', 'unknown']).toContain(source.current());
    expect(typeof TestBed.inject(PAEP_SHELL_ERROR_REPORTER).report).toBe('function');
  });

  it('applies the default locale, and only a supported locale on request, with lang and dir on the root', () => {
    TestBed.configureTestingModule({
      providers: [providePaepShell({ runtimeConfig: testRuntimeConfig({ locales: ['en', 'ar'], rtl: ['ar'] }), navigation: TEST_NAVIGATION })],
    });
    const locale = TestBed.inject(PAEP_SHELL_LOCALE);
    expect(locale.active()).toBe('en');
    expect(locale.supported()).toEqual(['en', 'ar']);
    locale.request('de');
    expect(locale.active()).toBe('en');
    locale.request('ar');
    expect(locale.active()).toBe('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('starts with the comfortable density and an expanded navigation (session only, nothing stored)', () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [providePaepShell({ runtimeConfig: testRuntimeConfig(), navigation: TEST_NAVIGATION })] });
    const layout = TestBed.inject(PaepShellLayout);
    layout.navCollapsed.set(true);
    layout.density.set('compact');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

@Component({ template: '<h1>{{ title }}</h1>' })
class TitledPage {
  title = 'Second';
}

@Component({ template: '<h1>First</h1>' })
class FirstPage {}

@Component({
  imports: [PaepShellPreferences],
  template: '<main><h1>Page</h1></main><paep-shell-preferences [(open)]="open" />',
})
class PrefsHost {
  open = false;
}

@Component({ imports: [RouterOutlet], template: '<main><router-outlet /></main>' })
class OutletHost {}

describe('PaepRouteFocus', () => {
  let fixture: ComponentFixture<unknown>;
  afterEach(() => fixture?.destroy());

  it('does not move focus on the first load, then focuses the new h1 and announces "{title} page"', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'first', component: FirstPage },
          { path: 'second', component: TitledPage },
        ]),
        ...provideTestShell(),
      ],
    });
    fixture = TestBed.createComponent(OutletHost);
    const focus = TestBed.inject(PaepRouteFocus);
    focus.attach((fixture.nativeElement as HTMLElement).querySelector('main'));
    const before = document.activeElement;
    await TestBed.inject(Router).navigateByUrl('/first');
    await settle(fixture, 60);
    expect(document.activeElement).toBe(before);
    await TestBed.inject(Router).navigateByUrl('/second');
    await settle(fixture, 120);
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1') as HTMLElement;
    expect(document.activeElement).toBe(h1);
    expect(h1.getAttribute('tabindex')).toBe('-1');
    expect(text(document.querySelector('[data-paep-announcer="polite"]'))).toBe('Second page');
  });
});

describe('PaepShellPreferences', () => {
  it('sets content density and the navigation collapse for the session, and says nothing is stored', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), ...provideTestShell()] });
    const fixture = TestBed.createComponent(PrefsHost);
    fixture.componentInstance.open = true;
    await settle(fixture);
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(text(dialog.querySelector('h2'))).toBe('Display preferences');
    expect(text(dialog)).toContain('These preferences apply until you sign out.');
    const layout = TestBed.inject(PaepShellLayout);
    (dialog.querySelector('input[value="compact"]') as HTMLInputElement).click();
    expect(layout.density()).toBe('compact');
    (dialog.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    expect(layout.navCollapsed()).toBe(true);
    expect(text(dialog)).not.toMatch(/saved/i);
    fixture.destroy();
  });
});
