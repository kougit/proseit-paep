import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PaepShellContext, PaepShellContextProvider, PaepShellSwitchOutcome } from '../ports/ports';
import { TEST_CONTEXTS, provideTestShell, settle, text } from '../testing/shell-testing';
import { PaepContextSwitcher } from './context-switcher';

@Component({
  imports: [PaepContextSwitcher],
  template: `
    <main><h1 tabindex="-1">Records</h1></main>
    <paep-context-switcher />
    <paep-context-switcher mode="mismatch" [target]="target()" />
  `,
})
class SwitcherHost {
  readonly target = signal<PaepShellContext | null>(null);
}

describe('PaepContextSwitcher', () => {
  let fixture: ComponentFixture<SwitcherHost>;
  let resolveSwitch: (o: PaepShellSwitchOutcome) => void;
  const requests: PaepShellContext[] = [];
  afterEach(() => fixture?.destroy());
  const el = () => fixture.nativeElement as HTMLElement;
  const dialog = () => el().querySelector('paep-context-switcher:not([data-mode="mismatch"]) dialog') as HTMLDialogElement;

  async function create(available: readonly PaepShellContext[], current = TEST_CONTEXTS[0]) {
    requests.length = 0;
    const provider: PaepShellContextProvider = {
      current: signal(current),
      available: signal(available),
      requestSwitch: (target) => {
        requests.push(target);
        return new Promise((r) => (resolveSwitch = r));
      },
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), ...provideTestShell({ context: provider })] });
    fixture = TestBed.createComponent(SwitcherHost);
    await settle(fixture);
  }

  it('shows static text in a "Current context" group when only one context is offered', async () => {
    await create([TEST_CONTEXTS[0]]);
    expect(el().querySelector('.paep-context-switcher__button')).toBeNull();
    const group = el().querySelector('.paep-context-switcher__static') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Current context');
    expect(text(group.querySelector('.paep-context-switcher__tenant'))).toBe('Northwind Holdings');
    expect(text(group.querySelector('.paep-context-switcher__site'))).toBe('Site 04');
  });

  it('offers a switch button named with the full context when more than one context is offered', async () => {
    await create(TEST_CONTEXTS);
    const button = el().querySelector('.paep-context-switcher__button') as HTMLButtonElement;
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-label')).toBe('Current context: Northwind Holdings, Site 04. Switch context');
    button.click();
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(text(dialog().querySelector('h2'))).toBe('Switch context');
    expect(dialog().querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('sends a switch request, shows the pending state, and on acceptance closes and focuses the page h1', async () => {
    await create(TEST_CONTEXTS);
    (el().querySelector('.paep-context-switcher__button') as HTMLButtonElement).click();
    await settle(fixture);
    (dialog().querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]).click();
    const submit = Array.from(dialog().querySelectorAll('button')).find((b) => text(b) === 'Request switch') as HTMLButtonElement;
    submit.click();
    await settle(fixture);
    expect(requests).toEqual([TEST_CONTEXTS[1]]);
    expect(text(dialog().querySelector('[role="status"]'))).toBe('Requesting a switch to Contoso Group…');
    resolveSwitch({ status: 'accepted' });
    await settle(fixture, 40);
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(el().querySelector('h1'));
  });

  it('on rejection keeps the dialog open, focuses the error with its reference, and keeps the current context', async () => {
    await create(TEST_CONTEXTS);
    (el().querySelector('.paep-context-switcher__button') as HTMLButtonElement).click();
    await settle(fixture);
    (dialog().querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]).click();
    (Array.from(dialog().querySelectorAll('button')).find((b) => text(b) === 'Request switch') as HTMLButtonElement).click();
    await settle(fixture);
    resolveSwitch({ status: 'rejected', reference: 'REF-1234-ABCD' });
    await settle(fixture, 40);
    expect(dialog().open).toBe(true);
    const outcome = dialog().querySelector('.paep-context-switcher__outcome') as HTMLElement;
    expect(document.activeElement).toBe(outcome);
    expect(text(outcome)).toContain('The switch to Contoso Group was not completed. You are still working in Northwind Holdings · Site 04.');
    expect(text(outcome.querySelector('code'))).toBe('REF-1234-ABCD');
  });

  it('shows the deep-link mismatch notice without switching anything; "Stay" dismisses it', async () => {
    await create(TEST_CONTEXTS);
    fixture.componentInstance.target.set(TEST_CONTEXTS[1]);
    await settle(fixture);
    const notice = el().querySelector('paep-context-switcher[data-mode="mismatch"] paep-alert') as HTMLElement;
    expect(text(notice)).toContain('This link belongs to another context');
    expect(text(notice)).toContain('The link you opened is for Contoso Group. You are working in Northwind Holdings · Site 04. Nothing has been switched.');
    expect(requests).toEqual([]);
    (Array.from(notice.querySelectorAll('button')).find((b) => text(b) === 'Stay in Northwind Holdings · Site 04') as HTMLButtonElement).click();
    await settle(fixture);
    expect(el().querySelector('paep-context-switcher[data-mode="mismatch"] paep-alert')).toBeNull();
    expect(requests).toEqual([]);
  });

  it('treats two sites of one tenant as different contexts and names the site in every message', async () => {
    const site07: PaepShellContext = { tenant: TEST_CONTEXTS[0].tenant, site: 'Site 07' };
    await create([TEST_CONTEXTS[0], site07]);
    (el().querySelector('.paep-context-switcher__button') as HTMLButtonElement).click();
    await settle(fixture);
    const radios = dialog().querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    radios[1].click();
    (Array.from(dialog().querySelectorAll('button')).find((b) => text(b) === 'Request switch') as HTMLButtonElement).click();
    await settle(fixture);
    expect(requests).toEqual([site07]);
    expect(text(dialog().querySelector('[role="status"]'))).toBe('Requesting a switch to Northwind Holdings · Site 07…');
    resolveSwitch({ status: 'rejected', reference: 'REF-5B1E-02AA' });
    await settle(fixture, 40);
    expect(text(dialog().querySelector('.paep-context-switcher__outcome'))).toContain(
      'The switch to Site 07 was not completed. You are still working in Northwind Holdings · Site 04.',
    );

    fixture.componentInstance.target.set(site07);
    await settle(fixture);
    const notice = el().querySelector('paep-context-switcher[data-mode="mismatch"] paep-alert') as HTMLElement;
    expect(text(notice)).toContain('The link you opened is for Northwind Holdings · Site 07. You are working in Northwind Holdings · Site 04.');
    expect(Array.from(notice.querySelectorAll('button')).map((b) => text(b))).toEqual(['Request switch to Site 07', 'Stay in Site 04']);
  });

  it('truncates long names in the topbar with the full text in its name and in the switch dialog', async () => {
    const tenant = 'Northwind Holdings International Group (Southern Africa Regional Operations)';
    const site = 'Site 04: Distribution Campus North-East Extension';
    const long: PaepShellContext = { tenant: { tenantId: 't-9', displayName: tenant }, site };
    await create([long, TEST_CONTEXTS[1]], long);
    const button = el().querySelector('.paep-context-switcher__button') as HTMLButtonElement;
    button.style.maxInlineSize = '14rem';
    await settle(fixture);
    expect(button.getAttribute('aria-label')).toBe(`Current context: ${tenant}, ${site}. Switch context`);
    const tenantLine = button.querySelector('.paep-context-switcher__tenant') as HTMLElement;
    expect(getComputedStyle(tenantLine).textOverflow).toBe('ellipsis');
    expect(tenantLine.scrollWidth).toBeGreaterThan(tenantLine.clientWidth);
    button.click();
    await settle(fixture);
    const option = dialog().querySelector('label') as HTMLElement;
    expect(text(option)).toBe(`${tenant} ${site}`);
    expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth);
  });
});
