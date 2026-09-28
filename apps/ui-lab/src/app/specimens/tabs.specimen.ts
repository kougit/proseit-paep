import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepTab, PaepTabs } from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const TABS_META: LabSpecimenMeta = {
  id: 'tabs',
  name: 'Tabs',
  family: 'Navigation',
  selector: 'paep-tabs, paep-tab',
  exports: ['PaepTabs', 'PaepTab', 'PaepTabsActivation'],
  purpose: 'Switch between peer views of the same object or region without navigation.',
  variants: ['default (automatic activation)', 'manual activation (opt-in)'],
  states: [
    'default (unselected)',
    'selected (3 px indicator bar + weight 600 + primary text; aria-selected)',
    'hover (neutral fill)',
    'focus-visible (inset ring inside the tab)',
    'disabled (aria-disabled; reachable with arrows; not activatable; reason via aria-describedby)',
    'long-label (wraps within 18 rem; no truncation)',
    'narrow-width (list scrolls inside its own box; edge scroll buttons)',
    'invalid (error icon + "Contains 2 errors" text in the tab)',
    'loading (the panel content handles loading; the tab itself is unchanged)',
  ],
  keyboard: [
    'Tab: moves into the list to the selected tab, then into the panel.',
    'ArrowLeft / ArrowRight: previous / next tab (mirrored in RTL), wrapping.',
    'Home / End: first / last tab.',
    'Automatic activation: arrows select. Manual activation: Enter / Space select.',
  ],
  accessibility: [
    'role=tablist (aria-label) / tab (aria-selected, aria-controls) / tabpanel (aria-labelledby).',
    'Roving tabindex; a panel is a Tab stop (tabindex=0) only if it has no focusable content.',
    'Selection uses a shape cue (indicator bar) and weight, not colour alone.',
    'Scroll buttons are aria-hidden pointer affordances; keyboard users use the arrow keys.',
  ],
  responsive: 'Never wraps to multiple rows: an overflowing list scrolls inside its own box, the selected tab is scrolled into view and edge scroll buttons appear.',
  rtl: 'Order and arrow semantics mirror; scroll buttons swap edges.',
  contentKeys: ['paep.tabs.scrollStart', 'paep.tabs.scrollEnd', 'paep.form.containsErrors'],
  unitTests: 'packages/components/src/lib/tabs/tabs.spec.ts',
};

@Component({
  selector: 'lab-tabs-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabSpecimenPage, LabExample, PaepTabs, PaepTab],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Automatic activation with count, error and disabled tabs">
        <paep-tabs label="Record 1 sections">
          <paep-tab label="Overview"><p class="p">Record 1 is stored at North depot.</p></paep-tab>
          <paep-tab label="Lines" [count]="12"><p class="p">12 lines.</p></paep-tab>
          <paep-tab label="Attachments" [errorCount]="2"><p class="p">Two attachments failed the size check.</p></paep-tab>
          <paep-tab label="Approvals" disabled disabledReason="Available after the record is submitted.">
            <p class="p">Approvals</p>
          </paep-tab>
        </paep-tabs>
      </lab-example>

      <lab-example heading="Manual activation (Enter or Space selects)">
        <paep-tabs label="Report views" activation="manual">
          <paep-tab label="Summary"><p class="p">Summary view.</p></paep-tab>
          <paep-tab label="By depot"><p class="p">Grouped by depot.</p></paep-tab>
          <paep-tab label="By month"><p class="p">Grouped by month.</p></paep-tab>
        </paep-tabs>
      </lab-example>

      <lab-example heading="Overflow (bounded scroll in a narrow container)">
        <div class="narrow">
          <paep-tabs label="Record 2 sections" [selectedIndex]="5">
            @for (t of many; track t) {
              <paep-tab [label]="t"><p class="p">{{ t }} panel.</p></paep-tab>
            }
          </paep-tabs>
        </div>
      </lab-example>

      <lab-example heading="Long labels">
        <paep-tabs label="Translated sections">
          <paep-tab label="A considerably longer translated tab label that wraps within its maximum width"><p class="p">First panel.</p></paep-tab>
          <paep-tab label="Short"><p class="p">Second panel.</p></paep-tab>
        </paep-tabs>
      </lab-example>

      <lab-example heading="Right-to-left">
        <div dir="rtl">
          <paep-tabs label="Record 3 sections">
            <paep-tab label="Overview"><p class="p">ArrowLeft moves to the next tab.</p></paep-tab>
            <paep-tab label="Lines"><p class="p">Lines panel.</p></paep-tab>
            <paep-tab label="History"><p class="p">History panel.</p></paep-tab>
          </paep-tabs>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .p {
      margin: 0;
    }
    .narrow {
      max-inline-size: calc(var(--paep-space-10) * 4);
    }
  `,
})
export class TabsSpecimen {
  protected readonly meta = TABS_META;
  protected readonly many = ['Overview', 'Lines', 'Attachments', 'Approvals', 'History', 'Related records', 'Audit trail', 'Notes'];
}
