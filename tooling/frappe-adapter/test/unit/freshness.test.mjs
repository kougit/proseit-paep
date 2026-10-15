// IB4 polling freshness (D4, AC-IB4-08): invalidation signals only, authoritative reconciliation, bounded polling,
// recovery and reconnection resync.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, sdk, X } from '../support/backend.mjs';

const TYPE = { kind: 'record-type', recordType: 'inspection' };
const ONE = { kind: 'record', recordType: 'inspection', id: 'INS-0001' };
const token = (modified, name = 'INS-0001', extra = {}) => ({ request: { method: 'GET', path: '/api/resource/PMRA%20Inspection' }, response: json(200, { data: modified ? [{ name, modified, ...extra }] : [] }) });

test('the first poll sets the baseline only; a changed token emits a data-free invalidation signal', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, token('2026-10-15 09:00:00.000001', 'INS-0001', { title: 'secret value' }), token('2026-10-15 09:00:00.000001'), token('2026-10-15 09:01:00.000001')]);
  const first = await adapter.freshness.poll({ scopes: [ONE] });
  assert.deepEqual(first.signals, []);
  const same = await adapter.freshness.poll({ scopes: [ONE], cursor: first.cursor });
  assert.deepEqual(same.signals, []);
  const changed = await adapter.freshness.poll({ scopes: [ONE], cursor: same.cursor });
  assert.deepEqual(changed.signals, [{ scope: ONE, reason: 'changed', observedAt: '2026-10-15T09:00:00.000Z' }]);
  assert.ok(!JSON.stringify(changed).includes('secret value'), 'no field value travels with a signal or cursor');
  const q = backend.calls[1].query;
  assert.deepEqual(JSON.parse(q.fields), ['name', 'modified']);
  assert.equal(q.limit_page_length, '1');
  assert.deepEqual(JSON.parse(q.filters), [['name', '=', 'INS-0001']]);
});

test('a deleted record and an unreadable cursor are reported for reconciliation', async () => {
  const { adapter } = makeAdapter([X.compatible, token('2026-10-15 09:00:00.000001'), token(null), token('2026-10-15 09:00:00.000001')]);
  const a = await adapter.freshness.poll({ scopes: [ONE] });
  const b = await adapter.freshness.poll({ scopes: [ONE], cursor: a.cursor });
  assert.deepEqual(b.signals.map((s) => s.reason), ['changed']);
  const c = await adapter.freshness.poll({ scopes: [ONE], cursor: '{"tampered":' });
  assert.deepEqual(c.signals.map((s) => s.reason), ['resync']);
});

test('polls are bounded: unknown scopes, too many scopes and malformed scopes are refused before any request', async () => {
  const bad = [[], Array.from({ length: 21 }, (_, i) => ({ kind: 'record', recordType: 'inspection', id: `I-${i}` })), [{ kind: 'record-type', recordType: 'unknown' }], [{ kind: 'record', recordType: 'inspection' }], [{ kind: 'record-type', recordType: 'inspection', id: 'x' }], [{ kind: 'room', recordType: 'inspection' }]];
  for (const scopes of bad) {
    const { adapter, backend } = makeAdapter([]);
    await assert.rejects(adapter.freshness.poll({ scopes }), (e) => e.category === 'validation');
    assert.equal(backend.calls.length, 0);
  }
});

function fakeTimers() {
  const pending = [];
  return {
    pending,
    setTimeout: (fn, ms) => { const h = { fn, ms }; pending.push(h); return h; },
    clearTimeout: (h) => { const i = pending.indexOf(h); if (i >= 0) pending.splice(i, 1); },
    async fire() { const h = pending.shift(); assert.ok(h, 'a poll is scheduled'); h.fn(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); return h.ms; },
  };
}

/** A scripted freshness gateway: each poll returns the next batch or throws. */
function scriptedGateway(batches) {
  const requests = [];
  return { requests, poll: async (request) => { requests.push(request); const next = batches.shift(); if (!next || next instanceof Error) throw next ?? new Error('no batch'); return next; } };
}

test('the poller starts on subscription, enforces the minimum interval, and stops with the last unsubscribe', async () => {
  const timers = fakeTimers();
  const gateway = scriptedGateway([{ signals: [], cursor: 'c1' }, { signals: [{ scope: ONE, reason: 'changed', observedAt: 'x' }], cursor: 'c2' }]);
  const poller = sdk.createFreshnessPoller({ gateway, intervalMs: 10, timers });
  assert.equal(timers.pending.length, 0, 'no polling before a subscription');
  const seen = [];
  const off = poller.subscribe(ONE, (s) => seen.push(s));
  assert.equal(await timers.fire(), 0);
  assert.equal(timers.pending[0].ms, 5000, 'an interval below the minimum is raised to it');
  await timers.fire();
  assert.deepEqual(seen.map((s) => s.reason), ['changed']);
  assert.deepEqual(gateway.requests[1], { scopes: [ONE], cursor: 'c1' });
  off();
  assert.equal(timers.pending.length, 0, 'polling stops with the last subscriber');
});

test('after a failed poll the poller backs off (bounded) and the recovery triggers a resync for every scope', async () => {
  const timers = fakeTimers();
  const gateway = scriptedGateway([{ signals: [], cursor: 'c1' }, new Error('down'), new Error('down'), { signals: [], cursor: 'c2' }]);
  const poller = sdk.createFreshnessPoller({ gateway, intervalMs: 15_000, timers });
  const seen = [];
  poller.subscribe(TYPE, (s) => seen.push(s));
  poller.subscribe(ONE, (s) => seen.push(s));
  await timers.fire();
  await timers.fire();
  assert.equal(timers.pending[0].ms, 30_000);
  await timers.fire();
  assert.equal(timers.pending[0].ms, 60_000);
  await timers.fire();
  assert.deepEqual(seen.map((s) => `${s.reason}:${s.scope.kind}`).sort(), ['resync:record', 'resync:record-type', 'resync:record-type']);
  assert.ok(seen.every((s) => Object.keys(s).sort().join() === 'observedAt,reason,scope'));
  assert.equal(timers.pending[0].ms, 15_000);
});

test('reconnection after offline triggers an immediate resync; listener failures do not stop polling', async () => {
  const timers = fakeTimers();
  let notify;
  const connectivity = { current: () => 'online', subscribe: (l) => { notify = l; return () => { notify = undefined; }; } };
  const gateway = scriptedGateway([{ signals: [], cursor: 'c1' }, { signals: [], cursor: 'c2' }]);
  const poller = sdk.createFreshnessPoller({ gateway, timers, connectivity });
  const seen = [];
  poller.subscribe(ONE, () => { throw new Error('listener bug'); });
  poller.subscribe(ONE, (s) => seen.push(s.reason));
  await timers.fire();
  notify('offline');
  notify('online');
  assert.equal(timers.pending.at(-1).ms, 0);
  timers.pending.splice(0, timers.pending.length - 1);
  await timers.fire();
  assert.deepEqual(seen, ['resync']);
  assert.equal(timers.pending.length, 1);
});

test('at most twenty distinct scopes can be subscribed', () => {
  const poller = sdk.createFreshnessPoller({ gateway: scriptedGateway([]), timers: fakeTimers() });
  for (let i = 0; i < 20; i += 1) poller.subscribe({ kind: 'record', recordType: 'inspection', id: `I-${i}` }, () => {});
  assert.throws(() => poller.subscribe({ kind: 'record', recordType: 'inspection', id: 'I-20' }, () => {}), (e) => e.code === 'INVALID_QUERY');
});
