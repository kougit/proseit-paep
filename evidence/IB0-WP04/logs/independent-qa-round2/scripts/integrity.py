#!/usr/bin/env python3
"""Independent QA: controlled-source SHA-256/size vs PACK_MANIFEST.json, unlisted files."""
import hashlib, json, os, sys
R = sys.argv[1]; m = json.load(open(os.path.join(R, 'PACK_MANIFEST.json')))
ctl = [f for f in m['files'] if f['path'] == '.gitignore' or f['path'].startswith('.paep-control/')]
bad = 0
for f in ctl:
    p = os.path.join(R, f['path']); b = open(p, 'rb').read()
    ok = hashlib.sha256(b).hexdigest() == f['sha256'] and len(b) == f['bytes']
    bad += not ok; print('OK ' if ok else 'BAD', f['path'], len(b))
listed = {f['path'] for f in ctl}
for d, _, fs in os.walk(os.path.join(R, '.paep-control')):
    for x in fs:
        rp = os.path.relpath(os.path.join(d, x), R)
        if rp not in listed: bad += 1; print('UNLISTED', rp)
print(f'{len(ctl) - 0}/{len(ctl)} listed; problems: {bad}'); sys.exit(1 if bad else 0)
