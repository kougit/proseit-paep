#!/usr/bin/env node
// PAEP IB1 runtime-configuration mutation gate (npm script qa:runtime-config:negative).
// Proves the qa:runtime-config test suite cannot pass falsely: each named mutation weakens one control in a scratch copy of
// packages/platform/src (+ packages/contracts/src) under os.tmpdir(), the copy is recompiled, and the full node:test suite runs
// against it (PAEP_IB1_PLATFORM_DIR). Every mutation must be killed (>= 1 failing test); a no-op control mutation must pass
// with exactly the expected test count. A mutation whose anchor is missing or that does not compile is a harness failure.
// Exit 1 if any mutation survives, the control fails, or the harness fails. Nothing is written inside the repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePlatform, REPO_ROOT } from './lib/compile-platform.mjs';
import { EXPECTED_TOTAL, runSuite } from './runtime-config-qa.mjs';

const RC = 'platform/src/lib/runtime-config';

/** find: exact string (must occur exactly once unless all: true) or a global RegExp (must match at least once). */
export const MUTATIONS = [
  { id: 'M00-control-noop', control: true, file: `${RC}/validate.ts`, find: 'export function fingerprint(', replace: '// mutation-harness control: comment only\nexport function fingerprint(' },
  { id: 'M01-no-duplicate-key-check', file: `${RC}/strict-json.ts`, find: "if (seen.has(key)) fail('CFG_PARSE_DUPLICATE_KEY', path);", replace: '' },
  { id: 'M02-no-forbidden-key-check', file: `${RC}/strict-json.ts`, find: "if (FORBIDDEN_KEYS.includes(key)) fail('CFG_PARSE_FORBIDDEN_KEY', path);", replace: '' },
  { id: 'M03-no-depth-limit', file: `${RC}/strict-json.ts`, find: "if (depth >= MAX_RUNTIME_CONFIG_DEPTH) fail('CFG_PARSE_DEPTH', path);", replace: '' },
  { id: 'M04-depth-limit-off-by-one', file: `${RC}/strict-json.ts`, find: 'if (depth >= MAX_RUNTIME_CONFIG_DEPTH)', replace: 'if (depth > MAX_RUNTIME_CONFIG_DEPTH)' },
  { id: 'M05-accept-non-finite-numbers', file: `${RC}/strict-json.ts`, find: "if (!Number.isFinite(n)) fail('CFG_PARSE_NUMBER', path);", replace: '' },
  { id: 'M06-accept-bom', file: `${RC}/strict-json.ts`, find: "if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { ok: false, code: 'CFG_DECODE_BOM' };", replace: '' },
  { id: 'M07-accept-overlong-and-surrogates', file: `${RC}/strict-json.ts`, find: "if ((len === 3 && cp < 0x800) || (len === 4 && (cp < 0x10000 || cp > 0x10ffff)) || (cp >= 0xd800 && cp <= 0xdfff)) return { ok: false, code: 'CFG_DECODE_UTF8' };", replace: '' },
  { id: 'M08-accept-any-schema-version', file: `${RC}/validate.ts`, find: '!SUPPORTED_RUNTIME_CONFIG_SCHEMA_VERSIONS.includes(version)', replace: 'false' },
  { id: 'M09-no-size-limit', file: `${RC}/validate.ts`, find: "if (bytes.length > MAX_RUNTIME_CONFIG_BYTES) return runtimeConfigFailure('load', [{ stage: 'load', code: 'CFG_LOAD_TOO_LARGE', path: '' }], bytes);", replace: '' },
  { id: 'M10-unbounded-issue-list', file: `${RC}/validate.ts`, find: 'issues.slice(0, MAX_RUNTIME_CONFIG_ISSUES)', replace: 'issues' },
  { id: 'M11-no-secret-value-patterns', file: `${RC}/content-guard.ts`, find: "if (SECRET_VALUES.some((re) => re.test(v))) add('CFG_CONTENT_SECRET', path);", replace: '' },
  { id: 'M12-no-secret-key-names', file: `${RC}/content-guard.ts`, find: "if (tokens.some((t) => SECRET_KEY_TOKENS.includes(t))) { add('CFG_CONTENT_SECRET', path); continue; }", replace: '' },
  { id: 'M13-no-markup-check', file: `${RC}/content-guard.ts`, find: "if (MARKUP.some((re) => re.test(v))) add('CFG_CONTENT_MARKUP', path);", replace: '' },
  { id: 'M14-no-data-access-value-check', file: `${RC}/content-guard.ts`, find: "if (DATA_ACCESS_VALUES.some((re) => re.test(v))) add('CFG_CONTENT_DATA_ACCESS', path);", replace: '' },
  { id: 'M15-no-unsafe-text-check', file: `${RC}/content-guard.ts`, find: "if (UNSAFE_CHAR.test(s) || LONE_SURROGATE.test(s) || SUPPLEMENTARY_UNSAFE.test(s)) return 'CFG_CONTENT_TEXT';", replace: '' },
  { id: 'M16-no-dollar-key-check', file: `${RC}/content-guard.ts`, find: "if (key.startsWith('$') || key.includes('@')) { add('CFG_CONTENT_KEY', path); continue; }", replace: '' },
  { id: 'M17-schema-additionalProperties-removed', file: `${RC}/generated/runtime-config-schema.validator.ts`, find: /out\.push\(\{ code: 'CFG_SCHEMA_ADDITIONAL', path: p \}\);/g, replace: 'void 0;' },
  { id: 'M18-schema-patterns-removed', file: `${RC}/generated/runtime-config-schema.validator.ts`, find: /if \(!P\d+\.test\(x\)\) out\.push\(\{ code: 'CFG_SCHEMA_PATTERN'/g, replace: "if (x === '\\u0000') out.push({ code: 'CFG_SCHEMA_PATTERN'" },
  { id: 'M19-no-insecure-url-check', file: `${RC}/semantic.ts`, find: "if (u.scheme === 'http' && !(env0 === 'development' && LOOPBACK.has(u.host))) { add('CFG_URL_INSECURE', path); continue; }", replace: '' },
  { id: 'M20-no-punycode-host-check', file: `${RC}/semantic.ts`, find: "if (u.host.split('.').some((label) => label.startsWith('xn--'))) add('CFG_URL_HOST', path);", replace: '' },
  { id: 'M21-no-base-path-check', file: `${RC}/semantic.ts`, find: "if (env.documentBasePath !== undefined && env.documentBasePath !== c.deployment.basePath) add('CFG_BASE_PATH', '/deployment/basePath');", replace: '' },
  { id: 'M22-no-paep-range-order-check', file: `${RC}/semantic.ts`, find: "if (comp.maximumPaep && compareMajorMinor(comp.minimumPaep, comp.maximumPaep) > 0) add('CFG_PAEP_RANGE', '/backend/compatibility/maximumPaep');", replace: '' },
  { id: 'M23-no-production-security-check', file: `${RC}/semantic.ts`, find: "if (env0 === 'production' && !c.security?.cspProfile) add('CFG_SECURITY_PROFILE', '/security');", replace: '' },
  { id: 'M24-no-minimum-paep-check', file: `${RC}/compatibility.ts`, find: "if (compareMajorMinor(PAEP_COMPATIBILITY_VERSION, comp.minimumPaep) < 0) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PAEP', path: '/backend/compatibility/minimumPaep' });", replace: '' },
  { id: 'M25-no-maximum-paep-check', file: `${RC}/compatibility.ts`, find: "if (comp.maximumPaep && compareMajorMinor(PAEP_COMPATIBILITY_VERSION, comp.maximumPaep) > 0) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PAEP', path: '/backend/compatibility/maximumPaep' });", replace: '' },
  { id: 'M26-no-product-id-check', file: `${RC}/compatibility.ts`, find: "if (c.product.id !== context.expectedProductId) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PRODUCT', path: '/product/id' });", replace: '' },
  { id: 'M27-deep-freeze-noop', file: `${RC}/freeze.ts`, find: 'Object.freeze(value);', replace: '' },
  { id: 'M28-startup-catch-returns-ok', file: `${RC}/startup.ts`, find: "outcome = runtimeConfigFailure('internal', [{ stage: 'internal', code: 'CFG_INTERNAL', path: '' }]);", replace: 'outcome = deepFreeze({ ok: true, store: { config: {}, compatibility: {}, configId: \'00000000\' } }) as unknown as RuntimeConfigOutcome;' },
  { id: 'M29-startup-onReady-on-failure', file: `${RC}/startup.ts`, find: 'else startup.onFailure(outcome);', replace: 'else { startup.onFailure(outcome); await startup.onReady(outcome as unknown as RuntimeConfigStore); }' },
  { id: 'M30-startup-accepts-unvalidated-outcome', file: `${RC}/startup.ts`, find: ' || (outcome.ok === true && !isValidatedRuntimeConfigStore(outcome.store))', replace: '' },
  { id: 'M31-startup-latch-removed', file: `${RC}/startup.ts`, find: 'if (started) {', replace: 'if (started && Date.now() < 0) {' },
  { id: 'M32-loader-no-redirect-check', file: `${RC}/load.ts`, find: "if (response.redirected || (response.url !== '' && response.url !== options.configUrl)) return loadFailure('CFG_LOAD_REDIRECT');", replace: '' },
  { id: 'M33-loader-no-content-type-check', file: `${RC}/load.ts`, find: "if (!/^application\\/json\\s*(;|$)/.test(type)) return loadFailure('CFG_LOAD_CONTENT_TYPE');", replace: '' },
  { id: 'M34-loader-no-declared-length-check', file: `${RC}/load.ts`, find: "if (Number.isFinite(declared) && declared > MAX_RUNTIME_CONFIG_BYTES) return loadFailure('CFG_LOAD_TOO_LARGE');", replace: '' },
  { id: 'M35-loader-no-status-check', file: `${RC}/load.ts`, find: "if (response.status !== 200 || !response.ok) return loadFailure('CFG_LOAD_STATUS');", replace: '' }
];

function applyMutation(source, m) {
  if (m.find instanceof RegExp) {
    const n = (source.match(m.find) ?? []).length;
    if (n === 0) throw new Error(`${m.id}: pattern not found in ${m.file}`);
    return { text: source.replace(m.find, m.replace), sites: n };
  }
  const n = source.split(m.find).length - 1;
  if (n !== 1) throw new Error(`${m.id}: anchor found ${n} times in ${m.file} (expected exactly 1)`);
  return { text: source.replace(m.find, () => m.replace), sites: 1 };
}

async function runMutation(m, scratchBase) {
  const scratch = fs.mkdtempSync(path.join(scratchBase, `${m.id}-`));
  for (const pkg of ['platform', 'contracts']) {
    fs.cpSync(path.join(REPO_ROOT, 'packages', pkg, 'src'), path.join(scratch, 'packages', pkg, 'src'), { recursive: true });
  }
  const target = path.join(scratch, 'packages', m.file);
  const { text, sites } = applyMutation(fs.readFileSync(target, 'utf8'), m);
  if (text === fs.readFileSync(target, 'utf8')) throw new Error(`${m.id}: mutation changed nothing`);
  fs.writeFileSync(target, text);
  const compiled = compilePlatform({ sourceRoot: scratch, outDir: path.join(scratch, 'out') });
  const suite = await runSuite(compiled.platformDir);
  return { sites, suite };
}

async function main() {
  const scratchBase = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib1-mutation-'));
  const rows = [];
  let harnessErrors = 0;
  try {
    for (const m of MUTATIONS) {
      let row;
      try {
        const { sites, suite } = await runMutation(m, scratchBase);
        const killed = suite.counts.fail > 0 || suite.counts.pass !== EXPECTED_TOTAL;
        const ok = m.control ? (!killed && suite.counts.pass === EXPECTED_TOTAL && suite.counts.skip === 0 && suite.counts.todo === 0) : killed;
        row = { id: m.id, control: Boolean(m.control), file: m.file, sites, pass: suite.counts.pass, fail: suite.counts.fail, result: m.control ? (ok ? 'CONTROL PASS' : 'CONTROL FAIL') : (killed ? 'KILLED' : 'SURVIVED'), ok,
          killedBy: suite.failures.map((f) => f.name) };
      } catch (e) {
        harnessErrors += 1;
        row = { id: m.id, control: Boolean(m.control), file: m.file, result: 'HARNESS ERROR', ok: false, error: e.message.split('\n').slice(0, 4).join(' | '), killedBy: [] };
      }
      rows.push(row);
      const tail = row.error ? ` ${row.error}` : ` (${row.fail ?? 0} failing of ${(row.pass ?? 0) + (row.fail ?? 0)})${row.killedBy.length ? ` e.g. ${row.killedBy.slice(0, 2).join(' | ')}` : ''}`;
      console.log(`${row.ok ? 'PASS' : 'FAIL'} ${row.id}: ${row.result}${tail}`);
    }
  } finally {
    fs.rmSync(scratchBase, { recursive: true, force: true });
  }
  const survived = rows.filter((r) => r.result === 'SURVIVED').length;
  const killed = rows.filter((r) => r.result === 'KILLED').length;
  const controlOk = rows.filter((r) => r.control).every((r) => r.ok);
  const status = rows.every((r) => r.ok) ? 'PASS' : 'FAIL';
  console.log(`\nqa:runtime-config:negative ${status}: ${killed}/${MUTATIONS.filter((m) => !m.control).length} mutations killed, ${survived} survived, control ${controlOk ? 'passed' : 'FAILED'}, ${harnessErrors} harness error(s)`);
  if (process.env.PAEP_EVIDENCE_DIR) {
    fs.mkdirSync(process.env.PAEP_EVIDENCE_DIR, { recursive: true });
    const out = path.join(process.env.PAEP_EVIDENCE_DIR, 'runtime-config-mutations.json');
    fs.writeFileSync(out, JSON.stringify({ gate: 'qa:runtime-config:negative', node: process.version, status, expectedTests: EXPECTED_TOTAL, mutations: rows }, null, 2) + '\n');
    console.log(`results written to ${out}`);
  }
  process.exit(status === 'PASS' ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`qa:runtime-config:negative ERROR ${e.stack ?? e}`); process.exit(1); });
}
