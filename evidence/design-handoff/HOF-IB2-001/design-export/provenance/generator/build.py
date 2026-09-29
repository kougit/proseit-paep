import os, pages5, icons as I, shell
OUT='out/HOF-IB2-001'
os.makedirs(OUT+'/screens',exist_ok=True); os.makedirs(OUT+'/assets/icons',exist_ok=True)
for sid,f,t,g in shell.SCREENS:
    open(f'{OUT}/screens/{f}','w').write(pages5.P[sid])
for n in I.ICONS: open(f'{OUT}/assets/icons/paep-icon-{n}.svg','w').write(I.standalone(n))
open(f'{OUT}/assets/icons/paep-icons.sprite.svg','w').write(I.sprite().replace(' style="display:none" aria-hidden="true"','')+'\n')
print('ok')
