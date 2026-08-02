#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); const failures=[];
function check(ok,msg){console.log(`${ok?'PASS':'FAIL'} - ${msg}`);if(!ok)failures.push(msg);}
const boot=fs.readFileSync(path.join(root,'core/dashboard-critical-boot.js'),'utf8');
const obs=fs.readFileSync(path.join(root,'diagnostics/enterprise-observability.js'),'utf8');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
check(!/renderDashboardAll\(\);\s*if \(typeof renderDeep/.test(boot),'Critical dashboard boot does not render deep reports unconditionally');
check(boot.includes('Deep sales / vehicle / service reports are route-scoped'),'Dashboard boot documents route-scoped deep reports ownership');
check(obs.includes("firstPerformanceMark(['petatoe-dashboard-first-render'"),'Observability recovers dashboard readiness from buffered performance marks');
check(obs.includes("markOnce('dashboardInteractive'"),'Dashboard readiness is first-write only');
check(!obs.includes('requestAnimationFrame(function(){state.marks.dashboardInteractive=now();})'),'User change no longer overwrites dashboard readiness');
check(!obs.includes("setTimeout(function(){state.marks.startupSettled=now();},1500)"),'Startup settled is not an arbitrary diagnostics-load timer');
check(obs.includes("typeof gate.ensureGroup==='function'&&typeof gate.ensureRoute==='function'"),'Startup Gate health uses the public API contract');
check(obs.includes('measurementSources'),'Observability exports measurement provenance');
check(cfg.runtimeContracts&&cfg.runtimeContracts.startupBootstrap==='10.0.25-phase-c1-critical-dashboard-bootstrap-contract-1','Phase C1 runtime contract is registered');
if(failures.length){console.error(`Phase C1 startup/bootstrap audit: FAILED (${failures.length})`);process.exit(1);}console.log('Phase C1 startup/bootstrap audit: PASSED');
