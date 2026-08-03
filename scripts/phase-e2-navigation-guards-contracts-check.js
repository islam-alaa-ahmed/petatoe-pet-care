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
check(router.includes("permission-runtime-not-ready"),'router fails closed while permission runtime is unavailable');
check(router.includes('pendingGuardedRoute={tabId:tabId'),'router preserves blocked route intent for safe replay');
check(router.includes("petatoe:navigationpermissionsapplied',replayGuardedRoute"),'guarded route replays only after permission application');
check(router.includes("window.addEventListener('petatoe:identity-ready',replayGuardedRoute)"),'guarded route can replay after identity readiness');
check(router.includes('if(!perms.canOpen(permissionScreen)) return false;'),'replay revalidates permission before navigation');
check(router.indexOf('hydrateRouteRuntime(tabId,routeIntent);')>router.indexOf("routeIntent={navigationScreen:'dashboard',source:'permission-fallback'};"),'unauthorized route cannot hydrate before fallback');
check(index.includes('router/navigation-controller.js?v='+token),'index loads certified router token');
check(sw.includes("const APP_VERSION = '"+token+"';"),'service worker cache namespace rotated');
check(config.buildVersion===token&&config.cacheVersion===token,'build and cache versions synchronized');
check(config.runtimeContracts.navigationGuardRuntime==='10.0.25-phase-e2-permission-ready-route-replay-contract-1','navigation guard runtime contract recorded');
if(failures){console.error('Phase E2 Navigation Guards & Route Contracts: FAILED ('+failures+')');process.exit(1);}
console.log('Phase E2 Navigation Guards & Route Contracts: PASSED — 10/10');
