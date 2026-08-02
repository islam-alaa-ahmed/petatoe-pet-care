#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const gate=read('performance/mobile-startup-loading-gate.js');
const routes=read('router/route-registry.js');
const manifest=JSON.parse(read('config/petatoe-version.json'));
const checks=[];
function check(ok,label){checks.push([!!ok,label]);console.log(`${ok?'PASS':'FAIL'} - ${label}`);}
check(gate.includes('var registrationOwners = Object.create(null);'),'loader owns a canonical script registration index');
check(gate.includes('canonicalScriptSource(src)'),'script ownership ignores cache query tokens');
check(gate.includes('registrationConflicts.push'),'cross-group ownership conflicts are recorded');
check(gate.includes('function registryAudit()'),'loader exposes dependency and ownership audit');
check(gate.includes('dependencyCycles: cycles'),'dependency cycles are reported');
check(gate.includes('resolveGroupForScreen'),'screen-to-group resolution is publicly inspectable');
check(routes.includes("loadGroup: normalize(meta.loadGroup || '')"),'route registry publishes canonical loadGroup metadata');
const expected={smart:'smartReports',warehouses:'warehouses',payroll:'payroll',treasury:'treasury',obligations:'obligations',commissionStatement:'commission',settings:'settingsSetup'};
Object.entries(expected).forEach(([route,group])=>check(routes.includes(`register('${route}', { loadGroup:'${group}'`),`${route} route maps to ${group}`));
check(manifest.runtimeContracts&&manifest.runtimeContracts.loaderRegistry==='10.0.25-phase-d1-loader-registry-contract-1','loader registry runtime contract is registered');
const failed=checks.filter(x=>!x[0]);
console.log(`Phase D1 loader registry audit: ${failed.length?'FAILED':'PASSED'} (${checks.length-failed.length}/${checks.length})`);
if(failed.length) process.exit(1);
