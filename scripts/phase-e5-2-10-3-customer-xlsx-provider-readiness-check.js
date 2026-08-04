'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const gate = fs.readFileSync(path.join(root, 'performance/mobile-startup-loading-gate.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'config/petatoe-version.json'), 'utf8'));
let passed = 0; let failed = 0;
function check(ok, label){ if(ok){ console.log('PASS - '+label); passed++; } else { console.error('FAIL - '+label); failed++; } }
check(gate.includes("window.__PETATOE_XLSX_STUB__ !== true"), 'XLSX stub cannot satisfy the provider readiness contract');
check(gate.includes("typeof window.XLSX.read === 'function'"), 'provider contract requires the real workbook reader');
check(gate.includes("typeof window.XLSX.utils.sheet_to_json === 'function'"), 'provider contract requires the real worksheet parser');
check(gate.includes("typeof window.XLSX.utils.book_new === 'function'"), 'provider contract retains export readiness');
check(index.includes("registerOrWrite('xlsx','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'"), 'canonical XLSX provider remains registered in the xlsx lazy group');
check(config.runtimeContracts.customerExcelRuntimeProvider === '10.0.25-phase-e5-2-10-3-real-xlsx-provider-contract-1', 'runtime provider contract is registered');
console.log(`Phase E5.2.10.3 Customer XLSX Provider Readiness: ${passed}/${passed+failed} PASSED`);
if(failed) process.exit(1);
