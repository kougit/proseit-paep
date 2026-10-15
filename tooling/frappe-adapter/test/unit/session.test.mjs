// IB4 cookie session + CSRF (D3, AC-IB4-02) and the approved login redirect (D6).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, ORIGIN, SYNTHETIC_CSRF, X } from '../support/backend.mjs';

const LOGOUT = (status = 200) => ({ request: { method: 'POST', path: '/api/method/logout' }, response: json(status, status === 200 ? { message: null } : { exc_type: 'ValidationError' }) });

test('an authenticated session maps to an authenticated SessionOutcome with identity and tenant', async () => {
  const { adapter } = makeAdapter([X.loggedUser(), X.session({ expires_at: '2026-10-15T18:00:00+00:00' })]);
  assert.deepEqual(await adapter.session.check(), {
    status: 'authenticated',
    identity: { principalId: 'inspector@example.test', displayName: 'Example Inspector', tenant: { tenantId: 'tenant-01', displayName: 'Example Tenant' } },
    expiresAt: '2026-10-15T18:00:00+00:00',
  });
});

test('Guest, 401 and 403 map to unauthenticated; SessionExpired maps to expired', async () => {
  assert.deepEqual(await makeAdapter([X.loggedUser('Guest')]).adapter.session.check(), { status: 'unauthenticated' });
  for (const [status, body] of [[401, {}], [403, { exc_type: 'PermissionError' }], [401, { exc_type: 'AuthenticationError' }]]) {
    const { adapter } = makeAdapter([{ request: X.loggedUser().request, response: json(status, body) }]);
    assert.deepEqual(await adapter.session.check(), { status: 'unauthenticated' });
  }
  const { adapter } = makeAdapter([{ request: X.loggedUser().request, response: json(401, { exc_type: 'SessionExpired' }) }]);
  assert.deepEqual(await adapter.session.check(), { status: 'expired' });
});

test('malformed or inconsistent session payloads map to invalid and keep no token', async () => {
  const cases = [
    [X.loggedUser({ not: 'a user' })],
    [X.loggedUser(), X.session({ user: 'someone-else@example.test' })],
    [X.loggedUser(), X.session({ csrf_token: 'short' })],
    [X.loggedUser(), X.session({ csrf_token: 'has spaces and; semicolons' })],
    [X.loggedUser(), X.session({ tenant: null })],
    [X.loggedUser(), X.session({ expires_at: 'tomorrow' })],
    [X.loggedUser(), { request: X.session().request, response: json(500, {}) }],
  ];
  for (const exchanges of cases) {
    const { adapter, backend } = makeAdapter([...exchanges]);
    const outcome = await adapter.session.check();
    assert.equal(outcome.status, 'invalid');
    assert.ok(outcome.error && typeof outcome.error.code === 'string');
    await assert.rejects(adapter.session.signOut(), (e) => e.code === 'CSRF_TOKEN_MISSING');
    assert.equal(backend.calls.filter((c) => c.method === 'POST').length, 0);
  }
});

test('a failed re-check drops the CSRF token held from an earlier check', async () => {
  const { adapter, backend } = makeAdapter([X.loggedUser(), X.session(), { request: X.loggedUser().request, response: json(401, { exc_type: 'SessionExpired' }) }]);
  assert.equal((await adapter.session.check()).status, 'authenticated');
  assert.equal((await adapter.session.check()).status, 'expired');
  await assert.rejects(adapter.session.signOut(), (e) => e.code === 'CSRF_TOKEN_MISSING');
  assert.equal(backend.calls.length, 3);
});

test('sign-out is server-authoritative: success only on a server success, local token cleared in every case', async () => {
  const ok = makeAdapter([X.loggedUser(), X.session(), LOGOUT(200)]);
  await ok.adapter.session.check();
  const result = await ok.adapter.session.signOut();
  assert.deepEqual(result.outcome, { status: 'unauthenticated' });
  assert.match(result.correlationId, /^[A-Za-z0-9_-]{8,64}$/);
  await assert.rejects(ok.adapter.session.signOut(), (e) => e.code === 'CSRF_TOKEN_MISSING');

  const failed = makeAdapter([X.loggedUser(), X.session(), LOGOUT(417)]);
  await failed.adapter.session.check();
  await assert.rejects(failed.adapter.session.signOut(), (e) => e.category === 'validation');
  await assert.rejects(failed.adapter.session.signOut(), (e) => e.code === 'CSRF_TOKEN_MISSING');
  assert.equal(failed.backend.calls.filter((c) => c.method === 'POST').length, 1, 'a failed sign-out is not retried without an idempotency key');
});

test('the CSRF token is held in memory only: no browser store, cookie, URL or global is written', async () => {
  const writes = [];
  const store = () => ({ setItem: (k) => writes.push(`storage:${k}`), getItem: () => null, removeItem: () => {}, clear: () => {} });
  const before = new Set(Object.getOwnPropertyNames(globalThis));
  globalThis.localStorage = store();
  globalThis.sessionStorage = store();
  globalThis.indexedDB = { open: () => writes.push('indexedDB') };
  globalThis.document = { set cookie(v) { writes.push('cookie'); }, get cookie() { writes.push('cookie-read'); return ''; } };
  try {
    const { adapter, backend } = makeAdapter([X.loggedUser(), X.session(), LOGOUT(200)]);
    await adapter.session.check();
    await adapter.session.signOut();
    assert.deepEqual(writes, []);
    for (const c of backend.calls) assert.ok(!c.url.includes(SYNTHETIC_CSRF), 'token never in a URL');
    const added = Object.getOwnPropertyNames(globalThis).filter((k) => !before.has(k) && !['localStorage', 'sessionStorage', 'indexedDB', 'document'].includes(k));
    assert.deepEqual(added, []);
    assert.ok(!JSON.stringify(await Promise.resolve(adapter)).includes(SYNTHETIC_CSRF));
  } finally {
    delete globalThis.localStorage; delete globalThis.sessionStorage; delete globalThis.indexedDB; delete globalThis.document;
  }
});

test('beginSignIn navigates to the server-hosted login with an application-relative return path', async () => {
  const { adapter, navigations, backend } = makeAdapter([]);
  await adapter.session.beginSignIn({ returnPath: '/workspace/inspections?tab=open' });
  await adapter.session.beginSignIn({});
  assert.deepEqual(navigations, [`${ORIGIN}/login?redirect-to=%2Fworkspace%2Finspections%3Ftab%3Dopen`, `${ORIGIN}/login?redirect-to=%2F`]);
  assert.equal(backend.calls.length, 0);
});

test('beginSignIn refuses every return path that is not application-relative', async () => {
  const bad = ['https://evil.example/', '//evil.example/x', '/\\evil.example', '\\\\evil', 'javascript:alert(1)', '/javascript:alert(1)', 'data:text/html,x', 'workspace', '', '/%2F%2Fevil.example', '/../admin', '/a/%2e%2e/b', '/a\nb', '/a b', `/${'a'.repeat(600)}`, '/%E0%A4%A'];
  const { adapter, navigations } = makeAdapter([]);
  for (const returnPath of bad) await assert.rejects(adapter.session.beginSignIn({ returnPath }), (e) => e.code === 'RETURN_PATH_REJECTED', returnPath);
  assert.deepEqual(navigations, []);
});
