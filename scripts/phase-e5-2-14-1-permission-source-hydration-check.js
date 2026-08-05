#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const repo=fs.readFileSync(path.join(root,'core/supabase-repository.js'),'utf8');
const perms=fs.readFileSync(path.join(root,'settings/permissions.js'),'utf8');
const nav=fs.readFileSync(path.join(root,'navigation/navigation-permissions.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
  ['application users retain the Supabase Auth identity',repo.includes('auth_user_id:String(row.auth_user_id||row.auth_uid')&&repo.includes('auth_uid:String(row.auth_uid||row.auth_user_id')],
  ['permission rows can resolve application, database and auth identities',repo.includes('function permissionRowAliases')&&repo.includes('row.auth_user_id,row.auth_uid')&&repo.includes('data.auth_user_id,data.auth_uid')],
  ['permission aliases include the authenticated user id',repo.includes('user.auth_user_id,user.auth_uid')&&perms.includes('add(u.auth_user_id);add(u.auth_uid)')],
  ['navigation permission identity candidates include auth aliases',nav.includes('add(u&&u.auth_user_id); add(u&&u.auth_uid)')&&nav.includes('x.auth_user_id,x.auth_uid')],
  ['nested permission payloads are unwrapped',repo.includes('function extractPermissionPayload')&&repo.includes('source.permissions')&&repo.includes('source.permission')],
  ['granular permission columns are read from the database row',repo.includes('row.screen||row.screen_key||row.module')&&repo.includes('row.action||row.permission_action')],
  ['screen and action aliases are canonicalized before runtime use',repo.includes('function canonicalPermissionScreen')&&repo.includes('function canonicalPermissionAction')],
  ['failed permission reads do not mark permission hydration ready',repo.includes('identityCache.permissionsLoaded=false')&&nav.includes('c.permissionsLoaded === false')],
  ['permission hydration retries after a failed Supabase read',nav.includes("ids.load({force:true})")&&nav.includes('(now-rt.lastAttemptAt)>5000')],
  ['appointments permission aliases are consistent across runtime and navigation',perms.includes("'appointments-master':'appointments',appointmentsMaster:'appointments'")],
  ['permission source hydration runtime contract is registered',manifest.runtimeContracts&&manifest.runtimeContracts.permissionSourceHydration==='10.0.25-phase-e5-2-14-1-canonical-permission-source-hydration-contract-1']
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
console.log(`Phase E5.2.14.1 permission source hydration: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
