#!/usr/bin/env node
/**
 * PAEP IB0-WP04 verifier.
 * Checks the architecture model and classification, the generated project
 * graph, the tsconfig.base.json alias registry and inheritance, that the WP03
 * strict controls are preserved, and that the boundary checker
 * (tooling/architecture-boundaries/check-boundaries.mjs) finds no forbidden
 * edge, cycle, deep import, entry-point bypass or neutrality breach. It also
 * checks lockfile, Nx absence, scope, controlled sources and secrets, then
 * runs both production builds and the IB0-WP03 verifier (which runs the WP02
 * and WP01 verifiers) as regression, restoring the tracked evidence they
 * rewrite.
 *
 * Uses Node.js built-ins plus the pinned `typescript` and
 * `@angular/compiler-cli` already in the lockfile. Run it from the repository
 * root after `npm ci`, on a committed tree for the regression checks.
 *
 * --static-only skips the builds and the regression runs (used by the
 * negative runner, tooling/verification/negative-ib0-wp04.mjs).
 *
 * Writes evidence/IB0-WP04/reports/ib0-wp04-verification.json,
 * evidence/IB0-WP04/reports/project-graph.json, evidence/IB0-WP04/logs/arch-check.log
 * and, unless --static-only, the regression logs under evidence/IB0-WP04/logs/.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { checkBoundaries } from '../architecture-boundaries/check-boundaries.mjs';

const root = process.cwd();
const staticOnly = process.argv.includes('--static-only');
const reportsDir = path.join(root, 'evidence', 'IB0-WP04', 'reports');
const logsDir = path.join(root, 'evidence', 'IB0-WP04', 'logs');
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(logsDir, { recursive: true });

// Accepted IB0-WP03 merge commit on main.
const BASELINE_COMMIT = 'ac6b786caf3485ce2b45724be2b437c28f04b66b';
const STRICT_FAMILY = ['strict', 'noImplicitAny', 'strictNullChecks', 'strictFunctionTypes', 'strictBindCallApply',
  'strictPropertyInitialization', 'strictBuiltinIteratorReturn', 'noImplicitThis', 'useUnknownInCatchVariables', 'alwaysStrict'];
const WP04_SCRIPTS = {
  'arch:check': 'node tooling/architecture-boundaries/check-boundaries.mjs',
  // PAEP-EQP-01 Appendix B command name for the same architecture gate (PO/SA decision 1).
  'qa:architecture': 'node tooling/architecture-boundaries/check-boundaries.mjs',
  'qa:ib0-wp04': 'node tooling/verification/verify-ib0-wp04.mjs',
  'qa:ib0-wp04:negative': 'node tooling/verification/negative-ib0-wp04.mjs'
};
// Paths WORK_PACKAGE §4 permits IB0-WP04 to create or modify.
const PERMITTED = [
  /^tsconfig\.base\.json$/, /^tsconfig\.json$/, /^package\.json$/, /^tooling\/architecture-boundaries\//,
  /^tooling\/verification\/(verify|negative)-ib0-wp04\.mjs$/,
  /^docs\/architecture\/IB0-WP04-IMPLEMENTATION-PLAN\.md$/, /^docs\/adr\/ADR-REGISTER\.md$/, /^docs\/provenance\/PROVENANCE-REGISTER\.md$/,
  /^work-packages\/IB0-WP04\//, /^evidence\/IB0-WP04\//
];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.angular']);

const results = [];
const add = (id, name, pass, details = '') => results.push({ id, name, pass: Boolean(pass), details });
const abs = (p) => path.join(root, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
const isWin = process.platform === 'win32';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'pipe', env: process.env, shell: isWin, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), error: r.error };
}
const git = (...args) => run('git', args);
const lines = (s) => (s || '').split(/\r?\n/).filter(Boolean);
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

// ---- Boundary checker --------------------------------------------------------------
let arch;
try { arch = checkBoundaries(root); } catch (e) { arch = { ok: false, summary: {}, violations: [{ rule: 'ERROR', message: String(e.stack || e) }], graph: null }; }
const byRule = (...rules) => arch.violations.filter((v) => rules.includes(v.rule));
const show = (vs) => vs.slice(0, 8).map((v) => `${v.rule}: ${v.message}${v.where ? ` [${v.where}]` : ''}`).join('; ') + (vs.length > 8 ? `; … ${vs.length - 8} more` : '');
if (arch.graph) fs.writeFileSync(path.join(reportsDir, 'project-graph.json'), JSON.stringify(arch.graph, null, 2) + '\n', 'utf8');
const s = arch.summary || {};

// V01: model transcribes IB-01 §6.1 and Appendix B (AC02)
const modelV = byRule('MODEL', 'ERROR');
add('V01', 'Architecture model layers and 12x12 matrix equal PAEP-IB-01 §6.1 and Appendix B cell by cell',
  modelV.length === 0 && s.matrixCellsCompared === 144, modelV.length ? show(modelV) : `${s.matrixCellsCompared}/144 cells match; layers match §6.1`);

// V02: classification (AC03)
const packageDirs = fs.readdirSync(abs('packages'), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
let ngProjects = 0;
try { ngProjects = Object.keys(JSON.parse(read('angular.json')).projects || {}).length; } catch { /* reported by checker */ }
const classV = byRule('CLASSIFICATION');
add('V02', 'Every package directory, npm workspace and angular.json project is classified exactly once with a known category and tags',
  classV.length === 0 && s.projects === packageDirs + ngProjects && s.libraries === packageDirs && s.applications === ngProjects,
  classV.length ? show(classV) : `${s.projects} projects classified (${s.libraries} libraries, ${s.applications} applications); 0 unknown`);

// V03: project graph (AC04)
const g = arch.graph;
const graphProblems = [];
if (!g) graphProblems.push('no graph');
else {
  if (Object.keys(g.nodes).length !== s.projects) graphProblems.push(`${Object.keys(g.nodes).length} nodes for ${s.projects} projects`);
  if (Object.keys(g.dependencies).length !== s.projects) graphProblems.push('dependencies map incomplete');
  if (!Array.isArray(g.depConstraints) || g.depConstraints.length !== 12) graphProblems.push('depConstraints not one per category');
  for (const [n, node] of Object.entries(g.nodes)) if (!node.data?.tags?.length || !node.data?.layer) graphProblems.push(`${n} lacks tags/layer`);
}
add('V03', 'Project graph generated in the Nx ProjectGraph shape with one node per project, tags, layers, edges and depConstraints',
  graphProblems.length === 0, graphProblems.length ? graphProblems.join('; ') : `${Object.keys(g.nodes).length} nodes, ${g.edges.length} edges, ${g.depConstraints.length} constraints -> evidence/IB0-WP04/reports/project-graph.json`);

// V04: tsconfig.base.json and inheritance (AC05)
const tsbProblems = [];
let rootRaw = {};
let baseRaw = {};
let baselineRaw = {};
try { baseRaw = rawConfig(read('tsconfig.base.json'), 'tsconfig.base.json'); } catch (e) { tsbProblems.push(String(e.message || e)); }
try { rootRaw = rawConfig(read('tsconfig.json'), 'tsconfig.json'); } catch (e) { tsbProblems.push(String(e.message || e)); }
try { baselineRaw = rawConfig(git('show', `${BASELINE_COMMIT}:tsconfig.json`).out, 'baseline tsconfig.json'); } catch (e) { tsbProblems.push(`baseline: ${e.message}`); }
if (JSON.stringify(Object.keys(baseRaw)) !== '["compilerOptions"]' || JSON.stringify(Object.keys(baseRaw.compilerOptions || {})) !== '["paths"]') tsbProblems.push(`tsconfig.base.json keys: ${JSON.stringify(baseRaw)?.slice(0, 120)}`);
if (rootRaw.extends !== './tsconfig.base.json') tsbProblems.push(`tsconfig.json extends ${JSON.stringify(rootRaw.extends)}`);
if (rootRaw.compilerOptions?.paths) tsbProblems.push('tsconfig.json still defines paths');
const aliasCfgV = byRule('ALIAS').filter((v) => !/: (no alias|alias maps to)|wildcard alias|is not a classified package|resolves to/.test(v.message));
tsbProblems.push(...aliasCfgV.map((v) => v.message));
add('V04', 'tsconfig.base.json holds only the alias registry; tsconfig.json extends it without paths; no other paths/baseUrl; every app build inherits it',
  tsbProblems.length === 0, tsbProblems.length ? tsbProblems.join('; ') : `tsconfig.base.json: ${Object.keys(baseRaw.compilerOptions.paths).length} aliases; chain apps/*/tsconfig.app.json -> tsconfig.json -> tsconfig.base.json`);

// V05: WP03 strict controls preserved (AC06)
const strictProblems = [];
const co = rootRaw.compilerOptions || {};
const aco = rootRaw.angularCompilerOptions || {};
if (co.strict !== true || co.noImplicitAny !== true) strictProblems.push(`literal strict=${co.strict} noImplicitAny=${co.noImplicitAny}`);
if (aco.strictTemplates !== true) strictProblems.push(`literal strictTemplates=${aco.strictTemplates}`);
{
  const expected = JSON.parse(JSON.stringify(baselineRaw));
  if (expected.compilerOptions) delete expected.compilerOptions.paths;
  const actual = JSON.parse(JSON.stringify(rootRaw));
  delete actual.extends;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) strictProblems.push('tsconfig.json differs from the baseline other than extends added and paths removed');
}
const appTs = git('diff', '--name-only', BASELINE_COMMIT, '--', 'apps/reference-app/tsconfig.app.json', 'apps/ui-lab/tsconfig.app.json');
if (appTs.status !== 0 || appTs.out) strictProblems.push(`app tsconfig changed: ${appTs.out || appTs.error}`);
const effective = [];
try {
  const ngc = await import('@angular/compiler-cli');
  const angular = JSON.parse(read('angular.json'));
  for (const [name, p] of Object.entries(angular.projects || {})) {
    const cfg = ngc.readConfiguration(abs(p.architect.build.options.tsConfig));
    const o = cfg.options;
    if (cfg.errors.length) strictProblems.push(`${name}: ${cfg.errors.length} config errors`);
    if (o.strict !== true || o.noImplicitAny !== true || o.strictTemplates !== true) strictProblems.push(`${name}: effective strict=${o.strict} noImplicitAny=${o.noImplicitAny} strictTemplates=${o.strictTemplates}`);
    for (const k of STRICT_FAMILY) if (o[k] === false) strictProblems.push(`${name}: effective ${k}=false`);
    if (Object.keys(o.paths || {}).length !== 18) strictProblems.push(`${name}: effective paths ${Object.keys(o.paths || {}).length}`);
    effective.push(`${name}: strict=${o.strict} noImplicitAny=${o.noImplicitAny} strictTemplates=${o.strictTemplates} paths=${Object.keys(o.paths || {}).length}`);
  }
} catch (e) { strictProblems.push(`cannot resolve effective options: ${e.message}`); }
// The WP03 no-suppression control (WP03 V07) holds too: no directive in apps/packages source
// may switch type checking off for a file or a line.
{
  const suppression = /@ts-(ignore|nocheck|expect-error)\b|\$any\s*\(/i;
  const walkSrc = (d, out = []) => { for (const e of fs.readdirSync(abs(d), { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.name === 'node_modules' || e.isSymbolicLink()) continue; if (e.isDirectory()) walkSrc(p, out); else if (/\.(ts|tsx|mts|cts|js|mjs|cjs|html)$/.test(e.name)) out.push(p); } return out; };
  const suppressed = [...walkSrc('apps'), ...walkSrc('packages')].filter((f) => suppression.test(read(f)));
  if (suppressed.length) strictProblems.push(`compiler-suppression directives in ${suppressed.join(', ')}`);
}
add('V05', 'WP03 strict controls preserved: literal in tsconfig.json, all other options equal the baseline, app tsconfigs unchanged, effective options strict for both apps, no suppression directives in source',
  strictProblems.length === 0 && effective.length === 2, strictProblems.length ? strictProblems.join('; ') : effective.join('; '));

// V06: alias consistency and resolution (AC07)
const aliasV = byRule('ALIAS').filter((v) => !aliasCfgV.includes(v));
add('V06', 'tsconfig.base.json maps each package name to exactly its src/index.ts (no wildcard, no app alias) and every alias resolves from every app',
  aliasV.length === 0 && s.aliases === packageDirs && s.aliasResolutions === packageDirs * ngProjects,
  aliasV.length ? show(aliasV) : `${s.aliases}/${packageDirs} aliases; ${s.aliasResolutions}/${packageDirs * ngProjects} resolutions`);

// V07: public entry points exist and remain placeholders (AC08)
const entryProblems = byRule('ENTRY_POINT').map((v) => v.message);
for (const dir of fs.readdirSync(abs('packages'))) {
  const f = `packages/${dir}/src/index.ts`;
  if (!exists(f)) continue;
  const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
  if (code !== 'export{};') entryProblems.push(`${f} is not a placeholder`);
}
add('V07', 'Every package has its src/index.ts public entry point, still a placeholder (export {} only)', entryProblems.length === 0,
  entryProblems.length ? entryProblems.join('; ') : `${packageDirs}/${packageDirs} entry points`);

// V08-V13: boundary rules (AC09-AC14)
const ruleCheck = (id, name, rules, extra = '') => {
  const vs = byRule(...rules);
  add(id, name, vs.length === 0 && s.projects > 0, vs.length ? show(vs) : `0 findings; ${s.importsScanned} imports in ${s.sourceFiles} files, ${s.edges} edges${extra}`);
};
ruleCheck('V08', 'Dependency direction: every edge allowed by Appendix B; no same-category edge', ['DIRECTION'], `; ${s.optionalEdges} optional`);
ruleCheck('V09', 'No deep @proseit/<pkg>/<path> import and no unknown @proseit/* import', ['DEEP_IMPORT', 'UNKNOWN_PACKAGE']);
ruleCheck('V10', 'No relative/rooted import leaves its project (public-entry-point bypass or ownership violation)', ['ENTRY_BYPASS', 'OUTSIDE_PROJECT']);
ruleCheck('V11', 'No circular package dependency', ['CYCLE'], `; ${s.cycles} cycles`);
ruleCheck('V12', 'contracts imports no external module and compiles with ES2022 only and no ambient types', ['CONTRACTS_NEUTRAL'], `; ${s.contractsDiagnostics} diagnostics`);
ruleCheck('V13', 'analytics re-exports no external module; no app file copies package source', ['ANALYTICS_VENDOR_EXPORT', 'COPIED_CODE']);

// V14: the arch:check command (AC15)
const cli = run(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs']);
fs.writeFileSync(path.join(logsDir, 'arch-check.log'), `$ npm run arch:check  (node tooling/architecture-boundaries/check-boundaries.mjs)\n${cli.out}\nEXIT_CODE=${cli.status}\n`, 'utf8');
add('V14', 'npm run arch:check exits 0', cli.status === 0 && arch.ok, `exit=${cli.status}; ${lines(cli.out).pop() || ''}`);

// V15: no Nx (AC17)
const nxProblems = [];
let pkg = {};
let lock = { packages: {} };
try { pkg = JSON.parse(read('package.json')); lock = JSON.parse(read('package-lock.json')); } catch (e) { nxProblems.push(String(e)); }
const nxLock = Object.keys(lock.packages || {}).filter((p) => /(^|\/)node_modules\/(nx|@nx\/[^/]+|@nrwl\/[^/]+)$/.test(p));
if (nxLock.length) nxProblems.push(`lockfile: ${nxLock.join(', ')}`);
const nxDeps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.optionalDependencies || {}), ...(pkg.peerDependencies || {}) }).filter((n) => n === 'nx' || /^@(nx|nrwl)\//.test(n));
if (nxDeps.length) nxProblems.push(`package.json: ${nxDeps.join(', ')}`);
for (const f of allFiles) if (/(^|\/)(nx|project)\.json$/.test(f)) nxProblems.push(`file ${f}`);
if (exists('node_modules/nx') || exists('node_modules/@nx')) nxProblems.push('node_modules/nx or node_modules/@nx installed');
add('V15', 'No Nx: no nx/@nx/@nrwl dependency, lockfile entry or install, and no nx.json or project.json', nxProblems.length === 0,
  nxProblems.length ? nxProblems.join('; ') : 'none; Nx disposition: NOT REQUIRED FOR IB0-WP04');

// V16: lockfile and package.json (AC21)
const lockProblems = [];
if (git('diff', '--quiet', BASELINE_COMMIT, '--', 'package-lock.json').status !== 0) lockProblems.push('package-lock.json differs from the baseline');
try {
  const basePkg = JSON.parse(git('show', `${BASELINE_COMMIT}:package.json`).out);
  const { scripts: s1 = {}, ...rest1 } = pkg;
  const { scripts: s0 = {}, ...rest0 } = basePkg;
  if (JSON.stringify(rest1) !== JSON.stringify(rest0)) lockProblems.push('package.json fields other than scripts changed');
  if (JSON.stringify(s1) !== JSON.stringify({ ...s0, ...WP04_SCRIPTS })) lockProblems.push('package.json scripts differ from baseline + the four WP04 scripts');
} catch (e) { lockProblems.push(String(e)); }
add('V16', 'package-lock.json is byte-identical to the baseline and package.json differs only by the four WP04 scripts (arch:check and its EQP Appendix B name qa:architecture)',
  lockProblems.length === 0, lockProblems.length ? lockProblems.join('; ') : `lockfile sha256 ${sha256('package-lock.json')}`);

// V17: scope (AC26)
const scopeProblems = [];
const outOfScope = allFiles.filter((f) => /(^|\/)(nx\.json|project\.json|\.eslintrc[^/]*|eslint\.config\.[^/]+|\.prettierrc[^/]*|prettier\.config\.[^/]+|vitest\.config\.[^/]+|jest\.config\.[^/]+|karma\.conf\.[^/]+|\.dependency-cruiser\.[^/]+|\.madgerc)$/.test(f) || f.startsWith('.github/'));
if (outOfScope.length) scopeProblems.push(`out-of-scope files: ${outOfScope.join(', ')}`);
const frozen = git('diff', '--name-only', BASELINE_COMMIT, '--', 'apps', 'packages', 'angular.json');
const frozenUntracked = git('ls-files', '--others', '--exclude-standard', '--', 'apps', 'packages');
if (frozen.out || frozenUntracked.out) scopeProblems.push(`apps/packages/angular.json changed: ${[...lines(frozen.out), ...lines(frozenUntracked.out)].join(', ')}`);
const changedAll = git('diff', '--name-only', BASELINE_COMMIT);
const untrackedAll = git('ls-files', '--others', '--exclude-standard');
if (changedAll.status !== 0) scopeProblems.push(`git diff failed: ${changedAll.out || changedAll.error}`);
const changedPaths = [...new Set([...lines(changedAll.out), ...lines(untrackedAll.out)])].sort();
const outside = changedPaths.filter((f) => !PERMITTED.some((re) => re.test(f)));
if (outside.length) scopeProblems.push(`changed outside WORK_PACKAGE §4: ${outside.join(', ')}`);
add('V17', 'No WP05/IB1+ or Nx/lint artefacts, apps/packages/angular.json unchanged, and every changed path is within WORK_PACKAGE §4',
  scopeProblems.length === 0, scopeProblems.length ? scopeProblems.join('; ') : `${changedPaths.length} changed paths, all permitted`);

// V18: controlled-source integrity (AC22)
const integrityProblems = [];
let controlledCount = 0;
try {
  const pack = JSON.parse(read('PACK_MANIFEST.json'));
  const controlled = pack.files.filter((f) => f.path === '.gitignore' || f.path.startsWith('.paep-control/'));
  controlledCount = controlled.length;
  for (const f of controlled) {
    if (!exists(f.path)) { integrityProblems.push(`missing ${f.path}`); continue; }
    if (sha256(f.path) !== f.sha256 || fs.statSync(abs(f.path)).size !== f.bytes) integrityProblems.push(`mismatch ${f.path}`);
  }
  const listed = new Set(controlled.map((f) => f.path));
  for (const f of allFiles.filter((x) => x.startsWith('.paep-control/'))) if (!listed.has(f)) integrityProblems.push(`unlisted ${f}`);
  if (git('diff', '--quiet', BASELINE_COMMIT, '--', '.paep-control', '.gitignore', 'PACK_MANIFEST.json', 'CLAUDE.md').status !== 0) integrityProblems.push('controlled files or CLAUDE.md differ from the baseline');
} catch (e) { integrityProblems.push(String(e)); }
add('V18', 'Controlled sources match PACK_MANIFEST.json; .paep-control, .gitignore, PACK_MANIFEST.json and CLAUDE.md unchanged',
  controlledCount > 0 && integrityProblems.length === 0, integrityProblems.length ? integrityProblems.join('; ') : `${controlledCount}/${controlledCount} files match sha256 and size`);

// V19: secrets (AC26)
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
add('V19', 'No credential or secret signatures in files added or modified since the baseline', secretFindings.length === 0,
  `${changedPaths.length} files scanned; findings: ${secretFindings.join(', ') || 'none'}`);

if (!staticOnly) {
  const npmRun = (script) => run('npm', ['run', script]);

  // V20-V21: production builds (AC19, AC20)
  for (const [id, script] of [['V20', 'build:reference-app'], ['V21', 'build:ui-lab']]) {
    const r = npmRun(script);
    add(id, `${script} production build passes`, r.status === 0, `exit=${r.status}\n${r.out.split(/\r?\n/).slice(-12).join('\n')}`);
  }

  // V22-V24: IB0-WP03 regression, which runs IB0-WP02 and IB0-WP01 (AC23-AC25).
  const protectedDirs = ['evidence/IB0-WP03', 'work-packages/IB0-WP03', 'evidence/IB0-WP02', 'work-packages/IB0-WP02', 'evidence/IB0-WP01', 'work-packages/IB0-WP01'];
  const dirtyBefore = git('status', '--porcelain', '--', ...protectedDirs);
  let wp03 = null;
  let wp02 = null;
  let wp01 = null;
  let rewritten = [];
  let residual = [];
  let runError = dirtyBefore.out ? `earlier WP records modified before the run: ${dirtyBefore.out}` : '';
  let wp03Status = null;
  if (!runError) {
    const r = npmRun('qa:ib0-wp03');
    wp03Status = r.status;
    fs.writeFileSync(path.join(logsDir, 'verify-ib0-wp03-regression.log'), `${r.out}\nEXIT_CODE=${r.status}\n`, 'utf8');
    const grab = (src, dest) => {
      try { const j = JSON.parse(read(src)); fs.writeFileSync(path.join(logsDir, dest), JSON.stringify(j, null, 2) + '\n', 'utf8'); return j; } catch { return null; }
    };
    wp03 = grab('evidence/IB0-WP03/reports/ib0-wp03-verification.json', 'ib0-wp03-verification.regression.json');
    wp02 = grab('evidence/IB0-WP03/logs/ib0-wp02-verification.regression.json', 'ib0-wp02-verification.regression.json');
    wp01 = grab('evidence/IB0-WP03/logs/ib0-wp01-verification.regression.json', 'ib0-wp01-verification.regression.json');
    for (const [src, dest] of [['evidence/IB0-WP03/logs/verify-ib0-wp02-regression.log', 'verify-ib0-wp02-regression.log'], ['evidence/IB0-WP03/logs/verify-ib0-wp01-regression.log', 'verify-ib0-wp01-regression.log']]) {
      if (exists(src)) fs.copyFileSync(abs(src), path.join(logsDir, dest));
    }
    rewritten = lines(git('diff', '--name-only', '--', ...protectedDirs).out);
    if (rewritten.length) git('checkout', '--', ...rewritten);
    residual = [...lines(git('diff', '--name-only', BASELINE_COMMIT, '--', ...protectedDirs).out), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...protectedDirs).out)];
  }

  // WP02 V17 bounded finding: tsconfig.base.json present; protected paths only those WP03 was authorised to change.
  const wp02V17 = wp02?.checks?.find((c) => c.id === 'V17');
  const wp02V17Bounded = (() => {
    if (!wp02V17 || wp02V17.pass) return !!wp02V17;
    const segs = wp02V17.details.split('; ');
    return segs.every((seg) => {
      if (seg === 'out-of-scope file present: tsconfig.base.json') return true;
      const m = /^protected paths changed: (.+)$/.exec(seg);
      return m && m[1].split(', ').every((f) => /^tsconfig\.json$|^packages\/[^/]+\/src\/index\.ts$/.test(f));
    });
  })();

  // V22: WP03 — every check passes except V05, V08, V10, V12, V17, each reporting only WP04-authorised change.
  const wp03Problems = [];
  if (runError) wp03Problems.push(runError);
  else if (!wp03) wp03Problems.push('no WP03 verification JSON');
  else {
    if (wp03.mode !== 'full') wp03Problems.push(`WP03 ran in mode ${wp03.mode}`);
    const pkgNames = fs.readdirSync(abs('packages')).map((d) => JSON.parse(read(`packages/${d}/package.json`)).name);
    const bounded = {
      V05: (d) => d === 'top-level extends added; extends changed',
      V08: (d) => JSON.stringify(d.split('; ').sort()) === JSON.stringify(pkgNames.map((n) => `${n}: no alias`).sort()),
      V10: (d) => d === 'package.json scripts differ from baseline + the two WP03 scripts',
      V12: (d) => d.split('; ').every((seg) => {
        const m = /^(out-of-scope files|boundary tooling \(IB0-WP04\)|changed outside WORK_PACKAGE §4): (.+)$/.exec(seg);
        if (!m) return false;
        const files = m[2].split(', ');
        return m[1] === 'out-of-scope files' ? files.every((f) => f === 'tsconfig.base.json') : files.every((f) => PERMITTED.some((re) => re.test(f)));
      }),
      V17: (d) => !!wp02V17 && !wp02V17.pass && wp02V17Bounded && d === `V17 finding outside the bounded exception: ${wp02V17.details}`
    };
    for (const c of wp03.checks) {
      if (c.pass) continue;
      if (!bounded[c.id]) wp03Problems.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
      else if (!bounded[c.id](c.details)) wp03Problems.push(`${c.id} finding outside the WP04 bounded exception: ${c.details.slice(0, 300)}`);
    }
    if (wp03.checks.length !== 18) wp03Problems.push(`WP03 reported ${wp03.checks.length} checks`);
  }
  if (residual.length) wp03Problems.push(`earlier WP records differ from the baseline after restore: ${residual.join(', ')}`);
  const wp03Passed = wp03 ? wp03.checks.filter((c) => c.pass).length : 0;
  const wp03Bounded = wp03 ? wp03.checks.filter((c) => !c.pass).map((c) => c.id) : [];
  add('V22', 'IB0-WP03 regression: every WP03 check passes except the bounded V05/V08/V10/V12/V17, each reporting only WP04-authorised change; WP03 records unchanged',
    wp03Problems.length === 0, wp03Problems.length ? wp03Problems.join('; ')
      : `WP03 ${wp03Passed}/${wp03.checks.length} pass; bounded: ${wp03Bounded.join(', ') || 'none'} (exit ${wp03Status}); restored: ${rewritten.join(', ') || 'none'}`);

  // V23: WP02 (run by WP03) — all but V17 pass; V17 bounded.
  const wp02Problems = [];
  if (!wp02) wp02Problems.push('no WP02 verification JSON');
  else {
    for (const c of wp02.checks) if (!c.pass && c.id !== 'V17') wp02Problems.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
    if (!wp02V17Bounded) wp02Problems.push(`V17 finding outside the bounded exception: ${wp02V17?.details}`);
  }
  add('V23', 'IB0-WP02 regression: every WP02 check passes except V17, whose findings are only tsconfig.base.json and the accepted WP03 paths',
    wp02Problems.length === 0, wp02Problems.length ? wp02Problems.join('; ') : `WP02 ${wp02.checks.filter((c) => c.pass).length}/${wp02.checks.length} pass; V17 bounded: ${wp02V17.details}`);

  // V24: WP01 (run by WP03) passes.
  const wp01Ok = wp01 && wp01.result === 'PASS' && wp01.checks.every((c) => c.pass);
  add('V24', 'IB0-WP01 regression passes', wp01Ok, wp01 ? `WP01 ${wp01.checks.filter((c) => c.pass).length}/${wp01.checks.length} pass` : 'no WP01 verification JSON');
}

const head = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--untracked-files=no');
const npmVersion = lines(run('npm', ['--version']).out).pop();
const passed = results.every((r) => r.pass);
const report = {
  workPackage: 'IB0-WP04',
  generatedAt: new Date().toISOString(),
  mode: staticOnly ? 'static-only' : 'full',
  commit: head.status === 0 ? head.out : null,
  baseline: BASELINE_COMMIT,
  trackedChangesAtRun: lines(dirty.out),
  node: process.versions.node,
  npm: npmVersion,
  typescript: ts.version,
  platform: `${process.platform}-${process.arch}`,
  nxDisposition: 'NOT REQUIRED FOR IB0-WP04',
  architecture: arch.summary,
  result: passed ? 'PASS' : 'FAIL',
  checks: results
};
fs.writeFileSync(path.join(reportsDir, 'ib0-wp04-verification.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.details ? ` — ${r.details.split('\n')[0]}` : ''}`);
console.log(`\nIB0-WP04 verification (${report.mode}): ${report.result} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
