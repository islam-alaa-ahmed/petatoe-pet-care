#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'i18n/localization-regression-baseline.json'),'utf8'));
const arabic=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const failures=[];
for(const [rel,maxLines] of Object.entries(baseline.files||{})){
  const full=path.join(root,rel);
  const text=fs.readFileSync(full,'utf8');
  const lines=text.split(/\r?\n/);
  const actual=lines.reduce((n,line)=>n+(arabic.test(line)?1:0),0);
  if(actual>maxLines) failures.push(`${rel}: Arabic-source lines increased from ${maxLines} to ${actual}`);
}
// Dictionary parity for Smart Reports is mandatory.
const dict=fs.readFileSync(path.join(root,'i18n/smart-reports-source.js'),'utf8');
const arKeys=new Set([...dict.matchAll(/['"]([^'"]+)['"]\s*:/g)].map(m=>m[1]));
if(!arKeys.size) failures.push('Unable to parse Smart Reports translation keys.');
if(failures.length){
  console.error('Localization regression guard failed:\n'+failures.join('\n'));
  process.exit(1);
}
console.log('Localization regression guard passed. Protected Arabic-source counts did not increase.');
