#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
const failures=[];
function check(ok,msg){if(!ok)failures.push(msg);else console.log('PASS',msg);}
const policy=read('operations/operations-vehicle-policy.js');
const legacy=read('operations/operations-legacy-engine.js');
const index=read('index.html');
const gate=read('performance/mobile-startup-loading-gate.js');
check(policy.includes("__owner:'operations/operations-vehicle-policy.js'"),'vehicle policy has a canonical owner');
check(policy.includes("current:'active-master-only'"),'current operations policy is active-master-only');
check(policy.includes("historical:'document-dataset-by-period'"),'historical reports use document dataset by period');
check(policy.includes("administrative:'active-master-only'"),'administrative selectors use active master vehicles');
check(index.indexOf('operations/operations-vehicle-policy.js')<index.indexOf('operations/operations-legacy-engine.js'),'vehicle policy loads before legacy operations engine');
check(gate.includes('window.PETATOEOperationsVehiclePolicy.__ready === true'),'operations readiness requires vehicle policy');
check(legacy.includes("policy&&typeof policy.filterCurrentRows==='function'"),'current operations rows are filtered by policy');
check(legacy.includes("policy&&typeof policy.historicalVehicleNames==='function'"),'historical report filters use policy');
check(!/function vehicleNames\(\)[\s\S]{0,700}PETATOEDataSource/.test(legacy),'current vehicle names no longer come from sales records');

const sandbox={window:{},console};
sandbox.window.window=sandbox.window;
sandbox.window.PETATOESetup={getVehicles(){return [
  {name:'Active A',status:'active'},
  {name:'Stopped B',status:'inactive'}
];}};
sandbox.window.PETATOEOperationsStorage={readNormalizedMasterData(){return {vehicles:['Fallback C'],vehicleAssignments:[]};}};
vm.runInNewContext(policy,sandbox,{filename:'operations-vehicle-policy.js'});
const api=sandbox.window.PETATOEOperationsVehiclePolicy;
check(JSON.stringify(api.currentVehicleNames())===JSON.stringify(['Active A']),'current list excludes inactive setup vehicles');
const rows=[
  {date:'2026-01-01',vehicle:'Stopped B'},
  {date:'2026-01-02',vehicle:'Active A'},
  {date:'2025-12-01',vehicle:'Historic C'}
];
check(JSON.stringify(api.filterCurrentRows(rows).map(r=>r.vehicle))===JSON.stringify(['Active A']),'current rows exclude stopped and historical vehicles');
check(JSON.stringify(api.historicalVehicleNames(rows,{from:'2026-01-01',to:'2026-01-31'}))===JSON.stringify(['Active A','Stopped B']),'historical report keeps inactive vehicles used in selected period');
if(failures.length){console.error(`Phase 11 Operations Data Policy: FAILED (${failures.length})`);failures.forEach(x=>console.error('-',x));process.exit(1);}
console.log('Phase 11 Operations Data Policy: PASSED 12/12');
