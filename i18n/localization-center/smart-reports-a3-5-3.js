/* PETATOE v9.4.23 — Phase A3.5.3 Smart Reports interactions/readiness/vehicle-efficiency catalog. */
(function(){
  'use strict';
  var ar={smartReportsSource:{
    readiness:{loading:'جارٍ تحميل بيانات التقارير الذكية…'},
    vehicleEfficiency:{allYears:'كل السنوات',allMonths:'كل الشهور',allVehicles:'كل السيارات',allPayments:'كل طرق الدفع',noData:'لا توجد بيانات مطابقة لفلاتر تحليل كفاءة السيارات.',total:'الإجمالي',reset:'إعادة تعيين',title:'تحليل كفاءة السيارات'},
    interactions:{
      linkedReport:'التقرير المرتبط',pinIcon:'📌',openedFromRecommendations:'تم فتح {report} من شاشة التوصيات.',backIcon:'↩️',backToRecommendations:'رجوع لتقرير التوصيات',backToRecommendationsShort:'رجوع للتوصيات',growthOpportunities:'فرص النمو',highPriority:'أولوية عالية',urgentIntervention:'تدخل عاجل',noItems:'لا توجد عناصر في هذا القسم حاليًا.',details:'تفاصيل',itemCount:'{count} عنصر',searchStart:'ابدأ الكتابة للبحث في العملاء والخدمات والسيارات والفواتير...',customers:'العملاء',services:'الخدمات',vehicles:'السيارات',invoices:'الفواتير',invoiceNumber:'رقم الفاتورة'
    }
  }};
  var en={smartReportsSource:{
    readiness:{loading:'Loading Smart Reports data…'},
    vehicleEfficiency:{allYears:'All Years',allMonths:'All Months',allVehicles:'All Vehicles',allPayments:'All Payment Methods',total:'Total',reset:'Reset',title:'Vehicle Efficiency Analysis'},
    interactions:{
      pinIcon:'📌',backIcon:'↩️',backToRecommendationsShort:'Back to Recommendations',growthOpportunities:'Growth Opportunities',highPriority:'High Priority',urgentIntervention:'Urgent Intervention',noItems:'There are currently no items in this section.',details:'Details',itemCount:'{count} items',searchStart:'Start typing to search customers, services, vehicles, and invoices...',customers:'Customers',services:'Services',vehicles:'Vehicles',invoices:'Invoices',invoiceNumber:'Invoice Number'
    }
  }};
  function merge(target,source){Object.keys(source||{}).forEach(function(k){var v=source[k];if(v&&typeof v==='object'&&!Array.isArray(v)){target[k]=target[k]&&typeof target[k]==='object'?target[k]:{};merge(target[k],v);}else target[k]=v;});return target;}
  function install(){var store=window.PETATOE_LOCALIZATION_CENTER_STORE;if(store&&store.dictionaries){merge(store.dictionaries.ar||{},ar);merge(store.dictionaries.en||{},en);return true;}var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};dictionaries.ar=merge(dictionaries.ar||{},ar);dictionaries.en=merge(dictionaries.en||{},en);return false;}
  if(!install())window.addEventListener('petatoe:localization-center-store-ready',install,{once:true});
})();
