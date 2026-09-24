#!/bin/bash
# usage: probe.sh name realnm(0/1) 'setup commands'
export PATH=/opt/node24/bin:$PATH
Q=<scratch>/qa10
P=$Q/probes/$1
mkdir -p $Q/probes
[ -e "$P" ] && { echo "exists $P"; exit 1; }
cp -a $Q/base "$P"
if [ "$2" = 1 ]; then rm "$P/node_modules"; mkdir "$P/node_modules"; for e in <repo>/node_modules/* <repo>/node_modules/.[!.]*; do ln -s "$e" "$P/node_modules/$(basename "$e")"; done; fi
cd "$P" && bash -c "$3"
cd "$P" && node -e "
import('./tooling/architecture-boundaries/check-boundaries.mjs').then(m=>{const r=m.checkBoundaries(process.cwd());console.log('$1', r.ok?'PASS':'FAIL', JSON.stringify(r.violations.map(v=>v.rule+': '+v.message)))})"
