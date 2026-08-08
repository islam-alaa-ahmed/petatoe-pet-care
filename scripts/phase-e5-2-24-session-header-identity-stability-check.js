#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let passed=0,failed=0;function check(v,m){if(v){console.log('PASS - '+m);passed++;}else{console.error('FAIL - '+m);failed++;}}
const auth=read('security/auth-session.js');
const repo=read('core/supabase-repository.js');
const index=read('index.html');
check(index.includes('data-i18n="topbar.loading" id="topbarUserRole"'),'topbar keeps a localized loading placeholder before auth resolves');
check(auth.includes("roleEl.removeAttribute('data-i18n')"),'auth takes ownership of the role label after session resolution');
check(auth.includes("updateHeader(user);\n      var valid=await validateSessionUser('auth-restore')"),'persisted session resolves header before remote validation completes');
check(auth.includes("loadFreshUsers(reason==='session-watch'||reason==='users-changed')"),'normal auth restore reuses hydrated identity while explicit change/watch refreshes remain fresh');
check(repo.includes('if(!options.force && identityCache.loaded===true) return identityCache'),'identity store returns its hydrated cache to non-force readers');
check(repo.includes('if(identityCache.loading) return identityCache.loading'),'identity store preserves single-flight behavior while loading');
check(auth.includes("ids.load({force:true})"),'explicit identity refresh path remains available for security/user-change validation');
console.log(`Phase E5.2.24 session/header identity stability: ${passed}/${passed+failed} PASSED`);if(failed)process.exit(1);
