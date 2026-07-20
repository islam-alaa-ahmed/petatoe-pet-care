/* PETATOE v9.4.23 — Phase A5.1 Children Expenses residual localization catalog. */
(function(){
  'use strict';
  var CATALOG={
    ar:{
      common:{all:'الكل',unspecified:'غير محدد',edit:'تعديل',delete:'حذف',readOnly:'عرض فقط',total:'الإجمالي',operations:'عملية',noAccess:'غير متاح'},
      filters:{allYears:'كل السنوات',allMonths:'كل الشهور',allChildren:'كل الأبناء',allTypes:'كل الأنواع'},
      budget:{none:'بدون ميزانية',exceeded:'تجاوز الميزانية',nearLimit:'اقترب من الحد',within:'داخل الميزانية',noneRecorded:'لا توجد ميزانيات مسجلة حتى الآن'},
      empty:{expenses:'لا توجد مصروفات مسجلة في الفلتر الحالي',report:'لا توجد بيانات في هذا التقرير',monthly:'لا توجد بيانات شهرية في الفلتر الحالي'},
      permission:{default:'ليس لديك صلاحية لتنفيذ هذا الإجراء',view:'ليس لديك صلاحية عرض قسم مصروفات الأبناء.',add:'ليس لديك صلاحية إضافة مصروفات الأبناء',edit:'ليس لديك صلاحية تعديل مصروفات الأبناء',delete:'ليس لديك صلاحية حذف مصروفات الأبناء',budget:'ليس لديك صلاحية إدارة ميزانية مصروفات الأبناء',export:'ليس لديك صلاحية تصدير تقارير مصروفات الأبناء',print:'ليس لديك صلاحية طباعة تقارير مصروفات الأبناء'},
      kpi:{totalExpenses:'إجمالي المصروفات',monthExpenses:'مصروفات الشهر',monthBudget:'ميزانية الشهر',childrenCount:'عدد الأبناء',allRecords:'كل السجلات',remaining:'المتبقي: {value}',notSet:'لم يتم تحديدها',byRecord:'حسب السجل'},
      reports:{reportTotal:'إجمالي التقرير',operationCount:'عدد العمليات',topChild:'أعلى ابن',topCategory:'أعلى بند',trendTotal:'إجمالي الاتجاه',monthlyAverage:'متوسط شهري',childrenExpenses:'مصروفات الأبناء',child:'الابن',category:'نوع المصروف'},
      export:{noData:'لا توجد بيانات للتصدير',done:'تم تصدير تقرير المصروفات',headers:{date:'التاريخ',child:'الابن',category:'نوع المصروف',payment:'طريقة الدفع',amount:'المبلغ',notes:'ملاحظات'}},
      print:{noData:'لا توجد بيانات للطباعة',title:'تقرير مصروفات الأبناء',reportDate:'تاريخ التقرير',operationCount:'عدد العمليات',total:'الإجمالي',blocked:'المتصفح منع نافذة الطباعة'},
      form:{enterChild:'اكتب اسم الابن',enterAmount:'اكتب مبلغ صحيح',saved:'تم حفظ المصروف',updated:'تم تعديل المصروف',validMonth:'حدد شهر صحيح',validBudget:'اكتب ميزانية صحيحة',budgetSaved:'تم حفظ الميزانية',budgetUpdated:'تم تعديل الميزانية',deleteExpense:'حذف مصروف ',deleteBudget:'حذف ميزانية ',expenseDeleted:'تم حذف المصروف',budgetDeleted:'تم حذف الميزانية'},
      shell:{title:'👨‍👧‍👦 مصروفات الأبناء',subtitle:'متابعة مصروفات الأبناء حسب صلاحية المستخدم',tabsLabel:'تبويبات مصروفات الأبناء',budgetTab:'💰 الميزانية',entryTab:'➕ إضافة مصروف',logTab:'📋 سجل المصروفات',reportsTab:'📊 تقارير مصروفات الأبناء',annualTab:'📅 التقرير السنوي',exportExcel:'📊 تصدير Excel',printPdf:'🖨️ PDF / طباعة',year:'السنة',month:'الشهر',child:'الابن',category:'نوع المصروف',resetReportFilters:'مسح فلاتر التقارير',resetFilters:'مسح الفلاتر',searchPlaceholder:'بحث بالاسم أو النوع أو الملاحظات',date:'التاريخ',type:'النوع',payment:'طريقة الدفع',amount:'المبلغ',notes:'ملاحظات',actions:'إجراءات',addExpense:'➕ إضافة مصروف',childName:'اسم الابن',childPlaceholder:'مثال: عمر',optionalNotes:'ملاحظات اختيارية',saveExpense:'💾 حفظ المصروف',clear:'إلغاء/مسح',expenseLog:'📋 سجل المصروفات'}
    },
    en:{
      common:{all:'All',unspecified:'Unspecified',edit:'Edit',delete:'Delete',readOnly:'View only',total:'Total',operations:'operations',noAccess:'Unavailable'},
      filters:{allYears:'All years',allMonths:'All months',allChildren:'All children',allTypes:'All types'},
      budget:{none:'No budget',exceeded:'Budget exceeded',nearLimit:'Near limit',within:'Within budget',noneRecorded:'No budgets have been recorded yet'},
      empty:{expenses:'No expenses match the current filters',report:'No data available for this report',monthly:'No monthly data matches the current filters'},
      permission:{default:'You do not have permission to perform this action',view:'You do not have permission to view Children Expenses.',add:'You do not have permission to add children expenses',edit:'You do not have permission to edit children expenses',delete:'You do not have permission to delete children expenses',budget:'You do not have permission to manage children expense budgets',export:'You do not have permission to export children expense reports',print:'You do not have permission to print children expense reports'},
      kpi:{totalExpenses:'Total expenses',monthExpenses:'Monthly expenses',monthBudget:'Monthly budget',childrenCount:'Children',allRecords:'All records',remaining:'Remaining: {value}',notSet:'Not set',byRecord:'Based on records'},
      reports:{reportTotal:'Report total',operationCount:'Operations',topChild:'Top child',topCategory:'Top category',trendTotal:'Trend total',monthlyAverage:'Monthly average',childrenExpenses:'Children expenses',child:'Child',category:'Expense type'},
      export:{noData:'No data to export',done:'Expense report exported',headers:{date:'Date',child:'Child',category:'Expense type',payment:'Payment method',amount:'Amount',notes:'Notes'}},
      print:{noData:'No data to print',title:'Children Expenses Report',reportDate:'Report date',operationCount:'Operations',total:'Total',blocked:'The browser blocked the print window'},
      form:{enterChild:'Enter the child name',enterAmount:'Enter a valid amount',saved:'Expense saved',updated:'Expense updated',validMonth:'Select a valid month',validBudget:'Enter a valid budget',budgetSaved:'Budget saved',budgetUpdated:'Budget updated',deleteExpense:'Delete expense for ',deleteBudget:'Delete budget for ',expenseDeleted:'Expense deleted',budgetDeleted:'Budget deleted'},
      shell:{title:'👨‍👧‍👦 Children Expenses',subtitle:'Track children expenses according to user permissions',tabsLabel:'Children Expenses tabs',budgetTab:'💰 Budget',entryTab:'➕ Add Expense',logTab:'📋 Expense Log',reportsTab:'📊 Children Expense Reports',annualTab:'📅 Annual Report',exportExcel:'📊 Export Excel',printPdf:'🖨️ PDF / Print',year:'Year',month:'Month',child:'Child',category:'Expense type',resetReportFilters:'Clear report filters',resetFilters:'Clear filters',searchPlaceholder:'Search by name, type, or notes',date:'Date',type:'Type',payment:'Payment method',amount:'Amount',notes:'Notes',actions:'Actions',addExpense:'➕ Add Expense',childName:'Child name',childPlaceholder:'Example: Omar',optionalNotes:'Optional notes',saveExpense:'💾 Save Expense',clear:'Cancel / Clear',expenseLog:'📋 Expense Log'}
    }
  };
  function register(){var s=window.PETATOE_LOCALIZATION_CENTER_STORE;if(!s||typeof s.registerModule!=='function')return false;s.registerModule('childrenExpensesA51',CATALOG);return true;}
  if(!register())window.addEventListener('petatoe:localization-center-store-ready',register,{once:true});
})();
