import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PAEP_SHELL_LOCK_REASONS, PaepLockedState, PaepNotFound, type PaepShellLockReason } from '@proseit/paep-enterprise';

const NAMES: Readonly<Record<PaepShellLockReason, string>> = {
  permission: 'Permission example',
  edition: 'Edition example',
  configuration: 'Configuration example',
  environment: 'Environment example',
};

/** Locked-state example page for each reason (HOF-IB3-001 SCR-SHELL-012). It explains only; nothing is enforced here. */
@Component({
  selector: 'ref-locked-example-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepLockedState, PaepNotFound],
  template: `
    @if (known(); as r) {
      <paep-locked-state [reason]="r" [heading]="names[r]" />
    } @else {
      <paep-not-found />
    }
  `,
})
export class LockedExamplePage {
  /** Route parameter. */
  readonly reason = input<string>('');
  protected readonly names = NAMES;
  protected readonly known = computed(() => (PAEP_SHELL_LOCK_REASONS as readonly string[]).includes(this.reason()) ? (this.reason() as PaepShellLockReason) : null);
}
