// IB4 pmra-api-v1 compatibility (D10, AC-IB4-09) and capability discovery.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, X } from '../support/backend.mjs';

const COMPAT = (message, status = 200) => ({ request: X.compatible.request, response: json(status, status === 200 ? { message } : {}) });

test('a compatible backend proceeds and is reported with the contract and PAEP range', async () => {
  const { adapter } = makeAdapter([COMPAT({ api_contract: 'pmra-api-v1', minimum_paep: '1.0', maximum_paep: '1.9' })]);
  assert.deepEqual(await adapter.compatibility.check(), { status: 'compatible', schemaVersion: '1.0', apiContract: 'pmra-api-v1', paepVersion: '1.1', minimumPaep: '1.0', maximumPaep: '1.9' });
});

test('a known-incompatible backend is blocked', async () => {
  for (const message of [{ api_contract: 'pmra-api-v2', minimum_paep: '1.0', maximum_paep: null }, { api_contract: 'pmra-api-v1', minimum_paep: '1.2', maximum_paep: null }, { api_contract: 'pmra-api-v1', minimum_paep: '0.9', maximum_paep: '1.0' }]) {
    const { adapter } = makeAdapter([COMPAT(message)]);
    const r = await adapter.compatibility.check();
    assert.equal(r.status, 'incompatible');
    assert.equal(r.code, 'BACKEND_INCOMPATIBLE');
  }
  const configured = makeAdapter([], { apiContract: 'other-api' });
  assert.equal((await configured.adapter.compatibility.check()).status, 'incompatible');
  assert.equal(configured.backend.calls.length, 0);
});

test('unknown or unverifiable compatibility is blocked and surfaced, never treated as compatible', async () => {
  const cases = [COMPAT(null), COMPAT({ api_contract: 'pmra-api-v1' }), COMPAT({ api_contract: 'pmra-api-v1', minimum_paep: 'one', maximum_paep: null }), COMPAT({}, 404), COMPAT({}, 500), { request: X.compatible.request, network: true }, { request: X.compatible.request, response: { status: 200, raw: '<html>' } }];
  for (const x of cases) {
    const { adapter } = makeAdapter([x, x, x], { retry: { maxAttempts: 1 } });
    const r = await adapter.compatibility.check();
    assert.equal(r.status, 'unknown');
    assert.equal(r.code, 'BACKEND_COMPATIBILITY_UNKNOWN');
  }
});

test('protected ports stay blocked until compatibility is verified; a compatible result is reused', async () => {
  const blocked = makeAdapter([COMPAT({ api_contract: 'pmra-api-v2', minimum_paep: '1.0', maximum_paep: null })]);
  await assert.rejects(blocked.adapter.records.list({ recordType: 'inspection' }), (e) => e.code === 'BACKEND_INCOMPATIBLE' && e.category === 'service-failure');
  assert.equal(blocked.backend.calls.length, 1, 'no data request is made against an incompatible backend');
  const unknown = makeAdapter([COMPAT({}, 500), X.compatible, { request: { method: 'GET', path: '/api/resource/PMRA%20Site' }, response: json(200, { data: [] }) }, { request: { method: 'GET', path: '/api/resource/PMRA%20Site' }, response: json(200, { data: [] }) }], { retry: { maxAttempts: 1 } });
  await assert.rejects(unknown.adapter.records.list({ recordType: 'site' }), (e) => e.code === 'BACKEND_COMPATIBILITY_UNKNOWN' && e.retryable);
  await unknown.adapter.records.list({ recordType: 'site' });
  await unknown.adapter.records.list({ recordType: 'site' });
  assert.equal(unknown.backend.calls.filter((c) => c.path.endsWith('get_compatibility')).length, 2, 'unknown is re-checked; compatible is cached');
});

test('capability discovery returns the server list, narrowed by record-type scope, and never invents one', async () => {
  const { adapter } = makeAdapter([X.compatible, X.session(), X.session()]);
  assert.deepEqual(await adapter.capabilities.discover(), { capabilities: [{ id: 'inspection.create', enabled: true }, { id: 'inspection.delete', enabled: false }, { id: 'site.read', enabled: true }], evaluatedAt: '2026-10-15T09:00:00.000Z' });
  assert.deepEqual((await adapter.capabilities.discover('inspection')).capabilities.map((c) => c.id), ['inspection.create', 'inspection.delete']);
  const bad = makeAdapter([X.compatible, X.session({ capabilities: [{ id: 'Admin All', enabled: 'yes' }] })]);
  await assert.rejects(bad.adapter.capabilities.discover(), (e) => e.code === 'MALFORMED_RESPONSE');
  const unknownScope = makeAdapter([]);
  await assert.rejects(unknownScope.adapter.capabilities.discover('nope'), (e) => e.code === 'UNKNOWN_RESOURCE');
  assert.equal(unknownScope.backend.calls.length, 0);
});
