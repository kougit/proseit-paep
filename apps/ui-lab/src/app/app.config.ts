import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, type Routes } from '@angular/router';
import { routes } from './app.routes';
import { LabShowcaseErrorRelay, SHOWCASE_PREVIEW, isShowcasePreview } from './showcase/showcase-mode';

/** A showcase preview document (an iframe of the enterprise-shell showcase) runs the shell instead of the lab frame. */
export const SHOWCASE_PREVIEW_DOCUMENT = typeof document !== 'undefined' && isShowcasePreview(document.location, document.baseURI);

const PREVIEW_ROUTES: Routes = [
  { path: SHOWCASE_PREVIEW.slice(1), loadChildren: () => import('./showcase/showcase-preview').then((m) => m.SHOWCASE_PREVIEW_ROUTES) },
  { path: '**', redirectTo: `${SHOWCASE_PREVIEW.slice(1)}/workspace` },
];

export const appConfig: ApplicationConfig = {
  providers: SHOWCASE_PREVIEW_DOCUMENT
    ? [provideBrowserGlobalErrorListeners(), provideRouter(PREVIEW_ROUTES, withComponentInputBinding()), { provide: ErrorHandler, useExisting: LabShowcaseErrorRelay }]
    : [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
      ],
};
