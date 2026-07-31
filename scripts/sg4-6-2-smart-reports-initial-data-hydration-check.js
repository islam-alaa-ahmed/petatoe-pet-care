const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const controller=fs.readFileSync(path.join(root,'smart/smart-reports-runtime-controller.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const version='10.0.25-sg4-6-2-smart-reports-initial-data-hydration-1';
const checks=[
  ['empty runtime rows trigger initial hydration',controller.includes('var needsInitialHydration=!rowsBefore.length;')],
  ['initial hydration uses canonical Supabase sync',controller.includes('shouldRefresh&&typeof window.petatoeSyncSalesReportsFromSupabase')],
  ['normal populated open avoids forced remote refresh',controller.includes('var shouldRefresh=!!forceRemote||needsInitialHydration;')],
  ['canonical commit remains after refresh',controller.includes('commitRuntimeRows(')],
  ['runtime controller cache token synchronized',index.includes('smart/smart-reports-runtime-controller.js?v='+version)],
  ['service worker version synchronized',sw.includes("const APP_VERSION = '"+version+"';")]
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
if(failed){process.exit(1);}console.log('SG-4.6.2 Smart Reports initial data hydration: '+checks.length+'/'+checks.length+' PASSED');
