#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const core = read('warehouses/warehouse-core.js');
const index = read('index.html');
const dict = read('i18n/localization-center/dictionary-store.js');
const manifest = JSON.parse(read('config/petatoe-version.json'));
const checks = [];
function check(ok, label){ checks.push({ok:!!ok,label}); console.log(`${ok?'PASS':'FAIL'} ${label}`); }
check(!/var actual=r\.balance\s*,\s*diff=actual-r\.balance/.test(core), 'inventory render no longer fabricates actual count from book balance');
check(!/return\s*\[r\.store,r\.item,r\.balance,r\.balance,0\]/.test(core), 'inventory export no longer fabricates zero differences');
check(core.includes("actualCount:null") && core.includes("inventoryDifference:null"), 'inventory rows explicitly represent missing actual counts');
check(core.includes("countStatus:'not_counted'"), 'inventory rows expose not-counted status');
check(core.includes("hasAuthoritativeActualCount:false"), 'runtime contract declares no authoritative actual count source');
check(core.includes("whT('notCounted')"), 'screen and export use canonical not-counted label');
check(core.includes("return [r.store,r.item,r.balance,'','',whT('notCounted')]") || core.includes("return [r.store,r.item,r.balance,'','',whT('notCounted')];"), 'CSV leaves actual and difference blank');
check(index.includes('data-i18n="warehouseSource.inventoryCountUnavailable"'), 'inventory screen displays authoritative-count warning');
check(dict.includes('"inventoryCountUnavailable"') && dict.includes('"notCounted"') && dict.includes('"inventoryStatus"'), 'Arabic and English canonical dictionary entries exist');
check(index.includes('warehouses/warehouse-core.js?v=10.0.25-phase9-inventory-count-safety-1'), 'warehouse runtime cache token is updated');
check(manifest.runtimeContracts.inventoryCountRuntime === '10.0.25-phase9-inventory-count-safety-contract-1', 'inventory-count runtime contract is recorded');
check(manifest.cacheVersion === '10.0.25-phase9-inventory-count-safety-1', 'central cache version is synchronized');
const passed = checks.filter(x=>x.ok).length;
console.log(`Phase 9 Inventory Count Safety: ${passed}/${checks.length} PASSED`);
if(passed !== checks.length) process.exit(1);
