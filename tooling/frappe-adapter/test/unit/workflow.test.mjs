// IB4 workflow (AC-IB4-04) and write concurrency / idempotency (AC-IB4-07), including the atomic transition method of
// ADR-011 §2.8 (PO/SA M1 decision 2026-10-16): proofs A-F against the contract double, and the fail-safe without it.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, transitionBackend, X } from '../support/backend.mjs';

const DOC = { name: 'INS-0001', modified: '2026-10-15 09:00:00.000001', title: 'Site A', status: 'Open', workflow_state: 'Pending Review', docstatus: 0 };
const READ = (doc = DOC) => ({ request: { method: 'GET', path: '/api/resource/PMRA%20Inspection/INS-0001' }, response: json(200, { data: doc }) });
const TRANSITIONS = (actions = ['Approve', 'Reject']) => ({ request: { method: 'GET', path: '/api/method/frappe.model.workflow.get_transitions' }, response: json(200, { message: actions.map((action) => ({ action, next_state: 'x', allowed: 'Reviewer' })) }) });
const APPLY = (status = 200, body = { message: { record: { ...DOC, workflow_state: 'Approved', modified: '2026-10-15 09:05:00.000001' } } }) => ({ request: { method: 'POST', path: '/api/method/pmra.api.v1.apply_transition' }, response: json(status, body) });
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
  assert.deepEqual(post.body, { doctype: 'PMRA Inspection', name: 'INS-0001', action: 'Approve', expected_version: TOKEN.serverVersion });
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

// M1 (ADR-011 §2.8, PO/SA decision 2026-10-16): the version check and the transition are one server operation. Each proof
// runs the real adapter against the contract double, which keeps the record and every applied business effect.
async function against(options) {
  const double = transitionBackend(options);
  const { adapter } = makeAdapter([], { fetch: double.fetch });
  await adapter.session.check();
  const approve = (over = {}) => adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op-m1-0001', ...over });
  const writes = () => double.calls.filter((c) => c.method === 'POST');
  return { adapter, double, approve, writes };
}
const conflict = (e) => e.code === 'RECORD_CONFLICT' && e.category === 'conflict' && !e.retryable && /^[A-Za-z0-9_-]{8,64}$/.test(e.correlationId);
const noStockApply = (double) => assert.ok(double.calls.every((c) => !c.path.includes('apply_workflow')), 'stock apply_workflow is never requested');

test('M1-A: a matching version is applied by the server method, which returns the new state and version', async () => {
  const { double, approve, writes } = await against();
  const result = await approve();
  assert.deepEqual([result.state.stateKey, result.concurrency.serverVersion, result.state.concurrency.serverVersion], ['approved', double.record.modified, double.record.modified]);
  assert.notEqual(result.concurrency.serverVersion, TOKEN.serverVersion);
  assert.deepEqual(double.effects.map((e) => e.state), ['Approved']);
  assert.deepEqual(writes().map((c) => [c.path, c.body.expected_version, c.headers['X-Idempotency-Key']]), [['/api/method/pmra.api.v1.apply_transition', TOKEN.serverVersion, 'op-m1-0001']]);
  noStockApply(double);
});

test('M1-B: a stale version is a conflict and nothing is applied', async () => {
  // The advisory re-read already sees the newer version: the adapter refuses without writing.
  const early = await against();
  early.double.record.modified = '2026-10-15 09:09:09.000001';
  await assert.rejects(early.approve(), (e) => conflict(e));
  assert.deepEqual([early.writes().length, early.double.effects, early.double.record.workflow_state], [0, [], 'Pending Review']);
  // The server is the authority: a stale version that reaches it is refused there with a conflict, nothing applied.
  const late = await against({ beforeMutation: ({ record }) => { record.modified = '2026-10-15 09:09:09.000001'; } });
  await assert.rejects(late.approve(), (e) => conflict(e));
  assert.deepEqual([late.writes().length, late.double.effects, late.double.record.workflow_state], [1, [], 'Pending Review']);
});

test('M1-C: a change after the pre-check and before the mutation is detected by the server: conflict, not applied', async () => {
  // Another user approves and sends the record back between the adapter's re-read and its write.
  const { adapter, double, approve } = await against({ beforeMutation: ({ record }) => { record.workflow_state = 'Pending Review'; record.modified = '2026-10-15 09:08:00.000001'; record.title = 'Site A (edited)'; } });
  await assert.rejects(approve(), (e) => conflict(e) && !JSON.stringify(e).includes('synthetic'));
  assert.deepEqual([double.effects, double.record.workflow_state], [[], 'Pending Review']);
  // The caller reconciles from the server before another attempt, which then succeeds against the current version.
  const fresh = await adapter.workflow.getState({ recordType: 'inspection', id: 'INS-0001' });
  assert.equal(fresh.concurrency.serverVersion, '2026-10-15 09:08:00.000001');
  const retried = await adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: fresh.concurrency, idempotencyKey: 'op-m1-0002' });
  assert.equal(retried.state.stateKey, 'approved');
  assert.equal(double.effects.length, 1);
  noStockApply(double);
});

test('M1-D: an action that is no longer allowed is rejected by the server and no transition happens', async () => {
  const { double, approve } = await against({ beforeMutation: ({ rules }) => { rules.actions = { 'Pending Review': { Reject: 'Draft' } }; } });
  await assert.rejects(approve(), (e) => e.code === 'WORKFLOW_ACTION_NOT_ALLOWED' && e.category === 'authorization' && Boolean(e.correlationId));
  assert.deepEqual([double.effects, double.record.workflow_state, double.record.modified], [[], 'Pending Review', TOKEN.serverVersion]);
});

test('M1-E: the same idempotent command retried has one business effect and returns the first result', async () => {
  // A double submission: both requests pass the advisory re-read before either reaches the server, so both writes
  // arrive with the same key. The first is applied; the server returns its result for the second without applying it.
  let release;
  const second = new Promise((r) => { release = r; });
  let entered = 0;
  const { adapter, double, approve, writes } = await against({ beforeMutation: async () => { entered += 1; if (entered === 1) await second; else release(); } });
  const [first, again] = await Promise.all([approve(), approve()]);
  assert.deepEqual(again, { ...first, correlationId: again.correlationId });
  assert.equal(first.state.stateKey, 'approved');
  assert.deepEqual(double.effects.map((e) => e.key), ['op-m1-0001']);
  assert.deepEqual(writes().map((c) => c.headers['X-Idempotency-Key']), ['op-m1-0001', 'op-m1-0001']);
  // A later retry of the same command finds the record already moved on: refused before any write, no second effect;
  // the caller reconciles from the server, which shows the first result.
  await assert.rejects(approve(), (e) => conflict(e));
  assert.equal(writes().length, 2);
  assert.equal((await adapter.workflow.getState({ recordType: 'inspection', id: 'INS-0001' })).stateKey, 'approved');
  // The key cannot be reused for a different command: the server refuses it and applies nothing.
  double.rules.actions = { Approved: { Reject: 'Draft' } };
  await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'reject', concurrency: first.concurrency, idempotencyKey: 'op-m1-0001' }), (e) => e.code === 'VALIDATION_FAILED');
  assert.deepEqual([writes().length, double.effects.length, double.record.workflow_state], [3, 1, 'Approved']);
  noStockApply(double);
});

test('M1-F: permission denied by the server is an authorization error and no transition happens', async () => {
  const { double, approve } = await against({ writable: false });
  await assert.rejects(approve(), (e) => e.code === 'PERMISSION_DENIED' && e.category === 'authorization' && !JSON.stringify(e).includes('synthetic'));
  assert.deepEqual([double.effects, double.record.workflow_state], [[], 'Pending Review']);
});

test('M1 fail-safe: a backend without the atomic method fails the transition and never falls back to stock apply_workflow', async () => {
  const absent = await against({ method: false });
  await assert.rejects(absent.approve(), (e) => typeof e.code === 'string' && !e.retryable && Boolean(e.correlationId));
  assert.deepEqual([absent.writes().length, absent.double.effects, absent.double.record.workflow_state], [1, [], 'Pending Review']);
  noStockApply(absent.double);
  // Whatever an absent or misrouted method answers (not found, a proxy page, a bare document), nothing else is sent.
  for (const reply of [json(404, { exc_type: 'DoesNotExistError' }), { status: 404, raw: '<html>not found</html>' }, json(200, { message: { ...DOC, workflow_state: 'Approved' } }), json(200, { message: { record: { ...DOC, name: 'INS-0002', workflow_state: 'Approved' } } }), json(200, { message: { record: { ...DOC, workflow_state: 'Approved' } } })]) {
    const { adapter, backend } = makeAdapter([...signedIn, X.compatible, READ(), TRANSITIONS(), { request: APPLY().request, response: reply }]);
    await adapter.session.check();
    await assert.rejects(adapter.workflow.transition('inspection', { recordId: 'INS-0001', actionId: 'approve', concurrency: TOKEN, idempotencyKey: 'op-m1-0003' }), (e) => typeof e.code === 'string' && !e.retryable);
    assert.deepEqual([backend.remaining(), backend.calls.filter((c) => c.method === 'POST').length], [0, 1]);
  }
});
