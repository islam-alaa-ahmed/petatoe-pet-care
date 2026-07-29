const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const bridge=read('runtime/data-ready-screen-hydration.js');
const controller=read('smart/smart-reports-runtime-controller.js');
const tabs=read('components/tab-render-subscribers.js');
const filters=read('components/filters-finalization.js');
const payroll=read('payroll/payroll-core.js');
const checks=[
  ['bridge loaded once',(index.match(/runtime\/data-ready-screen-hydration\.js/g)||[]).length===1],
  ['smart runtime controller loaded once',(index.match(/smart\/smart-reports-runtime-controller\.js/g)||[]).length===1],
  ['legacy retry guard not loaded',!index.includes('smart/smart-reports-open-refresh-guard.js')],
  ['smart controller ordered after tabs and before subscribers',index.indexOf('smart/smart-tabs.js') < index.indexOf('smart/smart-reports-runtime-controller.js') && index.indexOf('smart/smart-reports-runtime-controller.js') < index.indexOf('components/tab-render-subscribers.js')],
  ['smart lifecycle has one event-driven owner',controller.includes('PETATOESmartReportsReadyRender')&&controller.includes('PETATOESmartReportsRefresh')&&!bridge.includes('openSmart:')],
  ['canonical runtime commit before render',controller.includes('petatoeApplySalesRecordsFromRuntime')&&controller.includes('canonical-commit')&&/runRequest\(request\)[\s\S]*?ensureSmartRuntime\(\)[\s\S]*?synchronize\(request\.forceRemote[\s\S]*?renderNow\(request\.tab/.test(controller)],
  ['remote refresh before canonical render',controller.includes('petatoeSyncSalesReportsFromSupabase')&&controller.includes('public-refresh')],
  ['records-ready listener owned by controller',controller.includes("petatoe:records-changed")&&!bridge.includes("petatoe:records-changed")],
  ['tab subscriber delegates Smart lifecycle ownership',!tabs.includes("if(tabId==='smart')")&&!tabs.includes('PETATOESmartReportsReadyRender')&&!tabs.includes('PETATOEDataReadyScreenHydration.openSmart')],
  ['refresh uses canonical smart API',filters.includes('PETATOESmartReportsRuntime')&&filters.includes('runtime.refresh()')&&!filters.includes('bridge.refreshSmart')],
  ['payroll Supabase readiness event',bridge.includes('petatoe:payroll-supabase-ready')],
  ['payroll stable readiness promise',payroll.includes('payrollLoadPromise')&&payroll.includes('whenSupabaseReady')],
  ['payroll tab subscriber hydrates requested view',tabs.includes("openPayroll('payroll')")&&tabs.includes("openPayroll('salarySlip')")]
];
let failed=checks.filter(x=>!x[1]);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'}: ${x[0]}`));
if(failed.length){console.error(`Data-ready hydration contract: FAILED (${failed.length})`);process.exit(1);}
console.log(`Data-ready hydration contract: PASSED (${checks.length}/${checks.length})`);
