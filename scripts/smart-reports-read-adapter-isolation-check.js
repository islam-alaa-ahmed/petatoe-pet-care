const fs=require('fs');
const assert=require('assert');
const index=fs.readFileSync('index.html','utf8');
const core=fs.readFileSync('inline-extracted/legacy-application-core.js','utf8');
const controller=fs.readFileSync('smart/smart-reports-runtime-controller.js','utf8');
const adapter=fs.readFileSync('smart/smart-reports-read-adapter.js','utf8');
const checks=[
  ['adapter loaded after controller registration', index.indexOf('smart-reports-read-adapter.js')>index.indexOf('smart-reports-runtime-controller.js')],
  ['adapter is not startup gate dependency', !index.includes("registerOrWrite('smartReports','smart/smart-reports-read-adapter.js")],
  ['adapter reads committed window.records', adapter.includes('Array.isArray(window.records)?window.records:[]')],
  ['adapter does not read Supabase datasource', !adapter.includes('PETATOEDataSource')&&!adapter.includes('supabase')],
  ['adapter does not render', !adapter.includes('renderSmartReports(')],
  ['adapter listens to committed event', adapter.includes("petatoe:sales-records-committed")],
  ['smartData uses adapter with fallback', core.includes('PETATOESmartReportsReadAdapter.readRows')&&core.includes('return (records||[]).slice()')],
  ['controller uses adapter first', controller.indexOf('PETATOESmartReportsReadAdapter.readRows')<controller.indexOf('petatoeSmartReportsRows')],
  ['controller exposes adapter readiness only', controller.includes('readAdapter:!!')],
];
for(const [name,ok] of checks){ assert.ok(ok,name); console.log('PASS',name); }
console.log(`Smart Reports Read Adapter Isolation: ${checks.length}/${checks.length} PASSED`);
