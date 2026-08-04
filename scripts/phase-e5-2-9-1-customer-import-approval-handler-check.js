const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const core=read('operations/operations-core.js');
const legacy=read('operations/operations-legacy-engine.js');
const catalog=read('i18n/localization-center/operations-customer-management.js');
const html=read('index.html');
const version=JSON.parse(read('config/petatoe-version.json'));
const checks=[
 ['approval action is exposed by operations facade',core.includes("'approveMasterCustomersExcelImport'")],
 ['cancel action is exposed by operations facade',core.includes("'cancelMasterCustomersExcelImport'")],
 ['approval implementation persists through confirmed storage',legacy.includes('function approveMasterCustomersExcelImport()')&&legacy.includes('storage.writeMasterDataConfirmed(payload)')],
 ['approval button dispatches the registered operation action',html.includes('data-op-click="approveMasterCustomersExcelImport"')],
 ['cancel button dispatches the registered operation action',html.includes('data-op-click="cancelMasterCustomersExcelImport"')],
 ['runtime catalog contains approval-ready localization',catalog.includes("readyForApproval:'اكتملت المراجعة")&&catalog.includes("readyForApproval:'Review complete")],
 ['runtime catalog contains save status localization',catalog.includes("savingToSupabase:'جارٍ حفظ العملاء")&&catalog.includes("savedToSupabase:'تم حفظ {count} عميل")],
 ['approval handler contract is registered',version.runtimeContracts&&version.runtimeContracts.customerImportApprovalHandler==='10.0.25-phase-e5-2-9-1-customer-import-approval-handler-contract-1']
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)fail++;}
console.log(`Phase E5.2.9.1 customer import approval handler: ${checks.length-fail}/${checks.length} PASSED`);
process.exit(fail?1:0);
