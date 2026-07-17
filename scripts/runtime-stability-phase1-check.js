#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
const loader=read('i18n/localization-center/loader.js');
const index=read('i18n/index.js');
const globalTranslator=read('i18n/global-screen-translator.js');
const business=read('i18n/business-data-localization.js');
const runtime=read('i18n/localization-center/runtime.js');
const html=read('index.html');
assert(loader.includes("code==='en'&&!safeEnglishValue(value)"),'English runtime dictionary rejects Arabic, mixed, and empty values');
assert(loader.includes("source!=='local-file'&&!isEmptyValue(existing)&&safeEnglishValue(existing)"),'Local English dictionary values are protected from runtime overwrite');
assert(loader.includes("petatoe:localization-loading"),'Loader exposes the runtime loading lock');
assert(index.includes('function localizationLoading()'),'Primary engine respects the loading lock');
assert(index.includes("petatoe:localization-loading"),'Primary engine resumes after loading finishes');
assert(globalTranslator.includes("if(hasArabic(value))return false"),'Mixed translator refuses to cache partial Arabic output');
assert(globalTranslator.includes("function init(){patchCanvas();if(runtimeEnabled())buildIndex();}"),'Secondary DOM observer is disabled');
assert(globalTranslator.includes("mode:'manual-fallback-only',observerActive:false"),'Secondary translator reports manual fallback mode');
assert(business.includes('safeEnglishFallback(type,original)'),'English business values use a safe non-Arabic fallback');
assert(business.includes('PETATOE_BUSINESS_I18N_MISSING'),'Missing business translations are discoverable');
assert(runtime.includes("9.2.1-runtime-stability-phase1"),'Localization center runtime version is synchronized');
['i18n/index.js','i18n/localization-center/loader.js','i18n/localization-center/runtime.js','i18n/global-screen-translator.js','i18n/business-data-localization.js'].forEach(file=>assert(html.includes(file+'?v=9.2.1-runtime-stability-phase1'),file+' cache token synchronized'));
if(process.exitCode)process.exit(process.exitCode);
console.log('Runtime Stability Phase 1 check passed.');
