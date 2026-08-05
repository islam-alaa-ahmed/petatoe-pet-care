#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const nav=fs.readFileSync(path.join(root,'navigation/navigation-permissions.js'),'utf8');
const permissions=fs.readFileSync(path.join(root,'settings/permissions.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){if(ok){console.log('PASS - '+label);passed++;}else{console.error('FAIL - '+label);failed++;}}
const eager=index.indexOf('<script src="settings/permissions.js?v=');
const navPos=index.indexOf('<script src="navigation/navigation-permissions.js?v=');
check(eager>-1,'permission engine is loaded eagerly');
check(navPos>-1&&eager<navPos,'permission engine loads before navigation permission filtering');
check(!/registerOrWrite\(['"]settingsSetup['"],['"]settings\/permissions\.js/.test(index),'permission engine is not trapped inside settings lazy group');
check(/window\.PETATOEPermissionEngine\s*=/.test(permissions),'eager runtime exposes canonical permission engine');
check(/window\.PETATOEPermissions\s*=/.test(permissions),'eager runtime exposes settings permission facade');
check(/if\(!identityReady\(\)\)/.test(nav),'navigation still waits for Supabase permission hydration');
check(/settingsSetup:\s*function\(\)[\s\S]*window\.PETATOEPermissions/.test(gate),'settings group readiness recognizes the eager permission module');
check(manifest.runtimeContracts.permissionBootstrapRuntime==='10.0.25-phase-e5-2-14-3-eager-permission-engine-contract-1','permission bootstrap runtime contract is registered');
console.log(`Phase E5.2.14.3 Permission Bootstrap Runtime: ${passed}/${passed+failed} PASSED`);
if(failed)process.exit(1);
