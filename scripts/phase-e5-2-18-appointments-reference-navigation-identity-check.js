#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const nav=read('navigation/navigation.js');
const mobile=read('mobile/mobile-enterprise-v10-shell.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const router=read('router/navigation-controller.js');
let passed=0,failed=0;
function check(ok,msg){if(ok){console.log('PASS - '+msg);passed++;}else{console.error('FAIL - '+msg);failed++;}}
check(nav.includes("appointmentsSubTab:'master',screen:'appointmentsMaster'"),'reference data keeps a distinct master route identity');
check(nav.includes("routeIntent.appointmentsSubTab")&&nav.includes("routeIntent.navigationScreen==='appointmentsMaster'"),'desktop active state prefers canonical router appointments intent');
check(nav.includes("button[data-tab=\"appointments\"]:not([data-appointments-subtab])")||nav.includes("button[data-tab=\"appointments\"]:not([data-appointments-subtab])"),'appointments/add active owner is explicitly distinct from master');
check(mobile.includes('function activeCanonicalRouteKey()')&&mobile.includes('canonicalRouteKeyFromButton(source)'),'mobile drawer resolves active state from the canonical route key');
check(mobile.includes("document.querySelectorAll('.pet-v10-nav-btn[data-tab]')")&&mobile.includes("document.querySelectorAll('.pet-v10-drawer-item')"),'bottom bar tab state and drawer route state are intentionally separated');
check(mobile.includes('b.dataset.routeKey===activeRouteKey'),'mobile drawer cannot mark both appointments routes active by shared tab id');
check(gate.includes("appointmentsSubTab: tabId==='appointments'?String(intent.appointmentsSubTab||''):''")&&gate.includes("navigationScreen: String(intent.navigationScreen||tabId||'')"),'lazy hydration replay preserves appointments sub-route identity');
check(gate.includes("source: 'lazy-hydration-refresh'"),'lazy hydration replay is explicitly identified for diagnostics');
check(router.includes("buttonSubTab===requestedAppointmentsSubTab")&&router.includes("if(match&&requestedScreen) match=buttonScreen===requestedScreen"),'router active marking distinguishes appointments master from appointments add');
check(router.includes("window.PETATOERouter.currentIntent=canonicalIntent"),'router publishes one canonical current route intent before listeners execute');
console.log(`Phase E5.2.18 appointments/reference navigation identity: ${passed}/${passed+failed} PASSED`);
process.exit(failed?1:0);
