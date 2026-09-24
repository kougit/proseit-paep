import { readConfiguration } from '@angular/compiler-cli';
import ts from 'typescript'; import path from 'node:path';
for (const app of ['reference-app','ui-lab']) {
  const c = readConfiguration(path.resolve(`apps/${app}/tsconfig.app.json`));
  const o=c.options; const keys=['strict','noImplicitAny','strictNullChecks','strictFunctionTypes','strictBindCallApply','strictPropertyInitialization','noImplicitThis','useUnknownInCatchVariables','alwaysStrict','strictBuiltinIteratorReturn','noCheck','strictTemplates','strictInjectionParameters','strictInputAccessModifiers','skipLibCheck','noImplicitOverride','noImplicitReturns','noFallthroughCasesInSwitch','noPropertyAccessFromIndexSignature'];
  console.log(app, 'errors', c.errors.length, JSON.stringify(Object.fromEntries(keys.map(k=>[k,o[k]]))));
  const bad=[]; for (const p of Object.keys(o.paths||{})) { const r=ts.resolveModuleName(p, path.resolve(`apps/${app}/src/main.ts`), o, ts.sys).resolvedModule; if(!r || !r.resolvedFileName.endsWith(p.replace('@proseit/','').replace('paep-','')+'/src/index.ts')) bad.push(p+'->'+(r&&r.resolvedFileName)); }
  console.log(app,'paths',Object.keys(o.paths||{}).length,'bad',bad);
}
