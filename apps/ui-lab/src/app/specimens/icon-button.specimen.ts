import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepCount, PaepIconButton } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const ICON_BUTTON_META: LabSpecimenMeta = {
  id: 'icon-button',
  name: 'Icon button',
  family: 'Actions',
  selector: 'button[paepIconButton]',
  exports: ['PaepIconButton', 'PaepIconButtonVariant'],
  purpose: 'Compact action whose meaning is conventional and unambiguous (close, more actions, previous/next page, collapse).',
  variants: [
    'tertiary (borderless; default)',
    'secondary (bordered)',
    'no primary or destructive icon-only variant',
    'count (HOF-IB3-001 P-04: count badge at the inline-end corner; attention or neutral)',
  ],
  states: [
    'default',
    'hover (neutral fill, pointer only)',
    'focus-visible (standard ring)',
    'active/pressed (neutral active fill)',
    'disabled (native disabled + dashed border)',
    'loading (spinner replaces the icon, aria-busy, activation suppressed)',
    'narrow-width (unchanged; never below the target size)',
    'count (number in the badge and the name; 0 shows no badge)',
    'count capped ("99+" in the badge and the name)',
    'count loading (spinner badge; "Loading count" in the name)',
    'count unknown ("–" badge; "Count not available" in the name)',
  ],
  keyboard: ['Enter / Space: activate.'],
  accessibility: [
    'The label input is mandatory and becomes aria-label; there is no title or tooltip fallback (IB2 has no tooltip).',
    'The icon is aria-hidden; the accessible name matches the conventional meaning.',
    'Square target of the control height: 40 × 40 comfortable, 32 × 32 compact (at least 24 × 24).',
    'Count: the badge is aria-hidden; the count is appended to the name ("Notifications, 3 unread") with the host template (countLabel); the number is dir="ltr".',
  ],
  responsive: 'Unchanged across profiles.',
  rtl: 'Directional icons (chevron-start/end, page-first/last, panel-start, sign-out) mirror; non-directional icons do not. The count badge moves to the inline-end corner and "99+" stays left-to-right.',
  contentKeys: ['paep.common.close', 'paep.action.moreActions', 'paep.pagination.previousPage', 'paep.pagination.nextPage', 'paep.count.items', 'paep.count.loading', 'paep.count.unknown', 'paep.count.inName'],
  unitTests: 'packages/components/src/lib/icon-button/icon-button.spec.ts',
};

@Component({
  selector: 'lab-icon-button-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepIconButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Variants">
        <div class="row">
          <button paepIconButton icon="close" label="Close" (click)="count()"></button>
          <button paepIconButton variant="secondary" icon="more" label="More actions" (click)="count()"></button>
          <button paepIconButton variant="secondary" icon="chevron-start" label="Previous page" (click)="count()"></button>
          <button paepIconButton variant="secondary" icon="chevron-end" label="Next page" (click)="count()"></button>
        </div>
        <p class="note">Activated {{ activations() }} time(s).</p>
      </lab-example>
      <lab-example heading="Disabled">
        <div class="row">
          <button paepIconButton icon="close" label="Close" disabled></button>
          <button paepIconButton variant="secondary" icon="chevron-end" label="Next page" disabled></button>
        </div>
      </lab-example>
      <lab-example heading="Loading">
        <div class="row">
          <button paepIconButton variant="secondary" icon="retry" label="Retry" [loading]="busy()" (click)="retry()"></button>
        </div>
      </lab-example>
      <lab-example heading="Count">
        <div class="row">
          <button paepIconButton icon="bell" label="Notifications" countLabel="{count} unread" [count]="unread()" (click)="unread.set(unread() + 1)"></button>
          <button paepIconButton icon="bell" label="Notifications" countLabel="{count} unread" [count]="120"></button>
          <button paepIconButton icon="bell" label="Notifications" countLabel="{count} unread" [count]="loadingCount"></button>
          <button paepIconButton icon="bell" label="Notifications" countLabel="{count} unread" [count]="unknownCount"></button>
          <button paepIconButton icon="bell" label="Notifications" [count]="0"></button>
          <button paepIconButton variant="secondary" icon="list" label="Records" countVariant="neutral" [count]="12"></button>
        </div>
        <p class="note">Activate the first button to add an unread item ({{ unread() }}).</p>
      </lab-example>
      <lab-example heading="Compact density (32 × 32)">
        <div class="row" data-paep-density="compact">
          <button paepIconButton icon="close" label="Close"></button>
          <button paepIconButton variant="secondary" icon="more" label="More actions"></button>
        </div>
      </lab-example>
      <lab-example heading="Right-to-left (directional icons mirror)">
        <div class="row" dir="rtl">
          <button paepIconButton variant="secondary" icon="chevron-start" label="Previous page"></button>
          <button paepIconButton variant="secondary" icon="chevron-end" label="Next page"></button>
          <button paepIconButton icon="close" label="Close"></button>
          <button paepIconButton icon="panel-start" label="Collapse navigation"></button>
          <button paepIconButton icon="bell" label="Notifications" countLabel="{count} unread" [count]="120"></button>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
      color: var(--paep-color-text-secondary);
    }
  `,
})
export class IconButtonSpecimen {
  protected readonly meta = ICON_BUTTON_META;
  protected readonly activations = signal(0);
  protected readonly busy = signal(false);
  protected readonly unread = signal(3);
  protected readonly loadingCount: PaepCount = 'loading';
  protected readonly unknownCount: PaepCount = 'unknown';

  protected count(): void {
    this.activations.update((n) => n + 1);
  }

  protected retry(): void {
    this.busy.set(true);
    setTimeout(() => this.busy.set(false), 1500);
  }
}
