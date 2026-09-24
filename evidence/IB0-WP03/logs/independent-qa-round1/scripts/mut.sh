set -u
cd /tmp/claude-0/-home-claude-proseit-paep/e14f03b0-cc84-56f3-a148-d5ff9a9d45bb/scratchpad/qa/mut
reset(){ git checkout -q -- . ; git clean -fdq -e node_modules; rm -rf dist .angular; }
verify(){ node tooling/verification/verify-ib0-wp03.mjs --static-only > /tmp/v.$$ 2>&1; rc=$?; grep '^FAIL' /tmp/v.$$ | cut -c1-240; tail -1 /tmp/v.$$; echo "VERIFIER_EXIT=$rc"; }
build(){ node node_modules/@angular/cli/bin/ng.js build reference-app --configuration production > /tmp/b.$$ 2>&1; rc=$?; grep -E "TS[0-9]{4}|NG[0-9]{4}" /tmp/b.$$ | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-160 | head -4; echo "BUILD_EXIT=$rc"; }
flag(){ node -e "const fs=require('fs'),ts=require('typescript');const c=ts.parseConfigFileTextToJson('x',fs.readFileSync('tsconfig.json','utf8')).config;$1;fs.writeFileSync('tsconfig.json',JSON.stringify(c,null,2))"; }
tsviol(){ printf '\nexport function qaViol(v) { const s: string = null; return s + v; }\n' >> apps/reference-app/src/app/app.ts; }
APP=apps/reference-app/src/app/app.ts

echo "=== P0 positive control (unmutated)"; reset; verify
echo "=== P0b build unmutated + TS violation (expect build fail)"; reset; tsviol; build

echo "=== M1 root compilerOptions adds \"noCheck\": true (new weakening key; WP §4(i) says no other key changes)"; reset; flag "c.compilerOptions.noCheck=true"; verify
echo "--- M1 effect on build with TS violation:"; tsviol; build

echo "=== M2 uppercase '// @TS-NOCHECK' at top of app.ts"; reset; sed -i '1i // @TS-NOCHECK' $APP; verify
echo "--- M2 effect on build with TS violation:"; tsviol; build

echo "=== M3 noImplicitAny moved from root to apps/reference-app/tsconfig.app.json"; reset; flag "delete c.compilerOptions.noImplicitAny"; node -e "const fs=require('fs'),ts=require('typescript');const p='apps/reference-app/tsconfig.app.json';const c=ts.parseConfigFileTextToJson('x',fs.readFileSync(p,'utf8')).config;c.compilerOptions.noImplicitAny=true;fs.writeFileSync(p,JSON.stringify(c,null,2))"; verify

echo "=== M4 duplicate key: textual \"strict\": false appended after existing \"strict\": true"; reset; sed -i 's/"noImplicitAny": true,/"noImplicitAny": true,\n    "strict": false,/' tsconfig.json; grep -n '"strict"' tsconfig.json; verify

echo "=== M5 entry point re-exports: packages/foundation/src/index.ts = 'export {} from \"./impl\";' + impl.ts"; reset; printf 'export {} from "./impl";\n' > packages/foundation/src/index.ts; printf 'export const x = 1;\n' > packages/foundation/src/impl.ts; verify

echo "=== M6 angularCompilerOptions.extendedDiagnostics.defaultCategory = suppress"; reset; flag "c.angularCompilerOptions.extendedDiagnostics={defaultCategory:'suppress'}"; verify

echo "=== M7 root compilerOptions adds allowUnreachableCode:true, allowUnusedLabels:true"; reset; flag "c.compilerOptions.allowUnreachableCode=true;c.compilerOptions.allowUnusedLabels=true"; verify

echo "=== M8 alias target with sub-path but no wildcard: '@proseit/paep-foundation/internal' -> packages/foundation/src/internal.ts"; reset; flag "c.compilerOptions.paths['@proseit/paep-foundation/internal']=['./packages/foundation/src/internal.ts']"; verify

echo "=== M9 '// @ts-ignore' in a .js file under apps (allowJs not set)"; reset; printf '// @ts-ignore\nconsole.log(1);\n' > apps/reference-app/src/qa.js; verify

reset; rm -f /tmp/v.$$ /tmp/b.$$; git status --porcelain
