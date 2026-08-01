#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const m=JSON.parse(read('config/petatoe-version.json'));
const index=read('index.html'), worker=read('service-worker.js'), gate=read('performance/mobile-startup-loading-gate.js');
const sync=read('scripts/sync-version-manifest.js'), workflow=read('.github/workflows/localization-lockdown.yml');
const checks=[];function check(name,ok){checks.push({name,ok:!!ok});console.log(`${ok?'PASS':'FAIL'}: ${name}`);}
check('Canonical manifest validates release/cache separation',m.cacheVersion!==m.runtimeContracts.startupGate);
check('Runtime version manifest loads before startup gate',index.indexOf('runtime/version-manifest.js')>0&&index.indexOf('runtime/version-manifest.js')<index.indexOf('performance/mobile-startup-loading-gate.js'));
check('Service Worker cache namespace uses canonical cache version',worker.includes(`const APP_VERSION = '${m.cacheVersion}';`));
check('Service Worker startup gate URL uses canonical cache version',worker.includes(`mobile-startup-loading-gate.js?v=${m.cacheVersion}`));
check('Index startup gate uses canonical cache version',index.includes(`mobile-startup-loading-gate.js?v=${m.cacheVersion}`));
check('Smart router uses canonical cache version',index.includes(`smart/smart-router.js?v=${m.cacheVersion}`));
check('Smart runtime controller uses canonical cache version',index.includes(`smart/smart-reports-runtime-controller.js?v=${m.cacheVersion}`));
check('Startup gate compatibility contract remains independent',gate.includes(`version: '${m.runtimeContracts.startupGate}'`));
check('Release globals match canonical manifest',index.includes(`PETATOE_RELEASE_VERSION='${m.releaseLabel}'`)&&index.includes(`PETATOE_RELEASE_NAME='${m.releaseName}'`));
check('Write synchronization is enabled and deterministic',sync.includes("process.argv.includes('--write')")&&sync.includes('governedAssets'));
check('CI runs version single-source certification first',workflow.indexOf('Version single-source certification')<workflow.indexOf('Enterprise localization certification'));
check('Runtime manifest is generated, not manually owned',read('runtime/version-manifest.js').includes('Generated from config/petatoe-version.json'));
const failed=checks.filter(x=>!x.ok);if(failed.length){console.error(`Phase 1B: FAILED (${failed.length})`);process.exit(1);}console.log(`Phase 1B: PASSED (${checks.length}/${checks.length})`);
