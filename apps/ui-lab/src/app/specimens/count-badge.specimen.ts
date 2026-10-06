import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepCount, PaepCountBadge } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const COUNT_BADGE_META: LabSpecimenMeta = {
  id: 'count-badge',
  name: 'Count badge',
  family: 'Feedback',
  selector: 'paep-count-badge',
  exports: ['PaepCountBadge', 'PaepCount', 'PaepCountBadgeVariant'],
  purpose: 'Show a count next to a label, for example on a navigation item (HOF-IB3-001 P-04). The status badge is never used for counts.',
  variants: ['neutral (informational counts; default)', 'attention (unread or actionable counts)', 'icon-only controls use the icon button count input'],
  states: [
    'count (value in the badge; hidden text in the owning name)',
    'capped (above max, "99+")',
    'loading (spinner; hidden "Loading count")',
    'unknown ("–"; hidden "Count not available")',
    'narrow-width (unchanged; fixed block size)',
  ],
  keyboard: ['None: the badge is not interactive; the owning link or button takes focus.'],
  accessibility: [
    'The visible value is aria-hidden and dir="ltr"; visually hidden text appended to the owning name carries it (", 12 items").',
    'The host template (label) words the count ("{count} unread"); the default is paep.count.items.',
    'Loading and unknown are never shown as 0; each has its own hidden text.',
    'No role and no live region; the host announces count increases (batched, polite).',
  ],
  responsive: 'Fixed 1.25 rem block size; grows with the digits up to "99+".',
  rtl: 'Placed by the host with logical properties; the number stays left-to-right ("99+").',
  contentKeys: ['paep.count.items', 'paep.count.loading', 'paep.count.unknown', 'paep.count.inName'],
  unitTests: 'packages/components/src/lib/count-badge/count-badge.spec.ts',
};

@Component({
  selector: 'lab-count-badge-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepCountBadge],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Counts on navigation links">
        <ul class="links">
          <li><a href="#work-items"><span>Work items</span><paep-count-badge [count]="12" /></a></li>
          <li><a href="#approvals"><span>Approvals</span><paep-count-badge [count]="120" /></a></li>
          <li><a href="#tasks"><span>Tasks</span><paep-count-badge [count]="loading" /></a></li>
          <li><a href="#schedules"><span>Schedules</span><paep-count-badge [count]="unknown" /></a></li>
          <li><a href="#messages"><span>Messages</span><paep-count-badge variant="attention" label="{count} unread" [count]="3" /></a></li>
        </ul>
      </lab-example>
      <lab-example heading="Maximum 9">
        <ul class="links">
          <li><a href="#alerts"><span>Alerts</span><paep-count-badge [max]="9" [count]="14" /></a></li>
        </ul>
      </lab-example>
      <lab-example heading="Right-to-left">
        <ul class="links" dir="rtl">
          <li><a href="#rtl-items"><span>Work items (right-to-left)</span><paep-count-badge [count]="120" /></a></li>
        </ul>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .links {
      display: grid;
      gap: var(--paep-space-2);
      max-inline-size: calc(var(--paep-space-10) * 5);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .links a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--paep-space-2);
      min-block-size: var(--paep-size-target-touch);
      padding-inline: var(--paep-space-2);
    }
  `,
})
export class CountBadgeSpecimen {
  protected readonly meta = COUNT_BADGE_META;
  protected readonly loading: PaepCount = 'loading';
  protected readonly unknown: PaepCount = 'unknown';
}
