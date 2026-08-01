#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { rootDir, readManifest } = require('./version-manifest-lib');
const root = rootDir();
const { data: manifest } = readManifest(root);
const writeMode = process.argv.includes('--write');

function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, text){ fs.writeFileSync(path.join(root, rel), text); }
function replaceRequired(text, pattern, replacement, label){
  const next = text.replace(pattern, replacement);
  if(next === text && !pattern.test(text)) throw new Error(`Unable to synchronize ${label}`);
  pattern.lastIndex = 0;
  return next;
}
function synchronize(){
  const changes = [];
  let index = read('index.html');
  const runtimeTag = `<script src="runtime/version-manifest.js?v=${manifest.cacheVersion}"></script>`;
  if(/runtime\/version-manifest\.js\?v=/.test(index)){
    const next = index.replace(/<script src="runtime\/version-manifest\.js\?v=[^"]+"><\/script>/, runtimeTag);
    if(next !== index) changes.push('index.html: runtime manifest cache token');
    index = next;
  }else{
    const marker = "<script>window.PETATOEEarliestBootstrapTrace&&window.PETATOEEarliestBootstrapTrace.end('i18n/bootstrap.js');</script>";
    if(!index.includes(marker)) throw new Error('Unable to locate runtime manifest insertion point.');
    index = index.replace(marker, `${marker}\n${runtimeTag}`);
    changes.push('index.html: runtime manifest reference');
  }
  const governedAssets = [
    'performance/mobile-startup-loading-gate.js',
    'smart/smart-router.js',
    'smart/smart-reports-runtime-controller.js',
    'sales/sales-invoice-report.js',
    'sales/invoice-print-preview.js'
  ];
  for(const asset of governedAssets){
    const re = new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\?v=[^\\\'"&<\\s]+', 'g');
    const next = index.replace(re, `${asset}?v=${manifest.cacheVersion}`);
    if(next !== index) changes.push(`index.html: ${asset}`);
    index = next;
  }
  const releaseRe = /window\.PETATOE_RELEASE_VERSION='[^']*';window\.PETATOE_RELEASE_NAME='[^']*';/;
  const releaseValue = `window.PETATOE_RELEASE_VERSION='${manifest.releaseLabel}';window.PETATOE_RELEASE_NAME='${manifest.releaseName}';`;
  if(!releaseRe.test(index)) throw new Error('Release globals were not found in index.html.');
  const releaseNext = index.replace(releaseRe, releaseValue);
  if(releaseNext !== index) changes.push('index.html: release globals');
  index = releaseNext;

  let worker = read('service-worker.js');
  const workerNext = worker
    .replace(/const APP_VERSION = '[^']+';/, `const APP_VERSION = '${manifest.cacheVersion}';`)
    .replace(/\.\/performance\/mobile-startup-loading-gate\.js\?v=[^']+/, `./performance/mobile-startup-loading-gate.js?v=${manifest.cacheVersion}`);
  if(workerNext !== worker) changes.push('service-worker.js: cache namespace and startup gate URL');
  worker = workerNext;

  const releaseText = `PETATOE ${manifest.releaseLabel}\n${manifest.releaseName}\n`;
  if(read('RELEASE_VERSION.txt') !== releaseText) changes.push('RELEASE_VERSION.txt');

  const nativePath = path.join(root,'native-release.json');
  const native = JSON.parse(fs.readFileSync(nativePath,'utf8'));
  const beforeNative = JSON.stringify(native);
  native.latestVersion = manifest.native.latestVersion;
  native.minimumSupportedVersion = manifest.native.minimumSupportedVersion;
  if(JSON.stringify(native) !== beforeNative) changes.push('native-release.json');

  if(writeMode){
    write('index.html', index);
    write('service-worker.js', worker);
    write('RELEASE_VERSION.txt', releaseText);
    fs.writeFileSync(nativePath, JSON.stringify(native, null, 2) + '\n');
  }
  return changes;
}

const changes = synchronize();
console.log(`PETATOE version synchronization ${writeMode?'WRITE':'PREVIEW'} mode`);
if(changes.length) changes.forEach(item=>console.log(`- ${item}`));
else console.log('- No drift detected.');
if(!writeMode && changes.length) process.exitCode = 1;
