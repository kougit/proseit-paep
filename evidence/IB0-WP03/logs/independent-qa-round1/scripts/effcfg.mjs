import { readConfiguration } from '@angular/compiler-cli';
import ts from 'typescript';
import fs from 'node:fs';
const raw = fs.readFileSync('tsconfig.json','utf8');
const parsed = ts.parseConfigFileTextToJson('tsconfig.json', raw).config;
console.log('root literal compilerOptions.strict =', JSON.stringify(parsed.compilerOptions.strict), ' noImplicitAny =', JSON.stringify(parsed.compilerOptions.noImplicitAny));
console.log('root literal angularCompilerOptions.strictTemplates =', JSON.stringify(parsed.angularCompilerOptions.strictTemplates));
const ng = JSON.parse(fs.readFileSync('angular.json','utf8'));
for (const [p, cfg] of Object.entries(ng.projects)) {
  const tc = cfg.architect.build.options.tsConfig;
  const r = readConfiguration(tc);
  const o = r.options;
  console.log(`${p} (${tc}): errors=${r.errors.length} strict=${o.strict} noImplicitAny=${o.noImplicitAny} strictNullChecks=${o.strictNullChecks} strictPropertyInitialization=${o.strictPropertyInitialization} strictTemplates=${o.strictTemplates} fullTemplateTypeCheck=${o.fullTemplateTypeCheck} aot(prod)=${cfg.architect.build.configurations?.production?.aot ?? cfg.architect.build.options.aot ?? '(builder default: true)'} rootNames=${r.rootNames.length}`);
}
