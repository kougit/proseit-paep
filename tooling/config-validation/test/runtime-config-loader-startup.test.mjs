// PAEP IB1 runtime configuration: loader (fake fetch, no network) and fail-safe startup gate tests.
// startup.js holds a once-per-page latch, so each startup test imports its own copy of the module (query string on the URL).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, resolvePlatformDir } from '../lib/compile-platform.mjs';

const PLATFORM_DIR = resolvePlatformDir();
const P = await import(pathToFileURL(path.join(PLATFORM_DIR, 'index.js')).href);
const STARTUP_URL = pathToFileURL(path.join(PLATFORM_DIR, 'lib', 'runtime-config', 'startup.js')).href;
let copies = 0;
const freshStartup = async () => (await import(`${STARTUP_URL}?copy=${++copies}`)).startWithRuntimeConfig;

const FIXTURES = path.join(REPO_ROOT, 'tooling', 'config-validation', 'fixtures');
const CONTEXT = Object.freeze({ expectedProductId: 'reference-app', supportedApiContracts: ['pmra-api-v1'], externalBiProviders: [] });
const CONFIG_URL = 'https://app.example.test/config/runtime-config.json';
const DIAGNOSTIC_ID = /^PAEP-CFG_[A-Z0-9_]+-([0-9a-f]{8}|nodoc)$/;
const validBytes = (rel = 'valid/cloud-saas.json') => new Uint8Array(fs.readFileSync(path.join(FIXTURES, rel)));

/** A fake Fetch API response; override any field. */
function response({ bytes: body, headers: headerMap, ...over } = {}) {
  const bytes = body ?? validBytes();
  const headers = headerMap ?? { 'content-type': 'application/json; charset=utf-8', 'content-length': String(bytes.length) };
  return {
    ok: true, status: 200, redirected: false, url: CONFIG_URL,
    headers: { get: (n) => (Object.hasOwn(headers, n.toLowerCase()) ? headers[n.toLowerCase()] : null) },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ...over
  };
}
const load = (fetch, documentBasePath = '/') => P.loadRuntimeConfig(CONTEXT, { fetch, configUrl: CONFIG_URL, documentBasePath });

function assertFailure(outcome, stage, code) {
  assert.equal(outcome.ok, false);
  assert.ok(Object.isFrozen(outcome) && Object.isFrozen(outcome.issues));
  assert.equal(outcome.stage, stage);
  assert.equal(outcome.code, code);
  assert.deepEqual(outcome.issues.map((i) => [i.stage, i.code, i.path]), [[stage, code, '']]);
  assert.match(outcome.diagnosticId, DIAGNOSTIC_ID);
}

// ---- loader ----------------------------------------------------------------------------------------------------------
test('L-ok: a valid same-origin JSON response loads; the request is GET, no-store, same-origin, no redirects', async () => {
  const calls = [];
  const outcome = await load(async (url, init) => { calls.push([url, init]); return response(); });
  assert.equal(outcome.ok, true);
  assert.ok(Object.isFrozen(outcome.store.config));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], CONFIG_URL);
  assert.deepEqual({ ...calls[0][1] }, { method: 'GET', cache: 'no-store', credentials: 'same-origin', redirect: 'error', mode: 'same-origin' });
});

test('L-base-path: the document base path is enforced by the loader', async () => {
  const outcome = await load(async () => response(), '/erp/');
  assert.equal(outcome.ok, false);
  assert.equal(outcome.code, 'CFG_BASE_PATH');
});

const loaderFailures = [
  ['network rejection', async () => { throw new TypeError('Failed to fetch'); }, 'CFG_LOAD_NETWORK'],
  ['synchronous fetch throw', () => { throw new Error('boom'); }, 'CFG_LOAD_NETWORK'],
  ['HTTP 404', async () => response({ ok: false, status: 404 }), 'CFG_LOAD_STATUS'],
  ['HTTP 500', async () => response({ ok: false, status: 500 }), 'CFG_LOAD_STATUS'],
  ['HTTP 204 marked ok', async () => response({ status: 204 }), 'CFG_LOAD_STATUS'],
  ['redirected response', async () => response({ redirected: true }), 'CFG_LOAD_REDIRECT'],
  ['response.url differs from the requested URL', async () => response({ url: 'https://evil.example.test/config/runtime-config.json' }), 'CFG_LOAD_REDIRECT'],
  ['text/html content type (SPA fallback)', async () => response({ headers: { 'content-type': 'text/html; charset=utf-8' }, bytes: new TextEncoder().encode('<!doctype html><html></html>') }), 'CFG_LOAD_CONTENT_TYPE'],
  ['missing content type', async () => response({ headers: {} }), 'CFG_LOAD_CONTENT_TYPE'],
  ['declared content-length too large', async () => response({ headers: { 'content-type': 'application/json', 'content-length': String(P.MAX_RUNTIME_CONFIG_BYTES + 1) } }), 'CFG_LOAD_TOO_LARGE'],
  ['arrayBuffer rejects', async () => response({ arrayBuffer: async () => { throw new Error('reset'); } }), 'CFG_LOAD_NETWORK']
];
for (const [name, fetch, code] of loaderFailures) {
  test(`L-fail ${name} -> ${code}, never throws`, async () => {
    let outcome;
    await assert.doesNotReject(async () => { outcome = await load(fetch); });
    assertFailure(outcome, 'load', code);
    assert.ok(outcome.diagnosticId.endsWith('-nodoc'));
  });
}

test('L-fail: an oversize body with a false content-length is still rejected', async () => {
  const bytes = new Uint8Array(P.MAX_RUNTIME_CONFIG_BYTES + 10).fill(0x20);
  const outcome = await load(async () => response({ bytes, headers: { 'content-type': 'application/json', 'content-length': '10' } }));
  assertFailure(outcome, 'load', 'CFG_LOAD_TOO_LARGE');
});

// ---- fail-safe startup ------------------------------------------------------------------------------------------------
function hooks(load) {
  const h = { ready: [], failures: [] };
  h.startup = { load, onReady: (store) => { h.ready.push(store); }, onFailure: (f) => { h.failures.push(f); } };
  return h;
}
const validOutcome = () => P.validateRuntimeConfigBytes(validBytes(), CONTEXT);

test('S-ready: onReady runs exactly once with the frozen store; onFailure never runs', async () => {
  const start = await freshStartup();
  const h = hooks(async () => validOutcome());
  const outcome = await start(h.startup);
  assert.equal(outcome.ok, true);
  assert.equal(h.ready.length, 1);
  assert.equal(h.failures.length, 0);
  assert.equal(h.ready[0], outcome.store);
  assert.ok(Object.isFrozen(h.ready[0]) && Object.isFrozen(h.ready[0].config) && Object.isFrozen(h.ready[0].config.backend.compatibility));
});

test('S-invalid: an invalid configuration reaches onFailure only', async () => {
  const start = await freshStartup();
  const h = hooks(async () => P.validateRuntimeConfigBytes(new TextEncoder().encode('{"schemaVersion":"2.0"}'), CONTEXT));
  const outcome = await start(h.startup);
  assert.equal(h.ready.length, 0);
  assert.equal(h.failures.length, 1);
  assert.equal(h.failures[0], outcome);
  assert.equal(outcome.code, 'CFG_VERSION_UNSUPPORTED');
  const text = P.describeRuntimeConfigFailure(outcome);
  assert.deepEqual(Object.keys(text).sort(), ['detail', 'diagnosticId', 'title']);
  assert.equal(text.diagnosticId, outcome.diagnosticId);
  assert.equal(`${text.title} ${text.detail}`.includes('2.0'), false);
});

test('S-fail-open: load rejects -> CFG_INTERNAL failure, onReady never called', async () => {
  const start = await freshStartup();
  const h = hooks(async () => { throw new Error('loader crashed'); });
  const outcome = await start(h.startup);
  assert.equal(h.ready.length, 0);
  assert.equal(h.failures.length, 1);
  assertFailure(outcome, 'internal', 'CFG_INTERNAL');
  assert.equal(JSON.stringify(outcome).includes('crashed'), false);
});

test('S-fail-open: a forged unfrozen {ok:true} outcome is treated as CFG_INTERNAL', async () => {
  const start = await freshStartup();
  const forged = JSON.parse(JSON.stringify(validOutcome()));
  const h = hooks(async () => forged);
  const outcome = await start(h.startup);
  assert.equal(h.ready.length, 0);
  assertFailure(outcome, 'internal', 'CFG_INTERNAL');
  assert.equal(h.failures[0], outcome);
});

test('S-fail-open: a forged deep-frozen {ok:true} outcome not produced by the validator is treated as CFG_INTERNAL', async () => {
  const start = await freshStartup();
  const deepFreezeCopy = (v) => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) deepFreezeCopy(v[k]); Object.freeze(v); } return v; };
  const forged = deepFreezeCopy(JSON.parse(JSON.stringify(validOutcome())));
  const h = hooks(async () => forged);
  const outcome = await start(h.startup);
  assert.equal(h.ready.length, 0);
  assertFailure(outcome, 'internal', 'CFG_INTERNAL');
});

test('S-fail-open: an onReady rejection (application failed to start) shows the fail-safe state and does not reject', async () => {
  const start = await freshStartup();
  const h = hooks(async () => validOutcome());
  const failures = [];
  const outcome = await start({ load: h.startup.load, onReady: async () => { throw new Error('bootstrap failed'); }, onFailure: (f) => failures.push(f) });
  assertFailure(outcome, 'startup', 'CFG_INTERNAL');
  assert.equal(failures.length, 1);
  assert.equal(failures[0], outcome);
});

test('S-fail-open: a null or non-object outcome is treated as CFG_INTERNAL', async () => {
  for (const bogus of [null, undefined, 'ok', 1]) {
    const start = await freshStartup();
    const h = hooks(async () => bogus);
    assertFailure(await start(h.startup), 'internal', 'CFG_INTERNAL');
    assert.equal(h.ready.length, 0);
    assert.equal(h.failures.length, 1);
  }
});

test('S-replace: a second start after success is refused (CFG_STARTUP_REPEATED); onReady is not called again', async () => {
  const start = await freshStartup();
  const first = hooks(async () => validOutcome());
  await start(first.startup);
  let loaded = false;
  const other = P.validateRuntimeConfigBytes(validBytes('valid/private-cloud.json'), CONTEXT);
  const second = hooks(async () => { loaded = true; return other; });
  const outcome = await start(second.startup);
  assertFailure(outcome, 'startup', 'CFG_STARTUP_REPEATED');
  assert.equal(loaded, false, 'the replacement configuration must not even be loaded');
  assert.equal(second.ready.length, 0);
  assert.equal(second.failures.length, 1);
  assert.equal(first.ready.length, 1);
  assert.equal(first.ready[0].config.deployment.profile, 'cloud-saas');
});

test('S-replace: a second start after a failure is also refused', async () => {
  const start = await freshStartup();
  const first = hooks(async () => { throw new Error('x'); });
  await start(first.startup);
  const second = hooks(async () => validOutcome());
  assertFailure(await start(second.startup), 'startup', 'CFG_STARTUP_REPEATED');
  assert.equal(second.ready.length, 0);
});

test('S-mutation: runtime mutation after bootstrap throws and leaves values unchanged', async () => {
  const start = await freshStartup();
  let store;
  await start({ load: async () => validOutcome(), onReady: (s) => { store = s; }, onFailure: () => assert.fail('unexpected failure') });
  assert.throws(() => { store.config.backend.apiBaseUrl = 'https://evil.example.test'; }, TypeError);
  assert.throws(() => { store.config.identity.mode = 'oidc'; }, TypeError);
  assert.throws(() => { store.config.features.uiHints.adminMode = true; }, TypeError);
  assert.throws(() => { Object.setPrototypeOf(store.config, {}); }, TypeError);
  assert.equal(store.config.backend.apiBaseUrl, 'https://api.saas.example.test');
  assert.equal(store.config.identity.mode, 'frappe-session');
  assert.equal(Object.hasOwn(store.config.features.uiHints, 'adminMode'), false);
});
