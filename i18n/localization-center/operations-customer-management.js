/* PETATOE v9.4.23 — Customer management and appointment master-data localization catalog */
(function(){
  'use strict';
  var CATALOG={
    ar:{
      tabs:{customersPets:'👥 العملاء والحيوانات'},
      actions:{refresh:'🔄 تحديث',restoreDefaults:'↩️ استعادة القيم الافتراضية',addSave:'إضافة / حفظ',importCustomersExcel:'📥 رفع البيانات Excel',exportCustomersExcel:'📤 تصدير البيانات Excel'},
      filters:{allAnimalTypes:'كل أنواع الحيوانات'},
      customersPets:{title:'👥 العملاء والحيوانات'},
      master:{title:'⚙️ البيانات المرجعية للمواعيد',chooseSection:'اختر القسم',animalTypes:'🐾 أنواع الحيوانات',breeds:'🧬 السلالات',sizes:'📏 الأحجام',services:'🛁 الخدمات',customers:'👥 بيانات العملاء',vehicleStaff:'🚐 بيانات السيارات والموظفين'},
      fields:{code:'الكود',name:'الاسم',address:'العنوان',mobile:'الجوال',actions:'الإجراءات'},
      search:{masterCustomers:'بحث بالكود / الاسم / العنوان / الجوال'},
      empty:{noData:'لا توجد بيانات'},
      fallback:{unknownCustomer:'عميل غير محدد',unknownAnimal:'حيوان غير محدد'},
      pets:{count:'عدد {count}'}
    },
    en:{
      tabs:{customersPets:'👥 Customers & Pets'},
      actions:{refresh:'🔄 Refresh',restoreDefaults:'↩️ Restore Defaults',addSave:'Add / Save',importCustomersExcel:'📥 Import Customers Excel',exportCustomersExcel:'📤 Export Customers Excel'},
      filters:{allAnimalTypes:'All Animal Types'},
      customersPets:{title:'👥 Customers & Pets'},
      master:{title:'⚙️ Appointment Master Data',chooseSection:'Choose Section',animalTypes:'🐾 Animal Types',breeds:'🧬 Breeds',sizes:'📏 Sizes',services:'🛁 Services',customers:'👥 Customer Data',vehicleStaff:'🚐 Vehicles & Staff'},
      fields:{code:'Code',name:'Name',address:'Address',mobile:'Mobile',actions:'Actions'},
      search:{masterCustomers:'Search by code / name / address / mobile'},
      empty:{noData:'No data available'},
      fallback:{unknownCustomer:'Unspecified customer',unknownAnimal:'Unspecified animal'},
      pets:{count:'Count {count}'}
    }
  };
  function register(){var s=window.PETATOE_LOCALIZATION_CENTER_STORE;if(!s||typeof s.registerModule!=='function')return false;s.registerModule('operationsCustomer',CATALOG);return true;}
  if(!register())window.addEventListener('petatoe:localization-center-store-ready',register,{once:true});
})();
