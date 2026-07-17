#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'payroll/payroll-core.js'),'utf8');
const ar=fs.readFileSync(path.join(root,'i18n/ar.js'),'utf8');
const en=fs.readFileSync(path.join(root,'i18n/en.js'),'utf8');
const required=[
  'tabs.employees','tabs.monthly','tabs.board','tabs.accounts','tabs.archive','tabs.monthlyReport','tabs.config',
  'actions.addItem','actions.delete','actions.edit','actions.openCreateSlip',
  'ui.unlinked','ui.notLinked','ui.selectJob','ui.noCommissionLink','ui.itemName','ui.value','ui.month','ui.employee','ui.selectEmployee','ui.employeeList','ui.code','ui.job','ui.linkedUser','ui.commissionLink','ui.baseSalary','ui.housing','ui.transport','ui.paymentMethod','ui.status','ui.actions',
  'empty.noEmployees','messages.noSlipToPrint','messages.printPopupBlocked','messages.selectEmployeeFirst','messages.selectEmployeeBeforeSave','messages.selectPeriodBeforeSave','messages.duplicateSlip','messages.slipNotFound','messages.enterEmployeeName','messages.employeeCodeUsed','messages.employeeSaved','confirm.deleteEmployee','confirm.deleteJob'
];
const errors=[];
for(const key of required){
  if(!core.includes(`payrollT('${key}'`)) errors.push(`Core does not use ${key}`);
  const leaf=key.split('.').pop();
  if(!ar.includes(`"${leaf}":`)) errors.push(`Arabic dictionary missing ${key}`);
  if(!en.includes(`"${leaf}":`)) errors.push(`English dictionary missing ${key}`);
}
const forbidden=[
  '>فتح / إنشاء الكشف</button>',
  '<option value="">اختر موظف</option>',
  '<th>الكود</th><th>الموظف</th>',
  "toastMsg('لا يوجد كشف راتب للطباعة')",
  "toastMsg('اختر الموظف أولاً')",
  "confirm('حذف الموظف من قسم الرواتب؟')"
];
for(const text of forbidden){if(core.includes(text))errors.push(`Direct UI source returned: ${text}`)}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Payroll UI localization source check passed (${required.length} keys).`);
