#!/usr/bin/env node
/**
 * IB3 CI-governance negative suite (npm run qa:ib3:ci-negative), run in PAEP / enterprise-shell so that
 * PAEP / negative-ci and negative-ci-b keep their accepted workload and 20-minute timeout (RR14, AC-IB3-21).
 *
 * Proves that the two IB3 jobs are mandatory, keep their commands and feed PAEP / gate, and that the IB3 negative
 * suites cannot move into other jobs, and that the IB3 W18 edge bound still rejects a WP04 control that no longer
 * injects the edge it names (J11). J12-J17 cover the three-way CI-control split (PO/SA 2026-10-07): part c dropped,
 * left out of the gate or given a longer timeout, and a WP05 negative case unassigned, dropped or in two parts. Same harness as the IB2 suite (tooling/design-system/ci-governance-negative.mjs):
 * each case mutates a disposable scratch copy of the repository (with .git; node_modules hard-linked read-only),
 * commits the mutation in the copy only (J11 leaves it uncommitted), and runs the provenance gate, expecting exactly the stated W checks to
 * fail. P00 is the positive control on the unmutated copy.
 *   node tooling/enterprise-shell/ib3-ci-governance-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKFLOW = '.github/workflows/paep-ci.yml';
const POLICY = 'tooling/verification/ib0-wp05-ci-policy.json';
const WP05_HARNESS = 'tooling/verification/negative-ib0-wp05.mjs';
const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
delete env.PAEP_EVIDENCE_DIR;
delete env.GITHUB_STEP_SUMMARY;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib3-ci-negative-'));
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
  ['J01', 'enterprise-shell dropped from the gate needs', [[WORKFLOW, replace('      - enterprise-shell\n', '')]], 'provenance', [/FAIL W12/]],
  ['J02', 'shell-browser dropped from the gate needs and MANDATORY_JOBS', [[WORKFLOW, dropNeed('shell-browser')]], 'provenance', [/FAIL W12/]],
  ['J03', 'enterprise behaviour tests replaced by a no-op in the workflow', [[WORKFLOW, replace('          npm run test:enterprise 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['J04', 'shell browser gate replaced by a no-op in the workflow', [[WORKFLOW, replace('          npm run qa:shell 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['J05', 'enterprise-shell removed from the policy, the workflow and the gate together', [[POLICY, jsonEdit((o) => { o.mandatoryJobs = o.mandatoryJobs.filter((j) => j.id !== 'enterprise-shell'); delete o.requiredCommands['enterprise-shell']; })], [WORKFLOW, (t) => dropNeed('enterprise-shell')(dropJob('enterprise-shell')(t))]], 'provenance', [/FAIL W11/, /IB3 mandatory job enterprise-shell removed or renamed/]],
  ['J06', 'shell browser negative suite removed from the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands['shell-browser'] = o.requiredCommands['shell-browser'].filter((c) => c !== 'npm run qa:shell:negative'); })], [WORKFLOW, dropStep('IB3 shell browser negative suite')]], 'provenance', [/FAIL W11/, /IB3 command "npm run qa:shell:negative" dropped from shell-browser/]],
  ['J07', 'IB3 CI-governance negative removed from the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands['enterprise-shell'] = o.requiredCommands['enterprise-shell'].filter((c) => c !== 'npm run qa:ib3:ci-negative'); })], [WORKFLOW, dropStep('IB3 CI-governance negative suite')]], 'provenance', [/FAIL W11/, /IB3 command "npm run qa:ib3:ci-negative" dropped from enterprise-shell/]],
  ['J08', 'enterprise-shell silently skipped (if: false on the job)', [[WORKFLOW, replace('    name: PAEP / enterprise-shell\n', '    name: PAEP / enterprise-shell\n    if: ${{ false }}\n')]], 'provenance', [/FAIL W11/, /FAIL W13/]],
  ['J09', 'shell-browser timeout raised above the 30-minute ceiling', [[WORKFLOW, timeoutOf('shell-browser', 45)]], 'provenance', [/FAIL W11/, /shell-browser timeout-minutes 45/]],
  ['J10', 'an IB3 negative suite moved into PAEP / regression (policy and workflow together)', [[POLICY, jsonEdit((o) => { o.requiredCommands['shell-browser'] = o.requiredCommands['shell-browser'].filter((c) => c !== 'npm run qa:shell:negative'); o.requiredCommands.regression.push('npm run qa:shell:negative'); })], [WORKFLOW, (t) => { const step = t.slice(t.indexOf('      - name: IB3 shell browser negative suite'), t.indexOf('\n      - name: ', t.indexOf('      - name: IB3 shell browser negative suite') + 1) + 1); const moved = dropStep('IB3 shell browser negative suite')(t); const i = moved.indexOf('  regression:\n'); const u = moved.indexOf('      - name: Upload evidence', i); return moved.slice(0, u) + step.replace('shell-browser-3.log', 'regression-9.log') + moved.slice(u); }]], 'provenance', [/FAIL W11/, /IB3 negative "npm run qa:shell:negative" outside the IB3 jobs \(regression\)/]],
  // W18 counts only the named edges the unmutated graph lacks; a WP04 edge-count control that names an edge it no
  // longer injects must still fail. The edit stays uncommitted, as it was in the WP05 suite; any change to the WP04
  // suite also fails its static integrity check (W17), so W17 is expected with W18. The case runs here, not in the WP05 suite, because one
  // more WP04 negative run does not fit the 20-minute PAEP / negative-ci budget (RR14, AC-IB3-21).
  ['J11', 'a WP04 edge-count control that names an edge it does not inject fails the negative-architecture gate', [['tooling/verification/negative-ib0-wp04.mjs', replace("  [entry('frappe-sdk'), append(\"import '@proseit/paep-offline';\")],\n", '')]], 'negative-architecture', [/FAIL W17/, /FAIL W18/, /C1 failed: allowed-edge control/], { commit: false }],
  // Three-way CI-control split (PO/SA 2026-10-07): part c is a mandatory job feeding the gate with the 20-minute timeout,
  // and the WP05 negative suite's explicit PARTITION assigns every pinned case to exactly one part (W11).
  ['J12', 'negative-ci-c removed from the policy, the workflow and the gate together', [[POLICY, jsonEdit((o) => { o.mandatoryJobs = o.mandatoryJobs.filter((j) => j.id !== 'negative-ci-c'); delete o.requiredCommands['negative-ci-c']; })], [WORKFLOW, (t) => dropNeed('negative-ci-c')(dropJob('negative-ci-c')(t))]], 'provenance', [/FAIL W11/, /IB3 mandatory job negative-ci-c removed or renamed/, /part c of the WP05 negative suite runs in \[\], expected \[negative-ci-c\]/]],
  ['J13', 'negative-ci-c dropped from the gate needs and MANDATORY_JOBS', [[WORKFLOW, dropNeed('negative-ci-c')]], 'provenance', [/FAIL W12/]],
  ['J14', 'negative-ci-c timeout raised from 20 to 25 minutes', [[WORKFLOW, timeoutOf('negative-ci-c', 25)]], 'provenance', [/FAIL W11/, /negative-ci-c timeout-minutes 25 \(RR14 fixes it at 20\)/]],
  ['J15', 'a WP05 negative case left unassigned in the partition', [[WP05_HARNESS, replace("'P15', 'P23', 'P24'", "'P15', 'P24'")]], 'provenance', [/FAIL W11/, /partition: unassigned cases P23/]],
  ['J16', 'a WP05 negative case dropped from the pinned list and the partition together', [[WP05_HARNESS, (t) => replace("'P15', 'P23', 'P24'", "'P15', 'P24'")(replace("'P22', 'P23', 'P24', 'P20'", "'P22', 'P24', 'P20'")(t))]], 'provenance', [/FAIL W11/, /partition: 103 declared and 103 assigned cases; expected 104/]],
  ['J17', 'a WP05 negative case placed in two parts', [[WP05_HARNESS, replace("    'L00', 'T02',", "    'L00', 'P23', 'T02',")]], 'provenance', [/FAIL W11/, /partition: cases in more than one part P23/]],
];

/** Pinned case count (AC-IB3-17): 17 seeded negatives (J01-J17) and 1 positive control (P00). */
const EXPECTED_NEGATIVES = 17;
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
console.log(`\nPAEP IB3 CI-governance negative suite: ${failed ? 'FAIL' : 'PASS'} (${results.filter((x) => x.pass).length}/${results.length}; ${negatives} seeded negatives + ${results.length - negatives} control)`);
process.exit(failed ? 1 : 0);
