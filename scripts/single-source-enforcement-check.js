#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fail=[];
function assert(ok,msg){if(!ok)fail.push(msg);}
const runtime=read('i18n/localization-center/runtime.js');
const consolidation=read('i18n/localization-center/consolidation.js');
const globalTranslator=read('i18n/global-screen-translator.js');
const index=read('index.html');
const release=read('RELEASE_VERSION.txt');
assert(runtime.includes("VERSION='9.4.3-single-source-enforcement'"),'runtime version is not v9.4.2');
assert(!/a&&a\.translate\(/.test(runtime),'runtime still falls back to PETATOE_I18N.translate');
assert(runtime.includes('PETATOE_LOCALIZATION_CENTER_BUSINESS'),'business localization is not owned by the center');
assert(consolidation.includes('__singleSourceEnforced=true'),'single-source enforcement flag missing');
assert(!consolidation.includes('runtimeMap='),'consolidation still embeds a runtime dictionary');
assert(globalTranslator.includes('var UI_GLOSSARY={}'),'global translator still embeds UI_GLOSSARY');
assert(globalTranslator.includes('PETATOE_LOCALIZATION_CENTER_STORE'),'global translator does not index the canonical store');
for(const f of ['i18n/operations-source.js','i18n/warehouse-source.js','i18n/smart-reports-source.js','i18n/business-data-localization.js','i18n/maintenance-source.js']){
  const src=read(f);
  assert(src.includes('PETATOE_LOCALIZATION_CENTER'),`${f} is not a center adapter`);
  assert(!/\bvar\s+(ar|en)\s*=\s*\{/.test(src),`${f} still embeds a language dictionary`);
}
assert(index.indexOf('localization-center/dictionary-store.js')<index.indexOf('localization-center/runtime.js'),'dictionary store must load before runtime');
assert(index.indexOf('localization-center/runtime.js')<index.indexOf('operations-source.js'),'center must load before compatibility adapters');
assert(release.includes('PETATOE v9.4.3')&&release.includes('ELC_V9_4_3_ENTERPRISE_LOCALIZATION_CERTIFICATION'),'release metadata mismatch');
const applicationFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules'||e.name==='scripts'||e.name==='i18n')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(js|html)$/.test(e.name))applicationFiles.push(p);}}
walk(root);
const forbidden=/PETATOE_SMART_REPORTS_TRANSLATIONS|PETATOE_BUSINESS_DATA_I18N|PETATOE_OPERATIONS_I18N|PETATOE_WAREHOUSE_I18N/;
for(const f of applicationFiles){const src=fs.readFileSync(f,'utf8');if(forbidden.test(src))fail.push(`${path.relative(root,f)} directly references a legacy localization API`);}
if(fail.length){console.error('Single Source Enforcement: FAILED');fail.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Single Source Enforcement: PASSED');
console.log(`Application files scanned: ${applicationFiles.length}`);
console.log('Legacy dictionaries in compatibility adapters: 0');
console.log('Canonical source: PETATOE_LOCALIZATION_CENTER_STORE');
