'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const storage=fs.readFileSync(path.join(root,'operations/operations-storage.js'),'utf8');
const setup=fs.readFileSync(path.join(root,'settings/setup.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
const policy=fs.readFileSync(path.join(root,'operations/operations-vehicle-policy.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
 ['setup owns the canonical vehicle registry',setup.includes("var INIT_KEY='petatoe_master_setup_v120'")&&setup.includes("cars:[]")],
 ['appointment vehicle choices merge operations and setup sources',engine.includes("(master.vehicles||[]).concat(setupVehicleNamesForAppointments())")],
 ['vehicle policy prefers active setup vehicles',policy.includes('if(setup.length) return setup')],
 ['operations master owns vehicle assignments independently',storage.includes('vehicleAssignments:[]')&&storage.includes('vehicles:[]')],
 ['verified persistence fingerprint contract is preserved',storage.includes('var masterServerFingerprint = null')&&storage.includes('var expectedFingerprint = masterServerFingerprint')],
 ['REST-compatible canonical row reader is preserved',storage.includes('async function selectCanonicalMasterRow(c)')&&!storage.includes('.maybeSingle(')],
 ['confirmed writes verify the persisted payload',storage.includes('OPERATIONS_MASTER_DATA_WRITE_NOT_VERIFIED')&&storage.includes('masterFingerprint(verifiedRow.data) !== desiredFingerprint')],
 ['source ownership runtime contract is registered',config.runtimeContracts&&config.runtimeContracts.operationsVehicleSourceOwnership==='10.0.25-phase-e5-2-8-1-vehicle-source-ownership-contract-1']
];
let pass=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name); if(ok)pass++;}
console.log(`Phase E5.2.8.1 operations vehicle source ownership: ${pass}/${checks.length} PASSED`);
if(pass!==checks.length)process.exit(1);
