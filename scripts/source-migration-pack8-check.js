#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const opsPath=path.join(root,'operations/operations-legacy-engine.js');
const dictPath=path.join(root,'i18n/operations-source.js');
const indexPath=path.join(root,'index.html');
const ops=fs.readFileSync(opsPath,'utf8');
const dictSource=fs.readFileSync(dictPath,'utf8');
const index=fs.readFileSync(indexPath,'utf8');
const sandbox={window:{},document:{documentElement:{lang:'en'}}};
vm.createContext(sandbox);
vm.runInContext(dictSource,sandbox,{filename:'operations-source.js'});
const api=sandbox.window.PETATOE_OPERATIONS_I18N;
if(!api||!api.dictionaries)throw new Error('Operations localization runtime is unavailable');
const ar=api.dictionaries.ar||{}, en=api.dictionaries.en||{};
const required=[
'activeAlerts','todayAppointments','tomorrowAppointments','monthAppointments','monthRevenue','monthCollected','monthRemaining','allStatuses','allAnimalTypes','allGroomers','allDrivers','allVehicles','countValue','appointmentDetails','animal','value','customerInformation','phone','sessionInformation','animalType','breed','size','petName','count','service','operations','groomer','driver','vehicle','financials','paymentMethod','total','discount','collected','remaining','notes','appointmentNumber','status','viewAppointmentDetails','details','noAppointmentsForFilters','allAuthorizedVehicles','minutesShort','hoursMinutesShort','noOperationsDataForPeriod','vehicleReportsSourceNote','item','sessions','completed','averageArrival','averageSession','delayed','vehicleOperationsReports','totalOperationsSessions','byPeriodAndVehicle','fullyCollected','collection','uncollected','averageOperations','arrival','delay','paymentMethodsUsed','collectionByPaymentMethod','transactionsCount','percentage','noPaymentData','noDelayedAppointments','delayedAppointments','delayThresholdNote','date','appointmentTime','customer','startDelay','endDelay','sessionsPerVehicle','sessionsPerDriver','sessionsPerGroomer','withoutVehicle','withoutDriver','withoutGroomer','totalVehicles','totalDrivers','totalGroomers','insufficientDataForPeriod','operationsKpiSourceNote','confirmed','incomplete','completionRate','reopened','vehicleOperationsKpis','totalSessions','selectedPeriod','completedClosed','closed','operationsQuality','transactionsValue','todayPeriodSessions','byFilters','ofTotal','needsFollowUp','statusRollbacks','averageSessionDuration','sessionStartToEnd','collectedTransactions','paymentMethodDistribution','qualityIndicators','delayRate','reopenRate','incompleteRate','confirmationRate','vehiclePerformance','driverPerformance','groomerPerformance','statusScheduled','statusOnTheWay','statusArrived','statusStarted','statusCompleted','statusCollected','statusClosed','statusConfirmed','statusIncomplete','statusPostponed','statusCancelled','statusUnknown'
];
const missingAr=required.filter(k=>!Object.prototype.hasOwnProperty.call(ar,k));
const missingEn=required.filter(k=>!Object.prototype.hasOwnProperty.call(en,k));
if(missingAr.length)throw new Error('Missing Arabic keys: '+missingAr.join(', '));
if(missingEn.length)throw new Error('Missing English keys: '+missingEn.join(', '));
const arabic=/[\u0600-\u06FF]/;
const badEnglish=required.filter(k=>arabic.test(String(en[k]||'')));
if(badEnglish.length)throw new Error('Arabic characters in English values: '+badEnglish.join(', '));
const used=[...ops.matchAll(/opT\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
const missingUsed=[...new Set(used)].filter(k=>!Object.prototype.hasOwnProperty.call(ar,k)||!Object.prototype.hasOwnProperty.call(en,k));
if(missingUsed.length)throw new Error('Runtime keys missing from Operations dictionaries: '+missingUsed.join(', '));
const forbidden=[
"['🔔','تنبيهات نشطة'","['📅','مواعيد اليوم'","['💰','إيراد الشهر'","<option value=\"all\">كل الحالات</option>","renderSelectFilter('appointmentAnimalFilter','كل أنواع الحيوانات'","aria-label=\"عرض تفاصيل الموعد كفقاعة\"","<h4>طرق الدفع المستخدمة</h4>","<h4>المواعيد التي بدأت أو انتهت متأخر</h4>","مؤشرات أداء مستقلة من إدارة التشغيل فقط</p>","<h4>💳 توزيع طرق الدفع</h4>","operationKpiTable('أداء السيارات'"
];
const direct=forbidden.filter(v=>ops.includes(v));
if(direct.length)throw new Error('Direct Arabic UI literals remain in migrated scope: '+direct.join(' | '));
if(!index.includes('i18n/operations-source.js?v=9.2.9-source-migration-pack8'))throw new Error('Operations dictionary cache token is not v9.2.9 Pack 8');
if(!index.includes('operations/operations-legacy-engine.js?v=9.2.9-source-migration-pack8'))throw new Error('Operations engine cache token is not v9.2.9 Pack 8');
if(index.indexOf('i18n/operations-source.js')>index.indexOf('operations/operations-legacy-engine.js'))throw new Error('Operations dictionary must load before Operations engine');
console.log('Source Migration Pack 8 Check: Passed');
console.log('Operations dashboard/report/KPI keys covered:',required.length);
console.log('Operations runtime keys currently used:',new Set(used).size);
console.log('Arabic characters in English Operations dictionary: 0');
