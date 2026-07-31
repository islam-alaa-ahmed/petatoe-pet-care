'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const tables=read('components/tables-core.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const checks=[
  ['tables core preserves existing namespace',/var Tables = window\.PETATOETables = window\.PETATOETables \|\| \{\}/.test(tables)],
  ['tables core does not replace namespace object',!tables.includes('window.PETATOETables = {__v310')],
  ['tables core preserves renderer methods',tables.includes('Tables.showMoreState = Tables.showMoreState || showMoreState')],
  ['reportsUI requires table render function',gate.includes("typeof window.PETATOETables.render === 'function'")],
  ['reportsUI requires filter normalize function',gate.includes("typeof window.PETATOEFilters.normalize === 'function'")],
  ['tables core hotfix cache token registered',index.includes("components/tables-core.js?v=10.0.25-sg4-6-4-smart-reports-load-before-open-1")]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`SG-4.6.1 Smart Reports recovery: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
