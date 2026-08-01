#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
let pass=0,fail=0;
function check(ok,msg){if(ok){pass++;console.log('PASS',msg);}else{fail++;console.error('FAIL',msg);}}
const tr=read('treasury/treasury-core.js');
const wh=read('warehouses/warehouse-core.js');
const ob=read('obligations/obligations-core.js');
check(tr.includes('function filteredMovementRows()'), 'Treasury owns one filtered movement dataset');
check(/function exportCsv\(\)\{var rows=filteredMovementRows\(\)/.test(tr), 'Treasury movement CSV uses displayed filters');
check(tr.includes('function filteredStatementRows(src)'), 'Treasury owns one filtered statement dataset');
check(/var rows=filteredStatementRows\(src\),header=/.test(tr), 'Treasury statement CSV uses statement filters');
check(wh.includes('function filteredMovementRows()'), 'Warehouse owns one filtered movement dataset');
check(wh.includes("concat(filteredMovementRows().map"), 'Warehouse movement CSV uses displayed filters');
check(wh.includes('function filteredRows()'), 'Low-stock report owns one filtered dataset');
check(/function exportCsv\(\)\{var data=filteredRows\(\)/.test(wh), 'Low-stock CSV uses displayed filters');
check(ob.includes('function filteredHistoryRows()'), 'Obligations history owns one filtered dataset');
check(ob.includes('var data=filteredHistoryRows().map'), 'Obligations Excel uses displayed filters');
check(!/function exportCsv\(\)\{var rows=allMovements\(\)/.test(tr), 'Treasury no longer exports unfiltered movements');
check(!/function exportCsv\(\)\{var data=rowsAll\(\)/.test(wh), 'Low-stock report no longer exports unfiltered rows');
console.log(`Phase 8 Filter / Export Parity: ${pass}/${pass+fail} PASSED`);
if(fail)process.exit(1);
