import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PaepButton, PaepPopover, PaepPopoverTrigger } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const POPOVER_META: LabSpecimenMeta = {
  id: 'popover',
  name: 'Popover',
  family: 'Overlay',
  selector: 'paep-popover, [paepPopoverTrigger]',
  exports: ['PaepPopover', 'PaepPopoverTrigger', 'PaepPopoverVariant', 'PaepPopoverFocus'],
  purpose: 'Show short, non-essential supplementary content or a small set of options anchored to a trigger.',
  variants: ['informational (text)', 'informational with links', 'menu (role="menu")'],
  states: [
    'open (anchored below the trigger at its inline-start edge)',
    'flipped (opens above when there is not enough space below; shifts to stay 16 px inside the viewport)',
    'narrow-width (width min(20 rem, 100vw - 32 px); still anchored)',
    'long-label (content wraps; max-height 60% of the viewport, then inner scroll)',
    'focus-visible (trigger and content controls)',
    'disabled (trigger disabled)',
  ],
  keyboard: [
    'Enter / Space on the trigger: toggles.',
    'Escape: closes and returns focus to the trigger.',
    'Tab past the last element: closes and continues in page order (non-modal).',
    'Menu: ArrowDown / ArrowUp on the trigger open on the first / last item; ArrowUp/ArrowDown/Home/End move between items.',
  ],
  accessibility: [
    'Trigger exposes aria-expanded and aria-controls (aria-haspopup="menu" for menus).',
    'Uses the HTML popover attribute (light dismiss "auto") with a script that anchors, flips and shifts the panel.',
    'Informational text: focus stays on the trigger and the panel describes it (aria-describedby) while open. Interactive content: focus moves to the first control.',
    'Hover never opens a popover (WCAG 1.4.13 not triggered).',
  ],
  responsive: 'Max 20 rem wide; below that min(20 rem, 100vw - 32 px); flips block-side and shifts inline to stay inside the viewport.',
  rtl: 'Aligns to the trigger’s right edge (inline-start) in RTL.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/popover/popover.spec.ts',
};

@Component({
  selector: 'lab-popover-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepPopover, PaepPopoverTrigger, PaepButton],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Informational (focus stays on the trigger)">
        <button paepButton icon="info" [paepPopoverTrigger]="statusInfo">About the Pending status</button>
        <paep-popover #statusInfo>
          <p class="p">Pending means the record is waiting for review by a second person.</p>
        </paep-popover>
      </lab-example>

      <lab-example heading="With interactive content (focus moves into the panel)">
        <button paepButton trailingIcon="chevron-down" [paepPopoverTrigger]="related">Related records</button>
        <paep-popover #related>
          <ul class="links">
            <li><a href="#lab-examples">Record 2</a></li>
            <li><a href="#lab-examples">Record 3</a></li>
          </ul>
        </paep-popover>
      </lab-example>

      <lab-example heading="Menu variant">
        <button paepButton icon="more" [paepPopoverTrigger]="menu">More actions</button>
        <paep-popover #menu variant="menu">
          @for (action of actions; track action) {
            <button type="button" role="menuitem" class="item" (click)="run(action, menu)">{{ action }}</button>
          }
        </paep-popover>
        @if (lastAction()) {
          <p class="note" role="status">{{ lastAction() }} selected.</p>
        }
      </lab-example>

      <lab-example heading="Long content and inline-end placement (shifts inside the viewport)">
        <div class="end">
          <button paepButton [paepPopoverTrigger]="long">Retention details</button>
        </div>
        <paep-popover #long>
          @for (n of paragraphs; track n) {
            <p class="p">Rule {{ n }}. Records are kept for the configured period and then archived; archived records stay searchable.</p>
          }
        </paep-popover>
      </lab-example>

      <lab-example heading="Disabled trigger">
        <button paepButton disabled [paepPopoverTrigger]="disabledInfo">Approval history</button>
        <paep-popover #disabledInfo><p class="p">Not available.</p></paep-popover>
        <p class="note">Available after the record is submitted.</p>
      </lab-example>

      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <button paepButton [paepPopoverTrigger]="rtlInfo">About this field</button>
          <paep-popover #rtlInfo><p class="p">The panel aligns to the trigger's right edge.</p></paep-popover>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .p {
      margin: 0 0 var(--paep-space-2);
    }
    .p:last-child {
      margin-block-end: 0;
    }
    .links {
      margin: 0;
      padding-inline-start: var(--paep-space-5);
    }
    .links a {
      display: inline-block;
      min-block-size: var(--paep-size-target-min);
      color: var(--paep-color-link);
    }
    .item {
      display: block;
      inline-size: 100%;
      min-block-size: var(--paep-density-control-height);
      padding-inline: var(--paep-space-3);
      border: 0;
      border-radius: var(--paep-radius-sm);
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .item:hover {
      background: var(--paep-color-hover-neutral);
    }
    .note {
      margin: var(--paep-space-2) 0 0;
    }
    .end {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class PopoverSpecimen {
  protected readonly meta = POPOVER_META;
  protected readonly actions = ['Duplicate', 'Archive', 'Export'];
  protected readonly paragraphs = Array.from({ length: 12 }, (_, i) => i + 1);
  protected readonly lastAction = signal('');

  protected run(action: string, menu: PaepPopover): void {
    this.lastAction.set(action);
    menu.hide(true);
  }
}
