import { ChangeDetectionStrategy, Component, ErrorHandler, computed, inject, input } from '@angular/core';
import { Routes } from '@angular/router';
import { PaepButton, PaepCard, PaepStatusBadge } from '@proseit/paep-components';
import {
  PAEP_SHELL_LOCK_REASONS,
  PaepErrorBoundary,
  PaepLockedState,
  PaepNotFound,
  PaepPageFrame,
  PaepShell,
  providePaepShell,
  type PaepShellLockReason,
} from '@proseit/paep-enterprise';
import { LabShowcaseErrorRelay } from './showcase-mode';
import { showcaseShellOptions } from './showcase-sample';

/*
 * The preview documents of the enterprise-shell showcase: the real shell with neutral sample pages, loaded by the
 * showcase pages in an iframe so that the lab keeps its own chrome and every document has one h1 and one main.
 */

@Component({
  selector: 'lab-showcase-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepButton, PaepCard, PaepPageFrame, PaepStatusBadge],
  template: `
    <paep-page-frame heading="Workspace" aside>
      <paep-status-badge paepPageStatus tone="info">Sample content</paep-status-badge>
      <div paepPageActions class="actions">
        <button paepButton>Secondary action</button>
        <button paepButton variant="primary" icon="plus">Primary action</button>
      </div>
      <div class="grid">
        @for (region of regions; track region) {
          <paep-card [heading]="region"><p class="placeholder">Placeholder region for a later experience.</p></paep-card>
        }
      </div>
      <div paepPageAside>
        <h2 class="aside-title">Details</h2>
        <p>Neutral placeholder text for the aside region.</p>
      </div>
    </paep-page-frame>
  `,
  styles: `
    .actions { display: flex; flex-wrap: wrap; gap: var(--paep-space-2); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: var(--paep-space-4); }
    .placeholder { margin: 0; color: var(--paep-color-text-secondary); }
    .aside-title { margin: 0 0 var(--paep-space-2); font-size: var(--paep-font-size-title-sm); }
  `,
})
export class LabShowcaseWorkspace {
  protected readonly regions = ['Region one', 'Region two', 'Region three'];
}

const LOCK_NAMES: Readonly<Record<PaepShellLockReason, string>> = {
  permission: 'Permission example',
  edition: 'Edition example',
  configuration: 'Configuration example',
  environment: 'Environment example',
};

@Component({
  selector: 'lab-showcase-locked',
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
export class LabShowcaseLocked {
  readonly reason = input<string>('');
  protected readonly names = LOCK_NAMES;
  protected readonly known = computed(() => ((PAEP_SHELL_LOCK_REASONS as readonly string[]).includes(this.reason()) ? (this.reason() as PaepShellLockReason) : null));
}

let failNext = true;

/** The first render of this page fails on purpose, so the error boundary shows; "Try again" renders it. */
@Component({
  selector: 'lab-showcase-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepPageFrame],
  template: `<paep-page-frame heading="Error boundary example"><p>{{ content() }}</p></paep-page-frame>`,
})
export class LabShowcaseError {
  protected content(): string {
    if (failNext) {
      failNext = false;
      throw new Error('ui-lab showcase: intentional render failure');
    }
    failNext = true;
    return 'The page rendered after "Try again". Opening it again shows the error once more.';
  }
}

/** Root of a preview document: the enterprise shell around the routed sample page. */
@Component({
  selector: 'lab-showcase-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepErrorBoundary, PaepShell],
  template: `
    <paep-shell>
      <!-- Neutral placeholder product mark (HOF-IB3-001 P-09): test content only, not a brand asset. -->
      <svg paepShellMark viewBox="0 0 32 32" width="32" height="32" focusable="false">
        <rect width="32" height="32" rx="6" fill="#24364B" />
        <path d="M9 22L16 9l7 13" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 18h8" stroke="#D4A62A" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <main>
        <paep-error-boundary />
      </main>
    </paep-shell>
  `,
})
export class LabShowcaseFrame {
  constructor() {
    // Render failures reach the root error handler; hand them to the shell's handler of this route.
    inject(LabShowcaseErrorRelay).register(inject(ErrorHandler));
  }
}

/** Routes of a preview document, below the preview prefix; the shell is provided here, not in the lab. */
export const SHOWCASE_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    component: LabShowcaseFrame,
    providers: [providePaepShell(showcaseShellOptions(typeof document === 'undefined' ? '' : document.location.search))],
    children: [
      { path: 'workspace', title: 'Workspace · Shell showcase', component: LabShowcaseWorkspace },
      { path: 'locked/:reason', title: 'Locked example · Shell showcase', component: LabShowcaseLocked },
      { path: 'error', title: 'Error boundary example · Shell showcase', component: LabShowcaseError },
      { path: '**', title: 'Page not found · Shell showcase', component: PaepNotFound },
    ],
  },
];
