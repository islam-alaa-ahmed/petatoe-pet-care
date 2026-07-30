'use strict';
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const registry=fs.readFileSync(path.join(root,'router/route-registry.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
let passed=0;function check(c,m){if(!c){console.error('FAIL:',m);process.exitCode=1;return;}passed++;console.log('PASS:',m);}
check(/register\('commissions',/.test(registry),'canonical commissions route exists');
check(!/register\('commissionStatement',[\s\S]*?aliases:\['commissions'\]/.test(registry),'commission statement no longer captures commissions alias');
check(/panelId:'commissions'/.test(registry),'commission system route targets injected commissions panel');
check(gate.includes("commissions:'commission'"),'commissions maps to commission lazy group');
check(gate.includes("customer360:'customer360'"),'customer360 maps to isolated lazy group');
check(/customer360: function\(\)/.test(gate),'customer360 readiness contract exists');
check(gate.includes("typeof window.renderCustomer360Panel === 'function'"),'customer360 contract validates renderer');
check(index.includes("registerOrWrite('customer360','inline-extracted/customer360-return.js'"),'customer360 return runtime isolated');
check(index.includes("registerOrWrite('customer360','inline-extracted/customer360-runtime-data-binding-fix.js"),'customer360 data runtime isolated');
check(!index.includes("registerOrWrite('smartReports','inline-extracted/customer360-runtime-data-binding-fix.js"),'customer360 no longer depends on full smart reports group');
if(process.exitCode)process.exit(process.exitCode);console.log(`SG-2 Runtime Route Contract: PASSED — ${passed} checks`);
