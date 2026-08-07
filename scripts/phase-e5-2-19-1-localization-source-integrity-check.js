#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
function read(p){return fs.readFileSync(p,'utf8')}
function check(name,ok){console.log(`${ok?'PASS':'FAIL'} - ${name}`);return ok?1:0;}
const manifest=JSON.parse(read('config/petatoe-version.json'));
const ops=read('operations/operations-legacy-engine.js');
const loader=read('i18n/localization-center/loader.js');
const consolidation=read('i18n/localization-center/consolidation.js');
const adapters=[read('i18n/operations-source.js'),read('i18n/warehouse-source.js'),read('i18n/maintenance-source.js')];
const sw=read('service-worker.js');
const index=read('index.html');
const sandbox={window:{PETATOE_I18N_DICTIONARIES:{}},CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;},console};
sandbox.window.window=sandbox.window;
sandbox.window.dispatchEvent=function(){};
vm.createContext(sandbox);
vm.runInContext(read('i18n/localization-center/dictionary-store.js'),sandbox,{filename:'dictionary-store.js'});
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
const visibleKeys=['monthRemaining','monthCollected','monthRevenue','monthAppointments','tomorrowAppointments','todayAppointments','activeAlerts','selectService','allAnimals','selectVehicle','selectGroomerOption','selectDriverOption','allAuthorizedVehicles','totalSessions','collection'];
const arRe=/[\u0600-\u06FF]/;
let pass=0,total=0;
function t(name,ok){total++;pass+=check(name,!!ok);}
t('canonical localization store loads',!!store&&typeof store.getPath==='function');
t('all reported Operations keys exist in both canonical languages',visibleKeys.every(k=>{const a=store.getPath('ar','operationsSource.'+k),e=store.getPath('en','operationsSource.'+k);return typeof a==='string'&&a&&typeof e==='string'&&e;}));
t('reported Operations keys are Arabic in AR and Arabic-free in EN',visibleKeys.every(k=>arRe.test(store.getPath('ar','operationsSource.'+k)||'')&&!arRe.test(store.getPath('en','operationsSource.'+k)||'')));
t('operations canonicalText never blanks the UI and schedules canonical readiness repair',/function canonicalText[\s\S]{0,1800}queueLocalizationRepair\(\);[\s\S]{0,220}return String\(key\|\|''\);/.test(ops));
t('operations repairs exact leaked keys in Arabic and English',/Defensive key-leak recovery/.test(ops)&&/store\.getPath\(lang,'operationsSource\.'\+source\)/.test(ops));
t('lazy operations module attaches an immediate localization whenReady repair',/localizationCenter\.whenReady\(function\(\)\{setTimeout\(refreshOperationsLocalizationRender,0\);\}\)/.test(ops));
t('appointments/customer helpers do not use key names as user-visible fallback',!/return fallback\|\|key/.test(ops)&&!/return key;/.test(ops.slice(0,8000)));
t('operations warehouse and maintenance adapters are canonical-first and never return an empty unresolved label',adapters.every(s=>!/fallback:key/.test(s)&&/return typeof value==='string'&&value\?value:String\(key\|\|''\)/.test(s)));
t('compatibility consolidation does not replace canonical module adapters with a second fallback owner',!/PETATOE_OPERATIONS_I18N\.t=function/.test(consolidation)&&!/PETATOE_WAREHOUSE_I18N\.t=function/.test(consolidation));
t('remote localization is English audit-only and cannot mutate canonical runtime values',/runtimeMutation:false/.test(loader)&&/auditOnly:true/.test(loader)&&/p_language_codes:\['en'\]/.test(loader));
t('runtime owns no reverse translation index',!/reverseRuntimeIndex/.test(consolidation)&&!/buildReverseRuntimeIndex/.test(consolidation));
t('all localization javascript runtime assets are network-first in the service worker',sw.includes('\\/i18n\\/[^/]+\\.js')&&sw.includes('\\/i18n\\/localization-center\\/[^/]+\\.js'));
const refs=[...index.matchAll(/(?:src|href)="(i18n\/[^"?]+\.js)\?v=([^"&]+)"/g)].map(m=>({asset:m[1],v:m[2]}));
t('all indexed i18n javascript assets use the current canonical cache token',refs.length>=15&&refs.every(x=>x.v===manifest.cacheVersion));
t('smart-report dotted Arabic labels are actually patched in the canonical flat map',arRe.test(store.getPath('ar','smartReportsSource.customerCompare.executiveInsights')||'')&&arRe.test(store.getPath('ar','smartReportsSource.contracts.averageScore')||''));
t('English counterparts of patched smart-report labels remain Arabic-free',!arRe.test(store.getPath('en','smartReportsSource.customerCompare.executiveInsights')||'')&&!arRe.test(store.getPath('en','smartReportsSource.contracts.averageScore')||''));
t('new localization source-integrity contract is registered',manifest.runtimeContracts.localizationSourceIntegrity==='10.0.25-phase-e5-2-19-1-localization-readiness-source-integrity-contract-1');
console.log(`Phase E5.2.19.1 localization source integrity: ${pass}/${total} PASSED`);
if(pass!==total)process.exit(1);
