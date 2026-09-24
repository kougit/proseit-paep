#!/bin/bash
# usage: probe.sh NAME 'setup commands run inside the case copy'
export PATH=/opt/node24/bin:$PATH
S=<scratch>/qa9
C=$S/cases/$1; rm -rf $C; mkdir -p $S/cases
mkdir -p $C; (cd $S/repo && tar cf - --exclude=./node_modules --exclude=./.git .) | (cd $C && tar xf -)
mkdir $C/node_modules
for e in <repo>/node_modules/* <repo>/node_modules/.bin; do ln -s "$e" $C/node_modules/; done
rm -f $C/node_modules/@proseit; mkdir $C/node_modules/@proseit
for e in <repo>/node_modules/@proseit/*; do ln -s ../../packages/$(readlink $e | sed 's#.*/packages/##') $C/node_modules/@proseit/$(basename $e); done
( cd $C && eval "$2" )
( cd $C && node tooling/architecture-boundaries/check-boundaries.mjs --json ) > $S/logs/$1.json 2>&1
echo "$1: ok=$(node -e "const j=require('$S/logs/$1.json');console.log(j.ok, JSON.stringify(j.summary.violationsByRule), 'edges='+j.summary.edges)" 2>&1)"
