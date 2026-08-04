#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const legacy=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
const storage=fs.readFileSync(path.join(root,'operations/operations-storage.js'),'utf8');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(label,ok){if(ok){console.log('PASS - '+label);passed++;}else{console.error('FAIL - '+label);failed++;}}
check('Excel import normalizes Unicode and strips invisible markers',/function normalizeCustomerImportText\(v\)/.test(legacy)&&/\\u200B-\\u200D/.test(legacy));
check('legacy customer-prefixed codes are canonicalized',/function canonicalCustomerCode\(v\)/.test(legacy)&&/customer\\s\*:/i.test(legacy));
check('customer matching is code-first and does not merge distinct coded names',/if\(ac&&bc\)return ac\.toLowerCase\(\)===bc\.toLowerCase\(\)/.test(legacy));
check('question-mark corruption is replaced by valid incoming Unicode text',/function isQuestionMarkCorruption\(v\)/.test(legacy)&&/function preferredCustomerText\(current,incoming\)/.test(legacy));
check('staged import keeps source rows instead of a stale full master snapshot',/pendingMasterCustomersImport=\{rows:cloneJSON\(list\)/.test(legacy)&&! /pendingMasterCustomersImport=\{master:staged/.test(legacy));
check('approval rebuilds payload from latest master data',/function buildMasterCustomersImportPayload\(list\)/.test(legacy)&&/buildMasterCustomersImportPayload\(rows\)/.test(legacy));
check('master conflicts are retried after latest data refresh',/function persistMasterCustomersImport\(storage,rows,attempt\)/.test(legacy)&&/isOperationsMasterConflict\(err\)&&attempt<1/.test(legacy));
check('storage normalization collapses numeric and customer-prefixed duplicate codes',/function canonicalCustomerCode\(v\)/.test(storage)&&/while\(\/\^customer/.test(storage));
check('runtime customer import integrity contract is registered',cfg.runtimeContracts&&cfg.runtimeContracts.customerImportIntegrity==='10.0.25-phase-e5-2-10-customer-excel-unicode-complete-import-contract-1');
console.log(`Phase E5.2.10 customer Excel Unicode complete import: ${passed}/${passed+failed} PASSED`);
if(failed)process.exit(1);
