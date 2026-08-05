#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const repo=fs.readFileSync(path.join(root,'core/supabase-repository.js'),'utf8');
const perms=fs.readFileSync(path.join(root,'settings/permissions.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
 ['permission rows retain every identity alias supplied by the canonical source',repo.includes('function permissionRowAliases')&&repo.includes('row.username,row.login,row.email')&&repo.includes('data.auth_user_id,data.auth_uid')],
 ['one permission row is published under all of its database aliases',repo.includes("aliases.forEach(function(alias){map[alias]=clone(target);})")],
 ['runtime permission decisions accept an authenticated session subject before app_users hydration completes',perms.includes('function permissionSubject(ref)')&&perms.includes("if(ref&&typeof ref==='object'&&permissionStoreKeys(ref).length)return ref")],
 ['screen permission reads use the resolved session permission subject',perms.includes('var u=permissionSubject(uid);')],
 ['permission diagnostics expose the resolved permission subject',perms.includes('permissionSubject:permissionSubject')],
 ['permission alias cleanup is compatible with the project REST client',repo.includes("delete().eq('user_id',keys[i])")&&!repo.includes("delete().in('user_id',keys)")],
 ['permission runtime binding contract is registered',manifest.runtimeContracts&&manifest.runtimeContracts.permissionRuntimeBinding==='10.0.25-phase-e5-2-14-2-session-permission-binding-contract-1']
];
let failed=0;for(const [n,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+n);if(!ok)failed++;}
console.log(`Phase E5.2.14.2 permission runtime binding: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
