const fs = require('fs');
const gate = fs.readFileSync('performance/mobile-startup-loading-gate.js','utf8');
const index = fs.readFileSync('index.html','utf8');
const worker = fs.readFileSync('service-worker.js','utf8');
const version = '10.0.25-sg4-6-7-router-owned-smart-reports-hydration-1';
const checks = [
  ['Smart Reports has explicit non-blocking branch', gate.includes("if(group === 'smartReports')")],
  ['Smart Reports hydration still starts', gate.includes("ensureGroup(group).catch(function(error)")],
  ['Non-blocking branch occurs before preventDefault', gate.indexOf("if(group === 'smartReports')") < gate.indexOf('event.preventDefault();', gate.indexOf("document.addEventListener('click'"))],
  ['Topbar reports button remains canonical router action', index.includes("moduleCall('router','openTab','smart','overview')")],
  ['Topbar reports button declares Smart Reports group', index.includes('data-pet-lazy-group="smartReports"')],
  ['HTML gate token aligned', index.includes(`mobile-startup-loading-gate.js?v=${version}`)],
  ['Service worker version aligned', worker.includes(`const APP_VERSION = '${version}';`)]
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`); if(!ok) failed++; }
if(failed){ console.error(`SG-4.6.5 FAILED: ${failed}/${checks.length}`); process.exit(1); }
console.log(`SG-4.6.5 PASSED: ${checks.length}/${checks.length}`);
