#!/usr/bin/env bash
# Round 3 build-level probes in the scratch copy (cwd): does the production build accept the imports-map form, and what does arch:check say?
export PATH=/opt/node24/bin:$PATH
T=$(mktemp -d)
restore() { git checkout -q -- . ; git clean -fdq; git clean -fdqx -- packages apps; rm -rf dist .angular; }
setimports() { node -e "const f='packages/components/package.json';const p=JSON.parse(require('fs').readFileSync(f));p.imports=JSON.parse(process.argv[1]);require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')" "$1"; }
case_run() {
  echo "=================== $1: $2"; git status --porcelain; grep -A3 '"imports"' packages/components/package.json
  node tooling/architecture-boundaries/check-boundaries.mjs > $T/a 2>&1; arc=$?; grep -E "VIOLATION|PAEP architecture" $T/a | head -5; echo "arch:check EXIT=$arc"
  npx ng build reference-app --configuration production > $T/b 2>&1; rc=$?
  grep -E "ERROR|TS[0-9]{4}|Output location|bundle generation" $T/b | head -6; echo "ng build EXIT=$rc"
  if [ $rc -eq 0 ]; then grep -l "qa-enterprise-marker" dist/reference-app/browser/*.js >/dev/null 2>&1 && echo "enterprise code IN bundle: yes" || echo "enterprise code IN bundle: no"; fi
}
prep() { # $1 = specifier used by components
  mkdir -p packages/components/src/lib/b
  printf "export const qaX = 'components-local-marker';\n" > packages/components/src/lib/x.ts
  printf "export const qaX = 'components-local-b-marker';\n" > packages/components/src/lib/b/x.ts
  printf "\nexport const qaX = 'qa-enterprise-marker';\n" >> packages/enterprise/src/index.ts
  printf "import { qaX } from '$1';\nexport const qaU = qaX;\n" >> packages/components/src/index.ts
  printf "import { qaU } from '@proseit/paep-components';\nconsole.log(qaU);\n" >> apps/reference-app/src/main.ts
}
restore
setimports '{"#lib/*":"./src/lib/*.ts"}'; prep '#lib/x'; case_run R2-L2 "legit #lib/* pattern (expect arch:check 0, build 0)"; restore
setimports '{"#ent":"@proseit/paep-enterprise"}'; prep '#ent'; case_run R2-L1 "#ent -> bare enterprise (expect arch:check 1)"; restore
setimports '{"#ent":{"import":"@proseit/paep-enterprise","default":"./src/lib/x.ts"}}'; prep '#ent'; case_run M03 "conditional import->enterprise, default->local"; restore
setimports '{"#ent":{"browser":"@proseit/paep-enterprise","default":"./src/lib/x.ts"}}'; prep '#ent'; case_run M04 "conditional browser->enterprise, default->local"; restore
setimports '{"#a/*":"./src/lib/*.ts","#a/b/*":"@proseit/paep-enterprise"}'; prep '#a/b/x'; case_run M10 "less specific pattern first; import #a/b/x"; restore
echo "--- final status"; git status --porcelain --ignored | grep -v node_modules; rm -rf $T
