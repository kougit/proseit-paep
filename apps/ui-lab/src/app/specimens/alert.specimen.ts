import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepAlert, PaepAlertStatus } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const ALERT_META: LabSpecimenMeta = {
  id: 'alert',
  name: 'Alert',
  family: 'Feedback',
  selector: 'paep-alert',
  exports: ['PaepAlert', 'PaepAlertStatus'],
  purpose: 'Persistent inline feedback about a region or the page.',
  variants: ['info', 'success', 'warning', 'error', 'persistent (default)', 'dismissible (info, success and warning only)'],
  states: [
    'default (per status)',
    'focus-visible (actions and dismiss)',
    'long-label (long body wraps and stays inline)',
    'narrow-width (icon and text column; actions wrap under the body)',
    'dismissed (removed; focus moves to the region heading)',
    'inserted dynamically (live role)',
  ],
  keyboard: ['Tab: reaches actions and the dismiss button.', 'Enter / Space: activates them.'],
  accessibility: [
    'Present at load: static content, no live role. Inserted dynamically (live): role="alert" for error, role="status" otherwise.',
    'Distinct icon shape per status plus a visually hidden status word ("Error") before the content (WCAG 1.4.1).',
    'Error alerts are never dismissible. Dismiss has the accessible name "Dismiss".',
    'Not auto-focused, except an error summary after a failed submit (focus() with tabindex=-1).',
  ],
  responsive: 'Full width of its container; actions wrap under the body.',
  rtl: 'Icon at inline-start, dismiss at inline-end.',
  contentKeys: ['paep.status.info', 'paep.status.success', 'paep.status.warning', 'paep.status.error', 'paep.common.dismiss', 'paep.common.retry'],
  unitTests: 'packages/components/src/lib/alert/alert.spec.ts',
};

@Component({
  selector: 'lab-alert-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepAlert],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Statuses (static, present at load)">
        <div class="stack">
          <paep-alert status="info" heading="Scheduled maintenance">The service is read-only on Saturday from 06:00 to 08:00.</paep-alert>
          <paep-alert status="success">Record 1 was saved.</paep-alert>
          <paep-alert status="warning" heading="Unsaved changes">Two fields changed since the last save.</paep-alert>
          <paep-alert status="error" heading="Records could not be loaded">The service did not respond. Nothing was changed.</paep-alert>
        </div>
      </lab-example>
      <lab-example heading="With actions">
        <paep-alert status="error" heading="Records could not be loaded">
          The service did not respond. Nothing was changed. Reference: 7F3A-22C1.
          <button paepAlertActions type="button" class="lab-action">Retry</button>
        </paep-alert>
      </lab-example>
      <lab-example heading="Dismissible (focus returns to the region heading)">
        <p class="lab-heading" #dismissHeading>Import summary</p>
        @if (dismissedCount() > 0) {
          <p class="note">Dismissed {{ dismissedCount() }} time(s).</p>
          <button type="button" class="lab-action" (click)="restore()">Show the alert again</button>
        }
        @if (showDismissible()) {
          <paep-alert status="warning" dismissible heading="Three rows were skipped" [focusAfterDismiss]="dismissHeading" (dismissed)="onDismissed()">
            Rows 12, 18 and 40 had no quantity.
          </paep-alert>
        }
      </lab-example>
      <lab-example heading="Inserted dynamically (announced)">
        <div class="row">
          @for (s of statuses; track s) {
            <button type="button" class="lab-action" (click)="insert(s)">Insert {{ s }}</button>
          }
        </div>
        @if (inserted(); as s) {
          <paep-alert class="gap" [status]="s" live>A {{ s }} message inserted after load.</paep-alert>
        }
      </lab-example>
      <lab-example heading="Long content">
        <paep-alert status="info" heading="A long title that wraps across several lines when the container is narrow or the text is translated">
          Very long content stays inline and never scrolls inside the alert, because it is page content. Reference
          REC-2026-000185-ATTACHMENT-ARCHIVE-0001-NORTH-DEPOT breaks anywhere instead of overflowing the container.
        </paep-alert>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--paep-space-3);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .gap {
      margin-block-start: var(--paep-space-3);
    }
    .lab-heading {
      margin: 0 0 var(--paep-space-2);
      font-weight: var(--paep-font-weight-label);
    }
    .note {
      margin: 0 0 var(--paep-space-2);
    }
    .lab-action {
      min-block-size: var(--paep-size-target-touch);
    }
  `,
})
export class AlertSpecimen {
  protected readonly meta = ALERT_META;
  protected readonly statuses: readonly PaepAlertStatus[] = ['info', 'success', 'warning', 'error'];
  protected readonly inserted = signal<PaepAlertStatus | null>(null);
  protected readonly showDismissible = signal(true);
  protected readonly dismissedCount = signal(0);

  protected insert(s: PaepAlertStatus): void {
    this.inserted.set(null);
    setTimeout(() => this.inserted.set(s), 50);
  }

  protected onDismissed(): void {
    this.dismissedCount.update((n) => n + 1);
    setTimeout(() => this.showDismissible.set(false));
  }

  protected restore(): void {
    this.showDismissible.set(true);
  }
}
