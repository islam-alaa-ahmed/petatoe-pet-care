#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const dict=read('i18n/localization-center/dictionary-store.js');
const consolidation=read('i18n/localization-center/consolidation.js');
const ops=read('operations/operations-legacy-engine.js');
const opAdapter=read('i18n/operations-source.js');
const whAdapter=read('i18n/warehouse-source.js');
const maintenance=read('i18n/maintenance-source.js');
const sw=read('service-worker.js');
const checks=[
 ['canonical store is merged into legacy i18n dictionaries',/mergeCanonicalIntoLegacy/.test(dict)&&/PETATOE_I18N_DICTIONARIES\.ar=mergeCanonicalIntoLegacy/.test(dict)&&/PETATOE_I18N_DICTIONARIES\.en=mergeCanonicalIntoLegacy/.test(dict)],
 ['canonical store owns migrated legacy runtime phrase',/runtimePhrases\.h266b27de/.test(dict)],
 ['Arabic canonical UI labels no longer keep known English-only report labels',/title:'لوحة التحكم'/.test(dict)&&/title:'تحليل المبيعات'/.test(dict)&&/title:'أداء السيارات'/.test(dict)&&/title:'تحليل الخدمات'/.test(dict)],
 ['runtime translation resolves auto phrases and runtime phrases',/autoPhrases\.'\+hash/.test(consolidation)&&/runtimePhrases\.'\+hash/.test(consolidation)],
 ['runtime translation has a bidirectional reverse canonical index',/buildReverseRuntimeIndex/.test(consolidation)&&/reverseRuntimeIndex\[lang\]/.test(consolidation)],
 ['operations source resolves canonical store before exposing a fallback key',/function canonicalText/.test(ops)&&/allowKeyFallback:false/.test(ops)],
 ['operations rerenders on localization readiness and language changes',/refreshOperationsLocalizationRender/.test(ops)&&/localizationCenter\.whenReady/.test(ops)&&/language-changed',refreshOperationsLocalizationRender/.test(ops)],
 ['compatibility adapters do not request raw-key fallback',![opAdapter,whAdapter,maintenance].some(s=>/fallback:key/.test(s))],
 ['localization runtime assets are network-first critical assets',sw.includes('\\/i18n\\/[^/]+\\.js')&&sw.includes('\\/i18n\\/localization-center\\/[^/]+\\.js')],
 ['phase contract is registered',read('config/petatoe-version.json').includes('phase-e5-2-19-bidirectional-localization-runtime-contract-1')]
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} - ${name}`);if(ok)pass++;}
console.log(`Phase E5.2.19 localization single-source runtime: ${pass}/${checks.length} PASSED`);if(pass!==checks.length)process.exit(1);
