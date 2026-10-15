import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import type { RuntimeConfigStore } from '@proseit/paep-contracts';
import { PAEP_SHELL_ERROR_REPORTER, providePaepShell } from '@proseit/paep-enterprise';
import { routes } from './app.routes';
import { createFrappeShellBinding } from './frappe-binding';
import { RUNTIME_CONFIG_STORE } from './runtime-config';
import { referenceAvailability, referenceShellOptions } from './shell-sample';

/**
 * Application providers; the shell starts only with a validated runtime configuration (IB1 fail-safe startup).
 * Outside the development profile, with Frappe session identity, the shell's session and access ports are bound to
 * the backend through the lazily loaded Frappe adapter (IB4); the development profile keeps the sample data.
 */
export function appConfig(store: RuntimeConfigStore): ApplicationConfig {
  const { deployment, identity } = store.config;
  const binding =
    deployment.environment !== 'development' && identity.mode === 'frappe-session'
      ? createFrappeShellBinding(store, { fallbackAvailability: referenceAvailability })
      : undefined;
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes, withComponentInputBinding()),
      { provide: RUNTIME_CONFIG_STORE, useValue: store },
      providePaepShell(referenceShellOptions(store, binding)),
      ...(binding
        ? [
            provideEnvironmentInitializer(() => {
              const reporter = inject(PAEP_SHELL_ERROR_REPORTER);
              // The browser's same-origin path and query (with the base path); the adapter validates it before use.
              const currentPath = () => `${globalThis.location.pathname}${globalThis.location.search}`;
              void binding.start({ currentPath, report: (r) => reporter.report({ ...r, at: new Date().toISOString() }) });
            }),
          ]
        : []),
    ],
  };
}
