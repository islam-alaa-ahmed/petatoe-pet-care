-- PETATOE v10.0.25 E5.2.9 — Customer Excel staged import localization
begin;
create temporary table petatoe_e529_localization(translation_key text primary key,module text,ar_text text,en_text text) on commit drop;
insert into petatoe_e529_localization values
('operationsCustomer.import.title','operationsCustomer','مراجعة رفع العملاء','Customer Import Review'),
('operationsCustomer.import.waiting','operationsCustomer','في انتظار اختيار ملف','Waiting for a file'),
('operationsCustomer.import.readingFile','operationsCustomer','جارٍ قراءة ملف العملاء','Reading customer file'),
('operationsCustomer.import.parsingFile','operationsCustomer','جارٍ تحليل ملف العملاء','Parsing customer file'),
('operationsCustomer.import.validatingRows','operationsCustomer','جارٍ التحقق من {count} صف','Validating {count} rows'),
('operationsCustomer.import.readyForApproval','operationsCustomer','اكتملت المراجعة. اضغط موافقة لحفظ البيانات في Supabase','Review complete. Approve to save the data to Supabase'),
('operationsCustomer.import.reviewSummary','operationsCustomer','الإجمالي: {total} | جديد: {created} | تحديث: {updated} | بدون تغيير: {unchanged}','Total: {total} | New: {created} | Updated: {updated} | Unchanged: {unchanged}'),
('operationsCustomer.import.approveSave','operationsCustomer','موافقة وحفظ في Supabase','Approve and Save to Supabase'),
('operationsCustomer.import.cancel','operationsCustomer','إلغاء','Cancel'),
('operationsCustomer.import.preparingSave','operationsCustomer','جارٍ تجهيز البيانات للحفظ','Preparing data for save'),
('operationsCustomer.import.savingToSupabase','operationsCustomer','جارٍ حفظ العملاء في Supabase','Saving customers to Supabase'),
('operationsCustomer.import.savedToSupabase','operationsCustomer','تم حفظ {count} عميل في Supabase','Saved {count} customers to Supabase'),
('operationsCustomer.import.savedToast','operationsCustomer','تم حفظ العملاء في Supabase','Customers saved to Supabase'),
('operationsCustomer.import.saveFailed','operationsCustomer','تعذر حفظ العملاء في Supabase. راجع الاتصال والصلاحيات','Could not save customers to Supabase. Check connection and permissions'),
('operationsCustomer.import.supabaseUnavailable','operationsCustomer','مسار الحفظ المؤكد في Supabase غير متاح','Confirmed Supabase save is unavailable'),
('operationsCustomer.import.noValidRows','operationsCustomer','لم يتم العثور على صفوف عملاء صالحة','No valid customer rows found'),
('operationsCustomer.import.excelUnavailable','operationsCustomer','مكتبة Excel غير متاحة','Excel library is unavailable'),
('operationsCustomer.import.readFailed','operationsCustomer','تعذر قراءة ملف العملاء','Could not read the customer file');
insert into public.localization_keys(translation_key,module,source_text,description,is_system,is_active,updated_at)
select translation_key,module,ar_text,'PETATOE E5.2.9 customer import workflow',true,true,now() from petatoe_e529_localization
on conflict (translation_key) do update set module=excluded.module,source_text=excluded.source_text,is_active=true,updated_at=now();
insert into public.localization_values(key_id,language_code,translated_text,status,version,approved_at,updated_at)
select k.id,'ar',s.ar_text,'approved',coalesce(v.version,0)+1,now(),now()
from petatoe_e529_localization s join public.localization_keys k using(translation_key)
left join public.localization_values v on v.key_id=k.id and v.language_code='ar'
on conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=case when public.localization_values.translated_text is distinct from excluded.translated_text then public.localization_values.version+1 else public.localization_values.version end,approved_at=now(),updated_at=now();
insert into public.localization_values(key_id,language_code,translated_text,status,version,approved_at,updated_at)
select k.id,'en',s.en_text,'approved',coalesce(v.version,0)+1,now(),now()
from petatoe_e529_localization s join public.localization_keys k using(translation_key)
left join public.localization_values v on v.key_id=k.id and v.language_code='en'
on conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=case when public.localization_values.translated_text is distinct from excluded.translated_text then public.localization_values.version+1 else public.localization_values.version end,approved_at=now(),updated_at=now();
commit;
