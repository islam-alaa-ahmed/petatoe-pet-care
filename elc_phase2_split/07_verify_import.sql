-- PETATOE v9 ELC Phase 2 - Final Verification
select
  (select count(*) from public.localization_keys where is_active=true) as localization_keys_total,
  (select count(*) from public.localization_values where language_code='ar' and status='approved') as arabic_approved,
  (select count(*) from public.localization_values where language_code='en' and status='approved') as english_approved,
  (select count(*) from public.localization_queue where target_language='en' and status='pending') as english_pending_queue,
  (select count(*) from public.localization_queue where target_language='fil' and status='pending') as filipino_pending_queue;
