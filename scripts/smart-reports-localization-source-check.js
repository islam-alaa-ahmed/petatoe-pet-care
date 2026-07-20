#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const fail=(message)=>{console.error(message);process.exitCode=1;};
const core=fs.readFileSync(path.join(root,'smart/smart-reports-core.js'),'utf8');
const forbidden=[
 'reasons.push(`عدد الزيارات ${fmt0(stats.visits)} زيارة، وهو أكبر من أو يساوي 5 زيارات`)',
 '<b>سبب تصنيف العميل: ${title}</b>',
 '<span>تم تصنيف العميل بناءً على بيانات الفترة المختارة:</span>',
 '<span>المعادلة تستخدم نفس القيم الظاهرة في الجدول بدون تعديل أي رقم أو إجمالي.</span>',
 "let status='ثابت', cls='info'",
 '<span>إجمالي العملاء المرشحين</span>',
 '<span>إجمالي المبيعات المحتملة</span>',
 '<b>🤖 توصية الذكاء التجاري</b>',
 "inactiveActivityPanelHead('📊 توزيع العملاء حسب مدة الغياب'",
 "inactiveActivityPanelHead('📋 جدول العملاء غير النشطين'",
 "inactiveActivityPanelHead('💰 فرص الاسترجاع Recovery Opportunities'",
 '<h3>📦 تحليل الخدمات</h3><p>اضغط على تبويب تحليل الخدمات'
];
const hits=forbidden.filter(x=>core.includes(x));
if(hits.length){console.error('Smart Reports localization source regression detected:');hits.forEach(x=>console.error(' - '+x));process.exit(1);}
const vm=require('vm');
const dictionaryPath=path.join(root,'i18n/localization-center/dictionary-store.js');
const sandbox={window:{dispatchEvent(){}},CustomEvent:function(){},console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dictionaryPath,'utf8'),sandbox,{filename:'dictionary-store.js'});
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
if(!store||!store.dictionaries){console.error('Canonical localization store could not be loaded.');process.exit(1);}
function flatten(obj,prefix='',out={}){for(const [k,v] of Object.entries(obj||{})){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,key,out);else out[key]=String(v??'');}return out;}
const ar=flatten(store.dictionaries.ar||{}),en=flatten(store.dictionaries.en||{});
const smartSource=fs.readFileSync(path.join(root,'i18n/smart-reports-source.js'),'utf8');
if(!smartSource.includes('PETATOE_LOCALIZATION_CENTER_STORE')&&!smartSource.includes('PETATOE_LOCALIZATION_CENTER')){
  console.error('Smart Reports adapter does not delegate to the canonical localization center.');process.exit(1);
}
const required=[
 'classification.reasonTitle','classification.reason.vipVisits','classification.reason.riskFollowup','classification.reason.activeVisitsSpend',
 'status.stable','status.lost','status.newCustomer','status.growth','status.decline',
 'customerCompare.invoicesForYear','customerCompare.rankChange','table.lastInteraction','table.status',
 'contracts.candidatesDescription','contracts.businessAiNarrative','contracts.candidateSummary',
 'customers.inactiveSortDescription','customers.recoveryOpportunitiesDescription','customers.absenceDistributionDescription',
 'services.lazyDescription','services.readyForFastLoad'
];
function resolveSmartKey(key){const candidates=[key,'smartReportsSource.'+key,'smartReports.'+key,'smart.'+key];return candidates.find(candidate=>candidate in ar&&candidate in en);}
const missing=required.filter(key=>!resolveSmartKey(key));
if(missing.length){console.error('Missing canonical Smart Reports localization keys:',missing.join(', '));process.exit(1);}
// PETATOE v9.1.3 - Pack 3 source migration guards.
[
  "{label:'العميل'",
  "{label:'آخر فاتورة'",
  "{label:'رقم آخر فاتورة'",
  "{label:'مبيعات السنة السابقة'",
  "{label:'تصنيف الخطورة'",
  "{label:'عرض التفاصيل'",
  '<h2>📑 مركز التقارير المتقدمة</h2>',
  '<p>مقارنات شاملة وبيانات تفصيلية تدعم قراراتك</p>'
].forEach((legacyLiteral)=>{
  if(core.includes(legacyLiteral)) fail(`Pack 3 legacy literal returned: ${legacyLiteral}`);
});
[
  'customerCompare.valueForYear','customerCompare.noLostCustomersInPeriod','customerCompare.rankForYear',
  'customerCompare.change','customerCompare.salesDifference','customerCompare.noClearRankChange',
  'customerCompare.totalForYear','advanced.centerTitle','advanced.centerDescription'
].forEach((key)=>{
  if(!resolveSmartKey(key)) fail(`Missing Pack 3 key in canonical localization store: ${key}`);
});


// PETATOE v9.1.4 - locale-aware formatting guards.
if((core.match(/fmtDateAr\(/g)||[]).length>1) fail('Direct Arabic date formatting returned outside smartFormatDate compatibility fallback.');
[
  "join('، ')",
  "|| '<tr><td colspan=\"9\">لا توجد فرص استرجاع حسب شرط الغياب الحالي.</td></tr>'",
  "|| '<tr><td colspan=\"9\">لا يوجد عملاء غير نشطين حسب شرط أكثر من 60 يوم بدون زيارة صافية.</td></tr>'",
  "<small>حتى ${customerCompareLatestDate?"
].forEach((legacyLiteral)=>{
  if(core.includes(legacyLiteral)) fail(`Pack 4 locale-formatting literal returned: ${legacyLiteral}`);
});
[
  'format.listSeparator','period.throughDate','period.yearEnd',
  'customers.noRecoveryOpportunities','customers.noInactiveCustomersByRule'
].forEach((key)=>{
  if(!resolveSmartKey(key)) fail(`Pack 4 key is not present in both AR and EN canonical dictionaries: ${key}`);
});

if(process.exitCode) process.exit(process.exitCode);
console.log('Smart Reports source localization check passed.');
