#!/usr/bin/env python3
"""Enumerate all elementary cycles over allowed (Yes/Optional, different-category) edges of the model matrix."""
import json, sys, itertools
m = json.load(open(sys.argv[1] + '/tooling/architecture-boundaries/architecture-model.json'))
cols = m['matrix']['matrixColumns']; rows = m['matrix']['rows']
adj = {a: [b for j, b in enumerate(cols) if b != a and rows[a][j] in ('Yes', 'Optional')] for a in cols}
cycles = set()
def dfs(start, v, path):
    for w in adj[v]:
        if w == start: cycles.add(tuple(path))
        elif w not in path and cols.index(w) > cols.index(start): dfs(start, w, path + [w])
for s in cols: dfs(s, s, [s])
print('elementary cycles over allowed category edges:', sorted(cycles, key=len))
print('3+-category cycles:', [c for c in cycles if len(c) >= 3] or 'none')
