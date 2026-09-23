#!/usr/bin/env node
/**
 * PAEP IB0-WP02 verifier.
 * Uses only Node.js built-ins so it can run without adding project dependencies.
 * It checks the Node/npm pins and their enforcement settings, exact dependency
 * pins against the lockfile and installed tree, the version manifest, lockfile
 * integrity, the install-script policy, the licence inventory, controlled-source
 * integrity, scope and secrets, and runs both production builds.
 * Run it from the repository root after `npm ci`. It writes only under
 * evidence/IB0-WP02/reports/. It does not replace the fresh-clone and negative
 * evidence described in work-packages/IB0-WP02/QUALITY_GATE_RUNBOOK.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const evidenceDir = path.join(root, 'evidence', 'IB0-WP02', 'reports');
fs.mkdirSync(evidenceDir, { recursive: true });

// Accepted IB0-WP01 merge commit and the commit that restored .paep-control/.
const BASELINE_COMMIT = 'b6b023fea11625360f0bf43cd0bdcba968cda90d';
const CONTROL_COMMIT = '8259317';
const MANIFEST_PATH = 'docs/architecture/toolchain-version-manifest.json';
const BASELINE_DEPENDENCY_NAMES = [
  '@angular/build', '@angular/cli', '@angular/common', '@angular/compiler', '@angular/compiler-cli',
  '@angular/core', '@angular/forms', '@angular/platform-browser', '@angular/router',
  'rxjs', 'tslib', 'typescript'
];
// Licences accepted as permissive (docs/licences/THIRD-PARTY-LICENCE-REVIEW.md §1).
const PERMISSIVE_LICENCES = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'BlueOak-1.0.0']);
// Licences allowed only for the reviewed, build-time-only packages (review items L1 and L2).
const REVIEWED_LICENCES = {
  'MPL-2.0': { review: 'L1', names: /^lightningcss(-[a-z0-9-]+)?$/ },
  'CC-BY-4.0': { review: 'L2', names: /^caniuse-lite$/ }
};

const results = [];
const add = (id, name, pass, details = '') => results.push({ id, name, pass: Boolean(pass), details });
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const isWin = process.platform === 'win32';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'pipe', env: process.env, shell: isWin });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), error: r.error };
}
const git = (...args) => run('git', args);

// Minimal semver range check for the comparator forms used by the lockfile
// (^, ~, >=, >, <=, <, =, bare versions, space-joined sets and ||).
function parseVersion(v) {
  const m = /^v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/.exec(String(v).trim());
  if (!m) return null;
  const n = (x) => (x === undefined || x === 'x' || x === '*' ? null : Number(x));
  return [Number(m[1]), n(m[2]), n(m[3])];
}
function cmp(a, b) {
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; }
  return 0;
}
function comparatorOk(version, comp) {
  const m = /^(\^|~|>=|<=|>|<|=)?\s*(.+)$/.exec(comp);
  const op = m[1] || '=';
  const p = parseVersion(m[2]);
  if (!p) return false;
  const lo = [p[0], p[1] ?? 0, p[2] ?? 0];
  let hi;
  if (op === '^') hi = lo[0] > 0 || p[1] === null ? [lo[0] + 1, 0, 0] : lo[1] > 0 || p[2] === null ? [0, lo[1] + 1, 0] : [0, 0, lo[2] + 1];
  if (op === '~') hi = p[1] === null ? [lo[0] + 1, 0, 0] : [lo[0], lo[1] + 1, 0];
  if (op === '=' && (p[1] === null || p[2] === null)) hi = p[1] === null ? [lo[0] + 1, 0, 0] : [lo[0], lo[1] + 1, 0];
  const c = cmp(version, lo);
  switch (op) {
    case '>=': return c >= 0;
    case '>': return c > 0;
    case '<=': return c <= 0;
    case '<': return c < 0;
    default: return hi ? c >= 0 && cmp(version, hi) < 0 : c === 0;
  }
}
function satisfies(versionString, range) {
  const v = parseVersion(versionString);
  if (!v || v.includes(null)) return false;
  return String(range).split('||').some((set) => {
    const comps = set.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1').split(/\s+/).filter(Boolean);
    return comps.length > 0 && comps.every((c) => comparatorOk(v, c));
  });
}
const EXACT = /^\d+\.\d+\.\d+$/;
const nameFromPath = (p) => p.slice(p.lastIndexOf('node_modules/') + 'node_modules/'.length);

let pkg = {};
let lock = { packages: {} };
let manifest = null;
try { pkg = readJson('package.json'); } catch (e) { add('V00', 'package.json parses', false, String(e)); }
try { lock = readJson('package-lock.json'); } catch (e) { add('V00', 'package-lock.json parses', false, String(e)); }
try { manifest = readJson(MANIFEST_PATH); } catch (e) { add('V00', 'version manifest parses', false, String(e)); }
const lockPkgs = lock.packages || {};
const directDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

// V01-V04: Node pin and enforcement (AC02, AC03)
const nvmrc = exists('.nvmrc') ? read('.nvmrc').trim().replace(/^v/, '') : '';
add('V01', '.nvmrc pins an exact Node 24 LTS version', EXACT.test(nvmrc) && nvmrc.startsWith('24.'), nvmrc || '.nvmrc missing');
const rt = pkg.devEngines?.runtime || {};
add('V02', 'devEngines.runtime pins the same Node version with onFail=error',
  rt.name === 'node' && rt.version === nvmrc && rt.onFail === 'error', JSON.stringify(rt));
const coreEngines = lockPkgs['node_modules/@angular/core']?.engines?.node || '';
const buildEngines = lockPkgs['node_modules/@angular/build']?.engines?.node || '';
add('V03', 'Pinned Node is inside the Angular engine ranges recorded in the lockfile',
  Boolean(coreEngines && buildEngines) && satisfies(nvmrc, coreEngines) && satisfies(nvmrc, buildEngines),
  `pinned=${nvmrc}; @angular/core engines=${coreEngines}; @angular/build engines=${buildEngines}`);
add('V04', 'Running Node equals the pinned version', process.versions.node === nvmrc, `running=${process.versions.node}; pinned=${nvmrc}`);

// V05: npm pin (AC04)
const pmField = /^npm@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager || '');
const pmDev = pkg.devEngines?.packageManager || {};
const npmVersion = run('npm', ['--version']);
const npmRunning = (npmVersion.out || '').split(/\r?\n/).pop();
add('V05', 'npm pinned exactly in packageManager and devEngines.packageManager (onFail=error), and the running npm matches',
  Boolean(pmField) && pmDev.name === 'npm' && pmDev.version === pmField[1] && pmDev.onFail === 'error' && npmRunning === pmField[1],
  `packageManager=${pkg.packageManager}; devEngines.packageManager=${JSON.stringify(pmDev)}; running npm=${npmRunning}`);

// V06: .npmrc policy and no credentials (AC03, AC14, AC19)
const npmrc = exists('.npmrc') ? read('.npmrc') : '';
const npmrcLines = npmrc.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith(';'));
const npmrcCreds = npmrcLines.filter((l) => /(_auth|_authToken|_password|username|email|certfile|keyfile)\s*=/i.test(l));
add('V06', '.npmrc sets engine-strict and strict-allow-scripts and holds no credentials',
  npmrcLines.includes('engine-strict=true') && npmrcLines.includes('strict-allow-scripts=true') && npmrcCreds.length === 0,
  npmrc ? `settings: ${npmrcLines.join(', ')}; credential-like entries: ${npmrcCreds.length}` : '.npmrc missing');

// V07: exact direct pins, lockfile root, resolved and installed versions agree (AC05-AC07, AC10)
const pinProblems = [];
const rootLock = lockPkgs[''] || {};
const rootLockDeps = { ...(rootLock.dependencies || {}), ...(rootLock.devDependencies || {}) };
for (const [name, spec] of Object.entries(directDeps)) {
  if (!EXACT.test(spec)) pinProblems.push(`${name}: spec "${spec}" is not exact`);
  if (rootLockDeps[name] !== spec) pinProblems.push(`${name}: lockfile root spec ${rootLockDeps[name]} != ${spec}`);
  const resolved = lockPkgs[`node_modules/${name}`]?.version;
  if (resolved !== spec) pinProblems.push(`${name}: lockfile version ${resolved} != ${spec}`);
  const installedPath = path.join(root, 'node_modules', name, 'package.json');
  const installed = fs.existsSync(installedPath) ? JSON.parse(fs.readFileSync(installedPath, 'utf8')).version : 'not installed';
  if (installed !== spec) pinProblems.push(`${name}: installed ${installed} != ${spec}`);
}
if (Object.keys(rootLockDeps).length !== Object.keys(directDeps).length) pinProblems.push('lockfile root and package.json list different dependencies');
add('V07', 'Every direct dependency is exact and matches the lockfile and installed tree', pinProblems.length === 0,
  pinProblems.length ? pinProblems.join('; ') : `${Object.keys(directDeps).length} direct dependencies agree`);

// V08-V10: controlled families (AC05-AC07)
const angular = Object.entries(directDeps).filter(([n]) => n.startsWith('@angular/'));
const angularVersions = [...new Set(angular.map(([, v]) => v))];
add('V08', 'All @angular/* packages share one exact 22.x version (core aligned with CLI)',
  angularVersions.length === 1 && /^22\.\d+\.\d+$/.test(angularVersions[0]) && directDeps['@angular/core'] === directDeps['@angular/cli'],
  `${angular.length} packages at ${angularVersions.join(', ')}`);
const tsPeer = lockPkgs['node_modules/@angular/compiler-cli']?.peerDependencies?.typescript || '';
add('V09', 'TypeScript is an exact 6.0.x inside the @angular/compiler-cli peer range',
  /^6\.0\.\d+$/.test(directDeps.typescript || '') && satisfies(directDeps.typescript, tsPeer), `typescript=${directDeps.typescript}; peer=${tsPeer}`);
const rxPeer = lockPkgs['node_modules/@angular/core']?.peerDependencies?.rxjs || '';
add('V10', 'RxJS is an exact 7.x inside the @angular/core peer range',
  /^7\.\d+\.\d+$/.test(directDeps.rxjs || '') && satisfies(directDeps.rxjs, rxPeer), `rxjs=${directDeps.rxjs}; peer=${rxPeer}`);

// V11: version manifest agrees with the pins, lockfile and installed tree (AC08, AC09)
const manifestProblems = [];
if (!manifest) manifestProblems.push(`${MANIFEST_PATH} missing or invalid`);
else {
  if (manifest.runtime?.node !== nvmrc) manifestProblems.push(`runtime.node ${manifest.runtime?.node} != .nvmrc ${nvmrc}`);
  if (manifest.runtime?.npm !== pmField?.[1]) manifestProblems.push(`runtime.npm ${manifest.runtime?.npm} != packageManager`);
  if (manifest.runtime?.angularNodeEngineRange !== coreEngines) manifestProblems.push('runtime.angularNodeEngineRange differs from lockfile');
  const md = manifest.directDependencies || {};
  for (const n of new Set([...Object.keys(md), ...Object.keys(directDeps)])) {
    if (md[n] !== directDeps[n]) manifestProblems.push(`directDependencies.${n}: manifest ${md[n]} != package.json ${directDeps[n]}`);
  }
  for (const [p, v] of Object.entries(manifest.buildTools || {})) {
    if (lockPkgs[p]?.version !== v) manifestProblems.push(`buildTools ${p}: manifest ${v} != lockfile ${lockPkgs[p]?.version}`);
    const ip = path.join(root, p, 'package.json');
    const iv = fs.existsSync(ip) ? JSON.parse(fs.readFileSync(ip, 'utf8')).version : 'not installed';
    if (iv !== v) manifestProblems.push(`buildTools ${p}: manifest ${v} != installed ${iv}`);
  }
  if (Object.keys(manifest.buildTools || {}).length < 8) manifestProblems.push('fewer than 8 build tools recorded');
  if (!/not used/i.test(manifest.orchestration?.nx || '')) manifestProblems.push('orchestration.nx must record that Nx is not used');
  if (Object.keys(lockPkgs).some((p) => /(^|\/)node_modules\/(nx|@nx\/|@nrwl\/)/.test(p))) manifestProblems.push('Nx found in lockfile');
  if (manifest.lockfile?.lockfileVersion !== lock.lockfileVersion) manifestProblems.push('lockfile.lockfileVersion differs');
  if (manifest.lockfile?.sha256 !== sha256('package-lock.json')) manifestProblems.push('lockfile.sha256 differs from package-lock.json');
}
add('V11', 'Version manifest matches .nvmrc, package.json, package-lock.json and the installed tree', manifestProblems.length === 0,
  manifestProblems.length ? manifestProblems.join('; ') : `${Object.keys(manifest.directDependencies).length} direct + ${Object.keys(manifest.buildTools).length} build-tool versions agree`);

// V12: lockfile integrity (AC10)
const thirdParty = Object.entries(lockPkgs).filter(([p, e]) => p !== '' && p.includes('node_modules/') && !e.link);
const badSource = thirdParty.filter(([, e]) => !/^https:\/\/registry\.npmjs\.org\//.test(e.resolved || '') || !/^sha512-/.test(e.integrity || ''));
add('V12', 'Lockfile v3; every third-party entry resolves from registry.npmjs.org with sha512 integrity',
  lock.lockfileVersion === 3 && thirdParty.length > 0 && badSource.length === 0,
  `lockfileVersion=${lock.lockfileVersion}; third-party entries=${thirdParty.length}; bad=${badSource.map(([p]) => p).join(', ') || 'none'}`);

// V13: lockfile and package.json in sync with the commit, and lockfile unchanged since the baseline (AC10)
const wtDiff = git('diff', '--quiet', 'HEAD', '--', 'package.json', 'package-lock.json');
const baseDiff = git('diff', '--quiet', BASELINE_COMMIT, '--', 'package-lock.json');
add('V13', 'package.json/package-lock.json match HEAD and package-lock.json is byte-identical to the IB0-WP01 baseline',
  wtDiff.status === 0 && baseDiff.status === 0,
  `working tree vs HEAD: ${wtDiff.status === 0 ? 'clean' : `uncommitted changes${wtDiff.error ? ` (${wtDiff.error})` : ''}`}; lockfile vs ${BASELINE_COMMIT.slice(0, 7)}: ${baseDiff.status === 0 ? 'identical' : `different${baseDiff.error ? ` (${baseDiff.error})` : ''}`}`);

// V14: install-script policy covers every lockfile package with an install script (AC14)
const allow = pkg.allowScripts || {};
const scripted = [...new Set(Object.entries(lockPkgs).filter(([, e]) => e.hasInstallScript).map(([p]) => nameFromPath(p)))].sort();
const uncovered = scripted.filter((n) => allow[n] !== false);
const policyLs = run('npm', ['install-scripts', 'ls']);
add('V14', 'Every lockfile package with an install script is explicitly denied, and npm reports none unreviewed',
  scripted.length > 0 && uncovered.length === 0 && policyLs.status === 0 && /No packages with unreviewed install scripts/i.test(policyLs.out),
  `packages with install scripts: ${scripted.join(', ')}; not explicitly denied: ${uncovered.join(', ') || 'none'}; npm install-scripts ls: ${policyLs.out.split(/\r?\n/).pop()}`);

// V15: licence inventory (AC15, AC16); writes the inventory reports
const entries = thirdParty.map(([p, e]) => ({
  path: p, name: nameFromPath(p), version: e.version, license: e.license || null,
  scope: e.dev ? 'dev' : e.devOptional ? 'devOptional' : 'runtime', optional: Boolean(e.optional || e.devOptional)
}));
const licenceProblems = [];
const counts = {};
for (const e of entries) {
  counts[e.license] = (counts[e.license] || 0) + 1;
  if (!e.license) { licenceProblems.push(`${e.path}: no licence`); continue; }
  if (PERMISSIVE_LICENCES.has(e.license)) continue;
  const rev = REVIEWED_LICENCES[e.license];
  if (!rev) licenceProblems.push(`${e.path}: ${e.license} not reviewed`);
  else if (!rev.names.test(e.name)) licenceProblems.push(`${e.path}: ${e.license} allowed only for review ${rev.review} packages`);
  else if (e.scope !== 'dev') licenceProblems.push(`${e.path}: ${e.license} reviewed for build-time use only, but scope is ${e.scope}`);
}
const workspaces = Object.entries(lockPkgs).filter(([p, e]) => p !== '' && (e.link || !p.includes('node_modules/'))).map(([p]) => p);
const inventory = {
  workPackage: 'IB0-WP02',
  generatedAt: new Date().toISOString(),
  lockfileSha256: sha256('package-lock.json'),
  summary: {
    thirdPartyEntries: entries.length,
    runtimeScope: entries.filter((e) => e.scope === 'runtime').length,
    devScope: entries.filter((e) => e.scope !== 'runtime').length,
    workspaceEntries: workspaces.length,
    byLicence: Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]))
  },
  permissiveLicences: [...PERMISSIVE_LICENCES],
  reviewedLicences: Object.fromEntries(Object.entries(REVIEWED_LICENCES).map(([k, v]) => [k, { review: v.review, packages: entries.filter((e) => e.license === k).map((e) => `${e.name}@${e.version}`) }])),
  runtimePackages: entries.filter((e) => e.scope === 'runtime').map((e) => `${e.name}@${e.version} (${e.license})`),
  problems: licenceProblems,
  entries
};
fs.writeFileSync(path.join(evidenceDir, 'licence-inventory.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');
const mdLines = [
  '# IB0-WP02 Licence Inventory',
  '',
  `Generated by \`tooling/verification/verify-ib0-wp02.mjs\` from \`package-lock.json\` (sha256 \`${inventory.lockfileSha256}\`). Machine-readable form: \`licence-inventory.json\`. Review and dispositions: \`docs/licences/THIRD-PARTY-LICENCE-REVIEW.md\`.`,
  '',
  `Third-party lockfile entries: ${entries.length} (runtime scope ${inventory.summary.runtimeScope}, dev scope ${inventory.summary.devScope}). Private \`@proseit/*\` workspace entries excluded: ${workspaces.length}. Entries include optional platform binaries for every OS, not only those installed on one machine.`,
  '',
  '| Licence | Entries | Status |',
  '| --- | --- | --- |',
  ...Object.entries(inventory.summary.byLicence).map(([l, n]) => `| ${l} | ${n} | ${PERMISSIVE_LICENCES.has(l) ? 'Permissive' : REVIEWED_LICENCES[l] ? `Reviewed (${REVIEWED_LICENCES[l].review}), build-time only` : 'NOT REVIEWED'} |`),
  '',
  '## Runtime-scope packages',
  '',
  ...inventory.runtimePackages.map((p) => `- ${p}`),
  '',
  '## Reviewed licences',
  '',
  ...Object.entries(inventory.reviewedLicences).map(([l, v]) => `- ${l} (${v.review}): ${v.packages.join(', ')}`),
  '',
  `Problems: ${licenceProblems.length ? licenceProblems.join('; ') : 'none'}`,
  ''
];
fs.writeFileSync(path.join(evidenceDir, 'licence-inventory.md'), mdLines.join('\n'), 'utf8');
add('V15', 'Every third-party licence is permissive or covered by a recorded build-time review', entries.length > 0 && licenceProblems.length === 0,
  licenceProblems.length ? licenceProblems.join('; ') : `${entries.length} entries: ${Object.entries(counts).map(([l, n]) => `${l} ${n}`).join(', ')}`);

// V16: controlled-source integrity (AC20)
const integrityProblems = [];
try {
  const pack = readJson('PACK_MANIFEST.json');
  const controlled = pack.files.filter((f) => f.path === '.gitignore' || f.path.startsWith('.paep-control/'));
  for (const f of controlled) {
    if (!exists(f.path)) { integrityProblems.push(`missing ${f.path}`); continue; }
    const st = fs.statSync(path.join(root, f.path));
    if (sha256(f.path) !== f.sha256 || st.size !== f.bytes) integrityProblems.push(`mismatch ${f.path}`);
  }
  const listed = new Set(controlled.map((f) => f.path));
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk('.paep-control')) if (!listed.has(f)) integrityProblems.push(`unlisted ${f}`);
  const d = git('diff', '--quiet', CONTROL_COMMIT, '--', '.paep-control', '.gitignore', 'PACK_MANIFEST.json');
  if (d.status !== 0) integrityProblems.push(`git diff ${CONTROL_COMMIT} not empty (${d.out || d.error})`);
  add('V16', 'Controlled sources (.paep-control/**, .gitignore) match PACK_MANIFEST.json and are unchanged since restore',
    integrityProblems.length === 0, integrityProblems.length ? integrityProblems.join('; ') : `${controlled.length}/${controlled.length} files match sha256 and size`);
} catch (e) {
  add('V16', 'Controlled sources match PACK_MANIFEST.json', false, String(e));
}

// V17: scope (AC18, AC21)
const scopeProblems = [];
const names = Object.keys(directDeps).sort();
if (JSON.stringify(names) !== JSON.stringify(BASELINE_DEPENDENCY_NAMES)) scopeProblems.push(`dependency names changed: ${names.join(', ')}`);
for (const f of ['nx.json', 'project.json', 'tsconfig.base.json', '.github/workflows', 'eslint.config.js', 'eslint.config.mjs', '.eslintrc.json', '.prettierrc', 'vitest.config.ts', 'vitest.config.mts']) {
  if (exists(f)) scopeProblems.push(`out-of-scope file present: ${f}`);
}
const protectedPaths = ['apps', 'packages', 'angular.json', 'tsconfig.json', 'PACK_MANIFEST.json',
  'tooling/verification/verify-ib0-wp01.mjs', 'tooling/verification/validate-pack.mjs',
  'work-packages/IB0-WP01', 'evidence/IB0-WP01'];
const prot = git('diff', '--name-only', BASELINE_COMMIT, '--', ...protectedPaths);
if (prot.status !== 0) scopeProblems.push(`git diff failed: ${prot.out || prot.error}`);
else if (prot.out) scopeProblems.push(`protected paths changed: ${prot.out.split(/\r?\n/).join(', ')}`);
const untrackedProt = git('ls-files', '--others', '--exclude-standard', '--', ...protectedPaths);
if (untrackedProt.out) scopeProblems.push(`untracked files in protected paths: ${untrackedProt.out.split(/\r?\n/).join(', ')}`);
add('V17', 'No dependency-set change, no IB0-WP03/04/05 artefacts, and apps/packages/workspace config and IB0-WP01 records unchanged',
  scopeProblems.length === 0, scopeProblems.length ? scopeProblems.join('; ') : 'none');

// V18: secrets in files changed since the baseline (AC19)
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bnpm_[A-Za-z0-9]{36}\b/,
  /(?:^|\s)(?:\/\/[^\s]*:)?_(?:auth|authToken|password)\s*=\s*\S/m,
  /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/i
];
const changed = git('diff', '--name-only', '--diff-filter=AM', BASELINE_COMMIT);
const untracked = git('ls-files', '--others', '--exclude-standard');
const scanFiles = [...new Set(`${changed.out}\n${untracked.out}`.split(/\r?\n/).filter(Boolean))];
const secretFindings = [];
for (const f of scanFiles) {
  if (!exists(f) || fs.statSync(path.join(root, f)).size > 2_000_000) continue;
  const text = read(f);
  if (secretPatterns.some((re) => re.test(text))) secretFindings.push(f);
}
add('V18', 'No credential or secret signatures in files added or modified since the baseline',
  changed.status === 0 && secretFindings.length === 0,
  changed.status !== 0 ? `git diff failed: ${changed.out || changed.error}` : `${scanFiles.length} files scanned; findings: ${secretFindings.join(', ') || 'none'}`);

// V19-V20: production builds on the pinned toolchain (AC12, AC13)
function runBuild(id, scriptName, label) {
  if (typeof pkg.scripts?.[scriptName] !== 'string') { add(id, label, false, `${scriptName} missing`); return; }
  const r = run('npm', ['run', scriptName]);
  add(id, label, r.status === 0, `exit=${r.status}\n${r.out.split(/\r?\n/).slice(-12).join('\n')}`);
}
runBuild('V19', 'build:reference-app', 'reference-app production build passes');
runBuild('V20', 'build:ui-lab', 'ui-lab production build passes');

const head = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--untracked-files=no');
const passed = results.every((r) => r.pass);
const report = {
  workPackage: 'IB0-WP02',
  generatedAt: new Date().toISOString(),
  commit: head.status === 0 ? head.out : null,
  trackedChangesAtRun: dirty.out ? dirty.out.split(/\r?\n/) : [],
  node: process.versions.node,
  npm: npmRunning,
  platform: `${process.platform}-${process.arch}`,
  result: passed ? 'PASS' : 'FAIL',
  checks: results
};
fs.writeFileSync(path.join(evidenceDir, 'ib0-wp02-verification.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.details ? ` — ${r.details.split('\n')[0]}` : ''}`);
}
console.log(`\nIB0-WP02 verification: ${report.result} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
