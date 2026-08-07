/* PETATOE v10.0.25 — E5.2.23 Enterprise UI Localization Certification.
 * Canonical residual UI/domain phrases. This module registers only with the
 * Localization Center store; it is not an independent runtime dictionary.
 */
(function(){
  'use strict';
  var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
  if(!store||typeof store.registerModule!=='function')return;
  var ar={
    common:{
      showMore:'عرض المزيد',otherHiddenItems:'بنود أخرى غير معروضة',item:'البند',appointmentCount:'عدد المواعيد',percentage:'النسبة',
      matchingRecords:'إجمالي السجلات المطابقة للفلتر',totalItems:'إجمالي البنود',noReportData:'لا توجد بيانات لهذا التقرير',
      showingItems:'يعرض {shown} من أصل {total} بند',showingRecords:'يعرض {shown} من أصل {total} سجل',restoreDefaults:'استعادة الافتراضيات',
      noFinancialData:'لا توجد بيانات مالية',allYears:'كل السنوات',allMonths:'كل الشهور',customComparison:'مقارنة مخصصة',customComparisonLabel:'مقارنة مخصصة',
      month:'الشهر',quarter:'الربع',difference:'الفرق',growth:'النمو',total:'الإجمالي',allData:'كل البيانات',exportReport:'تصدير التقرير'
    },
    operationsReports:{
      title:'تقارير المواعيد',dailyStatement:'كشف التشغيل اليومي',todayTimeline:'Timeline مواعيد اليوم',alerts:'تنبيهات المواعيد',calendar:'التقويم التشغيلي',dispatch:'تخطيط المسارات والتوزيع التشغيلي',log:'سجل المواعيد',
      byStatusTitle:'تقرير المواعيد حسب الحالة',byGroomerTitle:'تقرير المواعيد حسب الجرومر',byDriverTitle:'تقرير المواعيد حسب السائق',byVehicleTitle:'تقرير المواعيد حسب السيارة',byPaymentTitle:'تقرير المواعيد حسب طريقة الدفع',byCollectionTitle:'تقرير المواعيد حسب حالة التحصيل',repeatCustomersTitle:'العملاء الأكثر تكرارًا',
      totalStatuses:'إجمالي الحالات',totalGroomers:'إجمالي الجرومرز',totalDrivers:'إجمالي السائقين',totalVehicles:'إجمالي السيارات',totalPayments:'إجمالي طرق الدفع',totalCollectionStatuses:'إجمالي حالات التحصيل',totalRepeatAppointments:'إجمالي المواعيد المتكررة',
      noGroomer:'بدون جرومر',noDriver:'بدون سائق',noVehicle:'بدون سيارة',unknownCustomer:'عميل غير محدد',unknown:'غير محدد',scheduled:'مجدول',
      customersPets:'العملاء والحيوانات',customerList:'قائمة العملاء',customerProfile:'ملف العميل',customerPets:'الحيوانات الخاصة بالعميل',servicesVisits:'سجل الخدمات والزيارات',customerDatabaseReport:'تقرير قاعدة بيانات العملاء',
      resources:'الموارد',completed:'المكتمل',totalAppointments:'إجمالي المواعيد',statementDate:'تاريخ الكشف',noAppointmentsOnDate:'لا توجد مواعيد في تاريخ {date}',noAppointmentsToday:'لا توجد مواعيد اليوم'
    },
    smartAnalytics:{
      salesIncludingVat:'المبيعات شاملة الضريبة',salesBeforeVat:'المبيعات قبل الضريبة',vat:'الضريبة',totalSales:'إجمالي المبيعات',transactions:'عدد المعاملات',averageInvoice:'متوسط قيمة الفاتورة',
      monthComparisonDetails:'تفاصيل مقارنة الشهور',periodTotal:'الإجمالي - الفترة',contributionPercent:'نسبة المساهمة من الإجمالي',highestSalesMonth:'أعلى شهر مبيعات',quarterDetails:'تفاصيل الأرباع',
      monthlyTrend:'الاتجاه الشهري',quarterlyComparison:'المقارنة الربعية',quarter:'الربع',growth:'النمو',difference:'الفرق',customComparison:'مقارنة مخصصة',
      service:'الخدمة',revenue:'الإيراد',operations:'العمليات',averageTransaction:'متوسط المعاملة',allYears:'كل السنوات',sales:'المبيعات',topSellingServices:'أعلى الخدمات مبيعاً'
    },
    tokens:{
      january:'يناير',february:'فبراير',march:'مارس',april:'أبريل',may:'مايو',june:'يونيو',july:'يوليو',august:'أغسطس',september:'سبتمبر',october:'أكتوبر',november:'نوفمبر',december:'ديسمبر',
      comprehensive:'الشاملة',happy:'السعيدة',basic:'الأساسية',basicAlt:'الاساسية',haircut:'قص الشعر',dog:'كلب',cat:'قط',bird:'طائر',rabbit:'أرنب',large:'كبير',medium:'متوسط',mediumAlt:'وسط',small:'صغير',cash:'نقدي',cashAlt:'نقد',
      salesIncludingVat:'المبيعات شاملة الضريبة',salesBeforeVat:'المبيعات قبل الضريبة',vat:'الضريبة',allYears:'كل السنوات',customComparison:'مقارنة مخصصة'
    },
    businessAliases:{
      comprehensiveMediumDog:'الشاملة - كلب متوسط',comprehensiveMediumCat:'الشاملة - قط متوسط',comprehensiveLargeDog:'الشاملة - كلب كبير',basicMediumCat:'الاساسية - قط متوسط',basicMediumDog:'الاساسية - كلب متوسط',happyLargeDog:'السعيدة - كلب كبير',haircutMedium:'قص الشعر وسط'
    }
  };
  var en={
    common:{
      showMore:'Show More',otherHiddenItems:'Other hidden items',item:'Item',appointmentCount:'Appointments',percentage:'Percentage',
      matchingRecords:'Matching records',totalItems:'Total items',noReportData:'No data for this report',
      showingItems:'Showing {shown} of {total} items',showingRecords:'Showing {shown} of {total} records',restoreDefaults:'Restore Defaults',
      noFinancialData:'No financial data',allYears:'All Years',allMonths:'All Months',customComparison:'Custom Comparison',customComparisonLabel:'Custom Comparison',
      month:'Month',quarter:'Quarter',difference:'Difference',growth:'Growth',total:'Total',allData:'All Data',exportReport:'Export Report'
    },
    operationsReports:{
      title:'Appointment Reports',dailyStatement:'Daily Operations Statement',todayTimeline:"Today's Appointment Timeline",alerts:'Appointment Alerts',calendar:'Operations Calendar',dispatch:'Route Planning & Operational Dispatch',log:'Appointment Log',
      byStatusTitle:'Appointments by Status',byGroomerTitle:'Appointments by Groomer',byDriverTitle:'Appointments by Driver',byVehicleTitle:'Appointments by Vehicle',byPaymentTitle:'Appointments by Payment Method',byCollectionTitle:'Appointments by Collection Status',repeatCustomersTitle:'Most Frequent Customers',
      totalStatuses:'Total Statuses',totalGroomers:'Total Groomers',totalDrivers:'Total Drivers',totalVehicles:'Total Vehicles',totalPayments:'Total Payment Methods',totalCollectionStatuses:'Total Collection Statuses',totalRepeatAppointments:'Total Repeat Appointments',
      noGroomer:'No Groomer',noDriver:'No Driver',noVehicle:'No Vehicle',unknownCustomer:'Unspecified Customer',unknown:'Unspecified',scheduled:'Scheduled',
      customersPets:'Customers & Pets',customerList:'Customer List',customerProfile:'Customer Profile',customerPets:'Customer Pets',servicesVisits:'Services & Visits History',customerDatabaseReport:'Customer Database Report',
      resources:'Resources',completed:'Completed',totalAppointments:'Total Appointments',statementDate:'Statement Date',noAppointmentsOnDate:'No appointments on {date}',noAppointmentsToday:'No appointments today'
    },
    smartAnalytics:{
      salesIncludingVat:'Sales Including VAT',salesBeforeVat:'Sales Before VAT',vat:'VAT',totalSales:'Total Sales',transactions:'Transactions',averageInvoice:'Average Invoice Value',
      monthComparisonDetails:'Month Comparison Details',periodTotal:'Period Total',contributionPercent:'Share of Total',highestSalesMonth:'Highest Sales Month',quarterDetails:'Quarter Details',
      monthlyTrend:'Monthly Trend',quarterlyComparison:'Quarterly Comparison',quarter:'Quarter',growth:'Growth',difference:'Difference',customComparison:'Custom Comparison',
      service:'Service',revenue:'Revenue',operations:'Operations',averageTransaction:'Average Transaction',allYears:'All Years',sales:'Sales',topSellingServices:'Top Selling Services'
    },
    tokens:{
      january:'January',february:'February',march:'March',april:'April',may:'May',june:'June',july:'July',august:'August',september:'September',october:'October',november:'November',december:'December',
      comprehensive:'Comprehensive',happy:'Happy',basic:'Basic',basicAlt:'Basic',haircut:'Haircut',dog:'Dog',cat:'Cat',bird:'Bird',rabbit:'Rabbit',large:'Large',medium:'Medium',mediumAlt:'Medium',small:'Small',cash:'Cash',cashAlt:'Cash',
      salesIncludingVat:'Sales Including VAT',salesBeforeVat:'Sales Before VAT',vat:'VAT',allYears:'All Years',customComparison:'Custom Comparison'
    },
    businessAliases:{
      comprehensiveMediumDog:'Comprehensive - Medium Dog',comprehensiveMediumCat:'Comprehensive - Medium Cat',comprehensiveLargeDog:'Comprehensive - Large Dog',basicMediumCat:'Basic - Medium Cat',basicMediumDog:'Basic - Medium Dog',happyLargeDog:'Happy - Large Dog',haircutMedium:'Medium Haircut'
    }
  };
  store.registerModule('enterpriseUiCertification',{ar:ar,en:en});
})();
