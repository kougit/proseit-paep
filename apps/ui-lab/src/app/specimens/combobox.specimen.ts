import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PaepCombobox, PaepComboboxGroup, PaepComboboxOption, PaepEmptyState } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const COMBOBOX_META: LabSpecimenMeta = {
  id: 'combobox',
  name: 'Combobox',
  family: 'Forms',
  selector: 'paep-combobox',
  exports: ['PaepCombobox', 'PaepComboboxGroup', 'PaepComboboxOption'],
  purpose: 'Text input with a listbox of grouped options that the host filters from the query (HOF-IB3-001 P-03; the command palette composes it).',
  variants: ['grouped options (each group named by its visible label)', 'options with a secondary line and a decorative icon'],
  states: [
    'default (first option active)',
    'typing (the host filters the groups; the active option is kept while it is still offered)',
    'active option (selected fill, focus ring, aria-activedescendant)',
    'no options (listbox removed, aria-expanded false; the host shows its own empty state)',
    'long-label (options wrap)',
    'narrow-width (full width, options wrap)',
  ],
  keyboard: [
    'Typing: updates the query; the host filters.',
    '↓ / ↑: move the active option (focus stays in the input).',
    'Home / End: first / last option.',
    'Enter: select the active option. A click selects without moving focus.',
  ],
  accessibility: [
    'input role="combobox" with aria-autocomplete="list", aria-expanded and aria-controls (only while the listbox exists).',
    'The active option is conveyed with aria-activedescendant and aria-selected; it shows the focus ring as well as the selected fill.',
    'Options sit in role="group" containers named by their visible group label (aria-labelledby).',
    'The host announces result counts in its own polite live region after a typing pause, never per keystroke.',
    'Option text is consumer-provided plain text; it is never rendered as HTML.',
  ],
  responsive: 'Fills its container; the listbox scrolls when the host limits the combobox block size.',
  rtl: 'Logical properties; icons sit at the inline start; no directional icons.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/combobox/combobox.spec.ts',
};

const ALL: readonly PaepComboboxGroup[] = [
  {
    id: 'goto',
    label: 'Go to',
    options: [
      { id: 'home', label: 'Home', description: 'Overview', icon: 'home' },
      { id: 'records', label: 'All records', description: 'Records', icon: 'list' },
      { id: 'audit', label: 'Audit log', description: 'Administration', icon: 'shield' },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    options: [
      { id: 'export', label: 'Export audit summary', description: 'Action on this page', icon: 'document' },
      { id: 'prefs', label: 'Display preferences', icon: 'sliders' },
    ],
  },
  {
    id: 'records',
    label: 'Records',
    options: [
      { id: 'r1', label: 'Record 1 — northern depot stock movement awaiting second-level review', description: 'Pending', icon: 'tasks' },
      { id: 'r2', label: 'Record 2', description: 'Approved', icon: 'tasks' },
    ],
  },
];

@Component({
  selector: 'lab-combobox-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepCombobox, PaepEmptyState],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Grouped options, filtered by the host">
        <div class="box">
          <paep-combobox
            label="Search records, pages and commands"
            [listboxLabel]="query() ? 'Results' : 'Suggestions'"
            placeholder="Search or go to…"
            [groups]="groups()"
            [(query)]="query"
            (optionSelect)="choose($event)"
          />
          @if (!groups().length) {
            <paep-empty-state kind="no-results" [headingLevel]="4" [heading]="'No results for “' + query() + '”'" description="Check the spelling or try a shorter search." actionLabel="" />
          }
        </div>
        <p class="note" aria-live="polite">{{ chosen() }}</p>
      </lab-example>
      <lab-example heading="Limited block size (the listbox scrolls)">
        <div class="box box--short">
          <paep-combobox label="Go to a page" listboxLabel="Pages" [groups]="all" />
        </div>
      </lab-example>
      <lab-example heading="Right-to-left">
        <div class="box" dir="rtl">
          <paep-combobox label="Search (right-to-left)" listboxLabel="Results (right-to-left)" [groups]="all.slice(0, 1)" />
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .box {
      max-inline-size: calc(var(--paep-space-10) * 7);
    }
    .box--short paep-combobox {
      max-block-size: calc(var(--paep-space-10) * 3);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
      min-block-size: var(--paep-space-6);
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class ComboboxSpecimen {
  protected readonly meta = COMBOBOX_META;
  protected readonly all = ALL;
  protected readonly query = signal('');
  protected readonly chosen = signal('');
  protected readonly groups = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return ALL.slice(0, 2);
    return ALL.map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q)) })).filter((g) => g.options.length);
  });

  protected choose(option: PaepComboboxOption): void {
    this.chosen.set(`Selected: ${option.label}`);
  }
}
