const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const filters=read('components/filters-finalization.js');
const checks=[
  ["smart route maps to smartReports",gate.includes("smart:'smartReports', smartReports:'smartReports'")],
  ["commission statement maps to commission",gate.includes("commissionStatement:'commission'")&&!gate.includes("commissionStatement:'payroll'")],
  ["smart button declares group",index.includes('data-pet-lazy-group="smartReports" data-tab="smart"')],
  ["commission button declares group",index.includes('data-pet-lazy-group="commission" data-tab="commissions"')],
  ["commission statement declares group",index.includes('data-pet-lazy-group="commission" data-tab="commissionStatement"')],
  ["commission refresh uses runtime API",gate.includes("PETATOECommissionRuntime.renderSystem")],
  ["filters do not own readiness",!filters.includes("ensure('smartReports'")&&!filters.includes('ensure("smartReports"')],
  ["filters delegate to runtime",filters.includes('window.PETATOESmartReportsRuntime')]
];
const failed=checks.filter(x=>!x[1]);
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length) process.exit(1);
console.log(`SG-2 route/group runtime contract: PASSED — ${checks.length}/${checks.length}`);
