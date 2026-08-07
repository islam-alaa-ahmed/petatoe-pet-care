#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let pass=0,fail=0;
const read=r=>fs.readFileSync(path.join(root,r),'utf8');function check(ok,msg){if(ok){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
const html=read('index.html'),engine=read('i18n/index.js'),dict=read('i18n/localization-center/dictionary-store.js'),loader=read('i18n/localization-center/loader.js'),cons=read('i18n/localization-center/consolidation.js'),global=read('i18n/global-screen-translator.js');
check(!/i18n\/ar\.js\?v=/.test(html)&&!/i18n\/en\.js\?v=/.test(html),'legacy AR/EN dictionaries are not loaded at runtime');
check(/arabic:'canonical-source'/.test(dict)&&/english:'canonical-translation'/.test(dict)&&/reverseTranslation:false/.test(dict),'source ownership policy declares Arabic source and one English translation catalog');
check(/lang==='ar'\?authoredArabicText/.test(engine),'Arabic data-i18n restores authored source snapshots');
check(/function translate\(key,lang\)\{var code=.*canonicalStoreValue/.test(engine),'English key lookup resolves through canonical store');
check(/if\(lang==='ar'\)return text/.test(engine),'runtime Arabic messages remain authored source text');
check(/if\(lang!=='en'\)return interpolate\(text,params\)/.test(cons)&&!/reverseRuntimeIndex/.test(cons),'compatibility runtime never reverse-translates English into Arabic');
check(/runtimeMutation:false/.test(loader)&&/auditOnly:true/.test(loader)&&/p_language_codes:\['en'\]/.test(loader),'remote localization is English audit-only');
check(/canonical-adapter-only/.test(global),'global compatibility translator delegates to canonical localization');
check(!/MutationObserver/.test(global),'global compatibility translator owns no DOM observer');
check((engine.match(/new MutationObserver/g)||[]).length===1,'canonical DOM engine owns exactly one mutation observer');
check(/sourceLanguage:'ar'/.test(engine)&&/translationTarget:'en'/.test(engine),'global i18n facade exposes Arabic source and English target');
console.log(`Phase E5.2.19.4 Arabic source / single English catalog: ${pass}/${pass+fail} PASSED`);if(fail)process.exit(1);
