import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepButton, PaepCard, PaepStatusBadge } from '@proseit/paep-components';
import { PaepPageFrame } from '@proseit/paep-enterprise';

/**
 * Workspace hosting example (HOF-IB3-001 SCR-SHELL-015): the generic page frame with neutral placeholder regions.
 * It has no analytics or reporting behaviour, data, metrics, drill-down or saved views.
 */
@Component({
  selector: 'ref-workspace-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepButton, PaepCard, PaepPageFrame, PaepStatusBadge],
  template: `
    <paep-page-frame heading="Workspace" aside>
      <paep-status-badge paepPageStatus tone="info">Sample content</paep-status-badge>
      <div paepPageActions class="ref-actions">
        <button paepButton>Secondary action</button>
        <button paepButton variant="primary" icon="plus">Primary action</button>
      </div>
      <div class="ref-grid">
        @for (region of regions; track region) {
          <paep-card [heading]="region">
            <p class="ref-placeholder">Placeholder region for a later experience.</p>
          </paep-card>
        }
      </div>
      <div paepPageAside>
        <h2 class="ref-aside-title">Details</h2>
        <p>Neutral placeholder text for the aside region.</p>
      </div>
    </paep-page-frame>
  `,
  styles: `
    .ref-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .ref-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      gap: var(--paep-space-4);
    }
    .ref-placeholder {
      margin: 0;
      color: var(--paep-color-text-secondary);
    }
    .ref-aside-title {
      margin: 0 0 var(--paep-space-2);
      font-size: var(--paep-font-size-title-sm);
    }
  `,
})
export class WorkspacePage {
  protected readonly regions = ['Region one', 'Region two', 'Region three'];
}
