/* PETATOE v9.4.23 — Customer management and appointment master-data localization catalog */
(function(){
  'use strict';
  var CATALOG={
    ar:{
      tabs:{customersPets:'👥 العملاء والحيوانات'},
      actions:{refresh:'🔄 تحديث',restoreDefaults:'↩️ استعادة القيم الافتراضية',addSave:'إضافة / حفظ',importCustomersExcel:'📥 رفع البيانات Excel',exportCustomersExcel:'📤 تصدير البيانات Excel',downloadCustomersTemplate:'تنزيل النموذج'},
      filters:{allAnimalTypes:'كل أنواع الحيوانات'},
      customersPets:{title:'👥 العملاء والحيوانات'},
      master:{title:'⚙️ البيانات المرجعية للمواعيد',chooseSection:'اختر القسم',animalTypes:'🐾 أنواع الحيوانات',breeds:'🧬 السلالات',sizes:'📏 الأحجام',services:'🛁 الخدمات',customers:'👥 بيانات العملاء',vehicleStaff:'🚐 بيانات السيارات والموظفين'},
      fields:{code:'الكود',name:'الاسم',address:'العنوان',mobile:'الجوال',googleMapsUrl:'رابط Google Maps',locationLink:'رابط الموقع',appointmentGoogleMaps:'رابط موقع العميل (Google Maps)',appointmentDate:'التاريخ',appointmentSlot:'موعد الجلسة',actions:'الإجراءات'},
      appointmentSlots:{noon12:'12 ظهرًا',afternoon2:'2 ظهرًا',evening4:'4 مساءً',evening6:'6 مساءً',evening8:'8 مساءً',evening10:'10 مساءً',chooseVehicleDate:'اختر السيارة والتاريخ أولًا',chooseSlot:'اختر موعد الجلسة',selectVehicle:'اختر السيارة أولًا',selectSlot:'اختر موعد الجلسة'},calendar:{timeline:'Timeline',monthly:'التقويم الشهري',today:'اليوم',detailsTitle:'تفاصيل المواعيد',totalAppointments:'إجمالي المواعيد: {count}',appointment:'موعد',appointments:'مواعيد',viewDetails:'عرض التفاصيل',openAppointment:'فتح الموعد',close:'إغلاق',noAppointments:'لا توجد مواعيد',unassignedVehicle:'بدون سيارة',conflictsTitle:'تنبيه تعارضات',conflictsMessage:'يوجد {count} تعارض محتمل في الفترة المعروضة. راجع الجرومر أو السائق أو السيارة'},
      search:{masterCustomers:'بحث بالكود / الاسم / العنوان / الجوال / رابط الموقع'},
      empty:{noData:'لا توجد بيانات'},
      fallback:{unknownCustomer:'عميل غير محدد',unknownAnimal:'حيوان غير محدد'},
      pets:{count:'عدد {count}'},
      import:{title:'مراجعة رفع العملاء',waiting:'في انتظار اختيار ملف',loadingExcelLibrary:'جارٍ تجهيز مكتبة Excel',readingFile:'جارٍ قراءة ملف العملاء',parsingFile:'جارٍ تحليل ملف العملاء',validatingRows:'جارٍ التحقق من {count} صف',readyForApproval:'اكتملت المراجعة. اضغط موافقة لحفظ البيانات في Supabase',reviewSummary:'الإجمالي: {total} | جديد: {created} | تحديث: {updated} | بدون تغيير: {unchanged}',approveSave:'موافقة وحفظ في Supabase',cancel:'إلغاء',preparingSave:'جارٍ تجهيز البيانات للحفظ',savingToSupabase:'جارٍ حفظ العملاء في Supabase',savedToSupabase:'تم حفظ {count} عميل في Supabase',savedToast:'تم حفظ العملاء في Supabase',saveFailed:'تعذر حفظ العملاء في Supabase. راجع الاتصال والصلاحيات',supabaseUnavailable:'مسار الحفظ المؤكد في Supabase غير متاح',noValidRows:'لم يتم العثور على صفوف عملاء صالحة',excelUnavailable:'مكتبة Excel غير متاحة',readFailed:'تعذر قراءة ملف العملاء'}
    },
    en:{
      tabs:{customersPets:'👥 Customers & Pets'},
      actions:{refresh:'🔄 Refresh',restoreDefaults:'↩️ Restore Defaults',addSave:'Add / Save',importCustomersExcel:'📥 Import Customers Excel',exportCustomersExcel:'📤 Export Customers Excel',downloadCustomersTemplate:'Download Template'},
      filters:{allAnimalTypes:'All Animal Types'},
      customersPets:{title:'👥 Customers & Pets'},
      master:{title:'⚙️ Appointment Master Data',chooseSection:'Choose Section',animalTypes:'🐾 Animal Types',breeds:'🧬 Breeds',sizes:'📏 Sizes',services:'🛁 Services',customers:'👥 Customer Data',vehicleStaff:'🚐 Vehicles & Staff'},
      fields:{code:'Code',name:'Name',address:'Address',mobile:'Mobile',googleMapsUrl:'Google Maps URL',locationLink:'Location Link',appointmentGoogleMaps:'Customer location link (Google Maps)',appointmentDate:'Date',appointmentSlot:'Session Time',actions:'Actions'},
      appointmentSlots:{noon12:'12 PM',afternoon2:'2 PM',evening4:'4 PM',evening6:'6 PM',evening8:'8 PM',evening10:'10 PM',chooseVehicleDate:'Select a vehicle and date first',chooseSlot:'Select session time',selectVehicle:'Select a vehicle first',selectSlot:'Select session time'},calendar:{timeline:'Timeline',monthly:'Monthly Calendar',today:'Today',detailsTitle:'Appointment Details',totalAppointments:'Total appointments: {count}',appointment:'appointment',appointments:'appointments',viewDetails:'View Details',openAppointment:'Open Appointment',close:'Close',noAppointments:'No appointments',unassignedVehicle:'Unassigned vehicle',conflictsTitle:'Scheduling conflicts',conflictsMessage:'There are {count} potential conflicts in the displayed period. Review the groomer, driver, or vehicle'},
      search:{masterCustomers:'Search by code / name / address / mobile / location link'},
      empty:{noData:'No data available'},
      fallback:{unknownCustomer:'Unspecified customer',unknownAnimal:'Unspecified animal'},
      pets:{count:'Count {count}'},
      import:{title:'Customer Import Review',waiting:'Waiting for a file',loadingExcelLibrary:'Preparing the Excel library',readingFile:'Reading customer file',parsingFile:'Parsing customer file',validatingRows:'Validating {count} rows',readyForApproval:'Review complete. Approve to save the data to Supabase',reviewSummary:'Total: {total} | New: {created} | Updated: {updated} | Unchanged: {unchanged}',approveSave:'Approve and Save to Supabase',cancel:'Cancel',preparingSave:'Preparing data for save',savingToSupabase:'Saving customers to Supabase',savedToSupabase:'Saved {count} customers to Supabase',savedToast:'Customers saved to Supabase',saveFailed:'Could not save customers to Supabase. Check connection and permissions',supabaseUnavailable:'Confirmed Supabase save is unavailable',noValidRows:'No valid customer rows found',excelUnavailable:'Excel library is unavailable',readFailed:'Could not read the customer file'}
    }
  };
  function register(){var s=window.PETATOE_LOCALIZATION_CENTER_STORE;if(!s||typeof s.registerModule!=='function')return false;s.registerModule('operationsCustomer',CATALOG);return true;}
  if(!register())window.addEventListener('petatoe:localization-center-store-ready',register,{once:true});
})();
