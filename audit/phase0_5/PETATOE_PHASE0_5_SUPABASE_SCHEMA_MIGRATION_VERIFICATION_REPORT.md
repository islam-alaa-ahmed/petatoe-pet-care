# PETATOE Phase 0.5 — Supabase Schema & Migration Verification

## الحالة

**PASSED — Static Contract Audit**  
**Live Database Verification Pending — Read-only SQL prepared**

هذه المرحلة لم تتصل بقاعدة Supabase الحية، ولم تنفذ أي SQL، ولم تعدل بيانات أو RLS أو Edge Functions. النتيجة توثق ما يتوقعه الـFrontend وما يعرّفه المستودع، وتحدد الفجوات التي يجب التحقق منها على قاعدة البيانات الحية قبل أي Migration أو إصلاح Schema.

## Baseline

- `petatoe-pet-care-main (34).zip`
- مدمج معها Phase 0 وPhase 1A وPhase 1B.

## نتائج الجرد

- ملفات نصية ممسوحة: **437**
- جداول Supabase referenced مباشرة من الكود: **11**
- RPCs referenced: **15**
- Edge Functions referenced: **2**
- جداول معرفة عبر SQL داخل المستودع: **10**
- Functions/RPCs معرفة عبر SQL: **22**
- جداول لها Policy definitions داخل SQL: **8**
- Edge Function source directories: **2**

## العقود المتوافقة

### RPCs

كل RPC referenced من الـFrontend له تعريف SQL داخل المستودع. لا توجد فجوة Definition في الـ15 RPC المستخدمة مباشرة.

### Edge Functions

المشروع يستخدم:

- `petatoe-security-email`
- `petatoe-translate`

ويوجد Source Directory لكل منهما داخل `supabase/functions/`.

## الفجوة الأساسية

الجداول التالية referenced من الـFrontend، لكن لا يوجد داخل المستودع الحالي `CREATE TABLE` كامل لها:

- `app_user_permissions`
- `app_users`
- `audit_logs`
- `payroll_employees`
- `roles`
- `sales_records`
- `system_settings`
- `warehouse_items`
- `warehouse_settings`
- `warehouse_transactions`

هذا **لا يثبت أن الجداول غير موجودة في Supabase الحية**. لكنه يثبت أن المستودع لا يحتوي على Migration Baseline كاملة تعيد إنشاء الـCore Schema من الصفر، ولا يمكن اعتماد ملفات SQL الحالية وحدها كـSingle Source للـDatabase Schema.

## RLS

ملفات SQL تحتوي Policies لعدد محدود من الجداول، لكن لا يمكن من فحص المستودع وحده إثبات:

- أن RLS مفعّل فعليًا على كل جدول حي.
- أن كل Policy تم تطبيقها.
- أن Policy قديمة لم تعد موجودة.
- أن أدوار `anon` و`authenticated` لها الصلاحيات الصحيحة.

لذلك تم إنشاء `PETATOE_PHASE0_5_READONLY_LIVE_VERIFICATION.sql`، وهو SELECT-only ويستخرج:

- وجود الجداول المتوقعة.
- حالة RLS وForce RLS.
- جميع Policies الحالية.
- وجود RPCs المتوقعة.
- Triggers الحالية.

## Migration Risks

1. لا يوجد Migration Ledger أو Schema Version Table موحد.
2. ملفات SQL تحمل أسماء مراحل تاريخية، وبعضها Split/Parity/Hotfix، لذلك لا يجوز تشغيلها كلها تلقائيًا أو حسب الترتيب الأبجدي.
3. وجود SQL file لا يثبت أنه مطبق على البيئة الحية.
4. Core tables الأساسية لا تملك Baseline migration كاملة داخل المستودع الحالي.
5. يجب منع أي تعديل Schema جديد قبل أخذ Snapshot read-only من البيئة الحية ومقارنته بعقود الـFrontend.

## القرار

لا يتم تشغيل أي SQL في المرحلة التالية قبل استلام نتائج ملف التحقق الحي أو استخراج Schema Dump موثوق. الإصلاح الصحيح لاحقًا هو إنشاء:

- `schema_migrations` registry.
- Core baseline migration موثقة.
- Ordered migration manifest.
- Read-only preflight checks.
- RLS certification.

## الملفات المضافة

- `scripts/phase0-5-supabase-schema-verification.js`
- `scripts/phase0-5-supabase-schema-verification-check.js`
- `audit/phase0_5/PETATOE_PHASE0_5_SCHEMA_CONTRACT.json`
- `audit/phase0_5/PETATOE_PHASE0_5_READONLY_LIVE_VERIFICATION.sql`
- `audit/phase0_5/PETATOE_PHASE0_5_SUPABASE_SCHEMA_MIGRATION_VERIFICATION_REPORT.md`

## Regression

- لا Business Logic modified.
- لا Runtime modified.
- لا `index.html` modified.
- لا Service Worker modified.
- لا CSS modified.
- لا SQL executed.
- لا Supabase data modified.
