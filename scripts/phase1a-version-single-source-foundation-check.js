'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
let passed=0, failed=0;
function check(ok,msg){ if(ok){passed++;console.log('PASS:',msg);}else{failed++;console.error('FAIL:',msg);} }
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
const manifest=JSON.parse(read('config/petatoe-version.json'));
const audit=JSON.parse(read('audit/phase1/PETATOE_PHASE1A_VERSION_AUDIT.json'));
const runtime=read('runtime/version-manifest.js');
const sync=read('scripts/sync-version-manifest.js');
check(manifest.releaseVersion==='10.0.25','canonical release version recorded');
check(manifest.releaseLabel==='v10.0.25','canonical release label recorded');
check(manifest.cacheVersion==='10.0.25-sg4-7-6-smart-reports-consolidated-regression-1','canonical intended cache version recorded');
check(manifest.runtimeContracts.startupGate==='10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1','startup gate contract remains independent');
check(runtime.includes('Generated from config/petatoe-version.json'),'runtime manifest is generated');
check(runtime.includes('PETATOEVersionManifest'),'runtime manifest exposes stable diagnostic API');
check(sync.includes('Write mode is locked in Phase 1A'),'synchronization write mode is locked');
check(audit.mode==='audit','audit runs in non-mutating mode');
check(audit.summary.driftChecks===1,'known service-worker cache drift is detected exactly once');
check(audit.checks.some(c=>c.id==='manifest.cache.serviceWorker'&&!c.aligned),'service-worker drift is documented');
check(!read('index.html').includes('runtime/version-manifest.js'),'Phase 1A does not alter runtime load order');
check(!read('service-worker.js').includes('PETATOEVersionManifest'),'Phase 1A does not alter service-worker runtime');
console.log(`\nPhase 1A Version Single Source Foundation: ${failed?'FAILED':'PASSED'} (${passed}/${passed+failed})`);
if(failed)process.exit(1);
