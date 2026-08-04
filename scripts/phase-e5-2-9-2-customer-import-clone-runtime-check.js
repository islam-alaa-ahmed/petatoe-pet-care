const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const legacy=read('operations/operations-legacy-engine.js');
const core=read('operations/operations-core.js');
const version=JSON.parse(read('config/petatoe-version.json'));
const approveBlock=(legacy.match(/function approveMasterCustomersExcelImport\(\)\{[\s\S]*?\n  \}/)||[''])[0];
const checks=[
 ['legacy engine owns a local clone helper',/function cloneJSON\(value\)\{/.test(legacy)],
 ['clone helper prefers structuredClone when available',legacy.includes("typeof structuredClone==='function'")&&legacy.includes('structuredClone(value)')],
 ['clone helper has JSON compatibility fallback',legacy.includes('JSON.parse(JSON.stringify(value))')],
 ['approval captures an isolated staged master payload',approveBlock.includes('var payload=cloneJSON(pendingMasterCustomersImport.master)')],
 ['approval reaches confirmed Supabase persistence',approveBlock.includes('storage.writeMasterDataConfirmed(payload)')],
 ['approval and cancel remain exposed by operations facade',core.includes("'approveMasterCustomersExcelImport'")&&core.includes("'cancelMasterCustomersExcelImport'")],
 ['clone runtime contract is registered',version.runtimeContracts&&version.runtimeContracts.customerImportCloneRuntime==='10.0.25-phase-e5-2-9-2-customer-import-clone-runtime-contract-1']
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)fail++;}
console.log(`Phase E5.2.9.2 customer import clone runtime: ${checks.length-fail}/${checks.length} PASSED`);
process.exit(fail?1:0);
