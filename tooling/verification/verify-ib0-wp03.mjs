#!/usr/bin/env node
/**
 * PAEP IB0-WP03 verifier.
 * Checks that TypeScript and Angular template strictness are explicit and
 * effective, that no baseline compiler option is weakened, that package path
 * aliases and public entry points agree (package API checks), and that the
 * lockfile, controlled sources and scope are intact. It then runs both
 * production builds and the IB0-WP02 and IB0-WP01 verifiers as regression,
 * restoring the tracked evidence those verifiers rewrite.
 *
 * Uses Node.js built-ins plus the pinned `typescript` and
 * `@angular/compiler-cli` already in the lockfile. Run it from the repository
 * root after `npm ci`, on a committed tree for the regression checks.
 *
 * --static-only skips the builds and the regression runs (used by the
 * negative mutation runner, tooling/verification/negative-ib0-wp03.mjs).
 *
 * It writes evidence/IB0-WP03/reports/ib0-wp03-verification.json and, unless
 * --static-only, the regression logs under evidence/IB0-WP03/logs/.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const staticOnly = process.argv.includes('--static-only');
const reportsDir = path.join(root, 'evidence', 'IB0-WP03', 'reports');
const logsDir = path.join(root, 'evidence', 'IB0-WP03', 'logs');
fs.mkdirSync(reportsDir, { recursive: true });

// Accepted IB0-WP02 merge commit on main.
const BASELINE_COMMIT = 'de13629b302e1bbaccc59bb0e93f69c7fed9cdcb';
const STRICT_FAMILY = ['strict', 'noImplicitAny', 'strictNullChecks', 'strictFunctionTypes', 'strictBindCallApply',
  'strictPropertyInitialization', 'strictBuiltinIteratorReturn', 'noImplicitThis', 'useUnknownInCatchVariables', 'alwaysStrict'];
const TEMPLATE_STRICT = ['strictTemplates', 'fullTemplateTypeCheck', 'strictInputTypes', 'strictInputAccessModifiers',
  'strictNullInputTypes', 'strictAttributeTypes', 'strictSafeNavigationTypes', 'strictDomLocalRefTypes',
  'strictOutputEventTypes', 'strictDomEventTypes', 'strictContextGenerics', 'strictLiteralTypes'];
const WP03_SCRIPTS = {
  'qa:ib0-wp03': 'node tooling/verification/verify-ib0-wp03.mjs',
  'qa:ib0-wp03:negative': 'node tooling/verification/negative-ib0-wp03.mjs'
};
// Paths WORK_PACKAGE §4 permits IB0-WP03 to create or modify.
const PERMITTED = [
  /^tsconfig\.json$/, /^package\.json$/, /^packages\/[^/]+\/src\/index\.ts$/,
  /^tooling\/verification\/(verify|negative)-ib0-wp03\.mjs$/,
  /^docs\/architecture\/IB0-WP03-IMPLEMENTATION-PLAN\.md$/, /^docs\/adr\/ADR-REGISTER\.md$/,
  /^work-packages\/IB0-WP03\//, /^evidence\/IB0-WP03\//
];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.angular']);

const results = [];
const add = (id, name, pass, details = '') => results.push({ id, name, pass: Boolean(pass), details });
const abs = (p) => path.join(root, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
const isWin = process.platform === 'win32';
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'pipe', env: process.env, shell: isWin, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), error: r.error };
}
const git = (...args) => run('git', args);
const lines = (s) => (s || '').split(/\r?\n/).filter(Boolean);

// Reads a tsconfig as written (comments allowed, `extends` not resolved).
function rawConfig(text, name) {
  const r = ts.parseConfigFileTextToJson(name, text);
  if (r.error) throw new Error(`${name}: ${ts.flattenDiagnosticMessageText(r.error.messageText, ' ')}`);
  return r.config;
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(abs(dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = dir === '.' ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const allFiles = walk('.');
const tsconfigFiles = allFiles.filter((f) => /(^|\/)tsconfig[^/]*\.json$/.test(f));

let rootRaw = {};
let baselineRaw = {};
try { rootRaw = rawConfig(read('tsconfig.json'), 'tsconfig.json'); } catch (e) { add('V00', 'tsconfig.json parses', false, String(e)); }
const baseShow = git('show', `${BASELINE_COMMIT}:tsconfig.json`);
try { baselineRaw = rawConfig(baseShow.out, 'baseline tsconfig.json'); } catch (e) { add('V00', 'baseline tsconfig.json readable', false, `${e} ${baseShow.error || ''}`); }
const co = rootRaw.compilerOptions || {};
const aco = rootRaw.angularCompilerOptions || {};

// V01: explicit TypeScript strictness in the root tsconfig (AC02)
add('V01', 'Root tsconfig.json compilerOptions literally sets "strict": true and "noImplicitAny": true',
  co.strict === true && co.noImplicitAny === true, `strict=${JSON.stringify(co.strict)}; noImplicitAny=${JSON.stringify(co.noImplicitAny)}`);

// V02: explicit Angular template strictness in the root tsconfig (AC03)
add('V02', 'Root tsconfig.json angularCompilerOptions literally sets "strictTemplates": true',
  aco.strictTemplates === true, `strictTemplates=${JSON.stringify(aco.strictTemplates)}`);

// V03: effective options for every angular.json build tsConfig (AC04)
let angularJson = {};
try { angularJson = JSON.parse(read('angular.json')); } catch (e) { add('V00', 'angular.json parses', false, String(e)); }
const buildTargets = Object.entries(angularJson.projects || {}).map(([name, p]) => ({ name, build: p.architect?.build || {} }));
const effectiveProblems = [];
const effectiveSummary = [];
let ngc = null;
try { ngc = await import('@angular/compiler-cli'); } catch (e) { effectiveProblems.push(`cannot load @angular/compiler-cli: ${e}`); }
for (const { name, build } of buildTargets) {
  const tsConfig = build.options?.tsConfig;
  if (!tsConfig || !exists(tsConfig)) { effectiveProblems.push(`${name}: tsConfig ${tsConfig} missing`); continue; }
  if (!ngc) break;
  const cfg = ngc.readConfiguration(abs(tsConfig));
  if (cfg.errors.length) effectiveProblems.push(`${name}: ${cfg.errors.length} config errors`);
  const o = cfg.options;
  if (o.strict !== true) effectiveProblems.push(`${name}: effective strict=${o.strict}`);
  if (o.noImplicitAny !== true) effectiveProblems.push(`${name}: effective noImplicitAny=${o.noImplicitAny}`);
  if (o.strictTemplates !== true) effectiveProblems.push(`${name}: effective strictTemplates=${o.strictTemplates}`);
  for (const k of [...STRICT_FAMILY, ...TEMPLATE_STRICT]) if (o[k] === false) effectiveProblems.push(`${name}: effective ${k}=false`);
  effectiveSummary.push(`${name} (${tsConfig}): strict=${o.strict} noImplicitAny=${o.noImplicitAny} strictTemplates=${o.strictTemplates}`);
}
add('V03', 'Every angular.json build tsConfig resolves (extends included) to strict, noImplicitAny and strictTemplates true, with no strict option off',
  buildTargets.length > 0 && effectiveProblems.length === 0, effectiveProblems.length ? effectiveProblems.join('; ') : effectiveSummary.join('; '));

// V04: nothing in any tsconfig turns a strict option off (AC04)
const disabling = [];
for (const f of tsconfigFiles) {
  let raw;
  try { raw = rawConfig(read(f), f); } catch (e) { disabling.push(String(e)); continue; }
  for (const k of STRICT_FAMILY) if (raw.compilerOptions?.[k] === false) disabling.push(`${f}: compilerOptions.${k}=false`);
  for (const k of TEMPLATE_STRICT) if (raw.angularCompilerOptions?.[k] === false) disabling.push(`${f}: angularCompilerOptions.${k}=false`);
}
add('V04', 'No tsconfig*.json in the repository sets a strict-family or template strict option to false',
  tsconfigFiles.length > 0 && disabling.length === 0, disabling.length ? disabling.join('; ') : `${tsconfigFiles.length} tsconfig files: ${tsconfigFiles.join(', ')}`);

// V05: baseline compiler options kept; app tsconfigs unchanged (AC05)
const weakened = [];
for (const section of ['compilerOptions', 'angularCompilerOptions']) {
  for (const [k, v] of Object.entries(baselineRaw[section] || {})) {
    if (JSON.stringify(rootRaw[section]?.[k]) !== JSON.stringify(v)) weakened.push(`${section}.${k}: baseline ${JSON.stringify(v)} now ${JSON.stringify(rootRaw[section]?.[k])}`);
  }
}
for (const k of ['extends', 'files', 'references', 'compileOnSave']) {
  if (JSON.stringify(rootRaw[k]) !== JSON.stringify(baselineRaw[k])) weakened.push(`${k} changed`);
}
const appTs = git('diff', '--name-only', BASELINE_COMMIT, '--', 'apps/reference-app/tsconfig.app.json', 'apps/ui-lab/tsconfig.app.json');
if (appTs.status !== 0) weakened.push(`git diff failed: ${appTs.out || appTs.error}`); else if (appTs.out) weakened.push(`changed: ${appTs.out}`);
add('V05', 'Every baseline compiler and Angular compiler option keeps its value, and the app tsconfig files are unchanged',
  weakened.length === 0 && Object.keys(baselineRaw.compilerOptions || {}).length > 0,
  weakened.length ? weakened.join('; ') : `${Object.keys(baselineRaw.compilerOptions || {}).length + Object.keys(baselineRaw.angularCompilerOptions || {}).length} baseline options unchanged`);

// V06: AOT production builds kept; angular.json unchanged (AC05)
const aotProblems = [];
for (const { name, build } of buildTargets) {
  if (build.options?.aot === false) aotProblems.push(`${name}: options.aot=false`);
  for (const [c, v] of Object.entries(build.configurations || {})) if (v?.aot === false) aotProblems.push(`${name}: configurations.${c}.aot=false`);
  if (build.builder !== '@angular/build:application') aotProblems.push(`${name}: builder ${build.builder}`);
}
const ngDiff = git('diff', '--quiet', BASELINE_COMMIT, '--', 'angular.json');
if (ngDiff.status !== 0) aotProblems.push('angular.json differs from the baseline');
add('V06', 'No build target disables AOT, the application builder is kept, and angular.json is unchanged',
  buildTargets.length > 0 && aotProblems.length === 0, aotProblems.length ? aotProblems.join('; ') : `${buildTargets.length} build targets AOT`);

// V07: no compiler-suppression directives in apps/packages source (AC06)
const suppression = /@ts-(ignore|nocheck|expect-error)\b|\$any\s*\(/;
const sourceFiles = allFiles.filter((f) => /^(apps|packages)\//.test(f) && /\.(ts|mts|cts|html)$/.test(f));
const suppressed = sourceFiles.filter((f) => suppression.test(read(f)));
add('V07', 'No @ts-ignore, @ts-nocheck, @ts-expect-error or $any( in apps/** or packages/** source',
  sourceFiles.length > 0 && suppressed.length === 0, `${sourceFiles.length} files scanned; findings: ${suppressed.join(', ') || 'none'}`);

// V08: one exact path alias per workspace package (AC07)
const packageDirs = fs.readdirSync(abs('packages'), { withFileTypes: true })
  .filter((e) => e.isDirectory() && exists(`packages/${e.name}/package.json`)).map((e) => e.name).sort();
const packages = packageDirs.map((dir) => ({ dir, name: JSON.parse(read(`packages/${dir}/package.json`)).name, entry: `packages/${dir}/src/index.ts` }));
const aliases = co.paths || {};
const aliasProblems = [];
for (const p of packages) {
  const target = aliases[p.name];
  if (!target) aliasProblems.push(`${p.name}: no alias`);
  else if (JSON.stringify(target) !== JSON.stringify([`./${p.entry}`])) aliasProblems.push(`${p.name}: maps to ${JSON.stringify(target)}`);
}
const known = new Set(packages.map((p) => p.name));
for (const [k, v] of Object.entries(aliases)) {
  if (k.includes('*') || v.some((t) => t.includes('*'))) aliasProblems.push(`wildcard alias ${k}`);
  if (!known.has(k)) aliasProblems.push(`alias ${k} is not a workspace package name`);
}
add('V08', 'compilerOptions.paths maps each workspace package name to exactly its src/index.ts, with no wildcard or deep alias',
  packages.length > 0 && aliasProblems.length === 0, aliasProblems.length ? aliasProblems.join('; ') : `${packages.length}/${packages.length} aliases`);

// V09: public entry points exist, are placeholders, resolve, and compile strictly (AC08)
const apiProblems = [];
for (const p of packages) {
  if (!exists(p.entry)) { apiProblems.push(`${p.entry} missing`); continue; }
  const code = read(p.entry).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
  if (code !== 'export{};') apiProblems.push(`${p.entry} is not a placeholder (export {} only)`);
}
const parsed = ts.parseJsonConfigFileContent(rootRaw, ts.sys, root, undefined, abs('tsconfig.json'));
const options = { ...parsed.options, noEmit: true, types: [] };
const probeFrom = abs('apps/reference-app/src/main.ts');
for (const p of packages) {
  const r = ts.resolveModuleName(p.name, probeFrom, options, ts.sys).resolvedModule;
  if (!r || path.resolve(r.resolvedFileName) !== path.resolve(abs(p.entry))) apiProblems.push(`${p.name} resolves to ${r ? rel(r.resolvedFileName) : 'nothing'}`);
}
const entryFiles = packages.map((p) => abs(p.entry)).filter((f) => fs.existsSync(f));
const diagnostics = entryFiles.length ? ts.getPreEmitDiagnostics(ts.createProgram(entryFiles, options)) : [];
for (const d of diagnostics.slice(0, 5)) apiProblems.push(`TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
add('V09', 'Every package has a placeholder public entry point that its alias resolves to, and all entry points compile strictly with 0 diagnostics',
  packages.length > 0 && apiProblems.length === 0,
  apiProblems.length ? apiProblems.join('; ') : `${packages.length} entry points; strict=${options.strict}; diagnostics=${diagnostics.length}`);

// V10: lockfile and dependency set unchanged; package.json changed only by the WP03 scripts (AC15)
const lockProblems = [];
const lockBase = git('diff', '--quiet', BASELINE_COMMIT, '--', 'package-lock.json');
if (lockBase.status !== 0) lockProblems.push('package-lock.json differs from the baseline');
let pkg = {};
let basePkg = {};
try { pkg = JSON.parse(read('package.json')); basePkg = JSON.parse(git('show', `${BASELINE_COMMIT}:package.json`).out); } catch (e) { lockProblems.push(String(e)); }
const { scripts: s1 = {}, ...rest1 } = pkg;
const { scripts: s0 = {}, ...rest0 } = basePkg;
if (JSON.stringify(rest1) !== JSON.stringify(rest0)) lockProblems.push('package.json fields other than scripts changed');
if (JSON.stringify(s1) !== JSON.stringify({ ...s0, ...WP03_SCRIPTS })) lockProblems.push('package.json scripts differ from baseline + the two WP03 scripts');
add('V10', 'package-lock.json is byte-identical to the baseline and package.json differs only by the two WP03 scripts',
  lockProblems.length === 0, lockProblems.length ? lockProblems.join('; ') : `lockfile sha256 ${sha256('package-lock.json')}`);

// V11: no Nx (AC16)
const nxProblems = [];
let lock = { packages: {} };
try { lock = JSON.parse(read('package-lock.json')); } catch (e) { nxProblems.push(String(e)); }
const nxLock = Object.keys(lock.packages || {}).filter((p) => /(^|\/)node_modules\/(nx|@nx\/[^/]+|@nrwl\/[^/]+)$/.test(p));
if (nxLock.length) nxProblems.push(`lockfile: ${nxLock.join(', ')}`);
const nxDeps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).filter((n) => n === 'nx' || /^@(nx|nrwl)\//.test(n));
if (nxDeps.length) nxProblems.push(`package.json: ${nxDeps.join(', ')}`);
for (const f of allFiles) if (/(^|\/)(nx|project)\.json$/.test(f)) nxProblems.push(`file ${f}`);
add('V11', 'No Nx: no nx/@nx/@nrwl dependency or lockfile entry, and no nx.json or project.json', nxProblems.length === 0,
  nxProblems.length ? nxProblems.join('; ') : 'none');

// V12: scope (AC17)
const scopeProblems = [];
const outOfScope = allFiles.filter((f) => /(^|\/)(tsconfig\.base\.json|\.eslintrc[^/]*|eslint\.config\.[^/]+|\.prettierrc[^/]*|prettier\.config\.[^/]+|vitest\.config\.[^/]+|jest\.config\.[^/]+|karma\.conf\.[^/]+|\.dependency-cruiser\.[^/]+|\.madgerc)$/.test(f) || f.startsWith('.github/'));
if (outOfScope.length) scopeProblems.push(`out-of-scope files: ${outOfScope.join(', ')}`);
const boundaryTooling = allFiles.filter((f) => f.startsWith('tooling/architecture-boundaries/') && f !== 'tooling/architecture-boundaries/README.md');
if (boundaryTooling.length) scopeProblems.push(`boundary tooling (IB0-WP04): ${boundaryTooling.join(', ')}`);
const appsDiff = git('diff', '--name-only', BASELINE_COMMIT, '--', 'apps');
const appsUntracked = git('ls-files', '--others', '--exclude-standard', '--', 'apps');
if (appsDiff.out || appsUntracked.out) scopeProblems.push(`apps changed: ${[...lines(appsDiff.out), ...lines(appsUntracked.out)].join(', ')}`);
const changedAll = git('diff', '--name-only', BASELINE_COMMIT);
const untrackedAll = git('ls-files', '--others', '--exclude-standard');
if (changedAll.status !== 0) scopeProblems.push(`git diff failed: ${changedAll.out || changedAll.error}`);
const changedPaths = [...new Set([...lines(changedAll.out), ...lines(untrackedAll.out)])].sort();
const outside = changedPaths.filter((f) => !PERMITTED.some((re) => re.test(f)));
if (outside.length) scopeProblems.push(`changed outside WORK_PACKAGE §4: ${outside.join(', ')}`);
add('V12', 'No WP04/WP05/IB1+ artefacts, apps unchanged, and every changed path is within WORK_PACKAGE §4',
  scopeProblems.length === 0, scopeProblems.length ? scopeProblems.join('; ') : `${changedPaths.length} changed paths, all permitted`);

// V13: controlled-source integrity (AC18)
const integrityProblems = [];
try {
  const pack = JSON.parse(read('PACK_MANIFEST.json'));
  const controlled = pack.files.filter((f) => f.path === '.gitignore' || f.path.startsWith('.paep-control/'));
  for (const f of controlled) {
    if (!exists(f.path)) { integrityProblems.push(`missing ${f.path}`); continue; }
    if (sha256(f.path) !== f.sha256 || fs.statSync(abs(f.path)).size !== f.bytes) integrityProblems.push(`mismatch ${f.path}`);
  }
  const listed = new Set(controlled.map((f) => f.path));
  for (const f of allFiles.filter((x) => x.startsWith('.paep-control/'))) if (!listed.has(f)) integrityProblems.push(`unlisted ${f}`);
  const d = git('diff', '--quiet', BASELINE_COMMIT, '--', '.paep-control', '.gitignore', 'PACK_MANIFEST.json', 'CLAUDE.md');
  if (d.status !== 0) integrityProblems.push('controlled files or CLAUDE.md differ from the baseline');
  add('V13', 'Controlled sources match PACK_MANIFEST.json; .paep-control, .gitignore, PACK_MANIFEST.json and CLAUDE.md unchanged',
    controlled.length > 0 && integrityProblems.length === 0, integrityProblems.length ? integrityProblems.join('; ') : `${controlled.length}/${controlled.length} files match sha256 and size`);
} catch (e) {
  add('V13', 'Controlled sources match PACK_MANIFEST.json', false, String(e));
}

// V14: secrets in files added or modified since the baseline (AC19)
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bnpm_[A-Za-z0-9]{36}\b/,
  /(?:^|\s)(?:\/\/[^\s]*:)?_(?:auth|authToken|password)\s*=\s*\S/m,
  /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/i
];
const secretFindings = changedPaths.filter((f) => exists(f) && fs.statSync(abs(f)).isFile() && fs.statSync(abs(f)).size < 2_000_000 && secretPatterns.some((re) => re.test(read(f))));
add('V14', 'No credential or secret signatures in files added or modified since the baseline', secretFindings.length === 0,
  `${changedPaths.length} files scanned; findings: ${secretFindings.join(', ') || 'none'}`);

if (!staticOnly) {
  fs.mkdirSync(logsDir, { recursive: true });
  const npmRun = (script) => run('npm', ['run', script]);

  // V15-V16: production builds (AC13, AC14)
  for (const [id, script] of [['V15', 'build:reference-app'], ['V16', 'build:ui-lab']]) {
    const r = npmRun(script);
    add(id, `${script} production build passes`, r.status === 0, `exit=${r.status}\n${r.out.split(/\r?\n/).slice(-12).join('\n')}`);
  }

  // Runs an earlier verifier, keeps its output as WP03 evidence, and restores the tracked evidence it rewrites.
  function regression(wp, script, protectedDirs) {
    const dirtyBefore = git('status', '--porcelain', '--', ...protectedDirs);
    if (dirtyBefore.out) return { error: `tracked ${wp} files modified before the run: ${dirtyBefore.out}` };
    const r = npmRun(script);
    const jsonPath = `evidence/${wp}/reports/${wp.toLowerCase()}-verification.json`;
    let json = null;
    try { json = JSON.parse(read(jsonPath)); } catch { /* reported below */ }
    const tag = wp.toLowerCase().replace('ib0-', '');
    fs.writeFileSync(path.join(logsDir, `verify-ib0-${tag}-regression.log`), `${r.out}\nEXIT_CODE=${r.status}\n`, 'utf8');
    if (json) fs.writeFileSync(path.join(logsDir, `ib0-${tag}-verification.regression.json`), JSON.stringify(json, null, 2) + '\n', 'utf8');
    const rewritten = lines(git('diff', '--name-only', '--', ...protectedDirs).out);
    if (rewritten.length) git('checkout', '--', ...rewritten);
    const after = git('diff', '--name-only', BASELINE_COMMIT, '--', ...protectedDirs);
    const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...protectedDirs);
    return { status: r.status, json, rewritten, residual: [...lines(after.out), ...lines(untracked.out)] };
  }

  // V17: IB0-WP02 regression with the bounded V17 exception (AC21). Runs before WP01, whose run rewrites WP01 evidence that WP02 V17 guards.
  const wp02 = regression('IB0-WP02', 'qa:ib0-wp02', ['evidence/IB0-WP02', 'work-packages/IB0-WP02']);
  const wp02Problems = [];
  if (wp02.error) wp02Problems.push(wp02.error);
  else if (!wp02.json) wp02Problems.push('no WP02 verification JSON');
  else {
    for (const c of wp02.json.checks) {
      if (c.pass) continue;
      if (c.id !== 'V17') { wp02Problems.push(`${c.id} failed: ${c.details.split('\n')[0]}`); continue; }
      const m = /^protected paths changed: (.+)$/.exec(c.details);
      const flagged = m ? m[1].split(', ') : [];
      const unexpected = flagged.filter((f) => !/^tsconfig\.json$|^packages\/[^/]+\/src\/index\.ts$/.test(f));
      if (!m || unexpected.length) wp02Problems.push(`V17 finding outside the bounded exception: ${c.details}`);
    }
    if (wp02.residual.length) wp02Problems.push(`WP02 records differ from the baseline after restore: ${wp02.residual.join(', ')}`);
  }
  const wp02Passed = wp02.json ? wp02.json.checks.filter((c) => c.pass).length : 0;
  add('V17', 'IB0-WP02 regression: every WP02 check passes except V17, whose only finding is WP03-permitted paths; WP02 records unchanged',
    wp02Problems.length === 0, wp02Problems.length ? wp02Problems.join('; ')
      : `WP02 ${wp02Passed}/${wp02.json.checks.length} pass; V17 flags only permitted WP03 paths; restored: ${wp02.rewritten.join(', ') || 'none'}`);

  // V18: IB0-WP01 regression (AC22)
  const wp01 = regression('IB0-WP01', 'qa:ib0-wp01', ['evidence/IB0-WP01', 'work-packages/IB0-WP01']);
  const wp01Problems = [];
  if (wp01.error) wp01Problems.push(wp01.error);
  else if (!wp01.json || wp01.json.result !== 'PASS' || wp01.status !== 0) wp01Problems.push(`WP01 result ${wp01.json?.result} exit ${wp01.status}`);
  if (wp01.residual?.length) wp01Problems.push(`WP01 records differ from the baseline after restore: ${wp01.residual.join(', ')}`);
  add('V18', 'IB0-WP01 regression passes and WP01 records are unchanged', wp01Problems.length === 0,
    wp01Problems.length ? wp01Problems.join('; ') : `WP01 ${wp01.json.checks.length}/${wp01.json.checks.length} pass; restored: ${wp01.rewritten.join(', ') || 'none'}`);
}

const head = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--untracked-files=no');
const npmVersion = lines(run('npm', ['--version']).out).pop();
const passed = results.every((r) => r.pass);
const report = {
  workPackage: 'IB0-WP03',
  generatedAt: new Date().toISOString(),
  mode: staticOnly ? 'static-only' : 'full',
  commit: head.status === 0 ? head.out : null,
  baseline: BASELINE_COMMIT,
  trackedChangesAtRun: lines(dirty.out),
  node: process.versions.node,
  npm: npmVersion,
  typescript: ts.version,
  platform: `${process.platform}-${process.arch}`,
  result: passed ? 'PASS' : 'FAIL',
  checks: results
};
fs.writeFileSync(path.join(reportsDir, 'ib0-wp03-verification.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.details ? ` — ${r.details.split('\n')[0]}` : ''}`);
console.log(`\nIB0-WP03 verification (${report.mode}): ${report.result} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
