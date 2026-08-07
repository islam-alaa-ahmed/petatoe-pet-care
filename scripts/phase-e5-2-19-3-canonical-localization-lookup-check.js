const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
let pass=0,fail=0;
function check(ok,msg){if(ok){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
const i18n=read('i18n/index.js');
const index=read('index.html');
const engine=read('operations/operations-legacy-engine.js');
const dict=read('i18n/localization-center/dictionary-store.js');
check(/function canonicalStoreValue\(key,lang\)/.test(i18n),'global i18n owns a canonical-store lookup helper');
check(/function translate\(key,lang\)\{var code=.*canonicalStoreValue/.test(i18n),'data-i18n translation reads the canonical store before legacy dictionaries');
check(/canonicalStoreValue\('autoPhrases\.'\+key/.test(i18n),'automatic text-node translation reads canonical auto phrases');
check(/canonicalStoreValue\('runtimePhrases\.'\+key/.test(i18n),'runtime phrase translation reads canonical runtime phrases');
check(/data-i18n="operationsSource\.appointmentsManagementTitle"/.test(index),'appointment page title is bound to a canonical key');
check(/data-i18n="operationsSource\.dailyOperationsStatement"/.test(index)&&/data-i18n="operationsSource\.todayTimeline"/.test(index),'daily operations navigation labels are canonical-key bound');
check(/data-i18n="operationsSource\.customerData"/.test(index)&&/data-i18n="operationsSource\.petData"/.test(index),'appointment customer and pet section headers are canonical-key bound');
check(/data-i18n="operationsSource\.'\+i18nKey/.test(engine),'generated appointment KPI labels retain canonical i18n identity');
check(engine.includes('data-i18n="operationsSource.allAuthorizedVehicles"'),'generated authorized-vehicle options retain canonical i18n identity');
check(/\"appointmentsManagementTitle\":\"📅 إدارة المواعيد\"/.test(dict)&&/\"appointmentsManagementTitle\":\"📅 Appointment Management\"/.test(dict),'appointment management title exists in both canonical languages');
check(/\"customerData\":\"1\. بيانات العميل/.test(dict)&&/\"customerData\":\"1\. Customer Data/.test(dict),'appointment customer section exists in both canonical languages');

// Runtime store proof for all labels reported by the user plus the newly explicit static bindings.
function CE(type,opts){this.type=type;this.detail=opts&&opts.detail;}
const context={console,CustomEvent:CE,window:{dispatchEvent(){}}};context.window.window=context.window;
vm.createContext(context);vm.runInContext(dict,context,{filename:'dictionary-store.js'});
const store=context.window.PETATOE_LOCALIZATION_CENTER_STORE;
const keys=['monthRemaining','monthCollected','monthRevenue','monthAppointments','todayAppointments','tomorrowAppointments','activeAlerts','allAuthorizedVehicles','totalSessions','collection','appointmentsManagementTitle','dailyOperations','addAppointment','dailyOperationsStatement','todayTimeline','alerts','planningFollowup','customerData','petData','sessionData','operationsSection','collectionSection','notesSection'];
for(const lang of ['ar','en']){
  const values=keys.map(k=>store.getPath(lang,'operationsSource.'+k));
  check(values.every(v=>typeof v==='string'&&v.trim()&&v!==keys[values.indexOf(v)]),'canonical operations labels are complete in '+lang.toUpperCase());
}
console.log(`Phase E5.2.19.3 canonical localization lookup: ${pass}/${pass+fail} PASSED`);
if(fail)process.exit(1);
