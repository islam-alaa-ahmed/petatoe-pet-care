#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const storage=fs.readFileSync(path.join(root,'operations/operations-storage.js'),'utf8');
const client=fs.readFileSync(path.join(root,'supabase-client.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;function check(v,m){if(v){console.log('PASS - '+m);passed++;}else{console.error('FAIL - '+m);failed++;}}
check(client.includes('QueryBuilder.prototype.limit'),'project REST client supports bounded row reads');
check(storage.includes('async function selectCanonicalMasterRow(c)'),'operations storage owns a compatible single-row reader');
check(storage.includes(".eq('id', CANONICAL_MASTER_ID)\n      .limit(1)"),'canonical row reader is filtered and limited');
check(!storage.includes('.maybeSingle()'),'operations storage does not call unsupported maybeSingle');
check(storage.includes('var currentRow = await selectCanonicalMasterRow(c);'),'confirmed update uses compatible canonical read');
check(storage.includes('var latestRow = await selectCanonicalMasterRow(c);'),'conflict recovery uses compatible canonical read');
check(storage.includes('var racedRow = await selectCanonicalMasterRow(c);'),'insert-race recovery uses compatible canonical read');
check(config.runtimeContracts&&config.runtimeContracts.operationsSupabaseCompatibility==='10.0.25-phase-e5-2-8-rest-client-single-row-contract-1','runtime compatibility contract is registered');
console.log(`Phase E5.2.8 Supabase REST query compatibility: ${passed}/${passed+failed} PASSED`);if(failed)process.exit(1);
