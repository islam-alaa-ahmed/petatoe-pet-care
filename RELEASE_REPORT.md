# PETATOE v9.4.22 — Supabase Localization Dictionary Parity

## Root Cause
The Localization Center dashboard counted raw database records from three different scopes:
- `localization_keys`: active key rows.
- `localization_values`: every approved row, including values associated with inactive keys or disabled languages.
- `localization_queue`: every pending discovery, including items already covered by an approved value.

The runtime production dictionary contains 3,427 Arabic keys and 3,427 English keys, while the screenshot showed only 1,484 database keys. Therefore the Localization Center was not representing the dictionary actually used by the application.

## Changes
- Generated an idempotent Supabase migration from the current production dictionary.
- Upserts all 3,427 active keys.
- Upserts and approves 3,427 Arabic and 3,427 English values.
- Deletes stale pending queue items already covered by approved translations.
- Replaces the dashboard RPC so all counts use active keys and enabled languages only.
- Pending Queue now means unresolved pending items only.
- Localization Center now compares Supabase counts against the in-browser production dictionary and visibly reports parity or mismatch.
- Language cards show both Supabase and Runtime counts.

## Expected result after running the SQL migration
- Active keys: 3,427
- Approved Arabic: 3,427
- Approved English: 3,427
- Approved translations for the two enabled languages: 6,854
- Pending Queue: only genuinely unresolved discoveries

## Required deployment step
Run `petatoe_v9_4_22_supabase_localization_dictionary_parity_sync.sql` once in the Supabase SQL Editor, then refresh the application and press Refresh inside Localization Center.

The project files alone cannot prove that the remote database was changed. The new dashboard verifies the remote result after the SQL is executed and displays a warning when Supabase does not match the runtime dictionary.
