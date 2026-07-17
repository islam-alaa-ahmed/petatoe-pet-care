'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'smart/smart-reports-core.js'),'utf8');
const source=fs.readFileSync(path.join(root,'i18n/smart-reports-source.js'),'utf8');
const context={window:{},CustomEvent:function(){},console};
context.window.window=context.window;
context.window.dispatchEvent=function(){};
context.window.addEventListener=function(){};
vm.createContext(context);
vm.runInContext(source,context,{filename:'smart-reports-source.js'});
const packs=context.window.PETATOE_SMART_REPORTS_TRANSLATIONS||{};
const ar=packs.ar||{}, en=packs.en||{};
const patterns=[/smartReportHtml\(\s*['"]([^'"]+)/g,/PETATOE_LOCALIZATION_CENTER\.smart\(\s*['"]([^'"]+)/g,/\.smart\(\s*['"]([^'"]+)/g];
const keys=new Set();
for(const pattern of patterns){let m;while((m=pattern.exec(core)))keys.add(m[1]);}
const dynamicPrefixes=new Set(['calendar.days.','calendar.months.','recovery.','risk.']);
const literalKeys=[...keys].filter(k=>!dynamicPrefixes.has(k)).sort();
const missingAr=literalKeys.filter(k=>!Object.prototype.hasOwnProperty.call(ar,k));
const missingEn=literalKeys.filter(k=>!Object.prototype.hasOwnProperty.call(en,k));
const arabicEn=Object.entries(en).filter(([,v])=>/[\u0600-\u06FF]/.test(String(v))).map(([k])=>k);
const mismatched=Object.keys(ar).filter(k=>!Object.prototype.hasOwnProperty.call(en,k)).concat(Object.keys(en).filter(k=>!Object.prototype.hasOwnProperty.call(ar,k)));
if(missingAr.length||missingEn.length||arabicEn.length||mismatched.length){
  console.error(JSON.stringify({missingAr,missingEn,arabicEn,mismatched},null,2));
  process.exit(1);
}
console.log('Source Migration Pack 1 Check: Passed');
console.log('Literal Smart Reports keys covered:',literalKeys.length);
console.log('Arabic/English dictionary keys:',Object.keys(ar).length+'/'+Object.keys(en).length);
