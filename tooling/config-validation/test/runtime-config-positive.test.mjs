// PAEP IB1 runtime configuration: positive tests (valid documents, immutability, portability, determinism).
// Runs against the compiled platform ($PAEP_IB1_PLATFORM_DIR or a fresh compile); no network, no DOM.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, resolvePlatformDir } from '../lib/compile-platform.mjs';

const P = await import(pathToFileURL(path.join(resolvePlatformDir(), 'index.js')).href);
const FIXTURES = path.join(REPO_ROOT, 'tooling', 'config-validation', 'fixtures');
const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'manifest.json'), 'utf8'));
const CONTEXT = Object.freeze({ expectedProductId: 'reference-app', supportedApiContracts: ['pmra-api-v1'], externalBiProviders: [] });
const enc = (s) => new TextEncoder().encode(s);
const fixtureBytes = (rel) => new Uint8Array(fs.readFileSync(path.join(FIXTURES, rel)));
const fixtureDoc = (rel) => JSON.parse(fs.readFileSync(path.join(FIXTURES, rel), 'utf8'));
const bytesOf = (doc) => enc(JSON.stringify(doc, null, 2));

function assertOk(outcome, label = '') {
  assert.equal(outcome.ok, true, `${label} expected ok, got ${JSON.stringify(outcome)}`);
  return outcome.store;
}

/** Every object/array reachable from v, with its pointer. */
function nodes(v, p = '', out = []) {
  if (v !== null && typeof v === 'object') {
    out.push([p, v]);
    for (const k of Object.keys(v)) nodes(v[k], `${p}/${k}`, out);
  }
  return out;
}

for (const entry of manifest.valid) {
  test(`P-valid fixture ${entry.file} is accepted (${entry.profile}, ${entry.environment})`, () => {
    const store = assertOk(P.validateRuntimeConfigBytes(fixtureBytes(entry.file), CONTEXT, entry.env ?? {}), entry.file);
    assert.equal(store.config.deployment.profile, entry.profile);
    assert.equal(store.config.deployment.environment, entry.environment);
    assert.deepEqual(JSON.parse(JSON.stringify(store.config)), fixtureDoc(entry.file));
  });
}

test('P-current: committed example and reference-app configuration validate with the reference-app build context', () => {
  for (const rel of ['config/runtime-config.example.json', 'apps/reference-app/public/config/runtime-config.json']) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(REPO_ROOT, rel)));
    const store = assertOk(P.validateRuntimeConfigBytes(bytes, CONTEXT, { documentBasePath: '/' }), rel);
    assert.equal(store.config.schemaVersion, '1.0');
  }
});

test('P-on-premise: non-root basePath "/erp/" is accepted when served under /erp/', () => {
  const store = assertOk(P.validateRuntimeConfigBytes(fixtureBytes('valid/on-premise.json'), CONTEXT, { documentBasePath: '/erp/' }));
  assert.equal(store.config.deployment.basePath, '/erp/');
});

test('P-oidc: oidc identity with issuer, clientId and scopes including openid', () => {
  const store = assertOk(P.validateRuntimeConfigBytes(fixtureBytes('valid/oidc.json'), CONTEXT));
  assert.equal(store.config.identity.mode, 'oidc');
  assert.ok(store.config.identity.scopes.includes('openid'));
});

test('P-minimal: only required fields, telemetry and analytics disabled', () => {
  const doc = fixtureDoc('valid/minimal.json');
  assert.equal(doc.telemetry.enabled, false);
  assert.equal(doc.analytics.enabled, false);
  const store = assertOk(P.validateRuntimeConfigBytes(bytesOf(doc), CONTEXT));
  assert.equal(store.config.security, undefined);
  assert.equal(store.compatibility.maximumPaep, null);
});

for (const [label, max] of [['1.1..1.1', '1.1'], ['1.1..null', null], ['1.1..absent', undefined]]) {
  test(`P-compatibility bounds ${label} accepted`, () => {
    const doc = fixtureDoc('valid/cloud-saas.json');
    doc.backend.compatibility.minimumPaep = '1.1';
    if (max === undefined) delete doc.backend.compatibility.maximumPaep;
    else doc.backend.compatibility.maximumPaep = max;
    const store = assertOk(P.validateRuntimeConfigBytes(bytesOf(doc), CONTEXT));
    assert.deepEqual({ ...store.compatibility }, {
      status: 'compatible', schemaVersion: '1.0', apiContract: 'pmra-api-v1', paepVersion: P.PAEP_COMPATIBILITY_VERSION,
      minimumPaep: '1.1', maximumPaep: max ?? null
    });
  });
}

test('P-development: plain http is allowed for loopback hosts in development only', () => {
  const store = assertOk(P.validateRuntimeConfigBytes(fixtureBytes('valid/development-loopback.json'), CONTEXT));
  assert.equal(store.config.backend.apiBaseUrl, 'http://localhost:8000/api');
});

test('P-immutability: every node of the store is frozen and has a null prototype (objects)', () => {
  const outcome = P.validateRuntimeConfigBytes(fixtureBytes('valid/cloud-saas.json'), CONTEXT);
  assert.ok(Object.isFrozen(outcome));
  const all = nodes(outcome);
  assert.equal(all.length, 20);
  for (const [p, n] of all) assert.ok(Object.isFrozen(n), `not frozen: ${p}`);
  for (const [p, n] of nodes(outcome.store.config)) {
    if (!Array.isArray(n)) assert.equal(Object.getPrototypeOf(n), null, `prototype at ${p}`);
  }
});

test('P-immutability: writes throw in strict mode and Reflect.set fails; values unchanged', () => {
  const { store } = P.validateRuntimeConfigBytes(fixtureBytes('valid/cloud-saas.json'), CONTEXT);
  assert.throws(() => { store.config.product.id = 'other-product'; }, TypeError);
  assert.throws(() => { store.config.backend.compatibility.minimumPaep = '0.1'; }, TypeError);
  assert.throws(() => { store.config.newKey = 1; }, TypeError);
  assert.throws(() => { delete store.config.security; }, TypeError);
  assert.throws(() => { store.config = {}; }, TypeError);
  assert.throws(() => { store.compatibility.status = 'x'; }, TypeError);
  assert.throws(() => store.config.localisation.supportedLocales.push('de'), TypeError);
  assert.throws(() => { store.config.localisation.supportedLocales[0] = 'de'; }, TypeError);
  assert.throws(() => Object.defineProperty(store.config.features.uiHints, 'x', { value: true }), TypeError);
  assert.equal(Reflect.set(store.config.deployment, 'environment', 'development'), false);
  assert.equal(Reflect.set(store, 'configId', 'x'), false);
  assert.equal(store.config.product.id, 'reference-app');
  assert.equal(store.config.deployment.environment, 'production');
  assert.deepEqual([...store.config.localisation.supportedLocales], ['en', 'fr', 'ar']);
  assert.equal(store.config.security.cspProfile, 'strict');
});

test('P-immutability: mutating the input buffer after validation does not change the store', () => {
  const bytes = fixtureBytes('valid/cloud-saas.json');
  const { store } = P.validateRuntimeConfigBytes(bytes, CONTEXT);
  const before = JSON.stringify(store);
  const at = Buffer.from(bytes).indexOf('reference-app');
  bytes.fill(0x78, at, at + 5);
  bytes.fill(0);
  assert.equal(JSON.stringify(store), before);
  assert.equal(store.config.product.id, 'reference-app');
});

test('P-portability: one compiled validator accepts all three deployment profiles unchanged', () => {
  const seen = new Set();
  for (const [rel, env] of [['valid/cloud-saas.json', { documentBasePath: '/' }], ['valid/private-cloud.json', { documentBasePath: '/' }], ['valid/on-premise.json', { documentBasePath: '/erp/' }]]) {
    seen.add(assertOk(P.validateRuntimeConfigBytes(fixtureBytes(rel), CONTEXT, env), rel).config.deployment.profile);
  }
  assert.deepEqual([...seen].sort(), ['cloud-saas', 'on-premise', 'private-cloud']);
});

test('P-determinism: the same input gives deep-equal outcomes and the same configId; different documents differ', () => {
  const a = P.validateRuntimeConfigBytes(fixtureBytes('valid/cloud-saas.json'), CONTEXT);
  const b = P.validateRuntimeConfigBytes(fixtureBytes('valid/cloud-saas.json'), CONTEXT);
  assert.notEqual(a, b);
  assert.deepEqual(a, b);
  assert.match(a.store.configId, /^[0-9a-f]{8}$/);
  assert.equal(a.store.configId, b.store.configId);
  const c = P.validateRuntimeConfigBytes(fixtureBytes('valid/private-cloud.json'), CONTEXT);
  assert.notEqual(c.store.configId, a.store.configId);
  const bad = enc('{"schemaVersion":"9.9"}');
  assert.deepEqual(P.validateRuntimeConfigBytes(bad, CONTEXT), P.validateRuntimeConfigBytes(bad, CONTEXT));
});

test('P-schema-binding: the compiled validator is bound to the committed schema (sha256 and $id)', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, 'config', 'runtime-config.schema.json'));
  assert.equal(P.RUNTIME_CONFIG_SCHEMA_SHA256, crypto.createHash('sha256').update(text).digest('hex'));
  assert.equal(P.RUNTIME_CONFIG_SCHEMA_ID, JSON.parse(text.toString('utf8')).$id);
  assert.deepEqual([...P.SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS], ['1.0']);
  assert.equal(P.MAX_RUNTIME_CONFIG_BYTES, 65536);
  assert.equal(P.MAX_RUNTIME_CONFIG_DEPTH, 8);
});
