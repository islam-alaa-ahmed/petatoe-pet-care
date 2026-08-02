#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){ if(ok){passed++;console.log('PASS - '+label);}else{failed++;console.error('FAIL - '+label);} }
check(gate.includes("if(group === 'salesRecords') return false;"),'records are excluded from optimistic background navigation');
check(gate.includes("event.preventDefault();") && gate.includes("el.dataset.petatoeLazyReplay = '1'") && gate.includes('el.click();'),'guarded click replay remains active');
check(!gate.includes('salesEntry:true, salesImport:true, salesRecords:true'),'records are not registered in generic non-blocking group list');
check(gate.includes("salesRecords: ['salesCrud']"),'records retain sales CRUD dependency');
check(manifest.runtimeContracts.recordsRouteHydration==='10.0.25-phase-d2-1-records-guarded-replay-contract-1','records replay contract is registered');
console.log(`Phase D2.1 records route replay: ${passed}/${passed+failed} PASSED`);
if(failed) process.exit(1);
