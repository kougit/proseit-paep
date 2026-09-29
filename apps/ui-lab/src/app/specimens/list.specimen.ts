import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepCollectionState, PaepList, PaepListItem } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const LIST_META: LabSpecimenMeta = {
  id: 'list',
  name: 'List',
  family: 'Data',
  selector: 'paep-list',
  exports: ['PaepList', 'PaepListItem', 'PaepCollectionState'],
  purpose: 'Show a vertical collection of items where column comparison is not needed.',
  variants: ['plain', 'with meta (text, number or status badge)', 'with action (per-item tertiary button)'],
  states: [
    'loading (skeleton items, aria-busy, hidden "Loading…")',
    'empty (empty state)',
    'filtered/no-results (no-results state)',
    'populated',
    'error (error alert with Retry; after reload focus moves to the list heading)',
    'focus-visible (links and actions)',
    'long-label (primary and secondary text wrap; meta max 45% width)',
    'narrow-width (meta moves below the text under 20 rem)',
    'hover (not used: items are not interactive)',
  ],
  keyboard: ['Tab: reaches links and item actions only.', 'Enter / Space: activates an action.'],
  accessibility: [
    'Native <ul>/<li> semantics; optional accessible name for the list.',
    'State changes are announced in a polite live region and never move focus (except after Retry).',
    'Icons are decorative; status meta uses the status badge (text + icon).',
    'Bounded: renders every item it is given; page larger collections.',
  ],
  responsive: 'Fluid; trailing meta moves below the text in containers under 20 rem.',
  rtl: 'Leading icon and meta mirror.',
  contentKeys: ['paep.common.loading', 'paep.common.retry', 'paep.table.errorTitle', 'paep.table.errorBody', 'paep.empty.title', 'paep.noResults.title', 'paep.noResults.clear'],
  unitTests: 'packages/components/src/lib/list/list.spec.ts',
};

const ITEMS: readonly PaepListItem[] = [
  { id: '1', primary: 'Sample item Alpha', href: '/components/list', secondary: 'North depot · Updated 2026-09-21', icon: 'contents', status: { tone: 'success', label: 'Approved' } },
  {
    id: '2',
    primary: 'Sample item Beta with a longer descriptive name that wraps onto a second line',
    href: '/components/list',
    secondary: 'Reference REC-2026-000185-ATTACHMENT-ARCHIVE-0001',
    icon: 'contents',
    status: { tone: 'warning', label: 'Awaiting review' },
  },
  { id: '3', primary: 'Sample item Gamma', secondary: 'South yard', icon: 'contents', meta: '12,904.75', metaNumeric: true },
  { id: '4', primary: 'Sample item Delta', secondary: 'Site 2', actionLabel: 'Remove' },
];

@Component({
  selector: 'lab-list-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepList],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="States (choose a state)">
        <div class="row" role="group" aria-label="List state">
          @for (s of states; track s) {
            <button type="button" [attr.aria-pressed]="state() === s" (click)="state.set(s)">{{ s }}</button>
          }
        </div>
        <p class="list-heading" #heading>Recent items</p>
        <paep-list
          [items]="items"
          [state]="state()"
          label="Recent items"
          [focusTarget]="heading"
          emptyActionLabel="Create record"
          (retry)="reload()"
          (clearFilters)="state.set('populated')"
          (itemAction)="acted.set($event.primary)"
        />
        <p aria-live="polite" class="note">{{ acted() ? 'Action on ' + acted() : '' }}</p>
      </lab-example>
      <lab-example heading="Narrow container (meta below text under 20 rem)">
        <div class="narrow">
          <paep-list [items]="items" label="Recent items, narrow" />
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
      margin-block-end: var(--paep-space-3);
    }
    button {
      min-block-size: var(--paep-size-target-touch);
    }
    button[aria-pressed='true'] {
      font-weight: var(--paep-font-weight-label);
      box-shadow: inset 0 -3px 0 var(--paep-color-selected-indicator);
    }
    .list-heading {
      margin: 0 0 var(--paep-space-2);
      font-weight: var(--paep-font-weight-label);
    }
    .narrow {
      max-inline-size: 18rem;
    }
    .note {
      margin: var(--paep-space-2) 0 0;
    }
  `,
})
export class ListSpecimen {
  protected readonly meta = LIST_META;
  protected readonly items = ITEMS;
  protected readonly states: readonly PaepCollectionState[] = ['populated', 'loading', 'empty', 'no-results', 'error'];
  protected readonly state = signal<PaepCollectionState>('populated');
  protected readonly acted = signal('');

  protected reload(): void {
    this.state.set('loading');
    setTimeout(() => this.state.set('populated'), 1200);
  }
}
