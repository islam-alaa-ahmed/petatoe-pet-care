#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let passed=0,failed=0;function check(v,m){if(v){console.log('PASS - '+m);passed++;}else{console.error('FAIL - '+m);failed++;}}
const index=read('index.html'),consolidation=read('i18n/localization-center/consolidation.js'),storeSrc=read('i18n/localization-center/dictionary-store.js'),pack=read('i18n/localization-center/program-wide-residuals-e5-2-25.js');
check(index.includes('i18n/localization-center/program-wide-residuals-e5-2-25.js'),'program-wide residual pack is loaded by production index');
check(index.indexOf('program-wide-residuals-e5-2-25.js')<index.indexOf('i18n/index.js'),'residual pack loads before the sole DOM translator');
check(consolidation.includes('window.PETATOE_LOCALIZATION_RUNTIME')&&consolidation.includes("runtime.translateRuntime(text,'en')"),'compatibility consolidation delegates runtime text to the canonical localization runtime');
check(consolidation.includes("store.translateSourceText(text,'en')")&&consolidation.includes("store.translateCompositeText(text,'en')"),'compatibility fallback consumes canonical source/composite lookup only');
check(!consolidation.includes("store.getPath('en','runtimeSource.'+text)"),'lossy runtimeSource-only compatibility resolver is removed');
check(storeSrc.includes("path.indexOf('.tokens.')!==-1"),'canonical composite index accepts registered program-wide token packs');
check(storeSrc.includes("replace(/[٠-٩]/g")&&storeSrc.includes("replace(/[۰-۹]/g"),'English composite localization normalizes Arabic/Persian digits');
const ctx={window:{dispatchEvent(){},PETATOE_I18N_DICTIONARIES:{}},CustomEvent:function(){}};vm.createContext(ctx);['i18n/localization-center/dictionary-store.js','i18n/localization-center/enterprise-ui-certification.js','i18n/localization-center/program-wide-residuals-e5-2-25.js'].forEach(f=>vm.runInContext(read(f),ctx));
const store=ctx.window.PETATOE_LOCALIZATION_CENTER_STORE;const samples={
  'إجمالي المبيعات / الخدمات':'Total Sales / Services','متوسط نسبة العمولة':'Average Commission Rate','إجمالي العمولة':'Total Commission','الشريحة':'Tier','لا توجد عمليات مطابقة للفلتر الحالية أو المستخدم الحالي':'No operations match the current filters or user','0 سيارات':'0 Vehicles','مكتمل: 0':'Completed: 0','SAR متبقي: 0':'SAR Remaining: 0','📋 جدول اليوم':"📋 Today's Schedule",'🚦 الطلب الحالي':'🚦 Current Request','لا توجد مواعيد تشغيل في تاريخ ٠٨-٠٨-٢٠٢٦':'No vehicle-operation appointments on 08-08-2026'
};
Object.entries(samples).forEach(([src,want])=>check(store.translateCompositeText(src,'en')===want,'canonical translation covers '+src));
check(pack.includes("timeoutTitle:'تنبيه انتهاء الجلسة'")&&pack.includes("unavailableTitle:'غير متاح للصلاحية الحالية'"),'residual pack covers shared session/navigation runtime surfaces');
check(pack.includes("noSalesForMonth:'لا توجد بيانات مبيعات في هذا الشهر")&&pack.includes("salesRepresentative:'مسؤول المبيعات'"),'residual pack covers commission dynamic report surfaces');
console.log(`Phase E5.2.25 program-wide localization closure: ${passed}/${passed+failed} PASSED`);if(failed)process.exit(1);
