const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
let pass=0,fail=0;
function check(ok,msg){if(ok){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
const opsSource=read('i18n/operations-source.js');
const whSource=read('i18n/warehouse-source.js');
const maintSource=read('i18n/maintenance-source.js');
const consolidation=read('i18n/localization-center/consolidation.js');
const engine=read('operations/operations-legacy-engine.js');
const index=read('index.html');
const dictionary=read('i18n/localization-center/dictionary-store.js');
check(/String\(key\|\|''\)/.test(opsSource),'operations source never converts a missing canonical value into an empty label');
check(/String\(key\|\|''\)/.test(whSource),'warehouse source never converts a missing canonical value into an empty label');
check(/String\(key\|\|''\)/.test(maintSource),'maintenance source never converts a missing canonical value into an empty label');
check(!/PETATOE_OPERATIONS_I18N\.t=function/.test(consolidation),'single-source consolidation no longer replaces the operations adapter with a second resolver');
check(!/PETATOE_WAREHOUSE_I18N\.t=function/.test(consolidation),'single-source consolidation no longer replaces the warehouse adapter with a second resolver');
check(/return String\(key\|\|''\);/.test(engine),'operations canonical lookup fails visible rather than rendering blank UI');
check(/operationsCustomer\.calendar\./.test(engine)&&/operationsCustomer\.fallback\./.test(engine),'historical operations namespaces resolve through their canonical catalog owners');
check(/\['appointments','vehicleOperations','vehicleOperationsReports','operationKpis'\]/.test(engine),'localization replay covers all operations panels, not appointment management only');
check(/data-i18n="operationsSource\.vehicleOperationsReports"/.test(index)&&/data-i18n="operationsSource\.operationKpisTitle"/.test(index),'static vehicle report and KPI headers are bound to canonical i18n keys');
check(/vehicleOperationsReportsSubtitle:'شاشة مستقلة/.test(dictionary)&&/vehicleOperationsReportsSubtitle:'An independent screen/.test(dictionary),'vehicle report subtitle exists in Arabic and English canonical dictionaries');
check(/reportRefresh:'تحديث التقارير'/.test(dictionary)&&/reportRefresh:'Refresh Reports'/.test(dictionary),'report refresh button exists in both canonical languages');

// Runtime proof: load canonical store plus operations catalogs and verify the labels visible in the reported regression.
const listeners={};
const context={console, setTimeout, clearTimeout};
context.CustomEvent=function(type,opts){this.type=type;this.detail=opts&&opts.detail;};
context.window={dispatchEvent(ev){(listeners[ev.type]||[]).forEach(fn=>fn(ev));},addEventListener(name,fn){(listeners[name]=listeners[name]||[]).push(fn);},setTimeout};
context.document={documentElement:{lang:'ar',getAttribute(){return this.lang;}},addEventListener(){},readyState:'complete'};
context.window.PETATOE_I18N={getLanguage(){return context.document.documentElement.lang;}};
vm.createContext(context);
['i18n/localization-center/dictionary-store.js','i18n/localization-center/operations-appointments-status.js','i18n/localization-center/operations-customer-management.js','i18n/localization-center/runtime.js','i18n/operations-source.js','i18n/localization-center/consolidation.js'].forEach(rel=>vm.runInContext(read(rel),context,{filename:rel}));
const keys=['monthRemaining','monthCollected','monthRevenue','monthAppointments','tomorrowAppointments','todayAppointments','activeAlerts','selectService','allAnimals','selectVehicle','selectGroomerOption','selectDriverOption','allAuthorizedVehicles','totalSessions','collection','vehicleOperationsReports','operationKpisTitle','reportRefresh'];
for(const lang of ['ar','en']){
  context.document.documentElement.lang=lang;
  const values=keys.map(k=>context.window.PETATOE_LOCALIZATION_CENTER.t('operationsSource.'+k,{}, {fallback:'',allowKeyFallback:false}));
  check(values.every(v=>typeof v==='string'&&v.trim()),'reported operations labels resolve non-empty in '+lang.toUpperCase());
}
console.log(`Phase E5.2.19.2 localization render fallback: ${pass}/${pass+fail} PASSED`);
if(fail)process.exit(1);
