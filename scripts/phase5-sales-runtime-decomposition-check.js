#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const report=read('sales/sales-invoice-report.js');
const preview=read('sales/invoice-print-preview.js');
const rootCompat=read('invoice-manual-multi-items.js');
const failures=[];
const checks=[];
function check(ok,label){checks.push({label,ok:!!ok}); if(!ok) failures.push(label);}
check(index.includes("registerOrWrite('salesShared','sales/duplicate-policy.js'"),'duplicate policy belongs to salesShared');
check(index.includes("registerOrWrite('salesImport','sales/import-engine.js'"),'import engine belongs to salesImport');
check(index.includes("registerOrWrite('salesEntry','sales/entry-references.js'"),'entry references belong to salesEntry');
check(index.includes("registerOrWrite('salesCrud','sales/sales-crud-supabase-binding.js"),'CRUD binding belongs to salesCrud');
check(index.includes("registerOrWrite('salesManualItems','sales/invoice-manual-multi-items.js'"),'manual items belong to salesManualItems');
check(index.includes("registerOrWrite('salesContracts','sales/contract-candidates-report.js'"),'contract report belongs to salesContracts');
check(!/registerOrWrite\('sales','sales\/(?:duplicate-policy|import-engine|entry-references|sales-crud-supabase-binding|invoice-manual-multi-items|contract-candidates)/.test(index),'legacy sales group owns no decomposed provider');
check(gate.includes("entry:'salesEntry', import:'salesImport', records:'salesRecords', sales:'salesAnalytics'"),'screen routes map to scoped sales groups');
check(gate.includes("sales: ['salesEntry', 'salesImport', 'salesRecords', 'smartSalesInvoices', 'salesContracts']"),'legacy sales group is dependency-only compatibility aggregate');
check(gate.includes("if(!queue.length && !dependencyQueue.length) return Promise.resolve(false);"),'dependency-only groups are supported on mobile');
check(report.includes("__owner:'sales/sales-invoice-report.js'") && report.includes('__ready:true'),'sales invoice core declares canonical ownership');
check(report.includes("area=document.createElement('div')") && report.includes("data-pet-runtime-owner"),'sales invoice mount has safe recovery contract');
check(preview.includes('window.PETATOESalesInvoicePrintAdapter = adapter') && preview.includes("__owner: 'sales/invoice-print-preview.js'"),'print preview is a dedicated adapter');
check(rootCompat.includes('deprecated root compatibility loader') && !rootCompat.includes('__PETATOE_ENTRY_DELEGATION__'),'root duplicate is neutralized without claiming canonical guards');
check(gate.includes("window.PETATOESalesInvoicePrintAdapter && window.PETATOESalesInvoicePrintAdapter.__ready === true"),'smartSalesInvoices readiness includes print adapter');
for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'} - ${c.label}`);
if(failures.length){console.error(`Phase 5 Sales Runtime Decomposition: FAILED (${failures.length})`);process.exit(1);}
console.log(`Phase 5 Sales Runtime Decomposition: PASSED ${checks.length}/${checks.length}`);
