#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let passed=0,failed=0;function check(v,m){if(v){console.log('PASS - '+m);passed++;}else{console.error('FAIL - '+m);failed++;}}
const repo=read('core/supabase-repository.js');
const auth=read('security/auth-session.js');
check(repo.includes('window.__PETATOE_IDENTITY_RUNTIME__'),'identity request state survives duplicate module evaluation');
check(repo.includes('if(identityCache.loading) return identityCache.loading'),'identity reads use a shared single-flight promise');
check(repo.includes('IDENTITY_RETRY_COOLDOWN_MS=15000'),'failed identity reads have a bounded retry cooldown');
check(repo.includes('identityRuntime.lastFailureAt'),'identity failures are tracked without immediate retry loops');
check(!auth.includes('ids._cache.loading=null'),'session validation no longer clears an active identity load promise');
check(auth.includes('sessionValidationPromise'),'remote session validation is coalesced');
check(auth.includes('SESSION_VALIDATION_MIN_INTERVAL_MS = 5000'),'session validation event bursts are throttled');
console.log(`Phase E5.2.6 identity request storm: ${passed}/${passed+failed} PASSED`);if(failed)process.exit(1);
