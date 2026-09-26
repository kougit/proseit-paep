// PAEP contract test doubles (PAEP-IR-01 §5.6 IB1-WP2/WP6; PAEP-IB-01 §8.2). Tooling only: never imported by packages/ or apps/.
export { deepFreeze, frozenCopy, jsonClone } from './deep-freeze.js';
export { InMemoryReportingGateway, REPORTING_FAKE_ERROR_CODES } from './in-memory-reporting-gateway.js';
export type { InMemoryReportingSeed, SeededDrillResult, SeededReportResult } from './in-memory-reporting-gateway.js';
export {
  createTestRuntimeConfigStore,
  TEST_BASE_RUNTIME_CONFIG,
  TEST_PAEP_VERSION,
  TEST_RUNTIME_CONFIG_BUILD_CONTEXT
} from './runtime-config-store.js';
export type { DeepPartial, RuntimeConfigOverrides, TestRuntimeConfigStoreOptions } from './runtime-config-store.js';
export { createTestSessionOutcome, TEST_IDENTITY, TEST_SESSION_ERROR } from './session-outcome.js';
export type { SessionOutcomeStatus, TestSessionOutcomeOptions } from './session-outcome.js';
