-- PETATOE v10 — Commissions Phase 1B.2
-- Atomic replacement for all rows belonging to one sales invoice.
-- Run once in Supabase SQL Editor before deploying the matching JavaScript files.

create or replace function public.petatoe_replace_sales_invoice(
  p_old_invoice_no text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old_invoice_no text := btrim(coalesce(p_old_invoice_no, ''));
  v_inserted integer := 0;
  v_deleted integer := 0;
begin
  if v_old_invoice_no = '' then
    raise exception 'Original invoice number is required';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'Replacement invoice rows are required';
  end if;

  -- The function runs as one PostgreSQL transaction. Any insert failure rolls
  -- back this delete automatically, preserving the original invoice in full.
  delete from public.sales_records
  where invoice_no = v_old_invoice_no;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Original invoice % was not found', v_old_invoice_no;
  end if;

  insert into public.sales_records (
    legacy_id,
    invoice_no,
    invoice_date,
    client_name,
    item_name,
    vehicle_name,
    payment_method,
    qty,
    price,
    discount,
    tax,
    total_ex,
    total_inc,
    invoice_type,
    legacy_payload
  )
  select
    nullif(x.legacy_id, ''),
    nullif(x.invoice_no, ''),
    nullif(x.invoice_date, '')::date,
    coalesce(x.client_name, ''),
    coalesce(x.item_name, ''),
    coalesce(x.vehicle_name, ''),
    coalesce(x.payment_method, ''),
    coalesce(x.qty, 0),
    coalesce(x.price, 0),
    coalesce(x.discount, 0),
    coalesce(x.tax, 0),
    coalesce(x.total_ex, 0),
    coalesce(x.total_inc, 0),
    coalesce(nullif(x.invoice_type, ''), 'TAX'),
    coalesce(x.legacy_payload, '{}'::jsonb)
  from jsonb_to_recordset(p_rows) as x(
    legacy_id text,
    invoice_no text,
    invoice_date text,
    client_name text,
    item_name text,
    vehicle_name text,
    payment_method text,
    qty numeric,
    price numeric,
    discount numeric,
    tax numeric,
    total_ex numeric,
    total_inc numeric,
    invoice_type text,
    legacy_payload jsonb
  );

  get diagnostics v_inserted = row_count;

  if v_inserted <> jsonb_array_length(p_rows) then
    raise exception 'Invoice replacement row count mismatch: expected %, inserted %', jsonb_array_length(p_rows), v_inserted;
  end if;

  return jsonb_build_object(
    'ok', true,
    'old_invoice_no', v_old_invoice_no,
    'deleted_rows', v_deleted,
    'inserted_rows', v_inserted
  );
end;
$$;

revoke all on function public.petatoe_replace_sales_invoice(text, jsonb) from public;
grant execute on function public.petatoe_replace_sales_invoice(text, jsonb) to anon, authenticated, service_role;
