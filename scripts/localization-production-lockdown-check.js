#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const failures=[];
const stats={filesScanned:0,legacyReferences:0,adapterDictionaries:0,publicAliasReferences:0,missingCounterparts:0,arabicEntries:0,englishEntries:0};
const skipDirs=new Set(['.git','node_modules']);
function rel(p){return path.relative(root,p).replace(/\\/g,'/');}
function walk(dir,out){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skipDirs.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(/\.(js|html)$/.test(e.name))out.push(p);}}
function flatten(obj,prefix='',out={}){for(const [k,v] of Object.entries(obj||{})){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,key,out);else out[key]=String(v??'');}return out;}
function fail(message){failures.push(message);}
const sandbox={window:{dispatchEvent(){}},CustomEvent:function(){},console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8'),sandbox,{filename:'dictionary-store.js'});
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
if(!store||!store.dictionaries)fail('Canonical localization store failed to load.');
const ar=flatten(store?.dictionaries?.ar||{}),en=flatten(store?.dictionaries?.en||{});
stats.arabicEntries=Object.keys(ar).length;stats.englishEntries=Object.keys(en).length;
for(const key of new Set([...Object.keys(ar),...Object.keys(en)])){if(!(key in ar)||!(key in en)){stats.missingCounterparts++;fail(`Missing language counterpart: ${key}`);}}
const files=[];walk(root,files);stats.filesScanned=files.length;
const forbidden=['PETATOE_SMART_REPORTS_TRANSLATIONS','PETATOE_BUSINESS_DATA_I18N'];
const compatibilityOnly=['PETATOE_OPERATIONS_I18N','PETATOE_WAREHOUSE_I18N'];
const aliases=['window.localize','window.petatoeLocalizationStatus','window.petatoeLocalizationReload'];
for(const file of files){const r=rel(file);const src=fs.readFileSync(file,'utf8');const isI18n=r.startsWith('i18n/');const isScript=r.startsWith('scripts/');
  if(!isI18n&&!isScript){for(const name of [...forbidden,...compatibilityOnly]){const n=(src.match(new RegExp('\\b'+name+'\\b','g'))||[]).length;if(n){stats.legacyReferences+=n;fail(`${r}: forbidden localization API ${name} (${n})`);}}}
  if(!isScript){for(const alias of aliases){if(src.includes(alias)){stats.publicAliasReferences++;fail(`${r}: deprecated public localization alias ${alias}`);}}}
}
const adapterFiles=['i18n/operations-source.js','i18n/warehouse-source.js','i18n/smart-reports-source.js','i18n/business-data-localization.js','i18n/maintenance-source.js'];
for(const r of adapterFiles){const src=fs.readFileSync(path.join(root,r),'utf8');if(/\bdictionaries\s*:\s*(?!null\b)[{[]/.test(src)||/\b(?:AR|EN|DICTIONARY|TRANSLATIONS)\s*=\s*[{[]/.test(src)){stats.adapterDictionaries++;fail(`${r}: compatibility adapter owns translation data`);}if(!src.includes('PETATOE_LOCALIZATION_CENTER'))fail(`${r}: compatibility adapter does not delegate to Localization Center`);}
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
if(!runtime.includes("VERSION='9.4.14-smart-reports-performance'"))fail('Localization Center runtime version mismatch.');
if(runtime.includes('window.localize=')||runtime.includes('window.petatoeLocalizationStatus=')||runtime.includes('window.petatoeLocalizationReload='))fail('Deprecated public localization aliases remain exported.');
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
if(!release.includes('PETATOE v9.4.14')||!release.includes('PETATOE_V9_4_14_SMART_REPORTS_DATA_READINESS_RECOVERY'))fail('Release metadata mismatch.');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!index.includes("PETATOE_RELEASE_VERSION='v9.4.14'")||!index.includes("PETATOE_RELEASE_NAME='PETATOE_V9_4_14_SMART_REPORTS_DATA_READINESS_RECOVERY'"))fail('index.html release metadata mismatch.');
const result={status:failures.length?'FAILED':'PASSED',stats,failures};
fs.writeFileSync(path.join(root,'PRODUCTION_LOCALIZATION_LOCKDOWN_RESULTS.json'),JSON.stringify(result,null,2));
if(failures.length){console.error('Production Localization Lockdown: FAILED');console.error(JSON.stringify(stats,null,2));failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Production Localization Lockdown: PASSED');console.log(JSON.stringify(stats,null,2));
