-- PETATOE v10 — Commissions Phase 1B.5
-- Atomic full replacement of sales_records for Excel Replace Import.
-- Run once in Supabase SQL Editor before deploying the matching JavaScript file.

create or replace function public.petatoe_replace_all_sales_records(
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected integer := 0;
  v_deleted integer := 0;
  v_inserted integer := 0;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Replacement sales rows must be a JSON array';
  end if;

  v_expected := jsonb_array_length(p_rows);
  if v_expected = 0 then
    raise exception 'Replacement sales rows cannot be empty';
  end if;

  -- PostgreSQL executes this function in one transaction. Any validation,
  -- cast, constraint, RLS, or insert error rolls back the delete automatically.
  delete from public.sales_records;
  get diagnostics v_deleted = row_count;

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

  if v_inserted <> v_expected then
    raise exception 'Sales replacement row count mismatch: expected %, inserted %', v_expected, v_inserted;
  end if;

  return jsonb_build_object(
    'ok', true,
    'deleted_rows', v_deleted,
    'inserted_rows', v_inserted
  );
end;
$$;

revoke all on function public.petatoe_replace_all_sales_records(jsonb) from public;
grant execute on function public.petatoe_replace_all_sales_records(jsonb) to anon, authenticated, service_role;
