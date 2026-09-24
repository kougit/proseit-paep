#!/usr/bin/env python3
"""Independent QA comparison of architecture-model.json against PAEP-IB-01 §6.1 and Appendix B.
Parses the controlled text by line position (not by the checker's own logic)."""
import json, os, re, sys
R = sys.argv[1]
text = open(os.path.join(R, '.paep-control/text/PAEP_IB_01_v1.0_text.md'), encoding='utf-8').read().splitlines()
model = json.load(open(os.path.join(R, 'tooling/architecture-boundaries/architecture-model.json')))
fails = 0
# ---- Appendix B
i = text.index('## Appendix B. Package Dependency Matrix')
rows = []
for line in text[i+1:]:
    if line.startswith('## '): break
    if line.startswith('|') and not line.startswith('| ---'):
        rows.append([c.strip() for c in line.strip().strip('|').split('|')])
hdr = rows[0][1:]
print('Appendix B header:', hdr)
body = rows[1:]
print('Appendix B rows:', len(body), 'cols:', len(hdr))
# Independent label mapping (hand-written, not from the model)
LABEL = {'contracts':'contracts','foundation':'foundation','platform':'platform','i18n':'i18n','observability':'observability',
         'components':'components','offline':'offline','frappe-sdk':'frappe-sdk','enterprise':'enterprise','analytics':'analytics',
         'domain-*':'domain','apps/*':'app'}
cols = model['matrix']['matrixColumns']
if [LABEL[h] for h in hdr] != cols:
    print('FAIL column order differs', [LABEL[h] for h in hdr], cols); fails += 1
cells = 0; mism = 0
for r in body:
    frm = LABEL[r[0]]
    vals = r[1:]
    assert len(vals) == 12, r
    mrow = model['matrix']['rows'][frm]
    for j, v in enumerate(vals):
        cells += 1
        to = LABEL[hdr[j]]
        mv = mrow[cols.index(to)]
        if mv != v:
            mism += 1; print(f'MISMATCH {frm}->{to}: text {v!r} model {mv!r}')
print(f'cells compared: {cells}; mismatches: {mism}')
if cells != 144 or mism: fails += 1
# Diagonal check and upper-triangle non-dash inventory
upper = []
for a, frm in enumerate(cols):
    for b, to in enumerate(cols):
        v = model['matrix']['rows'][frm][b]
        if a == b and v != '-': print('diag not -', frm); fails += 1
        if b > a and v != '-': upper.append(f'{frm}->{to}={v}')
print('upper-triangle (rightward) non-dash cells:', upper)
# ---- §6.1 layers
i = text.index('### 6.1 Layer definitions')
layer_of = {}
for line in text[i+1:]:
    if line.startswith('### '): break
    m = re.match(r'^\| (L\d) - [^|]+\| ([^|]+)\|', line)
    if m:
        for p in m.group(2).split(';'):
            p = p.strip()
            layer_of[p] = m.group(1)
print('§6.1 raw:', layer_of)
MAP61 = {'@proseit/paep-contracts':'contracts','@proseit/paep-foundation':'foundation','paep-platform':'platform','paep-i18n':'i18n',
         'paep-observability':'observability','paep-components':'components','paep-offline':'offline','frappe-sdk':'frappe-sdk',
         'paep-enterprise':'enterprise','paep-analytics':'analytics','paep-domain-*':'domain','apps/*':'app'}
for k, L in layer_of.items():
    cat = MAP61[k]
    ml = model['categories'][cat]['layer']
    print(f'  {cat}: §6.1 {L} model {ml}', 'OK' if L == ml else 'MISMATCH')
    if L != ml: fails += 1
if set(MAP61[k] for k in layer_of) != set(model['categories']): print('FAIL category set'); fails += 1
# ---- Conflict scan: Appendix B allowed edges vs §6.1 "May depend on"
# §6.1: L0 -> externals only; L1 -> L0 only; L2 -> L0-L1; L3 -> L0-L2; L4 -> L0-L3
maxdep = {'L0': -1, 'L1': 0, 'L2': 1, 'L3': 2, 'L4': 3}
conf = []
for frm in cols:
    for to in cols:
        v = model['matrix']['rows'][frm][cols.index(to)]
        if v in ('Yes', 'Optional'):
            lf = model['categories'][frm]['layer']; lt = model['categories'][to]['layer']
            if int(lt[1]) > maxdep[lf]:
                conf.append(f'{frm}({lf})->{to}({lt})={v}')
print('Appendix B allowed edges that §6.1 "May depend on" does not allow:', conf)
# ---- Classification vs disk
pk = sorted(d for d in os.listdir(os.path.join(R, 'packages')) if os.path.isdir(os.path.join(R, 'packages', d)))
ang = json.load(open(os.path.join(R, 'angular.json')))['projects']
proj = model['projects']
print('packages dirs:', len(pk), 'angular projects:', len(ang), 'model projects:', len(proj))
roots = {p['root']: p for p in proj}
for d in pk:
    p = roots.get(f'packages/{d}')
    name = json.load(open(os.path.join(R, 'packages', d, 'package.json')))['name']
    exp_cat = 'domain' if d.startswith('domain-') else d
    ok = p and p['name'] == name and p['category'] == exp_cat and p['tags'] == [f"layer:{model['categories'][exp_cat]['layer']}", f'type:{exp_cat}'] and p['projectType'] == 'library'
    print(f'  packages/{d}: {name} -> {p and p["category"]} {p and p["tags"]}', 'OK' if ok else 'FAIL')
    if not ok: fails += 1
for n, a in ang.items():
    p = [q for q in proj if q['name'] == n]
    ok = len(p) == 1 and p[0]['root'] == a['root'] and p[0]['category'] == 'app' and p[0]['tags'] == ['layer:L4', 'type:app']
    print(f'  app {n}: root {a["root"]}', 'OK' if ok else 'FAIL')
    if not ok: fails += 1
if len(proj) != len(pk) + len(ang): fails += 1; print('FAIL project count')
print('RESULT', 'PASS' if fails == 0 else f'FAIL ({fails})')
sys.exit(1 if fails else 0)
