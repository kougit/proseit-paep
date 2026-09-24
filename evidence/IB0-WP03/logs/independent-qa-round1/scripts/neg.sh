set -u
C=/tmp/claude-0/-home-claude-proseit-paep/e14f03b0-cc84-56f3-a148-d5ff9a9d45bb/scratchpad/qa/neg
cd $C
cp tsconfig.json /tmp/tsc.orig.$$; cp apps/reference-app/src/app/app.ts /tmp/app.orig.$$; cp apps/reference-app/src/app/app.html /tmp/html.orig.$$
restore(){ cp /tmp/tsc.orig.$$ tsconfig.json; cp /tmp/app.orig.$$ apps/reference-app/src/app/app.ts; cp /tmp/html.orig.$$ apps/reference-app/src/app/app.html; rm -f apps/reference-app/src/app/qa-child.ts; rm -rf dist .angular; }
build(){ node node_modules/@angular/cli/bin/ng.js build reference-app --configuration production > /tmp/out.$$ 2>&1; rc=$?; grep -E "TS[0-9]+|NG[0-9]+|error" /tmp/out.$$ | head -8; echo "BUILD_EXIT=$rc"; }
ts_mut(){ cat >> apps/reference-app/src/app/app.ts <<'X'

export class QaStrictProbe {
  qaProp: string;
  qaLen(x: string | undefined): number { return x.length; }
}
X
}
tpl_mut(){ cat > apps/reference-app/src/app/qa-child.ts <<'X'
import { Component, Input } from '@angular/core';
@Component({ selector: 'qa-child', template: '<span>{{ count }}</span>' })
export class QaChild { @Input({ required: true }) count!: number; }
X
sed -i "s#import { RouterOutlet } from '@angular/router';#import { RouterOutlet } from '@angular/router';\nimport { QaChild } from './qa-child';#; s#imports: \[RouterOutlet\]#imports: [RouterOutlet, QaChild]#; s#^}\$#  protected readonly qaText: string = 'not-a-number';\n}#" apps/reference-app/src/app/app.ts
sed -i 's#</main>#  <qa-child [count]="qaText" />\n</main>#' apps/reference-app/src/app/app.html
}
flag(){ node -e "const fs=require('fs'),ts=require('typescript');const c=ts.parseConfigFileTextToJson('x',fs.readFileSync('tsconfig.json','utf8')).config;$1;fs.writeFileSync('tsconfig.json',JSON.stringify(c,null,2))"; }

echo "=== Q0 positive control: unmodified copy"; restore; build
echo "=== Q1 TS strict violation (strictPropertyInitialization TS2564 + strictNullChecks TS18048), flags as committed"; restore; ts_mut; git diff --no-index /tmp/app.orig.$$ apps/reference-app/src/app/app.ts | tail -6; build
echo "=== Q1c control: same mutation, strict=false noImplicitAny=false"; restore; ts_mut; flag "c.compilerOptions.strict=false;c.compilerOptions.noImplicitAny=false"; build
echo "=== Q2 template violation (string bound to number @Input), flags as committed"; restore; tpl_mut; cat apps/reference-app/src/app/app.ts apps/reference-app/src/app/app.html; build
echo "=== Q2c control: same mutation, strictTemplates=false"; restore; tpl_mut; flag "c.angularCompilerOptions.strictTemplates=false"; build
echo "=== Q3 extra: nullable template access {{ qaMaybe.length }} with qaMaybe: string|null, committed flags"; restore; sed -i "s#^}\$#  protected readonly qaMaybe: string | null = null;\n}#" apps/reference-app/src/app/app.ts; sed -i 's#</main>#  <p>{{ qaMaybe.length }}</p>\n</main>#' apps/reference-app/src/app/app.html; build
echo "=== Q3c control: strictTemplates=false"; flag "c.angularCompilerOptions.strictTemplates=false"; build
restore; rm -f /tmp/*.orig.$$ /tmp/out.$$
