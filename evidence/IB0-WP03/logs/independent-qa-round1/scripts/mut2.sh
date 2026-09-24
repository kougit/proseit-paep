set -u
cd /tmp/claude-0/-home-claude-proseit-paep/e14f03b0-cc84-56f3-a148-d5ff9a9d45bb/scratchpad/qa/mut
reset(){ git checkout -q -- . ; git clean -fdq -e node_modules; rm -rf dist .angular; }
verify(){ node tooling/verification/verify-ib0-wp03.mjs --static-only > /tmp/v.$$ 2>&1; rc=$?; grep '^FAIL' /tmp/v.$$ | cut -c1-240; tail -1 /tmp/v.$$; echo "VERIFIER_EXIT=$rc"; }
build(){ node node_modules/@angular/cli/bin/ng.js build reference-app --configuration production > /tmp/b.$$ 2>&1; rc=$?; grep -E "TS[0-9]{4}|NG[0-9]{4}" /tmp/b.$$ | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-160 | head -4; echo "BUILD_EXIT=$rc"; }
flag(){ node -e "const fs=require('fs'),ts=require('typescript');const c=ts.parseConfigFileTextToJson('x',fs.readFileSync('tsconfig.json','utf8')).config;$1;fs.writeFileSync('tsconfig.json',JSON.stringify(c,null,2))"; }
echo "=== M10 '// @TS-NOCHECK' (uppercase) added to packages/foundation/src/index.ts (a WP03-permitted path)"; reset; sed -i '1i // @TS-NOCHECK' packages/foundation/src/index.ts; head -3 packages/foundation/src/index.ts; verify
echo "=== M10b same with lowercase '// @ts-nocheck' (control: should be caught by V07)"; reset; sed -i '1i // @ts-nocheck' packages/foundation/src/index.ts; verify
echo "=== M1b noCheck:true + Angular template strict violation (repo runner's wp03Take mutation)"; reset; flag "c.compilerOptions.noCheck=true"; sed -i 's/\n}\s*$//' apps/reference-app/src/app/app.ts; sed -i "s#^}\$#  protected wp03Take(value: number): number { return value; }\n}#" apps/reference-app/src/app/app.ts; sed -i 's#</main>#  <button type="button" (click)="wp03Take($event)">x</button>\n</main>#' apps/reference-app/src/app/app.html; build
echo "--- M1b control: same template mutation WITHOUT noCheck (expect fail)"; git checkout -q -- tsconfig.json; build
reset; rm -f /tmp/v.$$ /tmp/b.$$; git status --porcelain
