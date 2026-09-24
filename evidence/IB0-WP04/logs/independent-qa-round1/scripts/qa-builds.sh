#!/usr/bin/env bash
# Independent QA: build-level demonstrations in the scratch copy (cwd). Restores with git checkout/clean after each case.
export PATH=/opt/node24/bin:$PATH
restore() { git checkout -q -- . ; git clean -fdq; rm -rf dist .angular; }
case_run() { # id, description
  echo "=================== $1: $2"
  echo "--- git status"; git status --porcelain
  echo "--- arch:check"; node tooling/architecture-boundaries/check-boundaries.mjs > /tmp/paep-wp04-qa-580y7m/a.out 2>&1; arc=$?; tail -5 /tmp/paep-wp04-qa-580y7m/a.out; echo "arch:check EXIT=$arc"
  echo "--- ng build reference-app --configuration production"
  npx ng build reference-app --configuration production > /tmp/paep-wp04-qa-580y7m/b.out 2>&1; rc=$?
  grep -E "ERROR|TS[0-9]{4}|error|Output location|bundle generation" /tmp/paep-wp04-qa-580y7m/b.out | head -12
  echo "ng build EXIT=$rc"
}
restore
# S1: WP03 strictness still effective: implicit-any parameter in an app file must fail the production build
printf '\nexport function qaImplicitAny(x) { return x; }\n' >> apps/reference-app/src/app/app.ts
case_run S1 "implicit any parameter in apps/reference-app/src/app/app.ts (expect build exit 1, TS7006)"; restore
# S2: strict null violation in a package reached through the tsconfig.base.json alias
printf "import { qaPkg } from '@proseit/paep-components';\nexport const qaUse = qaPkg;\n" >> apps/reference-app/src/app/app.ts
printf "\nexport const qaPkg: string = null;\n" >> packages/components/src/index.ts
case_run S2 "strictNullChecks violation in packages/components reached via alias (expect build exit 1, TS2322)"; restore
# S3: strictTemplates violation in the app template
printf '\n{{ title().noSuchMember }}\n' >> apps/reference-app/src/app/app.html
case_run S3 "template type error (expect build exit 1)"; restore
# B1: forbidden components -> enterprise edge hidden in packages/components/src/dist/, used by the app
mkdir -p packages/components/src/dist
printf "import { qaEnt } from '@proseit/paep-enterprise';\nexport const qaFromEnt = qaEnt;\n" > packages/components/src/dist/impl.ts
printf "\nexport * from './dist/impl';\n" >> packages/components/src/index.ts
printf "\nexport const qaEnt = 'enterprise';\n" >> packages/enterprise/src/index.ts
printf "import { qaFromEnt } from '@proseit/paep-components';\nconsole.log(qaFromEnt);\n" >> apps/reference-app/src/main.ts
case_run B1 "components -> enterprise edge placed in a nested 'dist' folder (checker should exit 1)"; restore
# B2: forbidden components -> enterprise edge in a hand-written .d.ts that the entry point re-exports
mkdir -p packages/components/src/lib
printf "import type { QaEnt } from '@proseit/paep-enterprise';\nexport type QaFromEnt = QaEnt;\n" > packages/components/src/lib/types.d.ts
printf "\nexport type { QaFromEnt } from './lib/types';\n" >> packages/components/src/index.ts
printf "\nexport interface QaEnt { id: string }\n" >> packages/enterprise/src/index.ts
printf "import type { QaFromEnt } from '@proseit/paep-components';\nexport const qaT: QaFromEnt = { id: 'x' };\n" >> apps/reference-app/src/app/app.ts
case_run B2 "components -> enterprise type edge in a .d.ts file (checker should exit 1)"; restore
# B3: contracts uses DOM via /// <reference lib="dom" />, reached by the app
mkdir -p packages/contracts/src/lib
printf '/// <reference lib="dom" />\nexport const qaTitle = (): string => document.title;\n' > packages/contracts/src/lib/dom.ts
printf "\nexport * from './lib/dom';\n" >> packages/contracts/src/index.ts
printf "import { qaTitle } from '@proseit/paep-contracts';\nconsole.log(qaTitle());\n" >> apps/reference-app/src/main.ts
case_run B3 "contracts uses document via /// <reference lib=\"dom\" /> (checker should exit 1)"; restore
# B4: triple-slash reference path from components into enterprise source
printf '/// <reference path="../../enterprise/src/index.ts" />\n' | cat - packages/components/src/index.ts > /tmp/paep-wp04-qa-580y7m/t && cp /tmp/paep-wp04-qa-580y7m/t packages/components/src/index.ts && rm /tmp/paep-wp04-qa-580y7m/t
case_run B4 "components pulls enterprise source by /// <reference path> (checker should exit 1)"; restore
echo "--- final git status"; git status --porcelain
