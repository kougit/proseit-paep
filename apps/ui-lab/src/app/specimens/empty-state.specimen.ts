import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepEmptyState } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const EMPTY_STATE_META: LabSpecimenMeta = {
  id: 'empty-state',
  name: 'Empty state',
  family: 'Data',
  selector: 'paep-empty-state',
  exports: ['PaepEmptyState', 'PaepEmptyStateKind', 'PaepHeadingLevel'],
  purpose: 'Explain why a collection has nothing to show and what to do next.',
  variants: ['empty (tray icon, "No records yet", optional create action)', 'no-results (search-with-cross icon, "No records match the current filters", Clear filters)'],
  states: ['default (per kind)', 'focus-visible (action)', 'disabled (action disabled with a visible reason)', 'long-label (wraps, 36 rem measure)', 'narrow-width (centred stack, reduced padding)'],
  keyboard: ['None of its own; Tab reaches the action, Enter / Space activates it.'],
  accessibility: [
    'Heading element with a configurable level (2-6); the icon is decorative (aria-hidden).',
    'Empty and no-results differ in icon, heading and action text.',
    'Focus is never moved automatically; the host collection announces the state in its polite live region.',
    'A disabled action shows why (aria-describedby); hiding or disabling is never the authorisation control.',
  ],
  responsive: 'Centred stack; padding reduces in narrow containers.',
  rtl: 'Centred; no mirroring needed.',
  contentKeys: ['paep.empty.title', 'paep.empty.body', 'paep.noResults.title', 'paep.noResults.body', 'paep.noResults.clear'],
  unitTests: 'packages/components/src/lib/empty-state/empty-state.spec.ts',
};

@Component({
  selector: 'lab-empty-state-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepEmptyState],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Empty with create action">
        <paep-empty-state kind="empty" [headingLevel]="4" actionLabel="Create record" (action)="log('Create record activated')" />
      </lab-example>
      <lab-example heading="No results">
        <paep-empty-state kind="no-results" [headingLevel]="4" (action)="log('Clear filters activated')" />
      </lab-example>
      <lab-example heading="Disabled action with reason">
        <paep-empty-state
          kind="empty"
          [headingLevel]="4"
          actionLabel="Create record"
          actionDisabled
          actionDisabledReason="You do not have permission to create records."
        />
      </lab-example>
      <lab-example heading="Long text, no action">
        <paep-empty-state
          kind="empty"
          [headingLevel]="4"
          heading="No stock movements have been recorded for the northern depot in the selected reporting period"
          description="Movements recorded by any team member appear here after they are approved by the depot supervisor."
        />
      </lab-example>
      <p class="log" aria-live="polite">{{ message() }}</p>
    </lab-specimen-page>
  `,
  styles: `
    .log {
      margin: 0;
      min-block-size: var(--paep-space-6);
    }
  `,
})
export class EmptyStateSpecimen {
  protected readonly meta = EMPTY_STATE_META;
  protected readonly message = signal('');
  protected log(m: string): void {
    this.message.set(m);
  }
}
