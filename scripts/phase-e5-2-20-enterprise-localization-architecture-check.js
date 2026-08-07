#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let pass=0,fail=0;
const read=r=>fs.readFileSync(path.join(root,r),'utf8');function check(ok,msg){if(ok){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
const html=read('index.html'),engine=read('i18n/index.js'),dict=read('i18n/localization-center/dictionary-store.js'),loader=read('i18n/localization-center/loader.js'),cons=read('i18n/localization-center/consolidation.js'),global=read('i18n/global-screen-translator.js'),smart=read('smart/smart-language-runtime.js'),config=JSON.parse(read('config/petatoe-version.json'));
check(!/i18n\/ar\.js\?v=/.test(html)&&!/i18n\/en\.js\?v=/.test(html),'legacy AR/EN dictionary files are not runtime sources');
check(html.indexOf('dictionary-store.js')<html.indexOf('i18n/index.js'),'canonical store loads before the sole DOM translator');
check(/arabic:'canonical-source'/.test(dict)&&/english:'canonical-translation'/.test(dict)&&/reverseTranslation:false/.test(dict),'Arabic/English source ownership policy is explicit');
check(/authoredArabicText\(el,key\)/.test(engine)&&/lang==='ar'\?authoredArabicText/.test(engine),'data-i18n Arabic rendering restores authored source snapshots first');
check(/setElementText/.test(engine)&&/lang==='ar'\?authoredArabicText/.test(engine),'known static Arabic UI also restores authored source snapshots');
check(/if\(lang==='ar'\)return text/.test(engine)&&/if\(lang!=='en'\)return interpolate\(text,params\)/.test(cons),'runtime messages never reverse-translate English into Arabic');
check(/runtimeMutation:false/.test(loader)&&/p_language_codes:\['en'\]/.test(loader),'remote localization is English audit-only and cannot mutate runtime');
check(/canonical-adapter-only/.test(global)&&!/MutationObserver/.test(global),'global screen translator is passive compatibility only');
check(/domOwner:'PETATOE_LOCALIZATION_RUNTIME'/.test(smart)&&/PETATOE_LOCALIZATION_RUNTIME\.applySubtree/.test(smart)&&!/MutationObserver/.test(smart),'Smart Reports delegates DOM translation to the canonical localization facade');
check(!/FRAGMENTS_EN/.test(smart),'Smart Reports owns no competing English phrase catalog');
const observerOwners=[engine,global,smart].reduce((n,s)=>n+(s.match(/new MutationObserver/g)||[]).length,0);check(observerOwners===1,'exactly one localization DOM MutationObserver exists');
check(/closest\('#smartReportsArea'\)/.test(engine)&&/PETATOE_LOCALIZATION_RUNTIME/.test(engine),'Smart Reports keeps its fast observer exclusion but delegates through the canonical translator');
check(config.runtimeContracts.localizationEnterpriseArchitecture==='10.0.25-phase-e5-2-20-arabic-source-english-canonical-dom-owner-contract-1','E5.2.20 enterprise localization architecture contract is registered');
console.log(`Phase E5.2.20 enterprise localization architecture: ${pass}/${pass+fail} PASSED`);if(fail)process.exit(1);
