#!/usr/bin/env node
/**
 * IB4 CI-governance negative suite (npm run qa:ib4:ci-negative), run in PAEP / frappe-adapter so that every accepted
 * job keeps its workload and timeout (authorising instruction §14, ACCEPTANCE AC-IB4-16).
 *
 * Proves that the frappe-adapter job is mandatory, keeps its commands and its 20-minute timeout and feeds PAEP / gate,
 * and that the IB4 suites cannot move into other jobs. Same harness as the IB3 suite
 * (tooling/enterprise-shell/ib3-ci-governance-negative.mjs): each case mutates a disposable scratch copy of the
 * repository (with .git; node_modules hard-linked read-only), commits the mutation in the copy only, and runs the
 * provenance gate, expecting exactly the stated W checks to fail. P00 is the positive control on the unmutated copy.
 *   node tooling/frappe-adapter/ib4-ci-governance-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKFLOW = '.github/workflows/paep-ci.yml';
const POLICY = 'tooling/verification/ib0-wp05-ci-policy.json';
const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
delete env.PAEP_EVIDENCE_DIR;
delete env.GITHUB_STEP_SUMMARY;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib4-ci-negative-'));
const copy = path.join(scratch, 'repo');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments']);
fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });
if (spawnSync('cp', ['-al', path.join(root, 'node_modules'), path.join(copy, 'node_modules')]).status !== 0) {
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
}
fs.appendFileSync(path.join(copy, '.git', 'info', 'exclude'), '\n/node_modules\n');
const git = (...a) => spawnSync('git', a, { cwd: copy, encoding: 'utf8', env });
const snapshot = () => {
  git('add', '-A');
  git('-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit', '-q', '--no-verify', '-m', 'scratch snapshot', '--allow-empty');
};
snapshot();

const replace = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor not found: ${from.slice(0, 60)}`); return t.replace(from, to); };
const jsonEdit = (fn) => (t) => { const o = JSON.parse(t); fn(o); return `${JSON.stringify(o, null, 2)}\n`; };
const gate = (g) => {
  const r = spawnSync(process.execPath, ['tooling/verification/verify-ib0-wp05.mjs', '--gate', g], { cwd: copy, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
/** Removes one job block (from its key line to the next top-level job key) from the workflow text. */
const dropJob = (id) => (t) => {
  const a = t.indexOf(`\n  ${id}:\n`);
  if (a < 0) throw new Error(`job ${id} not found`);
  const rest = t.slice(a + 1);
  const m = /\n {2}(?:# [^\n]*\n {2})*[a-z][a-z0-9-]*:\n/.exec(rest.slice(1));
  return t.slice(0, a + 1) + (m ? rest.slice(m.index + 2) : '');
};
/** Removes a job from the gate needs and from MANDATORY_JOBS. */
const dropNeed = (id) => (t) => {
  const u = replace(`      - ${id}\n`, '')(t);
  const m = /^( {10}MANDATORY_JOBS: [^\n]*)$/m.exec(u);
  if (!m || !m[1].includes(` ${id}`)) throw new Error(`MANDATORY_JOBS does not list ${id}`);
  return u.replace(m[1], m[1].replace(new RegExp(` ${id}(?= |$)`), ''));
};
/** Removes one step (its name line to the next step) from a job. */
const dropStep = (stepName) => (t) => {
  const a = t.indexOf(`      - name: ${stepName}`);
  if (a < 0) throw new Error(`step ${stepName} not found`);
  const b = t.indexOf('\n      - name: ', a + 1);
  return t.slice(0, a) + t.slice(b + 1);
};
const timeoutOf = (id, to) => (t) => {
  const i = t.indexOf(`  ${id}:\n`);
  const j = t.indexOf('timeout-minutes: 20', i);
  if (i < 0 || j < 0) throw new Error(`${id} timeout anchor not found`);
  return `${t.slice(0, j)}timeout-minutes: ${to}${t.slice(j + 'timeout-minutes: 20'.length)}`;
};

const cases = [
  ['P00', 'positive control: unmutated copy passes the provenance gate', [], 'provenance', null],
  ['Q01', 'frappe-adapter dropped from the gate needs', [[WORKFLOW, replace('      - frappe-adapter\n', '')]], 'provenance', [/FAIL W12/]],
  ['Q02', 'frappe-adapter dropped from the gate needs and MANDATORY_JOBS', [[WORKFLOW, dropNeed('frappe-adapter')]], 'provenance', [/FAIL W12/]],
  ['Q03', 'frappe-adapter removed from the policy, the workflow and the gate together', [[POLICY, jsonEdit((o) => { o.mandatoryJobs = o.mandatoryJobs.filter((j) => j.id !== 'frappe-adapter'); delete o.requiredCommands['frappe-adapter']; })], [WORKFLOW, (t) => dropNeed('frappe-adapter')(dropJob('frappe-adapter')(t))]], 'provenance', [/FAIL W11/, /IB4 mandatory job frappe-adapter removed or renamed/]],
  ['Q04', 'the Frappe adapter suite replaced by a no-op in the workflow', [[WORKFLOW, replace('          npm run qa:frappe 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['Q05', 'the fixture conformance suite removed from the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands['frappe-adapter'] = o.requiredCommands['frappe-adapter'].filter((c) => c !== 'npm run qa:integration'); })], [WORKFLOW, dropStep('IB4 fixture conformance')]], 'provenance', [/FAIL W11/, /IB4 command "npm run qa:integration" dropped from frappe-adapter/]],
  ['Q06', 'frappe-adapter silently skipped (if: false on the job)', [[WORKFLOW, replace('    name: PAEP / frappe-adapter\n', '    name: PAEP / frappe-adapter\n    if: ${{ false }}\n')]], 'provenance', [/FAIL W11/, /FAIL W13/]],
  ['Q07', 'frappe-adapter timeout raised from 20 to 25 minutes', [[WORKFLOW, timeoutOf('frappe-adapter', 25)]], 'provenance', [/FAIL W11/, /frappe-adapter timeout-minutes 25 \(IB4 fixes it at 20\)/]],
  ['Q08', 'the Frappe adapter suite moved into PAEP / regression (policy and workflow together)', [[POLICY, jsonEdit((o) => { o.requiredCommands['frappe-adapter'] = o.requiredCommands['frappe-adapter'].filter((c) => c !== 'npm run qa:frappe'); o.requiredCommands.regression.push('npm run qa:frappe'); })], [WORKFLOW, (t) => { const name = '      - name: IB4 Frappe adapter suite'; const s = t.indexOf(name); const step = t.slice(s, t.indexOf('\n      - name: ', s + 1) + 1); const moved = dropStep('IB4 Frappe adapter suite')(t); const i = moved.indexOf('  regression:\n'); const u = moved.indexOf('      - name: Upload evidence', i); return moved.slice(0, u) + step.replace('frappe-adapter-1.log', 'regression-9.log') + moved.slice(u); }]], 'provenance', [/FAIL W11/, /IB4 suite "npm run qa:frappe" outside the IB4 job \(regression\)/]],
];

/** Pinned case count (AC-IB4-16): 8 seeded negatives (Q01-Q08) and 1 positive control (P00). */
const EXPECTED_NEGATIVES = 8;
const EXPECTED_CONTROLS = 1;

const results = [];
for (const [id, name, edits, g, expect, { commit = true } = {}] of cases) {
  const saved = new Map();
  let r;
  let snapped = false;
  try {
    for (const [f, fn] of edits) {
      const p = path.join(copy, f);
      saved.set(p, fs.readFileSync(p));
      fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
    }
    if (edits.length && commit) { snapshot(); snapped = true; }
    r = gate(g);
  } catch (e) {
    r = { status: null, out: `harness error: ${e.stack || e}` };
  } finally {
    if (edits.length) {
      for (const [p, c] of saved) fs.writeFileSync(p, c);
      // Drop only this case's own snapshot: a mutation that throws before its snapshot must not reset the base copy.
      if (snapped) git('reset', '-q', '--hard', 'HEAD~1');
    }
  }
  // A failure case passes only when exactly the expected W checks fail (nothing else is broken) with the expected text.
  const failedW = [...new Set([...r.out.matchAll(/^FAIL (W\d+)/gm)].map((m) => m[1]))].sort();
  const wantW = expect ? [...new Set(expect.map((re) => /FAIL (W\d+)/.exec(re.source)?.[1]).filter(Boolean))].sort() : [];
  const pass = expect
    ? r.status !== 0 && r.status !== null && expect.every((re) => re.test(r.out)) && JSON.stringify(failedW) === JSON.stringify(wantW)
    : r.status === 0 && failedW.length === 0;
  results.push({ id, name, gate: g, expected: expect ? `exit != 0 matching ${expect.map(String).join(', ')}` : 'exit 0', exit: r.status, pass });
  const fails = r.out.split('\n').filter((l) => /^FAIL W/.test(l) || /^harness error/.test(l)).map((l) => (process.argv.includes('--verbose') ? l : l.slice(0, 220)));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} (gate ${g}, exit ${r.status})${fails.length ? `\n    ${fails.join('\n    ')}` : ''}`);
}
fs.rmSync(scratch, { recursive: true, force: true });
const negatives = cases.filter((c) => c[4]).length;
const coverage = negatives === EXPECTED_NEGATIVES && cases.length - negatives === EXPECTED_CONTROLS && new Set(cases.map((c) => c[0])).size === cases.length
  ? []
  : [`${negatives} negatives and ${cases.length - negatives} controls (unique ids: ${new Set(cases.map((c) => c[0])).size}); expected ${EXPECTED_NEGATIVES} and ${EXPECTED_CONTROLS}`];
for (const c of coverage) console.log(`FAIL ${c}`);
const failed = results.filter((x) => !x.pass).length + coverage.length;
console.log(`\nPAEP IB4 CI-governance negative suite: ${failed ? 'FAIL' : 'PASS'} (${results.filter((x) => x.pass).length}/${results.length}; ${negatives} seeded negatives + ${results.length - negatives} control)`);
process.exit(failed ? 1 : 0);
