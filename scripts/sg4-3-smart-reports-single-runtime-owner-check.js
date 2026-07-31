const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const runtime=read('smart/smart-reports-runtime-controller.js');
const router=read('smart/smart-router.js');
const nav=read('navigation/navigation-state.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const checks=[
 ['runtime declares canonical owner',runtime.includes("__owner:'smart/smart-reports-runtime-controller.js'")],
 ['runtime owns public open API',runtime.includes('window.PETATOEOpenSmartReports=function')],
 ['runtime owns compatibility render API',runtime.includes('window.renderSmartReports=function')],
 ['router does not publish public open API',!router.includes('window.PETATOEOpenSmartReports =')],
 ['router publishes internal render engine',router.includes('window.PETATOESmartReportsRenderEngine = Object.freeze')],
 ['runtime consumes internal render engine',runtime.includes('PETATOESmartReportsRenderEngine')],
 ['runtime consumes namespaced tab controller',runtime.includes('tabsController()')&&runtime.includes('tabs.setSmartTab(tab)')],
 ['navigation state delegates to runtime',nav.includes('PETATOESmartReportsRuntime')&&nav.includes('smartRuntime.activateTab')],
 ['startup contract requires render engine',gate.includes('PETATOESmartReportsRenderEngine')],
 ['startup contract no longer requires global setSmartTab',!gate.includes("setSmartTab: typeof window.setSmartTab")],
 ['release token aligned',index.includes('10.0.25-sg4-4-readiness-contracts-1')]
];
let passed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`${passed} / ${checks.length} PASSED`); process.exit(passed===checks.length?0:1);
