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
