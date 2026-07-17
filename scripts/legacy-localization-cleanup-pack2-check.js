#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const includeExt=new Set(['.js','.html']);
const ignored=new Set(['.git','node_modules']);
const failures=[];
let checked=0;
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(ent.name))continue;
    const full=path.join(dir,ent.name);
    if(ent.isDirectory())walk(full);
    else if(includeExt.has(path.extname(ent.name))){
      checked++;
      const rel=path.relative(root,full).replace(/\\/g,'/');
      const src=fs.readFileSync(full,'utf8');
      const patterns=[
        [/\bsmartReportT\s*\(/g,'legacy smartReportT call'],
        [/window\.smartReportT\b/g,'global smartReportT adapter'],
        [/\bbusinessDataT\s*\(/g,'legacy businessDataT call'],
        [/window\.businessDataT\b/g,'global businessDataT adapter'],
        [/function\s+smartReportInterpolate\s*\(/g,'dead smart report interpolation helper']
      ];
      for(const [re,label] of patterns) if(re.test(src)) failures.push(`${rel}: ${label}`);
    }
  }
}
walk(root);
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
if(!/function smart\(key,fallback,params\)/.test(runtime)||!/smart:smart/.test(runtime)) failures.push('Unified center smart() API is missing');
const core=fs.readFileSync(path.join(root,'smart/smart-reports-core.js'),'utf8');
if(!/PETATOE_LOCALIZATION_CENTER\.smart\(/.test(core)) failures.push('Smart Reports Core is not routed directly through center.smart()');
if(failures.length){console.error('Legacy Localization Cleanup Pack 2 Check: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(`Legacy Localization Cleanup Pack 2 Check: Passed (${checked} source files scanned)`);
