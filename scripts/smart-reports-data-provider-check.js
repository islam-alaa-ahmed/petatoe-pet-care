'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const provider=read('smart/smart-reports-data-provider.js');
const core=read('inline-extracted/legacy-application-core.js');
const controller=read('smart/smart-reports-runtime-controller.js');
const tabs=read('smart/smart-tabs.js');
const checks=[
  ['provider loaded once',(index.match(/smart\/smart-reports-data-provider\.js/g)||[]).length===1],
  ['provider before services',index.indexOf('smart-reports-data-provider.js')<index.indexOf('smart/smart-services.js')],
  ['canonical API exported',/window\.PETATOESmartReportsData\s*=/.test(provider)],
  ['legacy row bridge exported',/window\.petatoeSmartReportsRows\s*=/.test(provider)],
  ['core reads provider',/PETATOESmartReportsData/.test(core)],
  ['controller reads provider',/PETATOESmartReportsData/.test(controller)],
  ['tabs read provider',/PETATOESmartReportsData/.test(tabs)],
  ['no business query in provider',!/\.from\s*\(|supabase\.from/.test(provider)]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed){console.error(`Smart Reports Data Provider certification failed: ${failed}`);process.exit(1);}
console.log(`Smart Reports Data Provider certification passed: ${checks.length}/${checks.length}`);
