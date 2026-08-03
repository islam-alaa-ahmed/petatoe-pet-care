#!/usr/bin/env node
'use strict';
const fs=require('fs');
const storage=fs.readFileSync('operations/operations-storage.js','utf8');
const cfg=JSON.parse(fs.readFileSync('config/petatoe-version.json','utf8'));
const checks=[
 ['master concurrency uses data fingerprint',storage.includes('masterServerFingerprint')&&storage.includes('masterFingerprint(currentRow.data)')],
 ['master update does not manually write updated_at',storage.includes(".update({ data: normalized })")&&!storage.includes(".update({ data: normalized, updated_at:")],
 ['confirmed update verifies persisted payload',storage.includes('OPERATIONS_MASTER_DATA_WRITE_NOT_VERIFIED')&&storage.includes('masterFingerprint(verifiedRow.data) !== desiredFingerprint')],
 ['confirmed insert verifies persisted payload',storage.includes('OPERATIONS_MASTER_DATA_INSERT_NOT_VERIFIED')],
 ['confirmed writer captures baseline fingerprint after readiness',storage.includes('var expectedFingerprint = masterServerFingerprint')],
 ['remote master acceptance refreshes fingerprint',storage.includes('masterServerFingerprint = masterFingerprint(row.data)')],
 ['runtime contract is registered',cfg.runtimeContracts&&cfg.runtimeContracts.vehicleAssignmentVerifiedPersistence==='10.0.25-phase-e5-2-7-verified-master-persistence-contract-1']
];
let passed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(ok)passed++;}
console.log(`Phase E5.2.7 vehicle assignment verified persistence: ${passed}/${checks.length} PASSED`);
if(passed!==checks.length)process.exit(1);
