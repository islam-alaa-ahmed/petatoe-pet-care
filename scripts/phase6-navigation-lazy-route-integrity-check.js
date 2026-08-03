#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const nav=read('navigation/navigation.js');
const schema=read('navigation/navigation-schema.js');
const state=read('navigation/navigation-state.js');
const router=read('router/navigation-controller.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const version=JSON.parse(read('config/petatoe-version.json'));
const checks=[];
function check(name,ok){checks.push({name,ok:!!ok}); console.log(`${ok?'PASS':'FAIL'} - ${name}`);}
check('canonical navigation forwards functional navigationScreen', nav.includes("navigationScreen:b.getAttribute('data-pet-nav-screen')||b.getAttribute('data-pet-permission-screen')||tab"));
check('settings navigation forwards functional identity', nav.includes("navigationScreen:navigationScreen||main||'settings'"));
check('mobile schema forwards functional navigationScreen', schema.includes("navigationScreen:data['data-pet-nav-screen']||data['data-pet-permission-screen']||tab"));
check('navigation state persists functional identity', state.includes('navigationScreen: screenForPanel(panel'));
check('navigation state restores functional identity', state.includes('navigationScreen:s.navigationScreen||screenForPanel'));
check('router permission checks functional screen', router.includes('var permissionScreen=intent.navigationScreen||tabId;') && router.includes('perms.canOpen(permissionScreen)'));
check('router hydrates route non-blocking through gate', router.includes("typeof gate.ensureRoute === 'function'") && router.includes('gate.ensureRoute(tabId,intent.navigationScreen)'));
check('permission fallback resets route intent', router.includes("routeIntent={navigationScreen:'dashboard',source:'permission-fallback'};"));
check('smart menu active state uses exact smartOpen', router.includes("tabId==='smart' ? buttonSmart===smartOpen"));
check('startup gate exports route group resolver', gate.includes('groupForRoute: groupForRoute') && gate.includes('ensureRoute: ensureRoute'));
check('startup gate covers programmatic route gaps', ['executive:\'smartReports\'','vans:\'reportsUI\'','services:\'reportsUI\'','entry:\'salesEntry\'','import:\'salesImport\'','records:\'salesRecords\''].every(x=>gate.includes(x)));
check('tabchange hydration uses route identity', gate.includes('ensureRoute(id,detail.navigationScreen)'));
const governed=['router/navigation-controller.js','navigation/navigation.js','navigation/navigation-state.js','navigation/navigation-schema.js'];
check('modified navigation assets use canonical cache version', governed.every(asset=>index.includes(`${asset}?v=${version.cacheVersion}`)));
check('navigation runtime contract recorded', version.runtimeContracts && ['10.0.25-phase6-navigation-intent-contract-1','10.0.25-phase-e1-smart-active-state-contract-1','10.0.25-phase-e2-navigation-guard-replay-contract-1'].includes(version.runtimeContracts.navigationRuntime));
const passed=checks.filter(x=>x.ok).length;
console.log(`Phase 6 Navigation & Lazy Route Integrity: ${passed}/${checks.length} PASSED`);
if(passed!==checks.length) process.exit(1);
