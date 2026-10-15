import { DestroyRef, ErrorHandler, Injectable, inject, isDevMode, signal } from '@angular/core';
import { NavigationError, NavigationStart, Router } from '@angular/router';
import { sanitizeErrorReport, type PaepErrorKind, type PaepErrorReport } from '@proseit/paep-observability';
import { PAEP_SHELL_ERROR_REPORTER } from '../ports/ports';

/** Whether an error looks like a failed lazy chunk load (the route's code could not be fetched). */
function isChunkFailure(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|error loading dynamically/i.test(text);
}

/**
 * @internal Shell error state. Every failure becomes an allowlisted report through the observability seam (kind,
 * correlation reference, route path, retryable) and, for the page, a state the error boundary shows with fixed
 * text. Nothing from the original error (message, stack, server text) reaches the UI or the report.
 */
@Injectable()
export class PaepShellErrors {
  private readonly reporter = inject(PAEP_SHELL_ERROR_REPORTER);
  private readonly router = inject(Router);
  /** The error the page shows, or null. */
  readonly current = signal<PaepErrorReport | null>(null);

  constructor() {
    const sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.current.set(null);
      if (e instanceof NavigationError) this.raise(isChunkFailure(e.error) ? 'route-load' : 'render', { route: e.url, retryable: !isChunkFailure(e.error) });
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  /** Reports a failure and shows it on the page. `version` is raised by the host when the app is incompatible. */
  raise(kind: PaepErrorKind, details: { readonly correlationId?: string; readonly route?: string; readonly retryable?: boolean } = {}): PaepErrorReport {
    const report = sanitizeErrorReport({ kind, correlationId: details.correlationId, route: details.route ?? this.router.url, retryable: details.retryable ?? kind === 'render' });
    this.reporter.report(report);
    this.current.set(report);
    return report;
  }

  clear(): void {
    this.current.set(null);
  }
}

/** @internal Routes uncaught errors to the shell error state (render failures, failed lazy loads). */
@Injectable()
export class PaepShellErrorHandler implements ErrorHandler {
  private readonly errors = inject(PaepShellErrors);
  private pending = false;

  handleError(error: unknown): void {
    // Raw details stay out of the UI and the report; they are written to the console only in development builds.
    if (isDevMode()) console.error(error);
    // One failure is shown once: errors repeated while the page is already replaced are not reported again.
    if (this.pending || this.errors.current()) return;
    this.pending = true;
    // A render error aborts the change-detection pass that raised it; the error state is applied in a new task so
    // the shell renders it in the next pass.
    setTimeout(() => {
      this.pending = false;
      this.errors.raise(isChunkFailure(error) ? 'route-load' : 'render', { retryable: !isChunkFailure(error) });
    });
  }
}
