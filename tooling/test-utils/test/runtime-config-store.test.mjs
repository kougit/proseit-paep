// node:test suite for the RuntimeConfigStore and SessionOutcome test doubles. Run through contracts-qa.mjs, which provides
// PAEP_TEST_UTILS_DIST (compiled tooling/test-utils/src) and PAEP_PLATFORM_DIST (compiled packages/platform/src) in os.tmpdir().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (env) => {
  assert.ok(process.env[env], `${env} must be set`);
  return import(pathToFileURL(path.join(process.env[env], 'index.js')).href);
};
const utils = await load('PAEP_TEST_UTILS_DIST');
const platform = await load('PAEP_PLATFORM_DIST');
const { createTestRuntimeConfigStore, TEST_BASE_RUNTIME_CONFIG, TEST_RUNTIME_CONFIG_BUILD_CONTEXT, TEST_PAEP_VERSION, createTestSessionOutcome, TEST_IDENTITY } = utils;

const isDeepFrozen = (v) => v === null || typeof v !== 'object' || (Object.isFrozen(v) && Object.values(v).every(isDeepFrozen));
const validate = (config) => platform.validateRuntimeConfigBytes(new TextEncoder().encode(JSON.stringify(config)), TEST_RUNTIME_CONFIG_BUILD_CONTEXT);

test('the base configuration is accepted by the platform runtime-config validator', () => {
  const outcome = validate(TEST_BASE_RUNTIME_CONFIG);
  assert.equal(outcome.ok, true, JSON.stringify(outcome));
  assert.deepEqual(JSON.parse(JSON.stringify(outcome.store.config)), TEST_BASE_RUNTIME_CONFIG);
});

test('the test store reports the same compatibility as the platform validator', () => {
  const outcome = validate(TEST_BASE_RUNTIME_CONFIG);
  assert.deepEqual({ ...createTestRuntimeConfigStore().compatibility }, { ...outcome.store.compatibility });
  assert.equal(TEST_PAEP_VERSION, platform.PAEP_COMPATIBILITY_VERSION);
});

test('store and every nested value are deep-frozen', () => {
  const store = createTestRuntimeConfigStore();
  assert.ok(isDeepFrozen(store));
  assert.ok(isDeepFrozen(TEST_BASE_RUNTIME_CONFIG));
  assert.throws(() => { 'use strict'; store.config.product.id = 'x'; }, TypeError);
  assert.throws(() => store.config.localisation.supportedLocales.push('fr'), TypeError);
});

test('overrides deep-merge objects and replace arrays, without touching the base', () => {
  const store = createTestRuntimeConfigStore({ deployment: { environment: 'production' }, localisation: { supportedLocales: ['fr'] }, features: { uiHints: { beta: false } } });
  assert.equal(store.config.deployment.environment, 'production');
  assert.equal(store.config.deployment.profile, 'cloud-saas');
  assert.deepEqual(store.config.localisation.supportedLocales, ['fr']);
  assert.deepEqual(store.config.features.uiHints, { commandPalette: true, beta: false });
  assert.equal(TEST_BASE_RUNTIME_CONFIG.deployment.environment, 'test');
});

test('compatibility follows overridden backend metadata', () => {
  const store = createTestRuntimeConfigStore({ backend: { compatibility: { apiContract: 'other-api-v2', maximumPaep: '1.9' } } });
  assert.deepEqual({ ...store.compatibility }, { status: 'compatible', schemaVersion: '1.0', apiContract: 'other-api-v2', paepVersion: '1.1', minimumPaep: '1.1', maximumPaep: '1.9' });
});

test('configId is deterministic, content-derived and overridable', () => {
  assert.equal(createTestRuntimeConfigStore().configId, createTestRuntimeConfigStore().configId);
  assert.match(createTestRuntimeConfigStore().configId, /^test-[0-9a-f]{8}$/);
  assert.notEqual(createTestRuntimeConfigStore({ product: { release: '9.9.9' } }).configId, createTestRuntimeConfigStore().configId);
  assert.equal(createTestRuntimeConfigStore({}, { configId: 'fixed' }).configId, 'fixed');
});

test('authenticated session fixture is deep-frozen and merges identity overrides', () => {
  const s = createTestSessionOutcome();
  assert.deepEqual(s, { status: 'authenticated', identity: TEST_IDENTITY });
  assert.ok(isDeepFrozen(s));
  const t = createTestSessionOutcome('authenticated', { identity: { displayName: 'Other', tenant: { projectId: 'p-1' } }, expiresAt: '2026-01-01T00:00:00Z' });
  assert.equal(t.identity.displayName, 'Other');
  assert.deepEqual(t.identity.tenant, { ...TEST_IDENTITY.tenant, projectId: 'p-1' });
  assert.equal(t.expiresAt, '2026-01-01T00:00:00Z');
  assert.equal(TEST_IDENTITY.displayName, 'Test User');
});

test('non-authenticated session fixtures carry only their status (and error for invalid)', () => {
  assert.deepEqual(createTestSessionOutcome('unauthenticated'), { status: 'unauthenticated' });
  assert.deepEqual(createTestSessionOutcome('expired'), { status: 'expired' });
  assert.equal(createTestSessionOutcome('invalid').error.code, 'SESSION_INVALID');
  assert.deepEqual(createTestSessionOutcome('invalid', { error: null }), { status: 'invalid' });
  assert.ok(isDeepFrozen(createTestSessionOutcome('invalid')));
});

test('fixture builders are deterministic and JSON round-trip exactly', () => {
  for (const v of [createTestRuntimeConfigStore(), createTestSessionOutcome(), createTestSessionOutcome('invalid')]) {
    assert.deepEqual(JSON.parse(JSON.stringify(v)), v);
  }
  assert.equal(JSON.stringify(createTestSessionOutcome()), JSON.stringify(createTestSessionOutcome()));
});
