#!/usr/bin/env bash
# usage: runlog.sh <logname> <workdir> <command...>
# Writes a log with a standard header and trailing EXIT_CODE.
export PATH=/opt/node24/bin:$PATH
QA=/tmp/claude-0/-home-claude-proseit-paep/baa00b7b-0d6c-562c-abda-fc0d973cf425/scratchpad/qa3
LOG="$QA/$1"; shift
WD="$1"; shift
{
  echo "# date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# node: $(node --version) npm: $(npm --version)"
  echo "# HEAD: $(git -C "$WD" rev-parse HEAD 2>/dev/null)"
  echo "# cwd: $WD"
  echo "# cmd: $*"
  echo
} > "$LOG"
( cd "$WD" && bash -c "$*" ) >> "$LOG" 2>&1
rc=$?
echo "EXIT_CODE=$rc" >> "$LOG"
exit $rc
