const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function check(ok,msg){if(!ok){console.error('FAIL: '+msg);process.exitCode=1}else console.log('PASS: '+msg)}
const nav=read('navigation/navigation.js');
const router=read('router/navigation-controller.js');
const ops=read('operations/operations-legacy-engine.js');
const html=read('index.html');
const sw=read('service-worker.js');
check(nav.includes("navigationScreen=String(b.getAttribute('data-pet-nav-screen')||'').trim()"),'navigation reads the clicked button functional screen identity');
check(nav.includes("navigationScreen:navigationScreen"),'navigation forwards functional screen identity to router');
check(router.includes("navigationScreen==='appointmentsMaster'?'master':'add'"),'router derives master from reference-data identity');
check(router.includes('navigationScreen:intent.navigationScreen'),'router broadcasts functional screen identity');
check(ops.includes("navigationScreen==='appointmentsMaster'?'master':''"),'operations runtime preserves reference-data function without silent add fallback');
check(nav.includes("{tab:'appointments',appointmentsSubTab:'master',screen:'appointmentsMaster'"),'reference-data button contract is present');
check(nav.includes("{tab:'vehicleOperations',screen:'vehicleOperations'"),'vehicle operations button contract is present');
check(nav.includes("{tab:'vehicleOperationsReports',screen:'vehicleOperationsReports'"),'vehicle reports button contract is present');
check(nav.includes("{tab:'operationKpis',screen:'operationKpis'"),'operations KPI button contract is present');
check(ops.includes("if(panel==='vehicleOperations')return renderVehicleOperations()"),'vehicle operations renderer remains bound');
check(ops.includes("if(panel==='vehicleOperationsReports')return renderVehicleExecutionReports()"),'vehicle reports renderer remains bound');
check(ops.includes("if(panel==='operationKpis')return renderOperationsKpiDashboard()"),'operations KPI renderer remains bound');
check(html.includes('10.0.25-operations-button-contract-fix-3'),'HTML loads the new navigation runtime token');
check(sw.includes("const APP_VERSION = '10.0.25-operations-button-contract-fix-3';"),'service worker cache namespace rotated');
if(process.exitCode) process.exit(process.exitCode);
