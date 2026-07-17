'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'payroll/payroll-core.js'),'utf8');
const ar=fs.readFileSync(path.join(root,'i18n/ar.js'),'utf8');
const en=fs.readFileSync(path.join(root,'i18n/en.js'),'utf8');
const forbidden=[
  '<h3>⚙️ تهيئة الرواتب</h3>',
  '<h3>💼 تهيئة الوظائف</h3>',
  '<h3>📊 تقرير الرواتب الشهرية</h3>',
  '<h3>📚 سجل الرواتب</h3>',
  '>✅ موافق على كشف الراتب</button>',
  'placeholder="سبب الاعتراض"',
  'toastMsg(\'تم حفظ تهيئة أكواد الموظفين\')',
  'toastMsg(\'اكتب اسم الوظيفة\')'
];
const bad=forbidden.filter(x=>core.includes(x));
if(bad.length){console.error('Pack 8 regression: direct Arabic UI strings returned:',bad);process.exit(1)}
const keys=['config.employee.title','config.jobs.title','archive.title','report.title','self.title','self.objectionsLog','actions.cancelApproval','workflow.cancelledOneStep'];
for(const key of keys){
  const leaf=key.split('.').pop();
  if(!ar.includes('"'+leaf+'"')||!en.includes('"'+leaf+'"')){console.error('Missing bilingual Pack 8 key:',key);process.exit(1)}
}
if(!core.includes("payrollT('self.salarySlipFor'")){console.error('Localized self-service salary-slip title missing');process.exit(1)}
console.log('Payroll UI Localization Pack 8 check passed.');
