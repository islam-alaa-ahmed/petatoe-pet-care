#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
let passCount=0,failCount=0;function check(ok,label){console.log((ok?'PASS':'FAIL')+' - '+label);ok?passCount++:failCount++;}
const storeCode=read('i18n/localization-center/dictionary-store.js');
const packCode=read('i18n/localization-center/enterprise-ui-certification.js');
const index=read('i18n/index.js'),runtime=read('i18n/localization-center/runtime.js'),ops=read('operations/operations-legacy-engine.js'),legacy=read('inline-extracted/legacy-application-core.js'),html=read('index.html');
const sandbox={window:{dispatchEvent(){},PETATOE_I18N_DICTIONARIES:{}},CustomEvent:function(){}};vm.createContext(sandbox);vm.runInContext(storeCode,sandbox);vm.runInContext(packCode,sandbox);
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
check(!!store&&typeof store.translateSourceText==='function','canonical store exposes aligned source-text lookup');
check(typeof store.translateCompositeText==='function','canonical store exposes center-owned composite translation');
check(store.translateSourceText('تقرير المواعيد حسب السائق','en')==='Appointments by Driver','operations report title resolves from Localization Center');
check(store.translateCompositeText('Q1 (يناير - مارس)','en')==='Q1 (January - March)','dynamic quarter labels translate through center tokens');
check(store.translateCompositeText('الشاملة - كلب متوسط','en')==='Comprehensive - Medium Dog','composite service labels translate through center tokens');
check(/translateRuntime:translateRuntime/.test(runtime),'Localization Center facade exposes translateRuntime');
check(/translateSourceText\(text,'en'\)/.test(index)&&/translateCompositeText\(text,'en'\)/.test(index),'runtime translation consults the complete canonical center');
check(/characterData:true/.test(index)&&/attributes:true/.test(index),'sole DOM observer covers dynamic text and attributes');
check((index.match(/new MutationObserver/g)||[]).length===1,'localization still owns exactly one MutationObserver');
check(/enterprise-ui-certification\.js\?v=/.test(html),'enterprise certification dictionary pack is loaded from the canonical center');
check(/opReportT\('byStatusTitle'\)/.test(ops)&&!/localReportTable\('by_status','تقرير المواعيد حسب الحالة'/.test(ops),'appointment report titles no longer render from hardcoded Arabic');
check(/opReportT\('showingItems'/.test(ops)&&/opReportT\('noReportData'\)/.test(ops),'appointment report pagination and empty states are canonical-key driven');
check(/petRuntimeText\(MAR\[m\]\|\|m\)/.test(legacy),'dashboard month labels are localized before chart rendering');
check(/svc\.map\(x=>String\(petRuntimeText\(x\[0\]\)\)/.test(legacy),'dashboard service chart labels use canonical runtime translation');
check(/__PETATOE_DASHBOARD_LANGUAGE_RERENDER_BOUND__/.test(legacy),'canvas reports rerender on language changes');
check(read('config/petatoe-version.json').includes('localizationEnterpriseCertification'),'new localization certification contract is registered in version manifest');
console.log(`Phase E5.2.23 enterprise localization certification: ${passCount}/${passCount+failCount} PASSED`);process.exit(failCount?1:0);
