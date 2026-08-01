#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const contractPath=path.join(ROOT,'audit','phase0_5','PETATOE_PHASE0_5_SCHEMA_CONTRACT.json');
function check(ok,msg){ if(!ok){ console.error('FAILED:',msg); process.exitCode=1; } else console.log('PASSED:',msg); }
check(fs.existsSync(contractPath),'schema contract artifact exists');
if(fs.existsSync(contractPath)){
  const c=JSON.parse(fs.readFileSync(contractPath,'utf8'));
  check(c.mode==='read-only-static-contract-audit','audit is explicitly read-only');
  check(c.counts.referencedTables===11,'11 direct Supabase table references inventoried');
  check(c.counts.referencedRpcs===15,'15 RPC references inventoried');
  check(c.counts.referencedEdgeFunctions===2,'2 Edge Function references inventoried');
  check(c.gaps.referencedRpcsWithoutRepositoryFunctionDefinition.length===0,'all referenced RPCs have repository SQL definitions');
  check(c.gaps.referencedEdgeFunctionsWithoutDirectory.length===0,'all referenced Edge Functions have source directories');
  check(c.gaps.referencedTablesWithoutRepositoryCreateDefinition.length===10,'core schema migration-definition gap is explicitly recorded');
}
check(fs.existsSync(path.join(ROOT,'audit','phase0_5','PETATOE_PHASE0_5_READONLY_LIVE_VERIFICATION.sql')),'read-only live verification SQL exists');
if(!process.exitCode) console.log('PETATOE Phase 0.5 Supabase Schema Verification: PASSED WITH DOCUMENTED LIVE-DB DEPENDENCY');
