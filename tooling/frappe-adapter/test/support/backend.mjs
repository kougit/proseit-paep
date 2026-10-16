/**
 * Test support for the IB4 adapter suites: loads the strictly compiled adapter (PAEP_FRAPPE_SDK_DIST, set by
 * run-frappe-tests.mjs), the approved test resource map, and a scripted fetch double that answers recorded exchanges in
 * order and records every request it receives. Synthetic data only; no credential, cookie value or real token.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const sdk = await import(pathToFileURL(process.env.PAEP_FRAPPE_SDK_DIST).href);
export const FIXTURES = process.env.PAEP_FRAPPE_FIXTURES;
export const ORIGIN = 'https://backend.example.test';
export const SYNTHETIC_CSRF = 'synthetic0csrf0token0value0001';

export const RESOURCE_DEFINITION = {
  inspection: {
    doctype: 'PMRA Inspection',
    fields: { title: 'title', status: 'status', score: 'score', site: 'site_code' },
    sortable: ['title', 'score'],
    filterable: { status: ['eq', 'in', 'notIn'], score: ['gt', 'gte', 'lt', 'lte', 'between'], title: ['contains', 'startsWith'], site: ['eq', 'isNull', 'isNotNull'] },
    workflow: {
      stateField: 'workflow_state',
      states: { Draft: { key: 'draft', labelKey: 'inspection.state.draft' }, 'Pending Review': { key: 'review', labelKey: 'inspection.state.review' }, Approved: { key: 'approved', labelKey: 'inspection.state.approved' } },
      actions: { 'Submit for Review': { id: 'submit', labelKey: 'inspection.action.submit' }, Approve: { id: 'approve', labelKey: 'inspection.action.approve' }, Reject: { id: 'reject', labelKey: 'inspection.action.reject' } },
    },
    files: true,
  },
  site: { doctype: 'PMRA Site', fields: { label: 'site_name' } },
};

export const json = (status, body, headers = {}) => ({ status, body, headers });

/** A scripted fetch: each call must match the next exchange's method and path; the response is replayed. */
export function scriptedFetch(exchanges) {
  const calls = [];
  const queue = [...exchanges];
  const fetch = async (url, init) => {
    const u = new URL(url);
    calls.push({ url, method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), headers: { ...init.headers }, body: init.body === undefined ? undefined : JSON.parse(init.body), init });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected request ${init.method} ${u.pathname}`);
    if (next.request && (next.request.method !== init.method || next.request.path !== u.pathname)) throw new Error(`request ${init.method} ${u.pathname} does not match the recorded ${next.request.method} ${next.request.path}`);
    if (next.network) throw new TypeError('network down');
    if (next.hang) return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    const r = next.response ?? next;
    const text = r.raw !== undefined ? r.raw : r.body === undefined ? '' : JSON.stringify(r.body);
    const headers = new Map(Object.entries(r.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    return { ok: r.status >= 200 && r.status < 300, status: r.status, headers: { get: (n) => headers.get(n.toLowerCase()) ?? null }, text: async () => text };
  };
  return { fetch, calls, remaining: () => queue.length };
}

let seq = 0;
export const sequentialIds = () => { const prefix = `REQ-TEST${String(++seq).padStart(4, '0')}`; let n = 0; return () => `${prefix}X${String(++n).padStart(6, '0')}`; };

export function makeAdapter(exchanges, overrides = {}) {
  const backend = scriptedFetch(exchanges);
  const navigations = [];
  const sleeps = [];
  const adapter = sdk.createFrappeAdapter({
    backendOrigin: ORIGIN, apiContract: 'pmra-api-v1', schemaVersion: '1.0',
    resources: sdk.compileResourceMap(RESOURCE_DEFINITION),
    fetch: backend.fetch, navigate: (u) => navigations.push(u), newId: sequentialIds(),
    now: () => new Date('2026-10-15T09:00:00Z'), sleep: async (ms) => { sleeps.push(ms); },
    ...overrides,
  });
  return { adapter, backend, navigations, sleeps };
}

/** Recorded exchanges used across suites. */
export const X = {
  compatible: { request: { method: 'GET', path: '/api/method/pmra.api.v1.get_compatibility' }, response: json(200, { message: { api_contract: 'pmra-api-v1', minimum_paep: '1.0', maximum_paep: null } }) },
  loggedUser: (user = 'inspector@example.test') => ({ request: { method: 'GET', path: '/api/method/frappe.auth.get_logged_user' }, response: json(200, { message: user }) }),
  session: (over = {}) => ({ request: { method: 'GET', path: '/api/method/pmra.api.v1.get_session' }, response: json(200, { message: { user: 'inspector@example.test', full_name: 'Example Inspector', tenant: { id: 'tenant-01', name: 'Example Tenant' }, csrf_token: SYNTHETIC_CSRF, capabilities: [{ id: 'inspection.create', enabled: true }, { id: 'inspection.delete', enabled: false }, { id: 'site.read', enabled: true }], ...over } }) }),
};

/** Every fixture case of the manifest, with its parsed content. */
export function fixtureCases() {
  const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'manifest.json'), 'utf8'));
  return { manifest, cases: manifest.files.map((f) => ({ ...f, data: JSON.parse(fs.readFileSync(path.join(FIXTURES, f.path), 'utf8')) })) };
}

/**
 * Contract double of the pmra-api-v1 atomic transition method (ADR-011 §2.8, §2.12): a synthetic, in-memory backend with one
 * workflow record. `pmra.api.v1.apply_transition` does, as one step with no gap for another request: authenticate and
 * check CSRF, resolve the approved DocType and record, check permission, return the stored result for a replayed
 * idempotency key, compare the expected version with the current one, revalidate the action against the current state,
 * then apply it and store the result. `effects` lists every business effect applied. The hooks change the record or
 * the rules between the adapter's advisory re-read and the mutation, as a concurrent user would. Stock
 * `frappe.model.workflow.apply_workflow` is deliberately not served, so any request for it fails the test.
 */
export function transitionBackend({ actions = { 'Pending Review': { Approve: 'Approved', Reject: 'Draft' } }, writable = true, method = true, beforeMutation } = {}) {
  const record = { name: 'INS-0001', modified: '2026-10-15 09:00:00.000001', title: 'Site A', status: 'Open', workflow_state: 'Pending Review', docstatus: 0 };
  const rules = { actions, writable };
  const effects = [];
  const replies = new Map();
  const calls = [];
  let clock = 0;
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, text: async () => JSON.stringify(body) });
  const fail = (status, exc_type) => reply(status, { exc_type, exception: `frappe.exceptions.${exc_type}: synthetic internal detail`, exc: '["Traceback (most recent call last): synthetic"]' });
  const exchanges = { compatible: X.compatible, loggedUser: X.loggedUser(), session: X.session() };
  const fetch = async (url, init) => {
    const u = new URL(url);
    const body = init.body === undefined ? undefined : JSON.parse(init.body);
    calls.push({ method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), headers: { ...init.headers }, body });
    const canned = Object.values(exchanges).find((x) => x.request.method === init.method && x.request.path === u.pathname);
    if (canned) return reply(canned.response.status, canned.response.body);
    if (init.method === 'GET' && u.pathname === '/api/resource/PMRA%20Inspection/INS-0001') return reply(200, { data: { ...record } });
    if (init.method === 'GET' && u.pathname === '/api/method/frappe.model.workflow.get_transitions') {
      return reply(200, { message: Object.entries(rules.actions[record.workflow_state] ?? {}).map(([action, next_state]) => ({ action, next_state, allowed: 'Reviewer' })) });
    }
    // A backend without the method answers as stock Frappe does for an unknown command.
    if (init.method === 'POST' && u.pathname === '/api/method/pmra.api.v1.apply_transition' && !method) return fail(417, 'ValidationError');
    if (init.method === 'POST' && u.pathname === '/api/method/pmra.api.v1.apply_transition') {
      if (init.headers['X-Frappe-CSRF-Token'] !== SYNTHETIC_CSRF) return fail(400, 'CSRFTokenError');
      await beforeMutation?.({ record, rules });
      // From here to the reply is one synchronous step: nothing else can run in between (the double's "transaction").
      if (body.doctype !== 'PMRA Inspection' || body.name !== record.name) return fail(404, 'DoesNotExistError');
      if (!rules.writable) return fail(403, 'PermissionError');
      const key = init.headers['X-Idempotency-Key'];
      if (typeof key !== 'string' || !key.length) return fail(417, 'ValidationError');
      const command = JSON.stringify([body.doctype, body.name, body.action, body.expected_version]);
      const seen = replies.get(key);
      if (seen) return seen.command === command ? reply(200, seen.body) : fail(417, 'ValidationError');
      if (body.expected_version !== record.modified) return fail(409, 'TimestampMismatchError');
      const next = rules.actions[record.workflow_state]?.[body.action];
      if (next === undefined) return fail(403, 'WorkflowTransitionError');
      record.workflow_state = next;
      record.modified = `2026-10-15 09:${String(10 + ++clock).padStart(2, '0')}:00.000001`;
      effects.push({ key, action: body.action, state: next });
      const result = { message: { record: { ...record } } };
      replies.set(key, { command, body: result });
      return reply(200, result);
    }
    throw new Error(`the contract double does not serve ${init.method} ${u.pathname}`);
  };
  return { fetch, calls, record, rules, effects };
}
