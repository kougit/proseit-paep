#!/usr/bin/env bash
# Round 3: README index vs files at HEAD, retained QA copies, statuses and closure wording.
Q2=/tmp/claude-0/-home-claude-proseit-paep/baa00b7b-0d6c-562c-abda-fc0d973cf425/scratchpad/qa2
echo "== README"; git show HEAD:evidence/IB0-WP04/README.md
echo "== README-indexed paths"
for p in $(git show HEAD:evidence/IB0-WP04/README.md | grep -oE '`(reports|logs)/[^`]+`' | tr -d '`' | sort -u); do git cat-file -e HEAD:evidence/IB0-WP04/${p%/} 2>/dev/null && echo "OK      $p" || echo "MISSING $p"; done
echo "== evidence files not indexed (excluding retained QA folders)"
for f in $(git ls-tree -r --name-only HEAD evidence/IB0-WP04 | sed 's#evidence/IB0-WP04/##' | grep -vE '^logs/independent-qa-round[12]/|^README.md$'); do git show HEAD:evidence/IB0-WP04/README.md | grep -qF "$f" || echo "unindexed $f"; done
echo "== retained round-2 copies byte-identical to reviewer originals"
cmp <(git show HEAD:evidence/IB0-WP04/reports/independent-qa-round2.md) $Q2/independent-qa-round2.md && echo "round2 report identical"
n=0; d=0; for f in $(cd $Q2 && ls *.log *.json scripts/*); do n=$((n+1)); cmp -s <(git show HEAD:evidence/IB0-WP04/logs/independent-qa-round2/$f 2>/dev/null) $Q2/$f || { d=$((d+1)); echo "DIFF $f"; }; done; echo "$n files compared, $d differ"
echo "== reports/independent-qa.md"; git show HEAD:evidence/IB0-WP04/reports/independent-qa.md
echo "== statuses"; git show HEAD:work-packages/IB0-WP04/TRACEABILITY.csv | awk -F, 'NR>1{print $7}' | sort | uniq -c
git show HEAD:work-packages/IB0-WP04/work-package.json | grep -E '"status"|independent_qa|criteria'
echo "== ACCEPTANCE_REPORT defects/QA/residual lines"; git show HEAD:work-packages/IB0-WP04/ACCEPTANCE_REPORT.md | grep -nE "Commit|Independent QA|^D1|D1 \(|L4|residual|Residual|\(iii\)|R2-" | cut -c1-400
echo "== technical-verification header/defects"; git show HEAD:evidence/IB0-WP04/reports/technical-verification.md | grep -nE "Commit under test|^D1|D1 \(|R2-|AC28" | cut -c1-400
echo "== definition-audit README row / D1 wording"; git show HEAD:evidence/IB0-WP04/reports/definition-audit.md | grep -nE "^\| D1 |^\| D12" | cut -c1-300
echo "== commit fields"; for f in reports/ib0-wp04-verification.json reports/negative-tests.json; do git show HEAD:evidence/IB0-WP04/$f | grep -m1 '"commit"'; done; git show HEAD:evidence/IB0-WP04/logs/clean-clone-reproduction.log | head -1
