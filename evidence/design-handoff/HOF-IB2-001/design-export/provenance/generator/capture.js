const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const dir=process.argv[2], out=process.argv[3];
const VP=[['desktop',1440,900],['tablet',834,1112],['zoom200',640,900],['narrow320',320,640]];
const OVER=/C06|R02D/;
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const res=[];
 for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.html')).sort()){
  for(const [name,w,h] of VP){
   const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'no-preference'});
   const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
   await p.goto('file://'+path.resolve(dir,f)); await p.waitForTimeout(150);
   const m=await p.evaluate(()=>{
     const de=document.documentElement; const vw=de.clientWidth;
     const offenders=[]; document.querySelectorAll('button,a,input,select,textarea,[tabindex]').forEach(el=>{const r=el.getBoundingClientRect(); if(r.width===0||r.height===0)return; let n=el,clipped=false; while(n&&n!==document.body){const cs=getComputedStyle(n); if(/(auto|scroll|hidden)/.test(cs.overflowX)&&n.scrollWidth>n.clientWidth){clipped=true;break} n=n.parentElement} if(!clipped&&(r.right>vw+1||r.left<-1))offenders.push((el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,40))});
     const small=[]; document.querySelectorAll('button,a[href],input,select,textarea').forEach(el=>{const r=el.getBoundingClientRect(); if(r.width===0)return; let t=el; if(el.matches('input[type=checkbox],input[type=radio]')) t=el.closest('label')||el; const rr=t.getBoundingClientRect(); if((rr.height<23.5||rr.width<23.5)&&!el.closest('.paep-dialog__body p, .lab-table, .notes, .lab-nav')&&!(el.tagName==='A'&&getComputedStyle(el).display==='inline'))small.push((el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,30)+' '+Math.round(rr.width)+'x'+Math.round(rr.height))});
     return {scrollWidth:de.scrollWidth, clientWidth:vw, offscreen:offenders.slice(0,5), smallTargets:small.slice(0,5), nSmall:small.length};
   });
   const shot=`${out}/${f.replace('.html','')}--${name}.png`;
   if(name!=='zoom200') await p.screenshot({path:shot, fullPage:!OVER.test(f)});
   res.push({file:f,viewport:name,width:w,...m,pageErrors:errs,hScroll:m.scrollWidth>m.clientWidth});
   await ctx.close();
  }
 }
 for(const f of ['F05-motion.html','C05-feedback.html']){
  const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}); const p=await ctx.newPage();
  await p.goto('file://'+path.resolve(dir,f)); await p.waitForTimeout(150);
  const anim=await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);
  const dur=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--paep-motion-duration-slow').trim());
  await p.screenshot({path:`${out}/${f.replace('.html','')}--desktop-reduced-motion.png`,fullPage:true});
  res.push({file:f,viewport:'desktop-reduced-motion',runningAnimations:anim,durationSlow:dur}); await ctx.close();
 }
 fs.writeFileSync(out+'/../render-check.json',JSON.stringify(res,null,1));
 await b.close();
})();
