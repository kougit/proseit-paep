#!/usr/bin/env node
/**
 * PAEP IB0-WP05 verifier and CI gate runner.
 *
 * Checks the GitHub Actions CI baseline (.github/workflows/paep-ci.yml and the
 * local setup action) against tooling/verification/ib0-wp05-ci-policy.json,
 * the controlled toolchain, controlled sources, scope and secrets, and runs the
 * accepted IB0-WP01..WP04 verifiers and negative suites as regression. The
 * historical verifiers are not modified: where they intentionally flag a later
 * authorised change, this verifier accepts a finding only when the paths it
 * names changed in accepted history (up to the active accepted baseline) or are
 * in the current CANDIDATE's authorised scope, and fails on anything else.
 *
 * IB1-PREFLIGHT-R7: the comparison baseline and the permitted change scope are
 * no longer fixed here. They come from the controlled baseline registry
 * (tooling/governance/baseline-registry.json, checked by W26 = B01-B13 of
 * tooling/governance/baseline-governance.mjs): the baseline is the newest
 * ACCEPTED generation and the scope is the CANDIDATE's authorisedScope.
 *
 * Usage (from the repository root, after `npm ci` except for --gate toolchain):
 *   node tooling/verification/verify-ib0-wp05.mjs                 full local run (W01-W24)
 *   node tooling/verification/verify-ib0-wp05.mjs --gate <name>   one CI gate:
 *     toolchain | governance | provenance | strictness | negative-architecture |
 *     regression | build-metadata --app <reference-app|ui-lab>
 *
 * Node.js built-ins only (typescript is not needed). The regression gates run
 * the older verifiers, which rewrite their tracked evidence; this script copies
 * what it needs and restores those files, and refuses to run if they already
 * have local changes. Writes ib0-wp05-verification[-<gate>].json and copies of every
 * report it reads to PAEP_EVIDENCE_DIR (CI) or, locally, to the git-ignored
 * tmp/paep-evidence/ib0-wp05/ (the accepted evidence/IB0-WP05 record is immutable).
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseYaml } from './yaml-subset.mjs';
import { evaluate as evaluateBaseline } from '../governance/baseline-governance.mjs';

const root = process.cwd();
const argv = process.argv.slice(2);
const argValue = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
const gate = argValue('--gate') || 'full';
const GATES = {
  toolchain: ['W01'],
  governance: ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W26'],
  provenance: ['W09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16'],
  strictness: ['W17'],
  'negative-architecture': ['W17', 'W18', 'W19'],
  regression: ['W20', 'W21', 'W22', 'W23'],
  'build-metadata': ['W25'],
  full: ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16',
    'W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24', 'W26']
};
if (!GATES[gate]) { console.error(`unknown gate: ${gate}`); process.exit(2); }
const selected = new Set(GATES[gate]);
const want = (id) => selected.has(id);

// The fixed baselines inside the unmodified historical verifiers (facts about those files, not the current
// baseline): each one reports paths changed since its own commit, which this verifier bounds below.
const HISTORICAL_VERIFIER_BASELINE = {
  wp02: 'b6b023fea11625360f0bf43cd0bdcba968cda90d',
  wp03: 'de13629b302e1bbaccc59bb0e93f69c7fed9cdcb',
  wp04: 'ac6b786caf3485ce2b45724be2b437c28f04b66b'
};
const POLICY_PATH = 'tooling/verification/ib0-wp05-ci-policy.json';
const PROTECTED_RECORDS = ['evidence/IB0-WP01', 'evidence/IB0-WP02', 'evidence/IB0-WP03', 'evidence/IB0-WP04',
  'work-packages/IB0-WP01', 'work-packages/IB0-WP02', 'work-packages/IB0-WP03', 'work-packages/IB0-WP04'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.angular']);

const results = [];
const add = (id, name, pass, details = '') => { if (want(id)) results.push({ id, name, pass: Boolean(pass), details }); };
const abs = (p) => path.join(root, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const readJson = (p) => JSON.parse(read(p));
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
const isWin = process.platform === 'win32';
const lines = (s) => (s || '').split(/\r?\n/).filter(Boolean);
const evidenceOut = process.env.PAEP_EVIDENCE_DIR || '';
// Local runs write under the git-ignored tmp/ folder: evidence/IB0-WP05 is an accepted, immutable record (B10).
const reportsDir = path.join(root, 'tmp', 'paep-evidence', 'ib0-wp05');
const logsDir = path.join(root, 'tmp', 'paep-evidence', 'ib0-wp05', 'ci-gates');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' }, shell: isWin, maxBuffer: 256 * 1024 * 1024, ...opts });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), stdout: r.stdout || '', error: r.error };
}
const git = (...args) => run('git', args);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(abs(dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = dir === '.' ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function keep(name, content) {
  // Saves a copy of a report or log this gate relied on.
  const targets = evidenceOut ? [path.join(evidenceOut, name)] : [path.join(logsDir, gate, name)];
  for (const t of targets) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, content, 'utf8'); }
}
const sameSet = (a, b) => JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort()) && a.length === new Set(a).size;

// ---- Shared state ------------------------------------------------------------------------
let pkg = {};
let policy = null;
try { pkg = readJson('package.json'); } catch (e) { add('W01', 'package.json parses', false, String(e)); }
try { policy = readJson(POLICY_PATH); } catch (e) { if (!['toolchain', 'build-metadata'].includes(gate)) add('W09', `${POLICY_PATH} parses`, false, String(e)); }

// W01: toolchain (IB-01 §4.1, WP02 pins). Runs before npm ci in every CI job.
if (want('W01')) {
  const p = [];
  const EXACT = /^\d+\.\d+\.\d+$/;
  const nvmrc = exists('.nvmrc') ? read('.nvmrc').trim() : '';
  if (!EXACT.test(nvmrc)) p.push(`.nvmrc is not an exact version: "${nvmrc}"`);
  const de = pkg.devEngines || {};
  if (de.runtime?.name !== 'node' || de.runtime?.version !== nvmrc || de.runtime?.onFail !== 'error') p.push(`devEngines.runtime ${JSON.stringify(de.runtime)} does not pin node ${nvmrc} with onFail=error`);
  const pmMatch = /^npm@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager || '');
  const npmPin = pmMatch ? pmMatch[1] : '';
  if (!npmPin) p.push(`packageManager "${pkg.packageManager}" is not npm@<exact>`);
  if (de.packageManager?.name !== 'npm' || de.packageManager?.version !== npmPin || de.packageManager?.onFail !== 'error') p.push(`devEngines.packageManager ${JSON.stringify(de.packageManager)} does not pin npm ${npmPin} with onFail=error`);
  try {
    const m = readJson('docs/architecture/toolchain-version-manifest.json');
    if (m.runtime?.node !== nvmrc) p.push(`version manifest node ${m.runtime?.node} != .nvmrc ${nvmrc}`);
    if (m.runtime?.npm !== npmPin) p.push(`version manifest npm ${m.runtime?.npm} != packageManager ${npmPin}`);
  } catch (e) { p.push(`version manifest: ${e.message}`); }
  const npmrc = exists('.npmrc') ? lines(read('.npmrc')).map((l) => l.trim()) : [];
  for (const need of ['engine-strict=true', 'strict-allow-scripts=true']) if (!npmrc.includes(need)) p.push(`.npmrc lacks ${need}`);
  if (process.versions.node !== nvmrc) p.push(`running Node ${process.versions.node} != pinned ${nvmrc}`);
  const npmV = run('npm', ['--version']);
  const runningNpm = lines(npmV.stdout).pop() || '';
  if (runningNpm !== npmPin) p.push(`running npm ${runningNpm || '(none)'} != pinned ${npmPin}`);
  add('W01', 'Toolchain: running Node and npm equal the exact pins in .nvmrc, packageManager, devEngines (onFail=error) and the version manifest; .npmrc keeps engine-strict and strict-allow-scripts',
    p.length === 0, p.length ? p.join('; ') : `node ${process.versions.node}; npm ${runningNpm}`);
}

// Controlled baseline (registry): the active ACCEPTED generation and the CANDIDATE's authorised scope.
// Changed paths are tracked + untracked since that baseline, without rename detection (a moved record shows under
// both paths). gov.base is null when the registry is invalid, and every check that needs it then fails closed.
const needsBaseline = ['W02', 'W05', 'W06', 'W07', 'W08', 'W11', 'W12', 'W16', 'W17', 'W18', 'W20', 'W21', 'W22', 'W23', 'W26'].some(want);
const gov = needsBaseline ? evaluateBaseline(root) : null;
const BASE = gov?.base || null;

// The dev dependencies the PO/SA approved for IB2, at their exact pins. Relative to the active accepted baseline,
// package.json dependencies must be unchanged, devDependencies may gain only these entries, and every lockfile
// entry that is not in the baseline lockfile must be dev-only.
const IB2_APPROVED_DEV_DEPENDENCIES = { '@vitest/browser-playwright': '4.1.11', 'axe-core': '4.13.0', playwright: '1.63.0', vitest: '4.1.11' };
function approvedDependencyDelta() {
  try {
    const basePkg = JSON.parse(git('show', `${BASE}:package.json`).stdout);
    const baseLock = JSON.parse(git('show', `${BASE}:package-lock.json`).stdout);
    const lock = readJson('package-lock.json');
    const sorted = (o) => JSON.stringify(Object.entries(o || {}).sort(([a], [b]) => a.localeCompare(b)));
    const devWanted = { ...(basePkg.devDependencies || {}), ...IB2_APPROVED_DEV_DEPENDENCIES };
    return sorted(pkg.dependencies) === sorted(basePkg.dependencies)
      && sorted(pkg.devDependencies) === sorted(devWanted)
      && sorted(lock.packages?.['']?.dependencies) === sorted(pkg.dependencies)
      && sorted(lock.packages?.['']?.devDependencies) === sorted(pkg.devDependencies)
      && Object.entries(lock.packages || {}).every(([k, v]) => k === '' || k in (baseLock.packages || {}) || (v.dev === true && !v.optional && !v.devOptional));
  } catch { return false; }
}
const changedPaths = gov ? gov.changedPaths : [];
const inScope = (f) => Boolean(gov) && gov.inScope(f);
const noBase = 'no valid accepted baseline in the baseline registry (see W26)';

// W26: controlled baseline governance (B01-B13).
if (want('W26')) {
  const failed = gov.results.filter((r) => !r.pass);
  add('W26', 'Controlled baseline governance: the registry is valid and append-only, the active ACCEPTED generation is a PO/SA-accepted mainline merge, immutable sources and accepted records are unchanged, and every change since it is inside the CANDIDATE scope (B01-B13)',
    failed.length === 0, failed.length ? failed.map((r) => `${r.id}: ${r.details}`).join('; ') : `B01-B13 pass; active G${gov.active.generation} ${BASE.slice(0, 7)}; candidate ${gov.candidate ? `G${gov.candidate.generation} ${gov.candidate.workPackages.join(', ')} (CANDIDATE, not accepted)` : 'none'}`);
}
const allFiles = ['W03', 'W04'].some(want) ? walk('.') : [];

// W02: controlled sources (PACK_MANIFEST fingerprints) and CLAUDE.md unchanged.
if (want('W02')) {
  const p = [];
  let n = 0;
  try {
    const pack = readJson('PACK_MANIFEST.json');
    const controlled = pack.files.filter((f) => f.path === '.gitignore' || f.path.startsWith('.paep-control/'));
    n = controlled.length;
    for (const f of controlled) {
      if (!exists(f.path)) { p.push(`missing ${f.path}`); continue; }
      if (sha256(f.path) !== f.sha256 || fs.statSync(abs(f.path)).size !== f.bytes) p.push(`fingerprint mismatch ${f.path}`);
    }
    const listed = new Set(controlled.map((f) => f.path));
    for (const f of walk('.paep-control')) if (!listed.has(f)) p.push(`unlisted ${f}`);
    if (!BASE) p.push(noBase);
    else {
      if (git('diff', '--quiet', BASE, '--', '.paep-control', '.gitignore', 'PACK_MANIFEST.json').status !== 0) p.push(`controlled files differ from the accepted baseline ${BASE.slice(0, 7)}`);
      if (git('diff', '--quiet', BASE, '--', 'CLAUDE.md').status !== 0 && !inScope('CLAUDE.md')) p.push(`CLAUDE.md differs from the accepted baseline ${BASE.slice(0, 7)} without authorisation in the CANDIDATE scope`);
    }
  } catch (e) { p.push(String(e)); }
  add('W02', 'Controlled sources match PACK_MANIFEST.json sha256 and size; .paep-control, .gitignore and PACK_MANIFEST.json unchanged since the accepted baseline; CLAUDE.md unchanged unless the CANDIDATE scope authorises it',
    n > 0 && p.length === 0, p.length ? p.join('; ') : `${n}/${n} controlled files match`);
}

// W03: IR-01 §4.2 topology and no nested package boundary.
if (want('W03')) {
  const required = ['apps/reference-app', 'apps/ui-lab', 'config', 'docs', 'evidence', 'angular.json', 'tsconfig.base.json', 'package.json', 'package-lock.json',
    ...['contracts', 'foundation', 'components', 'platform', 'enterprise', 'analytics', 'offline', 'i18n', 'observability', 'frappe-sdk'].map((d) => `packages/${d}`),
    ...['architecture-boundaries', 'config-validation', 'test-utils', 'visual-regression', 'a11y', 'build-release'].map((d) => `tooling/${d}`)];
  const missing = required.filter((d) => !exists(d));
  if (!fs.readdirSync(abs('packages')).some((d) => d.startsWith('domain-'))) missing.push('packages/domain-*');
  const manifests = allFiles.filter((f) => /(^|\/)package\.json$/.test(f));
  const nested = manifests.filter((f) => f !== 'package.json' && !/^packages\/[^/]+\/package\.json$/.test(f));
  add('W03', 'IR-01 §4.2 repository topology present; package.json only at the root and packages/<name>/ (no nested package boundary)',
    missing.length === 0 && nested.length === 0, [missing.length ? `missing: ${missing.join(', ')}` : `${required.length + 1} topology entries present`, nested.length ? `nested package.json: ${nested.join(', ')}` : `${manifests.length} manifests, none nested`].join('; '));
}

// W04: no Nx.
if (want('W04')) {
  const p = [];
  let lock = {};
  try { lock = readJson('package-lock.json'); } catch (e) { p.push(String(e)); }
  const isNx = (n) => n === 'nx' || n.startsWith('@nx/') || n.startsWith('@nrwl/');
  for (const f of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) for (const n of Object.keys(pkg[f] || {})) if (isNx(n)) p.push(`package.json ${f}: ${n}`);
  for (const k of Object.keys(lock.packages || {})) if (isNx(k.replace(/^.*node_modules\//, ''))) p.push(`lockfile: ${k}`);
  for (const f of allFiles) if (/(^|\/)(nx|project)\.json$/.test(f)) p.push(`file ${f}`);
  if (exists('node_modules/nx') || exists('node_modules/@nx') || exists('node_modules/@nrwl')) p.push('Nx installed in node_modules');
  add('W04', 'No Nx: no nx/@nx/@nrwl dependency, lockfile entry or install, and no nx.json or project.json', p.length === 0, p.length ? p.join('; ') : 'none; Nx disposition NOT REQUIRED');
}

// W05: application/package/config changes only inside the authorised scope; while no generation authorises
// implementation paths (IB1 not started), every entry point stays a placeholder and config/ holds no schema.
const IMPL = (f) => /^(apps|packages|config)\//.test(f) || /^(angular\.json|tsconfig[^/]*\.json)$/.test(f);
if (want('W05')) {
  const p = [];
  if (!BASE) p.push(noBase);
  const frozen = changedPaths.filter((f) => IMPL(f) && !inScope(f));
  if (frozen.length) p.push(`changed without authorisation: ${frozen.join(', ')}`);
  const gens = gov?.registry?.generations || [];
  const implAuthorised = gens.some((g) => g.generation > 1 && (g.authorisedScope || []).some((e) => /^(apps|packages|config)\/|^(angular\.json|tsconfig[^/]*\.json)$/.test(e)));
  if (!implAuthorised) {
    const configFiles = fs.readdirSync(abs('config'));
    if (JSON.stringify(configFiles) !== JSON.stringify(['README.md'])) p.push(`config/ holds ${configFiles.join(', ')} (runtime schema is IB1)`);
    for (const d of fs.readdirSync(abs('packages'))) {
      const src = walk(`packages/${d}/src`);
      if (JSON.stringify(src) !== JSON.stringify([`packages/${d}/src/index.ts`])) p.push(`packages/${d}/src holds ${src.join(', ')}`);
      else if (read(`packages/${d}/src/index.ts`).replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '').trim() !== 'export {};') p.push(`packages/${d}/src/index.ts is not a placeholder`);
    }
  }
  add('W05', 'Implementation scope: apps, packages, config, angular.json and tsconfig files change only inside the CANDIDATE scope; while no generation authorises them (IB1 not started) entry points are placeholders and config/ holds no runtime schema',
    p.length === 0, p.length ? p.join('; ') : (implAuthorised ? 'implementation changes authorised by the registry and in scope' : 'IB1 not started: no generation authorises implementation paths; 18 placeholder entry points'));
}

// W06: no unauthorised dependency change: lockfile and non-script package.json fields equal the accepted
// baseline unless package-lock.json is in scope; accepted scripts unchanged; new scripts only with package.json in scope.
if (want('W06')) {
  const p = gov ? [...gov.packageProblems] : [noBase];
  // IB2: a CANDIDATE scope holding package-lock.json admits only the PO/SA-approved dependency delta, and the lockfile
  // must be exactly the one recorded in the toolchain manifest (no unreviewed lockfile drift).
  if (gov && BASE && git('diff', '--quiet', BASE, '--', 'package-lock.json').status !== 0) {
    if (!approvedDependencyDelta()) p.push('dependency change beyond the PO/SA-approved IB2 dev dependencies (or a non-dev lockfile entry)');
    let recorded = null;
    try { recorded = readJson('docs/architecture/toolchain-version-manifest.json').lockfile?.sha256; } catch { /* reported below */ }
    if (recorded !== sha256('package-lock.json')) p.push('package-lock.json differs from the lockfile sha256 recorded in docs/architecture/toolchain-version-manifest.json');
  }
  add('W06', 'No unauthorised dependency change: package-lock.json and every non-script package.json field equal the accepted baseline (unless the CANDIDATE scope holds package-lock.json, and then only the PO/SA-approved IB2 dev dependencies with the lockfile recorded in the toolchain manifest); accepted scripts unchanged; script additions only with package.json in scope',
    p.length === 0, p.length ? p.join('; ') : `lockfile sha256 ${sha256('package-lock.json')}`);
}

// W07: change authorisation (B11) and no lint/format/unit-test configuration unless the CANDIDATE scope names it.
if (want('W07')) {
  const b11 = gov.results.find((r) => r.id === 'B11');
  const lintTest = walk('.').filter((f) => /(^|\/)(\.eslintrc[^/]*|eslint\.config\.[^/]+|\.prettierrc[^/]*|prettier\.config\.[^/]+|vitest\.config\.[^/]+|jest\.config\.[^/]+|karma\.conf\.[^/]+)$/.test(f) && !(changedPaths.includes(f) && inScope(f)));
  add('W07', 'Every path changed since the accepted baseline is inside the CANDIDATE\'s authorised scope (B11); no lint/format/unit-test configuration outside that scope',
    Boolean(BASE) && b11.pass && lintTest.length === 0,
    [!BASE ? noBase : b11.details, lintTest.length ? `lint/test config: ${lintTest.join(', ')}` : ''].filter(Boolean).join('; '));
}

// W08: secrets.
if (want('W08')) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    /AKIA[0-9A-Z]{16}/,
    /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
    /\bnpm_[A-Za-z0-9]{36}\b/,
    /(?:^|\s)(?:\/\/[^\s]*:)?_(?:auth|authToken|password)\s*=\s*\S/m,
    /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/,
    /(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/i
  ];
  const findings = changedPaths.filter((f) => exists(f) && fs.statSync(abs(f)).isFile() && fs.statSync(abs(f)).size < 2_000_000 && patterns.some((re) => re.test(read(f))));
  if (!BASE) findings.push(noBase);
  add('W08', 'No credential or secret signatures in files added or modified since the accepted baseline', findings.length === 0,
    `${changedPaths.length} files scanned; findings: ${findings.join(', ') || 'none'}`);
}

// ---- Workflow policy (W09-W15) ------------------------------------------------------------
let wf = null;
let setup = null;
let wfText = '';
let setupText = '';
if (['W09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15'].some(want) && policy) {
  const p = [];
  try { wfText = read(policy.workflow.path); wf = parseYaml(wfText); } catch (e) { p.push(`${policy.workflow.path}: ${e.message}`); }
  try { setupText = read(policy.workflow.setupAction); setup = parseYaml(setupText); } catch (e) { p.push(`${policy.workflow.setupAction}: ${e.message}`); }
  if (p.length) add('W09', 'Workflow files parse', false, p.join('; '));
}
const jobsOf = () => (wf && typeof wf.jobs === 'object' && wf.jobs) || {};
const mandatoryIds = policy ? policy.mandatoryJobs.map((j) => j.id) : [];
function* strings(v, where = '') {
  if (typeof v === 'string') yield [v, where];
  else if (Array.isArray(v)) for (const [k, x] of v.entries()) yield* strings(x, `${where}[${k}]`);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { yield [k, `${where}.${k} (key)`]; yield* strings(x, `${where}.${k}`); }
}
const allSteps = () => [
  ...Object.entries(jobsOf()).flatMap(([id, j]) => (Array.isArray(j?.steps) ? j.steps : []).map((s, k) => ({ s, where: `jobs.${id}.steps[${k}]` }))),
  ...((setup?.runs?.steps) || []).map((s, k) => ({ s, where: `setup.steps[${k}]` }))
];

// W09: workflow set and triggers.
if (want('W09') && wf && setup) {
  const p = [];
  const wfDir = exists('.github/workflows') ? fs.readdirSync(abs('.github/workflows')) : [];
  if (JSON.stringify(wfDir) !== JSON.stringify([path.basename(policy.workflow.path)])) p.push(`.github/workflows holds ${wfDir.join(', ') || 'nothing'}`);
  const ghFiles = walk('.github');
  const expectedGh = [policy.workflow.setupAction, policy.workflow.path].sort();
  if (JSON.stringify(ghFiles.sort()) !== JSON.stringify(expectedGh)) p.push(`.github holds ${ghFiles.join(', ')}; expected ${expectedGh.join(', ')}`);
  if (JSON.stringify(Object.keys(wf)) !== JSON.stringify(policy.workflow.topLevelKeys)) p.push(`workflow top-level keys ${Object.keys(wf).join(', ')} != ${policy.workflow.topLevelKeys.join(', ')} (no defaults, env or other key)`);
  if (wf.name !== policy.workflow.name) p.push(`workflow name "${wf.name}"`);
  const on = wf.on;
  if (!on || typeof on !== 'object' || Array.isArray(on)) p.push('"on" is not a mapping');
  else {
    if (!sameSet(Object.keys(on), Object.keys(policy.workflow.triggers))) p.push(`triggers ${Object.keys(on).join(', ')} != ${Object.keys(policy.workflow.triggers).join(', ')}`);
    for (const t of policy.workflow.forbiddenTriggers) if (t in on) p.push(`forbidden trigger ${t}`);
    for (const [t, spec] of Object.entries(policy.workflow.triggers)) {
      if (!(t in on)) continue;
      if (JSON.stringify(on[t] ?? null) !== JSON.stringify(spec)) p.push(`${t}: ${JSON.stringify(on[t])} != ${JSON.stringify(spec)}`);
    }
  }
  if (JSON.stringify(wf.concurrency) !== JSON.stringify({ group: policy.workflow.concurrency.group, 'cancel-in-progress': policy.workflow.concurrency.cancelInProgress })) p.push(`concurrency ${JSON.stringify(wf.concurrency)}`);
  add('W09', 'One workflow with exactly pull_request→main, push→main and workflow_dispatch (no pull_request_target or other trigger, no path filters); concurrency cancels superseded pull_request runs only',
    p.length === 0, p.length ? p.join('; ') : `${policy.workflow.path}: pull_request [main], push [main], workflow_dispatch; cancel-in-progress only for pull_request`);
}

// W10: least-privilege permissions.
if (want('W10') && wf) {
  const p = [];
  if (JSON.stringify(wf.permissions) !== JSON.stringify(policy.workflow.topLevelPermissions)) p.push(`top-level permissions ${JSON.stringify(wf.permissions)}`);
  for (const [id, j] of Object.entries(jobsOf())) {
    if (id === policy.gate.id) { if (JSON.stringify(j.permissions) !== JSON.stringify(policy.gate.permissions)) p.push(`${id} permissions ${JSON.stringify(j.permissions)}`); }
    else if (j && 'permissions' in j) p.push(`${id} overrides permissions`);
  }
  for (const [s, where] of strings(wf)) if (/write/i.test(s) && /permissions/.test(where)) p.push(`write permission at ${where}`);
  add('W10', 'GITHUB_TOKEN is read-only: top-level permissions exactly contents: read, no job widens it, and the gate job has no permissions',
    p.length === 0, p.length ? p.join('; ') : 'contents: read; gate {}');
}

// Accepted-policy floor (IB1-CONTRACTS-CONFIG, independent QA Q6-1). The CI policy in the working tree is a CANDIDATE change;
// it may only add mandatory jobs. Every job of the policy at the active accepted baseline keeps its name and exact commands,
// and every other policy field (gate, workflow, actions, retention, setup) stays byte-identical, so a CANDIDATE cannot drop,
// weaken or rename an accepted control while editing the workflow and the policy together.
const POLICY_FLOOR_FREE = ['policyVersion', 'workPackage', 'note', 'mandatoryJobs', 'requiredCommands'];
// IB2-FOUNDATION-COMPONENTS (authorising instruction §18): the IB2 jobs are mandatory and keep these commands even while
// the policy is a CANDIDATE, so dropping a component, design-system or browser (visual/responsive/accessibility) command
// from the policy and the workflow together fails W11. Later changes may add commands to these jobs, never drop these.
const IB2_REQUIRED_JOBS = {
  components: { name: 'PAEP / components', commands: ['npm run test:components', 'npm run qa:design-system', 'npm run qa:design-system:negative', 'npm run qa:ib2:ci-negative'] },
  accessibility: { name: 'PAEP / accessibility', commands: ['npm run build:ui-lab', 'npm run qa:accessibility', 'npm run qa:accessibility:negative'] },
  'negative-ci-b': { name: 'PAEP / negative-ci-b', commands: ['npm run qa:ib0-wp05:negative -- --part b'] },
};
// IB2 CI-performance split (PO/SA, 2026-09-28; RR14): the accepted negative-ci command `npm run qa:ib0-wp05:negative`
// may be replaced only by exactly its two halves, part a in negative-ci (keeping every other accepted command in order)
// and part b in the mandatory negative-ci-b job, so the two parallel jobs run exactly the accepted suite.
const WP05_NEGATIVE = 'npm run qa:ib0-wp05:negative';
const NEGATIVE_CI_SPLIT = { 'negative-ci': `${WP05_NEGATIVE} -- --part a`, 'negative-ci-b': `${WP05_NEGATIVE} -- --part b` };
function splitNegativeCi(accepted) {
  const expected = (accepted || []).map((c) => (c === WP05_NEGATIVE ? NEGATIVE_CI_SPLIT['negative-ci'] : c));
  return (accepted || []).includes(WP05_NEGATIVE)
    && JSON.stringify(policy.requiredCommands?.['negative-ci']) === JSON.stringify(expected)
    && JSON.stringify(policy.requiredCommands?.['negative-ci-b']) === JSON.stringify([NEGATIVE_CI_SPLIT['negative-ci-b']])
    && policy.mandatoryJobs?.some((x) => x.id === 'negative-ci-b' && x.name === 'PAEP / negative-ci-b');
}
function acceptedPolicyFloor() {
  const jobs = []; const other = [];
  for (const [id, r] of Object.entries(IB2_REQUIRED_JOBS)) {
    const c = policy.mandatoryJobs?.find((x) => x.id === id);
    if (!c || c.name !== r.name) jobs.push(`IB2 mandatory job ${id} removed or renamed`);
    for (const cmd of r.commands) if (!(policy.requiredCommands?.[id] || []).includes(cmd)) jobs.push(`IB2 command "${cmd}" dropped from ${id}`);
  }
  if (!BASE) return { jobs: [...jobs, noBase], other: [noBase] };
  let a = null;
  try { a = JSON.parse(git('show', `${BASE}:tooling/verification/ib0-wp05-ci-policy.json`).stdout); } catch { /* reported */ }
  if (!a || !Array.isArray(a.mandatoryJobs)) return { jobs: [...jobs, 'accepted CI policy unreadable'], other: ['accepted CI policy unreadable'] };
  for (const j of a.mandatoryJobs) {
    const c = policy.mandatoryJobs.find((x) => x.id === j.id);
    if (!c || c.name !== j.name) jobs.push(`accepted mandatory job ${j.id} removed or renamed`);
    const same = JSON.stringify(policy.requiredCommands?.[j.id]) === JSON.stringify(a.requiredCommands?.[j.id]);
    if (!same && !(j.id === 'negative-ci' && splitNegativeCi(a.requiredCommands?.[j.id]))) jobs.push(`accepted commands of ${j.id} changed`);
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(policy)])) {
    if (!POLICY_FLOOR_FREE.includes(k) && JSON.stringify(a[k]) !== JSON.stringify(policy[k])) other.push(`policy ${k} differs from the accepted baseline ${BASE.slice(0, 7)}`);
  }
  return { jobs, other };
}
const floor = (want('W11') || want('W12')) && policy ? acceptedPolicyFloor() : { jobs: [], other: [] };

// W11: parallel topology, required commands, timeouts and evidence artifacts.
if (want('W11') && wf) {
  const p = [...floor.jobs];
  const jobs = jobsOf();
  if (!sameSet(Object.keys(jobs), [...mandatoryIds, policy.gate.id])) p.push(`jobs ${Object.keys(jobs).join(', ')}`);
  for (const mj of policy.mandatoryJobs) {
    const j = jobs[mj.id];
    if (!j) { p.push(`missing job ${mj.id}`); continue; }
    const allowedKeys = ['name', 'runs-on', 'timeout-minutes', 'steps'];
    for (const k of Object.keys(j)) if (!allowedKeys.includes(k)) p.push(`${mj.id} has ${k}`);
    if (j.name !== mj.name) p.push(`${mj.id} name "${j.name}" != "${mj.name}"`);
    if (j['runs-on'] !== policy.workflow.runner) p.push(`${mj.id} runs-on ${j['runs-on']}`);
    if (!Number.isInteger(j['timeout-minutes']) || j['timeout-minutes'] < 1 || j['timeout-minutes'] > 30) p.push(`${mj.id} timeout-minutes ${j['timeout-minutes']}`);
    // RR14 (accepted LOW): PAEP / negative-ci keeps its 20-minute timeout until the PO/SA authorises a change.
    if ((mj.id === 'negative-ci' || mj.id === 'negative-ci-b') && j['timeout-minutes'] !== 20) p.push(`${mj.id} timeout-minutes ${j['timeout-minutes']} (RR14 fixes it at 20)`);
    const steps = Array.isArray(j.steps) ? j.steps : [];
    const [co, su, ...rest] = steps;
    const up = rest.pop();
    if (!co || !/^actions\/checkout@/.test(co.uses || '') || co.with?.['fetch-depth'] !== 0 || co.with?.['persist-credentials'] !== false || Object.keys(co).some((k) => !['name', 'uses', 'with'].includes(k)) || !sameSet(Object.keys(co.with || {}), ['fetch-depth', 'persist-credentials'])) p.push(`${mj.id}: step 1 is not checkout with fetch-depth 0 and persist-credentials false`);
    if (!su || su.uses !== './.github/actions/paep-setup' || Object.keys(su).some((k) => !['name', 'uses'].includes(k))) p.push(`${mj.id}: step 2 is not the PAEP setup action`);
    if (!up || !/^actions\/upload-artifact@/.test(up.uses || '') || up.if !== '${{ always() }}' || up.with?.path !== '${{ runner.temp }}/paep-evidence/'
      || up.with?.['retention-days'] !== policy.artifactRetentionDays || up.with?.name !== `paep-${mj.id}-attempt-\${{ github.run_attempt }}`
      || !sameSet(Object.keys(up), ['name', 'uses', 'if', 'with']) || !sameSet(Object.keys(up.with || {}), ['name', 'path', 'if-no-files-found', 'retention-days']) || up.with['if-no-files-found'] !== 'warn') p.push(`${mj.id}: last step is not the evidence upload (always, runner.temp/paep-evidence, ${policy.artifactRetentionDays} days)`);
    const runs = rest.map((s) => s.run || '');
    for (const s of rest) if (Object.keys(s).some((k) => !['name', 'run'].includes(k))) p.push(`${mj.id}: step "${s.name}" has ${Object.keys(s).join(', ')}`);
    for (const r of runs) if (!/^set -euo pipefail\n/.test(r)) p.push(`${mj.id}: run step without set -euo pipefail`);
    const cmds = runs.map((r) => (r.split('\n')[1] || '').replace(/ 2>&1 \| tee "\$PAEP_EVIDENCE_DIR\/[a-z0-9-]+\.log"$/, ''));
    if (JSON.stringify(cmds) !== JSON.stringify(policy.requiredCommands[mj.id])) p.push(`${mj.id}: commands ${JSON.stringify(cmds)} != ${JSON.stringify(policy.requiredCommands[mj.id])}`);
    for (const r of runs) if (r.split('\n').filter(Boolean).length !== 2) p.push(`${mj.id}: run step has extra lines`);
  }
  add('W11', 'Every mandatory job in the CI policy (a superset of the accepted baseline policy, whose jobs and commands are unchanged) runs in parallel (no needs, no if, no continue-on-error), each from a clean full checkout with the PAEP setup, its required commands under set -euo pipefail, a timeout and an always-uploaded evidence artifact with bounded retention; PAEP / negative-ci and PAEP / negative-ci-b (its split half) keep the 20-minute timeout (RR14)',
    p.length === 0, p.length ? p.join('; ') : `${mandatoryIds.length} parallel jobs: ${mandatoryIds.join(', ')}`);
}

// W12: aggregate gate structure (behaviour is proven by the negative suite, which runs this script).
if (want('W12') && wf) {
  const p = [...floor.other];
  const g = jobsOf()[policy.gate.id];
  if (!g) p.push('no gate job');
  else {
    if (g.name !== policy.gate.name) p.push(`gate name "${g.name}"`);
    if (g.if !== policy.gate.if) p.push(`gate if "${g.if}"`);
    if (g['runs-on'] !== policy.workflow.runner) p.push(`gate runs-on ${JSON.stringify(g['runs-on'])}`);
    if (!Number.isInteger(g['timeout-minutes']) || g['timeout-minutes'] < 1 || g['timeout-minutes'] > 10) p.push(`gate timeout-minutes ${g['timeout-minutes']}`);
    if (!Array.isArray(g.needs) || !sameSet(g.needs, mandatoryIds)) p.push(`gate needs ${JSON.stringify(g.needs)}`);
    if (Object.keys(g).some((k) => !['name', 'if', 'needs', 'runs-on', 'timeout-minutes', 'permissions', 'steps'].includes(k))) p.push(`gate keys ${Object.keys(g).join(', ')}`);
    const steps = Array.isArray(g.steps) ? g.steps : [];
    if (steps.length !== 1) p.push(`gate has ${steps.length} steps`);
    const s = steps[0] || {};
    if (Object.keys(s).some((k) => !['name', 'env', 'run'].includes(k))) p.push(`gate step keys ${Object.keys(s).join(', ')}`);
    if (!sameSet(Object.keys(s.env || {}), ['NEEDS_JSON', 'MANDATORY_JOBS'])) p.push(`gate step env keys ${Object.keys(s.env || {}).join(', ')}`);
    if (s.env?.NEEDS_JSON !== '${{ toJSON(needs) }}') p.push('gate NEEDS_JSON is not toJSON(needs)');
    const listed = String(s.env?.MANDATORY_JOBS || '').split(/\s+/).filter(Boolean);
    if (!sameSet(listed, mandatoryIds)) p.push(`gate MANDATORY_JOBS ${listed.join(' ')}`);
    const r = s.run || '';
    // The script must equal the reviewed text in the policy exactly: a substring check would accept an early "exit 0".
    if (r !== policy.gate.run) p.push('gate script differs from the reviewed script in the policy (gate.run)');
  }
  add('W12', 'Aggregate gate "PAEP / gate" (gate, workflow and action policy byte-identical to the accepted baseline): needs every mandatory job, runs always(), holds no permissions, and fails unless its needs equal the mandatory list and every result is success',
    p.length === 0, p.length ? p.join('; ') : `needs ${mandatoryIds.length}/${mandatoryIds.length}; if always(); permissions {}`);
}

// W13: expressions, untrusted metadata, secrets and credentials.
if (want('W13') && wf && setup) {
  const p = [];
  const ALLOWED = [
    (s) => s === policy.workflow.concurrency.group, (s) => s === policy.workflow.concurrency.cancelInProgress,
    (s) => s === '${{ always() }}', (s) => /^paep-[a-z-]+-attempt-\$\{\{ github\.run_attempt \}\}$/.test(s),
    (s) => s === '${{ runner.temp }}/paep-evidence/', (s) => s === '${{ toJSON(needs) }}'
  ];
  for (const [doc, name] of [[wf, 'workflow'], [setup, 'setup action']]) {
    for (const [s, where] of strings(doc)) {
      if (/secrets\s*[.[]|\bsecrets\b\s*:/.test(s)) p.push(`${name}${where}: secrets reference`);
      if (s.includes('${{') && !ALLOWED.some((f) => f(s))) p.push(`${name}${where}: expression not on the allowlist: ${s.slice(0, 80)}`);
    }
  }
  for (const { s, where } of allSteps()) {
    if (typeof s.run === 'string' && s.run.includes('${{')) p.push(`${where}: expression inside a run script`);
    if (s.uses && /^actions\/checkout@/.test(s.uses) && s.with?.['persist-credentials'] !== false) p.push(`${where}: checkout persists credentials`);
    if (s.with && typeof s.with === 'object') for (const k of Object.keys(s.with)) if (/token|password|secret/i.test(k)) p.push(`${where}: credential input ${k}`);
  }
  add('W13', 'No secrets, no credential inputs, no persisted checkout credentials, no expression inside any run script, and only allowlisted expressions (no untrusted PR metadata)',
    p.length === 0, p.length ? p.join('; ') : 'none');
}

// W14: action pinning and register.
if (want('W14') && wf && setup) {
  const p = [];
  const used = new Set();
  for (const text of [wfText, setupText]) {
    for (const l of text.split(/\r?\n/)) {
      const m = /^\s*(?:- )?uses:\s*(\S+)(?:\s+#\s*(\S+))?\s*$/.exec(l);
      if (!m) { if (/\buses:/.test(l) && !/^\s*#/.test(l)) p.push(`unrecognised uses line: ${l.trim()}`); continue; }
      const [, ref, comment] = m;
      if (policy.approvedLocalActions.includes(ref)) { used.add(ref); continue; }
      const a = /^([A-Za-z0-9-]+\/[A-Za-z0-9._-]+)@([0-9a-f]{40})$/.exec(ref);
      if (!a) { p.push(`not pinned to a full commit SHA: ${ref}`); continue; }
      const entry = policy.approvedActions.find((x) => x.action === a[1]);
      if (!entry) { p.push(`unapproved action ${a[1]}`); continue; }
      if (entry.sha !== a[2]) p.push(`${a[1]}@${a[2]} is not the approved SHA ${entry.sha}`);
      if (comment !== entry.version) p.push(`${a[1]} version comment "${comment}" != ${entry.version}`);
      used.add(a[1]);
    }
  }
  for (const { s, where } of allSteps()) if (s.uses && !used.has(s.uses.split('@')[0]) && !used.has(s.uses)) p.push(`${where}: uses ${s.uses} not verified`);
  for (const x of policy.approvedActions) if (!used.has(x.action)) p.push(`approved but unused: ${x.action}`);
  let register = '';
  try { register = read('docs/provenance/GITHUB-ACTIONS-REGISTER.md'); } catch (e) { p.push(`register: ${e.message}`); }
  for (const x of policy.approvedActions) for (const v of [x.action, x.sha, x.version, x.licence]) if (!register.includes(v)) p.push(`register lacks ${x.action} ${v}`);
  add('W14', 'Every action is a first-party approved action pinned to its full commit SHA with the matching version comment, or the approved local setup action; the register lists each one',
    p.length === 0, p.length ? p.join('; ') : `${policy.approvedActions.map((x) => `${x.action}@${x.sha.slice(0, 7)} (${x.version}, ${x.licence})`).join('; ')}; local: ${policy.approvedLocalActions.join(', ')}`);
}

// W15: setup action, installation and cache policy.
if (want('W15') && setup) {
  const p = [];
  if (setup.runs?.using !== 'composite') p.push('setup action is not composite');
  if (Object.keys(setup).some((k) => !['name', 'description', 'runs'].includes(k)) || !sameSet(Object.keys(setup.runs || {}), ['using', 'steps'])) p.push(`setup action keys ${Object.keys(setup).join(', ')} / runs ${Object.keys(setup.runs || {}).join(', ')}`);
  // Every setup step (keys, inputs, env, shell and run text) must equal the reviewed steps in the policy.
  const reviewed = policy.setupSteps;
  const got = setup.runs?.steps || [];
  if (got.length !== reviewed.length) p.push(`setup has ${got.length} steps; the policy has ${reviewed.length}`);
  for (const [k, st] of got.entries()) if (JSON.stringify(st) !== JSON.stringify(reviewed[k])) p.push(`setup step ${k + 1} ("${st?.name}") differs from the reviewed step in the policy (setupSteps)`);
  const steps = setup.runs?.steps || [];
  const sn = steps.find((s) => /^actions\/setup-node@/.test(s.uses || ''));
  const w = sn?.with || {};
  if (!sn) p.push('no setup-node step');
  else {
    if (JSON.stringify(w) !== JSON.stringify({ 'node-version-file': '.nvmrc', 'check-latest': false, cache: 'npm', 'cache-dependency-path': 'package-lock.json' })) p.push(`setup-node inputs ${JSON.stringify(w)}`);
  }
  const runs = steps.map((s) => s.run || '');
  const tIdx = runs.findIndex((r) => r.includes('verify-ib0-wp05.mjs --gate toolchain'));
  const ciIdx = runs.findIndex((r) => /(^|\n)npm ci( |$|\n)/.test(r));
  const clean = runs.findIndex((r) => r.includes('git diff --exit-code -- package.json package-lock.json') && r.includes('git status --porcelain'));
  if (!(tIdx >= 0 && ciIdx > tIdx && clean > ciIdx)) p.push('setup order is not toolchain gate -> npm ci -> tracked-tree check');
  for (const r of runs) if (r && !r.startsWith('set -euo pipefail\n')) p.push('setup run step without set -euo pipefail');
  if (steps.some((s) => s.run && s.shell !== 'bash')) p.push('setup run step without shell: bash');
  const everyRun = allSteps().map(({ s }) => s.run || '').join('\n');
  if (/\bnpm\s+(install|i|add|update|rebuild)\b|--ignore-scripts=false|--foreground-scripts|--no-package-lock|--force\b|--legacy-peer-deps/.test(everyRun)) p.push('a run step installs outside npm ci or changes install-script/lockfile behaviour');
  for (const { s, where } of allSteps()) {
    if (/^actions\/cache@/.test(s.uses || '')) p.push(`${where}: actions/cache`);
    if (typeof s.with?.path === 'string' && s.with.path.includes('node_modules')) p.push(`${where}: path includes node_modules`);
  }
  add('W15', 'Setup installs Node from .nvmrc (no floating version, no check-latest), caches only npm downloads keyed on package-lock.json, runs the toolchain gate before npm ci and fails if installation changes a tracked file; no other install command, no node_modules cache',
    p.length === 0, p.length ? p.join('; ') : 'setup-node(.nvmrc, cache npm) -> toolchain gate -> npm ci -> tracked tree unchanged');
}

// ---- Running the accepted verifiers ----------------------------------------------------------
let recordsChecked = false;
function recordsClean() {
  if (recordsChecked) return null;
  recordsChecked = true;
  const d = git('status', '--porcelain', '--', ...PROTECTED_RECORDS);
  return d.out ? `earlier work-package records have local changes before the run: ${d.out.replace(/\n/g, ', ')}` : null;
}
function restoreRecords() {
  const changed = lines(git('diff', '--name-only', '--', ...PROTECTED_RECORDS).out);
  if (changed.length) git('checkout', '--', ...changed);
  return changed;
}
// Deletes the reports a verifier is about to write, so a stale committed report can never be read
// as the result of this run (restoreRecords() brings the tracked copies back afterwards).
function runVerifier(script, extra = [], reports = []) {
  for (const f of reports) fs.rmSync(abs(f), { force: true });
  return run(process.execPath, [script, ...extra]);
}
const tryJson = (p) => { try { return readJson(p); } catch { return null; } };
const pkgNames = () => fs.readdirSync(abs('packages')).map((d) => readJson(`packages/${d}/package.json`).name);

// Historical-verifier bounds (IB1-PREFLIGHT-R7). An older verifier compares with its own fixed commit and so
// reports every later change. A reported path is accepted only if it changed in accepted history between that
// commit and the active accepted baseline, or is a change now inside the CANDIDATE scope (B11 passing);
// "present" findings also accept a path that exists in the accepted baseline tree. Any other text fails.
const since = (key) => (BASE && gov ? gov.authorisedSince(HISTORICAL_VERIFIER_BASELINE[key]) : () => false);
const presentAccepted = (key) => {
  const ok = since(key);
  const tree = BASE ? lines(git('ls-tree', '-r', '--name-only', BASE).out) : [];
  return (f) => ok(f, { presence: true }) || tree.some((t) => t.startsWith(`${f}/`)) || (changedPaths.some((c) => c.startsWith(`${f}/`) && inScope(c)) && gov.results.find((r) => r.id === 'B11').pass);
};
const segmentsOk = (details, rules) => details.split('; ').every((seg) => rules.some(([re, test]) => { const m = re.exec(seg); return m && test(m); }));
const fileList = (m) => m[m.length - 1].split(', ');
// A package.json / package-lock.json finding: the file changed in accepted history or in scope now, and W06 holds.
const pkgFinding = (key) => [/^(package\.json scripts differ from baseline \+ the (?:two WP03|four WP04) scripts|package\.json fields other than scripts changed|package-lock\.json differs from the baseline)$/,
  (m) => Boolean(gov) && gov.packageProblems.length === 0 && since(key)(m[1].startsWith('package-lock') ? 'package-lock.json' : 'package.json')];

// IB1-CONTRACTS-CONFIG: the WP03/WP04 verifiers require the IB0 placeholder entry points. A package entry point that is
// no longer a placeholder is accepted only when it changed inside the CANDIDATE scope (B11 passing) or, once promoted, in
// accepted history after that verifier's baseline (the same bound as every other historical finding).
// IB2-FOUNDATION-COMPONENTS adds the foundation and components entry points under the same bound, and
// IB3-ENTERPRISE-SHELL the i18n, observability and enterprise entry points.
const IB1_FILLED_ENTRIES = ['packages/contracts/src/index.ts', 'packages/platform/src/index.ts', 'packages/foundation/src/index.ts', 'packages/components/src/index.ts',
  'packages/i18n/src/index.ts', 'packages/observability/src/index.ts', 'packages/enterprise/src/index.ts'];
const filledEntry = (key) => (f) => IB1_FILLED_ENTRIES.includes(f) && since(key)(f);

// IB3-ENTERPRISE-SHELL: the WP03 V13 / WP04 V18 integrity finding is accepted only when CLAUDE.md is the one controlled
// path that differs from that verifier's baseline and it changed inside the CANDIDATE scope (or, once promoted, in
// accepted history). .paep-control, .gitignore and PACK_MANIFEST.json stay exact (W02 also checks them).
const CONTROLLED_FINDING = 'controlled files or CLAUDE.md differ from the baseline';
function claudeMdBounded(key, d) {
  if (d !== CONTROLLED_FINDING || !BASE) return false;
  const changed = lines(git('diff', '--name-only', HISTORICAL_VERIFIER_BASELINE[key], '--', '.paep-control', '.gitignore', 'PACK_MANIFEST.json', 'CLAUDE.md').out);
  return changed.length === 1 && changed[0] === 'CLAUDE.md' && since(key)('CLAUDE.md');
}

// Bounded WP04 V07 (filled entry points), V16/V17 (static checks) and V18 (CLAUDE.md only, IB3).
function wp04StaticBounded(check) {
  if (check.id === 'V18') return claudeMdBounded('wp04', check.details);
  if (check.id === 'V07') return segmentsOk(check.details, [[/^(.+) is not a placeholder$/, (m) => filledEntry('wp04')(m[1])]]);
  if (check.id === 'V16') return segmentsOk(check.details, [pkgFinding('wp04')]);
  if (check.id === 'V17') {
    const ok = since('wp04');
    const present = presentAccepted('wp04');
    return segmentsOk(check.details, [
      [/^out-of-scope files: (.+)$/, (m) => fileList(m).every(present)],
      [/^(changed outside WORK_PACKAGE §4|apps\/packages\/angular\.json changed): (.+)$/, (m) => fileList(m).every((f) => ok(f))]
    ]);
  }
  return false;
}
// Bounded WP02 V17.
function wp02V17Bounded(c) {
  if (!c) return false;
  if (c.pass) return true;
  const ok = since('wp02');
  const present = presentAccepted('wp02');
  const depNames = (o) => Object.keys({ ...(o.dependencies || {}), ...(o.devDependencies || {}) }).sort();
  return segmentsOk(c.details, [
    [/^out-of-scope file present: (.+)$/, (m) => present(m[1])],
    [/^(protected paths changed|untracked files in protected paths): (.+)$/, (m) => fileList(m).every((f) => ok(f))],
    [/^dependency names changed: /, () => Boolean(BASE) && (inScope('package-lock.json') || JSON.stringify(depNames(pkg)) === JSON.stringify(depNames(JSON.parse(git('show', `${BASE}:package.json`).stdout))))]
  ]);
}

// IB2-FOUNDATION-COMPONENTS: bounded WP02 V13/V15 and WP03 V06 (WORK_PACKAGE.md section 7). The PO/SA approved four
// dev dependencies (lockfile change, W06) including axe-core under licence review L5, and the ui-lab test target.
// V13: only the lockfile-vs-IB0-WP01 finding, with a clean tree and package-lock.json changed in scope or accepted history.
const WP02_V13_BOUND = `working tree vs HEAD: clean; lockfile vs ${HISTORICAL_VERIFIER_BASELINE.wp02.slice(0, 7)}: different`;
function wp02V13Bounded(c) {
  return Boolean(c) && (c.pass || (c.details === WP02_V13_BOUND && Boolean(gov) && Boolean(BASE) && gov.packageProblems.length === 0
    && since('wp02')('package-lock.json') && approvedDependencyDelta()));
}
// V15: only axe-core (MPL-2.0), dev scope, with the L5 review row recorded; any other licence finding fails.
const WP02_V15_BOUND = 'node_modules/axe-core: MPL-2.0 allowed only for review L1 packages';
function wp02V15Bounded(c) {
  if (!c) return false;
  if (c.pass) return true;
  let entry = null;
  try { entry = readJson('package-lock.json').packages['node_modules/axe-core']; } catch { return false; }
  const review = exists('docs/licences/THIRD-PARTY-LICENCE-REVIEW.md') ? read('docs/licences/THIRD-PARTY-LICENCE-REVIEW.md') : '';
  return c.details === WP02_V15_BOUND && entry?.license === 'MPL-2.0' && entry.dev === true && !entry.optional
    && /^\| L5 \| axe-core \|/m.test(review) && since('wp02')('package-lock.json');
}
const wp02Bounded = (c) => (c?.id === 'V13' ? wp02V13Bounded(c) : c?.id === 'V15' ? wp02V15Bounded(c) : c?.id === 'V17' ? wp02V17Bounded(c) : false);
// WP03 V06: only "angular.json differs", and angular.json equals the accepted baseline apart from the ui-lab test target.
function wp03V06Bounded(d) {
  if (d !== 'angular.json differs from the baseline' || !BASE || !since('wp03')('angular.json')) return false;
  try {
    const strip = (o) => { if (o?.projects?.['ui-lab']?.architect) delete o.projects['ui-lab'].architect.test; return JSON.stringify(o); };
    const cur = readJson('angular.json');
    const test = cur.projects?.['ui-lab']?.architect?.test;
    if (test && test.builder !== '@angular/build:unit-test') return false;
    return strip(cur) === strip(JSON.parse(git('show', `${BASE}:angular.json`).stdout));
  } catch { return false; }
}

// W17: WP04 static verifier (strictness V04-V07 and every other static check), bounded V16/V17.
let wp04Static = null;
if (want('W17')) {
  const p = [];
  const dirty = recordsClean();
  if (dirty) p.push(dirty);
  else {
    const r = runVerifier('tooling/verification/verify-ib0-wp04.mjs', ['--static-only'], ['evidence/IB0-WP04/reports/ib0-wp04-verification.json']);
    wp04Static = tryJson('evidence/IB0-WP04/reports/ib0-wp04-verification.json');
    keep('verify-ib0-wp04-static.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
    if (wp04Static) keep('ib0-wp04-verification.static.json', JSON.stringify(wp04Static, null, 2) + '\n');
    restoreRecords();
    if (!wp04Static || wp04Static.mode !== 'static-only') p.push('no WP04 static report');
    else {
      for (const id of ['V04', 'V05', 'V06', 'V07']) {
        const c = wp04Static.checks.find((x) => x.id === id);
        if (!c?.pass && !(id === 'V07' && c && wp04StaticBounded(c))) p.push(`strictness check ${id} failed`);
      }
      for (const c of wp04Static.checks) if (!c.pass && !wp04StaticBounded(c)) p.push(`${c.id} failed outside the accepted-history/CANDIDATE bound: ${c.details.slice(0, 300)}`);
      if (wp04Static.checks.length !== 19) p.push(`WP04 static reported ${wp04Static.checks.length} checks`);
    }
  }
  const fails = wp04Static ? wp04Static.checks.filter((c) => !c.pass).map((c) => c.id) : [];
  add('W17', 'Strict configuration: WP04 static verifier passes V04-V07 (strict, noImplicitAny, strictTemplates, noCheck and suppression protection, aliases, entry points) and every other static check; V07 reports only entry points filled inside the CANDIDATE scope; V16/V17 report only accepted-history or in-scope change; V18 reports only an in-scope CLAUDE.md change',
    p.length === 0, p.length ? p.join('; ') : `WP04 static ${19 - fails.length}/19 pass; bounded: ${fails.join(', ') || 'none'}`);
}

// W18: WP04 negative suite; only the positive control C3 may fail (V16/V17, plus V07 for filled entry points), and edge-count
// controls only by the edges of the unmutated graph.
if (want('W18')) {
  const p = [];
  let neg = null;
  let negLog = ''; // read before restoreRecords() brings back the accepted copy
  const dirty = recordsClean();
  if (dirty) p.push(dirty);
  else {
    const r = runVerifier('tooling/verification/negative-ib0-wp04.mjs', [], ['evidence/IB0-WP04/reports/negative-tests.json', 'evidence/IB0-WP04/logs/negative-architecture-tests.log']);
    neg = tryJson('evidence/IB0-WP04/reports/negative-tests.json');
    negLog = exists('evidence/IB0-WP04/logs/negative-architecture-tests.log') ? read('evidence/IB0-WP04/logs/negative-architecture-tests.log') : '';
    keep('negative-ib0-wp04.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
    if (neg) keep('ib0-wp04-negative-tests.json', JSON.stringify(neg, null, 2) + '\n');
    if (exists('evidence/IB0-WP04/logs/negative-architecture-tests.log')) keep('ib0-wp04-negative-architecture-tests.log', read('evidence/IB0-WP04/logs/negative-architecture-tests.log'));
    restoreRecords();
    if (!neg) p.push('no WP04 negative report');
    else {
      if (neg.cases.length !== 86) p.push(`${neg.cases.length} cases (expected 86)`);
      // IB1-CONTRACTS-CONFIG: the WP04 edge-count controls were written for an IB0 graph with no edge. The unmutated graph now has
      // E0 edges (measured here, and it must equal what C0 reports); a control is accepted only if it still exits 0 with no
      // violation or cycle and reports exactly its own edges plus E0 (optional edges likewise). E0 > 0 requires an entry point
      // filled inside the CANDIDATE scope.
      const live = run(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json']);
      let base0 = null;
      try { const j = JSON.parse(live.stdout); if (live.status === 0 && j.ok === true) base0 = { edges: j.summary.edges, optional: j.summary.optionalEdges }; } catch { /* fails below */ }
      const summaryOf = (id) => { const m = new RegExp(`^## ${id} [^\\n]*\\nexpected: [^\\n]*\\nsummary: (\\{[^\\n]*\\})$`, 'm').exec(negLog); try { return m ? JSON.parse(m[1]) : null; } catch { return null; } };
      const graphGrew = Boolean(base0) && (base0.edges === 0 || IB1_FILLED_ENTRIES.some(filledEntry('wp04'))) && summaryOf('C0')?.edges === base0.edges;
      const edgeBounded = (c) => {
        const want = /^exit 0, no violations, (\d+) edges \((\d+) optional\)$/.exec(c.expected || '');
        const got = summaryOf(c.id);
        return graphGrew && base0.edges > 0 && c.tool === 'arch:check' && Boolean(want) && c.exit === 0 && (c.rules || []).length === 0 && Boolean(got)
          && got.violations === 0 && got.cycles === 0 && got.edges === Number(want[1]) + base0.edges && got.optionalEdges === Number(want[2]) + base0.optional;
      };
      for (const c of neg.cases) {
        if (c.pass) continue;
        if (c.id === 'C3' && c.exit === 1 && [['V16', 'V17'], ['V07', 'V16', 'V17'], ['V16', 'V17', 'V18'], ['V07', 'V16', 'V17', 'V18']].some((set) => sameSet(c.failedChecks || [], set))) continue;
        if (edgeBounded(c)) continue;
        p.push(`${c.id} failed: ${c.name} (exit ${c.exit}; ${JSON.stringify(c.failedChecks || c.rules || c.codesFound)})`);
      }
      // C3 runs the WP04 static verifier on an unmutated copy, so its V16/V17 findings are those W17 bounds.
      const c3 = neg.cases.find((c) => c.id === 'C3');
      if (c3 && !c3.pass) {
        const st = wp04Static?.checks || [];
        if (!['V07', 'V16', 'V17', 'V18'].every((id) => { const c = st.find((x) => x.id === id); return c && (c.pass || wp04StaticBounded(c)); })) p.push('C3 V07/V16/V17/V18 findings are not the bounded ones (see W17)');
      }
    }
  }
  const failed = neg ? neg.cases.filter((c) => !c.pass).map((c) => c.id) : [];
  add('W18', 'WP04 negative architecture/strictness suite: every case passes except positive control C3, which fails only V16/V17 (and V07 for entry points filled in scope, V18 for an in-scope CLAUDE.md change) with accepted-history or in-scope findings, and edge-count controls that differ only by the edges of the unmutated graph',
    p.length === 0, p.length ? p.join('; ') : `${neg.cases.length - failed.length}/${neg.cases.length} pass; bounded: ${failed.join(', ') || 'none'}`);
}

// W19: WP03 negative runner — accepted crash since WP04 moved paths to tsconfig.base.json.
if (want('W19')) {
  const p = [];
  const r = runVerifier('tooling/verification/negative-ib0-wp03.mjs');
  keep('negative-ib0-wp03.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
  restoreRecords();
  let rootTs = '';
  try { rootTs = read('tsconfig.json'); } catch { /* reported */ }
  const hasPaths = /"paths"\s*:/.test(rootTs);
  const baseHasPaths = exists('tsconfig.base.json') && /"paths"\s*:/.test(read('tsconfig.base.json'));
  if (r.status === 0) p.push('WP03 negative runner now passes: remove this bounded exception');
  else if (!(r.status === 1 && r.out.includes('negative-ib0-wp03.mjs:125') && r.out.includes('TypeError: Cannot convert undefined or null to object') && !hasPaths && baseHasPaths)) p.push(`unexpected failure (exit ${r.status}): ${r.out.split('\n').slice(0, 6).join(' | ')}`);
  add('W19', 'WP03 negative runner: fails only with the known M11 TypeError because WP04 moved paths from tsconfig.json to tsconfig.base.json (its strictness intent is carried by WP04 S1-S9 and the WP05 qa:types negatives)',
    p.length === 0, p.length ? p.join('; ') : 'exit 1 at negative-ib0-wp03.mjs:125 (paths in tsconfig.base.json); bounded');
}

// W20-W23: WP04 full verifier (runs WP03, which runs WP02 and WP01), re-evaluated with the registry bounds.
if (['W20', 'W21', 'W22', 'W23'].some(want)) {
  const p20 = []; const p21 = []; const p22 = []; const p23 = [];
  const dirty = recordsClean();
  let wp04 = null; let wp03 = null; let wp02 = null; let wp01 = null; let residual = [];
  if (dirty) p20.push(dirty);
  else {
    const r = runVerifier('tooling/verification/verify-ib0-wp04.mjs', [], ['evidence/IB0-WP04/reports/ib0-wp04-verification.json', 'evidence/IB0-WP04/logs/ib0-wp03-verification.regression.json', 'evidence/IB0-WP04/logs/ib0-wp02-verification.regression.json', 'evidence/IB0-WP04/logs/ib0-wp01-verification.regression.json']);
    keep('verify-ib0-wp04-full.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
    wp04 = tryJson('evidence/IB0-WP04/reports/ib0-wp04-verification.json');
    wp03 = tryJson('evidence/IB0-WP04/logs/ib0-wp03-verification.regression.json');
    wp02 = tryJson('evidence/IB0-WP04/logs/ib0-wp02-verification.regression.json');
    wp01 = tryJson('evidence/IB0-WP04/logs/ib0-wp01-verification.regression.json');
    for (const [n, j] of [['ib0-wp04-verification.full.json', wp04], ['ib0-wp03-verification.regression.json', wp03], ['ib0-wp02-verification.regression.json', wp02], ['ib0-wp01-verification.regression.json', wp01]]) if (j) keep(n, JSON.stringify(j, null, 2) + '\n');
    for (const f of ['verify-ib0-wp03-regression.log', 'verify-ib0-wp02-regression.log', 'verify-ib0-wp01-regression.log']) if (exists(`evidence/IB0-WP04/logs/${f}`)) keep(f, read(`evidence/IB0-WP04/logs/${f}`));
    restoreRecords();
    // Accepted records must be exactly as accepted after the older verifiers ran and were restored (B10, re-evaluated).
    const after = evaluateBaseline(root).results.find((x) => x.id === 'B10');
    if (!after.pass) residual = [after.details];
  }
  // WP02 (run by WP03).
  if (!wp02) p22.push('no WP02 report');
  else {
    for (const c of wp02.checks) if (!c.pass && !['V13', 'V15', 'V17'].includes(c.id)) p22.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
    for (const id of ['V13', 'V15', 'V17']) if (!wp02Bounded(wp02.checks.find((c) => c.id === id))) p22.push(`${id} outside the bound: ${wp02.checks.find((c) => c.id === id)?.details}`);
  }
  // WP03 (run by WP04): V05/V08 are WP04's accepted tsconfig change (exact text); V10/V12 use the registry bounds.
  if (!wp03) p21.push('no WP03 report');
  else {
    if (wp03.mode !== 'full') p21.push(`WP03 mode ${wp03.mode}`);
    if (wp03.checks.length !== 18) p21.push(`WP03 reported ${wp03.checks.length} checks`);
    const bounded = {
      V05: (d) => d === 'top-level extends added; extends changed',
      V08: (d) => sameSet(d.split('; '), pkgNames().map((n) => `${n}: no alias`)),
      V09: (d) => segmentsOk(d, [[/^(.+) is not a placeholder \(export \{\} only\)$/, (m) => filledEntry('wp03')(m[1])]]),
      V10: (d) => segmentsOk(d, [pkgFinding('wp03')]),
      V12: (d) => segmentsOk(d, [
        [/^(out-of-scope files|boundary tooling \(IB0-WP04\)): (.+)$/, (m) => fileList(m).every(presentAccepted('wp03'))],
        [/^(changed outside WORK_PACKAGE §4|apps changed): (.+)$/, (m) => fileList(m).every((f) => since('wp03')(f))]
      ]),
      V06: wp03V06Bounded,
      V13: (d) => claudeMdBounded('wp03', d),
      // WP03 V17 relays every failing WP02 check; each must be one W22 bounds (V13/V15 as "failed", V17 as outside).
      V17: (d) => {
        const failing = (wp02?.checks || []).filter((c) => !c.pass);
        if (!failing.length || !failing.every(wp02Bounded)) return false;
        const expected = failing.map((c) => (c.id === 'V17' ? `V17 finding outside the bounded exception: ${c.details}` : `${c.id} failed: ${c.details.split('\n')[0]}`));
        return d === expected.join('; ');
      }
    };
    for (const c of wp03.checks) {
      if (c.pass) continue;
      if (!bounded[c.id]) p21.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
      else if (!bounded[c.id](c.details)) p21.push(`${c.id} outside the accepted-history/CANDIDATE bound: ${c.details.slice(0, 300)}`);
    }
  }
  if (residual.length) p21.push(`accepted records differ from their accepted generation after restore: ${residual.join(', ')}`);
  // WP01.
  if (!(wp01 && wp01.result === 'PASS' && wp01.checks.every((c) => c.pass))) p23.push(wp01 ? `WP01 ${wp01.checks.filter((c) => c.pass).length}/${wp01.checks.length}` : 'no WP01 report');
  // WP04: all pass except V16, V17 (static bound), V22 (re-evaluated as W21), V23 (re-evaluated as W22).
  if (wp04) {
    if (wp04.mode !== 'full' || wp04.checks.length !== 24) p20.push(`WP04 mode ${wp04.mode}, ${wp04.checks.length} checks`);
    for (const c of wp04.checks) {
      if (c.pass) continue;
      if (c.id === 'V07' || c.id === 'V16' || c.id === 'V17' || c.id === 'V18') { if (!wp04StaticBounded(c)) p20.push(`${c.id} outside the accepted-history/CANDIDATE bound: ${c.details.slice(0, 300)}`); continue; }
      if (c.id === 'V22') { if (p21.length) p20.push('V22 not explained by the bound (see W21)'); continue; }
      if (c.id === 'V23') { if (p22.length) p20.push('V23 not explained by the bound (see W22)'); continue; }
      p20.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
    }
  } else if (!dirty) p20.push('no WP04 report');
  const summary = (j) => (j ? `${j.checks.filter((c) => c.pass).length}/${j.checks.length} pass; bounded: ${j.checks.filter((c) => !c.pass).map((c) => c.id).join(', ') || 'none'}` : '');
  add('W20', 'IB0-WP04 regression (full, with both builds): every check passes except V07 (only entry points filled inside the CANDIDATE scope), V16/V17 (only accepted-history or in-scope package/path changes), V18 (only an in-scope CLAUDE.md change) and V22/V23 (re-evaluated in W21/W22)', p20.length === 0, p20.length ? p20.join('; ') : `WP04 ${summary(wp04)}`);
  add('W21', 'IB0-WP03 regression: every check passes except the accepted V05/V08 (WP04 tsconfig change, exact), V09 (only entry points filled inside the CANDIDATE scope), V06 (only the ui-lab test target in angular.json), V13 (only an in-scope CLAUDE.md change) and V10/V12/V17, whose findings are only accepted-history or in-scope change; accepted records unchanged', p21.length === 0, p21.length ? p21.join('; ') : `WP03 ${summary(wp03)}`);
  add('W22', 'IB0-WP02 regression: every check (toolchain, pins, lockfile provenance, install scripts, licences, controlled sources, secrets) passes except V13 (lockfile change limited to the PO/SA-approved IB2 dev dependencies at their pins, no runtime dependency change, new lockfile entries dev-only), V15 (axe-core under review L5 only) and V17, whose findings are only accepted-history or in-scope change', p22.length === 0, p22.length ? p22.join('; ') : `WP02 ${summary(wp02)}`);
  add('W23', 'IB0-WP01 regression passes', p23.length === 0, p23.length ? p23.join('; ') : `WP01 ${summary(wp01)}`);
}

// W16: WP02 toolchain/provenance controls, run standalone in the provenance job.
if (want('W16')) {
  const p = [];
  const dirty = recordsClean();
  let wp02 = null;
  if (dirty) p.push(dirty);
  else {
    const r = runVerifier('tooling/verification/verify-ib0-wp02.mjs', [], ['evidence/IB0-WP02/reports/ib0-wp02-verification.json']);
    wp02 = tryJson('evidence/IB0-WP02/reports/ib0-wp02-verification.json');
    keep('verify-ib0-wp02.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
    if (wp02) keep('ib0-wp02-verification.json', JSON.stringify(wp02, null, 2) + '\n');
    if (exists('evidence/IB0-WP02/reports/licence-inventory.json')) keep('licence-inventory.json', read('evidence/IB0-WP02/reports/licence-inventory.json'));
    restoreRecords();
    if (!wp02) p.push('no WP02 report');
    else {
      for (const id of ['V04', 'V05', 'V06', 'V12', 'V14']) if (!wp02.checks.find((c) => c.id === id)?.pass) p.push(`${id} failed: ${wp02.checks.find((c) => c.id === id)?.details}`);
      for (const c of wp02.checks) if (!c.pass && !['V13', 'V15', 'V17'].includes(c.id) && !p.some((x) => x.startsWith(c.id))) p.push(`${c.id} failed: ${c.details.split('\n')[0]}`);
      for (const id of ['V13', 'V15', 'V17']) if (!wp02Bounded(wp02.checks.find((c) => c.id === id))) p.push(`${id} outside the bound: ${wp02.checks.find((c) => c.id === id)?.details}`);
    }
  }
  add('W16', 'WP02 supply-chain controls hold: running toolchain (V04/V05), .npmrc (V06), registry + sha512 lockfile provenance (V12), every install script denied and none unreviewed (V14), licences reviewed (V15, with only axe-core under review L5 bounded); only V13 (the approved IB2 dev dependencies, exactly), V15 and V17 bounded',
    p.length === 0, p.length ? p.join('; ') : `WP02 ${wp02.checks.filter((c) => c.pass).length}/${wp02.checks.length} pass; bounded: ${wp02.checks.filter((c) => !c.pass).map((c) => c.id).join(', ') || 'none'}`);
}

// W24: strict type-check (local full run; CI runs `npm run qa:types` in the strictness job).
if (want('W24')) {
  const r = run('npm', ['run', 'qa:types']);
  keep('qa-types.log', `${r.out}\nEXIT_CODE=${r.status}\n`);
  add('W24', 'npm run qa:types (ngc --noEmit, strict TypeScript and templates, both applications) exits 0', r.status === 0, `exit=${r.status}`);
}

// W25: build metadata (CI build jobs, after the production build).
if (want('W25')) {
  const app = argValue('--app');
  const p = [];
  let files = [];
  if (!['reference-app', 'ui-lab'].includes(app)) p.push(`--app must be reference-app or ui-lab, got ${app}`);
  else if (!exists(`dist/${app}`)) p.push(`dist/${app} missing`);
  else {
    files = walk(`dist/${app}`).map((f) => ({ path: f, bytes: fs.statSync(abs(f)).size, sha256: sha256(f) }));
    if (!files.some((f) => /\/index\.html$/.test(f.path))) p.push('no index.html');
    if (!files.some((f) => /3rdpartylicenses\.txt$/.test(f.path))) p.push('no 3rdpartylicenses.txt');
    keep(`build-${app}-manifest.json`, JSON.stringify({ app, commit: git('rev-parse', 'HEAD').out, files }, null, 2) + '\n');
    const lic = files.find((f) => /3rdpartylicenses\.txt$/.test(f.path));
    if (lic) keep(`build-${app}-3rdpartylicenses.txt`, read(lic.path));
  }
  add('W25', `Production build output for ${app} recorded (file list with sha256, third-party licence notices)`, p.length === 0,
    p.length ? p.join('; ') : `${files.length} files; ${files.reduce((a, f) => a + f.bytes, 0)} bytes`);
}

// Every check of the selected gate must report. A check skipped because its input is missing or unparseable (for example
// an empty workflow file parsing to null) fails instead of silently shrinking the gate (independent QA, IB1-CONTRACTS-CONFIG).
for (const id of selected) {
  if (!results.some((r) => r.id === id)) results.push({ id, name: 'Check did not run', pass: false, details: 'a prerequisite input was missing or did not parse (see the other findings); a gate check may never be skipped' });
}
results.sort((a, b) => a.id.localeCompare(b.id));

// ---- Report ----------------------------------------------------------------------------------
const passed = results.length > 0 && results.every((r) => r.pass);
const head = git('rev-parse', 'HEAD');
const report = {
  workPackage: 'IB0-WP05',
  generatedAt: new Date().toISOString(),
  gate,
  commit: head.status === 0 ? head.out : null,
  baseline: BASE,
  baselineGeneration: gov?.active ? gov.active.generation : null,
  candidate: gov?.candidate ? { generation: gov.candidate.generation, workPackages: gov.candidate.workPackages, status: gov.candidate.status } : null,
  node: process.versions.node,
  platform: `${process.platform}-${process.arch}`,
  ci: process.env.GITHUB_ACTIONS === 'true' ? { runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT, job: process.env.GITHUB_JOB, event: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF } : null,
  result: passed ? 'PASS' : 'FAIL',
  checks: results
};
const name = gate === 'full' ? 'ib0-wp05-verification.json' : `ib0-wp05-verification-${gate}${gate === 'build-metadata' ? `-${argValue('--app')}` : ''}.json`;
const text = JSON.stringify(report, null, 2) + '\n';
if (evidenceOut) keep(name, text);
else { fs.mkdirSync(reportsDir, { recursive: true }); fs.writeFileSync(path.join(reportsDir, name), text, 'utf8'); }

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.details ? ` — ${r.details.split('\n')[0]}` : ''}`);
console.log(`\nIB0-WP05 verification (${gate}): ${report.result} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
