#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const failures=[];
const runtime=fs.readFileSync(path.join(root,'smart/smart-language-runtime.js'),'utf8');
const business=fs.readFileSync(path.join(root,'i18n/localization-center/business-data.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const localizationRuntime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
const runtimeVersionMatch=localizationRuntime.match(/\bVERSION\s*=\s*['"]([^'"]+)['"]/);
const expectedRuntimeVersion=runtimeVersionMatch?runtimeVersionMatch[1]:'';
function requireText(src,text,msg){if(!src.includes(text))failures.push(msg);}
function forbid(src,re,msg){if(re.test(src))failures.push(msg);}
if(!expectedRuntimeVersion)failures.push('Canonical localization runtime version is missing.');
else requireText(runtime,`version:'${expectedRuntimeVersion}'`,'Smart language runtime version mismatch.');
requireText(runtime,'translateRoot(root,lang);','Visible text and attributes must be translated synchronously.');
requireText(runtime,'scheduleCharts(root,lang,token);','Chart repaint must remain deferred and deduplicated.');
requireText(runtime,'petatoe:smart-tab-rendered','Rendered tabs must receive localization.');
requireText(runtime,"observer.observe(area,{subtree:true,childList:true,characterData:true});",'Dynamic localization observer must be scoped to Smart Reports only.');
requireText(runtime,'Promise.resolve().then(flushPending);','Dynamic mutations must be batched before paint.');
forbid(runtime,/renderSmartReports\s*\(/,'Language runtime must not trigger a full Smart Reports render.');
forbid(runtime,/clearCache\s*\(/,'Language runtime must not clear calculation caches.');
forbid(runtime,/observer\.observe\((document|document\.body)/,'Observer must never scan the full document.');
forbid(business,/PETATOE_I18N/,'Business display localization must not call the legacy PETATOE_I18N API.');
if(expectedRuntimeVersion)requireText(index,`smart/smart-language-runtime.js?v=${expectedRuntimeVersion}`,'Smart language runtime cache token mismatch.');
const result={status:failures.length?'FAILED':'PASSED',checks:11,failures};
fs.writeFileSync(path.join(root,'SMART_REPORTS_TRANSLATION_STABILITY_RESULTS.json'),JSON.stringify(result,null,2));
if(failures.length){console.error('Smart Reports Translation Stability: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Smart Reports Translation Stability: PASSED — 11/11');
