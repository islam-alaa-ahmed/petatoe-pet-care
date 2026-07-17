#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const arabic=/[\u0600-\u06FF]/;
const direct=/\b(alert|confirm|prompt|toast|showToast|toastSafe|notify|showNotification)\s*\(\s*(['"])([^\n]*?[\u0600-\u06FF][^\n]*?)\2/g;
const skipPrefixes=['i18n'+path.sep,'scripts'+path.sep,'node_modules'+path.sep,'.git'+path.sep];
const violations=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    const rel=path.relative(root,full);
    if(skipPrefixes.some(p=>rel.startsWith(p))) continue;
    if(entry.isDirectory()) walk(full);
    else if(entry.isFile()&&entry.name.endsWith('.js')){
      const src=fs.readFileSync(full,'utf8');
      let m; while((m=direct.exec(src))) violations.push(`${rel}: ${m[1]}(${m[2]}${m[3].slice(0,80)}${m[2]})`);
    }
  }
}
walk(root);
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
if(!((release.includes('PETATOE v9.3.3')&&release.includes('ELC_V9_3_3_FINAL_BULK_SOURCE_MIGRATION'))||(release.includes('PETATOE v9.3.5')&&release.includes('ELC_V9_3_5_FINAL_RESIDUAL_LOCALIZATION_CLEANUP')))){
  console.error('Release metadata is not synchronized.'); process.exit(1);
}
if(violations.length){
  console.error(`Direct Arabic runtime message literals remaining: ${violations.length}`);
  violations.slice(0,50).forEach(v=>console.error(v));
  process.exit(1);
}
console.log('Final Bulk Source Migration Check: Passed');
console.log('Direct Arabic alert/confirm/prompt/toast/notification literals remaining: 0');
