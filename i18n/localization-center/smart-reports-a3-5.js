/* PETATOE v9.4.23 — Phase A3.5 Smart Reports source localization catalog. */
(function(){
  'use strict';
  var ar={smartReportsSource:{a35:{
    common:{unspecified:'غير محدد',noData:'لا توجد بيانات.',allYears:'كل السنوات',sales:'المبيعات',revenue:'الإيراد',operations:'العمليات',service:'الخدمة',averageOperation:'متوسط العملية',showing:'عرض {shown} من {total}'},
    services:{
      analysisTitle:'📦 تحليل الخدمات',analysisDescription:'نصيب كل خدمة من الإيراد، مع تحديد الخدمات الأكثر تأثيرًا.',topTitle:'🧩 أعلى الخدمات',followUpTitle:'📉 خدمات تحتاج متابعة',followUpDescription:'أقل الخدمات من حيث الإيراد لمراجعة التسعير أو العروض.',
      sortValueDesc:'المبيعات الأعلى قيمة',sortValueAsc:'المبيعات الأقل قيمة',sortCountDesc:'الخدمات الأكثر استخدامًا',sortCountAsc:'الخدمات الأقل استخدامًا',
      noMatchingData:'لا توجد بيانات خدمات مطابقة للفترة المختارة.',noPeriodData:'لا توجد بيانات خدمات للفترة المختارة.',serviceNoun:'خدمة',showFirstTen:'عرض أول 10 خدمات',loadMore:'المزيد لعرض باقي الخدمات',revenueSar:'الإيراد (SAR)'
    },
    customers:{
      newCustomers:'العملاء الجدد',newCustomerSales:'مبيعات العملاء الجدد',averageNewCustomer:'متوسط العميل الجديد',conversionRate:'معدل التحويل',topNewCustomer:'أعلى عميل جديد',sameMonth:'من نفس الشهر',totalPerCustomers:'إجمالي / عدد العملاء',returnedOrRepeated:'عادوا أو نفذوا أكثر من عملية',customerCount:'عدد العملاء',becameInactive:'عملاء أصبحوا غير نشطين',
      aging0_30:'0-30 يوم',aging31_60:'31-60 يوم',aging61_90:'61-90 يوم',aging91_180:'91-180 يوم',aging180Plus:'+180 يوم',noNewCustomers:'لا يوجد عملاء جدد في هذا الشهر حسب أول معاملة مسجلة في كل قاعدة البيانات.',noInactiveCustomers:'لا يوجد عملاء غير نشطين ضمن الفترة المختارة.',noAvailableMonths:'لا توجد شهور متاحة',week:'الأسبوع {number}',classificationReason:'سبب التصنيف: {tier}',classificationDescription:'العميل مصنف ضمن شريحة {tier} بناءً على قيمة مشترياته وعدد معاملاته وحداثة آخر تعامل.',classificationBasis:'هذا التصنيف مبني على القواعد التالية:',classificationScope:'يتم حساب التصنيف من بيانات الشهر المختار فقط دون تغيير أي قيم أصلية.',
      spendAtLeast10k:'إجمالي المشتريات لا يقل عن SAR 10,000.00',spendAtLeast5k:'إجمالي المشتريات لا يقل عن SAR 5,000.00',spendAtLeast1k:'إجمالي المشتريات لا يقل عن SAR 1,000.00',spendBelow1k:'إجمالي المشتريات أقل من SAR 1,000.00',transactionCount:'عدد المعاملات: {count}',lastTransactionDays:'آخر معاملة خلال {days} يوم'
    }
  }}};
  var en={smartReportsSource:{a35:{
    common:{unspecified:'Unspecified',noData:'No data available.',allYears:'All Years',sales:'Sales',revenue:'Revenue',operations:'Operations',service:'Service',averageOperation:'Average Transaction',showing:'Showing {shown} of {total}'},
    services:{
      analysisTitle:'📦 Service Analysis',analysisDescription:'Revenue contribution by service, highlighting the services with the greatest impact.',topTitle:'🧩 Top Services',followUpTitle:'📉 Services Requiring Follow-up',followUpDescription:'Lowest-revenue services for pricing or promotion review.',
      sortValueDesc:'Highest Sales Value',sortValueAsc:'Lowest Sales Value',sortCountDesc:'Most Used Services',sortCountAsc:'Least Used Services',
      noMatchingData:'No service data matches the selected period.',noPeriodData:'No service data is available for the selected period.',serviceNoun:'service',showFirstTen:'Show First 10 Services',loadMore:'Load More Services',revenueSar:'Revenue (SAR)'
    },
    customers:{
      newCustomers:'New Customers',newCustomerSales:'New Customer Sales',averageNewCustomer:'Average New Customer',conversionRate:'Conversion Rate',topNewCustomer:'Top New Customer',sameMonth:'From the Same Month',totalPerCustomers:'Total / Customer Count',returnedOrRepeated:'Returned or completed more than one transaction',customerCount:'Customer Count',becameInactive:'Customers Who Became Inactive',
      aging0_30:'0–30 days',aging31_60:'31–60 days',aging61_90:'61–90 days',aging91_180:'91–180 days',aging180Plus:'180+ days',noNewCustomers:'No new customers were found for this month based on the first recorded transaction in the full database.',noInactiveCustomers:'No inactive customers were found for the selected period.',noAvailableMonths:'No months available',week:'Week {number}',classificationReason:'Classification reason: {tier}',classificationDescription:'The customer is classified in the {tier} tier based on purchase value, transaction count, and recency.',classificationBasis:'This classification is based on the following rules:',classificationScope:'The classification is calculated from the selected month only without changing original values.',
      spendAtLeast10k:'Total purchases are at least SAR 10,000.00',spendAtLeast5k:'Total purchases are at least SAR 5,000.00',spendAtLeast1k:'Total purchases are at least SAR 1,000.00',spendBelow1k:'Total purchases are below SAR 1,000.00',transactionCount:'Transactions: {count}',lastTransactionDays:'Last transaction within {days} days'
    }
  }}};
  function merge(target,source){Object.keys(source||{}).forEach(function(k){var v=source[k];if(v&&typeof v==='object'&&!Array.isArray(v)){target[k]=target[k]&&typeof target[k]==='object'?target[k]:{};merge(target[k],v);}else target[k]=v;});return target;}
  function install(){
    var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
    if(store&&store.dictionaries){merge(store.dictionaries.ar||{},ar);merge(store.dictionaries.en||{},en);return true;}
    var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};
    dictionaries.ar=merge(dictionaries.ar||{},ar);dictionaries.en=merge(dictionaries.en||{},en);return false;
  }
  if(!install())window.addEventListener('petatoe:localization-center-store-ready',install,{once:true});
})();
