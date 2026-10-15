// IB4 transport, error and correlation rules (AC-IB4-02, -06, -07, -10).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, ORIGIN, sdk, SYNTHETIC_CSRF, X } from '../support/backend.mjs';

const RECORD = { request: { method: 'GET', path: '/api/resource/PMRA%20Inspection/INS-0001' }, response: json(200, { data: { name: 'INS-0001', modified: '2026-10-15 09:00:00.000001', title: 'Site A', status: 'Open' } }) };
const failing = (status, body = {}) => ({ request: RECORD.request, response: json(status, body) });

test('backend origin must be an HTTPS origin without credentials, path, query or fragment', () => {
  for (const bad of ['http://backend.example.test', 'https://user:pw@backend.example.test', 'https://backend.example.test/api', 'https://backend.example.test/?a=1', 'https://backend.example.test/#x', 'ftp://backend.example.test', 'not a url', '//backend.example.test']) {
    assert.throws(() => makeAdapter([], { backendOrigin: bad }), TypeError, bad);
  }
  assert.doesNotThrow(() => makeAdapter([], { backendOrigin: 'http://localhost:8000' }));
});

test('resources must come from compileResourceMap', () => {
  assert.throws(() => makeAdapter([], { resources: { recordTypes: ['inspection'] } }), TypeError);
});

test('every request is credentialed to the backend origin only, never follows a redirect and carries a correlation id', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, RECORD]);
  await adapter.records.get({ recordType: 'inspection', id: 'INS-0001' });
  assert.equal(backend.calls.length, 2);
  for (const c of backend.calls) {
    assert.equal(new URL(c.url).origin, ORIGIN);
    assert.equal(c.init.credentials, 'include');
    assert.equal(c.init.redirect, 'error');
    assert.equal(c.init.cache, 'no-store');
    assert.match(c.headers['X-Correlation-Id'], /^[A-Za-z0-9_-]{8,64}$/);
    assert.ok(!Object.keys(c.headers).some((h) => /^authorization$/i.test(h)), 'no Authorization header');
    assert.ok(!Object.keys(c.headers).some((h) => /cookie/i.test(h)), 'no cookie header is set by the adapter');
  }
});

test('a well-formed server correlation id replaces the request id; a malformed one is ignored', async () => {
  const good = makeAdapter([X.compatible, { ...RECORD, response: { ...RECORD.response, headers: { 'X-Correlation-Id': 'srv-correlation-0001' } } }]);
  assert.equal((await good.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' })).correlationId, 'srv-correlation-0001');
  const bad = makeAdapter([X.compatible, { ...RECORD, response: { ...RECORD.response, headers: { 'X-Correlation-Id': 'user@example.test <script>' } } }]);
  const r = await bad.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' });
  assert.equal(r.correlationId, bad.backend.calls[1].headers['X-Correlation-Id']);
});

test('a correlation id reaches every PaepError', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, failing(403, { exc_type: 'PermissionError' })]);
  await assert.rejects(adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.correlationId === backend.calls[1].headers['X-Correlation-Id']);
});

test('a state-changing request without a CSRF token fails closed before any request', async () => {
  const { adapter, backend } = makeAdapter([]);
  await assert.rejects(adapter.session.signOut(), (e) => e.code === 'CSRF_TOKEN_MISSING' && e.category === 'authentication');
  assert.equal(backend.calls.length, 0);
});

test('state-changing requests carry the CSRF header from the session check', async () => {
  const { adapter, backend } = makeAdapter([X.loggedUser(), X.session(), { request: { method: 'POST', path: '/api/method/logout' }, response: json(200, { message: null }) }]);
  assert.equal((await adapter.session.check()).status, 'authenticated');
  await adapter.session.signOut();
  const post = backend.calls[2];
  assert.equal(post.method, 'POST');
  assert.equal(post.headers['X-Frappe-CSRF-Token'], SYNTHETIC_CSRF);
  for (const get of backend.calls.slice(0, 2)) assert.equal(get.headers['X-Frappe-CSRF-Token'], undefined, 'no CSRF header on a safe request');
});

test('retryable failures of a read are retried a bounded number of times with backoff', async () => {
  const { adapter, backend, sleeps } = makeAdapter([X.compatible, failing(503), failing(503), failing(503)]);
  await assert.rejects(adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'SERVICE_UNAVAILABLE' && e.retryable === true);
  assert.equal(backend.calls.length, 4);
  assert.deepEqual(sleeps, [250, 500]);
});

test('a retry succeeds when the backend recovers', async () => {
  const { adapter } = makeAdapter([X.compatible, failing(429), RECORD]);
  assert.equal((await adapter.records.get({ recordType: 'inspection', id: 'INS-0001' })).id, 'INS-0001');
});

test('non-retryable failures are not retried', async () => {
  for (const [status, body, code] of [[417, { exc_type: 'ValidationError' }, 'VALIDATION_FAILED'], [403, { exc_type: 'PermissionError' }, 'PERMISSION_DENIED'], [404, {}, 'NOT_FOUND'], [500, {}, 'SERVICE_FAILURE']]) {
    const { adapter, backend } = makeAdapter([X.compatible, failing(status, body)]);
    await assert.rejects(adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === code && e.retryable === false);
    assert.equal(backend.calls.length, 2, code);
  }
});

test('retry attempts are configurable within 1-5 only', () => {
  for (const maxAttempts of [0, 6, 2.5, -1]) assert.throws(() => makeAdapter([], { retry: { maxAttempts } }), TypeError);
  for (const timeoutMs of [0, 60_001]) assert.throws(() => makeAdapter([], { timeoutMs }), TypeError);
});

test('a network failure and a timeout map to retryable service failures', async () => {
  const net = makeAdapter([X.compatible, { request: RECORD.request, network: true }], { retry: { maxAttempts: 1 } });
  await assert.rejects(net.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'NETWORK_UNAVAILABLE' && e.retryable);
  const slow = makeAdapter([X.compatible, { request: RECORD.request, hang: true }], { retry: { maxAttempts: 1 }, timeoutMs: 5 });
  await assert.rejects(slow.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'REQUEST_TIMEOUT' && e.retryable);
});

test('a malformed success body is a non-retryable MALFORMED_RESPONSE', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, { request: RECORD.request, response: { status: 200, raw: '{"data":' } }]);
  await assert.rejects(adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'MALFORMED_RESPONSE' && !e.retryable);
  assert.equal(backend.calls.length, 2);
});

test('PaepError carries only controlled fields and never server text, tracebacks or message lists', async () => {
  const body = { exc_type: 'ValidationError', exception: 'frappe.exceptions.ValidationError: secret detail', exc: '["Traceback (most recent call last): ..."]', _server_messages: '["{\\"message\\": \\"Row 3: internal detail\\"}"]', message: 'internal detail' };
  const { adapter } = makeAdapter([X.compatible, failing(417, body)]);
  const error = await adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }).then(() => null, (e) => e);
  assert.deepEqual(Object.keys(error).sort(), ['category', 'code', 'correlationId', 'messageKey', 'retryable']);
  assert.equal(error.messageKey, 'paep.errors.validation');
  assert.ok(Object.isFrozen(error));
  const text = JSON.stringify(error);
  for (const leak of ['secret detail', 'Traceback', 'internal detail', 'frappe.exceptions']) assert.ok(!text.includes(leak), leak);
  assert.ok(sdk.isPaepError(error));
  assert.ok(!sdk.isPaepError({ code: 'X' }));
});

test('exc_type is used only when it is a plain class name; status decides otherwise', async () => {
  const { adapter } = makeAdapter([X.compatible, failing(417, { exc_type: 'TimestampMismatchError' })]);
  await assert.rejects(adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'RECORD_CONFLICT' && e.category === 'conflict');
  const odd = makeAdapter([X.compatible, failing(403, { exc_type: 'Permission Error<script>' })]);
  await assert.rejects(odd.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'PERMISSION_DENIED');
  const proto = makeAdapter([X.compatible, failing(400, { exc_type: 'constructor' })]);
  await assert.rejects(proto.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'VALIDATION_FAILED');
});
