#!/usr/bin/env bash
# Round 2 build-level demonstrations in the scratch copy (cwd).
export PATH=/opt/node24/bin:$PATH
T=$(mktemp -d)
restore() { git checkout -q -- . ; git clean -fdq; git clean -fdqx -- packages apps; rm -rf dist .angular; }
case_run() {
  echo "=================== $1: $2"; git status --porcelain
  node tooling/architecture-boundaries/check-boundaries.mjs > $T/a 2>&1; arc=$?; tail -4 $T/a; echo "arch:check EXIT=$arc"
  npx ng build reference-app --configuration production > $T/b 2>&1; rc=$?
  grep -E "ERROR|TS[0-9]{4}|Output location|bundle generation" $T/b | head -8; echo "ng build EXIT=$rc"
}
for variant in "./src/lib/*" "./src/lib/*.ts"; do
node -e "const f='packages/components/package.json';const p=JSON.parse(require('fs').readFileSync(f));p.imports={'#lib/*':process.argv[1]};require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\\n')" "$variant"
mkdir -p packages/components/src/lib; printf "export const qaX = 'x';\n" > packages/components/src/lib/x.ts
printf "import { qaX } from '#lib/x';\nexport const qaU = qaX;\n" >> packages/components/src/index.ts
printf "import { qaU } from '@proseit/paep-components';\nconsole.log(qaU);\n" >> apps/reference-app/src/main.ts
case_run "R1 ($variant)" "legitimate intra-package #lib/* subpath pattern, import '#lib/x' (expect arch:check 0)"; restore
done
node -e "const f='packages/components/package.json';const p=JSON.parse(require('fs').readFileSync(f));p.imports={'#ent':'@proseit/paep-enterprise'};require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
printf "\nexport const qaEnt = 'enterprise';\n" >> packages/enterprise/src/index.ts
printf "import { qaEnt } from '#ent';\nexport const qaFromEnt = qaEnt;\n" >> packages/components/src/index.ts
printf "import { qaFromEnt } from '@proseit/paep-components';\nconsole.log(qaFromEnt);\n" >> apps/reference-app/src/main.ts
case_run R2 "#ent -> bare '@proseit/paep-enterprise' (checker misses; does the build accept it?)"; restore
echo "--- final status"; git status --porcelain --ignored | grep -v node_modules; rm -rf $T
