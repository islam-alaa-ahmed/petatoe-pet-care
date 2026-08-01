#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const gate=read('performance/mobile-startup-loading-gate.js');
const dash=read('core/dashboard-critical-boot.js');
const checks=[];
function check(ok,label){checks.push({ok:!!ok,label}); console.log(`${ok?'PASS':'FAIL'} — ${label}`);}
check(gate.includes('var optionalReadinessContracts = {'),'optional readiness tier exists');
check(gate.includes('var deferredReadinessContracts = {'),'deferred readiness tier exists');
check(gate.includes('function readinessProfile(name)'),'readiness profile is centralized');
check(gate.includes('getReadinessProfile: function(name)'),'readiness diagnostics API is exported');
check(gate.includes("window.PETATOEPayrollReadFacade") && gate.includes("window.PETATOEPayrollComputedFacade") && gate.includes("window.PETATOEPayrollViewModelFacade"),'payroll first-render contract includes read/computed/view-model facades');
check(gate.includes("window.PETATOETreasuryReadFacade") && gate.includes("window.PETATOETreasuryComputedFacade") && gate.includes("window.PETATOETreasuryViewModelFacade"),'treasury first-render contract includes read/computed/view-model facades');
check(gate.includes("window.PETATOEWarehouseReadFacade") && gate.includes("window.PETATOEWarehouseComputedFacade") && gate.includes("window.PETATOEWarehouseViewModelFacade"),'warehouse first-render contract includes read/computed/view-model facades');
check(gate.includes('Only required contracts') && gate.includes('never hold a route hostage'),'optional/deferred tiers are explicitly non-blocking');
check(dash.includes('waitForLocalizationFirstPaint'),'dashboard has bounded localization first-paint gate');
check(dash.includes("petatoe:localization-ready") && dash.includes("petatoe:localization-center-ready"),'dashboard listens to both localization readiness events');
check(dash.includes("petatoe:dashboard-localization-readiness"),'dashboard emits localization readiness diagnostics');
check(!/window\.records\.length\s*>\s*0/.test(gate),'readiness does not depend on legacy records length');
const failed=checks.filter(x=>!x.ok);
console.log(`\nPhase 7 Readiness Contract Hardening: ${checks.length-failed.length}/${checks.length} PASSED`);
if(failed.length) process.exit(1);
