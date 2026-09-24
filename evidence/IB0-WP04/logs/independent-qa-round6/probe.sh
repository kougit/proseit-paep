#!/bin/bash
export PATH=/opt/node24/bin:$PATH
R=<scratch>/qa6/repo
O=<scratch>/qa6/outside
cd $R
reset() { git checkout -q -- . ; git clean -qfd -e node_modules; rm -rf $O; }
run() { echo "== $1"; node tooling/architecture-boundaries/check-boundaries.mjs --json > <scratch>/qa6/out.json 2><scratch>/qa6/err.txt; echo "exit=$?"; node -e 'try{const j=require(process.argv[1]);console.log("ok="+j.ok);for(const v of j.violations)console.log(" ",v.rule,"|",v.message)}catch(e){console.log("NOJSON");console.log(require("fs").readFileSync(process.argv[2],"utf8").slice(0,300))}' <scratch>/qa6/out.json <scratch>/qa6/err.txt; reset; }
EVIL="import '@proseit/paep-enterprise';
export {};"
reset
# P1 R5-M1 repro dir symlink
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
ln -s ../../../tooling/wp04-outside packages/components/src/evil; echo "import './evil/use';" >> packages/components/src/index.ts
run "P1 dir symlink in src (R5-M1)"
# P2 file symlink
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
ln -s ../../../tooling/wp04-outside/use.ts packages/components/src/evil.ts; echo "import './evil';" >> packages/components/src/index.ts
run "P2 file symlink in src"
# P2b symlink to non-source (dangling)
ln -s /nonexistent packages/components/src/dangling
run "P2b dangling symlink"
# P3 project root is a symlink to outside dir with forbidden import
mkdir -p $O; cp -a packages/components $O/components; echo "$EVIL" >> $O/components/src/index.ts; sed -i 's/^export {};$//' $O/components/src/index.ts
rm -rf packages/components; ln -s $O/components packages/components
run "P3 project root packages/components is a symlink (target has forbidden import)"
# P3b project root symlink to clean copy (no forbidden import) - is symlink itself flagged?
mkdir -p $O; cp -a packages/components $O/components; rm -rf packages/components; ln -s $O/components packages/components
run "P3b project root symlink, clean content"
# P4 unclassified extra package that's a symlink
mkdir -p $O/rogue/src; echo '{"name":"@proseit/rogue","version":"0.0.0"}' > $O/rogue/package.json; echo "$EVIL" > $O/rogue/src/index.ts
ln -s $O/rogue packages/rogue
run "P4 unclassified packages/rogue symlink"
# P4b same, imported by components
mkdir -p $O/rogue/src; echo '{"name":"@proseit/rogue","version":"0.0.0"}' > $O/rogue/package.json; echo "$EVIL" > $O/rogue/src/index.ts
ln -s $O/rogue packages/rogue; echo "import '@proseit/rogue';" >> packages/components/src/index.ts
run "P4b components imports symlinked unclassified @proseit/rogue"
# P5 nested node_modules below src
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
mkdir -p packages/components/src/node_modules; ln -s ../../../../tooling/wp04-outside packages/components/src/node_modules/evil; echo "import './node_modules/evil/use';" >> packages/components/src/index.ts
run "P5 symlink in src/node_modules (relative import)"
mkdir -p tooling/wp04-outside; echo "$EVIL" > tooling/wp04-outside/use.ts
mkdir -p packages/components/src/node_modules; ln -s ../../../../tooling/wp04-outside packages/components/src/node_modules/evil; echo "import 'evil/use';" >> packages/components/src/index.ts
run "P5b symlink in src/node_modules (bare import)"
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
git status --short
