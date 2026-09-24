#!/bin/bash
export PATH=/opt/node24/bin:$PATH
R=<scratch>/qa6/repo
O=<scratch>/qa6/outside
cd $R
reset() { git checkout -q -- . ; git clean -qfd -e node_modules; rm -rf $O packages/components/src/node_modules packages/components/node_modules tooling/wp04-outside apps/rogue-app packages/rogue; }
run() { echo "== $1"; node tooling/architecture-boundaries/check-boundaries.mjs --json > <scratch>/qa6/out.json 2><scratch>/qa6/err.txt; echo "exit=$?"; node -e 'try{const j=require(process.argv[1]);console.log("ok="+j.ok);for(const v of j.violations)console.log(" ",v.rule,"|",v.message)}catch(e){console.log("NOJSON");console.log(require("fs").readFileSync(process.argv[2],"utf8").slice(0,300))}' <scratch>/qa6/out.json <scratch>/qa6/err.txt; reset; }
EVIL="import '@proseit/paep-enterprise';
export {};"
reset
# P6 project-root node_modules symlink (legit skip) no import
mkdir -p packages/components/node_modules; ln -s ../../../tooling packages/components/node_modules/foo
run "P6 project-root node_modules symlink, not imported (false-positive control)"
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
mkdir -p packages/components/node_modules; ln -s ../../../tooling/wp04-outside packages/components/node_modules/evil; echo "import 'evil/use';" >> packages/components/src/index.ts
run "P6b project-root node_modules symlink, bare import"
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
mkdir -p packages/components/node_modules; ln -s ../../../tooling/wp04-outside packages/components/node_modules/evil; echo "import '../node_modules/evil/use';" >> packages/components/src/index.ts
run "P6c project-root node_modules symlink, relative import"
# P7 apps
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
ln -s ../../../tooling/wp04-outside apps/reference-app/src/evil; echo "import './evil/use';" >> apps/reference-app/src/main.ts
run "P7 dir symlink in apps/reference-app/src"
ln -s ../tooling apps/rogue-app
run "P7b apps/rogue-app is a symlink"
# P8 hard link
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
ln tooling/wp04-outside/use.ts packages/components/src/evil.ts; echo "import './evil';" >> packages/components/src/index.ts
run "P8 hard link in src"
# P9 package.json is a directory
rm packages/components/package.json; mkdir packages/components/package.json
run "P9 package.json is a directory (R5-L1)"
rm packages/components/package.json; mkdir packages/components/package.json; echo "import '#x';" >> packages/components/src/index.ts
run "P9b package.json directory + #x import"
# P10 R5-L1 app package.json dir + #x
mkdir apps/reference-app/package.json; echo "import '#x';" >> apps/reference-app/src/main.ts
run "P10 apps/reference-app/package.json is a directory + #x import (R5-L1)"
mkdir apps/reference-app/package.json
run "P10b apps/reference-app/package.json directory, no # import"
git status --short
