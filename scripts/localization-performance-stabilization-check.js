#!/usr/bin/env node
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');const failures=[];const pass=(c,m)=>{if(!c)failures.push(m)};
const global=read('i18n/global-screen-translator.js');const core=read('i18n/index.js');const runtime=read('i18n/localization-center/runtime.js');const index=read('index.html');
pass(global.includes('var phraseBuckets=Object.create(null)'), 'Phrase bucket index is missing.');
pass(global.includes('var candidates=[]'), 'Candidate-limited phrase matching is missing.');
pass(!global.includes('function init(){installSourceSetterBridge();'), 'Global DOM property setter bridge is still enabled.');
pass(!global.includes("PETATOE_I18N.apply('en'"), 'Recursive full-language apply remains in hydration.');
pass(!global.includes('patchRuntimeMessageApis();patchRuntimeMessageApis();'), 'Duplicate runtime API patch call remains.');
pass(core.includes('function activeLocalizationRoots()'), 'Active-root localization helper is missing.');
pass(core.includes('applyActiveSubtrees(currentLang())'), 'Tab navigation still triggers full-document localization.');
pass(runtime.includes("VERSION='9.4.5-localization-performance'"), 'Runtime version mismatch.');
pass(index.includes("PETATOE_RELEASE_VERSION='v9.4.5'"), 'Release version mismatch.');
const result={passed:failures.length===0,checks:9,failures};
fs.writeFileSync(path.join(root,'LOCALIZATION_PERFORMANCE_STABILIZATION_RESULTS.json'),JSON.stringify(result,null,2));
console.log('Localization Performance Stabilization:',result.passed?'PASSED':'FAILED');if(failures.length){failures.forEach(x=>console.error('-',x));process.exit(1);}
