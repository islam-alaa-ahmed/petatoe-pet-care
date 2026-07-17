#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'payroll/payroll-core.js'),'utf8');
const ar=fs.readFileSync(path.join(root,'i18n/ar.js'),'utf8');
const en=fs.readFileSync(path.join(root,'i18n/en.js'),'utf8');
const forbidden=[
  '<th>إجمالي الموظف</th>',
  '<h3>📋 اعتماد رئيس مجلس الإدارة</h3>',
  '<h3>🏦 شاشة الحسابات</h3>',
  'data-payroll-action="board-approve" data-payroll-id="\'+esc(s.id)+\'">اعتماد مبدئي</button>',
  'data-payroll-action="accounts-approve" data-payroll-id="\'+esc(s.id)+\'">اعتماد للصرف</button>',
  '<title>تقرير الرواتب الشهرية</title>',
  "toLocaleString('ar-SA')",
  "[['الموظف']",
  "state.archiveYear||'كل السنوات'"
];
const failures=forbidden.filter(x=>core.includes(x)).map(x=>'Forbidden direct source text remains: '+x);
const required=[
 'commission.noSnapshot','commission.noManualMatch','commission.noLegacyMatch','commission.manualLinked','commission.legacyLinked','commission.matchedName','commission.matched',
 'board.title','board.description','board.initialApprove','board.reject','board.empty',
 'accounts.title','accounts.approvePayment','accounts.markPaid','accounts.empty',
 'export.exportDate','archive.slipCountValue'
];
for(const key of required){
  const parts=key.split('.'); const leaf='"'+parts[parts.length-1]+'"';
  if(!ar.includes(leaf)) failures.push('Arabic dictionary missing '+key);
  if(!en.includes(leaf)) failures.push('English dictionary missing '+key);
}
['payrollLocale()','payrollDir()','payrollT(\'board.title\'','payrollT(\'accounts.title\'','payrollT(\'export.exportDate\''].forEach(x=>{if(!core.includes(x))failures.push('Core integration missing '+x)});
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Payroll UI Localization Pack 9 Check: Passed');
console.log('Required bilingual keys checked:',required.length);
