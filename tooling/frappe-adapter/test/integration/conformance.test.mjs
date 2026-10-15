// IB4 fixture conformance (D2, AC-IB4-01): every case of the versioned, synthetic fixture set is replayed through the
// strictly compiled adapter. Each recorded exchange must be requested in order, with the transport rules of D3; each
// step must resolve or reject exactly as recorded; and every exchange must be consumed.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fixtureCases, FIXTURES, makeAdapter, ORIGIN, SYNTHETIC_CSRF } from '../support/backend.mjs';

const { manifest, cases } = fixtureCases();
const PORTS = ['session', 'records', 'workflow', 'files', 'capabilities', 'freshness', 'compatibility'];
const CORRELATION = /^[A-Za-z0-9_-]{8,64}$/;

/** Exact deep equality, where the string "$correlation" stands for any well-formed correlation id. */
function same(actual, expected, at = '$') {
  if (expected === '$correlation') { assert.match(String(actual), CORRELATION, at); return; }
  if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), `${at} is an array`);
    assert.equal(actual.length, expected.length, `${at} length`);
    expected.forEach((e, i) => same(actual[i], e, `${at}[${i}]`));
    return;
  }
  if (expected && typeof expected === 'object') {
    assert.ok(actual && typeof actual === 'object', `${at} is an object`);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${at} keys`);
    for (const k of Object.keys(expected)) same(actual[k], expected[k], `${at}.${k}`);
    return;
  }
  assert.equal(actual, expected, at);
}
const subset = (actual, expected) => { for (const [k, v] of Object.entries(expected)) same(actual[k], v, `$.${k}`); };

test('the fixture manifest is versioned, synthetic, covers every port, profile and case kind, and pins every file', () => {
  assert.match(manifest.fixtureSetVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.provenance.source, 'synthetic');
  assert.equal(manifest.compatibilityContract, 'pmra-api-v1');
  const profiles = new Set(manifest.profiles.map((p) => p.id));
  for (const c of cases) {
    assert.ok(profiles.has(c.profile), `${c.path} profile`);
    assert.equal(c.data.profile, c.profile);
    assert.equal(c.data.id, c.id);
    assert.equal(c.data.kind, c.kind);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(FIXTURES, c.path))).digest('hex'), c.sha256, c.path);
  }
  const ports = new Set(cases.flatMap((c) => c.data.steps.map((s) => s.call.port)));
  assert.deepEqual([...ports].sort(), [...PORTS].sort());
  assert.deepEqual([...new Set(cases.map((c) => c.kind))].sort(), ['conformance', 'error', 'malformed', 'security']);
  for (const p of manifest.profiles) assert.ok(cases.some((c) => c.profile === p.id), `profile ${p.id} has a case`);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

for (const c of cases) {
  test(`fixture ${c.id} (${c.kind}): ${c.data.description}`, async () => {
    const { adapter, backend } = makeAdapter(c.data.exchanges.map((x) => ({ request: x.request, response: x.response })));
    let last;
    const outputs = [];
    for (const [i, step] of c.data.steps.entries()) {
      const args = step.call.args.map((a) => (a && typeof a === 'object' && a.cursor === '$cursor' ? { ...a, cursor: last.cursor } : a));
      const port = adapter[step.call.port];
      let outcome;
      try { outcome = { value: await port[step.call.method](...args) }; } catch (e) { outcome = { error: e }; }
      outputs.push(outcome);
      const where = `step ${i + 1} ${step.call.port}.${step.call.method}`;
      if (step.expect.rejects) {
        assert.ok(outcome.error, `${where} rejects`);
        same(Object.fromEntries(Object.entries(outcome.error).filter(([k]) => k !== 'messageKey')), step.expect.rejects, where);
        assert.equal(outcome.error.messageKey, `paep.errors.${outcome.error.category}`);
      } else {
        assert.ok(!outcome.error, `${where} resolves (got ${JSON.stringify(outcome.error)})`);
        if (step.expect.resolves !== undefined) same(outcome.value, step.expect.resolves, where);
        else subset(outcome.value, step.expect.resolvesMatch);
        last = outcome.value;
      }
    }
    assert.equal(backend.remaining(), 0, 'every recorded exchange was requested');
    c.data.exchanges.forEach((x, i) => {
      const call = backend.calls[i];
      assert.equal(new URL(call.url).origin, ORIGIN);
      assert.equal(call.init.credentials, 'include');
      assert.equal(call.init.redirect, 'error');
      for (const [k, v] of Object.entries(x.request.query ?? {})) assert.equal(call.query[k], v, `exchange ${i + 1} query ${k}`);
      if (x.request.method !== 'GET') assert.equal(call.headers['X-Frappe-CSRF-Token'], SYNTHETIC_CSRF, `exchange ${i + 1} carries the CSRF header`);
      else assert.equal(call.headers['X-Frappe-CSRF-Token'], undefined, `exchange ${i + 1} is a safe request without CSRF`);
    });
    // No raw server text, traceback, unmapped field or other principal survives into any result or error.
    const text = JSON.stringify(outputs);
    for (const leak of ['synthetic internal detail', 'Traceback', 'synthetic server prose', 'not mapped', 'admin@example.test', 'frappe.exceptions', 'PMRA Inspection', SYNTHETIC_CSRF]) assert.ok(!text.includes(leak), `no "${leak}" in the adapter output`);
  });
}
