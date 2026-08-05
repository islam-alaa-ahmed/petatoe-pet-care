#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const ops=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/components/appointments.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){if(ok){console.log('PASS - '+label);passed++;}else{console.error('FAIL - '+label);failed++;}}
check(/function vehicleOpsIsCurrentRequest\(row\)/.test(ops),'current-request lifecycle predicate exists');
check(/function vehicleOpsIsDayRequest\(row\)/.test(ops),'day-queue lifecycle predicate exists');
check(/x\.vehicleOpsOpenedAt=new Date\(\)\.toISOString\(\)/.test(ops),'opening a request records execution start');
check(/rows\.filter\(vehicleOpsIsDayRequest\)/.test(ops),'today list excludes opened requests');
check(/rows\.filter\(vehicleOpsIsCurrentRequest\)/.test(ops),'current tab uses only active requests');
check(/<article class="vehicle-ops-day-row/.test(ops)&&/class="vehicle-ops-card-open"/.test(ops),'open action is inside each request card');
check(!/<button class="vehicle-ops-day-row/.test(ops),'request card is not an invalid nested button');
check(/x\.vehicleOpsExecutionState='confirmed'/.test(ops)&&/x\.vehicleOpsCompletedAt=x\.confirmedAt/.test(ops),'confirmation removes request from active lifecycle');
check(/لا يوجد طلب حالي/.test(ops),'current tab has an explicit empty state');
check(/\.vehicle-ops-card-open\{/.test(css),'embedded open button styling is registered');
check(manifest.runtimeContracts.vehicleCurrentRequestLifecycle==='10.0.25-phase-e5-2-15-day-current-confirmed-lifecycle-contract-1','runtime lifecycle contract is registered');
console.log(`Phase E5.2.15 Vehicle Current Request Lifecycle: ${passed}/${passed+failed} PASSED`);
if(failed)process.exit(1);
