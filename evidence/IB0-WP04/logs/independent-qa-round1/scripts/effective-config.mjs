// Independent QA: effective tsconfig of each angular.json build via @angular/compiler-cli readConfiguration.
import fs from 'node:fs'; import path from 'node:path';
const root = process.cwd();
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const ngc = await import(pathToFileURL(createRequire(path.join(root, 'package.json')).resolve('@angular/compiler-cli')).href);
const angular = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
let bad = 0;
for (const [n, p] of Object.entries(angular.projects)) {
  const cfg = ngc.readConfiguration(path.join(root, p.architect.build.options.tsConfig));
  const o = cfg.options; const paths = Object.keys(o.paths || {});
  console.log(`${n}: errors=${cfg.errors.length} strict=${o.strict} noImplicitAny=${o.noImplicitAny} strictTemplates=${o.strictTemplates} baseUrl=${o.baseUrl} paths=${paths.length}`);
  for (const k of paths) console.log(`   ${k} -> ${JSON.stringify(o.paths[k])}`);
  if (cfg.errors.length || o.strict !== true || o.noImplicitAny !== true || o.strictTemplates !== true || paths.length !== 18) bad++;
}
console.log(bad ? 'RESULT FAIL' : 'RESULT PASS'); process.exit(bad ? 1 : 0);
