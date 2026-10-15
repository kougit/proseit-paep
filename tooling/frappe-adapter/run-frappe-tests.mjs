#!/usr/bin/env node
/**
 * IB4 Frappe adapter test runner (npm run qa:frappe runs --suite unit; npm run qa:integration runs --suite integration).
 *
 * Compiles packages/frappe-sdk/src (with the observability and platform sources it may use) under strict options into
 * os.tmpdir() with the pinned TypeScript, maps the workspace aliases of the emitted JavaScript to the compiled
 * sources, and runs every tooling/frappe-adapter/test/<suite>/*.test.mjs with node:test. Each suite file has a pinned
 * test count; a missing, extra, failing, skipped or todo test fails the run. Nothing is written into the repository.
 *   node tooling/frappe-adapter/run-frappe-tests.mjs --suite unit|integration
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const ts = require(path.join(root, 'node_modules/typescript'));
const suiteArg = process.argv.indexOf('--suite');
const SUITE = suiteArg < 0 ? null : process.argv[suiteArg + 1];
/** Pinned node:test counts per suite file. Changing a suite requires changing its count here. */
const EXPECTED_TESTS = {
  unit: {
    'compatibility.test.mjs': 5, 'files.test.mjs': 7, 'freshness.test.mjs': 7, 'records.test.mjs': 6, 'session.test.mjs': 8,
    'transport.test.mjs': 15, 'workflow.test.mjs': 9,
  },
  // One manifest test plus one test per fixture case (tooling/frappe-adapter/fixtures/manifest.json, 36 cases).
  integration: { 'conformance.test.mjs': 37 },
};
if (!EXPECTED_TESTS[SUITE]) {
  console.log(`FAIL --suite must be ${Object.keys(EXPECTED_TESTS).join(' or ')}`);
  process.exit(1);
}

const R = (p) => path.join(root, p);
const ALIASES = { '@proseit/paep-contracts': 'packages/contracts/src/index.ts', '@proseit/paep-observability': 'packages/observability/src/index.ts', '@proseit/paep-platform': 'packages/platform/src/index.ts' };
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-frappe-tests-'));
const dist = path.join(work, 'dist');
const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL ${m}`); };

// Strict compile: the workspace strictness (tsconfig.json) plus the contracts' exactness, ES2022 with the DOM library
// the adapter's browser hosts provide, and no ambient @types.
const options = {
  strict: true, noImplicitAny: true, noImplicitOverride: true, noPropertyAccessFromIndexSignature: true, noImplicitReturns: true,
  noFallthroughCasesInSwitch: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true, isolatedModules: true,
  verbatimModuleSyntax: true, forceConsistentCasingInFileNames: true, skipLibCheck: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], types: [], outDir: dist, rootDir: root, declaration: false, sourceMap: false, noEmitOnError: true,
  paths: Object.fromEntries(Object.entries(ALIASES).map(([k, v]) => [k, [R(v)]])),
};
const program = ts.createProgram({ rootNames: [R('packages/frappe-sdk/src/index.ts')], options });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) fail(`adapter compile: ${diagnostics.slice(0, 8).map((d) => `${d.file ? `${path.relative(root, d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1} ` : ''}TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`).join('; ')}`);
const emitted = program.emit();
if (emitted.emitSkipped) fail('adapter emit skipped');
fs.writeFileSync(path.join(dist, 'package.json'), '{"type":"module"}\n');

// Map the workspace aliases in the emitted JavaScript to the compiled sources; a runtime reference to the type-only
// contracts package is an error (the contracts must be erased).
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out.sort();
};
for (const file of walk(dist).filter((f) => f.endsWith('.js'))) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/(from\s*|import\s*\(\s*|import\s+)(['"])(@proseit\/[a-z0-9-]+)\2/g, (m, lead, q, spec) => {
    if (spec === '@proseit/paep-contracts') { fail(`${path.relative(dist, file)}: runtime reference to @proseit/paep-contracts`); return m; }
    if (!ALIASES[spec]) { fail(`${path.relative(dist, file)}: unknown workspace alias ${spec}`); return m; }
    let target = path.relative(path.dirname(file), path.join(dist, ALIASES[spec].replace(/\.ts$/, '.js'))).split(path.sep).join('/');
    if (!target.startsWith('.')) target = `./${target}`;
    return `${lead}${q}${target}${q}`;
  });
  fs.writeFileSync(file, s);
}
const sdkEntry = path.join(dist, 'packages/frappe-sdk/src/index.js');
if (!fs.existsSync(sdkEntry)) fail('compiled adapter entry point missing');

// Run the suite.
const dir = R(`tooling/frappe-adapter/test/${SUITE}`);
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort() : [];
const expected = EXPECTED_TESTS[SUITE];
if (JSON.stringify(files) !== JSON.stringify(Object.keys(expected).sort())) fail(`${SUITE} suite files [${files.join(', ')}] differ from the pinned set [${Object.keys(expected).sort().join(', ')}]`);
let passed = 0;
const evidence = [];
for (const f of files) {
  if (failures.length && failures.some((m) => m.startsWith('adapter'))) break;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', path.join(dir, f)], {
    cwd: work, encoding: 'utf8', env: { ...process.env, PAEP_FRAPPE_SDK_DIST: sdkEntry, PAEP_FRAPPE_FIXTURES: R('tooling/frappe-adapter/fixtures') }, maxBuffer: 64 * 1024 * 1024,
  });
  const n = (k) => Number((r.stdout.match(new RegExp(`^# ${k} (\\d+)$`, 'm')) || [])[1] ?? NaN);
  const c = { tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped'), todo: n('todo'), cancelled: n('cancelled') };
  const want = expected[f];
  const ok = r.status === 0 && c.tests === want && c.pass === want && c.fail === 0 && c.skipped === 0 && c.todo === 0 && c.cancelled === 0;
  passed += Number.isFinite(c.pass) ? c.pass : 0;
  evidence.push({ file: f, expected: want, ...c, exit: r.status });
  if (ok) console.log(`PASS ${SUITE}/${f}: ${c.pass}/${want} passed, 0 failed/skipped/todo`);
  else fail(`${SUITE}/${f}: ${JSON.stringify(c)} (pinned ${want}), exit ${r.status}\n${r.stdout.split('\n').filter((l) => /^not ok|^\s+(error|message|expected|actual|code|failureType):/.test(l)).slice(0, 20).join('\n')}${r.stderr}`);
}
fs.rmSync(work, { recursive: true, force: true });
const total = Object.values(expected).reduce((a, b) => a + b, 0);
if (process.env.PAEP_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.PAEP_EVIDENCE_DIR, `frappe-${SUITE}-tests.json`), JSON.stringify({ suite: SUITE, ok: failures.length === 0, passed, pinned: total, files: evidence }, null, 2));
console.log(`\nPAEP Frappe adapter ${SUITE} tests: ${failures.length ? 'FAIL' : 'PASS'} (${passed}/${total} node:test tests in ${files.length} files; adapter compiled strictly with 0 diagnostics${diagnostics.length ? ' — NO' : ''})`);
process.exit(failures.length ? 1 : 0);
