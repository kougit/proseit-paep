import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { PaepButton, PaepCheckbox, PaepDialog, PaepDialogClose, PaepDialogFooter, PaepRadio, PaepRadioGroup } from '@proseit/paep-components';
import { PaepShellLayout, type PaepShellDensity } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';

/**
 * Display preferences (HOF-IB3-001 E-13, SCR-SHELL-016): content density (Q-14, content only; the chrome stays
 * comfortable) and "Keep navigation collapsed". Session only: nothing is stored and there is no "saved" message;
 * the dialog says so. Choices apply immediately.
 */
@Component({
  selector: 'paep-shell-preferences',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepButton, PaepCheckbox, PaepDialog, PaepDialogClose, PaepDialogFooter, PaepRadio, PaepRadioGroup],
  template: `
    <paep-dialog [(open)]="open" size="sm" [heading]="text.t('paep.shell.preferences.title')" [description]="text.t('paep.shell.preferences.session')" [closeLabel]="text.t('paep.shell.dialog.close')">
      <div class="paep-shell-preferences">
        <paep-radio-group [legend]="text.t('paep.shell.preferences.density')">
          <label>
            <input type="radio" paepRadio name="paep-shell-density" value="comfortable" [checked]="layout.density() === 'comfortable'" (change)="setDensity('comfortable')" />
            {{ text.t('paep.shell.preferences.density.comfortable') }}
          </label>
          <label>
            <input type="radio" paepRadio name="paep-shell-density" value="compact" [checked]="layout.density() === 'compact'" (change)="setDensity('compact')" />
            {{ text.t('paep.shell.preferences.density.compact') }}
          </label>
        </paep-radio-group>
        @if (layout.wide()) {
          <label>
            <input type="checkbox" paepCheckbox [checked]="layout.navCollapsed()" (change)="layout.navCollapsed.set($any($event.target).checked)" />
            {{ text.t('paep.shell.preferences.navCollapsed') }}
          </label>
        }
      </div>
      <paep-dialog-footer>
        <button paepButton paepDialogClose>{{ text.t('paep.shell.dialog.close') }}</button>
      </paep-dialog-footer>
    </paep-dialog>
  `,
  styles: `
    .paep-shell-preferences {
      display: flex;
      flex-direction: column;
      gap: var(--paep-density-stack-gap);
    }
    label {
      display: flex;
      align-items: center;
      gap: var(--paep-space-2);
    }
  `,
})
export class PaepShellPreferences {
  protected readonly text = inject(PaepShellText);
  protected readonly layout = inject(PaepShellLayout);
  /** Whether the preferences dialog is open. Two-way bindable. */
  readonly open = model(false);

  protected setDensity(value: PaepShellDensity): void {
    this.layout.density.set(value);
  }
}
