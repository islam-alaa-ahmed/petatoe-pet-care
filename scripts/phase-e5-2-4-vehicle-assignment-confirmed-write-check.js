'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const storage=fs.readFileSync(path.join(root,'operations/operations-storage.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
 ['boot exposes a reusable promise',storage.includes('var bootPromise = null')&&storage.includes('if(bootPromise) return bootPromise')],
 ['confirmed master write waits for readiness',storage.includes('return ensureMasterReady().then(function(){')],
 ['confirmed write captures server baseline after readiness',storage.includes('var expectedFingerprint = masterServerFingerprint')],
 ['legacy cleanup is non-blocking after canonical persistence',storage.includes('try{ await cleanupLegacyMasterRows(c); }catch(cleanupError){ warn(cleanupError); }')],
 ['failed confirmed write reloads remote master data',storage.includes('return loadMasterSupabase().then(function(remote){')],
 ['runtime contract is registered',config.runtimeContracts&&config.runtimeContracts.vehicleAssignmentConfirmedWrite==='10.0.25-phase-e5-2-4-master-readiness-confirmed-write-contract-1']
];
let pass=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name); if(ok)pass++;}
console.log(`Phase E5.2.4 vehicle assignment confirmed write: ${pass}/${checks.length} PASSED`);
if(pass!==checks.length)process.exit(1);
