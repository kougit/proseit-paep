// IB4 workflow (AC-IB4-04) and write concurrency / idempotency (AC-IB4-07).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, X } from '../support/backend.mjs';

const DOC = { name: 'INS-0001', modified: '2026-10-15 09:00:00.000001', title: 'Site A', status: 'Open', workflow_state: 'Pending Review', docstatus: 0 };
const READ = (doc = DOC) => ({ request: { method: 'GET', path: '/api/resource/PMRA%20Inspection/INS-0001' }, response: json(200, { data: doc }) });
const TRANSITIONS = (actions = ['Approve', 'Reject']) => ({ request: { method: 'GET', path: '/api/method/frappe.model.workflow.get_transitions' }, response: json(200, { message: actions.map((action) => ({ action, next_state: 'x', allowed: 'Reviewer' })) }) });
const APPLY = (status = 200, body = { message: { ...DOC, workflow_state: 'Approved', modified: '2026-10-15 09:05:00.000001' } }) => ({ request: { method: 'POST', path: '/api/method/frappe.model.workflow.apply_workflow' }, response: json(status, body) });
const TOKEN = { serverVersion: DOC.modified };
const signedIn = [X.loggedUser(), X.session()];

test('the state and allowed actions come from the server, filtered to the approved vocabulary', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, READ(), TRANSITIONS(['Approve', 'Reject', 'Delete Everything', 'Approve'])]);
  const state = await adapter.workflow.getState({ recordType: 'inspection', id: 'INS-0001' });
  assert.deepEqual(state, {
    stateKey: 'review', labelKey: 'inspection.state.review',
    allowedActions: [{ id: 'approve', labelKey: 'inspection.action.approve' }, { id: 'reject', labelKey: 'inspection.action.reject' }],
    concurrency: { serverVersion: DOC.modified },
  });
  // Only the record reference reaches the transitions URL: no field value, whatever the record holds.
  assert.deepEqual(JSON.parse(backend.calls[2].query.doc), { doctype: 'PMRA Inspection', name: 'INS-0001' });
  assert.ok(!backend.calls[2].url.includes('Site%20A') && !backend.calls[2].url.includes('Open'));
});

test('an unknown server workflow state is a malformed response, never a guess', async () => {
  const { adapter } = makeAdapter([X.compatible, READ({ ...DOC, workflow_state: 'Shadow State' })]);
  await assert.rejects(adapter.workflow.getState({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'MALFORMED_RESPONSE');
});

test('a resource without a workflow is refused before any request', async () => {
  const { adapter, backend } = makeAdapter([]);
  await assert.rejects(adapter.workflow.getState({ recordType: 'site', id: 'S-1' }), (e) => e.code === 'WORKFLOW_UNSUPPORTED');
  await assert.rejects(adapter.workflow.transition('site', { recordId: 'S-1', actionId: 'approve', concurrency: TOKEN }), (e) => e.code === 'WORKFLOW_UNSUPPORTED');
  assert.equal(backend.calls.length, 0);
});

test('an accepted transition is applied with the CSRF header, the caller token and an idempotency key', async () => {
  const { adapter, backend } = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), APPLY()]);
  await adapter.session.check();
  const result = await adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op-0001' });
  assert.equal(result.state.stateKey, 'approved');
  assert.deepEqual(result.concurrency, { serverVersion: '2026-10-15 09:05:00.000001' });
  const post = backend.calls.at(-1);
  assert.equal(post.headers['X-Frappe-CSRF-Token'] !== undefined, true);
  assert.equal(post.headers['X-Idempotency-Key'], 'op-0001');
  assert.deepEqual(post.body, { doc: { doctype: 'PMRA Inspection', name: 'INS-0001', modified: TOKEN.serverVersion }, action: 'Approve' });
});

test('an action outside the latest server set is refused before any write', async () => {
  const { adapter, backend } = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(['Reject'])]);
  await adapter.session.check();
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN }), (e) => e.code === 'WORKFLOW_ACTION_NOT_ALLOWED' && e.category === 'authorization');
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'not-in-vocabulary', concurrency: TOKEN }), () => true);
  assert.equal(backend.calls.filter((c) => c.method === 'POST').length, 0);
});

test('a stale concurrency token maps to conflict before any write; a server timestamp mismatch maps to conflict too', async () => {
  const stale = makeAdapter([...signedIn, X.compatible, READ({ ...DOC, modified: '2026-10-15 09:09:09.000000' }), TRANSITIONS()]);
  await stale.adapter.session.check();
  await assert.rejects(stale.adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN }), (e) => e.code === 'RECORD_CONFLICT' && e.category === 'conflict');
  assert.equal(stale.backend.calls.filter((c) => c.method === 'POST').length, 0);
  const server = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), APPLY(417, { exc_type: 'TimestampMismatchError' })]);
  await server.adapter.session.check();
  await assert.rejects(server.adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN }), (e) => e.code === 'RECORD_CONFLICT');
});

test('a server denial maps to an authorization error', async () => {
  for (const exc_type of ['WorkflowTransitionError', 'PermissionError']) {
    const { adapter } = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), APPLY(403, { exc_type })]);
    await adapter.session.check();
    await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN }), (e) => e.category === 'authorization');
  }
});

test('a retried write keeps its idempotency key; only retryable failures are retried, a bounded number of times', async () => {
  // A write is retried only after a rate-limit refusal (the server did not process it), keeping its key.
  const { adapter, backend, sleeps } = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), APPLY(429, {}), APPLY(429, {}), APPLY()]);
  await adapter.session.check();
  const result = await adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN });
  assert.equal(result.state.stateKey, 'approved');
  const posts = backend.calls.filter((c) => c.method === 'POST');
  assert.equal(posts.length, 3);
  assert.match(posts[0].headers['X-Idempotency-Key'], /^[A-Za-z0-9_-]{8,64}$/, 'a key is generated when the caller gives none');
  assert.ok(posts.every((p) => p.headers['X-Idempotency-Key'] === posts[0].headers['X-Idempotency-Key']));
  assert.deepEqual(sleeps, [250, 500]);
  const exhausted = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), APPLY(429, {}), APPLY(429, {}), APPLY(429, {})]);
  await exhausted.adapter.session.check();
  await assert.rejects(exhausted.adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op-0009' }), (e) => e.retryable);
  assert.equal(exhausted.backend.calls.filter((c) => c.method === 'POST').length, 3);
  // A 5xx, timeout or network failure after a write may follow a committed change: it is returned (retryable, so the
  // caller may retry with the same key after re-reading), never re-sent by the adapter.
  for (const failure of [APPLY(503, {}), APPLY(500, {}), { request: APPLY().request, network: true }]) {
    const once = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), failure]);
    await once.adapter.session.check();
    await assert.rejects(once.adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op-0010' }), (e) => typeof e.code === 'string');
    assert.equal(once.backend.calls.filter((c) => c.method === 'POST').length, 1);
    assert.deepEqual(once.sleeps, []);
  }
  const badKey = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS()]);
  await badKey.adapter.session.check();
  await assert.rejects(badKey.adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op 1\r\nX-Injected: 1' }), (e) => e.code === 'INVALID_REFERENCE' && !e.retryable);
  assert.equal(badKey.backend.calls.filter((c) => c.method === 'POST').length, 0);
});

test('reason, evidence and a missing token are refused rather than dropped', async () => {
  const { adapter, backend } = makeAdapter([]);
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', reason: 'ok', concurrency: TOKEN }), (e) => e.code === 'WORKFLOW_UNSUPPORTED_INPUT');
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', evidenceFileIds: ['f'], concurrency: TOKEN }), (e) => e.code === 'WORKFLOW_UNSUPPORTED_INPUT');
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: { etag: 'W/"1"' } }), (e) => e.code === 'CONCURRENCY_TOKEN_MISSING');
  assert.equal(backend.calls.length, 0);
});
