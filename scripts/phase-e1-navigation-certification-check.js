'use strict';
const fs = require('fs');
function read(path){ return fs.readFileSync(path,'utf8'); }
let failures = 0;
function check(condition,label){
  if(condition) console.log('PASS: '+label);
  else { failures += 1; console.error('FAIL: '+label); }
}
const nav = read('navigation/navigation.js');
const router = read('router/navigation-controller.js');
const registry = read('router/route-registry.js');
const gate = read('performance/mobile-startup-loading-gate.js');
const index = read('index.html');
const sw = read('service-worker.js');
const config = JSON.parse(read('config/petatoe-version.json'));
const token = '10.0.25-phase-e1-navigation-certification-1';
check(nav.includes("if(!activeBtn && active==='smart')"),'canonical active-state handles shared smart route explicitly');
check(nav.includes("window.PETATOERouter&&window.PETATOERouter.currentSmart"),'canonical active-state reads router smart sub-route');
check(nav.includes("button[data-tab=\"smart\"][data-smart-open=\"")+nav.includes("currentSmart.replace"),'canonical active-state selects exact smart-open button');
check(router.includes("buttonSmart===smartOpen"),'router active marker preserves exact smart-open identity');
['smart','customer360','commissions','commissionStatement','fleet','records','appointments','vehicleOperations','vehicleOperationsReports','operationKpis','payroll','salarySlip','treasury','warehouses'].forEach(route=>{
  check(registry.includes("register('"+route+"'"),'route registry contains '+route);
});
check(gate.includes("smart:'smartReports'"),'startup gate maps smart route');
check(gate.includes("records:'salesRecords'"),'startup gate maps records route');
check(gate.includes("commissions:'commission'"),'startup gate maps commissions route');
check(index.includes('navigation/navigation.js?v='+token),'index loads certified navigation token');
check(sw.includes("const APP_VERSION = '"+token+"';"),'service worker cache namespace is certified');
check(config.buildVersion===token && config.cacheVersion===token,'version source keeps build/cache token synchronized');
check(config.runtimeContracts.navigationRuntime==='10.0.25-phase-e1-smart-active-state-contract-1','navigation runtime contract recorded');
if(failures){ console.error('Phase E1 Navigation Certification: FAILED ('+failures+')'); process.exit(1); }
console.log('Phase E1 Navigation Certification: PASSED');
