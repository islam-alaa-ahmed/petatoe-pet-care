#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'payroll/payroll-core.js'),'utf8');
const ar=fs.readFileSync(path.join(root,'i18n/ar.js'),'utf8'),en=fs.readFileSync(path.join(root,'i18n/en.js'),'utf8');
const failures=[];
['function payrollT(','PETATOE_LOCALIZATION_CENTER','payrollRuntime.','petatoe:language-changed'].forEach(x=>{if(!core.includes(x))failures.push('missing foundation: '+x)});
["var ar=['يناير'","function paymentMethods(){return [['','غير محدد']","pending_board:['بانتظار اعتماد رئيس مجلس الإدارة'"].forEach(x=>{if(core.includes(x))failures.push('legacy source returned: '+x)});
['payments','employeeStatus','status','errors'].forEach(k=>{if(!ar.includes('\"'+k+'\"')||!en.includes('\"'+k+'\"'))failures.push('dictionary group missing: '+k)});
if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log('Payroll localization source check passed.');
