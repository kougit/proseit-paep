#!/usr/bin/env node
/**
 * Seeded negatives for the IB4 Frappe adapter static gate (part of npm run qa:frappe).
 *
 * One disposable copy of the repository (without node_modules) is made. P00 runs the gate on it unchanged and must
 * reproduce the gate's result on the repository exactly. Every other case applies one mutation, runs frappe-qa.mjs
 * --root <copy> --json, restores the copy, and passes only when its target check FAILS with the expected finding and
 * every other check keeps its P00 result (no collateral failure). The case count is pinned.
 *   node tooling/frappe-adapter/frappe-qa-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE = path.join(root, 'tooling/frappe-adapter/frappe-qa.mjs');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments', '.git']);
const EXPECTED_CASES = 37;
const CONTROLS = 1;
const SDK = 'packages/frappe-sdk/src';
const INDEX = `${SDK}/index.ts`;
const PROBE = `${SDK}/lib/probe.ts`;
const MANIFEST = 'tooling/frappe-adapter/fixtures/manifest.json';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-frappe-negative-'));
const copy = path.join(scratch, 'repo');
fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });

const run = (dir) => {
  const env = { ...process.env };
  delete env.PAEP_EVIDENCE_DIR;
  const r = spawnSync(process.execPath, [GATE, '--root', dir, '--json'], { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  try {
    return { status: r.status, report: JSON.parse(r.stdout) };
  } catch {
    return { status: r.status, report: null, out: `${r.stdout}${r.stderr}` };
  }
};
const append = (line) => (t) => `${t}\n${line}\n`;
const put = (text) => () => text;
const json = (fn) => (t) => { const o = JSON.parse(t); fn(o); return `${JSON.stringify(o, null, 2)}\n`; };

const results = [];
const summary = (report) => (report?.checks || []).map((c) => `${c.id}:${c.pass ? 'PASS' : 'FAIL'}`).join(' ');
const here = run(root);
const there = run(copy);
const baseline = new Map((there.report?.checks || []).map((c) => [c.id, c.pass]));
results.push({ id: 'P00', name: 'control: the unmutated copy reproduces the gate result on the repository', pass: Boolean(here.report && there.report) && summary(here.report) === summary(there.report) && here.status === there.status, detail: `${summary(there.report)} (exit ${there.status})` });

function negative(id, name, edits, target, finding, also = []) {
  const saved = new Map();
  let r;
  try {
    for (const [file, fn] of edits) {
      const p = path.join(copy, file);
      const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
      if (!saved.has(file)) saved.set(file, before);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, fn(before ?? ''));
    }
    r = run(copy);
  } catch (e) {
    r = { status: null, report: null, out: `harness error: ${e.message}` };
  } finally {
    for (const [file, before] of saved) {
      const p = path.join(copy, file);
      if (before === null) fs.rmSync(p, { force: true });
      else fs.writeFileSync(p, before);
    }
  }
  const c = r.report?.checks.find((x) => x.id === target);
  const collateral = (r.report?.checks || []).filter((x) => x.id !== target && !also.includes(x.id) && x.pass !== baseline.get(x.id)).map((x) => x.id);
  const pass = r.status === 1 && Boolean(c) && !c.pass && finding.test(c.detail) && collateral.length === 0;
  results.push({ id, name, pass, detail: c ? `${target} ${c.pass ? 'PASS' : 'FAIL'}: ${c.detail}${collateral.length ? `; collateral ${collateral.join(', ')}` : ''}` : r.out || 'no report' });
}

const sdkImport = (spec) => [[PROBE, put(`import '${spec}';\nexport const probe = 1;\n`)]];
// Architecture (authorisation §15).
negative('N01', 'adapter imports the components package (UI)', sdkImport('@proseit/paep-components'), 'F01', /probe\.ts: @proseit\/paep-components not permitted/);
negative('N02', 'adapter imports the foundation package (UI)', sdkImport('@proseit/paep-foundation'), 'F01', /@proseit\/paep-foundation not permitted/);
negative('N03', 'adapter imports the i18n package', sdkImport('@proseit/paep-i18n'), 'F01', /@proseit\/paep-i18n not permitted/);
negative('N04', 'adapter imports Angular HttpClient', sdkImport('@angular/common/http'), 'F01', /@angular\/common\/http not permitted/, ['F09']);
negative('N05', 'adapter imports a socket client (new runtime dependency)', sdkImport('socket.io-client'), 'F01', /socket\.io-client not permitted/);
negative('N06', 'relative import that leaves the adapter package', sdkImport('../../../enterprise/src/index'), 'F01', /relative import leaves the package/);
negative('N07', 'test file inside the adapter source', [[`${SDK}/lib/probe.spec.ts`, put('export const probe = 1;\n')]], 'F01', /test file in the adapter source/);
negative('N08', 'a Frappe wire type exported publicly', [[PROBE, put('export interface FrappeDoc { readonly doctype: string }\nexport const FrappeWire = 1;\n')], [INDEX, append("export { FrappeWire } from './lib/probe';")]], 'F02', /unapproved export FrappeWire/);
negative('N09', 'export * in the adapter entry point', [[PROBE, put('export const probe = 1;\n')], [INDEX, append("export * from './lib/probe';")]], 'F02', /export \*/);
negative('N10', 'enterprise imports the adapter', [['packages/enterprise/src/lib/probe.ts', put("import '@proseit/frappe-sdk';\n")]], 'F03', /packages\/enterprise\/src\/lib\/probe\.ts: imports or names @proseit\/frappe-sdk/);
negative('N11', 'components imports the adapter', [['packages/components/src/lib/probe.ts', put("export const load = () => import('@proseit/frappe-sdk');\n")]], 'F03', /packages\/components\/src\/lib\/probe\.ts/);
negative('N12', 'a domain package imports the adapter', [['packages/domain-quality/src/probe.ts', put("import type { X } from '@proseit/frappe-sdk';\n")]], 'F03', /packages\/domain-quality\/src\/probe\.ts/);
negative('N13', 'analytics imports the adapter', [['packages/analytics/src/probe.ts', put("import '@proseit/frappe-sdk';\n")]], 'F03', /packages\/analytics\/src\/probe\.ts/);
negative('N14', 'the UI laboratory imports the adapter', [['apps/ui-lab/src/app/probe.ts', put("import '@proseit/frappe-sdk';\n")]], 'F03', /apps\/ui-lab\/src\/app\/probe\.ts/);
// Session / CSRF and credential persistence.
negative('N15', 'adapter reads the session cookie', [[PROBE, put('export const sid = () => document.cookie;\n')]], 'F04', /probe\.ts: document\\\.cookie/, ['F09']);
negative('N16', 'adapter persists CSRF material in localStorage', [[PROBE, put("export const keep = (t: string) => localStorage.setItem('csrf', t);\n")]], 'F04', /probe\.ts: \\blocalStorage\\b/);
negative('N17', 'adapter persists CSRF material in sessionStorage', [[PROBE, put("export const keep = (t: string) => sessionStorage.setItem('csrf', t);\n")]], 'F04', /\\bsessionStorage\\b/);
negative('N18', 'adapter persists credential material in IndexedDB', [[PROBE, put("export const db = () => indexedDB.open('paep');\n")]], 'F04', /\\bindexedDB\\b/);
negative('N19', 'adapter sends a bearer token', [[PROBE, put("export const h = (t: string) => ({ Authorization: 'Bearer ' + t });\n")]], 'F04', /\\bAuthorization\\b/);
negative('N20', 'adapter logs to the console', [[PROBE, put('export const log = (x: unknown) => console.log(x);\n')]], 'F04', /\\bconsole\\\./);
// Single point of control (arbitrary DocType access, raw server text, CSRF header, redirect).
negative('N21', 'a resource path built outside the approved resource map (arbitrary DocType access)', [[PROBE, put('export const url = (doctype: string) => `/api/resource/${doctype}`;\n')]], 'F05', /probe\.ts: .*api.*resource.* outside lib\/resources\.ts/);
negative('N22', 'raw server messages read outside the error normaliser', [[PROBE, put('export const text = (b: { _server_messages?: string }) => b._server_messages;\n')]], 'F05', /outside lib\/errors\.ts/);
negative('N23', 'the CSRF header set outside the session module', [[PROBE, put("export const h = { 'X-Frappe-CSRF-Token': 'x' };\n")]], 'F05', /outside lib\/session\.ts/);
negative('N24', 'a location redirect outside the approved login redirect', [[PROBE, put("export const go = () => globalThis.location.assign('/x');\n")]], 'F05', /outside lib\/login-redirect\.ts/);
negative('N36', 'the workflow write falls back to stock apply_workflow (no server version check)', [[`${SDK}/lib/workflow.ts`, (t) => t.replace('METHOD.applyTransition', "'/api/method/frappe.model.workflow.apply_workflow'")]], 'F05', /workflow\.ts: apply_workflow is not permitted/);
negative('N37', 'the atomic transition method named outside the method table', [[PROBE, put("export const m = '/api/method/pmra.api.v1.apply_transition';\n")]], 'F05', /probe\.ts: .*apply_transition outside lib\/methods\.ts/);
// Fixtures, provenance and secrets.
negative('N25', 'an unlisted fixture', [['tooling/frappe-adapter/fixtures/session/extra.json', put('{}\n')]], 'F06', /unlisted fixture tooling\/frappe-adapter\/fixtures\/session\/extra\.json/);
negative('N26', 'fixture provenance claims captured data', [[MANIFEST, json((m) => { m.provenance.source = 'captured'; })]], 'F06', /provenance\.source is not "synthetic"/);
negative('N27', 'a session cookie value in a fixture', [['tooling/frappe-adapter/fixtures/session/leak.json', put('{ "headers": { "set-cookie": "sid=3f9a8b7c6d5e4f3a2b1c0d9e" } }\n')], [MANIFEST, (t) => t]], 'F07', /leak\.json: secret signature/, ['F06']);
negative('N28', 'a CSRF token value in an adapter test', [['tooling/frappe-adapter/test/unit/leak.test.mjs', put("const h = { 'X-Frappe-CSRF-Token': 'a1b2c3d4e5f6a7b8c9d0e1f2' };\n")]], 'F07', /leak\.test\.mjs: secret signature/);
negative('N29', 'an API key pair in the adapter', [[PROBE, put("export const k = 'token 0123456789abcde:0123456789abcde';\n")]], 'F07', /probe\.ts: secret signature/);
// Config / CSP.
negative('N30', 'wildcard connect-src in the deployment CSP', [['apps/reference-app/deployment/csp-strict.json', (t) => t.replace(`"connect-src": ["'self'"]`, `"connect-src": ["'self'", "https:"]`)]], 'F08', /connect-src https: \(wildcard, scheme-only or insecure source\)/);
negative('N31', 'insecure non-loopback HTTP backend in the runtime-config example', [['apps/reference-app/public/config/runtime-config.json', json((c) => { c.backend.apiBaseUrl = 'http://api.example.test'; })]], 'F08', /insecure endpoint backend\.apiBaseUrl http:\/\/api\.example\.test/);
negative('N32', 'a secret added to the runtime-config example', [['apps/reference-app/public/config/runtime-config.json', json((c) => { c.identity.csrfToken = 'synthetic'; })]], 'F08', /secret-named key identity\.csrfToken/);
// No new UI (D6).
negative('N33', 'DOM markup created in the adapter', [[PROBE, put("export const el = () => document.createElement('dialog');\n")]], 'F09', /probe\.ts: DOM or markup in the adapter/);
negative('N34', 'markup in an adapter template literal', [[PROBE, put('export const html = (n: number) => `<div class="x">${n}</div>`;\n')]], 'F09', /probe\.ts: DOM or markup in the adapter/);
negative('N35', 'markup string assigned through insertAdjacentHTML', [[PROBE, put("export const add = (e: { insertAdjacentHTML(p: string, h: string): void }) => e.insertAdjacentHTML('beforeend', 'x');\n")]], 'F09', /probe\.ts: DOM or markup in the adapter/);

fs.rmSync(scratch, { recursive: true, force: true });
const coverage = [];
if (results.length !== EXPECTED_CASES + CONTROLS) coverage.push(`${results.length - CONTROLS} negative cases (expected ${EXPECTED_CASES})`);
if (new Set(results.map((r) => r.id)).size !== results.length) coverage.push('duplicate case id');
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — ${r.detail}`);
for (const c of coverage) console.log(`FAIL ${c}`);
const failed = results.filter((r) => !r.pass).length + coverage.length;
console.log(`\nPAEP Frappe adapter static QA negatives: ${failed ? 'FAIL' : 'PASS'} (${results.filter((r) => r.pass).length}/${results.length}; ${EXPECTED_CASES} seeded negatives + ${CONTROLS} control)`);
process.exit(failed ? 1 : 0);
