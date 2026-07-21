# PETATOE — Operations Services Supabase Root Cause Report

## Confirmed database state
- `public.operations_master_data` contains three rows.
- Two newest rows have `data.services = NULL` / service count `0`.
- One older row contains `92` services.
- RLS is enabled, but the active `ALL` policy allows reads and writes.

## Root cause
`operations/operations-storage.js` treated `operations_master_data` as a replace-all table:
1. Every write deleted all rows.
2. It then inserted a new row with a random UUID.
3. Reads selected only the newest row by timestamp.

Concurrent or early startup writes could therefore create multiple rows, including empty rows. The mobile session then selected the newest empty row while the desktop session continued showing its in-memory cache containing the 92 services.

## Fix
- Introduce one deterministic canonical UUID for operations master data.
- Replace delete-and-insert with `upsert` on that UUID.
- Read up to 50 legacy rows and choose the most complete data row, prioritizing actual services and other reference-data collections.
- Automatically migrate the selected row into the canonical record and remove legacy duplicates.
- Protect a populated Supabase record from an empty/default write issued before remote boot finishes.

## Scope
Only `operations/operations-storage.js` was changed. No UI, reporting, payroll, permissions, localization, appointment logic, or mobile layout code was modified.
