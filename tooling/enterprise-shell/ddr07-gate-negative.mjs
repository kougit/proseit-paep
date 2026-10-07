#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 DDR-IB2-07 gate (npm run qa:ddr07:negative).
 *
 * Each case mutates a disposable copy of the repository (with .git, without node_modules), runs
 * ddr07-gate.mjs --root <copy> and expects the stated result. P00 runs the repository as it is; every other case
 * starts from a committed copy in which DDR-IB2-07 is reopened (status OPEN, closure record and section removed,
 * foundation and components restored to generation 4, history squashed onto generation 4), so the cases hold whichever
 * state the repository is in. P00, P01 and P10 are positive controls.
 *   node tooling/enterprise-shell/ddr07-gate-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WP_JSON = 'work-packages/IB3-ENTERPRISE-SHELL/work-package.json';
const CLOSURE = 'evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md';
const PACKAGES = ['packages/foundation/', 'packages/components/'];
const DDR = 'evidence/design-handoff/HOF-IB2-001/deviations/DDR-IB2-07.md';
const F07_FILE = 'apps/ui-lab/src/app/pages/foundation.html';
const R03_FILE = 'apps/ui-lab/src/app/pages/proofs.ts';
const GATE = path.join(root, 'tooling/enterprise-shell/ddr07-gate.mjs');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments']);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ddr07-negative-'));
const results = [];

function fresh(name) {
  const copy = path.join(scratch, name);
  fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });
  return copy;
}
const io = (copy) => ({
  read: (f) => fs.readFileSync(path.join(copy, f), 'utf8'),
  remove: (f) => fs.rmSync(path.join(copy, f), { force: true }),
  write: (f, s) => (fs.mkdirSync(path.dirname(path.join(copy, f)), { recursive: true }), fs.writeFileSync(path.join(copy, f), s)),
  replace(f, a, b) {
    const s = this.read(f);
    if (!s.includes(a)) throw new Error(`seed text not found in ${f}: ${a}`);
    this.write(f, s.replace(a, b));
  },
  git(...a) {
    const r = spawnSync('git', a, { cwd: copy, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${a.join(' ')} failed: ${r.stderr}`);
    return r.stdout;
  },
  commit(msg) {
    const g = (...a) => spawnSync('git', a, { cwd: copy, encoding: 'utf8' });
    g('add', '-A');
    const r = g('-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit', '-q', '--no-verify', '--allow-empty', '-m', msg);
    if (r.status !== 0) throw new Error(`commit failed: ${r.stderr}`);
  },
});
const closeIt = (f) => {
  const wp = JSON.parse(f.read(WP_JSON));
  wp.ib2DdrFollowUps['DDR-IB2-07'] = 'CLOSED 2026-10-06';
  f.write(WP_JSON, JSON.stringify(wp, null, 2) + '\n');
  f.write(CLOSURE, '# DDR-IB2-07 closure\n\nStatus: CLOSED\nDate: 2026-10-06\n');
  f.write(DDR, `${f.read(DDR)}\n## Closure\n\n2026-10-06: CLOSED.\n`);
};
const reopen = (f) => {
  // An open DDR-IB2-07 means foundation and components equal generation 4: restore them, and rebuild the history as
  // one commit on top of generation 4, so the later package commits of the real history do not precede the closures
  // the cases commit.
  const g4 = JSON.parse(f.read('tooling/governance/baseline-registry.json')).generations.find((g) => g.generation === 4).acceptedCommit;
  for (const added of f.git('diff', '--name-only', '--diff-filter=A', g4, 'HEAD', '--', ...PACKAGES).split('\n').filter(Boolean)) f.remove(added);
  f.git('checkout', g4, '--', ...PACKAGES);
  f.git('reset', '-q', '--soft', g4);
  const wp = JSON.parse(f.read(WP_JSON));
  wp.ib2DdrFollowUps['DDR-IB2-07'] = 'OPEN (reopened by the negative harness)';
  f.write(WP_JSON, JSON.stringify(wp, null, 2) + '\n');
  f.remove(CLOSURE);
  f.write(DDR, f.read(DDR).replace(/\n## Closure\n[\s\S]*$/, '\n'));
  f.commit('negative harness: reopen DDR-IB2-07');
};
const touchComponents = (f) => f.write('packages/components/src/lib/button/button.ts', `${f.read('packages/components/src/lib/button/button.ts')}\n// seeded change\n`);

/** id, description, mutation(f), expected exit, patterns the output must contain. */
const CASES = [
  ['P00', 'positive control: the repository as it is', null, 0, [/PASS \(4\/4\)/]],
  ['P01', 'positive control: DDR-IB2-07 reopened, nothing else changed', () => {}, 0, [/PASS \(4\/4\)/, /DDR-IB2-07 OPEN/]],
  ['N01', 'an F07 surface marker removed', (f) => f.replace(F07_FILE, 'data-f07-surface="dark"', ''), 1, [/FAIL G1/, /surface "dark" missing/]],
  ['N02', 'an F07 state row removed', (f) => f.replace(F07_FILE, 'data-f07-state="loading"', ''), 1, [/FAIL G1/, /state "loading" missing/]],
  ['N03', 'an R03 section removed', (f) => f.replace(R03_FILE, 'data-r03-section="overlays"', ''), 1, [/FAIL G1/, /section "overlays" missing/]],
  ['N04', 'the table header action removed', (f) => f.replace(R03_FILE, '<button paepButton paepTableActions variant="primary" icon="plus">Create record</button>', ''), 1, [/FAIL G1/, /no header action/]],
  ['N05', 'an F07 specimen rebuilt from a bare button', (f) => f.replace(F07_FILE, '<button paepButton variant="primary" class="lab-f07-ring">Continue</button>', '<button type="button" class="lab-f07-ring">Continue</button>'), 1, [/FAIL G1/, /bare <button>/]],
  ['N06', 'components changed while DDR-IB2-07 is open', touchComponents, 1, [/FAIL G2/, /differs from generation 4/]],
  ['N07', 'foundation file added (untracked) while open', (f) => f.write('packages/foundation/src/lib/new.ts', 'export {};\n'), 1, [/FAIL G2/, /new\.ts differs/]],
  ['N08', 'foundation version bumped while open', (f) => f.replace('packages/foundation/package.json', '"version": "0.0.0"', '"version": "0.1.0"'), 1, [/FAIL G3/, /version 0\.1\.0/]],
  ['N09', 'release tarball added while open', (f) => f.write('packages/components/paep-components-0.0.0.tgz', 'x'), 1, [/FAIL G3/, /release artefact/]],
  ['N10', 'CLOSED claimed without a closure record', (f) => {
    const wp = JSON.parse(f.read(WP_JSON));
    wp.ib2DdrFollowUps['DDR-IB2-07'] = 'CLOSED 2026-10-06';
    f.write(WP_JSON, JSON.stringify(wp, null, 2) + '\n');
  }, 1, [/FAIL G4/, /CLOSURE\.md missing/]],
  ['N11', 'CLOSED without the dated DDR closure section', (f) => { closeIt(f); f.write(DDR, f.read(DDR).replace(/\n## Closure[\s\S]*$/, '\n')); }, 1, [/FAIL G4/, /no dated "## Closure" section/]],
  ['N12', 'components committed before the closure commit', (f) => { touchComponents(f); f.commit('components first'); closeIt(f); f.commit('closure after'); }, 1, [/FAIL G2/, /before the DDR-IB2-07 closure/]],
  ['N13', 'components committed together with the closure', (f) => { touchComponents(f); closeIt(f); f.commit('closure and components together'); }, 1, [/FAIL G2/, /before the DDR-IB2-07 closure/]],
  ['N14', 'components changed while the closure is uncommitted', (f) => { closeIt(f); touchComponents(f); }, 1, [/FAIL G2/, /closure record is not committed/]],
  ['N15', 'an unknown DDR-IB2-07 status', (f) => { const wp = JSON.parse(f.read(WP_JSON)); wp.ib2DdrFollowUps['DDR-IB2-07'] = 'DONE'; f.write(WP_JSON, JSON.stringify(wp, null, 2) + '\n'); }, 1, [/FAIL G4/, /neither OPEN nor CLOSED/]],
  ['N16', 'closure committed, later deleted in a commit, then a components commit (HEAD must hold the record)', (f) => { closeIt(f); f.commit('closure'); f.remove(CLOSURE); f.commit('drop closure'); touchComponents(f); f.commit('components after the record was dropped'); }, 1, [/FAIL G2/, /closure record is not committed/]],
  ['P10', 'positive control: closure committed first, then a components commit', (f) => { closeIt(f); f.commit('closure'); touchComponents(f); f.commit('components after closure'); }, 0, [/PASS \(4\/4\)/, /CLOSED at/]],
];

for (const [id, name, mutate, exit, patterns] of CASES) {
  const copy = fresh(id);
  let out = '';
  let status = null;
  try {
    const f = io(copy);
    if (mutate) {
      reopen(f);
      mutate(f);
    }
    const r = spawnSync(process.execPath, [GATE, '--root', copy], { encoding: 'utf8' });
    out = `${r.stdout}${r.stderr}`;
    status = r.status;
  } catch (e) {
    out = String(e);
  }
  const pass = status === exit && patterns.every((re) => re.test(out));
  results.push({ id, name, expectedExit: exit, exit: status, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} (exit ${status}, expected ${exit})`);
  if (!pass) console.log(out.split('\n').map((l) => `    ${l}`).join('\n'));
  fs.rmSync(copy, { recursive: true, force: true });
}
fs.rmSync(scratch, { recursive: true, force: true });
const failed = results.filter((r) => !r.pass).length;
console.log(`\nPAEP DDR-IB2-07 gate negatives: ${failed ? 'FAIL' : 'PASS'} (${results.length - failed}/${results.length}; expected ${CASES.length})`);
process.exit(failed || results.length !== 19 ? 1 : 0);
