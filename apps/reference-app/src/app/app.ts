import { Component } from '@angular/core';
import { PaepErrorBoundary, PaepShell } from '@proseit/paep-enterprise';

/** Reference application root: the enterprise shell around the routed pages (IB3). */
@Component({
  imports: [PaepShell, PaepErrorBoundary],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  /** Document title of the application (the product name comes from runtime configuration). */
  protected readonly title = 'PAEP Reference Application';
}
