# PETATOE v10.0.15 — Runtime Trace Audit R3

## Scope
تشخيص Read-Only داخل Runtime لبطء تحميل بيانات تطبيق الموبايل دون تغيير Business Logic أو SQL أو Supabase Schema.

## Why instrumentation was required
المراجعة الساكنة أثبتت أن حلقة إعادة التحميل السابقة أزيلت، لكنها لا تستطيع تحديد الزمن الحقيقي الذي يستهلكه كل Query أو Render على جهاز المستخدم. لذلك لا يوجد Root Cause نهائي صالح للإصلاح قبل جمع قياس Runtime حقيقي.

## Instrumented stages
- بداية تحميل الصفحة وDOMContentLoaded وload وpageshow.
- تغيّر visibility.
- جميع طلبات fetch مع الزمن والحالة والرابط بعد إخفاء الرموز الحساسة.
- PETATOEDataLayer.readSalesRecords.
- PETATOEDataSource.refreshSalesRecordsFromSupabase.
- PETATOEDataSource.setRuntimeRecords.
- populateFilters.
- renderDashboardAll.
- renderDashboardKpis.
- renderDashboardCharts.
- petatoe:records-changed وأحداث الجلسة والمصادقة المتاحة.

## Data safety
التقرير لا يسجل محتوى سجلات العملاء أو المبيعات، ولا Access Tokens أو API keys. يسجل الزمن، عدد الصفوف، الصفحات، الحالة، واسم المرحلة فقط.

## User retrieval
تمت إضافة زر «نسخ تقرير الأداء» داخل شاشة «حول التطبيق» حتى يمكن نسخ تقرير الجهاز الحقيقي من iPhone وإرساله للتحليل.

## No optimization performed
لم يتم تغيير ترتيب التحميل، الاستعلامات، الحسابات، الرسم، الصلاحيات أو أي منطق بيانات في هذه المرحلة.
