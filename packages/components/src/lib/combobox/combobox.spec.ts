import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page, userEvent } from 'vitest/browser';
import { PaepCombobox, PaepComboboxGroup, PaepComboboxOption } from './combobox';

const GROUPS: readonly PaepComboboxGroup[] = [
  { id: 'goto', label: 'Go to', options: [{ id: 'audit', label: 'Audit log', description: 'Administration', icon: 'shield' }, { id: 'home', label: 'Home' }] },
  { id: 'actions', label: 'Actions', options: [{ id: 'export', label: 'Export audit summary' }] },
  { id: 'records', label: 'Records', options: [] },
];

@Component({
  imports: [PaepCombobox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <paep-combobox
      label="Search records, pages and commands"
      listboxLabel="Results"
      placeholder="Search or go to…"
      [groups]="groups()"
      [(query)]="query"
      (optionSelect)="chosen.push($event)"
    />
  `,
})
class Host {
  readonly groups = signal<readonly PaepComboboxGroup[]>(GROUPS);
  query = '';
  readonly chosen: PaepComboboxOption[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector('input') as HTMLInputElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const active = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim().replace(/\s+/g, ' ');
  return { fixture, el, input, host: fixture.componentInstance, settle, active };
}

describe('PaepCombobox', () => {
  it('is a named combobox controlling a named listbox of labelled option groups', async () => {
    const { el, input } = await setup();
    await expect.element(page.getByRole('combobox', { name: 'Search records, pages and commands' })).toBeInTheDocument();
    await expect.element(page.getByRole('listbox', { name: 'Results' })).toBeInTheDocument();
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-controls') ?? '')?.getAttribute('role')).toBe('listbox');
    const groups = [...el.querySelectorAll('[role="group"]')];
    // The empty "Records" group is not rendered.
    expect(groups.map((g) => document.getElementById(g.getAttribute('aria-labelledby') ?? '')?.textContent?.trim())).toEqual(['Go to', 'Actions']);
    await expect.element(page.getByRole('group', { name: 'Go to' })).toBeInTheDocument();
    expect(groups[0].querySelectorAll('[role="option"]').length).toBe(2);
    expect(el.querySelector('[role="option"] svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('starts on the first option and moves the active option with ↓ ↑ Home End while focus stays in the input', async () => {
    const { el, input, active, settle } = await setup();
    expect(active()).toBe('Audit log Administration');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle();
    expect(active()).toBe('Home');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await settle();
    expect(active()).toBe('Export audit summary');
    await userEvent.keyboard('{Home}');
    await settle();
    expect(active()).toBe('Audit log Administration');
    await userEvent.keyboard('{ArrowUp}');
    await settle();
    expect(active()).toBe('Audit log Administration');
    await userEvent.keyboard('{End}');
    await settle();
    expect(active()).toBe('Export audit summary');
    expect(document.activeElement).toBe(input);
    const selected = [...el.querySelectorAll('[role="option"][aria-selected="true"]')];
    expect(selected.length).toBe(1);
    expect(selected[0].id).toBe(input.getAttribute('aria-activedescendant'));
  });

  it('Enter selects the active option; a click selects an option without taking focus from the input', async () => {
    const { el, input, host, settle } = await setup();
    input.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle();
    expect(host.chosen.map((o) => o.id)).toEqual(['home']);
    await userEvent.click(el.querySelectorAll('[role="option"]')[2] as HTMLElement);
    await settle();
    expect(host.chosen.map((o) => o.id)).toEqual(['home', 'export']);
    expect(document.activeElement).toBe(input);
  });

  it('typing updates the two-way query; with no options the listbox is removed and the combobox collapses', async () => {
    const { el, input, host, settle } = await setup();
    input.focus();
    await userEvent.keyboard('aud');
    await settle();
    expect(host.query).toBe('aud');
    host.groups.set([{ id: 'goto', label: 'Go to', options: [] }]);
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    await userEvent.keyboard('{Enter}');
    expect(host.chosen.length).toBe(0);
  });

  it('keeps the active option while it is still offered and falls back to the first option otherwise', async () => {
    const { input, host, active, settle } = await setup();
    input.focus();
    await userEvent.keyboard('{End}');
    await settle();
    expect(active()).toBe('Export audit summary');
    host.groups.set([GROUPS[1], GROUPS[0]]);
    await settle();
    expect(active()).toBe('Export audit summary');
    host.groups.set([GROUPS[0]]);
    await settle();
    expect(active()).toBe('Audit log Administration');
  });
});
