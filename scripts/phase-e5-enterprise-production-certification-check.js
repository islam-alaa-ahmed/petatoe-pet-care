#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const json=(p)=>JSON.parse(read(p));
let passed=0, failed=0;
function check(ok,label){ if(ok){passed++;console.log(`PASS: ${label}`);}else{failed++;console.error(`FAIL: ${label}`);} }
const config=json('config/petatoe-version.json');
const index=read('index.html'); const sw=read('service-worker.js');
const about=read('mobile/about-app.js'); const workflow=read('.github/workflows/localization-lockdown.yml');
const contracts=json('scripts/test-contracts.json');
check(config.releaseName==='PETATOE_V10_0_25_ENTERPRISE_PRODUCTION_CERTIFICATION_E5','final production release identity recorded');
check(config.buildVersion===config.cacheVersion,'build and cache versions are synchronized');
check(config.runtimeContracts.finalProductionCertification==='10.0.25-phase-e5-production-baseline-contract-1','final production runtime contract recorded');
check(index.includes(`runtime/version-manifest.js?v=${config.cacheVersion}`),'index loads canonical runtime manifest token');
check(index.includes(`window.PETATOE_RELEASE_NAME='${config.releaseName}'`),'index exposes canonical release name');
check(sw.includes(`const APP_VERSION = '${config.cacheVersion}';`),'service worker uses canonical cache namespace');
check(about.includes('window.PETATOEVersionManifest&&window.PETATOEVersionManifest.releaseName'),'About App fallback uses canonical runtime manifest');
check(!about.includes('PETATOE_V10_0_25_NAVIGATION_RUNTIME_ISOLATION_C2_3'),'obsolete About App release fallback removed');
check(workflow.includes('node scripts/run-active-contracts.js'),'GitHub workflow executes active enterprise contracts');
check(workflow.includes("find . -type f -name '*.js'"),'GitHub workflow validates JavaScript syntax');
for(const name of ['phase-e3-navigation-runtime-lifecycle-check.js','phase-e4-permissions-session-certification-check.js','phase-e5-enterprise-production-certification-check.js']) check(contracts.active.includes(name),`${name} is active in CI`);
check(config.runtimeContracts.navigationLifecycle==='10.0.25-phase-e3-previous-route-lifecycle-contract-1','E3 navigation lifecycle contract retained');
check(config.runtimeContracts.sessionRuntime==='10.0.25-phase-e4-1-session-invalidation-epoch-contract-1','E4.1 session invalidation contract retained');
if(failed){console.error(`Phase E5 Enterprise Production Certification: FAILED — ${passed}/${passed+failed}`);process.exit(1);}console.log(`Phase E5 Enterprise Production Certification: PASSED — ${passed}/${passed}`);
