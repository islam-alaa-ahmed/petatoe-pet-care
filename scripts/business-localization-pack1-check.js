'use strict';
const fs=require('fs');
const business=fs.readFileSync('i18n/business-data-localization.js','utf8');
const smart=fs.readFileSync('smart/smart-reports-core.js','utf8');
const required=["payment:Object.freeze", "customerStatus:Object.freeze", "appointmentStatus:Object.freeze", "resolve('payment'", "resolve('customerStatus'"];
const missing=required.filter(x=>!business.includes(x));
const smartRequired=['smartVehicleDisplay','smartCustomerDisplay','smartPaymentDisplay'];
missing.push(...smartRequired.filter(x=>!smart.includes(x)));
if(missing.length){console.error('Business localization Pack 1 check failed:',missing);process.exit(1);}
console.log('Business localization Pack 1 check passed.');
