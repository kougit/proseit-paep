import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaepPageFrame } from '@proseit/paep-enterprise';

let failNext = true;

/**
 * Error-boundary example (HOF-IB3-001 SCR-SHELL-013): the first render of this page fails on purpose, so the shell
 * shows the recoverable error with its reference; "Try again" renders it successfully.
 */
@Component({
  selector: 'ref-error-example-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepPageFrame],
  template: `
    <paep-page-frame heading="Error boundary example" [breadcrumbs]="[{ label: 'Workspace', link: '/workspace' }, { label: 'Error boundary example' }]">
      <p>{{ content() }}</p>
    </paep-page-frame>
  `,
})
export class ErrorExamplePage {
  protected content(): string {
    if (failNext) {
      failNext = false;
      throw new Error('reference-app: intentional render failure');
    }
    failNext = true;
    return 'The page rendered after "Try again". Opening it again shows the error once more.';
  }
}
