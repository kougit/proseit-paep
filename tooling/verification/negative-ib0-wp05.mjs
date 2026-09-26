#!/usr/bin/env node
/**
 * PAEP IB0-WP05 negative tests for the CI controls themselves.
 *
 * Proves, without touching the working tree, that every mandatory CI control
 * rejects what it exists to reject, and that the aggregate gate cannot pass
 * when any mandatory job fails, is cancelled, skipped, missing or timed out.
 *
 * - G cases execute the aggregate-gate script taken verbatim from
 *   .github/workflows/paep-ci.yml (job "gate") with bash and a synthetic
 *   `needs` context, exactly as GitHub Actions passes it (NEEDS_JSON env).
 * - Other cases mutate a disposable scratch copy of the repository (with .git,
 *   and node_modules linked read-only from the repository) and run the command
 *   the CI job runs, expecting a non-zero exit for the stated reason.
 * - npm cases run `npm ci --dry-run` in a separate scratch folder that holds
 *   only the manifests, so no install can reach the linked node_modules.
 *
 * PAEP_EVIDENCE_DIR is removed from the environment of every scratch run.
 * Writes negative-ci-tests.log and negative-ci-tests.json to PAEP_EVIDENCE_DIR
 * (CI) or, locally, to the git-ignored tmp/paep-evidence/ib0-wp05-negative/
 * (IB1-PREFLIGHT-R7: evidence/IB0-WP05 is an accepted, immutable record).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { parseYaml } from './yaml-subset.mjs';

const root = process.cwd();
const evidenceOut = process.env.PAEP_EVIDENCE_DIR || '';
const logsDir = path.join(root, 'tmp', 'paep-evidence', 'ib0-wp05-negative');
const reportsDir = logsDir;
const WORKFLOW = '.github/workflows/paep-ci.yml';
const SETUP = '.github/actions/paep-setup/action.yml';
const POLICY = 'tooling/verification/ib0-wp05-ci-policy.json';

const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
delete env.PAEP_EVIDENCE_DIR;
delete env.GITHUB_STEP_SUMMARY;

const policy = JSON.parse(fs.readFileSync(path.join(root, POLICY), 'utf8'));
const wf = parseYaml(fs.readFileSync(path.join(root, WORKFLOW), 'utf8'));
const setupYaml = parseYaml(fs.readFileSync(path.join(root, SETUP), 'utf8'));
const gateStep = wf.jobs.gate.steps[0];
const MANDATORY = String(gateStep.env.MANDATORY_JOBS).split(/\s+/).filter(Boolean);
const treeCheckScript = setupYaml.runs.steps.find((s) => (s.run || '').includes('git diff --exit-code')).run;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-wp05-negative-'));
const copy = path.join(scratch, 'repo');
const npmDir = path.join(scratch, 'npm');
const SKIP = new Set(['node_modules', 'dist', '.angular']);
fs.cpSync(root, copy, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== root });
// node_modules is hard-linked (cp -al) so npm sees a real installed tree (a symlinked tree makes
// `npm install-scripts ls` report every script as unreviewed); no case writes into it. Fallback: symlink.
const linked = spawnSync('cp', ['-al', path.join(root, 'node_modules'), path.join(copy, 'node_modules')], { encoding: 'utf8' });
const nodeModulesMode = linked.status === 0 ? 'hard-linked' : 'symlinked';
if (linked.status !== 0) fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
fs.appendFileSync(path.join(copy, '.git', 'info', 'exclude'), '\n/node_modules\n');
// Commit the working tree inside the copy so HEAD-based checks (WP02 V13) see a clean tree, as in CI.
const gitc = (...a) => spawnSync('git', a, { cwd: copy, encoding: 'utf8', env });
gitc('add', '-A');
gitc('-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit', '-q', '--no-verify', '-m', 'scratch snapshot', '--allow-empty');

// The setup action writes to $RUNNER_TEMP/paep-evidence; the tree-check cases use the scratch folder as RUNNER_TEMP.
fs.mkdirSync(path.join(scratch, 'paep-evidence'), { recursive: true });

const results = [];
const log = [];
const header = `# date: ${new Date().toISOString()} node: ${process.version} scratch: ${scratch}\n# node_modules: ${nodeModulesMode}\n# gate script: ${WORKFLOW} jobs.gate.steps[0].run; mandatory jobs: ${MANDATORY.join(' ')}`;

function exec(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: copy, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024, ...opts });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}
const node = (args, opts) => exec(process.execPath, args, opts);
const verifyGate = (gate, opts) => node(['tooling/verification/verify-ib0-wp05.mjs', '--gate', gate], opts);
const failedW = (out) => [...out.matchAll(/^FAIL (W\d+)/gm)].map((m) => m[1]);

function mutate(edits) {
  const saved = new Map();
  for (const [file, fn] of edits) {
    const p = path.join(copy, file);
    if (!saved.has(p)) saved.set(p, fs.existsSync(p) ? fs.readFileSync(p) : null);
    const next = fn(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (next === null) fs.rmSync(p, { force: true }); else fs.writeFileSync(p, next);
  }
  return () => { for (const [p, c] of saved) { if (c === null) fs.rmSync(p, { force: true }); else fs.writeFileSync(p, c); } };
}
const jsonEdit = (fn) => (t) => { const o = JSON.parse(t); fn(o); return JSON.stringify(o, null, 2) + '\n'; };
const replace = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor not found: ${from.slice(0, 60)}`); return t.replace(from, to); };
const append = (line) => (t) => `${t}${line}\n`;

function record(id, name, control, expected, r, pass, detail) {
  results.push({ id, name, control, expected, exit: r.status, pass });
  log.push(`## ${id} ${name}\nexpected: ${expected}\n${detail}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

// A case passes when the command exits 0 (control) or exits non-zero and the output matches every `expect` pattern.
function caseRun(id, name, edits, runFn, expect = null) {
  let restore = () => {};
  let r;
  try { restore = mutate(edits); r = runFn(); } catch (e) { r = { status: null, out: `harness error: ${e.stack || e}` }; } finally { restore(); }
  const control = !expect;
  const pass = control ? r.status === 0 : r.status !== 0 && r.status !== null && expect.every((re) => re.test(r.out));
  const expected = control ? 'exit 0' : `non-zero exit; output matches ${expect.map(String).join(' and ')}`;
  const detail = r.out.split(/\r?\n/).filter((l) => /^(PASS|FAIL) W|verification|error|ERROR|TS\d{4}|npm error|PAEP gate|::error|violation|EXIT|^diff --git|^[0-9a-f]{64} /i.test(l)).slice(0, 25).join('\n');
  record(id, name, control, expected, r, pass, detail);
}

// ---- G: aggregate gate semantics (the gate script from the workflow) ----------------------------
function gateRun(needs) {
  const r = spawnSync('bash', ['-c', gateStep.run], {
    encoding: 'utf8', cwd: scratch,
    env: { ...env, NEEDS_JSON: typeof needs === 'string' ? needs : JSON.stringify(needs), MANDATORY_JOBS: gateStep.env.MANDATORY_JOBS }
  });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}
const needsWith = (overrides = {}, drop = [], extra = {}) => {
  const n = {};
  for (const j of MANDATORY) if (!drop.includes(j)) n[j] = { result: overrides[j] || 'success', outputs: {} };
  return { ...n, ...extra };
};
function gateCase(id, name, needs, expectPass) {
  const r = gateRun(needs);
  const pass = expectPass ? r.status === 0 && /PAEP gate: PASS/.test(r.out) : r.status !== 0 && !/PAEP gate: PASS/.test(r.out);
  record(id, name, expectPass, expectPass ? 'exit 0, PAEP gate: PASS' : 'non-zero exit, no PASS', r, pass, r.out.trim().split('\n').slice(-12).join('\n'));
}

try {
  if (!gateStep.run || !MANDATORY.length) throw new Error('gate script not found in the workflow');
  if (JSON.stringify([...MANDATORY].sort()) !== JSON.stringify(policy.mandatoryJobs.map((j) => j.id).sort())) throw new Error('gate MANDATORY_JOBS differ from the policy');

  // Runs first, before any gate writes evidence into the copy.
  caseRun('C06', 'control: tracked-tree check passes after an unchanged install', [], () => exec('bash', ['-c', treeCheckScript], { env: { ...env, RUNNER_TEMP: scratch } }));
  gateCase('G00', 'control: every mandatory job succeeded', needsWith(), true);
  // One failure case per mandatory job; ids beyond G09 use GJ so they never collide with the fixed G10-G18 cases (IB1 added jobs).
  MANDATORY.forEach((j, k) => gateCase(k < 9 ? `G0${k + 1}` : `GJ${k + 1}`, `mandatory job ${j} failed`, needsWith({ [j]: 'failure' }), false));
  gateCase('G10', 'mandatory job cancelled (negative-ci)', needsWith({ 'negative-ci': 'cancelled' }), false);
  gateCase('G11', 'mandatory job skipped (architecture)', needsWith({ architecture: 'skipped' }), false);
  gateCase('G12', 'mandatory job timed out (regression; GitHub reports timeouts as failure)', needsWith({ regression: 'failure' }), false);
  gateCase('G13', 'mandatory job missing from needs (strictness)', needsWith({}, ['strictness']), false);
  gateCase('G14', 'unexpected extra job in needs', needsWith({}, [], { extra: { result: 'success', outputs: {} } }), false);
  gateCase('G15', 'every mandatory job skipped', Object.fromEntries(MANDATORY.map((j) => [j, { result: 'skipped', outputs: {} }])), false);
  gateCase('G16', 'empty needs context', {}, false);
  gateCase('G17', 'malformed needs context', '{not json', false);
  gateCase('G18', 'unknown result value (neutral)', needsWith({ provenance: 'neutral' }), false);

  // ---- Controls: the unmutated scratch copy passes each CI command --------------------------------
  const archCheck = () => node(['tooling/architecture-boundaries/check-boundaries.mjs']);
  const ngc = path.join(copy, 'node_modules', '.bin', 'ngc');
  const qaTypes = () => {
    const a = exec(ngc, ['-p', 'apps/reference-app/tsconfig.app.json', '--noEmit']);
    if (a.status !== 0) return a;
    const b = exec(ngc, ['-p', 'apps/ui-lab/tsconfig.app.json', '--noEmit']);
    return { status: b.status, out: a.out + b.out };
  };
  const ngBuild = () => node([path.join(copy, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'), 'build', 'reference-app', '--configuration', 'production']);
  caseRun('C01', 'control: governance gate passes unmutated', [], () => verifyGate('governance'));
  caseRun('C02', 'control: provenance gate passes unmutated', [], () => verifyGate('provenance'));
  caseRun('C03', 'control: qa:types passes unmutated', [], qaTypes);
  caseRun('C04', 'control: qa:architecture passes unmutated', [], archCheck);
  caseRun('C05', 'control: toolchain gate passes unmutated', [], () => verifyGate('toolchain'));
  // Controls for the gates the S and H cases mutate, so those cases cannot pass on a gate that already fails (QA lane 1).
  caseRun('C07', 'control: strictness gate passes unmutated', [], () => verifyGate('strictness'));
  caseRun('C08', 'control: negative-architecture gate passes unmutated', [], () => verifyGate('negative-architecture'));

  // ---- (i)/(xii) architecture -----------------------------------------------------------------------
  const entry = (d) => `packages/${d}/src/index.ts`;
  caseRun('A01', '(i) forbidden upward dependency contracts -> foundation fails qa:architecture', [[entry('contracts'), append("import '@proseit/paep-foundation';")]], archCheck, [/DIRECTION/]);
  caseRun('A02', '(xii) prohibited change: domain-quality -> domain-fiscal (same category, not allowlisted) fails qa:architecture', [[entry('domain-quality'), append("import '@proseit/paep-domain-fiscal';")]], archCheck, [/violation/i]);
  caseRun('A03', '(xii) prohibited change: deep import into another package fails qa:architecture', [[entry('components'), append("import '@proseit/paep-foundation/src/index';")]], archCheck, [/DEEP|UNKNOWN|violation/i]);
  caseRun('A04', '(xii) prohibited change: nested package.json boundary fails the governance gate', [['packages/components/src/nested/package.json', () => '{"name":"nested"}\n']], () => verifyGate('governance'), [/FAIL W03/]);

  // ---- (ii) strictness --------------------------------------------------------------------------------
  const APP_TS = 'apps/reference-app/src/app/app.ts';
  const APP_HTML = 'apps/reference-app/src/app/app.html';
  const TS_VIOLATION = (t) => `${t}\nexport function wp05NegativeTs(value) { const s: string = null; return s + value; }\n`;
  const TEMPLATE_METHOD = (t) => t.replace(/\n}\s*$/, '\n  protected wp05Take(value: number): number { return value; }\n}\n');
  const TEMPLATE_VIOLATION = replace('</main>', '  <button type="button" (click)="wp05Take($event)">x</button>\n</main>');
  caseRun('S01', '(ii) TypeScript strict violation (implicit any, null to string) fails qa:types', [[APP_TS, TS_VIOLATION]], qaTypes, [/TS7006/, /TS2322/]);
  caseRun('S02', '(ii) Angular template strict violation ($event as number) fails qa:types', [[APP_TS, TEMPLATE_METHOD], [APP_HTML, TEMPLATE_VIOLATION]], qaTypes, [/TS2345/]);
  caseRun('S03', '(ii) strictTemplates false fails the strictness gate', [['tsconfig.json', replace('"strictTemplates": true', '"strictTemplates": false')]], () => verifyGate('strictness'), [/FAIL W17/, /V05/]);
  caseRun('S04', '(ii) noCheck true fails the strictness gate', [['tsconfig.json', replace('"strict": true,', '"strict": true,\n    "noCheck": true,')]], () => verifyGate('strictness'), [/FAIL W17/, /noCheck/]);

  // ---- (iii) build --------------------------------------------------------------------------------------
  caseRun('B01', '(iii) type error fails the reference-app production build', [[APP_TS, TS_VIOLATION]], ngBuild, [/TS7006|TS2322/]);

  // ---- (iv) negative harness --------------------------------------------------------------------------
  caseRun('H01', '(iv) crashed WP04 negative harness fails the negative-architecture gate', [['tooling/verification/negative-ib0-wp04.mjs', (t) => t.replace('#!/usr/bin/env node\n', "#!/usr/bin/env node\nthrow new Error('WP05 negative test: harness crash');\n")]], () => verifyGate('negative-architecture'), [/FAIL W18/]);
  caseRun('H02', '(iv) checker that stops reporting cycles makes WP04 negative cases fail, failing the negative-architecture gate', [['tooling/architecture-boundaries/check-boundaries.mjs', replace("for (const c of cycles) flag('CYCLE'", "for (const c of []) flag('CYCLE'")]], () => verifyGate('negative-architecture'), [/FAIL W18/, /failed/]);

  // ---- (v) lockfile ----------------------------------------------------------------------------------
  fs.mkdirSync(npmDir, { recursive: true });
  for (const f of ['package.json', 'package-lock.json', '.npmrc']) fs.copyFileSync(path.join(root, f), path.join(npmDir, f));
  for (const d of fs.readdirSync(path.join(root, 'packages'))) {
    fs.mkdirSync(path.join(npmDir, 'packages', d), { recursive: true });
    fs.copyFileSync(path.join(root, 'packages', d, 'package.json'), path.join(npmDir, 'packages', d, 'package.json'));
  }
  const npmCase = (id, name, fn, expect) => {
    const p = path.join(npmDir, 'package.json');
    const saved = fs.readFileSync(p);
    if (fn) fs.writeFileSync(p, jsonEdit(fn)(saved.toString()));
    const r = spawnSync('npm', ['ci', '--dry-run', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: npmDir, encoding: 'utf8', env });
    fs.writeFileSync(p, saved);
    const res = { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
    const control = !expect;
    const pass = control ? res.status === 0 : res.status !== 0 && expect.every((re) => re.test(res.out));
    record(id, name, control, control ? 'exit 0' : `non-zero exit; ${expect.map(String).join(' and ')}`, res, pass, res.out.split('\n').filter((l) => /npm error|added|up to date/.test(l)).slice(0, 8).join('\n'));
  };
  npmCase('L00', 'control: npm ci --dry-run accepts the committed manifests', null, null);
  npmCase('L01', '(v) package.json dependency changed without a lockfile update fails npm ci', (o) => { o.dependencies.rxjs = '7.8.1'; }, [/npm error/]);
  caseRun('L02', '(v) lockfile modified by installation fails the tracked-tree check', [['package-lock.json', (t) => t.replace('"lockfileVersion": 3', '"lockfileVersion": 3 ')]], () => exec('bash', ['-c', treeCheckScript], { env: { ...env, RUNNER_TEMP: scratch } }), [/package-lock\.json/]);
  caseRun('L03', '(v) lockfile drift from the accepted baseline fails the governance gate', [['package-lock.json', (t) => t.replace('"lockfileVersion": 3', '"lockfileVersion": 3 ')]], () => verifyGate('governance'), [/FAIL W06/]);

  // ---- (vi)/(vii) toolchain ---------------------------------------------------------------------------
  const npmShim = path.join(scratch, 'shim');
  fs.mkdirSync(npmShim, { recursive: true });
  fs.writeFileSync(path.join(npmShim, 'npm'), '#!/bin/sh\necho 11.18.0\n', { mode: 0o755 });
  caseRun('T01', '(vi) .nvmrc pin drift fails the toolchain gate', [['.nvmrc', () => '24.20.0\n']], () => verifyGate('toolchain'), [/FAIL W01/, /\.nvmrc|devEngines|manifest/]);
  caseRun('T02', '(vi) running Node differs from a consistent pin (all pins 24.20.0) fails the toolchain gate',
    [['.nvmrc', () => '24.20.0\n'], ['package.json', jsonEdit((o) => { o.devEngines.runtime.version = '24.20.0'; })], ['docs/architecture/toolchain-version-manifest.json', jsonEdit((o) => { o.runtime.node = '24.20.0'; })]],
    () => verifyGate('toolchain'), [/FAIL W01/, /running Node 24\.21\.0 != pinned 24\.20\.0/]);
  caseRun('T03', '(vii) running npm differs from the pin fails the toolchain gate', [], () => verifyGate('toolchain', { env: { ...env, PATH: `${npmShim}${path.delimiter}${env.PATH}` } }), [/FAIL W01/, /running npm 11\.18\.0 != pinned 11\.19\.0/]);
  caseRun('T04', '(vii) packageManager pin drift fails the toolchain gate', [['package.json', jsonEdit((o) => { o.packageManager = 'npm@11.18.0'; })]], () => verifyGate('toolchain'), [/FAIL W01/]);
  npmCase('T05', '(vi) devEngines Node pin not met fails npm ci (EBADDEVENGINES)', (o) => { o.devEngines.runtime.version = '24.20.0'; }, [/EBADDEVENGINES/]);
  npmCase('T06', '(vii) devEngines npm pin not met fails npm ci (EBADDEVENGINES)', (o) => { o.devEngines.packageManager.version = '11.18.0'; }, [/EBADDEVENGINES/]);

  // ---- (viii) install scripts ---------------------------------------------------------------------------
  caseRun('I01', '(viii) new lockfile package with an unreviewed install script fails the provenance gate', [['package-lock.json', jsonEdit((o) => { o.packages['node_modules/rxjs'].hasInstallScript = true; })]], () => verifyGate('provenance'), [/FAIL W16/, /V14 failed: .*not explicitly denied: rxjs/]);
  caseRun('I02', '(viii) install script allowed (esbuild: true) fails the provenance gate', [['package.json', jsonEdit((o) => { o.allowScripts.esbuild = true; })]], () => verifyGate('provenance'), [/FAIL W16/, /V14 failed: .*not explicitly denied: esbuild/]);
  caseRun('I03', '(viii) strict-allow-scripts removed from .npmrc fails the toolchain gate', [['.npmrc', (t) => t.replace('strict-allow-scripts=true', '')]], () => verifyGate('toolchain'), [/FAIL W01/, /strict-allow-scripts/]);
  caseRun('I04', '(viii) npm install with scripts enabled in a workflow step fails the provenance gate', [[WORKFLOW, replace('npm run qa:architecture 2>&1', 'npm install --ignore-scripts=false && npm run qa:architecture 2>&1')]], () => verifyGate('provenance'), [/FAIL W15/, /installs outside npm ci/]);

  // ---- (ix) controlled-file fingerprints ------------------------------------------------------------
  caseRun('F01', '(ix) one byte changed in a controlled source fails the governance gate', [['.paep-control/text/PAEP_IR_01_v1.0_text.md', (t) => `${t} `]], () => verifyGate('governance'), [/FAIL W02/, /fingerprint mismatch/]);
  caseRun('F02', '(ix) CLAUDE.md changed fails the governance gate', [['CLAUDE.md', append('- extra rule')]], () => verifyGate('governance'), [/FAIL W02/]);
  caseRun('F03', '(ix) unlisted file under .paep-control fails the governance gate', [['.paep-control/text/extra.md', () => 'x\n']], () => verifyGate('governance'), [/FAIL W02/, /unlisted/]);
  // Independent QA lane 3 (MEDIUM-1): a committed move of an accepted WP04 record into the WP05 folder must not hide as a rename.
  {
    const from = 'work-packages/IB0-WP04/ACCEPTANCE_REPORT.md';
    caseRun('F04', '(ix) accepted WP04 record moved into work-packages/IB0-WP05 (committed rename) fails the governance gate',
      [[`work-packages/IB0-WP05/OLD_WP04_REPORT.md`, () => fs.readFileSync(path.join(copy, from), 'utf8')], [from, () => null]],
      () => {
        gitc('add', '-A');
        gitc('-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit', '-q', '--no-verify', '-m', 'move');
        try { return verifyGate('governance'); } finally { gitc('reset', '-q', '--hard', 'HEAD~1'); }
      }, [/FAIL W07/, /IB0-WP04\/ACCEPTANCE_REPORT\.md/]);
  }

  // ---- (x) skipped/cancelled: see G10-G18; plus the gate must keep always() and full needs ------------
  caseRun('X01', '(x) gate condition changed from always() to success() fails the provenance gate', [[WORKFLOW, replace("  gate:\n    name: PAEP / gate\n    if: ${{ always() }}", "  gate:\n    name: PAEP / gate\n    if: ${{ success() }}")]], () => verifyGate('provenance'), [/FAIL W12/]);
  caseRun('X02', '(x) mandatory job dropped from gate needs fails the provenance gate', [[WORKFLOW, replace('      - build-ui-lab\n    runs-on', '    runs-on')]], () => verifyGate('provenance'), [/FAIL W12/]);
  caseRun('X03', '(x) continue-on-error on a mandatory job fails the provenance gate', [[WORKFLOW, replace('    name: PAEP / architecture\n', '    name: PAEP / architecture\n    continue-on-error: true\n')]], () => verifyGate('provenance'), [/FAIL W11/]);
  caseRun('X04', '(x) mandatory job made conditional (if) fails the provenance gate', [[WORKFLOW, replace('    name: PAEP / regression\n', "    name: PAEP / regression\n    if: ${{ github.event_name == 'push' }}\n")]], () => verifyGate('provenance'), [/FAIL W11/]);

  // ---- (xi) unapproved dependency / action provenance / permissions / triggers -------------------------------
  caseRun('P01', '(xi) unapproved third-party action fails the provenance gate', [[WORKFLOW, replace('      - name: PAEP setup\n        uses: ./.github/actions/paep-setup\n', '      - name: PAEP setup\n        uses: ./.github/actions/paep-setup\n\n      - name: extra\n        uses: some-owner/some-action@0123456789abcdef0123456789abcdef01234567 # v1.0.0\n')]], () => verifyGate('provenance'), [/FAIL W14/, /unapproved action/]);
  caseRun('P02', '(xi) action referenced by a floating tag fails the provenance gate', [[WORKFLOW, (t) => t.replace('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1', 'actions/checkout@v7')]], () => verifyGate('provenance'), [/FAIL W14/, /not pinned/]);
  caseRun('P03', '(xi) approved action at a different SHA fails the provenance gate', [[SETUP, replace('820762786026740c76f36085b0efc47a31fe5020', '53b83947a5a98c8d113130e565377fae1a50d02f')]], () => verifyGate('provenance'), [/FAIL W14/]);
  caseRun('P04', '(xi) contents: write fails the provenance gate', [[WORKFLOW, replace('permissions:\n  contents: read\n', 'permissions:\n  contents: write\n')]], () => verifyGate('provenance'), [/FAIL W10/]);
  caseRun('P05', '(xi) job-level permission escalation fails the provenance gate', [[WORKFLOW, replace('    name: PAEP / governance\n', '    name: PAEP / governance\n    permissions:\n      pull-requests: write\n')]], () => verifyGate('provenance'), [/FAIL W10/]);
  caseRun('P06', '(xi) pull_request_target trigger fails the provenance gate', [[WORKFLOW, replace('  workflow_dispatch:\n', '  workflow_dispatch:\n  pull_request_target:\n    branches:\n      - main\n')]], () => verifyGate('provenance'), [/FAIL W09/]);
  caseRun('P07', '(xi) untrusted PR title interpolated into a run script fails the provenance gate', [[WORKFLOW, replace('          npm run qa:architecture 2>&1', '          echo "${{ github.event.pull_request.title }}"\n          npm run qa:architecture 2>&1')]], () => verifyGate('provenance'), [/FAIL W13/]);
  caseRun('P08', '(xi) secrets reference fails the provenance gate', [[WORKFLOW, replace('      - name: Evaluate every mandatory job result\n        env:\n', '      - name: Evaluate every mandatory job result\n        env:\n          TOKEN: ${{ secrets.NPM_TOKEN }}\n')]], () => verifyGate('provenance'), [/FAIL W13/, /secrets/]);
  caseRun('P09', '(xi) checkout persisting credentials fails the provenance gate', [[WORKFLOW, replace('persist-credentials: false', 'persist-credentials: true')]], () => verifyGate('provenance'), [/FAIL W13/, /persists credentials/]);
  caseRun('P10', '(xi) node_modules cached with actions/cache fails the provenance gate', [[SETUP, replace('    - name: Prepare evidence directory\n', '    - name: cache\n      uses: actions/cache@0123456789abcdef0123456789abcdef01234567 # v5.0.0\n      with:\n        path: node_modules\n        key: x\n\n    - name: Prepare evidence directory\n')]], () => verifyGate('provenance'), [/FAIL W15/, /actions\/cache/]);
  caseRun('P11', '(xi) new unapproved dependency fails the governance gate', [['package.json', jsonEdit((o) => { o.dependencies['left-pad'] = '1.3.0'; })]], () => verifyGate('governance'), [/FAIL W06/]);
  caseRun('P12', '(xi) floating Node version in setup-node fails the provenance gate', [[SETUP, replace('node-version-file: .nvmrc', "node-version: '24.x'")]], () => verifyGate('provenance'), [/FAIL W15/]);
  caseRun('P13', '(xi) second, unreviewed workflow file fails the provenance gate', [['.github/workflows/other.yml', () => 'name: other\non: push\njobs: {}\n']], () => verifyGate('provenance'), [/FAIL W09/]);

  caseRun('P14', '(xi) invalid workflow YAML (unquoted ": " in a step name, which GitHub rejects) fails the provenance gate', [[WORKFLOW, replace('- name: Production build (reference-app)', '- name: Production build: reference-app')]], () => verifyGate('provenance'), [/FAIL W09/, /plain scalar contains/]);
  // Independent QA lane 2 mutations (F1-F5): each weakens CI in a way GitHub would run.
  caseRun('P15', '(x) early "exit 0" in the gate script fails the provenance gate', [[WORKFLOW, replace('          set -euo pipefail\n          fail=0\n', '          set -euo pipefail\n          exit 0\n          fail=0\n')]], () => verifyGate('provenance'), [/FAIL W12/, /gate script differs/]);
  caseRun('P16', '(xi) top-level defaults replacing the run shell fails the provenance gate', [[WORKFLOW, replace('concurrency:\n', 'defaults:\n  run:\n    shell: true {0}\n\nconcurrency:\n')]], () => verifyGate('provenance'), [/FAIL W09/, /top-level keys/]);
  caseRun('P17', '(xi) escaped "${{" (\\x24) in a double-quoted value fails the provenance gate', [[WORKFLOW, replace('      - name: Evaluate every mandatory job result\n', '      - name: "Evaluate every mandatory job result \\x24{{ github.event.pull_request.title }}"\n')]], () => verifyGate('provenance'), [/FAIL W09/, /escape sequence/]);
  caseRun('P18', '(xi) env re-enabling install scripts on the setup npm ci step fails the provenance gate', [[SETUP, replace('    - name: Clean install from the committed lockfile (npm ci)\n      shell: bash\n', '    - name: Clean install from the committed lockfile (npm ci)\n      shell: bash\n      env:\n        npm_config_strict_allow_scripts: false\n')]], () => verifyGate('provenance'), [/FAIL W15/, /differs from the reviewed step/]);
  caseRun('P19', '(xi) extra install line in the setup action ("npm  install", two spaces) fails the provenance gate', [[SETUP, replace('        npm ci 2>&1', '        npm  install\n        npm ci 2>&1')]], () => verifyGate('provenance'), [/FAIL W15/, /installs outside npm ci/]);
  caseRun('P21', '(viii) "|| true" on the setup toolchain gate fails the provenance gate', [[SETUP, replace('--gate toolchain 2>&1', '--gate toolchain || true 2>&1')]], () => verifyGate('provenance'), [/FAIL W15/, /differs from the reviewed step/]);
  caseRun('P22', '(viii) continue-on-error on the setup npm ci step fails the provenance gate', [[SETUP, replace('    - name: Clean install from the committed lockfile (npm ci)\n', '    - name: Clean install from the committed lockfile (npm ci)\n      continue-on-error: true\n')]], () => verifyGate('provenance'), [/FAIL W15/, /differs from the reviewed step/]);
  // Independent QA re-check: U+0085 (NEL) is a line break to YAML parsers but not to a \n splitter.
  caseRun('P23', '(xi) top-level defaults hidden behind U+0085 (NEL) in a comment fails the provenance gate', [[WORKFLOW, replace('  contents: read\n', '  contents: read #\u0085defaults:\u0085  run:\u0085    shell: true {0}\n')]], () => verifyGate('provenance'), [/FAIL W09/, /U\+0085/]);
  caseRun('P24', '(xi) gate job moved to another runner fails the provenance gate', [[WORKFLOW, replace('    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n', '    runs-on: self-hosted\n    timeout-minutes: 5\n')]], () => verifyGate('provenance'), [/FAIL W12/, /gate runs-on/]);
  caseRun('P20', '(xi) evidence upload widened with include-hidden-files fails the provenance gate', [[WORKFLOW, replace('          retention-days: 30\n', '          retention-days: 30\n          include-hidden-files: true\n')]], () => verifyGate('provenance'), [/FAIL W11/, /evidence upload/]);

  // ---- scope: Nx and IB1 --------------------------------------------------------------------------------
  caseRun('N01', 'Nx introduced (nx.json) fails the governance gate', [['nx.json', () => '{}\n']], () => verifyGate('governance'), [/FAIL W04/]);
  // IB1-CONTRACTS-CONFIG: config/ is now CANDIDATE scope, so N02 uses a successor package outside that scope (frappe-sdk is IB4).
  caseRun('N02', 'successor artefact outside the CANDIDATE scope (packages/frappe-sdk source) fails the governance gate', [['packages/frappe-sdk/src/lib/client.ts', () => 'export const client = 1;\n']], () => verifyGate('governance'), [/FAIL W05/]);
  caseRun('N03', 'lint configuration introduced fails the governance gate', [['eslint.config.mjs', () => 'export default [];\n']], () => verifyGate('governance'), [/FAIL W07/]);

  // ---- IB1-CONTRACTS-CONFIG jobs are mandatory like the IB0 jobs ---------------------------------------
  caseRun('K01', 'IB1 contracts job dropped from gate needs fails the provenance gate', [[WORKFLOW, replace('      - contracts\n      - runtime-config\n', '      - runtime-config\n')]], () => verifyGate('provenance'), [/FAIL W12/]);
  caseRun('K02', 'IB1 runtime-config job command replaced fails the provenance gate', [[WORKFLOW, replace('          npm run qa:runtime-config 2>&1', '          npm run qa:types 2>&1')]], () => verifyGate('provenance'), [/FAIL W11/]);
  caseRun('K03', 'IB1 portability proof removed from the runtime-config-negative job fails the provenance gate', [[WORKFLOW, replace('          npm run qa:runtime-config:portability 2>&1', '          echo skipped 2>&1')]], () => verifyGate('provenance'), [/FAIL W11/]);
  // Accepted-policy floor (independent QA Q6-1): editing the policy together with the workflow cannot drop or weaken an accepted control.
  caseRun('K04', 'accepted job build-ui-lab dropped from the CI policy fails the provenance gate', [[POLICY, jsonEdit((o) => { o.mandatoryJobs = o.mandatoryJobs.filter((j) => j.id !== 'build-ui-lab'); delete o.requiredCommands['build-ui-lab']; })]], () => verifyGate('provenance'), [/FAIL W11/, /accepted mandatory job build-ui-lab removed/]);
  caseRun('K05', 'accepted regression command weakened in the policy and the workflow together fails the provenance gate', [[POLICY, jsonEdit((o) => { o.requiredCommands.regression = ['node tooling/verification/verify-ib0-wp05.mjs --gate toolchain']; })], [WORKFLOW, replace('verify-ib0-wp05.mjs --gate regression 2>&1', 'verify-ib0-wp05.mjs --gate toolchain 2>&1')]], () => verifyGate('provenance'), [/FAIL W11/, /accepted commands of regression changed/]);
  caseRun('K06', 'gate script made to pass (exit 0) in the policy and the workflow together fails the provenance gate', [[POLICY, jsonEdit((o) => { o.gate.run = o.gate.run.replace('exit 1', 'exit 0'); })], [WORKFLOW, replace('            exit 1\n', '            exit 0\n')]], () => verifyGate('provenance'), [/FAIL W12/, /policy gate differs from the accepted baseline/]);
  caseRun('K07', 'gate check context renamed in the policy and the workflow together fails the provenance gate', [[POLICY, jsonEdit((o) => { o.gate.name = 'PAEP / gate2'; o.gate.requiredCheckContext = 'PAEP / gate2'; })], [WORKFLOW, replace('    name: PAEP / gate\n', '    name: PAEP / gate2\n')]], () => verifyGate('provenance'), [/FAIL W12/, /policy gate differs from the accepted baseline/]);
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

// Case ids must be unique, so a report can never hide one case behind another (IB1-CONTRACTS-CONFIG).
const duplicateIds = results.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
if (duplicateIds.length) console.log(`FAIL duplicate case ids: ${[...new Set(duplicateIds)].join(', ')}`);
const passed = results.length > 0 && results.every((r) => r.pass) && duplicateIds.length === 0;
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
const report = {
  workPackage: 'IB0-WP05', generatedAt: new Date().toISOString(), commit: head, node: process.versions.node,
  result: passed ? 'PASS' : 'FAIL',
  controls: results.filter((r) => r.control).length,
  negatives: results.filter((r) => !r.control).length,
  cases: results
};
const logText = `${header}\n\n${log.join('\n')}`;
const reportText = JSON.stringify(report, null, 2) + '\n';
if (evidenceOut) {
  fs.mkdirSync(evidenceOut, { recursive: true });
  fs.writeFileSync(path.join(evidenceOut, 'negative-ci-tests.log'), logText, 'utf8');
  fs.writeFileSync(path.join(evidenceOut, 'negative-ci-tests.json'), reportText, 'utf8');
} else {
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(logsDir, 'negative-ci-tests.log'), logText, 'utf8');
  fs.writeFileSync(path.join(reportsDir, 'negative-ci-tests.json'), reportText, 'utf8');
}

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — exit ${r.exit}`);
console.log(`\nIB0-WP05 negative CI-control tests: ${passed ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length}; ${report.controls} controls, ${report.negatives} negatives)`);
process.exit(passed ? 0 : 1);
