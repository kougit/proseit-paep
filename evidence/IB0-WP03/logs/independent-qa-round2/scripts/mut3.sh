set -u
cd /tmp/claude-0/-home-claude-proseit-paep/e14f03b0-cc84-56f3-a148-d5ff9a9d45bb/scratchpad/qa2/mut
reset(){ git checkout -q -- . ; git clean -fdq -e node_modules; rm -rf dist .angular; }
verify(){ node tooling/verification/verify-ib0-wp03.mjs --static-only > /tmp/v.$$ 2>&1; rc=$?; grep '^FAIL' /tmp/v.$$ | cut -c1-220; tail -1 /tmp/v.$$; echo "VERIFIER_EXIT=$rc"; }
flag(){ node -e "const fs=require('fs'),ts=require('typescript');const p=process.argv[1];const c=ts.parseConfigFileTextToJson('x',fs.readFileSync(p,'utf8')).config;$2;fs.writeFileSync(p,JSON.stringify(c,null,2))" "$1"; }
echo "=== P0 positive control"; reset; verify
echo "=== R1 noCheck: true (root)"; reset; flag tsconfig.json "c.compilerOptions.noCheck=true"; verify
echo "=== R2 allowUnreachableCode: true (root)"; reset; flag tsconfig.json "c.compilerOptions.allowUnreachableCode=true"; verify
echo "=== R3 allowUnusedLabels: true (root)"; reset; flag tsconfig.json "c.compilerOptions.allowUnusedLabels=true"; verify
echo "=== R4 extendedDiagnostics.defaultCategory: suppress (root)"; reset; flag tsconfig.json "c.angularCompilerOptions.extendedDiagnostics={defaultCategory:'suppress'}"; verify
echo "=== R5 uppercase // @TS-NOCHECK in packages/foundation/src/index.ts"; reset; sed -i '1i // @TS-NOCHECK' packages/foundation/src/index.ts; verify
echo "=== R6 uppercase // @TS-NOCHECK in apps/reference-app/src/app/app.ts"; reset; sed -i '1i // @TS-NOCHECK' apps/reference-app/src/app/app.ts; verify
echo "=== R7 mixed-case // @Ts-Ignore in packages/contracts/src/index.ts"; reset; sed -i '1i // @Ts-Ignore' packages/contracts/src/index.ts; verify
echo "=== N1 (new) angularCompilerOptions.typeCheckHostBindings: false added (root)"; reset; flag tsconfig.json "c.angularCompilerOptions.typeCheckHostBindings=false"; verify
echo "=== N2 (new) per-check extended diagnostic suppression {checks:{invalidBananaInBox:'suppress'}}"; reset; flag tsconfig.json "c.angularCompilerOptions.extendedDiagnostics={checks:{invalidBananaInBox:'suppress'}}"; verify
echo "=== N3 (new) top-level 'exclude' added to root tsconfig"; reset; flag tsconfig.json "c.exclude=['packages/**']"; verify
echo "=== N4 (new) noCheck: true set in apps/ui-lab/tsconfig.app.json only"; reset; flag apps/ui-lab/tsconfig.app.json "c.compilerOptions.noCheck=true"; verify
echo "=== N5 (new) skipDefaultLibCheck: true added (root, unlisted option)"; reset; flag tsconfig.json "c.compilerOptions.skipDefaultLibCheck=true"; verify
reset; rm -f /tmp/v.$$; git status --porcelain
