import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PaepButton,
  PaepIconButton,
  PaepMenu,
  PaepMenuGroup,
  PaepMenuItem,
  PaepMenuItemRadio,
  PaepMenuSeparator,
  PaepMenuTrigger,
} from '@proseit/paep-components';
import { LabExample, LabSpecimenPage } from '../lab/specimen-page';
import { LabSpecimenMeta } from '../lab/specimen-meta';

export const MENU_META: LabSpecimenMeta = {
  id: 'menu',
  name: 'Menu',
  family: 'Overlay',
  selector: 'paep-menu, [paepMenuTrigger], [paepMenuItem], [paepMenuItemRadio], paep-menu-group, hr[paepMenuSeparator]',
  exports: ['PaepMenu', 'PaepMenuTrigger', 'PaepMenuItem', 'PaepMenuItemRadio', 'PaepMenuGroup', 'PaepMenuSeparator'],
  purpose:
    'A menu button and its menu of actions, links and single-choice options (HOF-IB2-001 v1.2 §2.2, P-02), composed on the popover positioning base. Used by the account, help, language and "More" menus.',
  variants: [
    'action items (paepMenuItem buttons, optional icon, destructive tone)',
    'link items (a paepMenuItem)',
    'radio group (paep-menu-group with paepMenuItemRadio items)',
    'align="start" (default) or align="end"',
  ],
  states: [
    'closed (button aria-expanded="false")',
    'open (focus on the first item, or the last when opened with ArrowUp)',
    'link item (a role="menuitem"; Enter or Space follows it)',
    'radio group (one item aria-checked="true"; choosing one closes the menu)',
    'disabled item (aria-disabled; announced, reachable with the arrows, not activatable)',
    'align end (menu aligned to the button\'s inline-end edge; kept when it flips)',
    'keep-open item (shows its own progress, e.g. "Signing out…")',
    'focus-visible (inset ring on the focused item)',
    'narrow-width (below 600 px: up to 100vw - 32 px wide; items at least 40 px tall)',
  ],
  keyboard: [
    'Enter / Space / ArrowDown on the button: open on the first item; ArrowUp: open on the last item.',
    'ArrowDown / ArrowUp: next / previous item, wrapping. Home / End: first / last item.',
    'A printable character: type-ahead to the next item starting with it.',
    'Enter / Space on an item: activate it and close; focus returns to the button unless the action moved it.',
    'Enter / Space on a radio item: check it, uncheck the others in its group, close.',
    'Escape: close, focus to the button. Tab / Shift+Tab: close and move on in page order.',
  ],
  accessibility: [
    'The button has aria-haspopup="menu", aria-expanded and aria-controls; the menu has role="menu" and a name.',
    'Items are role="menuitem" (buttons or links) and role="menuitemradio" in a role="group" named by its visible label; dividers are role="separator".',
    'Items are not Tab stops (tabindex="-1"); the arrow keys move focus.',
    'One menu is open at a time; a pointer press outside closes it (platform light dismiss); hover never opens it.',
  ],
  responsive: 'Max 20 rem wide (min(20 rem, 100vw - 32 px)); below 600 px up to 100vw - 32 px with 40 px items; never a bottom sheet.',
  rtl: 'Alignment is logical: align="end" sits at the button\'s left edge in RTL; the check mark and icons stay at the inline-start.',
  contentKeys: [],
  unitTests: 'packages/components/src/lib/menu/menu.spec.ts',
};

@Component({
  selector: 'lab-menu-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LabSpecimenPage,
    LabExample,
    PaepButton,
    PaepIconButton,
    PaepMenu,
    PaepMenuTrigger,
    PaepMenuItem,
    PaepMenuItemRadio,
    PaepMenuGroup,
    PaepMenuSeparator,
  ],
  template: `
    <lab-specimen-page [meta]="meta">
      <lab-example heading="Actions, a link, a disabled item and a destructive item">
        <button paepButton trailingIcon="chevron-down" [paepMenuTrigger]="actions">Record actions</button>
        <paep-menu #actions label="Record actions">
          <button paepMenuItem (click)="ran.set('Duplicate')">Duplicate</button>
          <button paepMenuItem icon="document" (click)="ran.set('Export')">Export</button>
          <a paepMenuItem href="#menu-help">Help for records</a>
          <button paepMenuItem disabled>Move to archive</button>
          <hr paepMenuSeparator />
          <button paepMenuItem destructive icon="delete" (click)="ran.set('Delete record')">Delete record</button>
        </paep-menu>
        @if (ran()) {
          <p class="note" role="status">{{ ran() }} selected.</p>
        }
      </lab-example>

      <lab-example heading="Radio group (single choice)">
        <button paepButton [paepMenuTrigger]="density">Density: {{ densityName() }}</button>
        <paep-menu #density label="Density">
          <paep-menu-group label="Density">
            @for (d of densities; track d) {
              <button paepMenuItemRadio [checked]="d === densityName()" (select)="densityName.set(d)">{{ d }}</button>
            }
          </paep-menu-group>
        </paep-menu>
      </lab-example>

      <lab-example heading="Inline-end alignment at the end of a bar">
        <div class="bar">
          <button paepIconButton icon="user" label="Account" [paepMenuTrigger]="account"></button>
          <paep-menu #account label="Account" align="end">
            <button paepMenuItem icon="sliders">Display preferences</button>
            <button paepMenuItem icon="help">Help</button>
            <hr paepMenuSeparator />
            <button paepMenuItem icon="sign-out" keepOpen [disabled]="signingOut()" (click)="signingOut.set(true)">
              {{ signingOut() ? 'Signing out…' : 'Sign out' }}
            </button>
          </paep-menu>
        </div>
      </lab-example>

      <lab-example heading="Right-to-left">
        <div class="bar" dir="rtl">
          <button paepButton [paepMenuTrigger]="rtl">Actions (right-to-left)</button>
          <paep-menu #rtl label="Actions (right-to-left)" align="end">
            <button paepMenuItem>Duplicate</button>
            <button paepMenuItem>Export</button>
          </paep-menu>
        </div>
      </lab-example>
    </lab-specimen-page>
  `,
  styles: `
    .bar {
      display: flex;
      justify-content: flex-end;
    }
    .note {
      margin-block: var(--paep-space-2) 0;
    }
  `,
})
export class MenuSpecimen {
  protected readonly meta = MENU_META;
  protected readonly ran = signal('');
  protected readonly densities = ['Comfortable', 'Compact'];
  protected readonly densityName = signal('Comfortable');
  protected readonly signingOut = signal(false);
}
