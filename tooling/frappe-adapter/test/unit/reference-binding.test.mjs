// IB4 S5 reference-application binding (D6/D7, AC-IB4 reference binding): the shell's session and access ports backed
// by the lazily loaded adapter. The real compiled adapter runs against the scripted backend; nothing reaches a network.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { json, ORIGIN, scriptedFetch, sequentialIds, sdk, X } from '../support/backend.mjs';

const { createFrappeShellBinding } = await import(pathToFileURL(process.env.PAEP_FRAPPE_BINDING_DIST).href);

const STORE = { config: { schemaVersion: '1.0', backend: { apiBaseUrl: ORIGIN, compatibility: { apiContract: 'pmra-api-v1' } } } };
const SAMPLE = (id) => (id === 'locked-edition' ? { state: 'locked', reason: 'edition' } : { state: 'available' });
const LOGOUT = (status) => ({ request: { method: 'POST', path: '/api/method/logout' }, response: json(status, status === 200 ? { message: null } : { exc_type: 'ValidationError' }) });

/** A binding whose loader returns the real adapter module with the scripted fetch and a navigation recorder injected. */
function bind(exchanges, { path = '/workspace', load } = {}) {
  const backend = scriptedFetch(exchanges);
  const navigations = [];
  const reports = [];
  const loader = load ?? (async () => ({
    ...sdk,
    createFrappeAdapter: (o) => sdk.createFrappeAdapter({ ...o, fetch: backend.fetch, navigate: (u) => navigations.push(u), newId: sequentialIds(), sleep: async () => {} }),
  }));
  const binding = createFrappeShellBinding(STORE, { fallbackAvailability: SAMPLE, load: loader });
  const started = binding.start({ currentPath: () => path, report: (r) => reports.push(r) });
  return { binding, backend, navigations, reports, started };
}

test('a compatible backend with a session fills the identity and keeps the host access rules', async () => {
  const { binding, backend, navigations, reports, started } = bind([X.compatible, X.loggedUser(), X.session()]);
  assert.equal(binding.access.loaded(), false);
  assert.equal(binding.session.identity(), null);
  await started;
  assert.equal(binding.access.loaded(), true);
  assert.deepEqual(binding.session.identity(), { principalId: 'inspector@example.test', displayName: 'Example Inspector', tenant: { tenantId: 'tenant-01', displayName: 'Example Tenant' } });
  assert.deepEqual(binding.access.availability('workspace'), { state: 'available' });
  assert.deepEqual(binding.access.availability('locked-edition'), { state: 'locked', reason: 'edition' });
  assert.deepEqual([navigations, reports, backend.remaining()], [[], [], 0]);
  for (const c of backend.calls) assert.deepEqual([c.init.credentials, c.init.redirect], ['include', 'error']);
});

test('no session goes to the server-hosted login with the current path; an unsafe path falls back to "/"', async () => {
  const guest = bind([X.compatible, X.loggedUser('Guest')], { path: '/workspace?tab=2' });
  await guest.started;
  assert.deepEqual(guest.navigations, [`${ORIGIN}/login?redirect-to=%2Fworkspace%3Ftab%3D2`]);
  assert.equal(guest.binding.session.identity(), null);
  const unsafe = bind([X.compatible, { request: X.loggedUser().request, response: json(401, { exc_type: 'SessionExpired' }) }], { path: '//evil.example.test/x' });
  await unsafe.started;
  assert.deepEqual(unsafe.navigations, [`${ORIGIN}/login?redirect-to=%2F`]);
  assert.deepEqual(guest.reports.concat(unsafe.reports), []);
});

test('an incompatible backend locks every navigation item as "environment", reports "version" and asks for no session', async () => {
  const blocked = { request: X.compatible.request, response: json(200, { message: { api_contract: 'pmra-api-v2', minimum_paep: '1.0', maximum_paep: null } }) };
  const { binding, backend, navigations, reports, started } = bind([blocked]);
  await started;
  assert.equal(binding.access.loaded(), true);
  for (const id of ['workspace', 'locked-edition']) assert.deepEqual(binding.access.availability(id), { state: 'locked', reason: 'environment' });
  assert.equal(reports.length, 1);
  assert.deepEqual([reports[0].kind, reports[0].retryable], ['version', false]);
  assert.match(reports[0].correlationId, /^[A-Za-z0-9_-]{8,64}$/);
  assert.deepEqual([backend.calls.length, navigations, binding.session.identity()], [1, [], null]);
});

test('an unverifiable backend (no compatibility method) is blocked and reported as a retryable version failure', async () => {
  const { binding, reports, started } = bind([{ request: X.compatible.request, response: json(404, { exc_type: 'DoesNotExistError', exception: 'synthetic internal detail' }) }]);
  await started;
  assert.deepEqual(binding.access.availability('workspace'), { state: 'locked', reason: 'environment' });
  assert.deepEqual(reports.map((r) => [r.kind, r.retryable]), [['version', true]]);
  assert.ok(!JSON.stringify(reports).includes('synthetic'));
});

test('an adapter that cannot load blocks the shell with an unverified reference; start never rejects', async () => {
  const { binding, reports, started } = bind([], { load: async () => { throw new Error('chunk failed: synthetic detail'); } });
  await started;
  assert.equal(binding.access.loaded(), true);
  assert.deepEqual(binding.access.availability('workspace'), { state: 'locked', reason: 'environment' });
  assert.deepEqual(reports, [{ kind: 'version', correlationId: 'BACKEND-UNVERIFIED', retryable: false }]);
});

test('sign-out is server-authoritative: on success the identity clears and the login follows; repeat clicks are ignored', async () => {
  const { binding, backend, navigations, started } = bind([X.compatible, X.loggedUser(), X.session(), LOGOUT(200)]);
  await started;
  binding.session.signOut();
  assert.equal(binding.session.signingOut(), true);
  binding.session.signOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(binding.session.identity(), null);
  assert.deepEqual(navigations, [`${ORIGIN}/login?redirect-to=%2F`]);
  assert.equal(backend.calls.filter((c) => c.method === 'POST').length, 1);
  assert.equal(backend.calls.at(-1).headers['X-Frappe-CSRF-Token'], X.session().response.body.message.csrf_token);
});

test('a failed sign-out keeps the identity, ends the pending state and reports "unknown"; a gone session signs out; an invalid session reports', async () => {
  // The failure is reported, the user stays signed in, and the session is checked again for a fresh token, so the
  // retried sign-out reaches the server with it.
  const { binding, backend, navigations, reports, started } = bind([X.compatible, X.loggedUser(), X.session(), LOGOUT(417), X.loggedUser(), X.session(), LOGOUT(200)]);
  await started;
  binding.session.signOut();
  binding.session.signOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(binding.session.signingOut(), false);
  assert.equal(binding.session.identity()?.principalId, 'inspector@example.test');
  // A repeat click while the failure and the re-check are pending is ignored: one report, one logout request.
  assert.deepEqual([navigations, reports.map((r) => [r.kind, r.retryable])], [[], [['unknown', true]]]);
  assert.equal(backend.calls.filter((c) => c.method === 'POST').length, 1);
  binding.session.signOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(backend.calls.at(-1).headers['X-Frappe-CSRF-Token'], X.session().response.body.message.csrf_token);
  assert.deepEqual([binding.session.identity(), navigations], [null, [`${ORIGIN}/login?redirect-to=%2F`]]);
  // A click while the re-check after a failed sign-out is still pending is ignored (no second report or request).
  let release;
  const gate = new Promise((r) => { release = r; });
  const held = scriptedFetch([X.compatible, X.loggedUser(), X.session(), LOGOUT(417), X.loggedUser(), X.session()]);
  const heldReports = [];
  let checks = 0;
  const slow = createFrappeShellBinding(STORE, {
    fallbackAvailability: SAMPLE,
    load: async () => ({
      ...sdk,
      createFrappeAdapter: (o) => {
        const a = sdk.createFrappeAdapter({ ...o, fetch: held.fetch, navigate: () => {}, newId: sequentialIds(), sleep: async () => {} });
        return { ...a, session: { ...a.session, check: async () => { checks += 1; if (checks === 2) await gate; return a.session.check(); } } };
      },
    }),
  });
  await slow.start({ currentPath: () => '/workspace', report: (r) => heldReports.push(r) });
  slow.session.signOut();
  while (checks < 2) await new Promise((r) => setTimeout(r, 0));
  assert.equal(slow.session.signingOut(), true);
  slow.session.signOut();
  release();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(slow.session.signingOut(), false);
  assert.deepEqual([heldReports.length, held.calls.filter((c) => c.method === 'POST').length, held.remaining()], [1, 1, 0]);
  // A rejected CSRF token is not "already signed out": the user stays signed in and the failure is reported.
  const rejected = bind([X.compatible, X.loggedUser(), X.session(), { request: LOGOUT(200).request, response: json(400, { exc_type: 'CSRFTokenError' }) }, X.loggedUser(), X.session()]);
  await rejected.started;
  rejected.binding.session.signOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(rejected.binding.session.identity()?.principalId, 'inspector@example.test');
  assert.deepEqual([rejected.navigations, rejected.reports.map((r) => r.kind), rejected.backend.remaining()], [[], ['unknown'], 0]);
  // The server says the session is already gone: the user is treated as signed out and goes to the login.
  const gone = bind([X.compatible, X.loggedUser(), X.session(), { request: LOGOUT(200).request, response: json(401, { exc_type: 'SessionExpired' }) }]);
  await gone.started;
  gone.binding.session.signOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual([gone.binding.session.identity(), gone.navigations, gone.reports], [null, [`${ORIGIN}/login?redirect-to=%2F`], []]);
  const invalid = bind([X.compatible, X.loggedUser(), X.session({ tenant: null })]);
  await invalid.started;
  assert.deepEqual([invalid.binding.session.identity(), invalid.navigations, invalid.reports.map((r) => r.kind)], [null, [], ['unknown']]);
  assert.match(invalid.reports[0].correlationId, /^[A-Za-z0-9_-]{8,64}$/);
});
