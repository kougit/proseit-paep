#!/usr/bin/env node
// Independent QA mutation harness for IB0-WP04. Run with cwd = a scratch copy of the clone (never the author tree).
// Each case writes/appends files, runs `node tooling/architecture-boundaries/check-boundaries.mjs --json`,
// records exit code and rules, then restores with `git checkout -- . && git clean -fdq`.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { createRequire } from 'node:module';
const ts = createRequire(path.join(process.cwd(), 'package.json'))('typescript');
const root = process.cwd();
const E = (d) => `packages/${d}/src/index.ts`;
const APP = 'apps/reference-app/src/app/app.ts';
const A = (s) => ({ append: s });
const W = (s) => ({ write: s });
const J = (fn) => ({ json: fn });
const LONG = (tag) => `// ${tag}\nexport function wp04QaFormatter(value: number, width: number): string {\n  const rounded = Math.round(value * 100) / 100;\n  const padded = rounded.toFixed(2).padStart(width, ' ');\n  const clipped = padded.length > width + 8 ? padded.slice(0, width + 8) : padded;\n  return clipped.replace(/\\s+$/, '') + ' units';\n}\n`;
const cases = [
  ['C01b', 'contracts: new file starting with /// <reference lib="dom" /> then document', { 'packages/contracts/src/lib/dom.ts': W('/// <reference lib="dom" />\nexport const t = document.title;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C01c', 'contracts: new file starting with /// <reference types="node" />', { 'packages/contracts/src/lib/nodey.ts': W('/// <reference types="node" />\nexport const e = process.env;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C09', 'contracts: declare const window then use it', { 'packages/contracts/src/lib/decl.ts': W('declare const window: { location: { href: string } };\nexport const h = window.location.href;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['V03b', 'app copies package source (>=200 chars) with only a comment changed', { 'packages/components/src/lib/fmt.ts': W(LONG('original')), 'apps/reference-app/src/app/fmt.ts': W(LONG('copied')) }, 1, ['COPIED_CODE']],
  ['V04b', 'app copies package source (>=200 chars) identical up to whitespace', { 'packages/components/src/lib/fmt.ts': W(LONG('same')), 'apps/reference-app/src/app/fmt.ts': W(LONG('same').replace(/\n  /g, '\n\t\t')) }, 1, ['COPIED_CODE']],
  ['V05', 'app copies package source (>=200 chars) with one identifier renamed', { 'packages/components/src/lib/fmt.ts': W(LONG('same')), 'apps/reference-app/src/app/fmt.ts': W(LONG('same').replace(/clipped/g, 'cut')) }, 1, ['COPIED_CODE']]
];

const results = [];
const run = () => spawnSync(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json'], { cwd: root, encoding: 'utf8' });
const restore = () => { spawnSync('git', ['checkout', '--', '.'], { cwd: root }); spawnSync('git', ['clean', '-fdq'], { cwd: root }); spawnSync('git', ['clean', '-fdqx', '--', 'packages', 'apps'], { cwd: root }); };
const parseJ = (t) => ts.parseConfigFileTextToJson('x.json', t).config;
for (const [id, name, edits, wantExit, wantRules, absent = []] of cases) {
  restore();
  for (const [f, op] of Object.entries(edits)) {
    const p = path.join(root, f); fs.mkdirSync(path.dirname(p), { recursive: true });
    if (op === null) fs.rmSync(p);
    else if (op.write !== undefined) fs.writeFileSync(p, op.write);
    else if (op.append !== undefined) fs.appendFileSync(p, `${op.append}\n`);
    else if (op.json) { const o = parseJ(fs.readFileSync(p, 'utf8')); op.json(o); fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); }
  }
  const r = run();
  let parsed = null; try { parsed = JSON.parse(r.stdout); } catch {}
  const rules = parsed ? [...new Set(parsed.violations.map((v) => v.rule))].sort() : ['<unparsable>'];
  const ok = r.status === wantExit && wantRules.every((x) => rules.includes(x)) && !absent.some((x) => rules.includes(x));
  results.push({ id, name, wantExit, wantRules, absent, exit: r.status, rules, ok, violations: parsed ? parsed.violations.map((v) => `${v.rule}: ${v.message}${v.where ? ` [${v.where}]` : ''}`) : [r.stderr.slice(0, 400)] });
}
restore();
for (const x of results) {
  console.log(`${x.ok ? 'AS-EXPECTED' : 'UNEXPECTED '} ${x.id} ${x.name} — expected exit ${x.wantExit}${x.wantRules.length ? ` with ${x.wantRules.join('+')}` : ''}${x.absent.length ? ` without ${x.absent.join('+')}` : ''}; got exit ${x.exit} rules [${x.rules.join(', ')}]`);
  for (const v of x.violations) console.log(`      ${v}`);
}
const unexpected = results.filter((x) => !x.ok).map((x) => x.id);
console.log(`\nQA mutations: ${results.length} cases; as expected ${results.length - unexpected.length}; unexpected: ${unexpected.join(', ') || 'none'}`);
fs.writeFileSync(process.env.QA_JSON || '/dev/null', JSON.stringify(results, null, 2));
process.exit(0);
