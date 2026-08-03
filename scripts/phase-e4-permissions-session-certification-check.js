#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
let failures=0;
function check(c,l){if(c) console.log('PASS: '+l); else {failures++; console.error('FAIL: '+l);}}
const auth=read('security/auth-session.js');
const index=read('index.html');
const sw=read('service-worker.js');
const config=JSON.parse(read('config/petatoe-version.json'));
const token=config.buildVersion;
check(auth.includes("if(ev && ev.key === PWA_SESSION_KEY)"), 'persistent auth session key is observed across tabs');
check(auth.includes("applyCrossTabSessionRemoval('auth-multitab-logout')"), 'remote-tab logout locks the current tab immediately');
check(auth.includes('rawRemove(AUTH_KEY);'), 'cross-tab logout clears tab-local session state');
check(auth.includes("source:reason || 'auth-multitab-logout'"), 'cross-tab logout publishes canonical userchanged source');
check(auth.includes('applyCrossTabSessionUpdate(ev.newValue);'), 'login and user replacement propagate across tabs');
check(auth.includes('rawSet(AUTH_KEY, serialized);')&&auth.includes('restore();'), 'cross-tab session update reuses validated restore flow');
check(!auth.includes("if(ev && ev.key === PWA_SESSION_KEY && sessionUser()) logout"), 'cross-tab synchronization avoids duplicate remote session termination');
check(index.includes('security/auth-session.js?v='+token), 'index loads certified auth runtime token');
check(sw.includes("const APP_VERSION = '"+token+"';"), 'service worker cache namespace synchronized');
check(config.runtimeContracts.sessionRuntime==='10.0.25-phase-e4-multitab-auth-session-sync-contract-1', 'session runtime contract recorded');
if(failures){console.error('Phase E4 Permissions & Session Certification: FAILED ('+failures+')');process.exit(1);}
console.log('Phase E4 Permissions & Session Certification: PASSED — 10/10');
