#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'test-contracts.json'),'utf8'));
let failed=[];
for(const file of manifest.active){
 console.log(`\n=== ${file} ===`);
 const r=cp.spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit'});
 if(r.status!==0) failed.push(file);
}
if(failed.length){console.error(`\nActive contract suite FAILED: ${failed.join(', ')}`);process.exit(1);} console.log(`\nActive contract suite PASSED: ${manifest.active.length}/${manifest.active.length}`);
