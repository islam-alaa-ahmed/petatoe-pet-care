'use strict';
const fs=require('fs');
const core=fs.readFileSync('inline-extracted/legacy-application-core.js','utf8');
const smart=fs.readFileSync('smart/smart-reports-runtime-controller.js','utf8');
const gate=fs.readFileSync('performance/mobile-startup-loading-gate.js','utf8');
const checks=[
 ['initial dashboard UI commit is deferred',core.includes('__PETATOE_INITIAL_DASHBOARD_UI_COMMIT_DONE__')&&core.includes('requestAnimationFrame')&&core.includes('setTimeout(scheduleUiCommit,0)')],
 ['dashboard readiness event is emitted',core.includes("petatoe:dashboard-rendered")],
 ['smart reports readiness event is emitted after render',smart.includes("petatoe:smart-reports-ready")&&smart.includes('renderCount:renderCount')],
 ['smart reports canonical controller remains intact',smart.includes("petatoe:sales-records-committed")&&smart.includes('window.PETATOESmartReportsRuntime=api')],
 ['desktop smart reports lazy hotfix retained',gate.includes('if(!isMobile) return waitForDesktopGroup(name);')&&gate.includes("version: '10.0.25-smart-reports-sr1-state-machine'")]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} - ${name}`);if(!ok)failed++;}
if(failed){console.error(`P1.3 check failed: ${failed}/${checks.length}`);process.exit(1);}
console.log(`P1.3 check passed: ${checks.length}/${checks.length}`);
