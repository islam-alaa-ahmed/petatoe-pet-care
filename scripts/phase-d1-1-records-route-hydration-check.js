#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){ if(ok){passed++;console.log('PASS - '+label);}else{failed++;console.error('FAIL - '+label);} }
check(gate.includes("if(group === 'salesRecords') return false;") && gate.includes('petatoeLazyReplay'),'records navigation uses guarded replay after hydration');
check(gate.includes("background route hydration failed"),'background hydration failure remains observable');
check(gate.includes("salesRecords: ['salesCrud']"),'records retains sales CRUD dependency');
check(gate.includes("if(tabId === 'records' && typeof window.renderRecords === 'function') window.renderRecords();"),'records rerenders after runtime readiness');
check(manifest.runtimeContracts.recordsRouteHydration==='10.0.25-phase-d2-1-records-guarded-replay-contract-1','records route hydration runtime contract is registered');
console.log(`Phase D1.1 records route hydration: ${passed}/${passed+failed} PASSED`);
if(failed) process.exit(1);
