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
 '<span>المعادلة تستخدم نفس القيم الظاهرة في الجدول بدون تعديل أي رقم أو إجمالي.</span>'
];
const hits=forbidden.filter(x=>core.includes(x));
if(hits.length){console.error('Smart Reports localization source regression detected:');hits.forEach(x=>console.error(' - '+x));process.exit(1);}
const source=fs.readFileSync(path.join(root,'i18n/smart-reports-source.js'),'utf8');
const required=['classification.reasonTitle','classification.reason.vipVisits','classification.reason.riskFollowup','classification.reason.activeVisitsSpend'];
const missing=required.filter(k=>!source.includes(`'${k}'`));
if(missing.length){console.error('Missing unified localization keys:',missing.join(', '));process.exit(1);}
console.log('Smart Reports source localization check passed.');
