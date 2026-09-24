#!/bin/bash
# usage: run.sh logname dir cmd...
export PATH=/opt/node24/bin:$PATH
L=/tmp/claude-0/-home-claude-proseit-paep/e14f03b0-cc84-56f3-a148-d5ff9a9d45bb/scratchpad/qa-logs/$1.log; shift; D=$1; shift
cd "$D"
{ echo "# date: $(date -u +%FT%TZ)"; echo "# node: $(node -v) npm: $(npm -v)"; echo "# dir: $D commit: $(git rev-parse HEAD 2>/dev/null)"; echo "# cmd: $*"; echo; } > $L
bash -o pipefail -c "$*" >> $L 2>&1; rc=$?
echo "EXIT_CODE=$rc" >> $L
echo "EXIT_CODE=$rc ($L)"
