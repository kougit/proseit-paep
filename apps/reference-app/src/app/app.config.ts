import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import type { RuntimeConfigStore } from '@proseit/paep-contracts';
import { providePaepShell } from '@proseit/paep-enterprise';
import { routes } from './app.routes';
import { RUNTIME_CONFIG_STORE } from './runtime-config';
import { referenceShellOptions } from './shell-sample';

/** Application providers; the shell starts only with a validated runtime configuration (IB1 fail-safe startup). */
export function appConfig(store: RuntimeConfigStore): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes, withComponentInputBinding()),
      { provide: RUNTIME_CONFIG_STORE, useValue: store },
      providePaepShell(referenceShellOptions(store)),
    ],
  };
}
