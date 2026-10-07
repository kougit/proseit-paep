#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 extension of the design-system static gate (tooling/design-system/design-system-qa.mjs):
 * the pinned HOF-IB2-001 v1.2 revision (S01), the component census and public API (S03), the UI-lab coverage of the approved HOF-IB3-001 primitives and variants
 * (S07), the message catalogue (S08), the icon set (S11), the shell tokens (S12) and the bounded UI-lab shell-showcase
 * import exception (S05).
 *
 * Each case mutates a disposable copy of the repository (without node_modules; the gate needs none), optionally
 * regenerates the token files in the copy with the repository's own generator (so that only the token policy, not
 * generator drift, is under test), runs the gate there and requires exit != 0 with exactly the expected checks failing
 * and the expected findings. P00 is the positive control on the unmutated copy. The suite exits non-zero unless all
 * of its exact case count passes.
 *   node tooling/enterprise-shell/design-system-extension-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXPECTED_CASES = 29;
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments', '.git']);
const GATE = 'tooling/design-system/design-system-qa.mjs';
const GENERATOR = 'tooling/design-system/generate-tokens.mjs';
const TOKEN_OUT = ['packages/foundation/src/styles/paep-tokens.css', 'packages/foundation/src/lib/tokens/token-catalogue.generated.ts'];
const INDEX = 'packages/components/src/index.ts';
const MESSAGES = 'packages/components/src/lib/messages/messages.ts';
const ICONS = 'packages/foundation/src/lib/icons/icons.ts';
const V12 = 'evidence/design-handoff/HOF-IB2-001/v1.2/HOF-IB2-001-v1.2.md';
const SPECIMENS = 'apps/ui-lab/src/app/specimens';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ds-extension-negative-'));
const copy = path.join(scratch, 'repo');
fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });
const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' };

const replace = (from, to) => (t) => {
  if (!t.includes(from)) throw new Error(`mutation anchor not found: ${from.slice(0, 70)}`);
  return t.replace(from, to);
};
const remove = (re) => (t) => {
  if (!re.test(t)) throw new Error(`mutation anchor not found: ${re}`);
  return t.replace(re, '');
};
const run = (file) => {
  const r = spawnSync(process.execPath, [file], { cwd: copy, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

// [id, label, edits [[file, fn | string | null]], regenerate tokens?, expected failing checks, expected findings]
const cases = [
  ['P00', 'positive control: unmutated copy passes every check', [], false, [], []],
  // S01: the approved HOF-IB2-001 v1.2 revision is pinned.
  ['E28', 'approved v1.2 revision text edited', [[V12, replace('| shift | along the inline axis to keep the accepted **16 px viewport edge margin**', '| shift | along the inline axis to keep an **8 px viewport edge margin**')]], false, ['S01'], [/v1\.2 revision sha256 [0-9a-f]{64} != approved/]],
  ['E29', 'v1.2 approval status reverted', [[V12, replace('**Status:** APPROVED_FOR_IMPLEMENTATION by the PO/SA', '**Status:** READY_FOR_PO_SA_REVIEW; prepared for the PO/SA')]], false, ['S01'], [/v1\.2 revision status is not APPROVED_FOR_IMPLEMENTATION/, /v1\.2 revision sha256/]],
  // S03: census and public API.
  ['E01', 'extra unapproved component folder (a tooltip outside the approved list)', [['packages/components/src/lib/tooltip/tooltip.ts', 'export class PaepTooltip {}\n'], ['packages/components/src/lib/tooltip/tooltip.spec.ts', "it('a', () => {});\nit('b', () => {});\nit('c', () => {});\n"]], false, ['S03'], [/unexpected component folder tooltip/]],
  ['E02', 'unapproved public export added to the entry point', [[INDEX, replace("export { PaepCountBadge } from './lib/count-badge/count-badge';", "export { PaepCountBadge, paepCountText } from './lib/count-badge/count-badge';")]], false, ['S03'], [/unapproved public export paepCountText/]],
  ['E03', 'approved combobox type export removed', [[INDEX, replace('export type { PaepComboboxGroup, PaepComboboxOption }', 'export type { PaepComboboxGroup }')]], false, ['S03'], [/approved public export PaepComboboxOption missing/]],
  ['E04', 'approved primitive without its behaviour tests', [['packages/components/src/lib/combobox/combobox.spec.ts', null]], false, ['S03'], [/combobox: combobox\.spec\.ts missing/]],
  ['E05', 'symbol declared directly in the entry point', [[INDEX, (t) => `${t}export const PAEP_EXTRA = 1;\n`]], false, ['S03'], [/declares or star-exports symbols directly/]],
  ['E06', 'approved count badge class no longer exported', [[INDEX, replace("export { PaepCountBadge } from './lib/count-badge/count-badge';\n", '')]], false, ['S03'], [/PaepCountBadge \(count-badge\) not exported/, /approved public export PaepCountBadge missing/]],
  // S07: UI-lab coverage.
  ['E07', 'count-badge specimen not registered', [[`${SPECIMENS}/registry.ts`, remove(/import \{[^}]*\} from '\.\/count-badge\.specimen';\n/)]], false, ['S07'], [/count-badge: not registered/]],
  ['E08', 'required combobox state removed from its specimen', [[`${SPECIMENS}/combobox.specimen.ts`, remove(/\n\s*'no options[^\n]*/)]], false, ['S07'], [/combobox: required state "no options" not documented/]],
  ['E09', 'icon-button count state removed from its specimen', [[`${SPECIMENS}/icon-button.specimen.ts`, remove(/\n\s*'count \(number[^\n]*/)]], false, ['S07'], [/icon-button: required HOF-IB3-001 state "count" not documented/]],
  ['E10', 'empty-state unavailable state removed from its specimen', [[`${SPECIMENS}/empty-state.specimen.ts`, replace(", 'unavailable (host icon", ", 'not-shown (host icon")]], false, ['S07'], [/empty-state: required HOF-IB3-001 state "unavailable" not documented/]],
  // S08: message catalogue.
  ['E11', 'unapproved message key added', [[MESSAGES, replace("  'paep.count.loading':", "  'paep.count.extra': 'Extra',\n  'paep.count.loading':")]], false, ['S08'], [/paep\.count\.extra not in content-keys\.md or the approved IB3 component keys/]],
  ['E12', 'approved IB3 count key removed', [[MESSAGES, remove(/^\s+'paep\.count\.unknown':.*\n/m)]], false, ['S08'], [/paep\.count\.unknown missing from messages\.ts/]],
  // S11: icon set.
  ['E13', 'approved shell icon missing', [[ICONS, remove(/^ {2}keyboard: .*\n/m)]], false, ['S11'], [/approved icon keyboard missing/, /48 icons, expected 49/]],
  ['E14', 'unapproved icon added', [[ICONS, replace('  menu: [', "  avatar: [{ type: 'circle', cx: 12, cy: 12, r: 9 }],\n  menu: [")]], false, ['S11'], [/unapproved icon avatar/]],
  ['E15', 'approved shell icon geometry changed', [[ICONS, replace("menu: [{ type: 'path', d: 'M4 6.5h16M4 12h16M4 17.5h16' }]", "menu: [{ type: 'path', d: 'M4 6h16M4 12h16M4 18h16' }]")]], false, ['S11'], [/shell icon drawing data differs/]],
  ['E16', 'accepted IB2 icon changed', [[ICONS, replace("check: [{ type: 'path', d: 'M5 12.5l5 5L19 7' }]", "check: [{ type: 'path', d: 'M5 13l4 4L19 7' }]")]], false, ['S11'], [/accepted IB2 icon drawing data changed/]],
  ['E17', 'sign-out no longer mirrored in RTL', [[ICONS, replace("'panel-start', 'sign-out'];", "'panel-start'];")]], false, ['S11'], [/PAEP_DIRECTIONAL_ICONS .* != approved/]],
  ['E18', 'content-credential metadata left in the icon source', [[ICONS, (t) => `${t}// <metadata xmlns:c2pa="http://c2pa.org/manifest"></metadata>\n`]], false, ['S11'], [/carries metadata/]],
  // S12: shell tokens (each through the generator, then regenerated, so S02 stays green).
  ['E19', 'unapproved layer token added through the generator', [[GENERATOR, replace("  'skip-link': '80',\n", "  'skip-link': '80',\n  toast: '50',\n")]], true, ['S12'], [/unapproved token --paep-layer-toast/]],
  ['E20', 'rejected content-max alias generated', [[GENERATOR, replace("  'sticky-offset':", "  'content-max-inline-size': '90rem',\n  'sticky-offset':")]], true, ['S12'], [/unapproved token --paep-shell-content-max-inline-size/, /rejected token --paep-shell-content-max-inline-size/]],
  ['E21', 'approved token value changed', [[GENERATOR, replace("'topbar-block-size': '3.5rem'", "'topbar-block-size': '4rem'")]], true, ['S12'], [/--paep-shell-topbar-block-size = 4rem, approved 3\.5rem/]],
  ['E22', 'new colour token added through the generator', [[GENERATOR, replace("  add('--paep-layout-form-max'", "  add('--paep-color-shell-accent', '#2D6A4F', 'color', 'semantic');\n  add('--paep-layout-form-max'")]], true, ['S12'], [/non-shell tokens differ from the accepted IB2 catalogue/]],
  ['E23', 'rejected alias used in a component stylesheet', [['packages/components/src/lib/card/card.ts', replace('styles: `', 'styles: `\n    :host { max-inline-size: var(--paep-shell-content-max-inline-size); }')]], false, ['S12'], [/card\.ts: rejected token --paep-shell-content-max-inline-size/]],
  ['E24', 'approved layer token removed from the generator', [[GENERATOR, replace("  'skip-link': '80',\n", '')]], true, ['S12'], [/approved token --paep-layer-skip-link missing/]],
  // S05: only the bounded showcase may import the enterprise entry point; every later-package prohibition still holds there.
  ['E25', 'enterprise imported by a UI-lab page outside the showcase', [['apps/ui-lab/src/app/pages/home.ts', (t) => `import '@proseit/paep-enterprise';\n${t}`]], false, ['S05'], [/pages\/home\.ts: imports @proseit\/paep-enterprise \(later milestone; only apps\/ui-lab\/src\/app\/showcase\/ may import/]],
  ['E26', 'deep enterprise import inside the showcase', [['apps/ui-lab/src/app/showcase/showcase-preview.ts', (t) => `import '@proseit/paep-enterprise/src/lib/shell/shell';\n${t}`]], false, ['S05'], [/showcase-preview\.ts: deep import @proseit\/paep-enterprise\/src/]],
  ['E27', 'later-milestone import inside the showcase', [['apps/ui-lab/src/app/showcase/showcase-sample.ts', (t) => `import '@proseit/frappe-sdk';\n${t}`]], false, ['S05'], [/showcase-sample\.ts: imports @proseit\/frappe-sdk \(later milestone\)/]],
];

const results = [];
for (const [id, label, edits, regen, wantFail, findings] of cases) {
  const touched = [...edits.map(([f]) => f), ...(regen ? TOKEN_OUT : [])];
  const saved = new Map(touched.map((f) => [f, fs.existsSync(path.join(copy, f)) ? fs.readFileSync(path.join(copy, f)) : null]));
  let r;
  let applied = true;
  try {
    for (const [f, e] of edits) {
      const p = path.join(copy, f);
      if (e === null) { fs.rmSync(p); continue; }
      const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
      const after = typeof e === 'string' ? e : e(before ?? '');
      if (after === before) applied = false;
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, after);
    }
    if (regen) {
      const g = run(GENERATOR);
      if (g.status !== 0) throw new Error(`generator failed: ${g.out.slice(0, 300)}`);
    }
    r = run(GATE);
  } catch (e) {
    r = { status: null, out: `harness error: ${e.stack || e}` };
  } finally {
    for (const [f, c] of saved) {
      const p = path.join(copy, f);
      if (c === null) fs.rmSync(p, { force: true });
      else fs.writeFileSync(p, c);
    }
    for (const [f] of edits) if (saved.get(f) === null) fs.rmSync(path.dirname(path.join(copy, f)), { recursive: true, force: true });
  }
  const failed = [...new Set([...r.out.matchAll(/^FAIL (S\d+)/gm)].map((m) => m[1]))].sort();
  const pass = wantFail.length
    ? applied && r.status !== 0 && r.status !== null && JSON.stringify(failed) === JSON.stringify([...wantFail].sort()) && findings.every((re) => re.test(r.out))
    : r.status === 0 && failed.length === 0 && /PAEP design-system QA: PASS/.test(r.out);
  results.push({ id, pass });
  const lines = r.out.split('\n').filter((l) => /^FAIL S/.test(l) || /^harness error/.test(l)).map((l) => l.slice(0, 240));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${label} (exit ${r.status}; failing ${failed.join(', ') || 'none'}; expected ${wantFail.join(', ') || 'none'})${!applied ? ' (mutation did not apply)' : ''}${!pass && lines.length ? `\n    ${lines.join('\n    ')}` : ''}`);
}
fs.rmSync(scratch, { recursive: true, force: true });

const passed = results.filter((x) => x.pass).length;
const exact = results.length === EXPECTED_CASES + 1 && passed === results.length;
if (results.length !== EXPECTED_CASES + 1) console.log(`FAIL case count: ${results.length - 1} negative cases declared, expected exactly ${EXPECTED_CASES}`);
console.log(`\nPAEP design-system IB3 extension negative suite: ${exact ? 'PASS' : 'FAIL'} (${passed}/${results.length})`);
process.exit(exact ? 0 : 1);
