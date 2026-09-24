import fs from 'node:fs';
const t = fs.readFileSync('repo/.paep-control/text/PAEP_IB_01_v1.0_text.md','utf8');
const s = t.slice(t.indexOf('## Appendix B. Package Dependency Matrix'));
const lines = s.split('\n').slice(1); const rows=[];
for (const l of lines){ if(/^#{1,6} /.test(l)) break; if(l.startsWith('|') && !/^\|\s*---/.test(l)) rows.push(l.split('|').slice(1,-1).map(x=>x.trim())); }
const cols = rows[0].slice(1); const M={};
for (const r of rows.slice(1)) { M[r[0]]={}; r.slice(1).forEach((v,i)=>M[r[0]][cols[i]]=v); }
const ok=(a,b)=>a!==b && ['Yes','Optional'].includes(M[a][b]);
console.log('cols',cols.join(','));
const opt=[]; for(const a of cols) for(const b of cols) if(M[a][b]==='Optional' && cols.indexOf(b)>=0){ const la=cols.indexOf(a); opt.push(`${a}->${b}`);}
console.log('Optional cells:', opt.length, opt.join(' '));
// closure over category graph (excluding self)
const reach={}; for(const a of cols){ const seen=new Set(); const q=cols.filter(b=>ok(a,b)); const paths={}; q.forEach(b=>paths[b]=[a,b]);
 while(q.length){const n=q.shift(); if(seen.has(n)) continue; seen.add(n); for(const c of cols) if(ok(n,c)&&!paths[c]){paths[c]=[...paths[n],c]; q.push(c);} }
 reach[a]={seen,paths}; }
const bad=[]; for(const a of cols) for(const c of reach[a].seen) if(c!==a && !ok(a,c)) bad.push(`${a}->${c} [${M[a][c]}] via ${reach[a].paths[c].join('>')}`);
console.log('forbidden reachable pairs:', bad.length); bad.forEach(x=>console.log(' ',x));
// all 2-step chains producing forbidden pairs
const two=[]; for(const a of cols) for(const b of cols) for(const c of cols) if(a!==c&&ok(a,b)&&ok(b,c)&&!ok(a,c)) two.push(`${a}>${b}>${c} [${M[a][c]}]`);
console.log('2-step chains:',two.length); two.forEach(x=>console.log(' ',x));
// cycles in category graph (self-reach)
for(const a of cols) if(reach[a].seen.has(a)) console.log('cycle-capable:',a);
