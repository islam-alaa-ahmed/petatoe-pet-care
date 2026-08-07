#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),failures=[];
const runtime=fs.readFileSync(path.join(root,'smart/smart-language-runtime.js'),'utf8');
const business=fs.readFileSync(path.join(root,'i18n/localization-center/business-data.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
function req(src,re,msg){if(!re.test(src))failures.push(msg)}function forbid(src,re,msg){if(re.test(src))failures.push(msg)}
req(runtime,/domOwner:'PETATOE_LOCALIZATION_RUNTIME'/,'Smart Reports must delegate DOM localization to the canonical localization facade.');
req(runtime,/PETATOE_LOCALIZATION_RUNTIME\.applySubtree/,'Visible Smart Reports DOM must use the canonical DOM translator facade.');
req(runtime,/scheduleCharts\(root,lang,token\)/,'Chart localization must remain deferred and deduplicated.');
req(runtime,/captureChartSource/,'Chart source labels must be preserved for AR restoration.');
req(runtime,/petatoe:smart-tab-rendered/,'Rendered Smart Reports tabs must receive localization.');
forbid(runtime,/MutationObserver/,'Smart Reports must not own a second DOM MutationObserver.');
forbid(runtime,/FRAGMENTS_EN/,'Smart Reports must not own a hardcoded English phrase catalog.');
forbid(runtime,/renderSmartReports\s*\(/,'Language runtime must not trigger a full Smart Reports render.');
forbid(runtime,/clearCache\s*\(/,'Language runtime must not clear calculation caches.');
forbid(business,/PETATOE_I18N/,'Business display localization must remain isolated from the DOM i18n engine.');
req(index,/smart\/smart-language-runtime\.js\?v=/,'Smart language runtime must remain registered in the app shell.');
const result={status:failures.length?'FAILED':'PASSED',checks:11,failures};fs.writeFileSync(path.join(root,'SMART_REPORTS_TRANSLATION_STABILITY_RESULTS.json'),JSON.stringify(result,null,2));
if(failures.length){console.error('Smart Reports Translation Stability: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}console.log('Smart Reports Translation Stability: PASSED — 11/11');
