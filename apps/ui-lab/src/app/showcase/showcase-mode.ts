import { ErrorHandler, Injectable } from '@angular/core';

/*
 * Startup decision of the enterprise-shell showcase. This module stays in the lab's initial bundle, so it imports no
 * shell code: the preview documents load the shell lazily (showcase-preview.ts).
 */

/** Path prefix of the preview documents shown inside the showcase pages. */
export const SHOWCASE_PREVIEW = '/showcase/preview';

/** Whether this document is a showcase preview (decided once, at startup, from the document path). */
export function isShowcasePreview(location: Pick<Location, 'pathname'>, baseURI: string): boolean {
  const base = new URL(baseURI).pathname.replace(/\/$/, '');
  return location.pathname.startsWith(`${base}${SHOWCASE_PREVIEW}/`);
}

/**
 * Root error handler of a preview document. The shell, and with it its error handler, is provided by the lazily
 * loaded preview route; until it registers, errors go to the console as usual.
 */
@Injectable({ providedIn: 'root' })
export class LabShowcaseErrorRelay implements ErrorHandler {
  private target: ErrorHandler | null = null;

  register(handler: ErrorHandler): void {
    this.target = handler;
  }

  handleError(error: unknown): void {
    if (this.target) this.target.handleError(error);
    else console.error(error);
  }
}
