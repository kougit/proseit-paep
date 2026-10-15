#!/usr/bin/env node
/**
 * Negative suite for the IB2 design-system static gate (npm run qa:design-system:negative).
 * Each case overlays one defect on the real repository files (nothing is written) and requires the named check
 * to fail with the expected finding while every other check keeps its unmutated result. A final positive
 * control runs the unmutated overlay.
 */
import { makeFs, runChecks } from './design-system-qa.mjs';

const base = runChecks(makeFs());
const baseById = Object.fromEntries(base.map((r) => [r.id, r.pass]));
const real = makeFs();
const pick = (id) => {
  const dir = `packages/components/src/lib/${id}`;
  const files = real.list(dir).filter((f) => f.endsWith('.css') || (f.endsWith('.ts') && !f.endsWith('.spec.ts')));
  return files.find((f) => f.endsWith('.css')) || files.find((f) => /styles:\s*`/.test(real.read(f))) || files[0];
};
const append = (file, css) => {
  const t = real.read(file);
  return file.endsWith('.css') ? `${t}\n${css}\n` : t.replace(/styles:\s*(\[\s*)?`/, (m) => `${m}\n${css}\n`);
};
const target = pick('card');

const cases = [
  ['N01', 'S01', 'manifest status changed', [['evidence/design-handoff/HOF-IB2-001/handoff.manifest.yaml', (t) => t.replace('status: APPROVED_FOR_IMPLEMENTATION', 'status: DRAFT')]], /APPROVED|sha256/],
  ['N02', 'S02', 'generated token value edited by hand', [['packages/foundation/src/styles/paep-tokens.css', (t) => t.replace('--paep-color-status-error-fg: #B3261E;', '--paep-color-status-error-fg: #C0392B;')]], /differs from the generator/],
  ['N03', 'S01', 'approved token source edited (handoff file no longer matches its pin)', [['evidence/design-handoff/HOF-IB2-001/design-export/foundation/token-values.candidate.json', (t) => t.replace('"primary": "#24364B"', '"primary": "#24364C"')]], /token-values\.candidate\.json sha256/, ['S02']],
  ['N33', 'S02', 'breakpoint table edited by hand', [['packages/foundation/src/lib/layout/breakpoints.ts', (t) => t.replace("minEm: 64, minPx: 1024", "minEm: 62, minPx: 992")]], /PAEP_BREAKPOINTS .* != approved/],
  ['N04', 'S03', 'component spec removed', [['packages/components/src/lib/dialog/dialog.spec.ts', null]], /dialog\.spec\.ts missing/],
  ['N05', 'S03', 'component not exported from the entry point', [['packages/components/src/index.ts', (t) => t.replace(/PaepStatusBadge,?/, '')]], /PaepStatusBadge .* not exported/],
  ['N06', 'S03', 'extra component outside the tranche', [['packages/components/src/lib/toast/toast.ts', 'export class PaepToast {}\n']], /unexpected component folder toast/],
  ['N07', 'S04', 'raw hex colour in component CSS', [[target, () => append(target, ':host { color: #ff0000; }')]], /colour literal/],
  ['N08', 'S04', 'named colour in component CSS', [[target, () => append(target, ':host { background: white; }')]], /colour literal/],
  ['N09', 'S04', 'physical margin-left', [[target, () => append(target, ':host { margin-left: var(--paep-space-2); }')]], /physical property/],
  ['N10', 'S04', 'text-align right', [[target, () => append(target, ':host { text-align: right; }')]], /physical property/],
  ['N11', 'S04', 'raw pixel spacing', [[target, () => append(target, ':host { padding: 13px; }')]], /raw length 13px/],
  ['N12', 'S04', 'raw shadow', [[target, () => append(target, ':host { box-shadow: 0 0 4px var(--paep-color-scrim); }')]], /raw length|shadow without/],
  ['N13', 'S04', 'transition duration literal', [[target, () => append(target, ':host { transition: opacity 300ms ease; }')]], /motion duration without a motion token/],
  ['N14', 'S05', 'deep import of another package', [['packages/components/src/lib/card/card.ts', (t) => `import { PAEP_TOKENS } from '@proseit/paep-foundation/src/lib/tokens/token-catalogue.generated';\n${t}`]], /deep import/],
  ['N15', 'S05', 'component imports a later-milestone package', [['packages/components/src/lib/card/card.ts', (t) => `import '@proseit/frappe-sdk';\n${t}`]], /later milestone|components may import only/],
  ['N16', 'S05', 'foundation imports @angular/common', [['packages/foundation/src/lib/layout/breakpoints.ts', (t) => `import { NgIf } from '@angular/common';\n${t}`]], /foundation may import only/],
  ['N17', 'S05', 'axe-core imported by an app', [['apps/ui-lab/src/app/pages/home.ts', (t) => `import 'axe-core';\n${t}`]], /imports test tooling axe-core/],
  ['N18', 'S06', 'PrimeNG class in a component', [['packages/components/src/lib/card/card.ts', (t) => `${t}\n// class="p-button"\nconst x = 'primeng';\n`]], /forbidden term/],
  ['N19', 'S06', 'Angular favicon restored', [['apps/ui-lab/public/favicon.ico', 'x']], /favicon\.ico/],
  ['N20', 'S07', 'specimen removed', [['apps/ui-lab/src/app/specimens/pagination.specimen.ts', null]], /pagination: specimen file missing/],
  ['N21', 'S07', 'specimen not registered', [['apps/ui-lab/src/app/specimens/registry.ts', (t) => t.replace(/import \{[^}]*\} from '\.\/tabs\.specimen';\n/, '')]], /tabs: not registered/],
  ['N36', 'S07', 'required UI-lab state removed from a specimen', [['apps/ui-lab/src/app/specimens/checkbox.specimen.ts', (t) => t.replace(/\n\s*'indeterminate[^\n]*/, '')]], /checkbox: required state "indeterminate" not documented/],
  ['N22', 'S07', 'specimen without accessibility notes', [['apps/ui-lab/src/app/specimens/alert.specimen.ts', (t) => t.replace(/\baccessibility:/, 'a11yNotes:')]], /alert: meta\.accessibility missing/],
  ['N23', 'S08', 'content key removed', [['packages/components/src/lib/messages/messages.ts', (t) => t.replace(/^\s+'paep\.table\.detailsFor':.*\n/m, '')]], /paep\.table\.detailsFor missing/],
  ['N24', 'S09', 'focused test', [['packages/components/src/lib/tabs/tabs.spec.ts', (t) => t.replace(/\bit\(/, 'it.only(')]], /focused or skipped/],
  ['N25', 'S09', 'skipped test', [['packages/components/src/lib/button/button.spec.ts', (t) => t.replace(/\bit\(/, 'it.skip(')]], /focused or skipped/],
  ['N26', 'S05', 'double-quoted later-milestone import', [['packages/components/src/lib/button/button.ts', (t) => `import { createClient } from "frappe-js-sdk";\n${t}`]], /later milestone/],
  ['N27', 'S04', 'literal in the second element of a styles array', [['packages/components/src/lib/dialog/dialog.ts', (t) => t.replace(/styles: `([\s\S]*?)`/, (_m, css) => `styles: [\`${css}\`, \`:host { color: #ff0000; margin-left: var(--paep-space-2); }\`]`)]], /colour literal[\s\S]*physical property|physical property[\s\S]*colour literal/],
  ['N28', 'S04', 'colour literal in a host style binding', [['packages/components/src/lib/button/button.ts', (t) => t.replace("'[style.min-inline-size.px]': 'lockedWidth()',", `$&\n    '[style.color]': '"#ff0000"',`)]], /colour literal "color: #ff0000;"/],
  ['N37', 'S04', 'colour literal in a single-quoted styles element', [['packages/components/src/lib/dialog/dialog.ts', (t) => t.replace(/styles: `([\s\S]*?)`/, (_m, css) => `styles: [\`${css}\`, ':host { color: #ff0000; }']`)]], /colour literal ":host \{ color: #ff0000; \}"/],
  ['N38', 'S04', 'colour literal in a double-quoted host style binding', [['packages/components/src/lib/button/button.ts', (t) => t.replace("'[style.min-inline-size.px]': 'lockedWidth()',", `$&\n    "[style.color]": "'#ff0000'",`)]], /colour literal "color: #ff0000;"/],
  ['N39', 'S04', "host '[style]' object binding", [['packages/components/src/lib/divider/divider.ts', (t) => t.replace("class: 'paep-divider',", `$&\n    '[style]': 'custom',`)]], /host '\[style\]' object binding/],
  ['N40', 'S04', 'static host style key', [['packages/components/src/lib/divider/divider.ts', (t) => t.replace("class: 'paep-divider',", `$&\n    style: 'color: #ff0000',`)]], /static host 'style' key/],
  ['N41', 'S04', '@HostBinding on a style property', [['packages/components/src/lib/divider/divider.ts', (t) => `${t}\nclass PaepX { @HostBinding('style.color') c = '#ff0000'; }\n`]], /@HostBinding\('style…'\)/],
  ['N42', 'S04', 'static style attribute in a component .html template', [['packages/components/src/lib/tabs/tabs.html', (t) => t.replace('<div class="paep-tabs__bar">', '<div class="paep-tabs__bar" style="margin-left: 12px">')]], /tabs\.html: static style attribute/],
  ['N43', 'S04', 'colour literal in a template style binding', [['packages/components/src/lib/card/card.ts', (t) => t.replace(/template: `/, `template: \`<span [style.color]="'#f00'"></span>`)]], /card\.ts: colour literal "color: #f00;"/],
  ['N44', 'S04', 'colour literal assigned through element.style in code', [['packages/components/src/lib/popover/popover.ts', (t) => t.replace('this.host.style.insetBlockStart = `${top}px`;', "$&\n    this.host.style.color = '#ff0000';")]], /popover\.ts: colour literal "color: #ff0000;"/],
  ['N45', 'S05', 'template-literal dynamic import of a later-milestone package', [['packages/components/src/lib/card/card.ts', (t) => `${t}\nexport const lazy = () => import(\`@proseit/frappe-sdk\`);\n`]], /imports @proseit\/frappe-sdk \(later milestone\)/],
  ['N46', 'S05', 'dynamic import with a computed specifier', [['packages/components/src/lib/card/card.ts', (t) => `${t}\nconst pkg = 'x';\nexport const lazy = () => import(pkg);\n`]], /dynamic import with a computed specifier/],
  ['N47', 'S05', 'component imports a domain kit package', [['packages/components/src/lib/card/card.ts', (t) => `import '@proseit/paep-domain-sales';\n${t}`]], /imports @proseit\/paep-domain-sales \(later milestone\)/],
  ['N48', 'S02', 'approved status colour lightened in the token catalogue (contrast pair no longer backed by a token)', [['packages/foundation/src/lib/tokens/token-catalogue.generated.ts', (t) => t.replaceAll('"#16693A"', '"#7FBF95"')]], /contrast pair "status-success-fg \/ status-success-bg": #16693A is not a token value/, ['S12']],
  ['N34', 'S01', 'handoff file and its pin line edited together', [['evidence/design-handoff/HOF-IB2-001/design-export/decision-record.md', (t) => `${t}\nextra\n`], ['evidence/design-handoff/HOF-IB2-001/HANDOFF-FILES.sha256', (t) => t.replace(/^[0-9a-f]{64}(  design-export\/decision-record\.md)$/m, `${'0'.repeat(64)}$1`)]], /HANDOFF-FILES\.sha256 sha256 .* != pinned/],
  ['N35', 'S10', 'clickable non-interactive element in a component template', [['packages/components/src/lib/card/card.ts', (t) => t.replace(/template: `/, 'template: `<div class="x" (click)="noop()">Open</div>')]], /\(click\) on <div> without native interactive semantics/],
  ['N30', 'S04', 'component reads a foundation-internal reference token', [['packages/components/src/lib/pagination/pagination.css', (t) => `${t}\n:host { background: var(--paep-ref-color-neutral-100); }\n`]], /foundation-internal reference token --paep-ref-color-neutral-100/],
  ['N31', 'S05', 'component stylesheet imports a package path', [['packages/components/src/lib/pagination/pagination.css', (t) => `@import '@proseit/paep-foundation/src/styles/paep-tokens.css';\n${t}`]], /CSS @import @proseit\/paep-foundation/],
  ['N32', 'S01', 'unpinned file added to the approved handoff', [['evidence/design-handoff/HOF-IB2-001/design-export/extra-screen.md', '# not approved\n']], /extra-screen\.md is not in the pinned list/],
  ['N29', 'S09', 'expected-to-fail test', [['packages/components/src/lib/card/card.spec.ts', (t) => t.replace(/\bit\(/, 'it.fails(')]], /focused or skipped/],
];

let failures = 0;
if (!base.every((r) => r.pass)) {
  console.log(`FAIL C00 positive control: unmutated repository fails ${base.filter((r) => !r.pass).map((r) => r.id).join(', ')}`);
  failures++;
} else console.log('PASS C00 positive control: unmutated repository passes every check');
// A case may name other checks that must fail with it (N03: an edited token source is both unpinned and undeployed;
// N48: a changed accepted colour also breaks the IB3 S12 pin of the accepted token catalogue).
for (const [id, check, label, edits, expect, alsoFail = []] of cases) {
  const overlay = new Map();
  for (const [f, e] of edits) overlay.set(f, e === null ? null : typeof e === 'string' ? e : e(real.exists(f) ? real.read(f) : ''));
  const res = runChecks(makeFs(undefined, overlay));
  const r = res.find((x) => x.id === check);
  const others = res.filter((x) => x.id !== check && !alsoFail.includes(x.id) && x.pass !== baseById[x.id]).map((x) => x.id);
  const missing = alsoFail.filter((a) => res.find((x) => x.id === a)?.pass !== false);
  const unchanged = [...overlay].every(([f, v]) => v !== null && real.exists(f) && real.read(f) === v);
  const ok = !unchanged && r && !r.pass && expect.test(r.details) && others.length === 0 && missing.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${label}: ${check} ${r?.pass ? 'passed' : 'failed'}${others.length ? `; also changed ${others.join(', ')}` : ''}${missing.length ? `; expected ${missing.join(', ')} to fail too` : ''}${!ok && r ? ` — ${r.details.slice(0, 200)}` : ''}${unchanged ? ' (mutation did not apply)' : ''}`);
}
console.log(`\nPAEP design-system negative suite: ${failures ? 'FAIL' : 'PASS'} (${cases.length + 1 - failures}/${cases.length + 1})`);
process.exit(failures ? 1 : 0);
