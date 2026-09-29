import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepIconButton } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const ICON_BUTTON_META: LabSpecimenMeta = {
  id: 'icon-button',
  name: 'Icon button',
  family: 'Actions',
  selector: 'button[paepIconButton]',
  exports: ['PaepIconButton', 'PaepIconButtonVariant'],
  purpose: 'Compact action whose meaning is conventional and unambiguous (close, more actions, previous/next page, collapse).',
  variants: ['tertiary (borderless; default)', 'secondary (bordered)', 'no primary or destructive icon-only variant'],
  states: [
    'default',
    'hover (neutral fill, pointer only)',
    'focus-visible (standard ring)',
    'active/pressed (neutral active fill)',
    'disabled (native disabled + dashed border)',
    'loading (spinner replaces the icon, aria-busy, activation suppressed)',
    'narrow-width (unchanged; never below the target size)',
  ],
  keyboard: ['Enter / Space: activate.'],
  accessibility: [
    'The label input is mandatory and becomes aria-label; there is no title or tooltip fallback (IB2 has no tooltip).',
    'The icon is aria-hidden; the accessible name matches the conventional meaning.',
    'Square target of the control height: 40 × 40 comfortable, 32 × 32 compact (at least 24 × 24).',
  ],
  responsive: 'Unchanged across profiles.',
  rtl: 'Directional icons (chevron-start/end, page-first/last) mirror; non-directional icons do not.',
  contentKeys: ['paep.common.close', 'paep.action.moreActions', 'paep.pagination.previousPage', 'paep.pagination.nextPage'],
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

  protected count(): void {
    this.activations.update((n) => n + 1);
  }

  protected retry(): void {
    this.busy.set(true);
    setTimeout(() => this.busy.set(false), 1500);
  }
}
