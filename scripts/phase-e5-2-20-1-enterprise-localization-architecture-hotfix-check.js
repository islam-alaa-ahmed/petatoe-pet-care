#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let pass=0,fail=0;
const read=r=>fs.readFileSync(path.join(root,r),'utf8');function check(ok,msg){if(ok){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
const cfg=JSON.parse(read('config/petatoe-version.json')),html=read('index.html'),engine=read('i18n/index.js'),dict=read('i18n/localization-center/dictionary-store.js'),loader=read('i18n/localization-center/loader.js'),cons=read('i18n/localization-center/consolidation.js'),global=read('i18n/global-screen-translator.js');
check(!/i18n\/ar\.js\?v=/.test(html)&&!/i18n\/en\.js\?v=/.test(html),'legacy language packs stay out of runtime HTML');
check(/arabic:'canonical-source'/.test(dict)&&/english:'canonical-translation'/.test(dict)&&/reverseTranslation:false/.test(dict),'Arabic authored source and English canonical ownership are explicit');
check(/function translate\(key,lang\)\{var code=.*canonicalStoreValue/.test(engine),'data-i18n key lookup is canonical-store only');
check(/lang==='ar'\?authoredArabicText/.test(engine)&&/lang==='ar'\?authoredArabicAttr/.test(engine),'Arabic rendering restores authored DOM snapshots');
check(/if\(lang==='ar'\)return text/.test(engine)&&/if\(lang!=='en'\)return interpolate\(text,params\)/.test(cons),'runtime messages never reverse translate into Arabic');
check(/runtimeMutation:false/.test(loader)&&/auditOnly:true/.test(loader)&&/p_language_codes:\['en'\]/.test(loader),'remote loader is English audit-only');
check(!/setPath\(canonical\.dictionaries/.test(loader),'remote loader cannot mutate canonical runtime dictionaries');
check(/source:'canonical-adapter-only'/.test(global)&&!/MutationObserver/.test(global),'global translator is a passive compatibility adapter');
check((engine.match(/new MutationObserver/g)||[]).length===1,'canonical DOM engine owns the sole localization observer');
check(cfg.runtimeContracts.localizationEnterpriseArchitectureHotfix==='10.0.25-phase-e5-2-20-1-arabic-authored-english-single-catalog-contract-1','E5.2.20.1 architecture hotfix contract is registered');
console.log(`Phase E5.2.20.1 localization architecture hotfix: ${pass}/${pass+fail} PASSED`);if(fail)process.exit(1);
