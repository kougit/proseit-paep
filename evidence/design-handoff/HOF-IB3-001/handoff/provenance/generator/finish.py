# Builds SCR-SHELL-019 from the main capture results and merges render-check.json.
import json, sys, subprocess, os
import boards
O = sys.argv[1]; S = O + '/screens'
main = json.load(open(S + '/rc-main.json'))
open(S + '/SCR-SHELL-019--board.html', 'w').write(boards.board019(main, S))
plan = [dict(sid='SCR-SHELL-019', state='board', file='SCR-SHELL-019--board.html', viewports=['desktop', 'narrow320'], full=True, reduced=False, title='320 px board')]
json.dump(plan, open(S + '/plan-019.json', 'w'))
env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
subprocess.run(['node', 'capture.js', S, S + '/renders', S + '/plan-019.json', S + '/rc-019.json'], env=env, check=True, capture_output=True)
extra = json.load(open(S + '/rc-019.json'))
allp = json.load(open(S + '/plan.json')) + plan
json.dump(allp, open(S + '/plan.json', 'w'), indent=1)
res = main + extra
bad = [x for x in res if x['hScroll'] or x['nOffscreen'] or x['nSmall'] or x['unnamed'] or x['pageErrors'] or not x['visibleH1']]
rc = {'handoffId': 'HOF-IB3-001', 'version': '1.0',
      'tool': 'Playwright (Chromium) structural checks; see accessibility-intent.md §Evidence limits',
      'checks': ['page-wide horizontal scroll (scrollWidth > clientWidth)', 'interactive element outside viewport (not inside a scroll container)',
                 'target smaller than 24x24 CSS px (WCAG 2.5.8; inline text links and board tables exempt)', 'interactive element without accessible name',
                 'landmark counts', 'exactly one visible h1', 'page script errors'],
      'notRun': 'axe-core or equivalent automated rule engine (not available in the design environment; mandatory at implementation stage: acceptance criterion AC-07 of the IB3 acceptance-criteria draft, pre-flight file 14)',
      'summary': {'states': len(allp), 'renders': len(res), 'withIssues': len(bad)}, 'results': res}
json.dump(rc, open(S + '/render-check.json', 'w'), indent=1)
for f in ('rc-main.json', 'rc-019.json', 'plan-019.json'): os.remove(S + '/' + f)
print(rc['summary'])
