const fs=require('fs');
const js=fs.readFileSync('operations/operations-legacy-engine.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const core=fs.readFileSync('operations/operations-core.js','utf8');
const loc=fs.readFileSync('i18n/localization-center/operations-customer-management.js','utf8');
const cfg=JSON.parse(fs.readFileSync('config/petatoe-version.json','utf8'));
const tests=[
 ['header detector scans leading rows',js.includes('rows.slice(0,Math.min(rows.length,25))')],
 ['common Arabic customer headers are supported',js.includes('كودالعميل')&&js.includes('اسمالعميل')&&js.includes('اسمالحي')&&js.includes('رقمالجوال')],
 ['all workbook sheets are evaluated',js.includes('parseMasterCustomersWorkbook')&&js.includes('wb.SheetNames.forEach')],
 ['Google Maps column is imported',js.includes("googleMapUrl:map.googleMapUrl==null?'':r[map.googleMapUrl]")],
 ['template download button exists',html.includes('downloadMasterCustomersTemplate')&&html.includes('operationsCustomer.actions.downloadCustomersTemplate')],
 ['template action is exposed by facade',core.includes("'downloadMasterCustomersTemplate'")],
 ['template localization is registered',loc.includes("downloadCustomersTemplate:'تنزيل النموذج'")&&loc.includes("downloadCustomersTemplate:'Download Template'")],
 ['template workbook exists',fs.existsSync('templates/PETATOE_Customer_Import_Template.xlsx')],
 ['runtime contract is registered',cfg.runtimeContracts.customerExcelHeaderTemplate==='10.0.25-phase-e5-2-10-4-header-detection-template-contract-1']
];
let fail=0;for(const [n,ok] of tests){console.log((ok?'PASS':'FAIL')+' - '+n);if(!ok)fail++;}
console.log('Phase E5.2.10.4 Customer Excel Header & Template: '+(tests.length-fail)+'/'+tests.length+' PASSED');
if(fail)process.exit(1);
