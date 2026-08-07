#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
let pass=0,fail=0;
function t(ok,msg){console.log((ok?'PASS':'FAIL')+' - '+msg);ok?pass++:fail++;}
const index=read('i18n/index.js');
const storeSource=read('i18n/localization-center/dictionary-store.js');
t(index.includes("dict&&dict.globalUiSource&&dict.globalUiSource[text]")&&index.includes("dict&&dict.runtimeSource&&dict.runtimeSource[text]"),'auto DOM localization falls back to the canonical English source catalogs');
t(index.includes("translatePhraseByKey(key,'en')||translateCanonicalSourceText(source,'en')"),'text nodes and attributes use canonical residual fallback');
t(index.includes("out.replace(/[٠-٩]/g"),'English residual localization normalizes Arabic-Indic digits');
t(index.includes("var tokenized=translateCanonicalSourceText(text,'en')"),'runtime and chart phrases use canonical token fallback');
const required={
'إدارة الرواتب':'Payroll Management','عنوان العميل أو الموقع':'Customer address or location','أي تفاصيل إضافية عن الجلسة':'Any additional session details',
'كشف التشغيل اليومي':'Daily Operations Statement','Timeline مواعيد اليوم':'Today’s Appointment Timeline','تنبيهات المواعيد':'Appointment Alerts',
'التقويم التشغيلي':'Operations Calendar','التقويم الشهري':'Monthly Calendar','تخطيط المسارات والتوزيع التشغيلي':'Route Planning & Operational Distribution',
'سجل المواعيد':'Appointment Log','تقرير قاعدة بيانات العملاء':'Customer Database Report','قائمة العملاء':'Customer List',
'الحيوانات الخاصة بالعميل':'Customer Pets','تقارير المواعيد':'Appointment Reports','تحليل الاتجاه خلال الشهور (القيمة بالريال السعودي)':'Monthly Trend Analysis (Value in SAR)',
'تحرير التقرير':'Edit Report','إجمالي المبيعات':'Total Sales','عدد العمليات':'Transactions','متوسط قيمة الفاتورة':'Average Invoice Value','التوقعات وذكاء الأعمال':'Forecasting & Business Intelligence'
};
for(const [ar,en] of Object.entries(required))t(storeSource.includes(JSON.stringify(ar).slice(1,-1))&&storeSource.includes(JSON.stringify(en).slice(1,-1)),`canonical residual mapping registered: ${ar}`);
const forbidden=/PETATOE_I18N_DICTIONARIES\.en\s*=\s*\{|<script[^>]+i18n\/en\.js/i;
t(!forbidden.test(read('index.html')),'legacy English dictionary is not a runtime source');
const cfg=JSON.parse(read('config/petatoe-version.json'));
t(cfg.runtimeContracts&&cfg.runtimeContracts.englishResidualLocalization==='10.0.25-phase-e5-2-21-english-residual-localization-contract-1','E5.2.21 runtime contract is registered');
console.log(`Phase E5.2.21 English residual localization: ${pass}/${pass+fail} PASSED`);
if(fail)process.exit(1);
