#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[
  ['i18n/localization-center/runtime.js',/window\.businessDataT\s*=/,'legacy global businessDataT adapter in localization runtime'],
  ['i18n/business-data-localization.js',/window\.businessDataT\s*=/,'duplicate businessDataT adapter in business localization'],
  ['smart/smart-reports-new-customers-real.js',/\bbusinessDataT\b/,'legacy businessDataT call in new customers report'],
  ['smart/smart-vehicles.js',/window\.smartReportT/,'legacy global smartReportT dependency in smart vehicles'],
  ['sales/sales-invoice-report.js',/window\.smartReportT/,'legacy global smartReportT dependency in sales invoice report'],
  ['sales/contract-candidates-dark-fix.js',/window\.smartReportT/,'legacy global smartReportT dependency in contract candidates module']
];
let failed=[];
for(const [file,re,label] of checks){const txt=fs.readFileSync(path.join(root,file),'utf8');if(re.test(txt))failed.push(`${file}: ${label}`);}
const required=[
  ['smart/smart-reports-new-customers-real.js','PETATOE_LOCALIZATION_CENTER'],
  ['smart/smart-vehicles.js','PETATOE_LOCALIZATION_CENTER'],
  ['sales/sales-invoice-report.js','PETATOE_LOCALIZATION_CENTER'],
  ['sales/contract-candidates-dark-fix.js','PETATOE_LOCALIZATION_CENTER']
];
for(const [file,token] of required){const txt=fs.readFileSync(path.join(root,file),'utf8');if(!txt.includes(token))failed.push(`${file}: missing ${token}`);}
if(failed.length){console.error('Legacy Localization Cleanup Pack 1 Check: FAILED');failed.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Legacy Localization Cleanup Pack 1 Check: Passed');
console.log('Removed global businessDataT adapters: 2');
console.log('Migrated external smartReportT dependencies: 3');
console.log('Migrated external businessDataT dependencies: 1');
