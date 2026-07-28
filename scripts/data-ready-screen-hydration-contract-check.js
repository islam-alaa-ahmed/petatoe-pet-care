const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const bridge=read('runtime/data-ready-screen-hydration.js');
const tabs=read('components/tab-render-subscribers.js');
const filters=read('components/filters-finalization.js');
const checks=[
  ['bridge loaded once',(index.match(/runtime\/data-ready-screen-hydration\.js/g)||[]).length===1],
  ['records-ready listener',bridge.includes("petatoe:records-changed")],
  ['smart remote sync',bridge.includes('petatoeSyncSalesReportsFromSupabase')],
  ['smart in-flight guard',bridge.includes('smartOpenPromise')],
  ['payroll Supabase readiness',bridge.includes('petatoe:payroll-supabase-ready')],
  ['payroll reload contract',bridge.includes('reloadFromSupabase')],
  ['tab subscriber uses bridge',tabs.includes('PETATOEDataReadyScreenHydration.openSmart')&&tabs.includes("openPayroll('payroll')")],
  ['refresh uses remote bridge',filters.includes('bridge.refreshSmart')&&filters.includes('renderSmartWhenReady(true)')]
];
let failed=checks.filter(x=>!x[1]);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'}: ${x[0]}`));
if(failed.length){console.error(`Data-ready hydration contract: FAILED (${failed.length})`);process.exit(1);}
console.log(`Data-ready hydration contract: PASSED (${checks.length}/${checks.length})`);
