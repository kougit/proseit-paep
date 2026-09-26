import { bootstrapApplication } from '@angular/platform-browser';
import type { RuntimeConfigFailure } from '@proseit/paep-contracts';
import { describeRuntimeConfigFailure, loadRuntimeConfig, RUNTIME_CONFIG_PATH, startWithRuntimeConfig } from '@proseit/paep-platform';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { REFERENCE_APP_RUNTIME_CONTEXT, RUNTIME_CONFIG_STORE } from './app/runtime-config';

// IB1 fail-safe startup: the runtime configuration is loaded and validated before Angular starts. An invalid, incomplete or
// incompatible configuration never starts the application; a bounded, non-sensitive message is shown instead.
function showConfigurationFailure(failure: RuntimeConfigFailure): void {
  const text = describeRuntimeConfigFailure(failure);
  const main = document.createElement('main');
  main.id = 'paep-config-failure';
  main.setAttribute('role', 'alert');
  for (const [tag, value] of [['h1', text.title], ['p', text.detail], ['code', text.diagnosticId]] as const) {
    const el = document.createElement(tag);
    el.textContent = value;
    main.append(el);
  }
  document.documentElement.dataset['paepConfig'] = 'failed';
  document.body.replaceChildren(main);
  console.error(`PAEP runtime configuration rejected: ${failure.stage} ${failure.code} (${text.diagnosticId})`);
}

const base = new URL(document.baseURI);
void startWithRuntimeConfig({
  load: () => loadRuntimeConfig(REFERENCE_APP_RUNTIME_CONTEXT, {
    fetch: (url, init) => fetch(url, init),
    configUrl: new URL(RUNTIME_CONFIG_PATH, base).href,
    documentBasePath: base.pathname
  }),
  onReady: async (store) => {
    document.documentElement.dataset['paepConfig'] = 'ready';
    document.documentElement.dataset['paepProfile'] = store.config.deployment.profile;
    await bootstrapApplication(App, { providers: [...appConfig.providers, { provide: RUNTIME_CONFIG_STORE, useValue: store }] })
      .catch((err) => console.error(err));
  },
  onFailure: showConfigurationFailure
});
