/* PETATOE v9.4.0 - Localization Center Consolidation Adapter
   Single translation source with backward-compatible adapters. */
(function(){
  'use strict';
  var center=window.PETATOE_LOCALIZATION_CENTER;
  if(!center||center.__consolidated)return;
  var modules=Object.create(null);
  var runtimeMap={
  "تم تصدير تقرير المصروفات": "Expense report exported",
  "تم حذف المصروف": "Expense deleted",
  "تم حذف الميزانية": "Budget deleted",
  "نوع التصدير غير معروف": "Unknown export type",
  "تم تصدير CSV بديل لأن مكتبة Excel غير متاحة.": "A fallback CSV file was exported because the Excel library is unavailable.",
  "تم تصدير TXT/CSV بديل لأن مكتبة Excel غير متاحة.": "A fallback TXT/CSV file was exported because the Excel library is unavailable.",
  "تعذر العثور على محتوى الطباعة": "Print content could not be found",
  "تعذر تنفيذ التصدير": "Export could not be completed",
  "مكتبة Excel غير متاحة حالياً، لا يمكن قراءة ملف Excel.": "The Excel library is currently unavailable, so the Excel file cannot be read.",
  "مكتبة Excel غير متاحة حالياً، لا يمكن قراءة الملف.": "The Excel library is currently unavailable, so the file cannot be read.",
  "مكتبة Excel غير متاحة، تم تصدير نسخة CSV بديلة بدون كسر الصفحة.": "The Excel library is unavailable. A fallback CSV file was exported without interrupting the page.",
  "مكتبة Excel غير متاحة": "Excel library is unavailable",
  "مكتبة Excel غير محملة": "Excel library is not loaded",
  "تعذر تصدير التقرير": "The report could not be exported",
  "تعذر تصدير ذكاء الأعمال": "Business Intelligence export failed",
  "اكتب الاسم أولاً": "Enter the name first",
  "تم حفظ الاسم": "Name saved",
  "يجب إدخال 3 شرائح لكل فئة": "Three tiers must be entered for each category",
  "تم حفظ الشرائح من الشهر المختار وما بعده": "Tiers were saved from the selected month onward",
  "الشهر مقفول بالفعل. هل تريد استبدال Snapshot المحفوظ؟": "The month is already locked. Replace the saved snapshot?",
  "تم قفل الشهر وحفظ Snapshot": "The month was locked and the snapshot was saved",
  "لم يتم تحديد الشهر": "No month was selected",
  "الشهر غير موجود في الأرشيف": "The month was not found in the archive",
  "هل تريد إلغاء قفل شهر ": "Unlock month ",
  "تم إلغاء قفل الشهر من الأرشيف": "The month was unlocked from the archive",
  "تم إعادة احتساب الشهر من البيانات الحالية بدون تغيير أي تقرير قديم": "The month was recalculated from current data without changing any previous report",
  "XLSX غير متاح حاليًا": "XLSX is currently unavailable",
  "تعذر تصدير Customer 360": "Customer 360 export failed",
  "تعذر تصدير الإدارة العليا": "Executive management export failed",
  "تعذر التصدير": "Export failed",
  "تعذر حفظ بيانات الأسطول: اتصال Supabase غير جاهز": "Fleet data could not be saved: Supabase connection is not ready",
  "فشل حفظ بيانات الأسطول في Supabase": "Failed to save fleet data in Supabase",
  "اكتب اسم السيارة أولاً": "Enter the vehicle name first",
  "تم حفظ بيانات السيارة": "Vehicle data saved",
  "حذف السيارة من قسم إدارة الأسطول فقط؟": "Delete the vehicle from Fleet Management only?",
  "تم الحذف من قسم الأسطول": "Deleted from the Fleet section",
  "اختر السيارة أولاً": "Select a vehicle first",
  "تم حفظ التسجيل": "Record saved",
  "تم حذف التسجيل": "Record deleted",
  "لا توجد سيارات لإضافة بيانات تجربة": "No vehicles are available for adding sample data",
  "تمت إضافة بيانات تجربة للقسم": "Sample data was added to the section",
  "تعذر حفظ مركز الحركة: اتصال Supabase غير جاهز": "Movement center could not be saved: Supabase connection is not ready",
  "فشل حفظ مركز الحركة في Supabase": "Failed to save the movement center in Supabase",
  "حذف هذه الحركة من سجل الحركات؟": "Delete this movement from the movement log?",
  "تعديل المرجع": "Edit reference",
  "سبب حذف المستخدم؟": "Reason for deleting the user?",
  "كلمة المرور الجديدة للمستخدم ": "New password for user ",
  "تم تغيير كلمة المرور": "Password changed",
  "المستخدم غير نشط": "User is inactive",
  "تم تفعيل المستخدم: ": "User activated: ",
  "تم حفظ الصلاحيات": "Permissions saved",
  "تم حفظ إعدادات الأمان": "Security settings saved",
  "تم تحديث بياناتي": "My profile was updated",
  "تم حفظ الصلاحية: ": "Permission saved: ",
  "تم حفظ قواعد جودة البيانات": "Data-quality rules saved",
  "الصلاحية الحالية لا تسمح بالتعديل": "The current permission does not allow editing",
  "تم تصحيح ": "Corrected ",
  "لا يوجد اختلاف في الشهور": "There is no month difference",
  "الصلاحية الحالية لا تسمح بمسح السجل": "The current permission does not allow clearing the log",
  "الصلاحية الحالية لا تسمح بالنسخ الاحتياطي": "The current permission does not allow backup",
  "الصلاحية الحالية لا تسمح بالاسترجاع": "The current permission does not allow restore",
  "استرجاع النسخة الاحتياطية سيستبدل البيانات الحالية. هل أنت متأكد؟": "Restoring the backup will replace the current data. Are you sure?",
  "تم استرجاع النسخة الاحتياطية بنجاح": "Backup restored successfully",
  "ملف Backup غير صالح أو مصدر Supabase غير جاهز": "The backup file is invalid or the Supabase source is not ready",
  "الصلاحية الحالية لا تسمح بالحفظ": "The current permission does not allow saving",
  "لم يتم الحفظ: ": "Not saved: ",
  "تنبيه جودة بيانات:\n- ": "Data-quality warning:\n- ",
  "غير متاح للصلاحية الحالية": "Unavailable for the current permission",
  "⚠️ يوجد تعارض في الموعد:\n": "⚠️ Appointment conflict detected:\n",
  "أنت ترجع حالة الطلب من \"": "You are reverting the request status from \"",
  "اكتب سبب إعادة فتح الجلسة": "Enter the reason for reopening the session",
  "فشل مزامنة بيانات التشغيل مع Supabase": "Failed to synchronize operations data with Supabase",
  "حذف كشف الراتب نهائيًا من الرواتب الشهرية؟": "Permanently delete this salary slip from monthly payroll?",
  "لم يتم العثور على تفاصيل سبب الترشيح لهذا العميل. افتح التقرير مرة أخرى ثم جرّب.": "Candidate-reason details were not found for this customer. Reopen the report and try again.",
  "لا توجد بيانات لتصدير تقرير العملاء المرشحين للعقود.": "No data is available for exporting the contract-candidate customers report.",
  "تعذر تصدير تقرير العملاء المرشحين Excel.": "The contract-candidate customers Excel report could not be exported.",
  "تقرير العملاء المرشحين للعقود غير مفتوح حالياً.": "The contract-candidate customers report is not currently open.",
  "المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم جرّب مرة أخرى.": "The browser blocked the print window. Allow pop-ups and try again.",
  "تعذر تصدير تقرير العملاء المرشحين PDF.": "The contract-candidate customers PDF report could not be exported.",
  "لا توجد بيانات قابلة للرفع بعد التخطي": "No uploadable data remains after bypassing validation",
  "تخطي قواعد الرفع متاح فقط لـ Super Admin": "Bypassing upload rules is available only to Super Admin",
  "فشل تنفيذ التخطي والرفع": "Bypass and upload failed",
  "تم منع الرفع - راجع تفاصيل الأخطاء": "Upload was blocked. Review the error details.",
  "جاري رفع البيانات الرسمية إلى Supabase...": "Uploading official data to Supabase...",
  "فشل الرفع إلى Supabase — راجع Console": "Upload to Supabase failed — check the Console",
  "حدث خطأ أثناء الرفع إلى Supabase": "An error occurred while uploading to Supabase",
  "تعذر الرفع إلى Supabase — راجع Console": "Could not upload to Supabase — check the Console",
  "تم اختيار: ": "Selected: ",
  "جاري حفظ طرق الدفع في Supabase...": "Saving payment methods in Supabase...",
  "لا توجد بيانات جاهزة للاعتماد": "No data is ready for approval",
  "افتح معاينة الفاتورة الأول من زر العين أو رقم الفاتورة": "Open the invoice preview first using the eye button or invoice number",
  "المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.": "The browser blocked the print window. Allow pop-ups and try again.",
  "حذف السجل من Supabase نهائيًا؟": "Permanently delete the record from Supabase?",
  "حذف كل بيانات المبيعات من Supabase؟\nعدد السجلات الحالية: ": "Delete all sales data from Supabase?\nCurrent record count: ",
  "تأكيد نهائي: لن ترجع البيانات بعد التحديث إلا إذا رفعتها من Excel مرة أخرى.": "Final confirmation: the data cannot be restored after the update unless it is uploaded again from Excel.",
  "فشل تطبيق قالب السائق/الجرومر: ": "Failed to apply the driver/groomer template: ",
  "فشل تطبيق القالب التشغيلي: ": "Failed to apply the operations template: ",
  "تم حفظ إعدادات النظام": "System settings saved",
  "لا توجد بيانات تجريبية ظاهرة": "No sample data is currently visible",
  "تم مسح البيانات التجريبية": "Sample data cleared",
  "للتأكيد اكتب DELETE": "Type DELETE to confirm",
  "تم الإلغاء": "Cancelled",
  "مسح كل التخزين المحلي؟": "Clear all local storage?",
  "تم تنفيذ التصفير": "Reset completed",
  "تمت إعادة بناء الفهارس": "Indexes rebuilt",
  "تم تنظيف الكاش": "Cache cleared",
  "وحدة الصلاحيات غير جاهزة": "Permissions module is not ready",
  "تم حفظ ربط السيارات للمستخدم": "User vehicle assignments saved",
  "تم تحديد كل السيارات، اضغط حفظ للتأكيد": "All vehicles selected. Click Save to confirm.",
  "اختر مستخدم المصدر والهدف": "Select the source and target users",
  "لا يمكن النسخ لنفس المستخدم": "Assignments cannot be copied to the same user",
  "المستخدم الهدف غير موجود": "Target user not found",
  "Super Admin محمي ولا يحتاج تخصيص": "Super Admin is protected and does not require customization",
  "تم نسخ ربط السيارات": "Vehicle assignments copied",
  "إلغاء الثقة من هذا الجهاز؟ سيُطلب OTP مرة أخرى عند الدخول منه.": "Remove trust from this device? OTP will be required again when signing in from it.",
  "تم إلغاء الثقة من الجهاز": "Device trust removed",
  "إنهاء هذه الجلسة؟ سيتم إجبار هذا الجهاز على تسجيل الدخول مرة أخرى.": "End this session? This device will be forced to sign in again.",
  "تم إنهاء الجلسة": "Session ended",
  "إنهاء كل الجلسات الأخرى؟ ستبقى هذه الجلسة الحالية فقط مفتوحة.": "End all other sessions? Only the current session will remain open.",
  "الاسم موجود بالفعل. هل تريد حفظه رغم التكرار؟": "The name already exists. Save it anyway?",
  "تأكيد حذف هذا السطر من بيانات التهيئة؟": "Confirm deleting this row from configuration data?",
  "تم استيراد بيانات التهيئة من الفواتير الحالية": "Configuration data imported from current invoices",
  "اكتب مبلغ صحيح أكبر من صفر": "Enter a valid amount greater than zero",
  "اكتب اسم المسؤول المستلم": "Enter the receiving officer name",
  "المبلغ أكبر من رصيد خزنة السيارة المتاح": "The amount exceeds the available vehicle cashbox balance",
  "فشل حفظ حركة الخزينة في Supabase: ": "Failed to save the treasury movement in Supabase: ",
  "اكتب أو اختر جهة / بند الصرف": "Enter or select the expense party/item",
  "اكتب المسؤول أو المستلم": "Enter the responsible person or recipient",
  "اكتب مرجع حركة الصرف": "Enter the expense movement reference",
  "المبلغ أكبر من رصيد الخزنة المحددة": "The amount exceeds the selected cashbox balance",
  "لم يتم العثور على الحركة": "Movement not found",
  "هذه حركة فاتورة ولا يتم تعديلها من الخزينة": "This is an invoice movement and cannot be edited from Treasury",
  "سبب التعديل": "Edit reason",
  "سبب التعديل مطلوب": "Edit reason is required",
  "المبلغ الجديد": "New amount",
  "المسؤول مطلوب": "Responsible person is required",
  "المبلغ أكبر من الرصيد المتاح بعد استبعاد الحركة الحالية": "The amount exceeds the available balance after excluding the current movement",
  "البند مطلوب": "Item is required",
  "المرجع مطلوب": "Reference is required",
  "فشل تحديث حركة الخزينة في Supabase: ": "Failed to update the treasury movement in Supabase: ",
  "هذه حركة فاتورة ولا يتم حذفها من الخزينة": "This is an invoice movement and cannot be deleted from Treasury",
  "سبب الحذف": "Deletion reason",
  "سبب الحذف مطلوب": "Deletion reason is required",
  "تأكيد حذف الحركة؟": "Confirm deleting the movement?",
  "فشل حذف حركة الخزينة من Supabase: ": "Failed to delete the treasury movement from Supabase: ",
  "اكتب اسم الصنف": "Enter the item name",
  "كود الصنف يجب أن يكون رقمياً مثل 100001": "The item code must be numeric, such as 100001",
  "كود الصنف موجود بالفعل": "The item code already exists",
  "اسم الصنف موجود بالفعل": "The item name already exists",
  "فشل حفظ الصنف في Supabase: ": "Failed to save the item in Supabase: ",
  "تم حفظ الصنف": "Item saved",
  "فشل حفظ الصنف: ": "Failed to save the item: ",
  "لا يمكن حذف صنف عليه حركات مخزنية. يمكن إيقافه بدل الحذف.": "An item with warehouse movements cannot be deleted. Disable it instead.",
  "حذف الصنف؟": "Delete the item?",
  "هذا صنف خدمي ولا يتم خصمه أو تحريكه داخل المخازن": "This is a service item and is not deducted or moved in warehouses",
  "هذا الصنف متوقف، فعّله أولاً من دليل الأصناف": "This item is inactive. Activate it first from the item directory.",
  "مكتبة Excel غير محملة. افتح الصفحة بالإنترنت أو استخدم القالب CSV لاحقاً.": "The Excel library is not loaded. Open the page online or use the CSV template later.",
  "فشل حفظ أصناف Excel: ": "Failed to save Excel items: ",
  "تعذر قراءة ملف Excel. تأكد من صيغة الملف.": "The Excel file could not be read. Check the file format.",
  "ملف Excel لا يحتوي على بيانات.": "The Excel file contains no data.",
  "لم يتم استيراد أي صنف.\n": "No items were imported.\n",
  "تم استيراد الأصناف من Excel: جديد ": "Items imported from Excel: new ",
  "اختر صنف مخزني أولاً": "Select a warehouse item first",
  "هذا الصنف غير موجود ضمن الأصناف المخزنية. حوّله إلى مخزني من دليل الأصناف أو أضفه من Excel.": "This item is not listed as a warehouse item. Convert it from the item directory or add it from Excel.",
  "اختر صنف مخزني صحيح من القائمة.": "Select a valid warehouse item from the list."
};
  function lang(){return center.getLanguage?center.getLanguage():(document.documentElement.lang||'ar');}
  function fill(value,params){var out=String(value==null?'':value);Object.keys(params||{}).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});return out;}
  function ensurePath(root,path,value){var parts=String(path||'').split('.'),node=root;for(var i=0;i<parts.length-1;i++){node[parts[i]]=node[parts[i]]||{};node=node[parts[i]];}node[parts[parts.length-1]]=value;}
  function registerModule(name,pack){
    if(!name||!pack)return false;modules[name]=pack;
    var dicts=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};
    ['ar','en','fil'].forEach(function(code){if(pack[code]){dicts[code]=dicts[code]||{};ensurePath(dicts[code],name,pack[code]);}});
    return true;
  }
  function registerExisting(){
    var op=window.PETATOE_OPERATIONS_I18N,wh=window.PETATOE_WAREHOUSE_I18N,sm=window.PETATOE_SMART_REPORTS_TRANSLATIONS;
    if(op&&op.dictionaries)registerModule('operationsSource',op.dictionaries);
    if(wh&&wh.dictionaries)registerModule('warehouseSource',wh.dictionaries);
    if(sm)registerModule('smartReportsSource',sm);
  }
  var legacy=window.PETATOE_I18N||{};
  var runtimeCore=typeof legacy.translateRuntime==='function'?legacy.translateRuntime.bind(legacy):function(v){return v;};
  function translateRuntime(value,targetLang){
    if(value==null)return value;var code=targetLang||lang(),text=String(value);
    if(code==='ar')return text;
    if(Object.prototype.hasOwnProperty.call(runtimeMap,text))return runtimeMap[text];
    var exact=runtimeCore(text,code);
    if(typeof exact==='string'&&exact!==text)return exact;
    return text;
  }
  center.registerModule=registerModule;center.modules=modules;center.translateRuntime=translateRuntime;center.runtimeDictionary={ar:Object.keys(runtimeMap).reduce(function(o,k){o[k]=k;return o;},{}),en:runtimeMap};
  registerExisting();
  registerModule('runtimeSource',{ar:Object.keys(runtimeMap).reduce(function(o,k){o[k]=k;return o;},{}),en:runtimeMap});
  if(legacy){
    /* Backward-compatible adapter: legacy runtime callers now enter through the Center.
       Core key lookup stays private because the Center itself uses it internally. */
    legacy.translateRuntime=function(value,targetLang){return center.translateRuntime(value,targetLang);};
  }
  if(window.PETATOE_OPERATIONS_I18N){window.PETATOE_OPERATIONS_I18N.t=function(key,params){return center.t('operationsSource.'+key,params,{fallback:key});};}
  if(window.PETATOE_WAREHOUSE_I18N){window.PETATOE_WAREHOUSE_I18N.t=function(key,params){return center.t('warehouseSource.'+key,params,{fallback:key});};}
  center.__consolidated=true;
  window.dispatchEvent(new CustomEvent('petatoe:localization-center-consolidated',{detail:{version:'9.4.0',modules:Object.keys(modules),runtimeEntries:Object.keys(runtimeMap).length}}));
})();
