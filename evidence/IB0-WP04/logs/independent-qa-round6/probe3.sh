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
# P11 app root is symlink, target app imports ui-lab file (should be ENTRY_BYPASS) and contains nested symlink
mkdir -p $O; cp -a apps/reference-app $O/ra; rm -rf apps/reference-app; ln -s $O/ra apps/reference-app
run "P11 apps/reference-app root is a symlink, clean content"
mkdir -p $O tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts; cp -a apps/reference-app $O/ra; rm -rf apps/reference-app; ln -s $O/ra apps/reference-app
echo "import '../../ui-lab/src/main';" >> $O/ra/src/main.ts
run "P11b symlinked app root, target imports ui-lab internals"
mkdir -p $O tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts; cp -a apps/reference-app $O/ra; rm -rf apps/reference-app; ln -s $O/ra apps/reference-app
ln -s /tmp $O/ra/src/inner
run "P11c symlinked app root containing a nested symlink"
echo "import '../../../apps/rogue-app/x';" >> packages/components/src/index.ts; mkdir -p $O/rog; echo "$EVIL" > $O/rog/x.ts; ln -s $O/rog apps/rogue-app
run "P12 components imports into unclassified symlinked apps/rogue-app"
git status --short
