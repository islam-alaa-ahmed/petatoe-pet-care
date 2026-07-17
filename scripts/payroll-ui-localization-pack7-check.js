#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'payroll/payroll-core.js'), 'utf8');
const ar = fs.readFileSync(path.join(root, 'i18n/ar.js'), 'utf8');
const en = fs.readFileSync(path.join(root, 'i18n/en.js'), 'utf8');
const forbidden = [
  '<h3>👥 إضافة / تعديل موظف</h3>',
  '<label>كود الموظف</label>',
  '<label>اسم الموظف</label>',
  '<h3>💰 إنشاء / تعديل كشف راتب شهري</h3>',
  '<label>الراتب الأساسي</label>',
  '<h4>➕ إضافات أخرى</h4>',
  '<h4>➖ خصومات أخرى</h4>',
  '>💾 حفظ كمسودة</button>',
  '>📤 إرسال لاعتماد رئيس مجلس الإدارة</button>',
  "toastMsg('لا يمكن إدخال قيم سالبة في:",
  "toastMsg('هذه الصلاحية لرئيس مجلس الإدارة أو الإدارة العليا')",
  "toastMsg('هذه الصلاحية للحسابات')"
];
const missingForbidden = forbidden.filter(x => core.includes(x));
const keys = [
  'employeeForm.title','employeeForm.code','employeeForm.name','employeeForm.linkUser',
  'employeeForm.commissionEmployee','employeeForm.baseSalary','employeeForm.housingAllowance',
  'employeeForm.transportAllowance','employeeForm.defaultPaymentMethod','slipForm.monthlyTitle',
  'slipForm.slipFor','slipForm.otherAdditions','slipForm.otherDeductions','actions.saveDraft',
  'actions.sendToBoard','validation.noNegativeValues','confirm.negativeNet',
  'workflow.boardPermissionRequired','workflow.accountsPermissionRequired'
];
const missingCore = keys.filter(k => !core.includes("payrollT('" + k + "'"));
const dictTokens = ['employeeForm','slipForm','validation','workflow','saveDraft','sendToBoard','negativeNet'];
const missingAr = dictTokens.filter(k => !ar.includes('"'+k+'"'));
const missingEn = dictTokens.filter(k => !en.includes('"'+k+'"'));
if (missingForbidden.length || missingCore.length || missingAr.length || missingEn.length) {
  console.error(JSON.stringify({missingForbidden, missingCore, missingAr, missingEn}, null, 2));
  process.exit(1);
}
console.log('Payroll UI Localization Pack 7 check passed.');
