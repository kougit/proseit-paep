#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const root=process.cwd();
const manifestPath=path.join(root,'PACK_MANIFEST.json');
if(!fs.existsSync(manifestPath)) { console.error('PACK_MANIFEST.json missing'); process.exit(1); }
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
let ok=true;
for(const f of manifest.files){
  const p=path.join(root,f.path);
  if(!fs.existsSync(p)){ console.error('MISSING',f.path); ok=false; continue; }
  const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if(hash!==f.sha256){ console.error('HASH MISMATCH',f.path); ok=false; }
}
console.log(ok ? `PASS: ${manifest.files.length} pack files verified.` : 'FAIL: pack integrity errors found.');
process.exit(ok?0:1);
