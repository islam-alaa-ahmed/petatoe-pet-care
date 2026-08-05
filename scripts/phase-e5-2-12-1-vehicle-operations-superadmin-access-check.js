#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
 ['vehicle operations resolves the active user object',/function currentUserObject\(\)/.test(src)],
 ['super admin access is evaluated before permission runtime lookup',/function canVehicleOpsScreen\(action\)\{\s*if\(isVehicleOpsSuperAdmin\(\)\)return true;/.test(src)],
 ['special vehicle operations actions preserve super admin access',/function canOps\(key\)\{\s*if\(isVehicleOpsSuperAdmin\(\)\)return true;/.test(src)],
 ['fallback super admin detection is restricted to canonical roles and admin id',/role==='superadmin'\|\|role==='super_admin'\|\|id==='u_admin'/.test(src)],
 ['vehicle operations screen still uses the canonical vehicleOperations permission key',/PETATOEPermissions\.can\(currentUserId\(\),'vehicleOperations'/.test(src)],
 ['vehicle scope remains delegated to the canonical permission runtime',/PETATOEPermissions\.canAccessVehicle\(currentUserId\(\),vehicle\)/.test(src)],
 ['runtime super admin contract is registered',manifest.runtimeContracts&&manifest.runtimeContracts.vehicleOperationsSuperAdminAccess==='10.0.25-phase-e5-2-12-1-superadmin-vehicle-operations-access-contract-1']
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
console.log(`Phase E5.2.12.1 vehicle operations super admin access: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
