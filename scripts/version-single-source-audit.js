#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { rootDir, readManifest, writeJson, sha256 } = require('./version-manifest-lib');
const root = rootDir();
const strict = process.argv.includes('--strict');
const { data: manifest } = readManifest(root);
const read = rel => fs.readFileSync(path.join(root,rel),'utf8');
const index = read('index.html');
const worker = read('service-worker.js');
const gate = read('performance/mobile-startup-loading-gate.js');
const releaseTxt = read('RELEASE_VERSION.txt');
const native = JSON.parse(read('native-release.json'));
const runtimeSource = read('runtime/version-manifest.js');
const mobileCert = read('scripts/mobile-enterprise-v10-certification-check.js');
const gateCert = read('scripts/startup-gate-single-source-check.js');
const workflow = read('.github/workflows/localization-lockdown.yml');
const extract = (text,re)=>(text.match(re)||[])[1]||null;
const checks = [
  {id:'cache.serviceWorker',expected:manifest.cacheVersion,actual:extract(worker,/\bAPP_VERSION\s*=\s*['"]([^'"]+)['"]/),pass:false},
  {id:'cache.startupGate.index',expected:manifest.cacheVersion,actual:extract(index,/performance\/mobile-startup-loading-gate\.js\?v=([^'"&<\s]+)/),pass:false},
  {id:'cache.startupGate.shell',expected:manifest.cacheVersion,actual:extract(worker,/performance\/mobile-startup-loading-gate\.js\?v=([^'"&<\s]+)/),pass:false},
  {id:'cache.smartRouter',expected:manifest.cacheVersion,actual:extract(index,/smart\/smart-router\.js\?v=([^'"&<\s]+)/),pass:false},
  {id:'cache.smartRuntime',expected:manifest.cacheVersion,actual:extract(index,/smart\/smart-reports-runtime-controller\.js\?v=([^'"&<\s]+)/),pass:false},
  {id:'cache.runtimeManifest',expected:manifest.cacheVersion,actual:extract(index,/runtime\/version-manifest\.js\?v=([^'"&<\s]+)/),pass:false},
  {id:'release.index',expected:manifest.releaseLabel,actual:extract(index,/PETATOE_RELEASE_VERSION\s*=\s*['"]([^'"]+)['"]/),pass:false},
  {id:'release.name.index',expected:manifest.releaseName,actual:extract(index,/PETATOE_RELEASE_NAME\s*=\s*['"]([^'"]+)['"]/),pass:false},
  {id:'release.file',expected:`PETATOE ${manifest.releaseLabel}`,actual:releaseTxt.split(/\r?\n/)[0],pass:false},
  {id:'native.latest',expected:manifest.native.latestVersion,actual:native.latestVersion,pass:false},
  {id:'native.minimum',expected:manifest.native.minimumSupportedVersion,actual:native.minimumSupportedVersion,pass:false},
  {id:'contract.startupGate',expected:manifest.runtimeContracts.startupGate,actual:extract(gate,/version:\s*['"]([^'"]+)['"]/),pass:false},
  {id:'runtime.generated',expected:'canonical manifest payload',actual:sha256(runtimeSource),pass:runtimeSource.includes('Generated from config/petatoe-version.json')},
  {id:'cert.mobile.dynamic',expected:'manifest.cacheVersion',actual:mobileCert.includes('versionManifest.cacheVersion')?'dynamic':'literal',pass:mobileCert.includes('versionManifest.cacheVersion')},
  {id:'cert.gate.dynamic',expected:'runtimeContracts.startupGate',actual:gateCert.includes('versionManifest.runtimeContracts.startupGate')?'dynamic':'literal',pass:gateCert.includes('versionManifest.runtimeContracts.startupGate')},
  {id:'workflow.versionGate',expected:'version-single-source-check.js',actual:workflow.includes('node scripts/version-single-source-check.js')?'wired':'missing',pass:workflow.includes('node scripts/version-single-source-check.js')}
];
for(const c of checks){ if(c.pass !== true) c.pass = c.actual === c.expected; }
const failures = checks.filter(c=>!c.pass);
const report={generatedAt:new Date().toISOString(),status:failures.length?'FAILED':'PASSED',manifest,checks,failures};
writeJson(path.join(root,'audit/phase1/PETATOE_PHASE1B_VERSION_SYNC_AUDIT.json'),report);
const md=['# PETATOE Phase 1B — Automated Version Synchronization','',`Status: **${report.status}**`,'',
  '| Check | Expected | Actual | Result |','|---|---|---|---|',...checks.map(c=>`| ${c.id} | ${c.expected} | ${c.actual} | ${c.pass?'PASS':'FAIL'} |`),''].join('\n');
fs.writeFileSync(path.join(root,'audit/phase1/PETATOE_PHASE1B_VERSION_SYNC_REPORT.md'),md);
console.log(`PETATOE Version Single Source: ${report.status}`);
failures.forEach(c=>console.error(`- ${c.id}: expected=${c.expected} actual=${c.actual}`));
if(strict && failures.length) process.exit(1);
