'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
let passed=0,failed=0;
function check(ok,label){if(ok){console.log('PASS - '+label);passed++;}else{console.error('FAIL - '+label);failed++;}}
const ops=read('operations/operations-legacy-engine.js');
const loc=read('i18n/localization-center/operations-customer-management.js');
const manifest=JSON.parse(read('config/petatoe-version.json'));
check(ops.includes('function isRealXlsxReady()'),'customer import owns a real XLSX readiness predicate');
check(ops.includes("gate.ensureGroup('xlsx')"),'customer import awaits the canonical xlsx lazy group');
check(ops.includes("readiness.then(readSelectedFile)"),'file reading starts only after dependency readiness');
check(ops.includes("ext.endsWith('.csv')?Promise.resolve(true):ensureCustomerImportXlsxReady()"),'CSV imports remain independent from XLSX hydration');
check(ops.includes("opCustomerT('import.excelUnavailable'"),'Excel failure uses the canonical localized customer import message');
check(ops.includes("opCustomerT('import.readFailed'"),'file read failures use canonical localized messaging');
check(loc.includes("loadingExcelLibrary:'جارٍ تجهيز مكتبة Excel'") && loc.includes("loadingExcelLibrary:'Preparing the Excel library'"),'Arabic and English Excel readiness text is registered');
check(manifest.runtimeContracts && manifest.runtimeContracts.customerExcelLazyReadiness==='10.0.25-phase-e5-2-10-1-xlsx-ready-before-import-contract-1','runtime readiness contract is registered');
console.log(`Phase E5.2.10.1 Customer Excel Lazy Readiness: ${passed}/${passed+failed} PASSED`);
process.exit(failed?1:0);
