#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..');
const failures=[]; const pass=(ok,msg)=>{console.log(`${ok?'PASS':'FAIL'} - ${msg}`); if(!ok) failures.push(msg);};
const forbidden=['index-css-control-test.html','index-css-fontless-test.html'];
pass(forbidden.every(f=>!fs.existsSync(path.join(root,f))), 'No CSS test HTML artifacts are published at repository root');
const stale=path.join(root,'maintenance/navigation-permissions.js');
if(fs.existsSync(stale)){
 const live=fs.readFileSync(path.join(root,'navigation/navigation-permissions.js'),'utf8');
 const old=fs.readFileSync(stale,'utf8');
 pass(old===live, 'Maintenance navigation permissions cannot diverge from canonical mapping');
}else pass(true,'No stale maintenance navigation permissions copy');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/test-contracts.json'),'utf8'));
pass(manifest.active.length===new Set(manifest.active).size,'Active contract list has no duplicates');
pass(manifest.active.every(f=>fs.existsSync(path.join(root,'scripts',f))), 'Every active CI contract exists');
let bad=[];
for(const f of manifest.active){
 const t=fs.readFileSync(path.join(root,'scripts',f),'utf8');
 if(/\/mnt\/data\/[A-Za-z0-9_.-]+/.test(t)) bad.push(f);
}
pass(bad.length===0, `Active test infrastructure has no hardcoded /mnt/data paths${bad.length?': '+bad.join(', '):''}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
pass(!/index-css-(?:control|fontless)-test\.html/.test(html),'Production HTML does not reference test pages');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
pass(!!cfg.runtimeContracts.testContracts,'Phase 16 test contract version is registered');
if(failures.length){console.error(`Phase 16 production contract: FAILED (${failures.length})`);process.exit(1);} console.log('Phase 16 production contract: PASSED');
