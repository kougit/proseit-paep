// QA round 7 probes: strictness under the WP04 tsconfig hierarchy (D3/D4), static verifier only.
// Runs in ./repo; restores with git after each case. Reports which V-checks fail.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.join(here, 'repo');
const APP_TS = 'apps/reference-app/src/app/app.ts';
const APP_HTML = 'apps/reference-app/src/app/app.html';
const APP_TSC = 'apps/reference-app/tsconfig.app.json';
const set = (f, fn) => [f, fn];
const w = (text) => () => text;

const cases = [
  ['B01 extends chain inserted into app tsconfig (evil middle config strict:false)', [
    set('apps/reference-app/tsconfig.mid.json', w('{ "extends": "../../tsconfig.json", "compilerOptions": { "strict": false, "noImplicitAny": false } }')),
    set(APP_TSC, (t) => t.replace('"../../tsconfig.json"', '"./tsconfig.mid.json"'))]],
  ['B01b extends chain via permitted dir: tsconfig.json extends array [base, tooling/architecture-boundaries/x.json]', [
    set('tooling/architecture-boundaries/x.json', w('{ "compilerOptions": { "noCheck": true } }')),
    set('tsconfig.json', (t) => t.replace('"extends": "./tsconfig.base.json"', '"extends": ["./tsconfig.base.json", "./tooling/architecture-boundaries/x.json"]'))]],
  ['B01c tsconfig.base.json gains "extends" to a permitted-dir config', [
    set('tooling/architecture-boundaries/x.json', w('{ "compilerOptions": { "strict": false, "noCheck": true } }')),
    set('tsconfig.base.json', (t) => t.replace('{\n  "compilerOptions"', '{\n  "extends": "./tooling/architecture-boundaries/x.json",\n  "compilerOptions"'))]],
  ['B02 tsconfig.base.json option noCheck', [set('tsconfig.base.json', (t) => t.replace('"compilerOptions": {', '"compilerOptions": {\n    "noCheck": true,'))]],
  ['B02b tsconfig.base.json angularCompilerOptions.strictInputTypes false', [set('tsconfig.base.json', (t) => t.replace('{\n  "compilerOptions"', '{\n  "angularCompilerOptions": { "strictInputTypes": false },\n  "compilerOptions"'))]],
  ['B02c tsconfig.base.json duplicate compilerOptions key (first has strict:false)', [set('tsconfig.base.json', (t) => t.replace('{\n  "compilerOptions"', '{\n  "compilerOptions": { "strict": false },\n  "compilerOptions"'))]],
  ['B02d tsconfig.base.json unicode-escaped key "no\\u0043heck"', [set('tsconfig.base.json', (t) => t.replace('"compilerOptions": {', '"compilerOptions": {\n    "no\\u0043heck": true,'))]],
  ['B02e alias chained: paths value with two targets (entry + other package)', [set('tsconfig.base.json', (t) => t.replace('"./packages/components/src/index.ts"', '"./packages/components/src/index.ts", "./packages/enterprise/src/index.ts"'))]],
  ['B03 // @ts-expect-error in app', [set(APP_TS, (t) => `${t}\n// @ts-expect-error\nexport const qa7: string = 1;\n`)]],
  ['B04 template $any( in app.html', [set(APP_HTML, (t) => t.replace('</main>', '<span>{{ $any(1).x }}</span>\n</main>'))]],
  ['B04b template $any via unicode escape in an inline ts template', [set('apps/reference-app/src/app/qa7.ts', w("import { Component } from '@angular/core';\n@Component({ selector: 'qa7', template: '<span>{{ \\u0024any(1).x }}</span>' })\nexport class Qa7 {}\n"))]],
  ['B05 per-file // @ts-nocheck in app', [set(APP_TS, (t) => `// @ts-nocheck\n${t}`)]],
  ['B05b @Component jit:true (skips AOT template checking) in app', [set('apps/reference-app/src/app/qa7.ts', w("import { Component } from '@angular/core';\n@Component({ selector: 'qa7', jit: true, template: '<span>{{ nope.x }}</span>' })\nexport class Qa7 {}\n"))]],
  ['B05c @ts-nocheck in a gitignored file under apps (src/tmp/)', [set('apps/reference-app/src/tmp/qa7.ts', w('// @ts-nocheck\nexport const qa7 = (x) => x;\n'))]],
  ['B05d gitignored file under apps without directive (V17 blind spot)', [set('apps/reference-app/src/tmp/qa7.ts', w('export const qa7 = 1;\n'))]],
  ['B05e @ts-nocheck in a .htm templateUrl-style file under apps', [set('apps/reference-app/src/app/qa7.tpl', w('<span>{{ $any(1).x }}</span>\n'))]],
];

const sh = (cmd, args) => spawnSync(cmd, args, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
const out = [];
for (const [name, edits] of cases) {
  for (const [f, fn] of edits) { const p = path.join(repo, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, fn(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '')); }
  const r = sh(process.execPath, ['tooling/verification/verify-ib0-wp04.mjs', '--static-only']);
  const failed = r.stdout.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(0, 260));
  out.push(`${r.status === 0 ? 'NOT CAUGHT' : 'caught'} ${name}: exit ${r.status}\n${failed.map((l) => `    ${l}`).join('\n')}`);
  sh('git', ['checkout', '--', '.']);
  sh('git', ['clean', '-fdqx', '-e', 'node_modules', '--', 'apps', 'tooling', 'packages']);
}
const txt = out.join('\n');
fs.writeFileSync(path.join(here, 'probe-strict.log'), txt + '\n');
console.log(txt);
