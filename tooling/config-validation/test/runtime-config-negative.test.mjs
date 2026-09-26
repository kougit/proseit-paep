// PAEP IB1 runtime configuration: negative tests. Every rejection asserts the exact first failing stage, the first code, the
// full issue list, a frozen fail-safe outcome, the diagnostic-id shape and that no offending value is echoed.
// Committed fixtures cover structural cases (fixtures/manifest.json); secret-shaped, credential and byte-level inputs are
// generated here at runtime so that no secret-shaped literal is committed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, resolvePlatformDir } from '../lib/compile-platform.mjs';

const P = await import(pathToFileURL(path.join(resolvePlatformDir(), 'index.js')).href);
const FIXTURES = path.join(REPO_ROOT, 'tooling', 'config-validation', 'fixtures');
const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'manifest.json'), 'utf8'));
const CONTEXT = Object.freeze({ expectedProductId: 'reference-app', supportedApiContracts: ['pmra-api-v1'], externalBiProviders: [] });
// Error codes may contain digits (CFG_DECODE_UTF8).
const DIAGNOSTIC_ID = /^PAEP-CFG_[A-Z0-9_]+-([0-9a-f]{8}|nodoc)$/;
const enc = (s) => new TextEncoder().encode(s);
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
const fixtureText = (rel) => fs.readFileSync(path.join(FIXTURES, rel), 'utf8');
const base = (rel = 'valid/cloud-saas.json') => JSON.parse(fixtureText(rel));
const bytesOf = (doc) => enc(JSON.stringify(doc, null, 2));

// ---- RFC 6901 helpers for declared fixture mutations -----------------------------------------------------------------
const segments = (ptr) => ptr.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
function parentOf(doc, ptr) {
  const segs = segments(ptr);
  let node = doc;
  for (const s of segs.slice(0, -1)) {
    assert.ok(node !== null && typeof node === 'object' && Object.hasOwn(node, s), `mutation parent missing: ${ptr}`);
    node = node[s];
  }
  return [node, segs.at(-1)];
}
function applyMutation(doc, entry) {
  for (const ptr of entry.remove ?? []) { const [n, k] = parentOf(doc, ptr); assert.ok(Object.hasOwn(n, k), `remove target missing: ${ptr}`); delete n[k]; }
  for (const [ptr, v] of Object.entries(entry.set ?? {})) { const [n, k] = parentOf(doc, ptr); n[k] = structuredClone(v); }
  return doc;
}
const stringLeaves = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (v !== null && typeof v === 'object') for (const x of Object.values(v)) stringLeaves(x, out);
  return out;
};

/** Assert a complete fail-safe outcome. probes: offending strings that must never appear in the outcome or its description. */
function assertFailure(outcome, expect, probes = []) {
  assert.equal(outcome.ok, false, `expected failure, got ${JSON.stringify(outcome).slice(0, 200)}`);
  assert.deepEqual(
    { stage: outcome.stage, code: outcome.code, issues: outcome.issues.map((i) => [i.stage, i.code, i.path]) },
    { stage: expect.stage, code: expect.code, issues: expect.issues ?? outcome.issues.map((i) => [i.stage, i.code, i.path]) }
  );
  assert.equal(outcome.issues[0].code, expect.code);
  assert.equal(outcome.issues[0].stage, expect.stage);
  assert.ok(Object.isFrozen(outcome) && Object.isFrozen(outcome.issues) && outcome.issues.every((i) => Object.isFrozen(i)), 'outcome not frozen');
  assert.deepEqual(Object.keys(outcome).sort(), ['code', 'diagnosticId', 'issues', 'ok', 'stage']);
  for (const i of outcome.issues) assert.deepEqual(Object.keys(i).sort(), ['code', 'path', 'stage']);
  assert.ok(outcome.issues.length <= P.MAX_RUNTIME_CONFIG_ISSUES);
  assert.match(outcome.diagnosticId, DIAGNOSTIC_ID);
  assert.ok(outcome.diagnosticId.startsWith(`PAEP-${expect.code}-`));
  assert.equal('store' in outcome, false);
  const json = JSON.stringify(outcome) + JSON.stringify(P.describeRuntimeConfigFailure(outcome));
  for (const p of probes) assert.equal(json.includes(p), false, 'the outcome echoes an offending value or key');
}
const validate = (bytes, env = {}, context = CONTEXT) => P.validateRuntimeConfigBytes(bytes, context, env);

// ---- fixture manifest ------------------------------------------------------------------------------------------------
test('N-manifest: fixture files and manifest entries correspond one-to-one', () => {
  const onDisk = (dir) => fs.readdirSync(path.join(FIXTURES, dir)).map((f) => `${dir}/${f}`).sort();
  const validFiles = manifest.valid.map((e) => e.file).sort();
  const invalidFiles = manifest.invalid.filter((e) => e.file).map((e) => e.file).sort();
  assert.deepEqual(onDisk('valid'), validFiles);
  assert.deepEqual(onDisk('invalid'), invalidFiles);
  assert.equal(new Set(validFiles).size, validFiles.length);
  assert.equal(new Set(invalidFiles).size, invalidFiles.length);
  const ids = manifest.invalid.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate manifest id');
  for (const e of manifest.invalid) {
    assert.ok(/^[a-z0-9-]+$/.test(e.id), e.id);
    assert.ok(Boolean(e.file) !== Boolean(e.base), `${e.id}: exactly one of file/base`);
    if (e.base) assert.ok(validFiles.includes(e.base), `${e.id}: base must be a valid fixture`);
    if (e.base) assert.ok(e.set || e.remove || e.env, `${e.id}: a base entry declares a mutation or an environment`);
    assert.ok(e.expect && e.expect.issues.length >= 1 && e.expect.issues[0][0] === e.expect.stage && e.expect.issues[0][1] === e.expect.code, `${e.id}: expect`);
  }
  for (const f of fs.readdirSync(FIXTURES)) assert.ok(['manifest.json', 'valid', 'invalid'].includes(f), `unexpected fixture entry ${f}`);
});

for (const entry of manifest.invalid) {
  test(`N-fixture ${entry.id} -> ${entry.expect.stage}/${entry.expect.code}`, () => {
    let bytes;
    const probes = [];
    if (entry.file) bytes = enc(fixtureText(entry.file));
    else {
      const doc = applyMutation(base(entry.base), entry);
      bytes = bytesOf(doc);
      const allowed = new Set(entry.expect.issues.flatMap(([, , p]) => segments(p || '/x').concat(p)));
      for (const ptr of Object.keys(entry.set ?? {})) {
        const key = segments(ptr).at(-1);
        if (key.length >= 3 && !allowed.has(key)) probes.push(key);
      }
      for (const s of stringLeaves(entry.set ?? {})) if (s.length >= 3 && !allowed.has(s)) probes.push(s);
    }
    assertFailure(validate(bytes, entry.env ?? {}), entry.expect, probes);
  });
}

test('N-prototype: forbidden-key fixtures do not pollute Object.prototype', () => {
  for (const e of manifest.invalid.filter((x) => x.expect.code === 'CFG_PARSE_FORBIDDEN_KEY')) validate(enc(fixtureText(e.file)));
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
  assert.equal(Object.prototype.constructor, Object);
});

// ---- generated cases ---------------------------------------------------------------------------------------------------
/** Each case: [name, build() -> { bytes, env? }, expect {stage, code, issues}, probes]. */
const cases = [];
const add = (name, build, stage, issues, probes = []) => cases.push({ name, build, expect: { stage, code: issues[0][1], issues }, probes });
const docCase = (name, mutate, stage, issues, probes = [], rel) => add(name, () => { const d = base(rel); mutate(d); return { bytes: bytesOf(d) }; }, stage, issues, probes);

// Secret-shaped key names, at the root and inside uiHints (the content guard runs before the closed schema).
for (const key of ['client' + 'Secret', 'pass' + 'word', 'api' + 'Key', 'access' + 'Token', 'private' + 'Key']) {
  docCase(`secret key "${key}" at root`, (d) => { d[key] = 'x'; }, 'content', [['content', 'CFG_CONTENT_SECRET', '']], [key]);
  docCase(`secret key "${key}" in uiHints`, (d) => { d.features.uiHints[key] = true; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/features/uiHints']], [key]);
}
docCase('secret key "clientSecret" inside identity', (d) => { d.identity['client' + 'Secret'] = 'abc'; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/identity']], ['client' + 'Secret']);

// Secret-shaped values, assembled at runtime.
const SECRET_VALUES = {
  jwt: 'ey' + 'JhbGciOiJIUzI1NiJ9' + '.' + 'ey' + 'JzdWIiOiIxMjM0In0' + '.' + 'c2lnbmF0dXJl',
  pem: '-----' + 'BEGIN ' + 'PRIVATE ' + 'KEY-----' + 'MIIEvQ',
  bearer: 'Bea' + 'rer ' + 'a1b2c3d4e5f6g7h8i9j0k1l2',
  akia: 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP'
};
for (const [kind, value] of Object.entries(SECRET_VALUES)) {
  for (const field of ['name', 'brandProfile']) {
    docCase(`secret value (${kind}) in product.${field}`, (d) => { d.product[field] = value; }, 'content', [['content', 'CFG_CONTENT_SECRET', `/product/${field}`]], [value, value.slice(4, 16)]);
  }
}

// Direct database / ERP-database / analytical-store access (PAEP-IR-01 §5.4).
const DB = {
  pg: 'post' + 'gres://db.internal:5432/erp',
  my: 'my' + 'sql://db.internal:3306/erp',
  jdbc: 'jd' + 'bc:postgresql://db.internal/erp',
  ado: 'Server=db01;' + 'Pass' + 'word=' + 'x;',
  maria: 'maria' + 'db://erp-db.internal:3306/erp',
  ch: 'click' + 'house://olap.internal:8123/default',
  sf: 'snow' + 'flake:acme-analytics'
};
docCase('DB credential object "database" at root', (d) => { d.database = { host: 'db.internal', name: 'erp' }; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '']], ['database', 'db.internal']);
docCase('DB credential key "dbPassword" at root', (d) => { d['db' + 'Password'] = 'x'; }, 'content', [['content', 'CFG_CONTENT_SECRET', '']], ['db' + 'Password']);
docCase('DB locator postgres:// in apiBaseUrl', (d) => { d.backend.apiBaseUrl = DB.pg; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/backend/apiBaseUrl']], [DB.pg, 'db.internal']);
docCase('DB locator mysql:// in fileBaseUrl', (d) => { d.backend.fileBaseUrl = DB.my; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/backend/fileBaseUrl']], [DB.my]);
docCase('DB locator jdbc: in realtimeUrl', (d) => { d.backend.realtimeUrl = DB.jdbc; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/backend/realtimeUrl']], [DB.jdbc]);
docCase('DB connection string in product.name', (d) => { d.product.name = DB.ado; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/product/name'], ['content', 'CFG_CONTENT_DATA_ACCESS', '/product/name']], [DB.ado, 'db01']);
docCase('ERP database key "erpDb" at root', (d) => { d.erpDb = { host: 'erp-db.internal' }; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '']], ['erpDb', 'erp-db.internal']);
docCase('ERP database locator mariadb:// in apiBaseUrl', (d) => { d.backend.apiBaseUrl = DB.maria; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/backend/apiBaseUrl']], [DB.maria]);
docCase('analytical store key "warehouse" in analytics', (d) => { d.analytics.warehouse = { account: 'acme' }; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/analytics']], ['warehouse', 'acme']);
docCase('analytical store locator clickhouse:// in reportingBaseUrl', (d) => { d.analytics.reportingBaseUrl = DB.ch; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/analytics/reportingBaseUrl']], [DB.ch]);
docCase('analytical store locator snowflake: in product.name', (d) => { d.product.name = DB.sf; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/product/name']], [DB.sf]);

// Unicode and control-character bypass attempts.
const withName = (raw) => () => { const t = JSON.stringify(base(), null, 2).replace('"PAEP Reference Application"', raw); return { bytes: enc(t) }; };
add('NUL via \\u0000 escape in product.name', withName('"PAEP\\u0000App"'), 'content', [['content', 'CFG_CONTENT_TEXT', '/product/name']]);
add('raw control character in a string', withName('"PAEP\u0001App"'), 'parse', [['parse', 'CFG_PARSE_SYNTAX', '/product/name']]);
add('U+202E right-to-left override in product.name', withName('"PAEP‮ppa"'), 'content', [['content', 'CFG_CONTENT_TEXT', '/product/name']]);
add('lone surrogate \\uD800 in product.name', withName('"PAEP\\uD800"'), 'content', [['content', 'CFG_CONTENT_TEXT', '/product/name']]);
docCase('U+200B zero-width space inside a key', (d) => { d.features.uiHints['command​Palette2'] = true; }, 'content', [['content', 'CFG_CONTENT_TEXT', '/features/uiHints']], ['command​Palette2']);
add('BOM prefix bytes', () => ({ bytes: concat(new Uint8Array([0xef, 0xbb, 0xbf]), bytesOf(base())) }), 'decode', [['decode', 'CFG_DECODE_BOM', '']]);
const invalidUtf8 = (seq) => () => { const b = bytesOf(base()); const at = Buffer.from(b).indexOf('Reference'); return { bytes: concat(b.slice(0, at), new Uint8Array(seq), b.slice(at)) }; };
add('invalid UTF-8 bytes (C3 28)', invalidUtf8([0xc3, 0x28]), 'decode', [['decode', 'CFG_DECODE_UTF8', '']]);
add('overlong UTF-8 (C0 AF)', invalidUtf8([0xc0, 0xaf]), 'decode', [['decode', 'CFG_DECODE_UTF8', '']]);
add('UTF-8 encoded surrogate (ED A0 80)', invalidUtf8([0xed, 0xa0, 0x80]), 'decode', [['decode', 'CFG_DECODE_UTF8', '']]);
add('truncated UTF-8 sequence at end of input', () => ({ bytes: concat(bytesOf(base()), new Uint8Array([0xe2, 0x82])) }), 'decode', [['decode', 'CFG_DECODE_UTF8', '']]);
docCase('fullwidth "javascript:" in a URL', (d) => { d.backend.apiBaseUrl = 'ｊａｖａｓｃｒｉｐｔ:alert(1)'; }, 'schema', [['schema', 'CFG_SCHEMA_PATTERN', '/backend/apiBaseUrl']], ['alert(1)']);
docCase('Cyrillic homoglyph host', (d) => { d.backend.apiBaseUrl = 'https://аpi.example.test'; }, 'schema', [['schema', 'CFG_SCHEMA_PATTERN', '/backend/apiBaseUrl']], ['example.test']);
docCase('punycode (xn--) host', (d) => { d.backend.apiBaseUrl = 'https://xn--pi-7ld.example.test'; }, 'semantic', [['semantic', 'CFG_URL_HOST', '/backend/apiBaseUrl']], ['xn--pi-7ld']);

// Size, depth, number and root limits.
add('empty document', () => ({ bytes: new Uint8Array(0) }), 'load', [['load', 'CFG_LOAD_EMPTY', '']]);
add('oversize document (> 64 KiB)', () => {
  const t = JSON.stringify(base(), null, 2);
  return { bytes: enc(t.replace(/\}\s*$/, ' '.repeat(P.MAX_RUNTIME_CONFIG_BYTES + 1 - t.length) + '}')) };
}, 'load', [['load', 'CFG_LOAD_TOO_LARGE', '']]);
const nested = (levels) => { let v = true; for (let i = 0; i < levels; i += 1) v = { n: v }; return v; };
add('nesting deeper than 8 levels', () => { const d = base(); d.features.uiHints.deep = nested(6); return { bytes: bytesOf(d) }; }, 'parse', [['parse', 'CFG_PARSE_DEPTH', '/features/uiHints']]);
add('nesting at the depth limit reaches the schema stage', () => { const d = base(); d.features.uiHints.deep = nested(5); return { bytes: bytesOf(d) }; }, 'schema', [['schema', 'CFG_SCHEMA_TYPE', '/features/uiHints']]);
add('number overflow 1e400', () => ({ bytes: enc(JSON.stringify(base()).replace('"sampleRate":0.25', '"sampleRate":1e400')) }), 'parse', [['parse', 'CFG_PARSE_NUMBER', '/telemetry/sampleRate']]);
add('root is a JSON array', () => ({ bytes: enc('[]') }), 'parse', [['parse', 'CFG_PARSE_ROOT', '']]);
add('root is a JSON string', () => ({ bytes: enc('"1.0"') }), 'parse', [['parse', 'CFG_PARSE_ROOT', '']]);
add('trailing content after the document', () => ({ bytes: enc(JSON.stringify(base()) + ' {}') }), 'parse', [['parse', 'CFG_PARSE_SYNTAX', '']]);
// Independent QA Q2-1/Q4-1: numeric host forms a browser reads as IPv4 (loopback/private) are refused in every environment.
for (const host of ['127.1', '2130706433', '0x7f000001', '0177.0.0.1', '10.1', '0', '192.168.1', '1.2.3.04']) {
  docCase(`non-canonical numeric host https://${host} in production`, (d) => { d.deployment.environment = 'production'; d.backend.apiBaseUrl = `https://${host}`; }, 'semantic', [['semantic', 'CFG_URL_HOST', '/backend/apiBaseUrl']]);
}
docCase('non-canonical numeric host is refused in development too', (d) => { d.deployment.environment = 'development'; d.backend.apiBaseUrl = 'https://127.1'; }, 'semantic', [['semantic', 'CFG_URL_HOST', '/backend/apiBaseUrl']]);
// Independent QA Q4-2: private DNS names and carrier-grade NAT addresses in staging/production.
for (const host of ['api.internal', 'intranet', 'api.local', '100.64.0.1']) {
  docCase(`private host https://${host} in staging`, (d) => { d.deployment.environment = 'staging'; d.backend.apiBaseUrl = `https://${host}`; }, 'semantic', [['semantic', 'CFG_URL_HOST', '/backend/apiBaseUrl']]);
}
// Independent QA Q2-2/Q2-3: ports above 65535 and dot-only path segments.
docCase('port above 65535', (d) => { d.backend.apiBaseUrl = 'https://api.example.test:65536'; }, 'schema', [['schema', 'CFG_SCHEMA_PATTERN', '/backend/apiBaseUrl']]);
docCase('dot-dot path segment', (d) => { d.backend.apiBaseUrl = 'https://api.example.test/../admin'; }, 'schema', [['schema', 'CFG_SCHEMA_PATTERN', '/backend/apiBaseUrl']]);
// Independent QA Q3-1: a document-supplied key never appears in an issue path, whatever stage reports it.
{
  const key = 'sk' + '_live_' + 'Q9x8'.repeat(6);
  add('secret-shaped unknown key holding a duplicate key is reported at its schema parent', () => { const d = base(); d.product[key] = '__DUP__'; return { bytes: enc(JSON.stringify(d).replace('"__DUP__"', '{"a":1,"a":2}')) }; }, 'parse', [['parse', 'CFG_PARSE_DUPLICATE_KEY', '/product']], [key]);
  add('secret-shaped unknown key holding markup is reported at its schema parent', () => { const d = base(); d.identity[key] = { x: 'java' + 'script:alert(1)' }; return { bytes: bytesOf(d) }; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/identity']], [key]);
}
// Independent QA Q3-2: credentials and storage locators inside free text.
docCase('credential assignment inside free text', (d) => { d.product.name = 'Portal ' + 'pass' + 'word=hunter2'; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/product/name']]);
docCase('URL userinfo inside free text', (d) => { d.product.name = 'see https://u:' + 'p@host.example.test'; }, 'content', [['content', 'CFG_CONTENT_SECRET', '/product/name']]);
docCase('object-store locator inside free text', (d) => { d.product.name = 'data in ' + 's3://bucket/x'; }, 'content', [['content', 'CFG_CONTENT_DATA_ACCESS', '/product/name']]);
docCase('uiHints with 33 keys', (d) => { d.features.uiHints = Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`hint${i}`, true])); }, 'schema', [['schema', 'CFG_SCHEMA_PROPERTIES', '/features/uiHints']]);

for (const c of cases) {
  test(`N-generated ${c.name} -> ${c.expect.stage}/${c.expect.code}`, () => {
    const { bytes, env } = c.build();
    assertFailure(validate(bytes, env ?? {}), c.expect, c.probes);
  });
}

test('N-boundary: uiHints with exactly 32 keys and a 64 KiB document are accepted', () => {
  const d = base();
  d.features.uiHints = Object.fromEntries(Array.from({ length: 32 }, (_, i) => [`hint${i}`, true]));
  const t = JSON.stringify(d, null, 2);
  const padded = enc(t.replace(/\}\s*$/, ' '.repeat(P.MAX_RUNTIME_CONFIG_BYTES - t.length) + '}'));
  assert.equal(padded.length, P.MAX_RUNTIME_CONFIG_BYTES);
  assert.equal(validate(padded).ok, true);
});

test('N-issues: findings are bounded to 20 and never include values', () => {
  const d = base();
  for (let i = 0; i < 30; i += 1) d.features.uiHints[`h${i}`] = `v${i}-leak`;
  const outcome = validate(bytesOf(d));
  assert.equal(outcome.stage, 'schema');
  assert.equal(outcome.issues.length, 20);
  assert.equal(JSON.stringify(outcome).includes('-leak'), false);
});

test('N-context: a configuration is not accepted by a build for another product or API contract', () => {
  const bytes = bytesOf(base());
  assertFailure(validate(bytes, {}, { ...CONTEXT, expectedProductId: 'ui-lab' }), { stage: 'compatibility', code: 'CFG_COMPAT_PRODUCT', issues: [['compatibility', 'CFG_COMPAT_PRODUCT', '/product/id']] });
  assertFailure(validate(bytes, {}, { ...CONTEXT, supportedApiContracts: [] }), { stage: 'compatibility', code: 'CFG_COMPAT_API_CONTRACT', issues: [['compatibility', 'CFG_COMPAT_API_CONTRACT', '/backend/compatibility/apiContract']] });
});

test('N-robustness: 400 deterministic byte mutations never throw and always return a frozen outcome', () => {
  const good = bytesOf(base());
  let seed = 0x2545f491;
  const rnd = (n) => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) % n; };
  let rejected = 0;
  for (let i = 0; i < 400; i += 1) {
    const b = good.slice();
    for (let k = 0; k <= rnd(3); k += 1) b[rnd(b.length)] = rnd(256);
    const outcome = validate(b);
    assert.ok(Object.isFrozen(outcome));
    if (!outcome.ok) { rejected += 1; assert.match(outcome.diagnosticId, DIAGNOSTIC_ID); assert.notEqual(outcome.code, 'CFG_INTERNAL'); }
  }
  assert.ok(rejected > 300, `only ${rejected} mutations rejected`);
});

test('N-context: a malformed build context fails closed as CFG_INTERNAL', () => {
  for (const bad of [{ ...CONTEXT, supportedApiContracts: 'x' + CONTEXT.supportedApiContracts[0] + 'x' }, { ...CONTEXT, externalBiProviders: null }, { ...CONTEXT, expectedProductId: 1 }, null]) {
    assertFailure(validate(bytesOf(base()), {}, bad), { stage: 'internal', code: 'CFG_INTERNAL', issues: [['internal', 'CFG_INTERNAL', '']] });
  }
});
