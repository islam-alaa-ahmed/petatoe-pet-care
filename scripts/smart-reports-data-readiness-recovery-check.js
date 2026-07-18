const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const guard=fs.readFileSync(path.join(root,'smart/smart-reports-open-refresh-guard.js'),'utf8');
const router=fs.readFileSync(path.join(root,'smart/smart-router.js'),'utf8');
const checks=[
  ['30-second readiness window',/DATA_WAIT_TIMEOUT_MS=30000/.test(guard)],
  ['last valid rows cache',/lastValidRows/.test(guard)&&/restoreLastValidRows/.test(guard)],
  ['loading does not replace valid dashboard',/hasRenderedDashboard\(\)/.test(guard)],
  ['empty response grace period',/supabase-empty-grace/.test(guard)],
  ['records-changed requires rows',/rows\.length\)scheduleSmartRender/.test(guard)],
  ['bootstrap requires ready DOM and data',/smartAreaReady\(\)&&invoiceRows\(\)\.length>0/.test(router)],
  ['router defers when data is not ready',/mode='deferred-data'/.test(router)],
  ['tab controller owns lazy chart render',/window\.setSmartTab\(target\)/.test(router)],
  ['no direct hidden-tab vehicle render',!/renderSmartVans\(invoiceRows\(\)\)/.test(router)],
  ['no unconditional bootstrap assignment',!/legacyRender\.call\(window,target\);window\.__petatoeSmartReportsBootstrapped=true/.test(router)]
];
const failed=checks.filter(x=>!x[1]);
console.log(`Smart Reports Data Readiness Recovery: ${failed.length?'FAILED':'PASSED'}`);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'} - ${x[0]}`));
if(failed.length)process.exit(1);
