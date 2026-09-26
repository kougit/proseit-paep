#!/usr/bin/env node
// PAEP IB1 runtime-configuration QA gate (npm script qa:runtime-config).
//   1. generator: committed validator is not stale (--check), drift detection works, and the generator refuses unsupported schema shapes
//   2. tamper binding: RUNTIME_CONFIG_SCHEMA_SHA256 in the generated validator equals sha256(config/runtime-config.schema.json)
//   3. platform compiles with lib ES2022 only and types [] (no DOM dependency), into os.tmpdir()
//   4. node:test suite tooling/config-validation/test/*.test.mjs: every test passes, none skipped/todo, count == EXPECTED
//   5. validate-configs: committed example/app configurations and the fixture manifest
//   6. summary; JSON results to $PAEP_EVIDENCE_DIR/runtime-config-tests.json when that variable is set
// Exit 1 on any failure. Writes nothing inside the repository.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compilePlatform, REPO_ROOT } from './lib/compile-platform.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(HERE, 'test');
const SCHEMA = path.join(REPO_ROOT, 'config', 'runtime-config.schema.json');
const GENERATED = path.join(REPO_ROOT, 'packages', 'platform', 'src', 'lib', 'runtime-config', 'generated', 'runtime-config-schema.validator.ts');
const GENERATOR = path.join(HERE, 'generate-validator.mjs');

/** Declared test counts per file. The gate fails unless exactly these many tests run and pass. */
export const EXPECTED_TESTS = Object.freeze({
  'runtime-config-positive.test.mjs': 20,
  'runtime-config-negative.test.mjs': 122,
  'runtime-config-loader-startup.test.mjs': 22
});
export const EXPECTED_TOTAL = Object.values(EXPECTED_TESTS).reduce((a, b) => a + b, 0);

/** Run the node:test suite against a compiled platform directory and count results from the event stream. */
export async function runSuite(platformDir) {
  const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join(TEST_DIR, f));
  const previous = process.env.PAEP_IB1_PLATFORM_DIR;
  process.env.PAEP_IB1_PLATFORM_DIR = platformDir;
  const counts = { pass: 0, fail: 0, skip: 0, todo: 0, cancelled: 0 };
  const perFile = {};
  const failures = [];
  try {
    // The exact per-file pass counts checked by the callers also guard against a runner that reports files but not their tests.
    const stream = run({ files, concurrency: 1, isolation: 'process', timeout: 180000 });
    for await (const ev of stream) {
      if (ev.type !== 'test:pass' && ev.type !== 'test:fail') continue;
      const d = ev.data;
      if (d.details?.type === 'suite') continue;
      const file = path.basename(d.file ?? '?');
      perFile[file] ??= { pass: 0, fail: 0 };
      if (d.skip !== undefined && d.skip !== false) counts.skip += 1;
      if (d.todo !== undefined && d.todo !== false) counts.todo += 1;
      if (ev.type === 'test:pass') { counts.pass += 1; perFile[file].pass += 1; }
      else {
        if (d.details?.error?.failureType === 'cancelledByParent') counts.cancelled += 1;
        counts.fail += 1; perFile[file].fail += 1;
        const err = d.details?.error;
        failures.push({ file, name: d.name, error: String(err?.cause?.message ?? err?.message ?? err).split('\n')[0].slice(0, 300) });
      }
    }
  } finally {
    if (previous === undefined) delete process.env.PAEP_IB1_PLATFORM_DIR;
    else process.env.PAEP_IB1_PLATFORM_DIR = previous;
  }
  return { files: files.map((f) => path.basename(f)), counts, perFile, failures, total: counts.pass + counts.fail };
}

function generatorChecks(check) {
  const node = process.execPath;
  const drift = spawnSync(node, [GENERATOR, '--check'], { cwd: REPO_ROOT, encoding: 'utf8' });
  check('G1 generated validator is up to date (generate-validator --check)', drift.status === 0, (drift.stdout + drift.stderr).trim());

  // Drift detection works: a changed schema must make --check fail against the committed validator.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib1-schema-'));
  try {
    const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));
    schema.$defs.slug.maxLength = 63;
    const tampered = path.join(tmp, 'schema.json');
    fs.writeFileSync(tampered, JSON.stringify(schema, null, 2) + '\n');
    const r = spawnSync(node, [GENERATOR, '--check', '--schema', tampered, '--out', GENERATED], { cwd: REPO_ROOT, encoding: 'utf8' });
    check('G2 drift detection: a modified schema makes --check fail', r.status === 1 && /STALE/.test(r.stderr), r.stderr.trim().split('\n')[0]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function generatorSubsetChecks(check) {
  const { buildValidator } = await import(pathToFileURL(GENERATOR).href);
  const text = fs.readFileSync(SCHEMA, 'utf8');
  check('G3 generator output for the committed schema equals the committed validator', buildValidator(text) === fs.readFileSync(GENERATED, 'utf8'));
  const cases = [
    ['format keyword', (s) => { s.$defs.url.format = 'uri'; }, /unsupported keyword "format"/],
    ['oneOf keyword', (s) => { s.properties.identity.oneOf = [{ type: 'object', additionalProperties: false }]; }, /unsupported keyword "oneOf"/],
    ['patternProperties keyword', (s) => { s.properties.product.patternProperties = { '^x$': { type: 'string' } }; }, /unsupported keyword "patternProperties"/],
    ['anyOf keyword', (s) => { s.properties.pwa.anyOf = []; }, /unsupported keyword "anyOf"/],
    ['missing additionalProperties', (s) => { delete s.properties.product.additionalProperties; }, /must declare additionalProperties explicitly/],
    ['additionalProperties true', (s) => { s.properties.pwa.additionalProperties = true; }, /additionalProperties must be false or a schema/],
    ['external $ref', (s) => { s.properties.product.properties.id = { $ref: 'https://schemas.example.test/other.json#/$defs/slug' }; }, /only local #\/\$defs\/<name> references/],
    ['unanchored pattern', (s) => { s.$defs.slug.pattern = '[a-z][a-z0-9-]*'; }, /pattern must be an anchored/],
    ['partly anchored pattern', (s) => { s.$defs.slug.pattern = '^[a-z]+'; }, /pattern must be an anchored/],
    ['array without items', (s) => { delete s.properties.identity.properties.scopes.items; }, /array node must declare items/],
    ['wrong $schema draft', (s) => { s.$schema = 'http://json-schema.org/draft-07/schema#'; }, /\$schema must be/]
  ];
  for (const [name, mutate, expected] of cases) {
    const s = JSON.parse(text);
    mutate(s);
    let message = null;
    try { buildValidator(JSON.stringify(s, null, 2)); } catch (e) { message = e.message; }
    check(`G4 generator refuses: ${name}`, message !== null && expected.test(message), message ?? 'no error thrown');
  }
}

function tamperCheck(check, compiledSha) {
  const want = crypto.createHash('sha256').update(fs.readFileSync(SCHEMA)).digest('hex');
  const m = /export const RUNTIME_CONFIG_SCHEMA_SHA256 = '([0-9a-f]{64})';/.exec(fs.readFileSync(GENERATED, 'utf8'));
  check('T1 generated RUNTIME_CONFIG_SCHEMA_SHA256 equals sha256(config/runtime-config.schema.json)', Boolean(m) && m[1] === want, `schema ${want}`);
  if (compiledSha !== undefined) check('T2 compiled platform exports the same schema sha256', compiledSha === want);
}

async function main() {
  const started = Date.now();
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail && !ok ? ` - ${detail}` : ''}`); };

  generatorChecks(check);
  await generatorSubsetChecks(check);

  let compiled = null;
  try {
    compiled = compilePlatform();
    check('C1 platform compiles with lib ES2022 only, types [] and strict (no DOM dependency)', true);
  } catch (e) {
    check('C1 platform compiles with lib ES2022 only, types [] and strict (no DOM dependency)', false, e.message);
  }
  const P = compiled ? await import(pathToFileURL(compiled.entry).href) : null;
  tamperCheck(check, P?.RUNTIME_CONFIG_SCHEMA_SHA256);

  let suite = null;
  if (compiled) {
    suite = await runSuite(compiled.platformDir);
    for (const f of suite.failures) console.log(`  failed: ${f.file} :: ${f.name} :: ${f.error}`);
    check(`S1 node:test suite: ${suite.counts.pass}/${EXPECTED_TOTAL} passed`, suite.counts.pass === EXPECTED_TOTAL && suite.counts.fail === 0,
      JSON.stringify(suite.counts));
    check('S2 no skipped, todo or cancelled tests', suite.counts.skip === 0 && suite.counts.todo === 0 && suite.counts.cancelled === 0, JSON.stringify(suite.counts));
    check('S3 test files are exactly the declared files', JSON.stringify(suite.files) === JSON.stringify(Object.keys(EXPECTED_TESTS).sort()), suite.files.join(', '));
    for (const [file, n] of Object.entries(EXPECTED_TESTS)) {
      const got = suite.perFile[file] ?? { pass: 0, fail: 0 };
      check(`S4 ${file}: ${got.pass}/${n} passed`, got.pass === n && got.fail === 0, JSON.stringify(got));
    }

    const { validateConfigs } = await import(pathToFileURL(path.join(HERE, 'validate-configs.mjs')).href);
    const vc = await validateConfigs(compiled.platformDir);
    for (const r of vc) if (!r.ok) console.log(`  validate-configs failed: ${r.name} - ${r.detail}`);
    check(`V1 validate-configs: ${vc.filter((r) => r.ok).length}/${vc.length} checks passed`, vc.every((r) => r.ok));
  }

  const failed = checks.filter((c) => !c.ok);
  const summary = {
    gate: 'qa:runtime-config',
    workPackage: 'IB1-CONTRACTS-CONFIG',
    node: process.version,
    typescript: compiled?.typescriptVersion ?? null,
    status: failed.length ? 'FAIL' : 'PASS',
    expectedTests: EXPECTED_TOTAL,
    tests: suite ? { ...suite.counts, perFile: suite.perFile, failures: suite.failures } : null,
    checks,
    durationMs: Date.now() - started
  };
  console.log(`\nqa:runtime-config ${summary.status}: ${checks.length - failed.length}/${checks.length} checks; tests ${suite ? `${suite.counts.pass} passed, ${suite.counts.fail} failed, ${suite.counts.skip} skipped, ${suite.counts.todo} todo of ${EXPECTED_TOTAL} expected` : 'not run'}`);
  if (process.env.PAEP_EVIDENCE_DIR) {
    fs.mkdirSync(process.env.PAEP_EVIDENCE_DIR, { recursive: true });
    const out = path.join(process.env.PAEP_EVIDENCE_DIR, 'runtime-config-tests.json');
    fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
    console.log(`results written to ${out}`);
  }
  if (compiled) fs.rmSync(compiled.outDir, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`qa:runtime-config ERROR ${e.stack ?? e}`); process.exit(1); });
}
