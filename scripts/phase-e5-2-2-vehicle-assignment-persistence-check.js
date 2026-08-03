const fs=require('fs');
const setup=fs.readFileSync('settings/setup.js','utf8');
const storage=fs.readFileSync('operations/operations-storage.js','utf8');
const ops=fs.readFileSync('operations/operations-legacy-engine.js','utf8');
const checks=[
 ['setup invalidates stale master cache',setup.includes('__masterCache=null;__masterCacheAt=0')],
 ['setup exposes readiness promise',setup.includes('ensureMasterReady:ensureMasterReady')],
 ['storage exposes confirmed writer',storage.includes('writeMasterDataConfirmed')],
 ['assignment waits for confirmed writer',ops.includes('writeMasterDataConfirmed')&&ops.includes("then(function(){renderMasterData();refreshLookupSelects();toast(opT('assignmentSaved'))")],
 ['appointment waits for setup readiness',ops.includes("setup.ensureMasterReady")],
 ['permission group remains isolated',!ops.includes("ensureGroup('settingsSetup')")]
];
let fail=0;for(const [n,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+n);if(!ok)fail++;}
console.log(`Phase E5.2.2 Vehicle Assignment Persistence: ${checks.length-fail}/${checks.length} PASSED`);process.exit(fail?1:0);
