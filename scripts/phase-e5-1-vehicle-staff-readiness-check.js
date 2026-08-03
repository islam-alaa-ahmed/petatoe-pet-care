#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'); let p=0,f=0;
function c(ok,l){if(ok){p++;console.log('PASS: '+l)}else{f++;console.error('FAIL: '+l)}}
const ops=read('operations/operations-legacy-engine.js'); const setup=read('settings/setup.js');
c(ops.includes("ensureGroup('payroll')"),'vehicle staff hydrates payroll dependency');
c(ops.includes("ensureGroup('settingsSetup')"),'vehicle staff hydrates settings setup dependency');
c(ops.includes("facade.refresh()"),'vehicle staff refreshes payroll facade');
c(ops.includes("petatoe:localization-center-ready"),'vehicle staff rerenders when localization center is ready');
c(setup.includes("notifyReferenceRegistryUpdated('setup-remote-load'"),'remote setup load publishes reference update');
c(ops.includes('refreshVehicleStaffScreen'),'vehicle staff has isolated rerender path');
if(f){console.error(`Phase E5.1 Vehicle Staff Readiness: FAILED — ${p}/${p+f}`);process.exit(1)}
console.log(`Phase E5.1 Vehicle Staff Readiness: PASSED — ${p}/${p}`);
