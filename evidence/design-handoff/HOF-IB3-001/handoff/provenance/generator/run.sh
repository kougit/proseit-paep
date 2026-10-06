set -e
O=/mnt/project-files/ib3/handoff/HOF-IB3-001
rm -rf $O/screens
python3 build.py $O
NODE_PATH=/opt/node22/lib/node_modules node capture.js $O/screens $O/screens/renders $O/screens/plan.json $O/screens/rc-main.json > out/cap.log 2>&1
python3 finish.py $O
python3 -c "
import json;r=json.load(open('$O/screens/render-check.json'))['results']
for x in r:
  if x['hScroll'] or x['nOffscreen'] or x['nSmall'] or x['unnamed'] or x['pageErrors'] or not x['visibleH1']: print(x['screen'],x['state'],x['viewport'],x['offscreen'][:2],x['smallTargets'][:2],x['unnamed'][:2],x['pageErrors'][:1])"
