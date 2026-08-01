const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const checks=[]; function ok(v,m){checks.push([!!v,m]); if(!v) console.error('FAILED - '+m); else console.log('PASSED - '+m)}
const index=read('index.html'), facade=read('data/records-read-facade.js'), adapter=read('smart/smart-reports-read-adapter.js'), runtime=read('smart/smart-reports-runtime-controller.js'), router=read('smart/smart-router.js'), customers=read('smart/smart-customers.js');
ok(index.indexOf('data/records-read-facade.js')>index.indexOf('data/data-source.js'),'facade loads after data source');
ok(facade.includes("owner:'data/records-read-facade.js'"),'facade ownership declared');
ok(facade.includes('PETATOEDataSource'),'facade delegates to canonical mutable owner');
ok(adapter.includes('PETATOERecordsReadFacade'),'read adapter uses facade');
ok(runtime.includes('PETATOERecordsReadFacade'),'runtime controller uses facade');
ok(router.includes('PETATOERecordsReadFacade'),'router uses facade');
ok(customers.includes('PETATOERecordsReadFacade'),'customer controller uses facade');
ok(!runtime.includes('return Array.isArray(window.records)?window.records:[]'),'runtime legacy fallback removed');
ok(!router.includes('return Array.isArray(window.records) ? window.records : []'),'router legacy fallback removed');
if(checks.some(x=>!x[0])) process.exit(1); console.log(`Phase 2 Canonical Data Ownership: ${checks.length}/${checks.length} PASSED`);
