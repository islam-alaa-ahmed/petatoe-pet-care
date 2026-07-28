const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const bridge=read('runtime/data-ready-screen-hydration.js');
const guard=read('smart/smart-reports-open-refresh-guard.js');
const tabs=read('components/tab-render-subscribers.js');
const filters=read('components/filters-finalization.js');
const payroll=read('payroll/payroll-core.js');
const checks=[
  ['bridge loaded once',(index.match(/runtime\/data-ready-screen-hydration\.js/g)||[]).length===1],
  ['smart guard is sole smart lifecycle owner',guard.includes('PETATOESmartReportsReadyRender')&&guard.includes('PETATOESmartReportsRefresh')&&!bridge.includes('openSmart:')],
  ['smart readiness uses legacy render source',guard.includes('Array.isArray(window.records)')&&guard.includes('commitDataSourceToLegacy')],
  ['canonical Supabase sync before render',guard.includes('petatoeSyncSalesReportsFromSupabase')&&guard.includes('renderSmartReady')],
  ['records-ready listener owned by smart guard',guard.includes("petatoe:records-changed")&&!bridge.includes("petatoe:records-changed")],
  ['tab subscriber uses canonical smart guard',tabs.includes('PETATOESmartReportsReadyRender')&&!tabs.includes('PETATOEDataReadyScreenHydration.openSmart')],
  ['refresh uses canonical smart API',filters.includes('PETATOESmartReportsRefresh')&&!filters.includes('bridge.refreshSmart')],
  ['payroll Supabase readiness event',bridge.includes('petatoe:payroll-supabase-ready')],
  ['payroll stable readiness promise',payroll.includes('payrollLoadPromise')&&payroll.includes('whenSupabaseReady')],
  ['payroll tab subscriber hydrates requested view',tabs.includes("openPayroll('payroll')")&&tabs.includes("openPayroll('salarySlip')")]
];
let failed=checks.filter(x=>!x[1]);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'}: ${x[0]}`));
if(failed.length){console.error(`Data-ready hydration contract: FAILED (${failed.length})`);process.exit(1);}
console.log(`Data-ready hydration contract: PASSED (${checks.length}/${checks.length})`);
