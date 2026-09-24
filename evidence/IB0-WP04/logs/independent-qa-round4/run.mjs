import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const R = process.argv[2]; const cases = JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const comp = `${R}/packages/components`; const orig = fs.readFileSync(`${comp}/package.json`,'utf8');
for (const c of cases) {
  fs.rmSync(`${R}/qa-tmp-backup`, {recursive:true, force:true});
  fs.cpSync(`${R}/packages`, `${R}/qa-tmp-backup`, {recursive:true});
  const pj = JSON.parse(orig); if (c.imports !== undefined) pj.imports = c.imports;
  fs.writeFileSync(`${comp}/package.json`, JSON.stringify(pj,null,2));
  for (const [f, body] of Object.entries(c.files||{})) { fs.mkdirSync(path.dirname(`${R}/${f}`),{recursive:true}); fs.writeFileSync(`${R}/${f}`, body); }
  fs.appendFileSync(`${comp}/src/index.ts`, `\n${c.line}\n`);
  let out; try { out = execFileSync('node',['tooling/architecture-boundaries/check-boundaries.mjs','--json'],{cwd:R}).toString(); } catch(e){ out = e.stdout.toString() || e.stderr.toString(); }
  let j; try { j = JSON.parse(out); } catch { j = {ok:'ERR', violations:[{rule:'ERR',message:out.slice(0,300)}]}; }
  // run tsc resolution too
  console.log(`== ${c.id}: ${c.desc}\n   ok=${j.ok} ` + j.violations.map(v=>`${v.rule}: ${v.message.replace(R,'<R>')}`).join(' | '));
  fs.rmSync(`${R}/packages`,{recursive:true,force:true}); fs.renameSync(`${R}/qa-tmp-backup`, `${R}/packages`);
}
