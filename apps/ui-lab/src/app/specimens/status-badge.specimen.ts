import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepStatusBadge } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const STATUS_BADGE_META: LabSpecimenMeta = {
  id: 'status-badge',
  name: 'Status badge',
  family: 'Feedback',
  selector: 'paep-status-badge',
  exports: ['PaepStatusBadge', 'PaepStatusTone', 'PAEP_STATUS_ICONS'],
  purpose: 'Label the state of an item, for example in a table cell or card header.',
  variants: ['neutral', 'info', 'success', 'warning', 'error'],
  states: ['default (per tone)', 'long-label (wraps, icon stays on the first line)', 'narrow-width (wraps within the cell)'],
  keyboard: ['None: the badge is not interactive and not focusable.'],
  accessibility: [
    'Plain text inside a span; no role. The consumer maps domain states to a tone and provides the text.',
    'Icon is decorative (aria-hidden) with a distinct shape per tone, so status is never colour alone (WCAG 1.4.1).',
    'Uses the protected status colour tokens (text contrast at least 5.66:1).',
  ],
  responsive: 'Inline; long labels wrap at word boundaries and are never truncated.',
  rtl: 'Icon at inline-start; mirrors with the text direction.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/status-badge/status-badge.spec.ts',
};

@Component({
  selector: 'lab-status-badge-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepStatusBadge],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Tones">
        <div class="row">
          <paep-status-badge tone="neutral">Draft</paep-status-badge>
          <paep-status-badge tone="info">Scheduled</paep-status-badge>
          <paep-status-badge tone="success">Approved</paep-status-badge>
          <paep-status-badge tone="warning">Awaiting review</paep-status-badge>
          <paep-status-badge tone="error">Rejected</paep-status-badge>
        </div>
      </lab-example>
      <lab-example heading="Long label in a narrow cell">
        <div class="narrow">
          <paep-status-badge tone="warning">Awaiting review by the second approver in the regional office</paep-status-badge>
        </div>
      </lab-example>
      <lab-example heading="In running text">
        <p class="text">Record 1 is currently <paep-status-badge tone="success">Approved</paep-status-badge> and can be exported.</p>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .narrow {
      max-inline-size: 12rem;
    }
    .text {
      margin: 0;
    }
  `,
})
export class StatusBadgeSpecimen {
  protected readonly meta = STATUS_BADGE_META;
}
