'use strict';
const fs = require('fs');
const gate = fs.readFileSync('performance/mobile-startup-loading-gate.js','utf8');
const checks = [
  ['pending startup group registry', gate.includes('var pendingStartupGroups = Object.create(null);')],
  ['pre-interactive tabchange retained', gate.includes('rememberPendingStartupGroup(group);')],
  ['pending groups hydrated after interactive', gate.includes('hydratePendingStartupGroups();')],
  ['active restored panel scanned', gate.includes("document.querySelector('.panel.active, .panel.is-active, [data-panel].active')")],
  ['tabchange no longer discarded', !gate.includes("if(!startupInteractive) return;\n      var id = event && event.detail && event.detail.tabId;")],
  ['release version aligned', gate.includes('10.0.25-sg4-6-6-startup-route-hydration-recovery-1')]
];
const failed = checks.filter(([,ok])=>!ok);
console.log(`SG-4.6.6 Startup Route Hydration Recovery: ${failed.length?'FAILED':'PASSED'}`);
checks.forEach(([name,ok])=>console.log(`${ok?'PASS':'FAIL'} - ${name}`));
if(failed.length) process.exit(1);
