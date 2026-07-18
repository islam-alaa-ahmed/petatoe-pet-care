#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const failures=[];
const warnings=[];
const stats={files:0,js:0,html:0,legacyCalls:0,staticUiCandidates:0,missingStoredTexts:0,missingCounterparts:0};
function rel(p){return path.relative(root,p).replace(/\\/g,'/');}
function walk(dir,out){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(/\.(js|html)$/.test(e.name))out.push(p);}}
function flatten(obj,prefix='',out={}){for(const [k,v] of Object.entries(obj||{})){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,key,out);else out[key]=String(v??'');}return out;}
function normalize(s){return String(s||'').replace(/\s+/g,' ').trim();}
const sandbox={window:{dispatchEvent(){}},CustomEvent:function(){},console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8'),sandbox,{filename:'dictionary-store.js'});
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
if(!store||!store.dictionaries)failures.push('Canonical localization store could not be loaded.');
const ar=flatten(store?.dictionaries?.ar||{}), en=flatten(store?.dictionaries?.en||{});
for(const key of new Set([...Object.keys(ar),...Object.keys(en)])){if(!(key in ar)||!(key in en)){stats.missingCounterparts++;failures.push(`Missing language counterpart: ${key}`);}}
const arValues=new Set(Object.values(ar).map(normalize).filter(Boolean));
const enValues=new Set(Object.values(en).map(normalize).filter(Boolean));
const all=[];walk(root,all);stats.files=all.length;stats.js=all.filter(f=>f.endsWith('.js')).length;stats.html=all.filter(f=>f.endsWith('.html')).length;
const legacyNames=['PETATOE_I18N','PETATOE_SMART_REPORTS_TRANSLATIONS','PETATOE_BUSINESS_DATA_I18N','PETATOE_OPERATIONS_I18N','PETATOE_WAREHOUSE_I18N'];
const uiPatterns=[
 /(?:alert|confirm|prompt|toast|notify)\s*\(\s*(['"`])([^'"`]*[\u0600-\u06FF][^'"`]*)\1/g,
 /(?:textContent|innerText|placeholder|title|ariaLabel|aria-label)\s*=\s*(['"`])([^'"`]*[\u0600-\u06FF][^'"`]*)\1/g,
 /(?:setAttribute\s*\(\s*['"](?:placeholder|title|aria-label)['"]\s*,\s*)(['"`])([^'"`]*[\u0600-\u06FF][^'"`]*)\1/g,
 /translateRuntime\s*\(\s*(['"`])([^'"`]*[\u0600-\u06FF][^'"`]*)\1/g
];
for(const file of all){const r=rel(file);const src=fs.readFileSync(file,'utf8');const isI18n=r.startsWith('i18n/');const isScripts=r.startsWith('scripts/');if(!isI18n&&!isScripts){for(const name of legacyNames){const re=new RegExp('\\b'+name+'\\b','g');const hits=src.match(re)||[];if(hits.length){stats.legacyCalls+=hits.length;failures.push(`${r}: direct legacy localization reference ${name} (${hits.length})`);}}}
 if(!isScripts){for(const pattern of uiPatterns){pattern.lastIndex=0;let m;while((m=pattern.exec(src))){const text=normalize(m[2]);if(!text||text.includes('${'))continue;stats.staticUiCandidates++;if(!arValues.has(text)){stats.missingStoredTexts++;failures.push(`${r}: displayed Arabic text is not stored in the canonical center: ${text.slice(0,120)}`);}}}}
}
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');if(!release.includes('PETATOE v9.4.16')||!release.includes('PETATOE_V9_4_16_SMART_REPORTS_PUBLIC_API_RESTORATION'))failures.push('Release metadata is not synchronized to v9.4.16.');
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');if(!runtime.includes("VERSION='9.4.16-smart-reports-public-api'"))failures.push('Localization runtime version is not synchronized to v9.4.16.');
const result={status:failures.length?'FAILED':'PASSED',stats:{...stats,arabicEntries:Object.keys(ar).length,englishEntries:Object.keys(en).length},failures,warnings};
fs.writeFileSync(path.join(root,'ENTERPRISE_LOCALIZATION_CERTIFICATION_RESULTS.json'),JSON.stringify(result,null,2));
if(failures.length){console.error('Enterprise Localization Certification: FAILED');console.error(JSON.stringify(result.stats,null,2));failures.slice(0,80).forEach(x=>console.error('- '+x));if(failures.length>80)console.error(`- ... ${failures.length-80} more`);process.exit(1);}else{console.log('Enterprise Localization Certification: PASSED');console.log(JSON.stringify(result.stats,null,2));}
