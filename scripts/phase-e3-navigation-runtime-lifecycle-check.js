#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
let failures=0;
function check(c,l){if(c) console.log('PASS: '+l); else {failures++; console.error('FAIL: '+l);}}
const router=read('router/navigation-controller.js');
const index=read('index.html');
const sw=read('service-worker.js');
const config=JSON.parse(read('config/petatoe-version.json'));
const token=config.buildVersion;
check(router.includes('function dispatchTabChange(tabId,smartOpen,routeIntent,previousTab,previousSmart)'), 'tabchange dispatcher accepts explicit previous route identity');
check(router.includes("previousTab:String(previousTab||''),previousSmart:String(previousSmart||'')"), 'tabchange detail publishes previous tab and smart route');
check(router.includes('var previous=window.PETATOERouter&&window.PETATOERouter.current||currentTab();'), 'router captures previous tab before current route mutation');
check(router.includes("var previousSmart=window.PETATOERouter&&window.PETATOERouter.currentSmart||'';"), 'router captures previous smart route before mutation');
check(router.includes('dispatchTabChange(tabId,smartOpen,routeIntent,previous,previousSmart);'), 'all route activations dispatch captured lifecycle identity');
check(!router.includes("previousTab:window.PETATOERouter&&window.PETATOERouter.current||''"), 'stale post-mutation previousTab contract removed');
check(index.includes('router/navigation-controller.js?v='+token), 'index loads lifecycle-certified router token');
check(sw.includes("const APP_VERSION = '"+token+"';"), 'service worker cache namespace rotated');
check(config.buildVersion===token&&config.cacheVersion===token, 'build and cache versions synchronized');
check(config.runtimeContracts.navigationLifecycle==='10.0.25-phase-e3-previous-route-lifecycle-contract-1', 'navigation lifecycle runtime contract recorded');
if(failures){console.error('Phase E3 Navigation Runtime Lifecycle Certification: FAILED ('+failures+')');process.exit(1);}
console.log('Phase E3 Navigation Runtime Lifecycle Certification: PASSED — 10/10');
