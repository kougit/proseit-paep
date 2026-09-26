import type { RuntimeConfigFailure, RuntimeConfigOutcome, RuntimeConfigStore } from '@proseit/paep-contracts';
import { deepFreeze } from './freeze.js';
import { isValidatedRuntimeConfigStore, runtimeConfigFailure } from './validate.js';

/** Hooks for a fail-closed startup: exactly one of them runs, once. */
export interface RuntimeConfigStartup {
  /** Produces the outcome, normally loadRuntimeConfig(...). */
  readonly load: () => Promise<RuntimeConfigOutcome>;
  /** Continues application startup with the immutable store. Never called for an invalid or incompatible configuration. */
  readonly onReady: (store: RuntimeConfigStore) => void | Promise<void>;
  /** Presents the bounded fail-safe state. The protected application is not started. */
  readonly onFailure: (failure: RuntimeConfigFailure) => void;
}

let started = false;

/**
 * Fail-safe bootstrap gate (PAEP-IR-01 §5.5(ii)-(iv); PAEP-IB-01 §9.2(iii)-(iv)): load and validate before any protected composition,
 * then either start with the frozen store or present the failure. It runs once per page: a second call is refused, so the accepted
 * configuration cannot be replaced after a successful start.
 */
export async function startWithRuntimeConfig(startup: RuntimeConfigStartup): Promise<RuntimeConfigOutcome> {
  if (started) {
    const repeated = runtimeConfigFailure('startup', [{ stage: 'startup', code: 'CFG_STARTUP_REPEATED', path: '' }]);
    startup.onFailure(repeated);
    return repeated;
  }
  started = true;
  let outcome: RuntimeConfigOutcome;
  try {
    outcome = await startup.load();
    if (outcome === null || typeof outcome !== 'object' || (outcome.ok === true && !isValidatedRuntimeConfigStore(outcome.store))) throw new Error('unvalidated outcome');
  } catch {
    outcome = runtimeConfigFailure('internal', [{ stage: 'internal', code: 'CFG_INTERNAL', path: '' }]);
  }
  if (outcome.ok === true) {
    try {
      await startup.onReady(deepFreeze(outcome.store));
    } catch {
      // The application failed to start after a valid configuration: show the fail-safe state instead of a blank page.
      outcome = runtimeConfigFailure('startup', [{ stage: 'startup', code: 'CFG_INTERNAL', path: '' }]);
      startup.onFailure(outcome);
    }
  } else startup.onFailure(outcome);
  return outcome;
}

/** Fixed, non-sensitive text for the fail-safe state (PAEP-IB-01 §9.2(v)): no stack trace, endpoint or configuration value. */
export function describeRuntimeConfigFailure(failure: RuntimeConfigFailure): { readonly title: string; readonly detail: string; readonly diagnosticId: string } {
  return {
    title: 'This application cannot start',
    detail: 'Its deployment configuration is missing, invalid or incompatible with this release. Contact your administrator or support and quote the reference below.',
    diagnosticId: failure.diagnosticId
  };
}
