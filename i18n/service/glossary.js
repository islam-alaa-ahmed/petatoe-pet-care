/* PETATOE Enterprise Translation Glossary.
   Approved domain terms always win over remote machine translation. */
(function(){
  'use strict';
  var arToEn = Object.freeze({
    'الرئيسية':'Home',
    'لوحة المعلومات':'Dashboard',
    'التقارير الذكية':'Smart Reports',
    'إدارة المواعيد':'Appointments Management',
    'البيانات المرجعية':'Reference Data',
    'إدارة التشغيل':'Operations Management',
    'تشغيل السيارات':'Vehicle Operations',
    'تقارير تشغيل السيارات':'Vehicle Operations Reports',
    'مؤشرات الأداء التشغيلية':'Operational Performance Indicators',
    'إدارة الرواتب':'Payroll Management',
    'كشف الراتب':'Payroll Statement',
    'كشف الرواتب':'Payroll Statement',
    'نظام العمولات':'Commissions System',
    'كشف العمولة':'Commission Statement',
    'الخزينة':'Treasury',
    'المخازن':'Warehouses',
    'المبيعات قبل الضريبة':'Sales Before VAT',
    'الضريبة':'VAT',
    'إجمالي المبيعات':'Total Sales',
    'المستخدمون والصلاحيات':'Users & Permissions',
    'الأجهزة الموثوقة':'Trusted Devices',
    'الجلسات النشطة':'Active Sessions',
    'سجل الأمان':'Security Log',
    'المصادقة متعددة العوامل':'Multi-Factor Authentication',
    'إعدادات النظام':'System Settings',
    'إدارة السيارات':'Fleet Management',
    'إدخال البيانات':'Data Entry',
    'رفع Excel':'Excel Upload',
    'السجلات':'Records',
    'سجل الحركات':'Audit Log',
    'العملاء':'Customers',
    'الخدمات':'Services',
    'السيارات':'Vehicles',
    'الفاتورة':'Invoice',
    'الفواتير':'Invoices',
    'ريال سعودي':'Saudi Riyal',
    'شامل الضريبة':'Including VAT',
    'قبل الضريبة':'Before VAT',
    'الشاملة':'Comprehensive','السعيدة':'Happy','الأساسية':'Basic','الاساسية':'Basic',
    'قص الشعر':'Haircut','كلب':'Dog','قط':'Cat','كبير':'Large','متوسط':'Medium','وسط':'Medium','صغير':'Small'
  });
  var enToAr = {};
  Object.keys(arToEn).forEach(function(key){ enToAr[arToEn[key]] = key; });
  function normalize(value){ return String(value == null ? '' : value).replace(/\s+/g,' ').trim(); }
  function lookup(text,source,target){
    var value=normalize(text);
    if(!value) return null;
    if(source==='ar'&&target==='en') return arToEn[value]||null;
    if(source==='en'&&target==='ar') return enToAr[value]||null;
    return null;
  }
  window.PETATOE_TRANSLATION_GLOSSARY=Object.freeze({
    version:'1.0.0',
    arToEn:arToEn,
    enToAr:Object.freeze(enToAr),
    lookup:lookup,
    normalize:normalize
  });
})();
