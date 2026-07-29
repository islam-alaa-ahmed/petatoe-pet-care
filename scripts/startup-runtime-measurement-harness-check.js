'use strict';
const fs = require('fs');
function read(path){ return fs.readFileSync(path,'utf8'); }
const profiler = read('performance/startup-clean-profiler.js');
const index = read('index.html');
const checks = [
  ['measurement profiler cache token', index.includes('performance/startup-clean-profiler.js?v=10.0.25-p1-1-1-startup-runtime-measurement')],
  ['profiler version', profiler.includes("10.0.25-p1-1-1-startup-runtime-measurement")],
  ['FCP measurement', profiler.includes("getEntriesByType('paint')") && profiler.includes('firstContentfulPaintMs')],
  ['LCP observer', profiler.includes("largest-contentful-paint") && profiler.includes('largestContentfulPaintMs')],
  ['long task observer', profiler.includes("entryTypes: ['longtask']")],
  ['shell milestone', profiler.includes("petatoe:mobile-boot-ready") && profiler.includes('shellReadyMs')],
  ['session milestone', profiler.includes("petatoe:session-ready") && profiler.includes('sessionReadyMs')],
  ['data commit milestone', profiler.includes("petatoe:sales-records-committed") && profiler.includes('dataReadyMs')],
  ['dashboard milestone', profiler.includes("petatoe:dashboard-rendered") && profiler.includes('dashboardReadyMs')],
  ['Smart Reports milestone', profiler.includes("petatoe:smart-reports-ready") && profiler.includes('smartReportsReadyMs')],
  ['resource bottleneck ranking', profiler.includes('resourceBottlenecks') && profiler.includes('largestTransfer') && profiler.includes('blockingBeforeFcp')],
  ['delayed finalization window', profiler.includes("finalize('load-plus-15000ms')")],
  ['readiness settled finalization', profiler.includes("finalize('core-readiness-settled')")],
  ['local persistence API', profiler.includes('getStoredReport') && profiler.includes('persistSnapshot')],
  ['report export API', profiler.includes('copyReport') && profiler.includes('downloadReport')],
  ['no production UI text injection', !profiler.includes('innerHTML') && !profiler.includes('textContent =')]
];
let failed=0;
for(const [name,pass] of checks){ console.log(`${pass?'PASS':'FAIL'}: ${name}`); if(!pass) failed++; }
console.log(`Startup Runtime Measurement Harness: ${checks.length-failed}/${checks.length} PASSED`);
if(failed) process.exit(1);
