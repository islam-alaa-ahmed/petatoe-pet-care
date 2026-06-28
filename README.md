# PETATOE Analytics System

نظام PETATOE لتحليل المبيعات وإدارة المواعيد وتشغيل السيارات والتقارير.

## الإصدار الحالي

`v8.0.2 — GOLD_FINAL_AUDIT_GITHUB_PRODUCTION_CERTIFICATION`

## التشغيل المحلي

افتح ملف `index.html` مباشرة من المتصفح.

## الرفع على GitHub Pages

1. ارفع محتويات هذا المجلد بالكامل إلى GitHub.
2. تأكد أن `index.html` و `assets/` في جذر الريبو.
3. فعّل GitHub Pages من Settings > Pages.
4. اختر Branch: `main` و Folder: `/root`.

## ملاحظات مهمة

- هذه نسخة Static Web App تعمل داخل المتصفح.
- البيانات والصلاحيات تعتمد على تخزين المتصفح محليًا.
- لا تعتبر Login Client-Side أمانًا Server-Side حقيقيًا.
- لا ترفع ملفات ZIP داخل الريبو.

## قاعدة التغليف

أي نسخة Production يجب أن تحتوي على:

- `index.html`
- `assets/`
- `docs/`
- `RELEASE_VERSION.txt`
- `README.md`
- `.gitignore`
- `404.html`


## Security Notes — v7.0.16 — INNERHTML SAFE RENDERING BATCH 1

PETATOE runs as a static client-side web app. Authentication and permissions protect the user interface and normal workflow, but they are not a server-side security boundary. For GitHub Pages deployment, avoid storing sensitive secrets inside the repository or browser storage.

Bootstrap access is now protected by a mandatory first-login password change: the default setup account cannot continue into the system until a stronger custom password is set.


## Production Cleanup v7.0.16
- تم حذف مجلد legacy-unused من نسخة الإنتاج بعد التأكد من عدم وجود مراجع تشغيلية له داخل index.html أو assets/.
- تم تثبيت رقم الإصدار الداخلي على v7.0.16.
- تم تطبيق تحسين تحميل آمن على صورة بطاقة PETATOE.


## التحقق من الدخول المحسن

- تدعم شاشة الدخول `autocomplete="username"` و `autocomplete="current-password"` حتى يقترح المتصفح حفظ بيانات الدخول.
- يدعم ملف `security/auth-session.js` آلية WebAuthn / Passkeys عند توفر `PublicKeyCredential` و `navigator.credentials` على جهاز المستخدم.
- Face ID يعمل على iPhone فقط عند تشغيل النظام من HTTPS مثل GitHub Pages وعلى متصفح يدعم Passkeys.


## v7.0.16 — INNERHTML SAFE RENDERING BATCH 1
- تم تنفيذ تنظيف آمن للـ Silent Catch مع الحفاظ على السلوك الحالي للنظام.
- تم توحيد رقم واسم الإصدار.


## v7.0.16 — innerHTML Safe Rendering Batch 1
- تحديث خريطة مركز الصيانة للـ Silent Catch بعد التأكد أن الفحص النصي لم يعد يرصد Empty Silent Catch.
- إزالة التحذير التشخيصي المتبقي الذي كان يعتمد على Static Map قديمة.
- توحيد رقم واسم الإصدار بعد التعديل.


## v7.0.16 — innerHTML Safe Rendering Batch 1

- تم تنفيذ الدفعة الأولى من Safe Rendering لتقليل High-risk innerHTML.
- تم توحيد رقم واسم الإصدار في ملفات الإصدار الرئيسية.
- يجب تشغيل تقرير الصيانة بعد الرفع للتأكد من انخفاض innerHTML High Risk إلى 16 أو أقل.


## v7.0.19 — INNERHTML SAFE RENDERING BATCH2

- تم تنفيذ الدفعة الثانية من Safe Rendering على Smart Vehicles / Smart Customers / Smart Services / Children Expenses.
- يجب تشغيل تقرير الصيانة بعد الرفع للتأكد من انخفاض innerHTML High Risk إلى 8 أو أقل.
- تم الحفاظ على توحيد رقم واسم الإصدار في ملفات الإصدار.


## v7.1.1 — BLOCKING SCRIPTS REDUCTION BATCH1

- تم تنفيذ Audit آمن لملفات Blocking Scripts بدون نقل تحميل فعلي في هذه المرحلة.
- تم إنشاء خطة Safe Lazy Loading للمرحلة القادمة.
- تم توحيد رقم واسم الإصدار في ملفات الإصدار الرئيسية.


## آخر تحديث

`v8.0.2 — GOLD_FINAL_AUDIT_GITHUB_PRODUCTION_CERTIFICATION`

تم إنشاء خريطة اعتماد للسكربتات قبل أي تحسين أداء فعلي، مع تثبيت v7.1.2 كمرجع مستقر وعدم تغيير ترتيب تحميل ملفات البيانات والتقارير الحساسة.

## v7.2.1 Certification Note

تم اعتماد ملفات Zero-Reference يدويًا بدون حذف أي ملف.

- `sidebar-final.js`: compatibility marker محفوظ.
- `lazy-pilot-probe.js`: runtime probe مستدعى ديناميكيًا.
- لا توجد تغييرات في ترتيب تحميل السكربتات.


## v7.2.2 Performance Certification Safe Phase

This release intentionally does not change critical script ordering. It preserves the stable baseline after the previous regression recovery and adds a performance certification plan for safe future micro-batches.

Protected loading dependencies for this phase:
- Dashboard runtime and data rendering
- Smart Reports Core and Data Engine
- Customer 360 runtime binding
- Chart.js and XLSX loading order
- Auth / session / router

Next safe action: run Maintenance Center and browser regression checks before any further performance micro-batch.


## v8.0.0 — Enterprise Gold Audit RC1

This release candidate starts the Enterprise Gold certification gate from the stable v7.2.2 baseline.

What changed in this RC:
- Release/version metadata unified to `v8.0.0 — SMART_REPORTS_PDF_PRINT_LAYOUT_FIX_RC2`.
- Added Enterprise Gold audit documents under `docs/`.
- No critical script ordering changes were made.
- No feature logic was changed.

Required manual verification before GA:
- Dashboard data appears correctly.
- Smart Reports data appears correctly.
- Customer 360 data appears correctly.
- PDF and Excel export still work.
- Login / Logout / Passkeys still work where supported.
- Vehicle Operations and Appointments still work.
- Maintenance Center reports Internal Runtime Errors = 0.


## v8.0.0 — Smart Reports PDF Print Layout Fix RC2
- Added a dedicated Smart Reports print/PDF layout for the active smart report tab.
- Removed UI controls, buttons, tabs, and interactive filters from the Smart Reports PDF clone.
- Preserved active filters as a print summary and converted charts to static images before print.
- Kept runtime script order unchanged to avoid data regressions.

---

## v8.0.0 — Enterprise Gold GA

تم اعتماد هذه النسخة كحزمة Enterprise Gold GA النهائية.

### ما تم في إصدار GA
- توحيد رقم واسم الإصدار إلى `v8.0.1 — SMART_REPORTS_FILTERS_BINDING_FIX`.
- إضافة شهادة اعتماد النسخة الذهبية داخل `docs/ENTERPRISE_GOLD_CERTIFICATE.md`.
- إضافة ملاحظات الإصدار النهائية داخل `docs/RELEASE_NOTES_v8.0.0_GA.md`.
- إضافة حدود معروفة مؤجلة داخل `docs/KNOWN_LIMITATIONS.md`.
- لم يتم تغيير منطق البيانات أو ترتيب تحميل السكربتات.

### سياسة ما بعد GA
هذه النسخة تعتبر Stable Baseline، وأي تطويرات جديدة يجب تنفيذها على فرع Development منفصل ثم تمر عبر Regression قبل الدمج.



## v8.0.1 — Smart Reports Filters Binding Fix

- إصلاح فلاتر التقارير الذكية التي توقفت بسبب الاعتماد على inline handlers داخل أجزاء يتم Render لها بأمان.
- إعادة ربط فلاتر اتجاه المبيعات الشهري، مقارنة شهر بشهر، خريطة المبيعات Heatmap، مقارنة العملاء بين عامين، وتحليل الخدمات.
- لم يتم تغيير منطق البيانات أو ترتيب تحميل السكربتات.
- يلزم اختبار يدوي للتقارير الذكية بعد التحديث.


## v8.0.2 — Gold Final Audit & GitHub Production Certification

هذه مرحلة اعتماد نهائي قبل الرفع على GitHub Pages.

### ما تم في هذا الإصدار
- توحيد رقم واسم الإصدار إلى `v8.0.2 — GOLD_FINAL_AUDIT_GITHUB_PRODUCTION_CERTIFICATION`.
- إضافة تقرير اعتماد GitHub Production داخل `docs/gold-final-audit-v802/`.
- إضافة Checklist نهائية قبل الرفع.
- لم يتم تغيير منطق البيانات.
- لم يتم تغيير ترتيب تحميل السكربتات الحساسة.
- لم يتم إضافة Features جديدة.

### المطلوب اختباره يدويًا قبل الرفع
- Dashboard يعرض البيانات.
- Smart Reports تعرض البيانات وتعمل فلاترها.
- Customer 360 يعرض بيانات العميل.
- Login / Logout يعملان.
- Appointments وVehicle Operations يعملان.
- PDF / Excel يعملان حسب الحدود المعروفة.
- Maintenance Center لا يعرض Internal Runtime Errors.

### قرار الرفع
لا تُرفع النسخة على GitHub إلا بعد نجاح Checklist الموجودة في:
`docs/gold-final-audit-v802/GITHUB_PRODUCTION_CHECKLIST.md`
