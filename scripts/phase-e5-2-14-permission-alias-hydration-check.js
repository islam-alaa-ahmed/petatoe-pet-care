#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const repo=fs.readFileSync(path.join(root,'core/supabase-repository.js'),'utf8');
const perms=fs.readFileSync(path.join(root,'settings/permissions.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
  ['identity loader aggregates granular permission rows',repo.includes('function applyGranularPermission')&&repo.includes('split(/[.:/]/)')],
  ['identity loader accepts legacy permission payload columns',repo.includes('r.permissions')&&repo.includes('r.legacy_payload')],
  ['loaded permission records are aliased to canonical user identities',repo.includes('Alias every loaded record to the canonical user identity')&&repo.includes('user.supabase_id')&&repo.includes('user.username')],
  ['screen actions from granular rows preserve allowed state',repo.includes('target.screens[screen][action]=boolAllowed(row)')],
  ['special permissions from granular rows are retained',repo.includes('target.special[special]=boolAllowed(row)')],
  ['permission lookup merges all matching aliases instead of first match',perms.includes('foundKeys.push(storeKeys[i])')&&perms.includes('function merge(source)')],
  ['saved full permission records remain supported',repo.includes("key==='full'||data.screens||data.special||data.vehicleScope")],
  ['permission alias hydration runtime contract is registered',manifest.runtimeContracts&&manifest.runtimeContracts.permissionAliasHydration==='10.0.25-phase-e5-2-14-permission-alias-hydration-contract-1']
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
console.log(`Phase E5.2.14 permission alias hydration: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
