-- PETATOE v9 Smart Reports Localization Audit - Screen 1: Performance Summary
-- Direct, idempotent import into Enterprise Localization Center.

begin;

with payload(translation_key,module,ar_text,en_text) as (
  values
  ('smartReportsSource.tabs.overview','smart_reports.performance_summary','ملخص الأداء','Performance Summary'),
  ('smartReportsSource.tabs.sales','smart_reports.performance_summary','تحليل المبيعات','Sales Analysis'),
  ('smartReportsSource.tabs.vehicles','smart_reports.performance_summary','تحليل السيارات','Vehicle Analysis'),
  ('smartReportsSource.tabs.customers','smart_reports.performance_summary','تحليل العملاء','Customer Analysis'),
  ('smartReportsSource.tabs.services','smart_reports.performance_summary','تحليل الخدمات','Service Analysis'),
  ('smartReportsSource.tabs.advanced','smart_reports.performance_summary','مركز التقارير المتقدمة','Advanced Reports Center'),
  ('smartReportsSource.tabs.forecast','smart_reports.performance_summary','التوقعات وذكاء الأعمال','Forecasting & Business Intelligence'),
  ('smartReportsSource.tabs.recommendations','smart_reports.performance_summary','التوصيات','Recommendations'),
  ('smartReportsSource.overview.totalSales','smart_reports.performance_summary','إجمالي المبيعات','Total Sales'),
  ('smartReportsSource.overview.invoiceCount','smart_reports.performance_summary','عدد الفواتير','Invoice Count'),
  ('smartReportsSource.overview.customerRetention','smart_reports.performance_summary','معدل الاحتفاظ بالعملاء','Customer Retention Rate'),
  ('smartReportsSource.overview.averageInvoice','smart_reports.performance_summary','متوسط الفاتورة','Average Invoice'),
  ('smartReportsSource.overview.topVehicle','smart_reports.performance_summary','أكفأ سيارة','Top Vehicle'),
  ('smartReportsSource.overview.bestService','smart_reports.performance_summary','أفضل خدمة','Best Service'),
  ('smartReportsSource.overview.details.totalSales','smart_reports.performance_summary','تفاصيل إجمالي المبيعات','Total Sales Details'),
  ('smartReportsSource.overview.details.invoiceCount','smart_reports.performance_summary','تفاصيل عدد الفواتير','Invoice Count Details'),
  ('smartReportsSource.overview.details.customerRetention','smart_reports.performance_summary','تفاصيل معدل الاحتفاظ بالعملاء','Customer Retention Details'),
  ('smartReportsSource.overview.details.averageInvoice','smart_reports.performance_summary','تفاصيل متوسط الفاتورة','Average Invoice Details'),
  ('smartReportsSource.overview.details.topVehicle','smart_reports.performance_summary','تفاصيل أكفأ سيارة','Top Vehicle Details'),
  ('smartReportsSource.overview.details.bestService','smart_reports.performance_summary','تفاصيل أفضل خدمة','Best Service Details'),
  ('smartReportsSource.overview.desc.totalSales','smart_reports.performance_summary','يعرض إجمالي قيمة المبيعات للفترة أو السنة المحددة داخل التقارير الذكية.','Shows total sales value for the selected period or year in Smart Reports.'),
  ('smartReportsSource.overview.desc.invoiceCount','smart_reports.performance_summary','يوضح عدد الفواتير الفريدة مقارنة بعدد العمليات الفعلية المسجلة في البيانات.','Shows the number of unique invoices compared with the actual recorded operations.'),
  ('smartReportsSource.overview.desc.customerRetention','smart_reports.performance_summary','يقيس نسبة العملاء المتكررين من إجمالي العملاء خلال الفترة المختارة.','Measures repeat customers as a percentage of all customers in the selected period.'),
  ('smartReportsSource.overview.desc.averageInvoice','smart_reports.performance_summary','يعرض متوسط قيمة الفاتورة مع متوسط الإيراد اليومي حسب البيانات الحالية.','Shows average invoice value together with average daily revenue for the current data.'),
  ('smartReportsSource.overview.desc.topVehicle','smart_reports.performance_summary','ترتيب السيارة حسب متوسط الإيراد لكل عملية خلال الفترة المختارة.','Ranks vehicles by average revenue per operation in the selected period.'),
  ('smartReportsSource.overview.desc.bestService','smart_reports.performance_summary','الخدمة الأعلى تحقيقًا للمبيعات في الفترة المختارة من واقع البيانات المرفوعة.','The service with the highest sales value in the selected period based on uploaded data.'),
  ('smartReportsSource.overview.period','smart_reports.performance_summary','الفترة','Period'),
  ('smartReportsSource.overview.operationsCount','smart_reports.performance_summary','عدد العمليات','Operations Count'),
  ('smartReportsSource.overview.dataRange','smart_reports.performance_summary','نطاق البيانات','Data Range'),
  ('smartReportsSource.overview.repeatCustomers','smart_reports.performance_summary','عملاء متكررون','Repeat Customers'),
  ('smartReportsSource.overview.oneTimeCustomers','smart_reports.performance_summary','عملاء مرة واحدة','One-Time Customers'),
  ('smartReportsSource.overview.totalCustomers','smart_reports.performance_summary','إجمالي العملاء','Total Customers'),
  ('smartReportsSource.overview.dailyAverage','smart_reports.performance_summary','متوسط يومي','Daily Average'),
  ('smartReportsSource.overview.operatingDays','smart_reports.performance_summary','أيام التشغيل','Operating Days'),
  ('smartReportsSource.overview.vehicle','smart_reports.performance_summary','السيارة','Vehicle'),
  ('smartReportsSource.overview.revenue','smart_reports.performance_summary','الإيراد','Revenue'),
  ('smartReportsSource.overview.operations','smart_reports.performance_summary','العمليات','Operations'),
  ('smartReportsSource.overview.averageTransaction','smart_reports.performance_summary','متوسط العملية','Average Transaction'),
  ('smartReportsSource.overview.service','smart_reports.performance_summary','الخدمة','Service'),
  ('smartReportsSource.overview.topFiveServicesShare','smart_reports.performance_summary','مساهمة أعلى 5 خدمات','Top 5 Services Share'),
  ('smartReportsSource.overview.operationUnit','smart_reports.performance_summary','عملية','operation'),
  ('smartReportsSource.overview.repeatCustomerUnit','smart_reports.performance_summary','عميل متكرر','repeat customers'),
  ('smartReportsSource.vehicleEfficiency.title','smart_reports.performance_summary','تحليل كفاءة السيارات','Vehicle Efficiency Analysis'),
  ('smartReportsSource.vehicleEfficiency.vehicle','smart_reports.performance_summary','السيارة','Vehicle'),
  ('smartReportsSource.vehicleEfficiency.operationsCount','smart_reports.performance_summary','عدد العمليات','Operations Count'),
  ('smartReportsSource.vehicleEfficiency.revenue','smart_reports.performance_summary','الإيراد','Revenue'),
  ('smartReportsSource.vehicleEfficiency.averageTransaction','smart_reports.performance_summary','متوسط العملية','Average Transaction'),
  ('smartReportsSource.vehicleEfficiency.contribution','smart_reports.performance_summary','المساهمة','Contribution'),
  ('smartReportsSource.vehicleEfficiency.total','smart_reports.performance_summary','الإجمالي','Total'),
  ('smartReportsSource.vehicleEfficiency.noData','smart_reports.performance_summary','لا توجد بيانات مطابقة لفلاتر تحليل كفاءة السيارات.','No data matches the Vehicle Efficiency Analysis filters.'),
  ('smartReportsSource.vehicleEfficiency.reset','smart_reports.performance_summary','إعادة تعيين','Reset'),
  ('smartReportsSource.vehicleEfficiency.allYears','smart_reports.performance_summary','كل السنوات','All Years'),
  ('smartReportsSource.vehicleEfficiency.allMonths','smart_reports.performance_summary','كل الشهور','All Months'),
  ('smartReportsSource.vehicleEfficiency.allVehicles','smart_reports.performance_summary','كل السيارات','All Vehicles'),
  ('smartReportsSource.vehicleEfficiency.allPayments','smart_reports.performance_summary','كل طرق الدفع','All Payment Methods')
), upsert_keys as (
  insert into public.localization_keys(translation_key,module,source_text,description,is_system,is_active,updated_at)
  select translation_key,module,ar_text,'Smart Reports Performance Summary UI',true,true,now() from payload
  on conflict (translation_key) do update set module=excluded.module,source_text=excluded.source_text,is_active=true,updated_at=now()
  returning id,translation_key
)
insert into public.localization_values(key_id,language_code,translated_text,status,version,approved_at,updated_at)
select k.id,v.language_code,v.translated_text,'approved',1,now(),now()
from payload p
join public.localization_keys k on k.translation_key=p.translation_key
cross join lateral (values ('ar',p.ar_text),('en',p.en_text)) v(language_code,translated_text)
on conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=public.localization_values.version+1,approved_at=now(),updated_at=now();

insert into public.localization_queue(translation_key,source_language,source_text,target_language,module,status,last_seen_at)
select p.translation_key,'ar',p.ar_text,'fil',p.module,'pending',now()
from payload p
where not exists (
  select 1 from public.localization_values lv join public.localization_keys lk on lk.id=lv.key_id
  where lk.translation_key=p.translation_key and lv.language_code='fil' and lv.status='approved'
)
on conflict (source_text,source_language,target_language,module) do update set translation_key=excluded.translation_key,last_seen_at=now();

commit;

select
  count(*) filter (where v.language_code='ar' and v.status='approved') as arabic_approved,
  count(*) filter (where v.language_code='en' and v.status='approved') as english_approved
from public.localization_values v
join public.localization_keys k on k.id=v.key_id
where k.module='smart_reports.performance_summary';
