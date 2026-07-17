#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
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
const source=fs.readFileSync(path.join(root,'i18n/smart-reports-source.js'),'utf8');
const required=[
 'classification.reasonTitle','classification.reason.vipVisits','classification.reason.riskFollowup','classification.reason.activeVisitsSpend',
 'status.stable','status.lost','status.newCustomer','status.growth','status.decline',
 'customerCompare.invoicesForYear','customerCompare.rankChange','table.lastInteraction','table.status',
 'contracts.candidatesDescription','contracts.businessAiNarrative','contracts.candidateSummary',
 'customers.inactiveSortDescription','customers.recoveryOpportunitiesDescription','customers.absenceDistributionDescription',
 'services.lazyDescription','services.readyForFastLoad'
];
const missing=required.filter(k=>!source.includes(`'${k}'`));
if(missing.length){console.error('Missing unified localization keys:',missing.join(', '));process.exit(1);}
for(const key of required){
  const count=(source.match(new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`,'g'))||[]).length;
  if(count<2){console.error(`Localization key is not present in both AR and EN dictionaries: ${key}`);process.exit(1);}
}
console.log('Smart Reports source localization check passed.');
