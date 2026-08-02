#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'warehouses/warehouse-core.js'),'utf8');
const checks=[
  ['warehouse safe renderer guards htmlTrusted availability', /window\.PETATOESafeRender && typeof window\.PETATOESafeRender\.htmlTrusted === 'function'/],
  ['warehouse safe renderer supports sanitized helper fallback', /typeof window\.PETATOESafeRender\.htmlSanitized === 'function'/],
  ['warehouse safe renderer has DOM fallback', /el\.insertAdjacentHTML\('beforeend'/],
  ['warehouse safe renderer does not call htmlTrusted from missing-helper branch', !/else\s*\{\s*window\.PETATOESafeRender\.htmlTrusted/.test(source)],
  ['warehouse safe renderer does not retry undefined helper in catch', !/catch\(e\)\{warn\(e\);\s*try\{window\.PETATOESafeRender\.htmlTrusted/.test(source)]
];
let passed=0;
for(const [label,rule] of checks){const ok=typeof rule==='boolean'?rule:rule.test(source);console.log(`${ok?'PASS':'FAIL'} - ${label}`);if(ok)passed++;}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const contract=manifest.runtimeContracts&&manifest.runtimeContracts.warehouseSafeRender;
const contractOk=contract==='10.0.25-phase-c3-1-warehouse-safe-render-contract-1';
console.log(`${contractOk?'PASS':'FAIL'} - warehouse safe render runtime contract is registered`);if(contractOk)passed++;
console.log(`Phase C3.1 Warehouse Safe Render: ${passed}/${checks.length+1} PASSED`);
if(passed!==checks.length+1)process.exit(1);
