const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('operations/operations-legacy-engine.js');
const html=read('index.html');
const css=read('css/components/appointments.css');
const version=JSON.parse(read('config/petatoe-version.json'));
const checks=[
 ['Excel import stages rows before persistence',js.includes('pendingMasterCustomersImport={master:staged')],
 ['approval uses confirmed Supabase persistence',js.includes("storage.writeMasterDataConfirmed(payload)")],
 ['file read progress is exposed',js.includes('reader.onprogress=function')&&js.includes('customerImportProgress(')],
 ['import approval and cancel actions are registered',js.includes('approveMasterCustomersExcelImport:approveMasterCustomersExcelImport')&&js.includes('cancelMasterCustomersExcelImport:cancelMasterCustomersExcelImport')],
 ['review UI exists',html.includes('appointmentMasterCustomersImportReview')&&html.includes('appointmentMasterCustomersImportApprove')],
 ['progress UI is styled',css.includes('.appointments-customer-import-progress')],
 ['no per-row immediate write remains in import finish path',!js.includes('list.forEach(upsertMasterCustomer);')],
 ['runtime contract is registered',version.runtimeContracts&&version.runtimeContracts.customerImportWorkflow==='10.0.25-phase-e5-2-9-staged-customer-import-contract-1']
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)fail++;}
console.log(`Phase E5.2.9 customer import certification: ${checks.length-fail}/${checks.length} PASSED`);
process.exit(fail?1:0);
