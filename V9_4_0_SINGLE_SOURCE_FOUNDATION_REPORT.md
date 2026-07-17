# PETATOE v9.4.0 — Single Source Localization Foundation

## Scope
تم تنفيذ المرحلة الأولى فقط: إنشاء مخزن ترجمة مركزي Canonical داخل مركز الترجمة، مع الحفاظ على التوافق المؤقت مع الأنظمة القديمة.

## Implemented
- إضافة `i18n/localization-center/dictionary-store.js` كمخزن مركزي وحيد للقراءة الأساسية.
- دمج القواميس العربية والإنجليزية داخل المخزن المركزي.
- تخزين وحدات Operations وWarehouse وSmart Reports وMaintenance وRuntime وGlobal UI داخل المركز.
- تعديل `runtime.js` ليقرأ من المخزن المركزي أولًا قبل أي Compatibility Fallback.
- إضافة `registerModule()` داخل مركز الترجمة لتسجيل أي وحدات انتقالية في المخزن نفسه.
- تحديث الإصدار إلى PETATOE v9.4.0.

## Verification
- Arabic entries: 3206
- English entries: 3206
- Missing Arabic counterparts: 0
- Missing English counterparts: 0
- Canonical modules verified: 6
- JavaScript syntax checks: Passed
- `scripts/single-source-foundation-check.js`: Passed

## Important
هذه المرحلة تؤسس المصدر المركزي وتجعله أولوية القراءة. إزالة القواميس القديمة ووقف كل الاستدعاءات المباشرة لها بالكامل ستكون في المرحلة التالية بعد تحويل المستهلكين شاشةً بشاشة دون كسر النظام.
