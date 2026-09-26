import { InjectionToken } from '@angular/core';
import type { RuntimeConfigBuildContext, RuntimeConfigStore } from '@proseit/paep-contracts';

/** Build-time facts compiled into this application; runtime configuration can never change them. */
export const REFERENCE_APP_RUNTIME_CONTEXT: RuntimeConfigBuildContext = {
  expectedProductId: 'reference-app',
  supportedApiContracts: ['pmra-api-v1'],
  externalBiProviders: []
};

/** The validated, immutable runtime configuration store, provided only after a successful fail-safe startup (IB1). */
export const RUNTIME_CONFIG_STORE = new InjectionToken<RuntimeConfigStore>('RUNTIME_CONFIG_STORE');
