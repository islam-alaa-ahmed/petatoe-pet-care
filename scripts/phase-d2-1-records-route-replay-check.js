#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){ if(ok){passed++;console.log('PASS - '+label);}else{failed++;console.error('FAIL - '+label);} }
check(!gate.includes("if(group === 'salesRecords') return false;"),'records are no longer excluded from non-blocking route navigation');
check(gate.includes('salesRecords:true'),'records are registered in the canonical non-blocking business group list');
check(gate.includes('salesEntry:true, salesImport:true, salesRecords:true'),'records share the generic non-blocking business route contract');
check(gate.includes("salesRecords: ['salesCrud']"),'records retain sales CRUD dependency');
check(manifest.runtimeContracts.recordsRouteHydration==='10.0.25-phase-d2-2-records-nonblocking-route-contract-1','records non-blocking route contract is registered');
console.log(`Phase D2.2 records non-blocking route: ${passed}/${passed+failed} PASSED`);
if(failed) process.exit(1);
