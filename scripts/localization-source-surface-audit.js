#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const enforce=process.argv.includes('--enforce');
const excludedDirs=new Set(['.git','node_modules','i18n','scripts']);
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.isDirectory()&&excludedDirs.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(html|js)$/.test(entry.name))files.push(full);}}
function rel(p){return path.relative(root,p).replace(/\\/g,'/');}
walk(root);
const arabic=/[\u0600-\u06FF]/;
const findings=[];
const htmlBinding=/(?:data-i18n|data-i18n-placeholder|data-i18n-title|data-i18n-aria-label)\s*=/;
for(const file of files){const source=fs.readFileSync(file,'utf8');const lines=source.split(/\r?\n/);for(let i=0;i<lines.length;i++){const line=lines[i];if(!arabic.test(line))continue;let category='source-literal';if(file.endsWith('.html'))category=htmlBinding.test(line)?'explicitly-bound-html':'unbound-html-candidate';else if(/(?:alert|confirm|prompt|toast|notify|textContent|innerText|placeholder|title|ariaLabel|setAttribute|innerHTML|insertAdjacentHTML)/.test(line))category='runtime-ui-candidate';findings.push({file:rel(file),line:i+1,category,sample:line.trim().slice(0,240)});}}
const counts={};for(const item of findings)counts[item.category]=(counts[item.category]||0)+1;
const result={status:(counts['unbound-html-candidate']||0)+(counts['runtime-ui-candidate']||0)>0?'OPEN':'CLEAN',mode:enforce?'enforce':'diagnostic',filesScanned:files.length,totalArabicLines:findings.length,counts,findings};
fs.writeFileSync(path.join(root,'LOCALIZATION_SOURCE_SURFACE_RESULTS.json'),JSON.stringify(result,null,2));
console.log('Localization source surface audit:',result.status);console.log(JSON.stringify({filesScanned:result.filesScanned,totalArabicLines:result.totalArabicLines,counts:result.counts},null,2));
if(enforce&&result.status!=='CLEAN')process.exit(1);
