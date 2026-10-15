import os, sys, json
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/HOF-IB3-001'
import screens, boards
os.makedirs(OUT + '/screens/renders', exist_ok=True)
states = screens.build() + boards.build()
plan = []
# DWP §7: 1440 / 834 / 640 / 320 for every screen whose layout changes. Shell states drawn at desktop get all four.
FOUR = ['desktop', 'tablet', 'zoom200', 'narrow320']
FULLSET = {'SCR-SHELL-%03d' % n for n in (1, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 22)}
for s in states:
    if s['sid'] in FULLSET and 'desktop' in s['viewports']:
        s['viewports'] = FOUR + [v for v in s['viewports'] if v not in FOUR]
for s in states:
    open(f'{OUT}/screens/{s["file"]}', 'w').write(s['html'])
    plan.append({k: s[k] for k in ('sid', 'state', 'file', 'viewports', 'full', 'reduced', 'title')})
json.dump(plan, open(f'{OUT}/screens/plan.json', 'w'), indent=1)
print(len(plan), 'states', sum(len(p['viewports']) for p in plan), 'renders')
