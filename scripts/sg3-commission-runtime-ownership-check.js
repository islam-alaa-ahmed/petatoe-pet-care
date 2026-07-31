const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const inline=read('inline-extracted/commission-inline.js');
const sidebar=read('sidebar.js');
const perms=read('navigation/navigation-permissions.js');
const route=read('router/route-registry.js');
const checks=[
 ['commissionStatement alias',/commissionStatement:\s*'commission'/.test(gate)],
 ['panel classification',/commissionstatement\|commission/.test(gate)&&!/payroll\|salaryslip\|commissionstatement/.test(gate)],
 ['read-only contract',!gate.includes("runtime.ensurePanels();\n      return !!(runtime")],
 ['bootstrap registered first',index.indexOf('commission-runtime-bootstrap.js')<index.indexOf('commission-inline.js')],
 ['visibility runtime removed',!index.includes("registerOrWrite('commission','inline-extracted/commission-tab-visibility-fix.js")],
 ['navigation injection removed from init',/function commissionsInit\(\)\{ensureCommissionDelegation\(\);injectPanel\(\);injectCommissionStatementPanel\(\);patchTab\(\)/.test(inline)],
 ['tab listener guard',inline.includes('__PETATOE_COMMISSION_TABCHANGE_BOUND__')],
 ['runtime statement API',inline.includes('commissionRuntime.renderStatement=')],
 ['sidebar aligned',sidebar.includes("commissions:'management'" )],
 ['permission explicit',perms.includes("commissions:'commissions', commissionStatement:'commissionStatement'" )],
 ['route bootstrap ownership',route.includes('commissions/commission-runtime-bootstrap.js')]
];
let failures=checks.filter(x=>!x[1]);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'}: ${x[0]}`));
if(failures.length){process.exit(1)}
console.log(`SG-3 Commission Runtime Ownership: PASSED — ${checks.length}/${checks.length}`);
