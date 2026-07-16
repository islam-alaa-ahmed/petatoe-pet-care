-- PETATOE v9 Smart Reports Localization Audit - Screen 2: Sales Analysis
-- Direct idempotent import for Supabase SQL Editor.

begin;

with payload(translation_key,module,ar_text,en_text) as (
 values
  ('smartReportsSource.tabs.performanceSummary','smart_reports.sales_analysis','ملخص الأداء','Performance Summary'),
  ('smartReportsSource.tabs.salesAnalysis','smart_reports.sales_analysis','تحليل المبيعات','Sales Analysis'),
  ('smartReportsSource.tabs.vehicleAnalysis','smart_reports.sales_analysis','تحليل السيارات','Vehicle Analysis'),
  ('smartReportsSource.tabs.customerAnalysis','smart_reports.sales_analysis','تحليل العملاء','Customer Analysis'),
  ('smartReportsSource.tabs.serviceAnalysis','smart_reports.sales_analysis','تحليل الخدمات','Service Analysis'),
  ('smartReportsSource.tabs.advancedReports','smart_reports.sales_analysis','مركز التقارير المتقدمة','Advanced Reports Center'),
  ('smartReportsSource.tabs.forecasting','smart_reports.sales_analysis','التوقعات وذكاء الأعمال','Forecasting & Business Intelligence'),
  ('smartReportsSource.tabs.recommendations','smart_reports.sales_analysis','التوصيات','Recommendations'),
  ('smartReportsSource.sales.monthlySalesTrend','smart_reports.sales_analysis','اتجاه المبيعات الشهري','Monthly Sales Trend'),
  ('smartReportsSource.sales.monthToMonthComparison','smart_reports.sales_analysis','مقارنة شهر بشهر','Month-to-Month Comparison'),
  ('smartReportsSource.sales.yearOverYearComparison','smart_reports.sales_analysis','مقارنة سنة بسنة','Year-over-Year Comparison'),
  ('smartReportsSource.sales.monthlyVsYears','smart_reports.sales_analysis','{base} مقابل {current} شهريًا.','{base} vs {current} by month.'),
  ('smartReportsSource.sales.customTwoYearComparison','smart_reports.sales_analysis','مقارنة مخصصة بين سنتين','Custom Two-Year Comparison'),
  ('smartReportsSource.sales.activeComparison','smart_reports.sales_analysis','المقارنة النشطة: {base} ↔ {current}','Active Comparison: {base} ↔ {current}'),
  ('smartReportsSource.sales.period','smart_reports.sales_analysis','الفترة','Period'),
  ('smartReportsSource.sales.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.sales.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.sales.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.sales.growth','smart_reports.sales_analysis','النمو','Growth'),
  ('smartReportsSource.sales.quarter','smart_reports.sales_analysis','الربع','Quarter'),
  ('smartReportsSource.sales.quarterDetails','smart_reports.sales_analysis','تفاصيل الأرباع','Quarter Details'),
  ('smartReportsSource.sales.baseYear','smart_reports.sales_analysis','سنة الأساس','Base Year'),
  ('smartReportsSource.sales.comparisonYear','smart_reports.sales_analysis','سنة المقارنة','Comparison Year'),
  ('smartReportsSource.sales.year','smart_reports.sales_analysis','السنة','Year'),
  ('smartReportsSource.sales.vehicles','smart_reports.sales_analysis','السيارات','Vehicles'),
  ('smartReportsSource.sales.allYears','smart_reports.sales_analysis','كل السنوات','All Years'),
  ('smartReportsSource.sales.allVehicles','smart_reports.sales_analysis','كل السيارات','All Vehicles'),
  ('smartReportsSource.sales.salesIncludingVat','smart_reports.sales_analysis','المبيعات شاملة الضريبة','Sales Including VAT'),
  ('smartReportsSource.sales.salesBeforeVat','smart_reports.sales_analysis','المبيعات قبل الضريبة','Sales Before VAT'),
  ('smartReportsSource.sales.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.sales.includingVat','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.sales.beforeVat','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.sales.customComparison','smart_reports.sales_analysis','مقارنة مخصصة','Custom Comparison'),
  ('smartReportsSource.sales.quarters.q1','smart_reports.sales_analysis','يناير - مارس','January - March'),
  ('smartReportsSource.sales.quarters.q2','smart_reports.sales_analysis','أبريل - يونيو','April - June'),
  ('smartReportsSource.sales.quarters.q3','smart_reports.sales_analysis','يوليو - سبتمبر','July - September'),
  ('smartReportsSource.sales.quarters.q4','smart_reports.sales_analysis','أكتوبر - ديسمبر','October - December'),
  ('smartReportsSource.compare.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.compare.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.compare.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.metrics.gross','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.metrics.net','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.metrics.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.calendar.months.january','smart_reports.sales_analysis','يناير','January'),
  ('smartReportsSource.calendar.months.february','smart_reports.sales_analysis','فبراير','February'),
  ('smartReportsSource.calendar.months.march','smart_reports.sales_analysis','مارس','March'),
  ('smartReportsSource.calendar.months.april','smart_reports.sales_analysis','أبريل','April'),
  ('smartReportsSource.calendar.months.may','smart_reports.sales_analysis','مايو','May'),
  ('smartReportsSource.calendar.months.june','smart_reports.sales_analysis','يونيو','June'),
  ('smartReportsSource.calendar.months.july','smart_reports.sales_analysis','يوليو','July'),
  ('smartReportsSource.calendar.months.august','smart_reports.sales_analysis','أغسطس','August'),
  ('smartReportsSource.calendar.months.september','smart_reports.sales_analysis','سبتمبر','September'),
  ('smartReportsSource.calendar.months.october','smart_reports.sales_analysis','أكتوبر','October'),
  ('smartReportsSource.calendar.months.november','smart_reports.sales_analysis','نوفمبر','November'),
  ('smartReportsSource.calendar.months.december','smart_reports.sales_analysis','ديسمبر','December')
)
insert into public.localization_keys(translation_key,module,source_text,description,is_system,is_active,updated_at)
select translation_key,module,ar_text,'Smart Reports Sales Analysis UI',true,true,now() from payload
on conflict (translation_key) do update set module=excluded.module,source_text=excluded.source_text,is_active=true,updated_at=now();

with payload(translation_key,module,ar_text,en_text) as (
 values
  ('smartReportsSource.tabs.performanceSummary','smart_reports.sales_analysis','ملخص الأداء','Performance Summary'),
  ('smartReportsSource.tabs.salesAnalysis','smart_reports.sales_analysis','تحليل المبيعات','Sales Analysis'),
  ('smartReportsSource.tabs.vehicleAnalysis','smart_reports.sales_analysis','تحليل السيارات','Vehicle Analysis'),
  ('smartReportsSource.tabs.customerAnalysis','smart_reports.sales_analysis','تحليل العملاء','Customer Analysis'),
  ('smartReportsSource.tabs.serviceAnalysis','smart_reports.sales_analysis','تحليل الخدمات','Service Analysis'),
  ('smartReportsSource.tabs.advancedReports','smart_reports.sales_analysis','مركز التقارير المتقدمة','Advanced Reports Center'),
  ('smartReportsSource.tabs.forecasting','smart_reports.sales_analysis','التوقعات وذكاء الأعمال','Forecasting & Business Intelligence'),
  ('smartReportsSource.tabs.recommendations','smart_reports.sales_analysis','التوصيات','Recommendations'),
  ('smartReportsSource.sales.monthlySalesTrend','smart_reports.sales_analysis','اتجاه المبيعات الشهري','Monthly Sales Trend'),
  ('smartReportsSource.sales.monthToMonthComparison','smart_reports.sales_analysis','مقارنة شهر بشهر','Month-to-Month Comparison'),
  ('smartReportsSource.sales.yearOverYearComparison','smart_reports.sales_analysis','مقارنة سنة بسنة','Year-over-Year Comparison'),
  ('smartReportsSource.sales.monthlyVsYears','smart_reports.sales_analysis','{base} مقابل {current} شهريًا.','{base} vs {current} by month.'),
  ('smartReportsSource.sales.customTwoYearComparison','smart_reports.sales_analysis','مقارنة مخصصة بين سنتين','Custom Two-Year Comparison'),
  ('smartReportsSource.sales.activeComparison','smart_reports.sales_analysis','المقارنة النشطة: {base} ↔ {current}','Active Comparison: {base} ↔ {current}'),
  ('smartReportsSource.sales.period','smart_reports.sales_analysis','الفترة','Period'),
  ('smartReportsSource.sales.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.sales.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.sales.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.sales.growth','smart_reports.sales_analysis','النمو','Growth'),
  ('smartReportsSource.sales.quarter','smart_reports.sales_analysis','الربع','Quarter'),
  ('smartReportsSource.sales.quarterDetails','smart_reports.sales_analysis','تفاصيل الأرباع','Quarter Details'),
  ('smartReportsSource.sales.baseYear','smart_reports.sales_analysis','سنة الأساس','Base Year'),
  ('smartReportsSource.sales.comparisonYear','smart_reports.sales_analysis','سنة المقارنة','Comparison Year'),
  ('smartReportsSource.sales.year','smart_reports.sales_analysis','السنة','Year'),
  ('smartReportsSource.sales.vehicles','smart_reports.sales_analysis','السيارات','Vehicles'),
  ('smartReportsSource.sales.allYears','smart_reports.sales_analysis','كل السنوات','All Years'),
  ('smartReportsSource.sales.allVehicles','smart_reports.sales_analysis','كل السيارات','All Vehicles'),
  ('smartReportsSource.sales.salesIncludingVat','smart_reports.sales_analysis','المبيعات شاملة الضريبة','Sales Including VAT'),
  ('smartReportsSource.sales.salesBeforeVat','smart_reports.sales_analysis','المبيعات قبل الضريبة','Sales Before VAT'),
  ('smartReportsSource.sales.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.sales.includingVat','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.sales.beforeVat','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.sales.customComparison','smart_reports.sales_analysis','مقارنة مخصصة','Custom Comparison'),
  ('smartReportsSource.sales.quarters.q1','smart_reports.sales_analysis','يناير - مارس','January - March'),
  ('smartReportsSource.sales.quarters.q2','smart_reports.sales_analysis','أبريل - يونيو','April - June'),
  ('smartReportsSource.sales.quarters.q3','smart_reports.sales_analysis','يوليو - سبتمبر','July - September'),
  ('smartReportsSource.sales.quarters.q4','smart_reports.sales_analysis','أكتوبر - ديسمبر','October - December'),
  ('smartReportsSource.compare.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.compare.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.compare.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.metrics.gross','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.metrics.net','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.metrics.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.calendar.months.january','smart_reports.sales_analysis','يناير','January'),
  ('smartReportsSource.calendar.months.february','smart_reports.sales_analysis','فبراير','February'),
  ('smartReportsSource.calendar.months.march','smart_reports.sales_analysis','مارس','March'),
  ('smartReportsSource.calendar.months.april','smart_reports.sales_analysis','أبريل','April'),
  ('smartReportsSource.calendar.months.may','smart_reports.sales_analysis','مايو','May'),
  ('smartReportsSource.calendar.months.june','smart_reports.sales_analysis','يونيو','June'),
  ('smartReportsSource.calendar.months.july','smart_reports.sales_analysis','يوليو','July'),
  ('smartReportsSource.calendar.months.august','smart_reports.sales_analysis','أغسطس','August'),
  ('smartReportsSource.calendar.months.september','smart_reports.sales_analysis','سبتمبر','September'),
  ('smartReportsSource.calendar.months.october','smart_reports.sales_analysis','أكتوبر','October'),
  ('smartReportsSource.calendar.months.november','smart_reports.sales_analysis','نوفمبر','November'),
  ('smartReportsSource.calendar.months.december','smart_reports.sales_analysis','ديسمبر','December')
)
insert into public.localization_values(key_id,language_code,translated_text,status,version,created_at,updated_at)
select k.id,x.language_code,x.translated_text,'approved',1,now(),now()
from payload p
join public.localization_keys k on k.translation_key=p.translation_key
cross join lateral (values ('ar',p.ar_text),('en',p.en_text)) x(language_code,translated_text)
on conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=greatest(public.localization_values.version,1),updated_at=now();

with payload(translation_key,module,ar_text,en_text) as (
 values
  ('smartReportsSource.tabs.performanceSummary','smart_reports.sales_analysis','ملخص الأداء','Performance Summary'),
  ('smartReportsSource.tabs.salesAnalysis','smart_reports.sales_analysis','تحليل المبيعات','Sales Analysis'),
  ('smartReportsSource.tabs.vehicleAnalysis','smart_reports.sales_analysis','تحليل السيارات','Vehicle Analysis'),
  ('smartReportsSource.tabs.customerAnalysis','smart_reports.sales_analysis','تحليل العملاء','Customer Analysis'),
  ('smartReportsSource.tabs.serviceAnalysis','smart_reports.sales_analysis','تحليل الخدمات','Service Analysis'),
  ('smartReportsSource.tabs.advancedReports','smart_reports.sales_analysis','مركز التقارير المتقدمة','Advanced Reports Center'),
  ('smartReportsSource.tabs.forecasting','smart_reports.sales_analysis','التوقعات وذكاء الأعمال','Forecasting & Business Intelligence'),
  ('smartReportsSource.tabs.recommendations','smart_reports.sales_analysis','التوصيات','Recommendations'),
  ('smartReportsSource.sales.monthlySalesTrend','smart_reports.sales_analysis','اتجاه المبيعات الشهري','Monthly Sales Trend'),
  ('smartReportsSource.sales.monthToMonthComparison','smart_reports.sales_analysis','مقارنة شهر بشهر','Month-to-Month Comparison'),
  ('smartReportsSource.sales.yearOverYearComparison','smart_reports.sales_analysis','مقارنة سنة بسنة','Year-over-Year Comparison'),
  ('smartReportsSource.sales.monthlyVsYears','smart_reports.sales_analysis','{base} مقابل {current} شهريًا.','{base} vs {current} by month.'),
  ('smartReportsSource.sales.customTwoYearComparison','smart_reports.sales_analysis','مقارنة مخصصة بين سنتين','Custom Two-Year Comparison'),
  ('smartReportsSource.sales.activeComparison','smart_reports.sales_analysis','المقارنة النشطة: {base} ↔ {current}','Active Comparison: {base} ↔ {current}'),
  ('smartReportsSource.sales.period','smart_reports.sales_analysis','الفترة','Period'),
  ('smartReportsSource.sales.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.sales.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.sales.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.sales.growth','smart_reports.sales_analysis','النمو','Growth'),
  ('smartReportsSource.sales.quarter','smart_reports.sales_analysis','الربع','Quarter'),
  ('smartReportsSource.sales.quarterDetails','smart_reports.sales_analysis','تفاصيل الأرباع','Quarter Details'),
  ('smartReportsSource.sales.baseYear','smart_reports.sales_analysis','سنة الأساس','Base Year'),
  ('smartReportsSource.sales.comparisonYear','smart_reports.sales_analysis','سنة المقارنة','Comparison Year'),
  ('smartReportsSource.sales.year','smart_reports.sales_analysis','السنة','Year'),
  ('smartReportsSource.sales.vehicles','smart_reports.sales_analysis','السيارات','Vehicles'),
  ('smartReportsSource.sales.allYears','smart_reports.sales_analysis','كل السنوات','All Years'),
  ('smartReportsSource.sales.allVehicles','smart_reports.sales_analysis','كل السيارات','All Vehicles'),
  ('smartReportsSource.sales.salesIncludingVat','smart_reports.sales_analysis','المبيعات شاملة الضريبة','Sales Including VAT'),
  ('smartReportsSource.sales.salesBeforeVat','smart_reports.sales_analysis','المبيعات قبل الضريبة','Sales Before VAT'),
  ('smartReportsSource.sales.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.sales.includingVat','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.sales.beforeVat','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.sales.customComparison','smart_reports.sales_analysis','مقارنة مخصصة','Custom Comparison'),
  ('smartReportsSource.sales.quarters.q1','smart_reports.sales_analysis','يناير - مارس','January - March'),
  ('smartReportsSource.sales.quarters.q2','smart_reports.sales_analysis','أبريل - يونيو','April - June'),
  ('smartReportsSource.sales.quarters.q3','smart_reports.sales_analysis','يوليو - سبتمبر','July - September'),
  ('smartReportsSource.sales.quarters.q4','smart_reports.sales_analysis','أكتوبر - ديسمبر','October - December'),
  ('smartReportsSource.compare.current','smart_reports.sales_analysis','الحالي','Current'),
  ('smartReportsSource.compare.previous','smart_reports.sales_analysis','السابق','Previous'),
  ('smartReportsSource.compare.difference','smart_reports.sales_analysis','الفرق','Difference'),
  ('smartReportsSource.metrics.gross','smart_reports.sales_analysis','شامل الضريبة','VAT Included'),
  ('smartReportsSource.metrics.net','smart_reports.sales_analysis','قبل الضريبة','Before VAT'),
  ('smartReportsSource.metrics.vat','smart_reports.sales_analysis','الضريبة','VAT'),
  ('smartReportsSource.calendar.months.january','smart_reports.sales_analysis','يناير','January'),
  ('smartReportsSource.calendar.months.february','smart_reports.sales_analysis','فبراير','February'),
  ('smartReportsSource.calendar.months.march','smart_reports.sales_analysis','مارس','March'),
  ('smartReportsSource.calendar.months.april','smart_reports.sales_analysis','أبريل','April'),
  ('smartReportsSource.calendar.months.may','smart_reports.sales_analysis','مايو','May'),
  ('smartReportsSource.calendar.months.june','smart_reports.sales_analysis','يونيو','June'),
  ('smartReportsSource.calendar.months.july','smart_reports.sales_analysis','يوليو','July'),
  ('smartReportsSource.calendar.months.august','smart_reports.sales_analysis','أغسطس','August'),
  ('smartReportsSource.calendar.months.september','smart_reports.sales_analysis','سبتمبر','September'),
  ('smartReportsSource.calendar.months.october','smart_reports.sales_analysis','أكتوبر','October'),
  ('smartReportsSource.calendar.months.november','smart_reports.sales_analysis','نوفمبر','November'),
  ('smartReportsSource.calendar.months.december','smart_reports.sales_analysis','ديسمبر','December')
), dedup as (
 select distinct on (ar_text,module) translation_key,module,ar_text from payload order by ar_text,module,translation_key
)
insert into public.localization_queue(translation_key,source_text,source_language,target_language,module,status,occurrence_count,first_seen_at,last_seen_at)
select translation_key,ar_text,'ar','fil',module,'pending',1,now(),now() from dedup
on conflict (source_text,source_language,target_language,module) do update set translation_key=excluded.translation_key,last_seen_at=now();

commit;

select
 count(*) filter (where v.language_code='ar' and v.status='approved') as arabic_approved,
 count(*) filter (where v.language_code='en' and v.status='approved') as english_approved,
 count(*) filter (where v.language_code='fil' and v.status='approved') as filipino_approved,
 (select count(*) from public.localization_queue q where q.module='smart_reports.sales_analysis' and q.target_language='fil' and q.status='pending') as filipino_pending
from public.localization_values v
join public.localization_keys k on k.id=v.key_id
where k.module='smart_reports.sales_analysis';
