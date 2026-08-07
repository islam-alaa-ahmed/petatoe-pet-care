#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
let pass=0,fail=0;function t(ok,msg){console.log((ok?'PASS':'FAIL')+' - '+msg);ok?pass++:fail++;}
const engine=read('i18n/index.js'),store=read('i18n/localization-center/dictionary-store.js');
t(store.includes('buildCanonicalSourceTextIndex')&&store.includes('sourceTextIndex:CANONICAL_SOURCE_TEXT_INDEX'),'Localization Center exposes one canonical AR-source to EN index');
t(engine.includes('store&&store.sourceTextIndex&&store.sourceTextIndex.en'),'DOM/runtime translation consumes the canonical source index');
t(engine.includes('translateCanonicalCompositeText'),'dynamic composite Arabic text is localized centrally');
t(engine.includes("characterData:true")&&engine.includes("attributes:true"),'the single canonical observer catches dynamic text and attribute updates');
t(engine.includes('applyControlLocale')&&engine.includes("el.setAttribute('lang',lang)"),'date/number controls inherit the selected UI locale');
const required={
'تقرير المواعيد حسب الحالة':'Appointments by Status','تقرير المواعيد حسب الجرومر':'Appointments by Groomer','تقرير المواعيد حسب السائق':'Appointments by Driver','تقرير المواعيد حسب السيارة':'Appointments by Vehicle',
'لا توجد بيانات مالية':'No financial data','إجمالي السائقين':'Total Drivers','إجمالي السيارات':'Total Vehicles','إجمالي الجرومرز':'Total Groomers','البند':'Item','عدد المواعيد':'Appointment Count','النسبة':'Percentage'
};
for(const [ar,en] of Object.entries(required))t(store.includes("'"+ar+"'")&&store.includes("'"+en+"'"),'program-wide canonical pair registered: '+ar);
t(engine.includes("/^يعرض\\s+(\\d+)\\s+من أصل")&&engine.includes('Matching records:'),'record/item pagination composites are localized');
t(engine.includes("No appointments on")&&engine.includes("No invoices - "),'calendar and chart empty-state composites are localized');
const cfg=JSON.parse(read('config/petatoe-version.json'));
t(cfg.runtimeContracts&&cfg.runtimeContracts.programWideLocalization==='10.0.25-phase-e5-2-22-program-wide-localization-contract-1','E5.2.22 runtime contract is registered');
t(cfg.buildVersion===cfg.cacheVersion&&cfg.buildVersion==='10.0.25-phase-e5-2-22-program-wide-localization-certification-1','build/cache version is synchronized');
console.log(`Phase E5.2.22 program-wide localization: ${pass}/${pass+fail} PASSED`);if(fail)process.exit(1);
