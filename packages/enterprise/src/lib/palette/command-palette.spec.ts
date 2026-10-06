import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { userEvent } from 'vitest/browser';
import type { PaepShellAvailability, PaepShellCommandResult, PaepShellCommandResults, PaepShellLockReason } from '../ports/ports';
import { provideTestShell, settle, testReporter, text } from '../testing/shell-testing';
import { PaepCommandPalette } from './command-palette';

@Component({ template: '<h1 tabindex="-1">Page</h1>' })
class Page {}

@Component({
  imports: [PaepCommandPalette],
  template: `
    <button id="opener" type="button" (click)="open.set(true)">Search or go to…</button>
    <paep-command-palette [(open)]="open" heading="Search and commands" />
  `,
})
class PaletteHost {
  readonly open = signal(false);
}

const LOCKS: Record<string, PaepShellAvailability> = {
  archive: { state: 'locked', reason: 'edition' },
  secret: { state: 'not-permitted' },
};

interface SearchCall {
  readonly query: string;
  readonly signal: AbortSignal;
  resolve(r: PaepShellCommandResults): void;
  reject(e: unknown): void;
}

describe('PaepCommandPalette', () => {
  let fixture: ComponentFixture<PaletteHost>;
  let calls: SearchCall[];
  let ran: string[];
  let explained: PaepShellLockReason[];
  let reporter: ReturnType<typeof testReporter>;
  afterEach(() => fixture?.destroy());
  const el = () => fixture.nativeElement as HTMLElement;
  const dialog = () => el().querySelector('dialog') as HTMLDialogElement;
  const input = () => dialog().querySelector('input[role="combobox"]') as HTMLInputElement;
  const groupLabels = () => Array.from(dialog().querySelectorAll('[role="group"]')).map((g) => text(g.querySelector('.paep-combobox__group-label')));
  const options = (group?: string) =>
    Array.from(dialog().querySelectorAll('[role="group"]'))
      .filter((g) => !group || text(g.querySelector('.paep-combobox__group-label')) === group)
      .flatMap((g) => Array.from(g.querySelectorAll('[role="option"]')));
  /** The option's label: the first text of its text block (the description follows in its own span). */
  const optionTitle = (o: Element) => (o.querySelector('.paep-combobox__option-text')?.childNodes[0]?.textContent ?? '').trim();

  async function create(actions: readonly PaepShellCommandResult[] = []) {
    calls = [];
    ran = [];
    explained = [];
    reporter = testReporter();
    const access = { loaded: signal(true), availability: (id: string) => LOCKS[id] ?? { state: 'available' as const } };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: Page }]),
        ...provideTestShell({
          access,
          errorReporter: reporter,
          hooks: { explainLock: (r) => explained.push(r) },
          commands: {
            actions: signal(actions),
            search: (query, s) => new Promise((resolve, reject) => calls.push({ query, signal: s, resolve, reject })),
          },
        }),
      ],
    });
    fixture = TestBed.createComponent(PaletteHost);
    await TestBed.inject(Router).navigateByUrl('/work');
    await settle(fixture);
  }

  async function open() {
    const opener = el().querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await settle(fixture);
  }

  async function type(value: string, ms = 300) {
    input().focus();
    await userEvent.fill(input(), value);
    await settle(fixture, ms);
  }

  it('opens as a modal dialog named "Search and commands" with focus in the labelled combobox', async () => {
    await create();
    await open();
    expect(dialog().open).toBe(true);
    expect(dialog().matches(':modal')).toBe(true);
    expect(text(dialog().querySelector(`#${dialog().getAttribute('aria-labelledby')}`))).toBe('Search and commands');
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute('aria-label')).toBe('Search records, pages and commands');
    expect(text(dialog().querySelector('.paep-palette__foot'))).toBe('↑↓ to move · Enter to open · Esc to close');
  });

  it('suggests Home and the current group with an empty query, without searching records', async () => {
    await create([{ id: 'new', group: 'actions', label: 'New record', run: () => ran.push('new') }]);
    await open();
    expect(dialog().querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe('Suggestions');
    expect(groupLabels()).toEqual(['Go to', 'Actions']);
    expect(options('Go to').map(optionTitle)).toEqual(['Home', 'Work items', 'Archive', 'Records', 'Open records']);
    expect(calls.length).toBe(0);
  });

  it('filters Go to from the presented manifest: locked results keep their reason, not-permitted never appear', async () => {
    await create();
    await open();
    await type('ar');
    const goto = options('Go to');
    expect(goto.map(optionTitle)).toEqual(['Archive']);
    expect(text(goto[0])).toContain('Operations · Not included in your edition');
    await type('secret');
    expect(options('Go to').length).toBe(0);
  });

  it('searches records once after a typing pause, aborts a superseded search and announces the count', async () => {
    await create();
    await open();
    input().focus();
    await userEvent.fill(input(), 'r');
    await userEvent.fill(input(), 're');
    await userEvent.fill(input(), 'rec');
    await settle(fixture, 300);
    expect(calls.map((c) => c.query)).toEqual(['rec']);
    expect(text(dialog().querySelector('.paep-palette__loading'))).toBe('Searching…');
    await type('reco');
    expect(calls[0].signal.aborted).toBe(true);
    calls[1].resolve({ results: [{ id: 'r-1', group: 'records', label: 'REC-000181 <b>Access</b> review', description: 'Record · Approved', route: '/records/181' }] });
    await settle(fixture, 80);
    const record = options('Records')[0];
    expect(text(record)).toContain('REC-000181 <b>Access</b> review');
    expect(record.querySelector('b')).toBeNull();
    expect(text(document.querySelector('[data-paep-announcer="polite"]'))).toBe('3 results');
  });

  it('keeps pages and actions when record search fails, with the error and the reported reference', async () => {
    await create();
    await open();
    await type('rec');
    calls[0].reject(new Error('upstream 500 /api/records?token=abc'));
    await settle(fixture);
    const alert = dialog().querySelector('paep-alert') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(text(alert)).toContain('Search is not available right now');
    expect(reporter.reports.length).toBe(1);
    expect(text(alert)).toContain(`Pages and actions can still be opened below. Reference ${reporter.reports[0].correlationId}.`);
    expect(alert.querySelector('code')?.getAttribute('dir')).toBe('ltr');
    expect(text(dialog())).not.toMatch(/upstream|token|api/);
    expect(options('Go to').map(optionTitle)).toEqual(['Records', 'Open records']);
  });

  it('shows partial results with a warning, and the no-results state with the query as plain text', async () => {
    await create();
    await open();
    await type('rec');
    calls[0].resolve({ results: [], partial: true });
    await settle(fixture);
    expect(text(dialog().querySelector('paep-alert'))).toContain('Some results could not be loaded. Showing what is available.');
    await type('<zz>');
    calls[1].resolve({ results: [] });
    await settle(fixture);
    expect(text(dialog().querySelector('.paep-palette__empty'))).toContain('No results for “<zz>”');
    expect(text(dialog().querySelector('.paep-palette__empty'))).toContain('Check the spelling or try a shorter search.');
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape clears the query first, a second Escape closes and returns focus to the opener', async () => {
    await create();
    await open();
    await type('wor');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(input().value).toBe('');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(dialog().open).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(el().querySelector('#opener'));
  });

  it('opens a destination with Enter and closes', async () => {
    await create();
    await open();
    await type('open rec');
    await userEvent.keyboard('{Enter}');
    await settle(fixture, 40);
    expect(TestBed.inject(Router).url).toBe('/records/open');
    expect(dialog().open).toBe(false);
  });

  it('runs an action; a locked action opens its explanation and never runs', async () => {
    await create([
      { id: 'export', group: 'actions', label: 'Export summary', run: () => ran.push('export') },
      { id: 'bulk', group: 'actions', label: 'Bulk import', run: () => ran.push('bulk'), locked: 'edition' },
    ]);
    await open();
    await type('bulk');
    expect(text(options('Actions')[0])).toContain('Not included in your edition');
    (options('Actions')[0] as HTMLElement).click();
    await settle(fixture);
    expect(ran).toEqual([]);
    expect(explained).toEqual(['edition']);
    await open();
    await type('export');
    (options('Actions')[0] as HTMLElement).click();
    await settle(fixture);
    expect(ran).toEqual(['export']);
  });

  it('drops provider results that are not internal routes or commands', async () => {
    await create();
    await open();
    await type('rec');
    calls[0].resolve({
      results: [
        { id: 'a', group: 'records', label: 'External', route: 'https://example.test/x' },
        { id: 'b', group: 'records', label: 'Protocol relative', route: '//example.test/x' },
        { id: 'c', group: 'records', label: 'Internal', route: '/records/3' },
      ],
    });
    await settle(fixture);
    expect(options('Records').map(optionTitle)).toEqual(['Internal']);
  });

  it('is centred and at most 40 rem from 600 px, full screen below', async () => {
    await create();
    await open();
    const rect = dialog().getBoundingClientRect();
    if (window.innerWidth >= 600) expect(rect.width).toBeLessThanOrEqual(640);
    else {
      expect(Math.round(rect.width)).toBe(window.innerWidth);
      expect(Math.round(rect.top)).toBe(0);
    }
  });
});
