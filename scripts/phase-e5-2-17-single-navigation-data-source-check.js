#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const mobile=read('mobile/mobile-enterprise-v10-shell.js');
const nav=read('navigation/navigation.js');
const css=read('mobile/mobile-enterprise-v10-consolidated.css');
let passed=0,failed=0;
function check(ok,msg){if(ok){console.log('PASS - '+msg);passed++;}else{console.error('FAIL - '+msg);failed++;}}
check(mobile.includes('function canonicalNavigationModel()')&&mobile.includes("document.getElementById('nav')"),'mobile drawer derives its menu model from the canonical navigation DOM');
check(mobile.includes('function activateCanonicalButton(routeKey)')&&mobile.includes('source.click()'),'mobile drawer delegates navigation to the canonical desktop button');
check(!/function renderDrawerList\(filter\)[\s\S]*?PETATOENavigationSchema/.test(mobile),'mobile drawer rendering no longer reads a second navigation schema');
check(!/function buildDrawerItem\(item\)[\s\S]*?schema\.activate/.test(mobile),'mobile drawer items no longer use a parallel route activator');
check(mobile.includes("document.addEventListener('petatoe:navbuilt'")&&mobile.includes("document.addEventListener('petatoe:permissionsready'"),'drawer refresh follows canonical nav rebuild and permission readiness events');
check((mobile.match(/document\.addEventListener\('petatoe:navbuilt'/g)||[]).length===1,'mobile shell owns only one navbuilt refresh listener');
check(nav.includes("document.dispatchEvent(new CustomEvent('petatoe:navbuilt'"),'canonical navigation publishes one authoritative rebuild event');
check(mobile.includes("function buildBottomNav()")&&mobile.includes("pet-v10-bottom-nav")&&mobile.includes("positionNavBubble"),'mobile bottom bar implementation and interaction contract remain present');
check(css.includes('.pet-v10-bottom-nav')&&css.includes('.pet-v10-drawer'),'mobile bottom bar and drawer visual contracts remain present');
check(!mobile.includes("document.addEventListener('petatoe:navigationschema',function(){renderDrawerList"),'drawer no longer refreshes from a second schema data source');
console.log(`Phase E5.2.17 single navigation data source: ${passed}/${passed+failed} PASSED`);
process.exit(failed?1:0);
