#!/usr/bin/env node
/**
 * IB3 DDR-IB2-07 gate (npm run qa:ddr07): G-DDR07-1 sequence, G-DDR07-2 content and G-DDR07-3 release guard of
 * the IB3 pre-flight DDR analysis (08), adopted by the PO/SA authorisation of 2026-10-06 (IB3-ENTERPRISE-SHELL
 * WORK_PACKAGE.md §3, ACCEPTANCE.md AC-IB3-24).
 *
 *   G1 content    F07 in the UI lab shows the focus ring on the six approved surfaces and the nine-state matrix;
 *                 R03 shows the four missing 320 px sections; both are composed only of PAEP components.
 *   G2 sequence   While DDR-IB2-07 is open, nothing under packages/foundation/ or packages/components/ differs
 *                 from the accepted generation 4 tree (committed, staged, unstaged or untracked). Once it is
 *                 recorded CLOSED, the commit that adds the closure record precedes, on HEAD's history, every
 *                 commit since generation 4 that touches those packages.
 *   G3 release    While DDR-IB2-07 is open, both packages stay at version 0.0.0 and no release artefact
 *                 (package tarball, changelog or release notes, built dist/) exists under them.
 *   G4 closure    A CLOSED status needs the dated closure record, the dated closure section appended to the
 *                 DDR record, and the new IB3 captures of both pages at 1440, 834 and 320 CSS px.
 *
 *   node tooling/enterprise-shell/ddr07-gate.mjs [--root <repo>]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const at = args.indexOf('--root');
const root = at >= 0 ? path.resolve(args[at + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const PACKAGES = ['packages/foundation/', 'packages/components/'];
const WP_JSON = 'work-packages/IB3-ENTERPRISE-SHELL/work-package.json';
const CLOSURE = 'evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/CLOSURE.md';
const DDR = 'evidence/design-handoff/HOF-IB2-001/deviations/DDR-IB2-07.md';
const CAPTURES = 'evidence/IB3-ENTERPRISE-SHELL/ddr-ib2-07/captures';
const F07_FILE = 'apps/ui-lab/src/app/pages/foundation.html';
const R03_FILE = 'apps/ui-lab/src/app/pages/proofs.ts';
const F07_SURFACES = ['white', 'page', 'status', 'dark', 'inset', 'compact'];
const F07_STATES = ['default', 'hover', 'focus', 'active', 'selected', 'disabled', 'read-only', 'invalid', 'loading'];
const R03_SECTIONS = ['table-action', 'pagination', 'card-panel', 'overlays'];
const PAGES = ['foundations--focus', 'proofs--responsive'];
const VIEWPORTS = ['desktop', 'tablet', 'narrow320'];

const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
const read = (f) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8') : null);
const lines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const results = [];
const add = (id, title, problems, ok) => results.push({ id, title, problems, ok });

const registry = JSON.parse(read('tooling/governance/baseline-registry.json'));
const g4 = registry.generations.find((g) => g.generation === 4);
const wp = JSON.parse(read(WP_JSON) ?? '{}');
const status = String(wp.ib2DdrFollowUps?.['DDR-IB2-07'] ?? '');
const closed = /^CLOSED\b/.test(status);

/** The source between `start` and the first later occurrence of `end` (exclusive); '' when `start` is missing. */
function block(src, start, end) {
  const i = (src ?? '').indexOf(start);
  if (i < 0) return '';
  const j = src.indexOf(end, i + start.length);
  return src.slice(i, j < 0 ? undefined : j);
}

/** Native controls in a lab block must be the PAEP components (the DDR-IB2-06 lesson): no bare button or input. */
function composition(src, where) {
  const p = [];
  for (const m of src.matchAll(/<button\b[^>]*>/g)) if (!/\bpaepButton\b/.test(m[0])) p.push(`${where}: bare <button> without paepButton: ${m[0]}`);
  for (const m of src.matchAll(/<input\b[^>]*>/g)) if (!/\bpaep(Input|Checkbox)\b/.test(m[0])) p.push(`${where}: bare <input> without paepInput or paepCheckbox: ${m[0]}`);
  for (const m of src.matchAll(/<(select|textarea)\b[^>]*>/g)) if (!/\bpaep(Select|Input)\b/.test(m[0])) p.push(`${where}: bare <${m[1]}> without a PAEP directive`);
  return p;
}

// G1 content.
{
  const p = [];
  const f07 = block(read(F07_FILE), "@case ('focus')", '@case (');
  if (!f07) p.push(`${F07_FILE}: no focus case`);
  for (const s of F07_SURFACES) if (!f07.includes(`data-f07-surface="${s}"`)) p.push(`F07: surface "${s}" missing`);
  for (const s of F07_STATES) if (!f07.includes(`data-f07-state="${s}"`)) p.push(`F07: state "${s}" missing`);
  // The accepted keyboard demo above these sections shows the global ring on native elements on purpose; the new
  // F07 sections start at the surfaces section.
  p.push(...composition(block(f07, 'aria-labelledby="f-focus-surfaces"', '@case ('), 'F07'));
  const r03 = block(read(R03_FILE), "selector: 'lab-proof-reflow'", 'export class LabProofReflow');
  if (!r03) p.push(`${R03_FILE}: no LabProofReflow`);
  for (const s of R03_SECTIONS) if (!r03.includes(`data-r03-section="${s}"`)) p.push(`R03: section "${s}" missing`);
  if (!/paepTableActions/.test(block(r03, 'data-r03-section="table-action"', '</section>'))) p.push('R03: the table has no header action');
  if (!/<paep-pagination(?![^>]*paepTableFooter)/.test(block(r03, 'data-r03-section="pagination"', '</section>'))) p.push('R03: no standalone pagination');
  const card = block(r03, 'data-r03-section="card-panel"', 'data-r03-section="overlays"');
  if (!/<paep-card\b/.test(card) || !/<paep-panel\b/.test(card)) p.push('R03: Card and panel needs both paep-card and paep-panel');
  for (const id of ['dialog', 'drawer', 'popover']) if (!block(r03, 'data-r03-section="overlays"', '</section>').includes(`/components/${id}`)) p.push(`R03: Overlays at 320 does not link the ${id} specimen`);
  p.push(...composition(r03, 'R03'));
  add('G1', 'F07 (6 surfaces, 9 states) and R03 (4 sections at 320 px) are in the UI lab, composed only of PAEP components', p, `${F07_SURFACES.length} surfaces, ${F07_STATES.length} states, ${R03_SECTIONS.length} sections`);
}

// G2 sequence.
{
  const p = [];
  let detail;
  if (!g4?.acceptedCommit || git('cat-file', '-e', `${g4.acceptedCommit}^{commit}`).status !== 0) p.push('generation 4 accepted commit is not available');
  else if (!closed) {
    const changed = [...lines(git('diff', '--name-only', g4.acceptedCommit, '--', ...PACKAGES).stdout), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...PACKAGES).stdout)];
    for (const f of [...new Set(changed)]) p.push(`${f} differs from generation 4 while DDR-IB2-07 is open`);
    detail = `DDR-IB2-07 open; foundation and components equal generation 4 (${g4.acceptedCommit.slice(0, 7)})`;
  } else {
    const dirty = [...lines(git('diff', '--name-only', 'HEAD', '--', ...PACKAGES).stdout), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...PACKAGES).stdout)];
    const closureCommit = lines(git('log', '--diff-filter=A', '--format=%H', `${g4.acceptedCommit}..HEAD`, '--', CLOSURE).stdout).at(-1);
    const touching = lines(git('log', '--format=%H', `${g4.acceptedCommit}..HEAD`, '--', ...PACKAGES).stdout);
    if (!closureCommit) {
      if (touching.length || dirty.length) p.push('foundation or components changed but the DDR-IB2-07 closure record is not committed');
    } else {
      for (const c of touching) {
        if (c === closureCommit || git('merge-base', '--is-ancestor', closureCommit, c).status !== 0) p.push(`commit ${c.slice(0, 7)} changes foundation or components before the DDR-IB2-07 closure (${closureCommit.slice(0, 7)})`);
      }
    }
    detail = `DDR-IB2-07 CLOSED at ${closureCommit ? closureCommit.slice(0, 7) : 'an uncommitted record'}; ${touching.length} later package commit(s)`;
  }
  add('G2', 'Sequence: no foundation or components change before DDR-IB2-07 is CLOSED', p, detail);
}

// G3 release guard.
{
  const p = [];
  if (!closed) {
    for (const d of PACKAGES) {
      const v = JSON.parse(read(`${d}package.json`) ?? '{}').version;
      if (v !== '0.0.0') p.push(`${d}package.json version ${v} (must stay 0.0.0 while DDR-IB2-07 is open)`);
      const files = [...lines(git('ls-files', '--', d).stdout), ...lines(git('ls-files', '--others', '--', d).stdout)];
      for (const f of files) if (/\.tgz$|(^|\/)(CHANGELOG|RELEASE[-_ ]?NOTES)[^/]*$|^packages\/[^/]+\/dist\//i.test(f)) p.push(`${f}: design-system release artefact while DDR-IB2-07 is open`);
      if (fs.existsSync(path.join(root, d, 'dist'))) p.push(`${d}dist/: built release output while DDR-IB2-07 is open`);
    }
  }
  add('G3', 'Release guard: no design-system version change or release artefact while DDR-IB2-07 is open', p, closed ? 'DDR-IB2-07 CLOSED; guard released' : 'both packages 0.0.0; no release artefact');
}

// G4 closure record.
{
  const p = [];
  if (status && !/^(OPEN|CLOSED)\b/.test(status)) p.push(`${WP_JSON}: DDR-IB2-07 status "${status}" is neither OPEN nor CLOSED`);
  if (!status) p.push(`${WP_JSON}: ib2DdrFollowUps["DDR-IB2-07"] missing`);
  if (closed) {
    const rec = read(CLOSURE);
    if (!rec) p.push(`${CLOSURE} missing`);
    else {
      if (!/Status:\s*\**CLOSED/.test(rec)) p.push(`${CLOSURE}: no "Status: CLOSED"`);
      if (!/\b20\d\d-\d\d-\d\d\b/.test(rec)) p.push(`${CLOSURE}: no closure date`);
    }
    const ddr = read(DDR) ?? '';
    if (!/^## Closure\b[\s\S]*\b20\d\d-\d\d-\d\d\b/m.test(ddr)) p.push(`${DDR}: no dated "## Closure" section`);
    for (const pg of PAGES) for (const vp of VIEWPORTS) if (!fs.existsSync(path.join(root, CAPTURES, `${pg}--${vp}.png`))) p.push(`${CAPTURES}/${pg}--${vp}.png missing`);
  }
  add('G4', 'A CLOSED status carries the dated closure record, the dated DDR closure section and the new IB3 captures at 1440, 834 and 320', p, closed ? 'closure recorded' : 'DDR-IB2-07 open (closure not yet claimed)');
}

for (const r of results) {
  console.log(`${r.problems.length ? 'FAIL' : 'PASS'} ${r.id} ${r.title}${r.problems.length ? '' : ` — ${r.ok}`}`);
  for (const x of r.problems) console.log(`  - ${x}`);
}
const failed = results.filter((r) => r.problems.length).length;
console.log(`\nPAEP DDR-IB2-07 gate: ${failed ? 'FAIL' : 'PASS'} (${results.length - failed}/${results.length}); DDR-IB2-07 ${closed ? 'CLOSED' : 'OPEN'}`);
process.exit(failed ? 1 : 0);
