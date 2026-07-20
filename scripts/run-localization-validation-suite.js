#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const manifestPath=path.join(__dirname,'localization-validation-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const failures=[];
const results=[];
function run(name,blocking){
  const started=Date.now();
  const child=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,encoding:'utf8'});
  const item={name,blocking,status:child.status===0?'PASSED':'FAILED',durationMs:Date.now()-started,stdout:(child.stdout||'').trim(),stderr:(child.stderr||'').trim()};
  results.push(item);
  if(blocking&&child.status!==0)failures.push(name);
  const mark=item.status==='PASSED'?'PASS':'FAIL';
  console.log(`[${mark}] ${name} (${item.durationMs} ms)${blocking?'':' [diagnostic]'}`);
  if(item.status==='FAILED'&&(item.stderr||item.stdout))console.log((item.stderr||item.stdout).split(/\r?\n/).slice(0,8).map(x=>'  '+x).join('\n'));
}
for(const name of manifest.groups.productionGates)run(name,true);
for(const name of manifest.groups.diagnostics)run(name,false);
const output={status:failures.length?'FAILED':'PASSED',generatedAt:new Date().toISOString(),manifest:rel(manifestPath),release:manifest.release,canonicalDictionary:manifest.canonicalDictionary,summary:{productionGates:manifest.groups.productionGates.length,diagnostics:manifest.groups.diagnostics.length,historicalExcluded:manifest.groups.historical.length,blockingFailures:failures.length},failures,results};
function rel(p){return path.relative(root,p).replace(/\\/g,'/');}
fs.writeFileSync(path.join(root,'LOCALIZATION_VALIDATION_SUITE_RESULTS.json'),JSON.stringify(output,null,2));
console.log(`Localization validation suite: ${output.status}`);
console.log(JSON.stringify(output.summary,null,2));
if(failures.length)process.exit(1);
